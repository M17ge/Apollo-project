import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDoc,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { logActivity, logCreate, logUpdate, logError } from './logging.js';

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
const db = getFirestore(app);

// Load pending inventory requests
async function loadInventoryRequests() {
    try {
        console.log("Loading inventory requests...");
        
        // Simple logging without potential undefined values
        try {
            logActivity('loading_requests', 'inventory_requests', null, { action: 'load_inventory_requests' });
        } catch (logError) {
            console.warn('Logging failed:', logError);
        }
        
        // Load all inventory requests - filter by approved status
        const querySnapshot = await getDocs(collection(db, "inventory_requests"));
        const tableBody = document.querySelector('#inventoryRequestsTable tbody');
        const requestSelect = document.getElementById('requestSelect');
        
        if (!tableBody) {
            console.error("Table body not found");
            return;
        }
        
        tableBody.innerHTML = '';
        requestSelect.innerHTML = '<option value="">Select a request to fulfill</option>';
        
        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="8">No requests found</td></tr>';
            return;
        }
        
        querySnapshot.forEach((docSnapshot) => {
            const request = docSnapshot.data();
            const row = tableBody.insertRow();
            
            // Format products list from product_id array
            let productsText = 'N/A';
            if (request.product_id && Array.isArray(request.product_id)) {
                productsText = request.product_id.join(', ');
            } else if (request.product_id) {
                productsText = String(request.product_id);
            }
            
            // Format quantities from quantity array
            let quantityText = 'N/A';
            if (request.quantity && Array.isArray(request.quantity)) {
                quantityText = request.quantity.join(', ');
            } else if (request.quantity) {
                quantityText = String(request.quantity);
            }
            
            // Combine products and quantities for display
            if (request.product_id && request.quantity && 
                Array.isArray(request.product_id) && Array.isArray(request.quantity) &&
                request.product_id.length === request.quantity.length) {
                productsText = request.product_id.map((product, index) => 
                    `${product} (${request.quantity[index]})`
                ).join(', ');
            }
            
            // Status based on approved field
            let status = 'pending';
            let statusClass = 'pending';
            if (request.approved === true) {
                status = 'approved';
                statusClass = 'approved';
            } else if (request.approved === false) {
                status = 'rejected';
                statusClass = 'rejected';
            }
            
            row.innerHTML = `
                <td>${request.request_id || docSnapshot.id}</td>
                <td>${request.inventory_id || 'N/A'}</td>
                <td>${productsText}</td>
                <td>$${request.total_price || '0.00'}</td>
                <td>${request.supplier_id || 'N/A'}</td>
                <td>${request.ETA || 'N/A'}</td>
                <td><span class="status-badge status-${statusClass}">${status}</span></td>
                <td>
                    <button onclick="selectRequestForFulfillment('${docSnapshot.id}')">Fulfill</button>
                </td>
            `;
            
            // Add to select dropdown
            const option = document.createElement('option');
            option.value = docSnapshot.id;
            option.textContent = `${request.request_id || docSnapshot.id} - ${request.inventory_id || 'Request'}`;
            requestSelect.appendChild(option);
        });
        
        console.log("Inventory requests loaded successfully");
        
    } catch (error) {
        console.error("Error loading inventory requests:", error);
        
        // Simple error logging
        try {
            logError('supplier_system', 'Error loading inventory requests', { error: error.message });
        } catch (logError) {
            console.warn('Error logging failed:', logError);
        }
        
        const tableBody = document.querySelector('#inventoryRequestsTable tbody');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8">Error loading requests: ${error.message}</td></tr>`;
        }
    }
}

// Select a request for fulfillment
window.selectRequestForFulfillment = async function(requestId) {
    try {
        const requestDoc = await getDoc(doc(db, "inventory_requests", requestId));
        if (requestDoc.exists()) {
            const request = requestDoc.data();
            
            // Fill form
            document.getElementById('requestId').value = requestId;
            document.getElementById('requestSelect').value = requestId;
            
            // Pre-fill some fields based on the request
            if (request.quantity && Array.isArray(request.quantity) && request.quantity.length > 0) {
                const totalQuantity = request.quantity.reduce((sum, qty) => sum + (parseFloat(qty) || 0), 0);
                document.getElementById('availableQuantity').value = totalQuantity;
            }
            
            if (request.total_price) {
                document.getElementById('quotedPrice').value = request.total_price;
            }
            
            if (request.ETA) {
                document.getElementById('estimatedDelivery').value = request.ETA;
            }
            
            // Scroll to form
            document.getElementById('fulfillmentForm').scrollIntoView({ behavior: 'smooth' });
            
            // Simple logging
            try {
                logActivity('select_request', 'inventory_requests', requestId, { action: 'selected_for_fulfillment' });
            } catch (logError) {
                console.warn('Logging failed:', logError);
            }
        }
    } catch (error) {
        console.error("Error selecting request:", error);
        
        // Simple error logging
        try {
            logError('supplier_system', 'Error selecting request', { requestId, error: error.message });
        } catch (logError) {
            console.warn('Error logging failed:', logError);
        }
        
        alert("Error selecting request: " + error.message);
    }
};

// Submit fulfillment response
async function submitFulfillmentResponse(requestId, response, availableQuantity, quotedPrice, estimatedDelivery, notes) {
    try {
        console.log("Submitting fulfillment response...");
        
        // Simple logging
        try {
            logActivity('submit_response', 'inventory_requests', requestId, { response: response });
        } catch (logError) {
            console.warn('Logging failed:', logError);
        }
        
        // Update the inventory request with supplier response
        const updateData = {
            suppliercontact: notes || '', // Using notes as supplier contact info
            ETA: estimatedDelivery || '',
            total_price: quotedPrice || 0
        };
        
        // Set approved status based on response
        if (response === 'accepted') {
            updateData.approved = true;
        } else if (response === 'rejected') {
            updateData.approved = false;
        } else if (response === 'partial') {
            updateData.approved = true; // Partial acceptance still approved
        }
        
        // Update quantities if provided
        if (availableQuantity && availableQuantity > 0) {
            // If it's a single quantity, update the quantity array
            updateData.quantity = [availableQuantity];
        }
        
        await updateDoc(doc(db, "inventory_requests", requestId), updateData);
        
        // Simple logging
        try {
            logUpdate('inventory_requests', requestId, updateData, null);
        } catch (logError) {
            console.warn('Logging failed:', logError);
        }
        
        alert("Response submitted successfully!");
        
        // Reload requests
        await loadInventoryRequests();
        
        return true;
        
    } catch (error) {
        console.error("Error submitting fulfillment response:", error);
        
        // Simple error logging
        try {
            logError('supplier_system', 'Error submitting fulfillment response', { requestId, error: error.message });
        } catch (logError) {
            console.warn('Error logging failed:', logError);
        }
        
        alert("Error submitting response: " + error.message);
        return false;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Supplier system starting...");
    
    // Simple logging
    try {
        logActivity('init_supplier', 'supplier_system', null, { action: 'portal_initialized' });
    } catch (logError) {
        console.warn('Logging failed:', logError);
    }
    
    try {
        // Load inventory requests
        await loadInventoryRequests();
        
        // Handle fulfillment form submission
        const fulfillmentForm = document.getElementById('fulfillmentForm');
        if (fulfillmentForm) {
            fulfillmentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const requestId = document.getElementById('requestId').value || document.getElementById('requestSelect').value;
                const response = document.getElementById('supplierResponse').value;
                const availableQuantity = parseInt(document.getElementById('availableQuantity').value) || 0;
                const quotedPrice = parseFloat(document.getElementById('quotedPrice').value) || 0;
                const estimatedDelivery = document.getElementById('estimatedDelivery').value;
                const notes = document.getElementById('supplierNotes').value;
                
                // Basic validation
                if (!requestId) {
                    alert('Please select a request to fulfill');
                    return;
                }
                
                if (!response) {
                    alert('Please select a response type');
                    return;
                }
                
                if (response !== 'rejected' && (!availableQuantity || availableQuantity <= 0)) {
                    alert('Please enter available quantity for accepted/partial requests');
                    return;
                }
                
                if (response !== 'rejected' && (!quotedPrice || quotedPrice <= 0)) {
                    alert('Please enter quoted price for accepted/partial requests');
                    return;
                }
                
                const success = await submitFulfillmentResponse(
                    requestId, response, availableQuantity, quotedPrice, estimatedDelivery, notes
                );
                
                if (success) {
                    // Reset form
                    fulfillmentForm.reset();
                    document.getElementById('requestId').value = '';
                }
            });
        }
        
        // Handle request selection
        const requestSelect = document.getElementById('requestSelect');
        if (requestSelect) {
            requestSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    document.getElementById('requestId').value = e.target.value;
                }
            });
        }
        
        console.log("Supplier system initialized successfully");
        
    } catch (error) {
        console.error("Error initializing supplier system:", error);
        
        // Simple error logging
        try {
            logError('supplier_system', 'Error initializing supplier system', { error: error.message });
        } catch (logError) {
            console.warn('Error logging failed:', logError);
        }
        
        alert("Error initializing supplier system: " + error.message);
    }
});
