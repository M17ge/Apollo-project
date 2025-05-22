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
            document.getElementById('managerID').value = user.uid;
            initializeForms();
        } else {
            window.location.href = "login.html";
        }
    });
});

function initializeForms() {
    // Generate and set invoice ID for supplier form
    (async () => {
        try {
            const invoiceRef = doc(collection(db, 'Invoices'));
            document.getElementById('invoiceID').value = invoiceRef.id;
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error generating invoice ID: ", error.code || '', msg);
            alert(`An error occurred while generating invoice ID: ${msg}`);
        }
    })();

    // Generate and set stock ID for inventory form
    (async () => {
        try {
            const stockRef = doc(collection(db, 'Stocks'));
            document.getElementById('stockID').value = stockRef.id;
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error generating stock ID: ", error.code || '', msg);
            alert(`An error occurred while generating stock ID: ${msg}`);
        }
    })();

    // Generate and set inventory ID for inventory form
    (async () => {
        try {
            const inventoryRef = doc(collection(db, 'Inventory'));
            document.getElementById('inventoryID').value = inventoryRef.id;
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error generating inventory ID: ", error.code || '', msg);
            alert(`An error occurred while generating inventory ID: ${msg}`);
        }
    })();

    // Generate and set supplier ID for supplier form
    (async () => {
        try {
            const supplierRef = doc(collection(db, 'Suppliers'));
            document.getElementById('supplierID').value = supplierRef.id;
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error generating supplier ID: ", error.code || '', msg);
            alert(`An error occurred while generating supplier ID: ${msg}`);
        }
    })();

    // Inventory form submission
    document.getElementById('inventoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const inventoryID = document.getElementById('inventoryID').value;
        const stockID = document.getElementById('stockID').value;
        const quantity = document.getElementById('quantity').value;
        const dateBrought = document.getElementById('dateBrought').value;
        const amount = document.getElementById('amount').value;
        const supplierID = document.getElementById('supplierID').value;
        const managerID = document.getElementById('managerID').value;

        try {
            await addDoc(collection(db, "Inventory"), {
                inventoryID,
                stockID,
                quantity,
                dateBrought,
                amount,
                supplierID,
                managerID
            });
            // Generate a new inventory ID for the next entry
            const newInventoryRef = doc(collection(db, 'Inventory'));
            document.getElementById('inventoryID').value = newInventoryRef.id;
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error adding inventory: ", error.code || '', msg);
            alert(`An error occurred while adding inventory: ${msg}`);
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
            await addDoc(collection(db, "Suppliers"), {
                name,
                information,
                invoiceID,
                dateSupplied
            });
            // Generate a new supplier ID for the next entry
            const newSupplierRef = doc(collection(db, 'Suppliers'));
            document.getElementById('supplierID').value = newSupplierRef.id;
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error adding supplier: ", error.code || '', msg);
            alert(`An error occurred while adding supplier: ${msg}`);
        }
    });

    // Fetch and display inventory data
    (async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "Inventory"));
            const inventoryTableBody = document.getElementById('inventoryTable').getElementsByTagName('tbody')[0];
            inventoryTableBody.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const row = inventoryTableBody.insertRow();
                row.insertCell(0).textContent = data.inventoryID || '';
                row.insertCell(1).textContent = data.stockID;
                row.insertCell(2).textContent = data.quantity;
                row.insertCell(3).textContent = data.dateBrought;
                row.insertCell(4).textContent = data.amount;
                row.insertCell(5).textContent = data.supplierID;
                row.insertCell(6).textContent = data.managerID;
                row.insertCell(7).textContent = 'Actions'; // Placeholder for actions
            });
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error fetching inventory: ", error.code || '', msg);
            alert(`An error occurred while fetching inventory: ${msg}`);
        }
    })();
}