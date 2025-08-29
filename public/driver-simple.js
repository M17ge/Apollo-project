import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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

// Simple function to load dispatches
async function loadDispatches() {
    try {
        console.log("Loading dispatches...");
        const querySnapshot = await getDocs(collection(db, "dispatch"));
        const tableBody = document.getElementById('driverDispatchTable').getElementsByTagName('tbody')[0];
        
        tableBody.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const dispatch = doc.data();
            const row = tableBody.insertRow();
            
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${dispatch.dispatch_time || 'N/A'}</td>
                <td>${dispatch.location || 'N/A'}</td>
                <td>${dispatch.vehicle || 'N/A'}</td>
                <td>${dispatch.order_id || 'N/A'}</td>
                <td>${dispatch.driver_id || 'N/A'}</td>
                <td>${dispatch.status || 'N/A'}</td>
                <td>
                    <button onclick="editDispatch('${doc.id}')">Edit</button>
                </td>
            `;
        });
        
        console.log("Dispatches loaded successfully");
    } catch (error) {
        console.error("Error loading dispatches:", error);
        alert("Error loading dispatches: " + error.message);
    }
}

// Simple function to load orders
async function loadOrders() {
    try {
        console.log("Loading orders...");
        const querySnapshot = await getDocs(collection(db, "order"));
        const tableBody = document.getElementById('driverOrdersTable').getElementsByTagName('tbody')[0];
        const orderSelect = document.getElementById('orderSelect');
        
        tableBody.innerHTML = '';
        orderSelect.innerHTML = '<option value="">Select an order to update</option>';
        
        querySnapshot.forEach((doc) => {
            const order = doc.data();
            const row = tableBody.insertRow();
            
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${order.farmer || 'N/A'}</td>
                <td>${order.products || 'N/A'}</td>
                <td>${order.quantity || 'N/A'}</td>
                <td>${order.delivery_location || 'N/A'}</td>
                <td>${order.assigned_driver || 'N/A'}</td>
                <td>${order.status || 'N/A'}</td>
                <td>${order.eta || 'N/A'}</td>
                <td>
                    <button onclick="editOrder('${doc.id}')">Edit</button>
                </td>
            `;
            
            // Add to dropdown
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${doc.id} - ${order.products || 'Unknown'}`;
            orderSelect.appendChild(option);
        });
        
        console.log("Orders loaded successfully");
    } catch (error) {
        console.error("Error loading orders:", error);
        alert("Error loading orders: " + error.message);
    }
}

// Simple function to update order status
async function updateOrderStatus(orderId, status, notes, deliveryTime) {
    try {
        console.log("Updating order status...");
        
        const orderRef = doc(db, "order", orderId);
        const updateData = {
            status: status,
            delivery_notes: notes || '',
            delivery_time: deliveryTime || new Date().toISOString()
        };
        
        await updateDoc(orderRef, updateData);
        alert("Order status updated successfully!");
        
        // Reload data
        await loadOrders();
        
    } catch (error) {
        console.error("Error updating order:", error);
        alert("Error updating order: " + error.message);
    }
}

// Global functions for buttons
window.editDispatch = function(dispatchId) {
    alert("Edit dispatch: " + dispatchId);
};

window.editOrder = function(orderId) {
    // Fill the form with order ID
    document.getElementById('orderId').value = orderId;
    document.getElementById('orderSelect').value = orderId;
    
    // Scroll to form
    document.getElementById('orderStatusForm').scrollIntoView({ behavior: 'smooth' });
};

window.markAllInTransit = function() {
    alert("Feature coming soon: Mark all in transit");
};

window.showMyRoute = function() {
    alert("Feature coming soon: Show route");
};

window.reportIssue = function() {
    alert("Feature coming soon: Report issue");
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Driver dashboard starting...");
    
    // Load data
    await loadDispatches();
    await loadOrders();
    
    // Handle form submission
    const form = document.getElementById('orderStatusForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const orderId = document.getElementById('orderId').value;
            const orderSelect = document.getElementById('orderSelect').value;
            const status = document.getElementById('deliveryStatus').value;
            const notes = document.getElementById('deliveryNotes').value;
            const deliveryTime = document.getElementById('deliveryTime').value;
            
            const finalOrderId = orderId || orderSelect;
            
            if (!finalOrderId) {
                alert('Please select an order first');
                return;
            }
            
            if (!status) {
                alert('Please select a delivery status');
                return;
            }
            
            await updateOrderStatus(finalOrderId, status, notes, deliveryTime);
            
            // Reset form
            form.reset();
            document.getElementById('orderId').value = '';
        });
    }
    
    console.log("Driver dashboard initialized successfully");
});
