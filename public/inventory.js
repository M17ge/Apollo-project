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
    // Populate supplier dropdown - simplified version
    fetchSupplierData();

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
        
        // Create inventory object - simplified
        const inventoryData = {
            Description: description,
            Time_of_Arrival: serverTimestamp(),
            Total_Price: totalPrice,
            products: products,
            supplier_id: supplier_id,
            manager_id: document.getElementById('managerID')?.value || window.currentUserId || auth.currentUser?.uid || 'unknown'
        };

        try {
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
        const supplierName = document.getElementById('supplierName').value;
        const description = document.getElementById('supplierDescription').value;
        const price = parseFloat(document.getElementById('price').value);
        const quantityperitem = document.getElementById('quantityperitem').value;
        const productrequested = document.getElementById('productrequested').value.split(',').map(item => item.trim());
        const arrived = document.getElementById('arrived').checked;
        const supplierId = document.getElementById('supplierId').value;
        
        try {
            // Create the supplier data object matching the new schema
            const supplierData = {
                supplierName,
                description,
                price,
                quantityperitem,
                productrequested,
                arrived,
                updatedAt: serverTimestamp()
            };
            
            let docRef;
            
            // Check if we're updating an existing supplier
            if (supplierId) {
                // Get the old data for logging
                const docSnap = await getDoc(doc(db, "supplier", supplierId));
                const oldData = docSnap.exists() ? docSnap.data() : null;
                
                // Update existing supplier
                await updateDoc(doc(db, "supplier", supplierId), supplierData);
                
                // Log the update with our new logging module
                await logUpdate('supplier', supplierId, supplierData, oldData);
                
                alert("Supplier updated successfully!");
                // Reset form state for new submissions
                document.getElementById('submitSupplier').textContent = 'Add Supplier';
                docRef = { id: supplierId };
            } else {
                // Add a new supplier
                docRef = await addDoc(collection(db, "supplier"), supplierData);
                
                // Log the creation with our new logging module
                await logCreate('supplier', docRef.id, supplierData);
                alert("Supplier added successfully!");
            }
            
            // Reset form
            document.getElementById('supplierForm').reset();
            document.getElementById('supplierId').value = '';
            
            // Refresh supplier data in dropdown and table
            fetchSupplierData();
            
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error saving supplier: ", error.code || '', msg);
            alert(`An error occurred while saving supplier: ${msg}`);
        }
    });

    // Inventory Request form submission
    document.getElementById('inventoryRequestForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const requestId = document.getElementById('requestId').value;
        const inventory_id = document.getElementById('requestInventoryId').value;
        const product_id = document.getElementById('requestProductIds').value.split(',').map(item => item.trim());
        const quantity = document.getElementById('requestQuantities').value.split(',').map(item => parseFloat(item.trim()));
        const supplier_id = document.getElementById('requestSupplierId').value;
        const total_price = parseFloat(document.getElementById('requestTotalPrice').value);
        const suppliercontact = document.getElementById('requestSupplierContact').value;
        const address = document.getElementById('requestAddress').value;
        const ETA = document.getElementById('requestETA').value;
        
        // Basic validation
        if (product_id.length !== quantity.length) {
            alert('Number of products must match number of quantities');
            return;
        }
        
        // Create request data matching your inventory_requests schema
        const requestData = {
            inventory_id,
            product_id,
            quantity,
            supplier_id,
            request_id: `REQ-${Date.now()}`, // Generate unique request ID
            total_price,
            suppliercontact,
            address,
            ETA,
            approved: null, // Initially pending
            created_at: serverTimestamp(),
            created_by: window.currentUserId || auth.currentUser?.uid || 'unknown'
        };

        try {
            let docRef;
            
            if (requestId) {
                // Update existing request
                const docSnap = await getDoc(doc(db, "inventory_requests", requestId));
                const oldData = docSnap.exists() ? docSnap.data() : null;
                
                await updateDoc(doc(db, "inventory_requests", requestId), requestData);
                await logUpdate('inventory_requests', requestId, requestData, oldData);
                
                alert("Inventory request updated successfully!");
                document.getElementById('submitInventoryRequest').textContent = 'Send Request to Supplier';
            } else {
                // Create new request
                docRef = await addDoc(collection(db, "inventory_requests"), requestData);
                await logCreate('inventory_requests', docRef.id, requestData);
                
                alert("Inventory request sent to supplier successfully!");
            }
            
            // Reset form
            document.getElementById('inventoryRequestForm').reset();
            document.getElementById('requestId').value = '';
            
            // Refresh the requests table
            fetchInventoryRequestsData();
            
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error saving inventory request: ", error.code || '', msg);
            alert(`An error occurred while saving the request: ${msg}`);
        }
    });

    // Call the fetch functions to display data
    fetchInventoryData();
    fetchSupplierData();
    fetchInventoryRequestsData();
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
        
        // Fetch suppliers from supplier collection
        const querySnapshot = await getDocs(collection(db, "supplier"));
        
        // Update the suppliers table
        const supplierTableBody = document.getElementById('supplierTable').getElementsByTagName('tbody')[0];
        supplierTableBody.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Add to dropdown
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = data.supplierName || doc.id; // Use supplierName if available, otherwise use ID
            supplierSelect.appendChild(option);
            
            // Add to table
            const row = supplierTableBody.insertRow();
            row.insertCell(0).textContent = doc.id;
            row.insertCell(1).textContent = data.supplierName || '';
            row.insertCell(2).textContent = data.description || '';
            row.insertCell(3).textContent = data.price ? `$${data.price.toFixed(2)}` : '';
            row.insertCell(4).textContent = data.quantityperitem || '';
            
            // Handle products requested array
            let productsDisplay = '';
            if (data.productrequested && Array.isArray(data.productrequested)) {
                productsDisplay = data.productrequested.join(', ');
            } else if (data.productrequested) {
                productsDisplay = data.productrequested;
            }
            row.insertCell(5).textContent = productsDisplay;
            
            // Display arrived status
            row.insertCell(6).textContent = data.arrived ? 'Yes' : 'No';
            
            // Add action buttons
            const actionsCell = row.insertCell(7);
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
        
        // Also populate the inventory request supplier dropdown
        const requestSupplierSelect = document.getElementById('requestSupplierId');
        if (requestSupplierSelect) {
            // Clear existing options except the first one
            while (requestSupplierSelect.options.length > 1) {
                requestSupplierSelect.remove(1);
            }
            
            // Add suppliers to request form dropdown
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = data.supplierName || doc.id;
                requestSupplierSelect.appendChild(option);
            });
        }
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error fetching suppliers: ", error.code || '', msg);
        alert(`An error occurred while fetching suppliers: ${msg}`);
    }
}

// Fetch and display inventory requests
async function fetchInventoryRequestsData() {
    try {
        const requestTableBody = document.getElementById('inventoryRequestsTable').getElementsByTagName('tbody')[0];
        requestTableBody.innerHTML = '';
        
        const querySnapshot = await getDocs(collection(db, "inventory_requests"));
        
        if (querySnapshot.empty) {
            requestTableBody.innerHTML = '<tr><td colspan="9">No inventory requests found</td></tr>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = requestTableBody.insertRow();
            
            row.insertCell(0).textContent = data.request_id || doc.id;
            row.insertCell(1).textContent = data.inventory_id || '';
            
            // Format product_id array
            let productIds = '';
            if (data.product_id && Array.isArray(data.product_id)) {
                productIds = data.product_id.join(', ');
            } else if (data.product_id) {
                productIds = String(data.product_id);
            }
            row.insertCell(2).textContent = productIds;
            
            // Format quantity array
            let quantities = '';
            if (data.quantity && Array.isArray(data.quantity)) {
                quantities = data.quantity.join(', ');
            } else if (data.quantity) {
                quantities = String(data.quantity);
            }
            row.insertCell(3).textContent = quantities;
            
            row.insertCell(4).textContent = data.supplier_id || '';
            row.insertCell(5).textContent = data.total_price ? `$${data.total_price.toFixed(2)}` : '';
            
            // Status based on approved field
            let status = 'Pending';
            if (data.approved === true) {
                status = 'Approved';
            } else if (data.approved === false) {
                status = 'Rejected';
            }
            row.insertCell(6).textContent = status;
            
            row.insertCell(7).textContent = data.ETA || '';
            
            // Add action buttons
            const actionsCell = row.insertCell(8);
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.className = 'btn btn-primary btn-sm mr-1';
            editBtn.onclick = () => editInventoryRequest(doc.id, data);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'btn btn-danger btn-sm';
            deleteBtn.onclick = () => deleteInventoryRequest(doc.id);
            
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(document.createTextNode(' '));
            actionsCell.appendChild(deleteBtn);
        });
        
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error fetching inventory requests: ", error.code || '', msg);
        alert(`An error occurred while fetching requests: ${msg}`);
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
    document.getElementById('supplierName').value = data.supplierName || '';
    document.getElementById('supplierDescription').value = data.description || '';
    document.getElementById('price').value = data.price || '';
    document.getElementById('quantityperitem').value = data.quantityperitem || '';
    
    // Handle products requested array
    if (data.productrequested && Array.isArray(data.productrequested)) {
        document.getElementById('productrequested').value = data.productrequested.join(', ');
    } else if (data.productrequested) {
        document.getElementById('productrequested').value = data.productrequested;
    } else {
        document.getElementById('productrequested').value = '';
    }
    
    document.getElementById('arrived').checked = data.arrived || false;
    
    // Change button text to indicate update
    document.getElementById('submitSupplier').textContent = 'Update Supplier';
    
    // Scroll to form
    document.getElementById('supplierForm').scrollIntoView();
}

async function deleteSupplier(id) {
    if (confirm('Are you sure you want to delete this supplier?')) {
        try {
            // Get the data that will be deleted for logging
            const docRef = doc(db, "supplier", id);
            const docSnap = await getDoc(docRef);
            const deletedData = docSnap.exists() ? docSnap.data() : null;
            
            // Delete the document
            await deleteDoc(docRef);
            
            // Log the deletion with our new logging module
            await logDelete('supplier', id, deletedData);
            
            alert('Supplier deleted successfully');
            fetchSupplierData(); // Refresh the table
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error deleting supplier: ", error.code || '', msg);
            alert(`An error occurred while deleting supplier: ${msg}`);
        }
    }
}

// Edit inventory request
function editInventoryRequest(id, data) {
    // Set form values for editing
    document.getElementById('requestId').value = id;
    document.getElementById('requestInventoryId').value = data.inventory_id || '';
    
    // Handle product_id array
    if (data.product_id && Array.isArray(data.product_id)) {
        document.getElementById('requestProductIds').value = data.product_id.join(', ');
    } else if (data.product_id) {
        document.getElementById('requestProductIds').value = data.product_id;
    }
    
    // Handle quantity array
    if (data.quantity && Array.isArray(data.quantity)) {
        document.getElementById('requestQuantities').value = data.quantity.join(', ');
    } else if (data.quantity) {
        document.getElementById('requestQuantities').value = data.quantity;
    }
    
    document.getElementById('requestSupplierId').value = data.supplier_id || '';
    document.getElementById('requestTotalPrice').value = data.total_price || '';
    document.getElementById('requestSupplierContact').value = data.suppliercontact || '';
    document.getElementById('requestAddress').value = data.address || '';
    document.getElementById('requestETA').value = data.ETA || '';
    
    // Change button text to indicate update
    document.getElementById('submitInventoryRequest').textContent = 'Update Request';
    
    // Scroll to form
    document.getElementById('inventoryRequestForm').scrollIntoView();
}

// Delete inventory request
async function deleteInventoryRequest(id) {
    if (confirm('Are you sure you want to delete this inventory request?')) {
        try {
            // Get the data that will be deleted for logging
            const docRef = doc(db, "inventory_requests", id);
            const docSnap = await getDoc(docRef);
            const deletedData = docSnap.exists() ? docSnap.data() : null;
            
            // Delete the document
            await deleteDoc(docRef);
            
            // Log the deletion
            await logDelete('inventory_requests', id, deletedData);
            
            alert('Inventory request deleted successfully');
            fetchInventoryRequestsData(); // Refresh the table
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error deleting inventory request: ", error.code || '', msg);
            alert(`An error occurred while deleting request: ${msg}`);
        }
    }
}