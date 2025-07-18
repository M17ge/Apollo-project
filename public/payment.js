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
    // Log page access at the beginning
    logActivity('page_access', 'navigation', null, { 
        page: 'payment',
        referrer: document.referrer
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is logged in:", user);
            document.getElementById('approval_manager').value = user.uid;
            fetchPayments();
        } else {
            console.log("No user is logged in");
            window.location.href = "login.html";
        }
    });

    document.getElementById('paymentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const paymentID = document.getElementById('paymentID').value;
        const approval_manager = document.getElementById('approval_manager').value;
        const status = document.getElementById('status').value === 'true';
        const inventory_id = document.getElementById('inventory_id').value || null;
        const order_id = document.getElementById('order_id').value || null;
        const total_amount = parseFloat(document.getElementById('total_amount').value);
        
        // Call the addOrUpdatePayment function
        await addOrUpdatePayment(paymentID, approval_manager, status, inventory_id, order_id, total_amount);
        
        // Reset form and state
        e.target.reset();
        document.getElementById('submitPayment').textContent = 'Add Payment';
        
        // If we're logged in, reset the approval_manager field to the current user's ID
        if (auth.currentUser) {
            document.getElementById('approval_manager').value = auth.currentUser.uid;
        }
    });
});

// Fetch and display payments
async function fetchPayments() {
    try {
        const querySnapshot = await getDocs(collection(db, "payments"));
        const approvedTableBody = document.getElementById('approvedTable').getElementsByTagName('tbody')[0];
        const pendingTableBody = document.getElementById('pendingTable').getElementsByTagName('tbody')[0];
        
        // Clear existing data
        approvedTableBody.innerHTML = '';
        pendingTableBody.innerHTML = '';

        querySnapshot.forEach((docSnap) => {
            const payment = docSnap.data();
            const row = document.createElement('tr');
            
            // Format approval_time timestamp if it exists
            let approvalTimeDisplay = '';
            if (payment.approval_time && payment.approval_time.toDate) {
                approvalTimeDisplay = payment.approval_time.toDate().toLocaleString();
            }
            
            // Format total_amount with proper currency display
            const totalAmountDisplay = typeof payment.total_amount === 'number' ? 
                payment.total_amount.toLocaleString() : payment.total_amount || '';
            
            // Create row HTML
            row.innerHTML = `
                <td>${docSnap.id}</td>
                <td>${payment.Approval_manager || ''}</td>
                <td>${payment.Status ? 'Approved' : 'Pending'}</td>
                <td>${approvalTimeDisplay}</td>
                <td>${payment.inventory_id || ''}</td>
                <td>${payment.order_id || ''}</td>
                <td>${totalAmountDisplay}</td>
                <td>
                    <button onclick="editPayment('${docSnap.id}')">Edit</button>
                    <button onclick="deletePayment('${docSnap.id}')">Delete</button>
                </td>
            `;
            
            // Add to appropriate table based on status
            if (payment.Status === true) {
                approvedTableBody.appendChild(row);
            } else {
                pendingTableBody.appendChild(row);
            }
        });
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error fetching payments: ", error.code || '', msg);
        alert(`An error occurred while fetching payments: ${msg}`);
    }
}

// Add or update payment entry
async function addOrUpdatePayment(paymentID, approval_manager, status, inventory_id, order_id, total_amount) {
    try {
        // Create the payment data object
        const paymentData = {
            Approval_manager: approval_manager,
            Status: status,
            total_amount: total_amount
        };
        
        // Add optional fields only if they have values
        if (inventory_id) {
            paymentData.inventory_id = inventory_id;
        }
        
        if (order_id) {
            paymentData.order_id = order_id;
        }
        
        let docRef;
        if (paymentID) {
            // Get the old data for logging
            const paymentRef = doc(db, "payments", paymentID);
            const docSnap = await getDoc(paymentRef);
            const oldData = docSnap.exists() ? docSnap.data() : null;
            
            // Update existing payment
            await updateDoc(paymentRef, paymentData);
            docRef = paymentRef;
            
            // Log the update with our new logging module
            await logUpdate('payments', paymentID, paymentData, oldData);
            
            alert("Payment updated successfully!");
        } else {
            // Add approval_time for new payments
            paymentData.approval_time = serverTimestamp();
            
            // Create new payment
            docRef = await addDoc(collection(db, "payments"), paymentData);
            
            // Log the creation with our new logging module
            await logCreate('payments', docRef.id, paymentData);
            
            alert("Payment added successfully!");
        }
        fetchPayments();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error adding/updating payment: ", error.code || '', msg);
        
        // Log the error with our new logging module
        await logError('payment', "Failed to save payment", { 
            paymentID, 
            error: msg,
            attempted_action: paymentID ? 'update' : 'create'
        });
        
        alert(`An error occurred while saving the payment: ${msg}`);
    }
}

// Delete payment entry
async function deletePayment(paymentID) {
    if (confirm('Are you sure you want to delete this payment?')) {
        try {
            // Get the data that will be deleted for logging
            const paymentRef = doc(db, "payments", paymentID);
            const docSnap = await getDoc(paymentRef);
            const deletedData = docSnap.exists() ? docSnap.data() : null;
            
            // Delete the document
            await deleteDoc(paymentRef);
            
            // Log the deletion with our new logging module
            await logDelete('payments', paymentID, deletedData);
            
            alert("Payment deleted successfully!");
            fetchPayments();
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error deleting payment: ", error.code || '', msg);
            
            // Log the error with our new logging module
            await logError('payment', "Failed to delete payment", { 
                paymentID, 
                error: msg
            });
            
            alert(`An error occurred while deleting the payment: ${msg}`);
        }
    }
}

// Edit payment entry
async function editPayment(paymentID) {
    try {
        const paymentRef = doc(db, "payments", paymentID);
        const paymentSnap = await getDoc(paymentRef);
        
        if (paymentSnap.exists()) {
            const paymentData = paymentSnap.data();
            
            // Populate form with payment data
            document.getElementById('paymentID').value = paymentID;
            document.getElementById('approval_manager').value = paymentData.Approval_manager || '';
            document.getElementById('status').value = paymentData.Status ? 'true' : 'false';
            document.getElementById('inventory_id').value = paymentData.inventory_id || '';
            document.getElementById('order_id').value = paymentData.order_id || '';
            document.getElementById('total_amount').value = paymentData.total_amount || '';
            
            // Change button text to indicate update
            document.getElementById('submitPayment').textContent = 'Update Payment';
            
            // Scroll to form
            document.getElementById('paymentForm').scrollIntoView({ behavior: 'smooth' });
        } else {
            console.error("Payment not found");
            alert("Payment not found");
        }
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error getting payment: ", error.code || '', msg);
        alert(`An error occurred while getting payment data: ${msg}`);
    }
}

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

// Make functions available globally for onclick handlers
window.editPayment = editPayment;
window.deletePayment = deletePayment;