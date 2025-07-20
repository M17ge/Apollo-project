import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
// Import logging functions
import { logCreate, logUpdate, logDelete, logActivity, logError } from './logging.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA2asaFAVw0PSlJFbyuPbOd3Zao-yqSS4g",
    authDomain: "apollo-mobile-7013d.firebaseapp.com",
    projectId: "apollo-mobile-7013d",
    storageBucket: "apollo-mobile-7013d.firebasestorage.app",
    messagingSenderId: "1044454240066",
    appId: "1:1044454240066:web:77e3984fb8fdfe6d2ea2db",
    measurementId: "G-FCKNKS0L5Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Store user ID for use in forms
            const currentUserId = user.uid;
            
            // Check if managerID field exists before setting value
            const managerIDField = document.getElementById('managerID');
            if (managerIDField) {
                managerIDField.value = currentUserId;
            }
            
            // Make user ID available globally for form submissions
            window.currentUserId = currentUserId;
            
            initializeForms();
        } else {
            window.location.href = "login.html";
        }
    });
});

// Log database activity
async function logDatabaseActivity(action, collection, documentId, data) {
    try {
        const timestamp = new Date();
        const logData = {
            userId: auth.currentUser?.uid || 'unknown',
            action: action,
            timestamp: timestamp,
            documentId: documentId,
            collection: collection,
            data: data,
            authorizedBy: auth.currentUser?.uid || 'unknown',
            editedBy: auth.currentUser?.email || 'unknown'
        };
        await addDoc(collection(db, "Reports"), logData);
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error logging activity: ", error.code || '', msg);
        alert(`An error occurred while logging activity: ${msg}`);
    }
}

function initializeForms() {
    // Set current date as default for supplier form
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateSupplied').value = today;

    // Inventory form submission
    document.getElementById('inventoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const description = document.getElementById('description').value;
        const totalPrice = parseFloat(document.getElementById('totalPrice').value);
        const productsText = document.getElementById('products').value;
        
        // Convert products text to array (comma separated values)
        const products = productsText.split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);
        
        const supplier_id = document.getElementById('supplier').value;
        const inventoryId = document.getElementById('inventoryId').value;
        
        try {
            // Create inventory object with the fields matching Firestore schema
            const inventoryData = {
                Description: description,
                Time_of_Arrival: serverTimestamp(),
                Total_Price: totalPrice,
                products: products,
                supplier_id: supplier_id,
                manager_id: document.getElementById('managerID')?.value || window.currentUserId || auth.currentUser?.uid || 'unknown'
            };
            
            let docRef;
            
            // Check if we're updating an existing document
            if (inventoryId) {
                // Get the old data for logging
                const docSnap = await getDoc(doc(db, "inventory", inventoryId));
                const oldData = docSnap.exists() ? docSnap.data() : null;
                
                // Update existing document
                await updateDoc(doc(db, "inventory", inventoryId), inventoryData);
                
                // Log the update with our new logging module
                await logUpdate('inventory', inventoryId, inventoryData, oldData);
                
                alert("Inventory updated successfully!");
                // Reset form state for new submissions
                document.getElementById('submitInventory').textContent = 'Add Inventory';
                docRef = { id: inventoryId };
            } else {
                // Add a new document
                docRef = await addDoc(collection(db, "inventory"), inventoryData);
                
                // Log the creation with our new logging module
                await logCreate('inventory', docRef.id, inventoryData);
                alert("Inventory added successfully!");
            }
            
            // Reset form
            document.getElementById('inventoryForm').reset();
            
            // Update the inventory table
            fetchInventoryData();
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error adding inventory: ", error.code || '', msg);
            alert(`An error occurred while adding inventory: ${msg}`);
        }
    });

    // Supplier form submission
    document.getElementById('supplierForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const information = document.getElementById('information').value;
        const dateSupplied = document.getElementById('dateSupplied').value;
        const supplierId = document.getElementById('supplierId').value;
        
        try {
            // Create the farmer/supplier data object
            const supplierData = {
                name,
                information,
                dateRegistered: dateSupplied,
                role: 'supplier', // Adding a role to identify this as a supplier in the farmers collection
                updatedAt: serverTimestamp()
            };
            
            let docRef;
            
            // Check if we're updating an existing supplier
            if (supplierId) {
                // Get the old data for logging
                const docSnap = await getDoc(doc(db, "farmers", supplierId));
                const oldData = docSnap.exists() ? docSnap.data() : null;
                
                // Update existing supplier
                await updateDoc(doc(db, "farmers", supplierId), supplierData);
                
                // Log the update with our new logging module
                await logUpdate('farmers', supplierId, supplierData, oldData);
                
                alert("Supplier updated successfully!");
                // Reset form state for new submissions
                document.getElementById('submitSupplier').textContent = 'Add Supplier';
                docRef = { id: supplierId };
            } else {
                // Add a new supplier
                docRef = await addDoc(collection(db, "farmers"), supplierData);
                
                // Log the creation with our new logging module
                await logCreate('farmers', docRef.id, supplierData);
                alert("Supplier added successfully!");
            }
            
            // Reset form
            document.getElementById('supplierForm').reset();
            document.getElementById('supplierId').value = '';
            
            // Set current date as default
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('dateSupplied').value = today;
            
            // Refresh supplier data in dropdown and table
            fetchSupplierData();
            
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error saving supplier: ", error.code || '', msg);
            alert(`An error occurred while saving supplier: ${msg}`);
        }
    });

    // Call the fetch functions to display data
    fetchInventoryData();
    fetchSupplierData();
}

// Define the fetchInventoryData function
async function fetchInventoryData() {
    try {
        const inventoryTableBody = document.getElementById('inventoryTable').getElementsByTagName('tbody')[0];
        inventoryTableBody.innerHTML = '';
        
        const querySnapshot = await getDocs(collection(db, "inventory"));
        
        if (querySnapshot.empty) {
            console.log("No inventory records found");
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = inventoryTableBody.insertRow();
            
            // Insert cells based on Firestore schema
            row.insertCell(0).textContent = doc.id || '';
            row.insertCell(1).textContent = data.Description || '';
            
            // Format timestamp if it exists
            let timeDisplay = '';
            if (data.Time_of_Arrival && data.Time_of_Arrival.toDate) {
                const date = data.Time_of_Arrival.toDate();
                timeDisplay = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            }
            row.insertCell(2).textContent = timeDisplay;
            
            row.insertCell(3).textContent = data.Total_Price || '';
            
            // Handle products array
            let productsDisplay = '';
            if (data.products && Array.isArray(data.products)) {
                productsDisplay = data.products.join(', ');
            } else if (data.products) {
                productsDisplay = String(data.products);
            }
            row.insertCell(4).textContent = productsDisplay;
            
            row.insertCell(5).textContent = data.supplier_id || '';
            
            // Add action buttons
            const actionsCell = row.insertCell(6);
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.className = 'btn btn-primary btn-sm mr-1';
            editBtn.onclick = () => editInventory(doc.id, data);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'btn btn-danger btn-sm';
            deleteBtn.onclick = () => deleteInventory(doc.id);
            
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(document.createTextNode(' '));
            actionsCell.appendChild(deleteBtn);
        });
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error fetching inventory: ", error.code || '', msg);
        alert(`An error occurred while fetching inventory: ${msg}`);
    }
}

// Define the fetchSupplierData function
async function fetchSupplierData() {
    try {
        // Update the dropdown
        const supplierSelect = document.getElementById('supplier');
        
        // Clear existing options
        while (supplierSelect.options.length > 1) {
            supplierSelect.remove(1);
        }
        
        // Fetch suppliers from farmers collection
        const querySnapshot = await getDocs(collection(db, "farmers"));
        
        // Update the suppliers table
        const supplierTableBody = document.getElementById('supplierTable').getElementsByTagName('tbody')[0];
        supplierTableBody.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Skip if not a supplier (if role is specified and not 'supplier')
            if (data.role && data.role !== 'supplier') {
                return;
            }
            
            // Add to dropdown
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = data.name || doc.id; // Use name if available, otherwise use ID
            supplierSelect.appendChild(option);
            
            // Add to table
            const row = supplierTableBody.insertRow();
            row.insertCell(0).textContent = doc.id;
            row.insertCell(1).textContent = data.name || '';
            row.insertCell(2).textContent = data.information || '';
            
            // Format date if it exists
            let dateDisplay = '';
            if (data.dateRegistered) {
                if (data.dateRegistered.toDate) {
                    // If it's a Firestore timestamp
                    const date = data.dateRegistered.toDate();
                    dateDisplay = date.toLocaleDateString();
                } else {
                    // If it's a string date
                    dateDisplay = data.dateRegistered;
                }
            }
            row.insertCell(3).textContent = dateDisplay;
            
            // Add action buttons
            const actionsCell = row.insertCell(4);
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.className = 'btn btn-primary btn-sm mr-1';
            editBtn.onclick = () => editSupplier(doc.id, data);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'btn btn-danger btn-sm';
            deleteBtn.onclick = () => deleteSupplier(doc.id);
            
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(document.createTextNode(' '));
            actionsCell.appendChild(deleteBtn);
        });
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error fetching suppliers: ", error.code || '', msg);
        alert(`An error occurred while fetching suppliers: ${msg}`);
    }
}

// Define functions for editing and deleting inventory items
function editInventory(id, data) {
    // Set form values for editing
    document.getElementById('inventoryId').value = id;
    document.getElementById('description').value = data.Description || '';
    document.getElementById('totalPrice').value = data.Total_Price || '';
    
    // Handle products array
    if (data.products && Array.isArray(data.products)) {
        document.getElementById('products').value = data.products.join(', ');
    } else if (data.products) {
        document.getElementById('products').value = data.products;
    } else {
        document.getElementById('products').value = '';
    }
    
    // Set supplier if available
    if (data.supplier_id) {
        const supplierSelect = document.getElementById('supplier');
        for (let i = 0; i < supplierSelect.options.length; i++) {
            if (supplierSelect.options[i].value === data.supplier_id) {
                supplierSelect.selectedIndex = i;
                break;
            }
        }
    }
    
    // Change button text to indicate update
    document.getElementById('submitInventory').textContent = 'Update Inventory';
    
    // Scroll to form
    document.getElementById('inventoryForm').scrollIntoView();
}

async function deleteInventory(id) {
    if (confirm('Are you sure you want to delete this inventory item?')) {
        try {
            // Get the data that will be deleted for logging
            const docRef = doc(db, "inventory", id);
            const docSnap = await getDoc(docRef);
            const deletedData = docSnap.exists() ? docSnap.data() : null;
            
            // Delete the document
            await deleteDoc(docRef);
            
            // Log the deletion with our new logging module
            await logDelete('inventory', id, deletedData);
            
            alert('Inventory item deleted successfully');
            fetchInventoryData(); // Refresh the table
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error deleting inventory: ", error.code || '', msg);
            alert(`An error occurred while deleting inventory: ${msg}`);
        }
    }
}

// Define functions for editing and deleting suppliers
function editSupplier(id, data) {
    // Set form values for editing
    document.getElementById('supplierId').value = id;
    document.getElementById('name').value = data.name || '';
    document.getElementById('information').value = data.information || '';
    
    // Handle date formatting
    if (data.dateRegistered) {
        let dateValue = '';
        if (data.dateRegistered.toDate) {
            // If it's a Firestore timestamp
            const date = data.dateRegistered.toDate();
            dateValue = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        } else {
            // If it's a string date
            dateValue = data.dateRegistered;
        }
        document.getElementById('dateSupplied').value = dateValue;
    }
    
    // Change button text to indicate update
    document.getElementById('submitSupplier').textContent = 'Update Supplier';
    
    // Scroll to form
    document.getElementById('supplierForm').scrollIntoView();
}

async function deleteSupplier(id) {
    if (confirm('Are you sure you want to delete this supplier?')) {
        try {
            // Get the data that will be deleted for logging
            const docRef = doc(db, "farmers", id);
            const docSnap = await getDoc(docRef);
            const deletedData = docSnap.exists() ? docSnap.data() : null;
            
            // Delete the document
            await deleteDoc(docRef);
            
            // Log the deletion with our new logging module
            await logDelete('farmers', id, deletedData);
            
            alert('Supplier deleted successfully');
            fetchSupplierData(); // Refresh the table
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error deleting supplier: ", error.code || '', msg);
            alert(`An error occurred while deleting supplier: ${msg}`);
        }
    }
}