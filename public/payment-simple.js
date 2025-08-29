import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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

// Simple function to load payments
async function loadPayments() {
    try {
        console.log("Loading payments...");
        const querySnapshot = await getDocs(collection(db, "payments"));
        const approvedTable = document.getElementById('approvedTable').getElementsByTagName('tbody')[0];
        const pendingTable = document.getElementById('pendingTable').getElementsByTagName('tbody')[0];
        
        approvedTable.innerHTML = '';
        pendingTable.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const payment = doc.data();
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${payment.Approval_manager || 'N/A'}</td>
                <td>${payment.Status ? 'Approved' : 'Pending'}</td>
                <td>${payment.approval_time || 'N/A'}</td>
                <td>${payment.inventory_id || 'N/A'}</td>
                <td>${payment.order_id || 'N/A'}</td>
                <td>$${payment.total_amount || '0.00'}</td>
                <td>
                    <button onclick="editPayment('${doc.id}')">Edit</button>
                    <button onclick="deletePayment('${doc.id}')">Delete</button>
                </td>
            `;
            
            if (payment.Status === true) {
                approvedTable.appendChild(row);
            } else {
                pendingTable.appendChild(row);
            }
        });
        
        console.log("Payments loaded successfully");
    } catch (error) {
        console.error("Error loading payments:", error);
        alert("Error loading payments: " + error.message);
    }
}

// Simple function to save payment
async function savePayment(paymentId, approvalManager, status, inventoryId, orderId, totalAmount) {
    try {
        console.log("Saving payment...");
        
        const paymentData = {
            Approval_manager: approvalManager,
            Status: status === 'true',
            total_amount: parseFloat(totalAmount),
            approval_time: new Date().toISOString()
        };
        
        // Add optional fields only if they have values
        if (inventoryId && inventoryId.trim() !== '') {
            paymentData.inventory_id = inventoryId.trim();
        }
        
        if (orderId && orderId.trim() !== '') {
            paymentData.order_id = orderId.trim();
        }
        
        if (paymentId) {
            // Update existing
            await updateDoc(doc(db, "payments", paymentId), paymentData);
            alert("Payment updated successfully!");
        } else {
            // Create new
            await addDoc(collection(db, "payments"), paymentData);
            alert("Payment added successfully!");
        }
        
        // Reload payments
        await loadPayments();
        
    } catch (error) {
        console.error("Error saving payment:", error);
        alert("Error saving payment: " + error.message);
    }
}

// Global functions for buttons
window.editPayment = async function(paymentId) {
    try {
        const paymentDoc = await getDoc(doc(db, "payments", paymentId));
        if (paymentDoc.exists()) {
            const payment = paymentDoc.data();
            
            // Fill form
            document.getElementById('paymentID').value = paymentId;
            document.getElementById('approval_manager').value = payment.Approval_manager || '';
            document.getElementById('status').value = payment.Status ? 'true' : 'false';
            document.getElementById('inventory_id').value = payment.inventory_id || '';
            document.getElementById('order_id').value = payment.order_id || '';
            document.getElementById('total_amount').value = payment.total_amount || '';
            
            // Change button text
            document.getElementById('submitPayment').textContent = 'Update Payment';
            
            // Scroll to form
            document.getElementById('paymentForm').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error("Error loading payment:", error);
        alert("Error loading payment: " + error.message);
    }
};

window.deletePayment = async function(paymentId) {
    if (confirm('Are you sure you want to delete this payment?')) {
        try {
            await deleteDoc(doc(db, "payments", paymentId));
            alert("Payment deleted successfully!");
            await loadPayments();
        } catch (error) {
            console.error("Error deleting payment:", error);
            alert("Error deleting payment: " + error.message);
        }
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Payment system starting...");
    
    // Load payments
    await loadPayments();
    
    // Handle form submission
    const form = document.getElementById('paymentForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const paymentId = document.getElementById('paymentID').value;
            const approvalManager = document.getElementById('approval_manager').value;
            const status = document.getElementById('status').value;
            const inventoryId = document.getElementById('inventory_id').value;
            const orderId = document.getElementById('order_id').value;
            const totalAmount = document.getElementById('total_amount').value;
            
            // Basic validation
            if (!approvalManager || approvalManager.trim() === '') {
                alert('Please enter an approval manager');
                return;
            }
            
            if (!totalAmount || isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) <= 0) {
                alert('Please enter a valid total amount');
                return;
            }
            
            await savePayment(paymentId, approvalManager, status, inventoryId, orderId, totalAmount);
            
            // Reset form
            form.reset();
            document.getElementById('submitPayment').textContent = 'Add Payment';
            document.getElementById('paymentID').value = '';
        });
    }
    
    console.log("Payment system initialized successfully");
});
