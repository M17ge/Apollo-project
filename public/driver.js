import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, getDocs, updateDoc, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
// Import logging functions
import { logUpdate, logActivity, logError } from './logging.js';
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
    console.log("Initializing driver dashboard...");
    
    await fetchDispatches();
    await fetchOrders();

    const orderForm = document.getElementById('orderStatusForm');
    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form values
            const orderId = document.getElementById('orderId').value;
            const newStatus = document.getElementById('newStatus').value;
            
            // Call the updateOrderStatus function
            await updateOrderStatus(orderId, newStatus);
            
            // Reset form
            e.target.reset();
        });
    }

    // Log page access
    try {
        await logActivity('driver_page_loaded', 'Driver dashboard accessed', 'test_driver_id');
        console.log("Apollo logging system activated - Driver Dashboard");
    } catch (error) {
        console.error('Logging error:', error);
    }
});

// Fetch and display dispatches
async function fetchDispatches() {
    try {
        const querySnapshot = await getDocs(collection(db, "dispatch"));
        const tableBody = document.getElementById('dispatchTable');
        
        if (!tableBody) {
            console.error('Dispatch table not found');
            return;
        }

        const tbody = tableBody.getElementsByTagName('tbody')[0];
        if (!tbody) {
            console.error('Dispatch table tbody not found');
            return;
        }
        
        // Clear existing data
        tbody.innerHTML = '';

        for (const docSnap of querySnapshot.docs) {
            const dispatch = docSnap.data();
            const row = document.createElement('tr');
            
            // Format dispatch_date timestamp if it exists
            let dispatchDateDisplay = '';
            if (dispatch.dispatch_date && dispatch.dispatch_date.toDate) {
                dispatchDateDisplay = dispatch.dispatch_date.toDate().toLocaleDateString();
            } else if (dispatch.dispatch_date) {
                dispatchDateDisplay = new Date(dispatch.dispatch_date).toLocaleDateString();
            }
            
            // Get display names for foreign keys
            let driverName = dispatch.driver_id || '';
            let orderDetails = dispatch.order_id || '';
            
            try {
                if (DISPLAY_FORMATTERS && DISPLAY_FORMATTERS.driver_id) {
                    driverName = await DISPLAY_FORMATTERS.driver_id(dispatch.driver_id);
                }
                if (DISPLAY_FORMATTERS && DISPLAY_FORMATTERS.order_id) {
                    orderDetails = await DISPLAY_FORMATTERS.order_id(dispatch.order_id);
                }
            } catch (error) {
                console.error('Error formatting display names:', error);
            }
            
            // Create row HTML
            row.innerHTML = `
                <td>${docSnap.id}</td>
                <td>${driverName}</td>
                <td>${orderDetails}</td>
                <td>${dispatchDateDisplay}</td>
                <td><span class="status ${dispatch.dispatched ? 'dispatched' : 'pending'}">${dispatch.dispatched ? 'Dispatched' : 'Pending'}</span></td>
            `;
            
            tbody.appendChild(row);
        }
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error fetching dispatches: ", error.code || '', msg);
        alert(`An error occurred while fetching dispatches: ${msg}`);
    }
}

// Fetch and display orders
async function fetchOrders() {
    try {
        const querySnapshot = await getDocs(collection(db, "order"));
        const tableBody = document.getElementById('ordersTable');
        
        if (!tableBody) {
            console.error('Orders table not found');
            return;
        }

        const tbody = tableBody.getElementsByTagName('tbody')[0];
        if (!tbody) {
            console.error('Orders table tbody not found');
            return;
        }
        
        // Clear existing data
        tbody.innerHTML = '';

        for (const docSnap of querySnapshot.docs) {
            const order = docSnap.data();
            const row = document.createElement('tr');
            
            // Format order_date timestamp if it exists
            let orderDateDisplay = '';
            if (order.order_date && order.order_date.toDate) {
                orderDateDisplay = order.order_date.toDate().toLocaleDateString();
            } else if (order.order_date) {
                orderDateDisplay = new Date(order.order_date).toLocaleDateString();
            }
            
            // Format total_amount
            const totalAmountDisplay = typeof order.total_amount === 'number' ? 
                order.total_amount.toLocaleString() : order.total_amount || '';
            
            // Get display names for foreign keys
            let farmerName = order.farmer_id || '';
            
            try {
                if (DISPLAY_FORMATTERS && DISPLAY_FORMATTERS.farmer_id) {
                    farmerName = await DISPLAY_FORMATTERS.farmer_id(order.farmer_id);
                }
            } catch (error) {
                console.error('Error formatting display names:', error);
            }
            
            // Create row HTML
            row.innerHTML = `
                <td>${docSnap.id}</td>
                <td>${farmerName}</td>
                <td>${orderDateDisplay}</td>
                <td>${totalAmountDisplay}</td>
                <td><span class="status ${order.status || 'pending'}">${order.status || 'Pending'}</span></td>
                <td>
                    <button onclick="updateStatus('${docSnap.id}', 'processing')">Mark Processing</button>
                    <button onclick="updateStatus('${docSnap.id}', 'completed')">Mark Completed</button>
                </td>
            `;
            
            tbody.appendChild(row);
        }
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error fetching orders: ", error.code || '', msg);
        alert(`An error occurred while fetching orders: ${msg}`);
    }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        const orderRef = doc(db, "order", orderId);
        const docSnap = await getDoc(orderRef);
        const oldData = docSnap.exists() ? docSnap.data() : null;
        
        const updateData = {
            status: newStatus,
            updated_at: serverTimestamp()
        };
        
        // Update the order
        await updateDoc(orderRef, updateData);
        
        // Log the update
        await logUpdate('order', orderId, updateData, oldData);
        
        alert("Order status updated successfully!");
        await fetchOrders(); // Refresh the orders table
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error updating order status: ", error.code || '', msg);
        
        // Log the error
        await logError('order', "Failed to update order status", { 
            orderId, 
            newStatus,
            error: msg
        });
        
        alert(`An error occurred while updating order status: ${msg}`);
    }
}

// Update status function for button clicks
async function updateStatus(orderId, status) {
    await updateOrderStatus(orderId, status);
}

// Make functions available globally for onclick handlers
window.updateStatus = updateStatus;
