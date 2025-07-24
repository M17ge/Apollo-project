// Database Utilities for Foreign Key Management
// This module provides utility functions for managing relationships between collections

import { getFirestore, doc, getDoc, getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Get Firestore instance (should be initialized in the calling file)
let db;

export function initializeDatabase(firestoreInstance) {
    db = firestoreInstance;
}

// Foreign Key Validation Functions
export async function validateForeignKey(collectionName, documentId) {
    if (!documentId) return { valid: false, exists: false };
    
    try {
        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);
        return { valid: true, exists: docSnap.exists(), data: docSnap.exists() ? docSnap.data() : null };
    } catch (error) {
        console.error(`Error validating foreign key in ${collectionName}:`, error);
        return { valid: false, exists: false, error: error.message };
    }
}

// Get referenced document data
export async function getReferencedData(collectionName, documentId) {
    if (!documentId) return null;
    
    try {
        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: documentId, ...docSnap.data() } : null;
    } catch (error) {
        console.error(`Error getting referenced data from ${collectionName}:`, error);
        return null;
    }
}

// Find documents that reference a specific document
export async function findReferencingDocuments(collectionName, fieldName, referencedId) {
    if (!referencedId) return [];
    
    try {
        const q = query(collection(db, collectionName), where(fieldName, "==", referencedId));
        const querySnapshot = await getDocs(q);
        const referencingDocs = [];
        
        querySnapshot.forEach((doc) => {
            referencingDocs.push({ id: doc.id, ...doc.data() });
        });
        
        return referencingDocs;
    } catch (error) {
        console.error(`Error finding referencing documents in ${collectionName}:`, error);
        return [];
    }
}

// Populate dropdown with referenced data
export async function populateReferenceDropdown(dropdownId, collectionName, valueField = 'id', textField = 'name') {
    try {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;
        
        // Clear existing options except the first (placeholder)
        while (dropdown.options.length > 1) {
            dropdown.remove(1);
        }
        
        const querySnapshot = await getDocs(collection(db, collectionName));
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = valueField === 'id' ? doc.id : data[valueField];
            
            // Build display text
            let displayText = '';
            if (textField === 'id') {
                displayText = doc.id;
            } else if (typeof textField === 'function') {
                displayText = textField(data, doc.id);
            } else {
                displayText = data[textField] || doc.id;
            }
            
            option.textContent = displayText;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error(`Error populating dropdown ${dropdownId}:`, error);
    }
}

// Database Schema Definition - Define your foreign key relationships here
export const SCHEMA = {
    // Products reference inventory
    products: {
        inventory_id: { collection: 'inventory', required: false }
    },
    
    // Orders reference users and can have multiple products
    order: {
        farmer_id: { collection: 'users', required: true },
        dispatch_manager_id: { collection: 'users', required: false }
    },
    
    // Payments reference orders and inventory
    payments: {
        inventory_id: { collection: 'inventory', required: false },
        order_id: { collection: 'order', required: false },
        approval_manager: { collection: 'users', required: true }
    },
    
    // Dispatch references orders, bookings, and users
    dispatch: {
        driver_id: { collection: 'users', required: true },
        manager_id: { collection: 'users', required: true },
        booking_id: { collection: 'bookings', required: false },
        order_id: { collection: 'order', required: false }
    },
    
    // Bookings reference users and certifications
    bookings: {
        farmer_id: { collection: 'users', required: true },
        trainer_id: { collection: 'users', required: true },
        certification_id: { collection: 'certifications', required: false }
    },
    
    // Inventory references suppliers and users
    inventory: {
        supplier_id: { collection: 'supplier', required: true },
        manager_id: { collection: 'users', required: true }
    }
};

// Validate all foreign keys for a document before saving
export async function validateDocumentReferences(collectionName, documentData) {
    const schema = SCHEMA[collectionName];
    if (!schema) return { valid: true, errors: [] };
    
    const errors = [];
    const validatedData = { ...documentData };
    
    for (const [fieldName, config] of Object.entries(schema)) {
        const fieldValue = documentData[fieldName];
        
        if (config.required && !fieldValue) {
            errors.push(`${fieldName} is required`);
            continue;
        }
        
        if (fieldValue) {
            const validation = await validateForeignKey(config.collection, fieldValue);
            if (!validation.exists) {
                errors.push(`Invalid ${fieldName}: Referenced document does not exist in ${config.collection}`);
            } else if (validation.data) {
                // Add reference metadata for better debugging
                validatedData[`${fieldName}_ref`] = {
                    collection: config.collection,
                    validated_at: new Date().toISOString(),
                    exists: true
                };
            }
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
        validatedData
    };
}

// Get display information for foreign key references
export async function enrichDocumentWithReferences(collectionName, documentData) {
    const schema = SCHEMA[collectionName];
    if (!schema) return documentData;
    
    const enrichedData = { ...documentData };
    
    for (const [fieldName, config] of Object.entries(schema)) {
        const fieldValue = documentData[fieldName];
        if (fieldValue) {
            const referencedData = await getReferencedData(config.collection, fieldValue);
            if (referencedData) {
                enrichedData[`${fieldName}_data`] = referencedData;
            }
        }
    }
    
    return enrichedData;
}

// Check for orphaned references when deleting a document
export async function checkForOrphanedReferences(collectionName, documentId) {
    const orphanedRefs = [];
    
    // Check all collections that might reference this document
    for (const [col, schema] of Object.entries(SCHEMA)) {
        for (const [fieldName, config] of Object.entries(schema)) {
            if (config.collection === collectionName) {
                const referencingDocs = await findReferencingDocuments(col, fieldName, documentId);
                if (referencingDocs.length > 0) {
                    orphanedRefs.push({
                        collection: col,
                        field: fieldName,
                        documents: referencingDocs,
                        count: referencingDocs.length
                    });
                }
            }
        }
    }
    
    return orphanedRefs;
}

// Generate reference-aware display names for dropdowns
export const DISPLAY_FORMATTERS = {
    users: (data, id) => `${data.F_Name || data.displayName || 'Unknown'} (${data.Role || 'User'})`,
    farmers: (data, id) => `${data.F_Name || 'Unknown Farmer'} - ${data.County || 'Unknown County'}`,
    supplier: (data, id) => `${data.supplierName || 'Unknown Supplier'} - $${data.price || 'N/A'}`,
    inventory: (data, id) => `${data.Description || 'Unknown Item'} - ${data.Total_Price ? '$' + data.Total_Price : 'No Price'}`,
    order: (data, id) => `Order ${id.substring(0, 8)} - ${data.order_status || 'Unknown Status'}`,
    products: (data, id) => `${data.name || 'Unknown Product'} - ${data.category || 'No Category'}`
};
