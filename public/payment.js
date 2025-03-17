import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is logged in:", user);
            // Set the manager ID in the form field
            document.getElementById('managerID').value = user.uid;
            initializeForms();
        } else {
            console.log("No user is logged in");
            // Redirect to login page
            window.location.href = "login.html";
        }
    });
});

function initializeForms() {
    // Generate and set payment ID for payment form
    (async () => {
        try {
            const paymentRef = doc(collection(db, 'payments'));
            const newPaymentID = paymentRef.id;
            document.getElementById('paymentID').value = newPaymentID;
        } catch (error) {
            console.error("Error generating payment ID: ", error);
        }
    })();

    // Payment form submission
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

        try {
            const docRef = await addDoc(collection(db, "payments"), {
                paymentID,
                managerID,
                paymentMethod,
                creditID,
                from,
                to,
                invoiceID,
                date
            });
            console.log("Document written with ID: ", docRef.id);
            // Optionally, you can clear the form fields here
            if (from === 'Farmer' && to === 'Apollo') {
                addRowToTable('deliveredTable', docRef.id, managerID, paymentMethod, creditID, from, to, invoiceID, date);
            } else if (from === 'Apollo' && to === 'Supplier') {
                addRowToTable('sentTable', docRef.id, managerID, paymentMethod, creditID, from, to, invoiceID, date);
            }
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    });

    // Fetch and display payment data
    (async () => {
        const querySnapshot = await getDocs(collection(db, "payments"));
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.from === 'Farmer' && data.to === 'Apollo') {
                addRowToTable('deliveredTable', doc.id, data.managerID, data.paymentMethod, data.creditID, data.from, data.to, data.invoiceID, data.date);
            } else if (data.from === 'Apollo' && data.to === 'Supplier') {
                addRowToTable('sentTable', doc.id, data.managerID, data.paymentMethod, data.creditID, data.from, data.to, data.invoiceID, data.date);
            }
        });
    })();
}

function addRowToTable(tableID, paymentID, managerID, paymentMethod, creditID, from, to, invoiceID, date) {
    const tableBody = document.getElementById(tableID).getElementsByTagName('tbody')[0];
    const row = tableBody.insertRow();
    row.insertCell(0).textContent = paymentID;
    row.insertCell(1).textContent = managerID;
    row.insertCell(2).textContent = paymentMethod;
    row.insertCell(3).textContent = creditID;
    row.insertCell(4).textContent = from;
    row.insertCell(5).textContent = to;
    row.insertCell(6).textContent = invoiceID;
    row.insertCell(7).textContent = date;
    row.insertCell(8).textContent = 'Actions'; // Placeholder for actions
}