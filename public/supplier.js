import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
// Import logging functions
import { logCreate, logUpdate, logDelete, logActivity, logError } from './logging.js';
// Import database utilities for foreign key management
import { 
    initializeDatabase, 
    validateDocumentReferences, 
    populateReferenceDropdown, 
    DISPLAY_FORMATTERS 
} from './database-utils.js';

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

// Initialize database utilities
initializeDatabase(db);

document.addEventListener('DOMContentLoaded', async () => {
    // Skip authentication for testing - directly initialize
    console.log("Initializing supplier portal...");
    
    // Initialize foreign key dropdowns
    await initializeForeignKeyDropdowns();
    
    await fetchInventoryRequests();

    const fulfillmentForm = document.getElementById('fulfillmentForm');
    if (fulfillmentForm) {
        fulfillmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form values
            const requestId = document.getElementById('requestId').value;
            const inventory_id = document.getElementById('inventory_id').value;
            const supplier_response = document.getElementById('supplier_response').value;
            const fulfillment_status = document.getElementById('fulfillment_status').value;
            const notes = document.getElementById('notes').value;
            
            // Call the handleFulfillmentSubmit function
            await handleFulfillmentSubmit(requestId, inventory_id, supplier_response, fulfillment_status, notes);
            
            // Reset form and state
            e.target.reset();
            const submitButton = document.getElementById('submitFulfillment');
            if (submitButton) {
                submitButton.textContent = 'Submit Response';
            }
        });
    }

    // Log page access
    try {
        await logActivity('supplier_page_loaded', 'Supplier portal accessed', 'test_supplier_id');
        console.log("Apollo logging system activated - Supplier Portal");
    } catch (error) {
        console.error('Logging error:', error);
    }
});

// Fetch and display inventory requests
async function fetchInventoryRequests() {
    try {
        const querySnapshot = await getDocs(collection(db, "inventory"));
        const tableBody = document.getElementById('inventoryRequestsTable');
        
        if (!tableBody) {
            console.error('Table body not found');
            return;
        }

        const tbody = tableBody.getElementsByTagName('tbody')[0];
        if (!tbody) {
            console.error('Table tbody not found');
            return;
        }
        
        // Clear existing data
        tbody.innerHTML = '';

        for (const docSnap of querySnapshot.docs) {
            const inventory = docSnap.data();
            const row = document.createElement('tr');
            
            // Format created_at timestamp if it exists
            let createdAtDisplay = '';
            if (inventory.created_at && inventory.created_at.toDate) {
                createdAtDisplay = inventory.created_at.toDate().toLocaleString();
            } else if (inventory.created_at) {
                createdAtDisplay = new Date(inventory.created_at).toLocaleString();
            }
            
            // Get display names for foreign keys
            let supplierName = inventory.supplier_id || '';
            let managerName = inventory.approval_manager || '';
            
            try {
                if (DISPLAY_FORMATTERS && DISPLAY_FORMATTERS.supplier_id) {
                    supplierName = await DISPLAY_FORMATTERS.supplier_id(inventory.supplier_id);
                }
                if (DISPLAY_FORMATTERS && DISPLAY_FORMATTERS.approval_manager) {
                    managerName = await DISPLAY_FORMATTERS.approval_manager(inventory.approval_manager);
                }
            } catch (error) {
                console.error('Error formatting display names:', error);
            }
            
            // Create row HTML
            row.innerHTML = `
                <td>${docSnap.id}</td>
                <td>${inventory.name || ''}</td>
                <td>${inventory.quantity || ''}</td>
                <td>${supplierName}</td>
                <td>${managerName}</td>
                <td>${createdAtDisplay}</td>
                <td><span class="status ${inventory.status || 'pending'}">${inventory.status || 'Pending'}</span></td>
                <td>
                    <button onclick="respondToRequest('${docSnap.id}')">Respond</button>
                </td>
            `;
            
            tbody.appendChild(row);
        }
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error fetching inventory requests: ", error.code || '', msg);
        alert(`An error occurred while fetching inventory requests: ${msg}`);
    }
}

// Handle fulfillment submission
async function handleFulfillmentSubmit(requestId, inventory_id, supplier_response, fulfillment_status, notes) {
    try {
        // Create the fulfillment data object
        const fulfillmentData = {
            inventory_id: inventory_id,
            supplier_response: supplier_response,
            fulfillment_status: fulfillment_status,
            notes: notes,
            response_date: serverTimestamp()
        };

        // Validate foreign key relationships
        const validation = await validateDocumentReferences('inventory_fulfillment', fulfillmentData);
        
        if (!validation.valid) {
            alert('Validation errors:\n' + validation.errors.join('\n'));
            return;
        }
        
        if (requestId) {
            // Update existing request
            const requestRef = doc(db, "inventory", requestId);
            const docSnap = await getDoc(requestRef);
            const oldData = docSnap.exists() ? docSnap.data() : null;
            
            // Update the inventory request with supplier response
            const updateData = {
                supplier_response: supplier_response,
                status: fulfillment_status,
                response_date: serverTimestamp(),
                notes: notes
            };
            
            await updateDoc(requestRef, updateData);
            
            // Log the update
            await logUpdate('inventory', requestId, updateData, oldData);
            
            alert("Response submitted successfully!");
        } else {
            // Create new fulfillment record
            const docRef = await addDoc(collection(db, "inventory_fulfillment"), validation.validatedData);
            
            // Log the creation
            await logCreate('inventory_fulfillment', docRef.id, validation.validatedData);
            
            alert("Fulfillment record created successfully!");
        }
        
        await fetchInventoryRequests();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error handling fulfillment: ", error.code || '', msg);
        
        // Log the error
        await logError('supplier_fulfillment', "Failed to handle fulfillment", { 
            requestId, 
            error: msg
        });
        
        alert(`An error occurred while handling fulfillment: ${msg}`);
    }
}

// Respond to request - populate form
async function respondToRequest(requestId) {
    try {
        const requestRef = doc(db, "inventory", requestId);
        const requestSnap = await getDoc(requestRef);
        
        if (requestSnap.exists()) {
            const requestData = requestSnap.data();
            
            // Populate form with request data
            const requestIdInput = document.getElementById('requestId');
            const inventoryIdInput = document.getElementById('inventory_id');
            const supplierResponseInput = document.getElementById('supplier_response');
            const submitButton = document.getElementById('submitFulfillment');
            
            if (requestIdInput) requestIdInput.value = requestId;
            if (inventoryIdInput) inventoryIdInput.value = requestId; // Use the same ID
            if (supplierResponseInput) supplierResponseInput.focus();
            if (submitButton) submitButton.textContent = 'Submit Response';
            
            // Scroll to form
            const fulfillmentForm = document.getElementById('fulfillmentForm');
            if (fulfillmentForm) {
                fulfillmentForm.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            console.error("Request not found");
            alert("Request not found");
        }
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error getting request: ", error.code || '', msg);
        alert(`An error occurred while getting request data: ${msg}`);
    }
}

// Make functions available globally for onclick handlers
window.respondToRequest = respondToRequest;

// Initialize foreign key dropdowns
async function initializeForeignKeyDropdowns() {
    try {
        // Populate inventory dropdown
        await populateReferenceDropdown('inventory_id', 'inventory', 'name');
        
    } catch (error) {
        console.error('Error initializing foreign key dropdowns:', error);
    }
}
