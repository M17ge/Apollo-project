import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { logCreate, logUpdate, logDelete, logActivity, logError } from './logging.js';

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
            fetchProducts();
        } else {
            console.log("No user is logged in");
            // Redirect to login page
            window.location.href = "login.html";
        }
    });
});

function initializeForms() {
    // Product form submission
    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const productId = document.getElementById('productId').value;
        const name = document.getElementById('name').value;
        const description = document.getElementById('description').value;
        const category = document.getElementById('category').value;
        const price = parseFloat(document.getElementById('price').value);
        const quantity = parseInt(document.getElementById('quantity').value);
        const inventoryId = document.getElementById('inventory_id').value || null;
        const arrived = document.getElementById('arrived').value === 'true';

        try {
            // Create product data object
            const productData = {
                name,
                description,
                category,
                price,
                quantity,
                arrived
            };
            
            // Add inventory_id only if it has a value
            if (inventoryId) {
                productData.inventory_id = inventoryId;
            }
            
            // Check if we're updating or creating
            if (productId) {
                // Get old data for logging
                const productRef = doc(db, 'products', productId);
                const oldDataSnap = await getDoc(productRef);
                const oldData = oldDataSnap.exists() ? oldDataSnap.data() : null;
                
                // Update existing product
                await updateDoc(productRef, productData);
                
                // Log the update
                await logUpdate('products', productId, productData, oldData);
                
                console.log("Product updated with ID: ", productId);
                alert("Product updated successfully!");
            } else {
                // Add created_at timestamp for new products
                productData.created_at = serverTimestamp();
                
                // Create a new product document
                const productDocRef = await addDoc(collection(db, 'products'), productData);
                
                // Log the creation
                await logCreate('products', productDocRef.id, productData);
                
                console.log("Product added with ID: ", productDocRef.id);
                alert("Product added successfully!");
            }
            
            // Reset the form
            document.getElementById('productForm').reset();
            document.getElementById('productId').value = '';
            document.getElementById('submitProduct').textContent = 'Add Product';
            
            // Refresh the products list
            fetchProducts();
        } catch (e) {
            const msg = e && e.message ? e.message : String(e);
            console.error("Error with product: ", e.code || '', msg);
            
            // Log the error
            await logError('products', "Failed to save product", {
                name: name,
                error: msg
            });
            
            alert(`An error occurred: ${msg}`);
        }
    });
}

// This function is deprecated - using the new logging.js module instead

// Fetch and display products data
async function fetchProducts() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const availableProductsTableBody = document.getElementById('availableProductsTable').getElementsByTagName('tbody')[0];
        const outOfStockTableBody = document.getElementById('outOfStockTable').getElementsByTagName('tbody')[0];
        
        // Clear existing data
        availableProductsTableBody.innerHTML = '';
        outOfStockTableBody.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const row = document.createElement('tr');
            
            // Format created_at timestamp if it exists
            let createdAtDisplay = '';
            if (product.created_at && product.created_at.toDate) {
                createdAtDisplay = product.created_at.toDate().toLocaleString();
            }
            
            // Populate row cells
            row.insertCell(0).textContent = doc.id;
            row.insertCell(1).textContent = product.name || '';
            row.insertCell(2).textContent = product.description || '';
            row.insertCell(3).textContent = product.category || '';
            row.insertCell(4).textContent = product.price || '';
            row.insertCell(5).textContent = product.quantity || '';
            row.insertCell(6).textContent = product.inventory_id || '';
            row.insertCell(7).textContent = createdAtDisplay;
            row.insertCell(8).textContent = product.arrived ? 'Arrived' : 'Not Arrived';
            
            // Add action buttons
            const actionsCell = row.insertCell(9);
            
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.className = 'btn-edit';
            editBtn.onclick = () => editProduct(doc.id);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'btn-delete';
            deleteBtn.onclick = () => deleteProduct(doc.id);
            
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(document.createTextNode(' '));
            actionsCell.appendChild(deleteBtn);

            // Add to appropriate table based on quantity
            if (product.quantity > 0) {
                availableProductsTableBody.appendChild(row);
            } else {
                outOfStockTableBody.appendChild(row);
            }
        });
    } catch (e) {
        console.error("Error fetching products data: ", e.code, e.message);
        alert(`An error occurred while fetching products data: ${e.message}`);
    }
}

// Edit product function
async function editProduct(productId) {
    try {
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
            const productData = productSnap.data();
            
            // Populate form with product data
            document.getElementById('productId').value = productId;
            document.getElementById('name').value = productData.name || '';
            document.getElementById('description').value = productData.description || '';
            document.getElementById('category').value = productData.category || '';
            document.getElementById('price').value = productData.price || '';
            document.getElementById('quantity').value = productData.quantity || '';
            document.getElementById('inventory_id').value = productData.inventory_id || '';
            document.getElementById('arrived').value = productData.arrived ? 'true' : 'false';
            
            // Change button text to indicate update
            document.getElementById('submitProduct').textContent = 'Update Product';
            
            // Scroll to form
            document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
        } else {
            console.error("Product not found");
            alert("Product not found");
        }
    } catch (e) {
        console.error("Error getting product: ", e.code, e.message);
        alert(`An error occurred while getting product data: ${e.message}`);
    }
}

// Delete product function
async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            // Get data before deletion for logging
            const productRef = doc(db, "products", productId);
            const productSnap = await getDoc(productRef);
            const deletedData = productSnap.exists() ? productSnap.data() : null;
            
            // Delete the document
            await deleteDoc(productRef);
            
            // Log the deletion
            await logDelete('products', productId, deletedData);
            
            alert("Product deleted successfully!");
            fetchProducts(); // Refresh the products list
        } catch (e) {
            const msg = e && e.message ? e.message : String(e);
            console.error("Error deleting product: ", e.code || '', msg);
            
            // Log the error
            await logError('products', "Failed to delete product", {
                productId,
                error: msg
            });
            
            alert(`An error occurred while deleting the product: ${msg}`);
        }
    }
}

// Make functions available globally for onclick handlers
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;