import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
            const stockRef = doc(collection(db, 'stock'));
            const stockId = stockRef.id;
            await addDoc(stockRef, {
                stockId,
                itemName,
                quantity,
                category,
                price,
                shortDescription,
                longDescription,
                imageAsset
            });
            console.log("Stock item added with ID: ", stockId);
            fetchStock(); // Refresh the stock list
        } catch (e) {
            console.error("Error adding stock item: ", e);
        }
    });
}

// Fetch and display stock data
async function fetchStock() {
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
}