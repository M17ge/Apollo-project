import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

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
        const Description = document.getElementById('Description').value;
        const TimeOfArrival = document.getElementById('TimeOfArrival').value;
        const TotalPrice = Number(document.getElementById('TotalPrice').value);
        const products = document.getElementById('products').value.split(',').map(p => p.trim());
        const supplier_id = document.getElementById('supplier_id').value;
        try {
            const docRef = await addDoc(collection(db, "inventory"), {
                Description,
                "Time of Arrival": new Date(TimeOfArrival),
                "Total Price": TotalPrice,
                products,
                supplier_id
            });
            await logDatabaseActivity('create', 'inventory', docRef.id, { Description, "Time of Arrival": new Date(TimeOfArrival), "Total Price": TotalPrice, products, supplier_id });
            fetchInventory();
            document.getElementById('inventoryForm').reset();
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
            const docRef = await addDoc(collection(db, "Suppliers"), {
                name,
                information,
                invoiceID,
                dateSupplied
            });
            await logDatabaseActivity('create', 'Suppliers', docRef.id, { name, information, invoiceID, dateSupplied });
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
    fetchInventory();
}

async function fetchInventory() {
    try {
        const querySnapshot = await getDocs(collection(db, "inventory"));
        const inventoryTableBody = document.getElementById('inventoryTable').getElementsByTagName('tbody')[0];
        inventoryTableBody.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const row = inventoryTableBody.insertRow();
            row.insertCell(0).textContent = docSnap.id;
            row.insertCell(1).textContent = data.Description;
            row.insertCell(2).textContent = data["Time of Arrival"] ? new Date(data["Time of Arrival"]).toLocaleString() : '';
            row.insertCell(3).textContent = data["Total Price"];
            row.insertCell(4).textContent = Array.isArray(data.products) ? data.products.join(', ') : '';
            row.insertCell(5).textContent = data.supplier_id || '';
            row.insertCell(6).textContent = 'Actions'; // Placeholder for actions
        });
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error fetching inventory: ", error.code || '', msg);
        alert(`An error occurred while fetching inventory: ${msg}`);
    }
}