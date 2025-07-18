# Apollo Project: Activity Logging Implementation Guide

This guide shows how to implement transaction logging across all modules in the Apollo Project application.

## Step 1: Include the Logging Module

Add this import at the top of your JavaScript file:

```javascript
import { logCreate, logUpdate, logDelete, logActivity, logError } from './logging.js';
```

## Step 2: Log Database Operations

### When Creating Records:

```javascript
// Example: Adding a new inventory item
async function addItem() {
    try {
        // 1. Get form data
        const itemData = {
            name: document.getElementById('itemName').value,
            quantity: parseInt(document.getElementById('quantity').value),
            price: parseFloat(document.getElementById('price').value),
            supplier: document.getElementById('supplier').value,
            addedBy: auth.currentUser.uid,
            createdAt: new Date()
        };
        
        // 2. Add to Firestore
        const docRef = await addDoc(collection(db, "inventory"), itemData);
        
        // 3. Log the creation
        await logCreate("inventory", docRef.id, itemData);
        
        // 4. Update UI
        alert("Item added successfully!");
        // Reset form, update table, etc.
    } catch (error) {
        // Log the error
        await logError("inventory", "Failed to add item", { error: error.message });
        alert("Error adding item: " + error.message);
    }
}
```

### When Updating Records:

```javascript
// Example: Updating a payment record
async function updatePayment(paymentId) {
    try {
        // 1. Get form data for the update
        const updateData = {
            amount: parseFloat(document.getElementById('amount').value),
            status: document.getElementById('status').value,
            updatedAt: new Date()
        };
        
        // 2. Get current data (for the log)
        const docRef = doc(db, "payments", paymentId);
        const docSnap = await getDoc(docRef);
        const oldData = docSnap.exists() ? docSnap.data() : null;
        
        // 3. Update the document
        await updateDoc(docRef, updateData);
        
        // 4. Log the update with both old and new data
        await logUpdate("payments", paymentId, updateData, oldData);
        
        // 5. Update UI
        alert("Payment updated successfully!");
    } catch (error) {
        await logError("payments", "Failed to update payment", { paymentId, error: error.message });
        alert("Error updating payment: " + error.message);
    }
}
```

### When Deleting Records:

```javascript
// Example: Deleting a credit record
async function deleteCredit(creditId) {
    if (!confirm("Are you sure you want to delete this credit record?")) {
        return;
    }
    
    try {
        // 1. Get the data that will be deleted (for logging)
        const docRef = doc(db, "credit", creditId);
        const docSnap = await getDoc(docRef);
        const deletedData = docSnap.exists() ? docSnap.data() : null;
        
        // 2. Delete the document
        await deleteDoc(docRef);
        
        // 3. Log what was deleted
        await logDelete("credit", creditId, deletedData);
        
        // 4. Update UI
        alert("Credit record deleted successfully!");
    } catch (error) {
        await logError("credit", "Failed to delete credit", { creditId, error: error.message });
        alert("Error deleting credit record: " + error.message);
    }
}
```

## Step 3: Log User Actions

For actions that don't change the database but are worth tracking:

```javascript
// Example: When a user exports data or runs a report
function exportInventoryData() {
    // Log the export action
    logActivity('export_data', 'user_actions', null, {
        dataType: 'inventory',
        format: 'excel',
        filters: {
            dateRange: document.getElementById('dateRange').value
        }
    });
    
    // Actual export code...
}
```

## Step 4: Log Page Visits

Add this to your page's initialization code:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // Log page access at the beginning
    logActivity('page_access', 'navigation', null, { 
        page: 'inventory', // Change to your page name
        referrer: document.referrer
    });
    
    // Rest of your initialization code...
});
```

## Benefits

This comprehensive logging provides:

1. Complete audit trail of all data changes
2. User activity tracking
3. Error monitoring
4. Performance insights
5. Security monitoring

## View Logs

All logs are stored in the "reports" collection in Firestore and can be viewed using the Reports module in the application.
