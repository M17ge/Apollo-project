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
    // Generate and set invoice ID for supplier form
    (async () => {
        try {
            const invoiceRef = doc(collection(db, 'invoices'));
            const newInvoiceID = invoiceRef.id;
            document.getElementById('invoiceID').value = newInvoiceID;
        } catch (error) {
            console.error("Error generating invoice ID: ", error);
        }
    })();

    // Generate and set stock ID for inventory form
    (async () => {
        try {
            const stockRef = doc(collection(db, 'stocks'));
            const newStockID = stockRef.id;
            document.getElementById('stockID').value = newStockID;
        } catch (error) {
            console.error("Error generating stock ID: ", error);
        }
    })();

    // Inventory form submission
    document.getElementById('inventoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const stockID = document.getElementById('stockID').value;
        const quantity = document.getElementById('quantity').value;
        const dateBrought = document.getElementById('dateBrought').value;
        const amount = document.getElementById('amount').value;
        const supplierID = document.getElementById('supplierID').value;
        const managerID = document.getElementById('managerID').value;

        try {
            const docRef = await addDoc(collection(db, "inventory"), {
                stockID,
                quantity,
                dateBrought,
                amount,
                supplierID,
                managerID
            });
            console.log("Document written with ID: ", docRef.id);
            document.getElementById('uniqueID').value = docRef.id;
            // Optionally, you can clear the form fields here
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    });

    // Supplier form submission
    document.getElementById('supplierForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const information = document.getElementById('information').value;
        const invoiceID = document.getElementById('invoiceID').value;
        const dateSupplied = document.getElementById('dateSupplied').value;

        try {
            const docRef = await addDoc(collection(db, "suppliers"), {
                name,
                information,
                invoiceID,
                dateSupplied
            });
            console.log("Document written with ID: ", docRef.id);
            document.getElementById('supplierID').value = docRef.id;
            // Optionally, you can clear the form fields here
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    });

    // Fetch and display inventory data
    (async () => {
        const querySnapshot = await getDocs(collection(db, "inventory"));
        const inventoryTableBody = document.getElementById('inventoryTable').getElementsByTagName('tbody')[0];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = inventoryTableBody.insertRow();
            row.insertCell(0).textContent = doc.id;
            row.insertCell(1).textContent = data.stockID;
            row.insertCell(2).textContent = data.quantity;
            row.insertCell(3).textContent = data.dateBrought;
            row.insertCell(4).textContent = data.amount;
            row.insertCell(5).textContent = data.supplierID;
            row.insertCell(6).textContent = data.managerID; // Display Manager ID
            row.insertCell(7).textContent = 'Actions'; // Placeholder for actions
        });
    })();
}