import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { logDatabaseActivity } from './reports.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAVhK5GNgwz-DsMilSapF-6OO4LPhyfLXA",
    authDomain: "apollo-project-9c70b.firebaseapp.com",
    projectId: "apollo-project-9c70b",
    storageBucket: "apollo-project-9c70b.firebasestorage.app",
    messagingSenderId: "89948471233",
    appId: "1:89948471233:web:1cb2261333c6539a727940",
    measurementId: "G-GR4K54E6FP"
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

// Fetch and display payments
async function fetchPayments() {
    try {
        const querySnapshot = await getDocs(collection(db, "Payments"));
        const deliveredTableBody = document.getElementById('deliveredTable').getElementsByTagName('tbody')[0];
        const sentTableBody = document.getElementById('sentTable').getElementsByTagName('tbody')[0];
        deliveredTableBody.innerHTML = '';
        sentTableBody.innerHTML = '';

        querySnapshot.forEach((docSnap) => {
            const payment = docSnap.data();
            const row = document.createElement('tr');
            if (payment.paymentMethod === 'credit') {
                row.innerHTML = `
                    <td>${docSnap.id}</td>
                    <td>${payment.managerID}</td>
                    <td>${payment.paymentMethod}</td>
                    <td>${payment.creditID}</td>
                    <td>${payment.from}</td>
                    <td>${payment.to}</td>
                    <td>${payment.invoiceID}</td>
                    <td>${payment.date && payment.date.seconds ? new Date(payment.date.seconds * 1000).toLocaleDateString() : ''}</td>
                    <td>
                        <button onclick="editPayment('${docSnap.id}', '${payment.managerID}', '${payment.paymentMethod}', '${payment.creditID}', '${payment.from}', '${payment.to}', '${payment.invoiceID}', '${payment.date && payment.date.seconds ? new Date(payment.date.seconds * 1000).toISOString().split('T')[0] : ''}')">Edit</button>
                        <button onclick="deletePayment('${docSnap.id}')">Delete</button>
                    </td>
                `;
                deliveredTableBody.appendChild(row);
            } else {
                row.innerHTML = `
                    <td>${docSnap.id}</td>
                    <td>${payment.managerID}</td>
                    <td>${payment.paymentMethod}</td>
                    <td>${payment.from}</td>
                    <td>${payment.to}</td>
                    <td>${payment.invoiceID}</td>
                    <td>${payment.date && payment.date.seconds ? new Date(payment.date.seconds * 1000).toLocaleDateString() : ''}</td>
                    <td>
                        <button onclick="editPayment('${docSnap.id}', '${payment.managerID}', '${payment.paymentMethod}', '${payment.creditID}', '${payment.from}', '${payment.to}', '${payment.invoiceID}', '${payment.date && payment.date.seconds ? new Date(payment.date.seconds * 1000).toISOString().split('T')[0] : ''}')">Edit</button>
                        <button onclick="deletePayment('${docSnap.id}')">Delete</button>
                    </td>
                `;
                sentTableBody.appendChild(row);
            }
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
        if (paymentID) {
            const paymentRef = doc(db, "Payments", paymentID);
            await updateDoc(paymentRef, { managerID, paymentMethod, creditID, from, to, invoiceID, date: new Date(date) });
            await logDatabaseActivity('update', 'Payments', paymentID, { managerID, paymentMethod, creditID, from, to, invoiceID, date });
        } else {
            const docRef = await addDoc(collection(db, "Payments"), { managerID, paymentMethod, creditID, from, to, invoiceID, date: new Date(date) });
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
        await deleteDoc(doc(db, "Payments", paymentID));
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