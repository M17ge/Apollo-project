import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is logged in:", user);
            document.getElementById('managerID').value = user.uid;
            fetchPayments();
        } else {
            console.log("No user is logged in");
            window.location.href = "login.html";
        }
    });

    document.getElementById('paymentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const paymentID = document.getElementById('paymentID').value;
        const managerID = document.getElementById('managerID').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const creditID = document.getElementById('creditID').value;
        const from = document.getElementById('from').value;
        const to = document.getElementById('to').value;
        const invoiceID = document.getElementById('invoiceID').value;
        const date = document.getElementById('date').value;
        await addOrUpdatePayment(paymentID, managerID, paymentMethod, creditID, from, to, invoiceID, date);
        e.target.reset();
        delete e.target.dataset.paymentID;
    });
});

// Only use these fields for Payments:
// - paymentID: string
// - from: string
// - to: string
// - date: string
// Remove all other fields and logic related to other properties.

// Payments collection fields:
// - paymentID: string
// - from: string
// - to: string
// - date: string

// Fetch and display payments
async function fetchPayments() {
    try {
        const querySnapshot = await getDocs(collection(db, "payments"));
        const paymentsTableBody = document.getElementById('paymentsTable').getElementsByTagName('tbody')[0];
        paymentsTableBody.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const payment = docSnap.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${docSnap.id}</td>
                <td>${payment['Approval manager']}</td>
                <td>${payment.Status ? 'Approved' : 'Pending'}</td>
                <td>${payment['approval time'] ? new Date(payment['approval time']).toLocaleString() : ''}</td>
                <td>${payment.order_id}</td>
                <td>${payment.inventory_id}</td>
                <td>${payment['total amount']}</td>
                <td>Actions</td>
            `;
            paymentsTableBody.appendChild(row);
        });
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error fetching payments: ", error.code || '', msg);
        alert(`An error occurred while fetching payments: ${msg}`);
    }
}

// Add or update payment entry
async function addOrUpdatePayment(paymentID, managerID, paymentMethod, creditID, from, to, invoiceID, date) {
    try {
        let docRef;
        if (paymentID) {
            const paymentRef = doc(db, "Payments", paymentID);
            await updateDoc(paymentRef, { managerID, paymentMethod, creditID, from, to, invoiceID, date: new Date(date) });
            docRef = paymentRef;
            await logDatabaseActivity('update', 'Payments', paymentID, { managerID, paymentMethod, creditID, from, to, invoiceID, date });
        } else {
            docRef = await addDoc(collection(db, "Payments"), { managerID, paymentMethod, creditID, from, to, invoiceID, date: new Date(date) });
            await logDatabaseActivity('create', 'Payments', docRef.id, { managerID, paymentMethod, creditID, from, to, invoiceID, date });
        }
        fetchPayments();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error adding/updating payment: ", error.code || '', msg);
        alert(`An error occurred while saving the payment: ${msg}`);
    }
}

// Delete payment entry
async function deletePayment(paymentID) {
    try {
        const paymentRef = doc(db, "Payments", paymentID);
        await deleteDoc(paymentRef);
        await logDatabaseActivity('delete', 'Payments', paymentID, {});
        fetchPayments();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error deleting payment: ", error.code || '', msg);
        alert(`An error occurred while deleting the payment: ${msg}`);
    }
}

// Edit payment entry
function editPayment(paymentID, managerID, paymentMethod, creditID, from, to, invoiceID, date) {
    document.getElementById('paymentID').value = paymentID;
    document.getElementById('managerID').value = managerID;
    document.getElementById('paymentMethod').value = paymentMethod;
    document.getElementById('creditID').value = creditID;
    document.getElementById('from').value = from;
    document.getElementById('to').value = to;
    document.getElementById('invoiceID').value = invoiceID;
    document.getElementById('date').value = date;
    document.getElementById('paymentForm').dataset.paymentID = paymentID;
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

// Call fetchPayments on load
if (document.getElementById('paymentsTable')) {
    fetchPayments();
}