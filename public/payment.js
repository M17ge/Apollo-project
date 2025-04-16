import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
            // Redirect to login page
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
        addOrUpdatePayment(paymentID, managerID, paymentMethod, creditID, from, to, invoiceID, date);
        e.target.reset();
        delete e.target.dataset.paymentID;
    });
});

// Fetch and display payments
async function fetchPayments() {
    const querySnapshot = await getDocs(collection(db, "payments"));
    const deliveredTableBody = document.getElementById('deliveredTable').getElementsByTagName('tbody')[0];
    const sentTableBody = document.getElementById('sentTable').getElementsByTagName('tbody')[0];
    deliveredTableBody.innerHTML = ''; // Clear existing data
    sentTableBody.innerHTML = ''; // Clear existing data

    querySnapshot.forEach((doc) => {
        const payment = doc.data();
        const row = document.createElement('tr');
        if (payment.paymentMethod === 'credit') {
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${payment.managerID}</td>
                <td>${payment.paymentMethod}</td>
                <td>${payment.creditID}</td>
                <td>${payment.from}</td>
                <td>${payment.to}</td>
                <td>${new Date(payment.date.seconds * 1000).toLocaleDateString()}</td>
                <td>
                    <button onclick="editPayment('${doc.id}', '${payment.managerID}', '${payment.paymentMethod}', '${payment.creditID}', '${payment.from}', '${payment.to}', '${payment.invoiceID}', '${new Date(payment.date.seconds * 1000).toISOString().split('T')[0]}')">Edit</button>
                    <button onclick="deletePayment('${doc.id}')">Delete</button>
                </td>
            `;
            deliveredTableBody.appendChild(row);
        } else {
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${payment.managerID}</td>
                <td>${payment.paymentMethod}</td>
                <td>${payment.from}</td>
                <td>${payment.to}</td>
                <td>${payment.invoiceID}</td>
                <td>${new Date(payment.date.seconds * 1000).toLocaleDateString()}</td>
                <td>
                    <button onclick="editPayment('${doc.id}', '${payment.managerID}', '${payment.paymentMethod}', '${payment.creditID}', '${payment.from}', '${payment.to}', '${payment.invoiceID}', '${new Date(payment.date.seconds * 1000).toISOString().split('T')[0]}')">Edit</button>
                    <button onclick="deletePayment('${doc.id}')">Delete</button>
                </td>
            `;
            sentTableBody.appendChild(row);
        }
    });
}

// Add or update payment entry
async function addOrUpdatePayment(paymentID, managerID, paymentMethod, creditID, from, to, invoiceID, date) {
    if (paymentID) {
        const paymentRef = doc(db, "payments", paymentID);
        await updateDoc(paymentRef, { managerID, paymentMethod, creditID, from, to, invoiceID, date: new Date(date) });
    } else {
        await addDoc(collection(db, "payments"), { managerID, paymentMethod, creditID, from, to, invoiceID, date: new Date(date) });
    }
    fetchPayments();
}

// Delete payment entry
async function deletePayment(paymentID) {
    await deleteDoc(doc(db, "payments", paymentID));
    fetchPayments();
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

// Fetch and display payments on page load
document.addEventListener('DOMContentLoaded', fetchPayments);