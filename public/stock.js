import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fetch and display stock data
async function fetchStock() {
    const querySnapshot = await getDocs(collection(db, "stock"));
    const inStockTableBody = document.getElementById('inStockTable').getElementsByTagName('tbody')[0];
    const outOfStockTableBody = document.getElementById('outOfStockTable').getElementsByTagName('tbody')[0];
    inStockTableBody.innerHTML = ''; // Clear existing data
    outOfStockTableBody.innerHTML = ''; // Clear existing data
    querySnapshot.forEach((doc) => {
        const item = doc.data();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.itemName}</td>
            <td>${item.quantity}</td>
            <td>${item.category}</td>
            <td>${item.price}</td>
            <td>${item.shortDescription}</td>
            <td>${item.longDescription}</td>
            <td>
                <button onclick="editItem('${doc.id}', '${item.itemName}', ${item.quantity}, '${item.category}', ${item.price}, '${item.shortDescription}', '${item.longDescription}')">Edit</button>
                <button onclick="deleteItem('${doc.id}')">Delete</button>
            </td>
        `;
        if (item.quantity === 0) {
            outOfStockTableBody.appendChild(row);
        } else {
            inStockTableBody.appendChild(row);
        }
    });
}

// Add or update stock item
async function addOrUpdateItem(itemId, itemName, quantity, category, price, shortDescription, longDescription) {
    if (itemId) {
        const itemRef = doc(db, "stock", itemId);
        await updateDoc(itemRef, { itemName, quantity, category, price, shortDescription, longDescription });
    } else {
        // Generate a unique stock ID
        const stockId = 'stock-' + Date.now();
        await addDoc(collection(db, "stock"), { stockId, itemName, quantity, category, price, shortDescription, longDescription });
    }
    fetchStock();
}

// Delete stock item
async function deleteItem(itemId) {
    await deleteDoc(doc(db, "stock", itemId));
    fetchStock();
}

// Edit stock item
function editItem(itemId, itemName, quantity, category, price, shortDescription, longDescription) {
    document.getElementById('itemName').value = itemName;
    document.getElementById('quantity').value = quantity;
    document.getElementById('category').value = category;
    document.getElementById('price').value = price;
    document.getElementById('shortDescription').value = shortDescription;
    document.getElementById('longDescription').value = longDescription;
    document.getElementById('stockForm').dataset.itemId = itemId;
}

// Event listener for form submission
document.getElementById('stockForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const itemId = event.target.dataset.itemId || null;
    const itemName = document.getElementById('itemName').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const category = document.getElementById('category').value;
    const price = parseFloat(document.getElementById('price').value);
    const shortDescription = document.getElementById('shortDescription').value;
    const longDescription = document.getElementById('longDescription').value;
    addOrUpdateItem(itemId, itemName, quantity, category, price, shortDescription, longDescription);
    event.target.reset();
    delete event.target.dataset.itemId;
});

// Fetch and display stock data on page load
document.addEventListener('DOMContentLoaded', fetchStock);