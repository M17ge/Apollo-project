import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    getDoc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
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
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    console.log("Stock management system starting...");
    
    try {
        logActivity('stock_init', 'stock_system', null, { action: 'stock_system_initialized' });
    } catch (error) {
        console.warn('Logging failed:', error);
    }
    
    initializeForms();
    fetchProducts();
});

function initializeForms() {
    // Load dropdown data
    loadInventoryDropdown();
    loadProductDropdown();

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
        const inventoryId = document.getElementById('inventory_id').value;
        const arrived = document.getElementById('arrived').value === 'true';

        // Create product data object with foreign key validation
        const productData = {
            name,
            description,
            category,
            price,
            quantity,
            arrived,
            created_at: serverTimestamp()
        };
        
        // Add inventory_id if provided (foreign key)
        if (inventoryId) {
            productData.inventory_id = inventoryId;
        }

        // Basic validation
        if (!productName || !category || !price || !quantity) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            // Check if we're updating or creating
            if (productId) {
                // Get old data for logging
                const productRef = doc(db, 'products', productId);
                const oldDataSnap = await getDoc(productRef);
                const oldData = oldDataSnap.exists() ? oldDataSnap.data() : null;
                
                // Update existing product
                await updateDoc(productRef, productData);
                
                // Log the update
                try {
                    logUpdate('products', productId, productData, oldData);
                } catch (logError) {
                    console.warn('Logging failed:', logError);
                }
                
                console.log("Product updated with ID: ", productId);
                alert("Product updated successfully!");
            } else {
                // Create a new product document
                const productDocRef = await addDoc(collection(db, 'products'), productData);
                
                // Log the creation
                try {
                    logCreate('products', productDocRef.id, productData);
                } catch (logError) {
                    console.warn('Logging failed:', logError);
                }
                
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
            try {
                logError('stock_system', 'Failed to save product', { name: productName, error: msg });
            } catch (logError) {
                console.warn('Error logging failed:', logError);
            }
            
            alert(`An error occurred: ${msg}`);
        }
    });

    // Manual stock adjustment form submission
    document.getElementById('stockAdjustmentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productId = document.getElementById('adjustProductId').value;
        const quantity = parseInt(document.getElementById('adjustQuantity').value);
        const reason = document.getElementById('adjustReason').value;
        
        if (!productId || !quantity || quantity <= 0 || !reason) {
            alert('Please fill in all fields with valid values');
            return;
        }
        
        try {
            const result = await reduceStockQuantity(productId, quantity);
            alert(`Stock reduced successfully!\n${result.productName}: ${result.previousQuantity} → ${result.newQuantity}\nReason: ${reason}`);
            
            // Reset form
            document.getElementById('stockAdjustmentForm').reset();
            
            // Refresh product dropdown
            loadProductDropdown();
            
        } catch (error) {
            alert(`Error reducing stock: ${error.message}`);
        }
    });
}

// Load inventory dropdown data
async function loadInventoryDropdown() {
    try {
        const inventorySelect = document.getElementById('inventory_id');
        if (!inventorySelect) return;
        
        // Clear existing options except the first one
        while (inventorySelect.options.length > 1) {
            inventorySelect.remove(1);
        }
        
        const querySnapshot = await getDocs(collection(db, "inventory"));
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${doc.id} - ${data.Description || 'No description'}`;
            inventorySelect.appendChild(option);
        });
        
    } catch (error) {
        console.error("Error loading inventory dropdown:", error);
        try {
            logError('stock_system', 'Error loading inventory dropdown', { error: error.message });
        } catch (logError) {
            console.warn('Error logging failed:', logError);
        }
    }
}

// Load product dropdown for stock adjustment
async function loadProductDropdown() {
    try {
        const productSelect = document.getElementById('adjustProductId');
        if (!productSelect) return;
        
        // Clear existing options except the first one
        while (productSelect.options.length > 1) {
            productSelect.remove(1);
        }
        
        const querySnapshot = await getDocs(collection(db, "products"));
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${data.name || 'Unnamed'} (Stock: ${data.quantity || 0})`;
            productSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error("Error loading product dropdown:", error);
    }
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
        
        // Also refresh the product dropdown for stock adjustments
        loadProductDropdown();
        
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
            try {
                logError('stock_system', 'Failed to delete product', { productId, error: msg });
            } catch (logError) {
                console.warn('Error logging failed:', logError);
            }
            
            alert(`An error occurred while deleting the product: ${msg}`);
        }
    }
}

// Function to reduce stock quantity when order is placed
async function reduceStockQuantity(productId, orderQuantity) {
    try {
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
            throw new Error(`Product with ID ${productId} not found`);
        }
        
        const productData = productSnap.data();
        const currentQuantity = productData.quantity || 0;
        
        if (currentQuantity < orderQuantity) {
            throw new Error(`Insufficient stock. Available: ${currentQuantity}, Requested: ${orderQuantity}`);
        }
        
        const newQuantity = currentQuantity - orderQuantity;
        
        await updateDoc(productRef, {
            quantity: newQuantity,
            last_updated: serverTimestamp()
        });
        
        // Log the stock reduction
        try {
            logUpdate('products', productId, 
                { quantity: newQuantity, action: 'stock_reduced', order_quantity: orderQuantity },
                { quantity: currentQuantity }
            );
        } catch (logError) {
            console.warn('Logging failed:', logError);
        }
        
        console.log(`Stock reduced for product ${productId}: ${currentQuantity} -> ${newQuantity}`);
        
        // Refresh the products display
        fetchProducts();
        
        return {
            success: true,
            previousQuantity: currentQuantity,
            newQuantity: newQuantity,
            productName: productData.name
        };
        
    } catch (error) {
        console.error("Error reducing stock quantity:", error);
        
        try {
            logError('stock_system', 'Failed to reduce stock quantity', { 
                productId, 
                orderQuantity, 
                error: error.message 
            });
        } catch (logError) {
            console.warn('Error logging failed:', logError);
        }
        
        throw error;
    }
}

// Function to process multiple product orders and reduce stock
async function processOrderStockReduction(orderData) {
    try {
        const results = [];
        const productIds = Array.isArray(orderData.product_id) ? orderData.product_id : [orderData.product_id];
        const quantities = Array.isArray(orderData.quantity) ? orderData.quantity : [orderData.quantity];
        
        if (productIds.length !== quantities.length) {
            throw new Error('Product IDs and quantities arrays must have the same length');
        }
        
        // Process each product in the order
        for (let i = 0; i < productIds.length; i++) {
            const productId = productIds[i];
            const quantity = parseInt(quantities[i]) || 0;
            
            if (quantity > 0) {
                const result = await reduceStockQuantity(productId, quantity);
                results.push({
                    productId,
                    quantity,
                    ...result
                });
            }
        }
        
        return {
            success: true,
            results: results,
            totalProductsProcessed: results.length
        };
        
    } catch (error) {
        console.error("Error processing order stock reduction:", error);
        throw error;
    }
}

// Make functions available globally for onclick handlers
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.reduceStockQuantity = reduceStockQuantity;
window.processOrderStockReduction = processOrderStockReduction;