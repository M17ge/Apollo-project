import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, getDocs, updateDoc, doc, getDoc, serverTimestamp, query, where } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { logUpdate, logActivity, logError } from './logging.js';
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

let currentDriverId = null;

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Driver logged in:", user);
            currentDriverId = user.uid;
            
            // Initialize the driver dashboard
            initializeDriverDashboard();
            
            // Set up form submission
            document.getElementById('orderStatusForm').addEventListener('submit', handleOrderStatusUpdate);
            
        } else {
            console.log("No user is logged in");
            window.location.href = "login.html";
        }
    });
});

async function initializeDriverDashboard() {
    try {
        // Populate order dropdown
        await populateDriverOrders();
        
        // Load driver's assigned dispatches
        await fetchDriverDispatches();
        
        // Load driver's assigned orders
        await fetchDriverOrders();
        
    } catch (error) {
        console.error("Error initializing driver dashboard:", error);
        alert("Error loading driver dashboard. Please refresh the page.");
    }
}

// Populate the order dropdown with orders assigned to this driver
async function populateDriverOrders() {
    try {
        const orderSelect = document.getElementById('orderSelect');
        orderSelect.innerHTML = '<option value="">Select an order to update</option>';
        
        // Query orders where this driver is assigned
        const ordersSnapshot = await getDocs(collection(db, "order"));
        
        ordersSnapshot.forEach((doc) => {
            const orderData = doc.data();
            // Check if this order is assigned to current driver through dispatch
            if (orderData.dispatch_manager_id === currentDriverId || orderData.assigned_driver === currentDriverId) {
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = `Order ${doc.id.substring(0, 8)} - ${orderData.farmer_id ? 'Farmer: ' + orderData.farmer_id.substring(0, 8) : 'No Farmer'}`;
                orderSelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Error populating driver orders:", error);
    }
}

// Fetch all dispatches (not filtered by driver)
async function fetchDriverDispatches() {
    try {
        // Get all dispatches instead of filtering by driver
        const querySnapshot = await getDocs(collection(db, "dispatch"));
        
        const dispatchTableBody = document.getElementById('driverDispatchTable').getElementsByTagName('tbody')[0];
        dispatchTableBody.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const dispatch = doc.data();
            const row = document.createElement('tr');
            
            // Format dispatch time
            let dispatchTimeDisplay = '';
            if (dispatch.disTim && dispatch.disTim.seconds) {
                dispatchTimeDisplay = new Date(dispatch.disTim.seconds * 1000).toLocaleString();
            } else if (dispatch.disTim) {
                dispatchTimeDisplay = new Date(dispatch.disTim).toLocaleString();
            }
            
            row.innerHTML = `
                <td>${doc.id.substring(0, 8)}</td>
                <td>${dispatchTimeDisplay}</td>
                <td>${dispatch.location || ''}</td>
                <td>${dispatch.vehicle || ''}</td>
                <td>${dispatch.order_id ? dispatch.order_id.substring(0, 8) : 'N/A'}</td>
                <td>${dispatch.driver_id ? dispatch.driver_id.substring(0, 8) : 'N/A'}</td>
                <td>
                    <span class="status-badge ${dispatch.dispatched ? 'delivered' : 'pending'}">
                        ${dispatch.dispatched ? 'Dispatched' : 'Pending'}
                    </span>
                </td>
                <td>
                    <button onclick="markDispatchDelivered('${doc.id}')" class="btn-delivered" ${dispatch.dispatched ? 'disabled' : ''}>
                        <i class="fas fa-check"></i> Mark Delivered
                    </button>
                </td>
            `;
            
            dispatchTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching driver dispatches:", error);
        alert("Error loading dispatches. Please try again.");
    }
}

// Fetch all orders (not filtered by driver)
async function fetchDriverOrders() {
    try {
        const ordersSnapshot = await getDocs(collection(db, "order"));
        const ordersTableBody = document.getElementById('driverOrdersTable').getElementsByTagName('tbody')[0];
        ordersTableBody.innerHTML = '';
        
        ordersSnapshot.forEach((doc) => {
            const order = doc.data();
            
            // Show all orders regardless of driver assignment
            const row = document.createElement('tr');
            
            // Format ETA
            let etaDisplay = '';
            if (order.ETA && order.ETA.toDate) {
                etaDisplay = order.ETA.toDate().toLocaleString();
            } else if (order.ETA) {
                etaDisplay = new Date(order.ETA).toLocaleString();
            }
            
            // Format products array
            let productsDisplay = '';
            if (order.products && Array.isArray(order.products)) {
                productsDisplay = order.products.join(', ');
            } else if (order.products) {
                productsDisplay = order.products;
            }
            
            row.innerHTML = `
                <td>${doc.id.substring(0, 8)}</td>
                <td>${order.farmer_id ? order.farmer_id.substring(0, 8) : 'N/A'}</td>
                <td>${productsDisplay}</td>
                <td>${order.quantity || 'N/A'}</td>
                <td>${order.delivery_location || order.location || 'N/A'}</td>
                <td>${order.dispatch_manager_id ? order.dispatch_manager_id.substring(0, 8) : 'N/A'}</td>
                <td>
                    <span class="status-badge ${order.order_status || 'pending'}">
                        ${order.order_status || 'pending'}
                    </span>
                </td>
                <td>${etaDisplay}</td>
                <td>
                    <button onclick="quickUpdateStatus('${doc.id}', 'delivered')" class="btn-delivered">
                        <i class="fas fa-check"></i> Delivered
                    </button>
                    <button onclick="quickUpdateStatus('${doc.id}', 'failed')" class="btn-failed">
                        <i class="fas fa-times"></i> Failed
                    </button>
                </td>
            `;
            
            ordersTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching driver orders:", error);
        alert("Error loading orders. Please try again.");
    }
}

// Handle order status update form submission
async function handleOrderStatusUpdate(e) {
    e.preventDefault();
    
    const orderId = document.getElementById('orderSelect').value;
    const deliveryStatus = document.getElementById('deliveryStatus').value;
    const deliveryNotes = document.getElementById('deliveryNotes').value;
    const deliveryTime = document.getElementById('deliveryTime').value;
    
    if (!orderId) {
        alert('Please select an order to update');
        return;
    }
    
    try {
        const orderRef = doc(db, "order", orderId);
        const orderSnap = await getDoc(orderRef);
        const oldData = orderSnap.exists() ? orderSnap.data() : null;
        
        const updateData = {
            order_status: deliveryStatus,
            updated_by_driver: currentDriverId,
            last_updated: serverTimestamp()
        };
        
        if (deliveryNotes) {
            updateData.delivery_notes = deliveryNotes;
        }
        
        if (deliveryTime) {
            updateData.delivery_time = new Date(deliveryTime);
        }
        
        // Mark as delivered if status is delivered
        if (deliveryStatus === 'delivered') {
            updateData.delivered = true;
            updateData.delivery_completed_at = serverTimestamp();
        }
        
        await updateDoc(orderRef, updateData);
        
        // Log the update
        await logUpdate('order', orderId, updateData, oldData);
        
        alert(`Order status updated to: ${deliveryStatus}`);
        
        // Reset form
        document.getElementById('orderStatusForm').reset();
        
        // Refresh tables
        await fetchDriverOrders();
        
    } catch (error) {
        console.error("Error updating order status:", error);
        await logError('order', "Failed to update order status", {
            orderId: orderId,
            error: error.message
        });
        alert("Error updating order status. Please try again.");
    }
}

// Quick update order status
async function quickUpdateStatus(orderId, status) {
    try {
        const orderRef = doc(db, "order", orderId);
        const orderSnap = await getDoc(orderRef);
        const oldData = orderSnap.exists() ? orderSnap.data() : null;
        
        const updateData = {
            order_status: status,
            updated_by_driver: currentDriverId,
            last_updated: serverTimestamp()
        };
        
        if (status === 'delivered') {
            updateData.delivered = true;
            updateData.delivery_completed_at = serverTimestamp();
        }
        
        await updateDoc(orderRef, updateData);
        
        // Log the update
        await logUpdate('order', orderId, updateData, oldData);
        
        alert(`Order marked as ${status}`);
        
        // Refresh tables
        await fetchDriverOrders();
        
    } catch (error) {
        console.error(`Error marking order as ${status}:`, error);
        alert(`Error updating order status. Please try again.`);
    }
}

// Mark dispatch as delivered
async function markDispatchDelivered(dispatchId) {
    try {
        const dispatchRef = doc(db, "dispatch", dispatchId);
        const dispatchSnap = await getDoc(dispatchRef);
        const oldData = dispatchSnap.exists() ? dispatchSnap.data() : null;
        
        const updateData = {
            dispatched: true,
            delivery_completed_at: serverTimestamp(),
            completed_by_driver: currentDriverId
        };
        
        await updateDoc(dispatchRef, updateData);
        
        // Log the update
        await logUpdate('dispatch', dispatchId, updateData, oldData);
        
        alert("Dispatch marked as delivered!");
        
        // Refresh dispatch table
        await fetchDriverDispatches();
        
    } catch (error) {
        console.error("Error marking dispatch as delivered:", error);
        alert("Error updating dispatch status. Please try again.");
    }
}

// Quick action functions
async function markAllInTransit() {
    if (confirm('Mark all your assigned orders as "In Transit"?')) {
        try {
            // This would require querying and updating multiple orders
            alert('Feature coming soon - Mark all as in transit');
        } catch (error) {
            console.error("Error marking all as in transit:", error);
        }
    }
}

function showMyRoute() {
    alert('Route mapping feature coming soon!');
}

function reportIssue() {
    const issue = prompt('Describe the issue you encountered:');
    if (issue) {
        // Log as an error/issue
        logActivity('driver', 'issue_reported', {
            driver_id: currentDriverId,
            issue_description: issue,
            timestamp: new Date()
        });
        alert('Issue reported successfully. Thank you!');
    }
}

// Make functions available globally
window.markDispatchDelivered = markDispatchDelivered;
window.quickUpdateStatus = quickUpdateStatus;
window.markAllInTransit = markAllInTransit;
window.showMyRoute = showMyRoute;
window.reportIssue = reportIssue;
