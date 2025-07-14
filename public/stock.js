import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is logged in:", user);
            initializeForms();
            fetchStock();
        } else {
            console.log("No user is logged in");
            // Redirect to login page
            window.location.href = "login.html";
        }
    });
});

function initializeForms() {
    // Stock form submission
    document.getElementById('stockForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const itemName = document.getElementById('itemName').value;
        const quantity = document.getElementById('quantity').value;
        const category = document.getElementById('category').value;
        const price = document.getElementById('price').value;
        const shortDescription = document.getElementById('shortDescription').value;
        const longDescription = document.getElementById('longDescription').value;
        const imageAsset = document.getElementById('imageAsset').value;

        try {
            // Create a new stock document and get its ID for reference
            const stockDocRef = await addDoc(collection(db, 'stock'), {
                itemName,
                quantity,
                category,
                price,
                shortDescription,
                longDescription,
                imageAsset
            });
            // Use the generated document ID as the stockId (for foreign key/reference)
            await logDatabaseActivity('create', 'stock', stockDocRef.id, { itemName, quantity, category, price, shortDescription, longDescription, imageAsset });
            console.log("Stock item added with ID: ", stockDocRef.id);
            fetchStock(); // Refresh the stock list
        } catch (e) {
            console.error("Error adding stock item: ", e.code, e.message);
            alert(`An error occurred while adding the stock item: ${e.message}`);
        }
    });
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
        await addDoc(collection(db, "reports"), logData);
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error logging activity: ", error.code || '', msg);
        alert(`An error occurred while logging activity: ${msg}`);
    }
}

// Fetch and display stock data
async function fetchStock() {
    try {
        const querySnapshot = await getDocs(collection(db, "stock"));
        const inStockTableBody = document.getElementById('inStockTable').getElementsByTagName('tbody')[0];
        const outOfStockTableBody = document.getElementById('outOfStockTable').getElementsByTagName('tbody')[0];
        inStockTableBody.innerHTML = ''; // Clear existing data
        outOfStockTableBody.innerHTML = ''; // Clear existing data

        querySnapshot.forEach((doc) => {
            const stock = doc.data();
            const row = document.createElement('tr');
            row.insertCell(0).textContent = stock.stockId;
            row.insertCell(1).textContent = stock.itemName;
            row.insertCell(2).textContent = stock.quantity;
            row.insertCell(3).textContent = stock.category;
            row.insertCell(4).textContent = stock.price;
            row.insertCell(5).textContent = stock.shortDescription;
            row.insertCell(6).textContent = stock.longDescription;
            row.insertCell(7).textContent = stock.imageAsset;
            row.insertCell(8).textContent = 'Actions'; // Placeholder for actions

            if (stock.quantity > 0) {
                inStockTableBody.appendChild(row);
            } else {
                outOfStockTableBody.appendChild(row);
            }
        });
    } catch (e) {
        console.error("Error fetching stock data: ", e.code, e.message);
        alert(`An error occurred while fetching stock data: ${e.message}`);
    }
}