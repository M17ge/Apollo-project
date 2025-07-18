import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
// Import logging functions
import { logCreate, logUpdate, logDelete, logActivity, logError } from './logging.js';

// Your web app's Firebase configuration
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
    // Log page access at the beginning
    logActivity('page_access', 'navigation', null, { 
        page: 'credit',
        referrer: document.referrer
    });
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Set the approvedBy field to current user's ID
            document.getElementById('approvedBy').value = user.uid;
            initializeForms();
            fetchCreditData();
        } else {
            window.location.href = "login.html";
        }
    });
});

// Fetch and display credit data
async function fetchCreditData() {
    try {
        const querySnapshot = await getDocs(collection(db, "credit_requests"));
        const creditTableBody = document.getElementById('creditTable').getElementsByTagName('tbody')[0];
        creditTableBody.innerHTML = '';
        
        if (querySnapshot.empty) {
            // If no records found
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="8" style="text-align: center; padding: 20px;">No credit requests found. Create a new request using the form above.</td>`;
            creditTableBody.appendChild(emptyRow);
            return;
        }
        
        querySnapshot.forEach((docSnap) => {
            const credit = docSnap.data();
            const row = document.createElement('tr');
            
            // Format description to prevent HTML injection and handle quotes properly
            const safeDescription = (credit.Description_of_credit || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
            
            // Format amount with currency symbol if present
            const formattedAmount = credit.Amount ? `$${parseFloat(credit.Amount).toFixed(2)}` : '';
            
            row.innerHTML = `
    <td>${docSnap.id}</td>
    <td>${formattedAmount}</td>
    <td>${credit.Approved_by || ''}</td>
    <td><span class="${credit.Cleared ? 'status-cleared' : 'status-pending'}">${credit.Cleared ? 'Yes ✓' : 'No ⏳'}</span></td>
    <td>${safeDescription}</td>
    <td>${credit.farmer_id || ''}</td>
    <td>${credit.order_id || ''}</td>
    <td>
        <button class="action-btn edit-btn" onclick="editCredit('${docSnap.id}', '${credit.Amount || ''}', '${credit.Approved_by || ''}', ${credit.Cleared}, '${safeDescription}', '${credit.farmer_id || ''}', '${credit.order_id || ''}')">
            <i class="fas fa-edit"></i> Edit
        </button>
        <button class="action-btn delete-btn" onclick="deleteCredit('${docSnap.id}')">
            <i class="fas fa-trash"></i> Delete
        </button>
    </td>
`;
            creditTableBody.appendChild(row);
        });
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error fetching credit data: ", error.code || '', msg);
        alert(`An error occurred while fetching credit data: ${msg}`);
    }
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
        await addDoc(collection(db, "Reports"), logData);
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error logging activity: ", error.code || '', msg);
        alert(`An error occurred while logging activity: ${msg}`);
    }
}

// Reset form to add new state
function resetForm() {
    // Reset form fields
    document.getElementById('creditForm').reset();
    document.getElementById('creditId').value = '';
    delete document.getElementById('creditForm').dataset.creditId;
    
    // Reset form title
    const formTitle = document.querySelector('#creditFormContainer h3');
    formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Credit Request';
    formTitle.style.color = '';
    
    // Reset form highlighting
    const formContainer = document.getElementById('creditFormContainer');
    formContainer.style.boxShadow = '';
    
    // Remove cancel button if exists
    const cancelBtn = document.getElementById('cancelEdit');
    if (cancelBtn) {
        cancelBtn.parentNode.removeChild(cancelBtn);
    }
    
    // Reset submit button text
    const submitBtn = document.querySelector('#creditForm button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Add Credit Request';
    
    // Set approvedBy field to current user's ID
    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById('approvedBy').value = user.uid;
        }
    });
}

// Add or update credit entry
async function addOrUpdateCredit(creditId, amount, approvedBy, cleared, description, farmerId, orderId) {
    // Disable form while submitting
    const form = document.getElementById('creditForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        const creditData = { 
            Amount: amount, 
            Approved_by: approvedBy,
            Cleared: cleared === 'true',
            Description_of_credit: description,
            farmer_id: farmerId,
            order_id: orderId,
            timestamp: new Date()
        };
        
        let docRef;
        let actionType;
        
        if (creditId) {
            // Get the old data for logging
            const creditRef = doc(db, "credit_requests", creditId);
            const docSnap = await getDoc(creditRef);
            const oldData = docSnap.exists() ? docSnap.data() : null;
            
            // Update existing credit
            await updateDoc(creditRef, creditData);
            docRef = creditRef;
            
            // Log the update with our new logging module
            await logUpdate('credit_requests', creditId, creditData, oldData);
            
            actionType = 'updated';
        } else {
            // Create new credit
            docRef = await addDoc(collection(db, "credit_requests"), creditData);
            
            // Log the creation with our new logging module
            await logCreate('credit_requests', docRef.id, creditData);
            
            actionType = 'created';
        }
        
        // Success message
        const successMessage = document.createElement('div');
        successMessage.className = 'alert alert-success';
        successMessage.innerHTML = `<strong>Success!</strong> Credit request ${actionType} successfully.`;
        successMessage.style.position = 'fixed';
        successMessage.style.top = '20px';
        successMessage.style.right = '20px';
        successMessage.style.zIndex = '1000';
        document.body.appendChild(successMessage);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            successMessage.style.opacity = '0';
            setTimeout(() => document.body.removeChild(successMessage), 500);
        }, 3000);
        
        // Reset form to new state
        resetForm();
        
        // Refresh data
        fetchCreditData();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error adding/updating credit: ", error.code || '', msg);
        
        // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'alert alert-danger';
        errorMessage.innerHTML = `<strong>Error!</strong> Failed to save credit request: ${msg}`;
        errorMessage.style.position = 'fixed';
        errorMessage.style.top = '20px';
        errorMessage.style.right = '20px';
        errorMessage.style.zIndex = '1000';
        document.body.appendChild(errorMessage);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            errorMessage.style.opacity = '0';
            setTimeout(() => document.body.removeChild(errorMessage), 500);
        }, 5000);
    } finally {
        // Re-enable form
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Delete credit entry
async function deleteCredit(creditId) {
    try {
        // Show confirmation dialog
        if (!confirm("Are you sure you want to delete this credit request? This action cannot be undone.")) {
            return;
        }
        
        // Visual feedback - show loading state
        const allButtons = document.querySelectorAll('.action-btn');
        allButtons.forEach(btn => btn.disabled = true);
        
        const creditRef = doc(db, "credit_requests", creditId);
        
        // Get credit data before deletion for logging
        const creditDoc = await getDoc(creditRef);
        const creditData = creditDoc.exists() ? creditDoc.data() : {};
        
        // Delete the document
        await deleteDoc(creditRef);
        
        // Log the deletion with our new logging module
        await logDelete('credit_requests', creditId, creditData);
        
        // Success message
        const successMessage = document.createElement('div');
        successMessage.className = 'alert alert-success';
        successMessage.innerHTML = '<strong>Success!</strong> Credit request deleted successfully.';
        successMessage.style.position = 'fixed';
        successMessage.style.top = '20px';
        successMessage.style.right = '20px';
        successMessage.style.zIndex = '1000';
        document.body.appendChild(successMessage);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            successMessage.style.opacity = '0';
            setTimeout(() => document.body.removeChild(successMessage), 500);
        }, 3000);
        
        fetchCreditData();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error deleting credit: ", error.code || '', msg);
        
        // Log the error with our new logging module
        await logError('credit', "Failed to delete credit", { 
            creditId, 
            error: msg
        });
        
        // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'alert alert-danger';
        errorMessage.innerHTML = `<strong>Error!</strong> Failed to delete credit request: ${msg}`;
        errorMessage.style.position = 'fixed';
        errorMessage.style.top = '20px';
        errorMessage.style.right = '20px';
        errorMessage.style.zIndex = '1000';
        document.body.appendChild(errorMessage);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            errorMessage.style.opacity = '0';
            setTimeout(() => document.body.removeChild(errorMessage), 500);
        }, 5000);
    } finally {
        // Re-enable buttons
        const allButtons = document.querySelectorAll('.action-btn');
        allButtons.forEach(btn => btn.disabled = false);
    }
}

// Edit credit entry
window.editCredit = function (creditId, amount, approvedBy, cleared, description, farmerId, orderId) {
    // Scroll to form
    document.getElementById('creditFormContainer').scrollIntoView({ behavior: 'smooth' });
    
    // Update form title to indicate editing mode
    const formTitle = document.querySelector('#creditFormContainer h3');
    formTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Credit Request';
    formTitle.style.color = '#00796b';
    
    // Highlight the form to indicate active editing
    const formContainer = document.getElementById('creditFormContainer');
    formContainer.style.boxShadow = '0 0 15px rgba(0, 121, 107, 0.3)';
    
    // Add a cancel button if it doesn't exist
    let cancelBtn = document.getElementById('cancelEdit');
    if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelEdit';
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-cancel';
        cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel Editing';
        cancelBtn.style.backgroundColor = '#f44336';
        cancelBtn.style.color = 'white';
        cancelBtn.style.border = 'none';
        cancelBtn.style.padding = '12px 20px';
        cancelBtn.style.borderRadius = '4px';
        cancelBtn.style.marginTop = '10px';
        cancelBtn.style.marginRight = '10px';
        cancelBtn.style.cursor = 'pointer';
        
        const submitBtn = document.querySelector('#creditForm button[type="submit"]');
        submitBtn.parentNode.insertBefore(cancelBtn, submitBtn);
        
        cancelBtn.addEventListener('click', resetForm);
    }
    
    // Update form values
    document.getElementById('creditId').value = creditId;
    document.getElementById('amount').value = amount;
    document.getElementById('approvedBy').value = approvedBy;
    document.getElementById('cleared').value = cleared ? 'true' : 'false';
    document.getElementById('description').value = description;
    document.getElementById('farmerId').value = farmerId;
    document.getElementById('orderId').value = orderId;
    document.getElementById('creditForm').dataset.creditId = creditId;
    
    // Change submit button text
    const submitBtn = document.querySelector('#creditForm button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Credit Request';
}

// Delete credit entry (make sure it's globally accessible)
window.deleteCredit = deleteCredit;

// Event listener for form submission
function initializeForms() {
    // Update form title with icon
    const formTitle = document.querySelector('#creditFormContainer h3');
    if (formTitle) {
        formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Credit Request';
    }
    
    // Add submit event listener
    const creditForm = document.getElementById('creditForm');
    creditForm.addEventListener('submit', function (event) {
        event.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        const creditId = document.getElementById('creditId').value || null;
        const amount = document.getElementById('amount').value;
        const approvedBy = document.getElementById('approvedBy').value;
        const cleared = document.getElementById('cleared').value;
        const description = document.getElementById('description').value;
        const farmerId = document.getElementById('farmerId').value;
        const orderId = document.getElementById('orderId').value;
        
        addOrUpdateCredit(creditId, amount, approvedBy, cleared, description, farmerId, orderId);
    });
    
    // Add a reset button function
    const addNewBtn = document.createElement('button');
    addNewBtn.type = 'button';
    addNewBtn.className = 'btn-new';
    addNewBtn.innerHTML = '<i class="fas fa-plus"></i> New Request';
    addNewBtn.style.backgroundColor = '#ff9800';
    addNewBtn.style.color = 'white';
    addNewBtn.style.border = 'none';
    addNewBtn.style.padding = '8px 16px';
    addNewBtn.style.borderRadius = '4px';
    addNewBtn.style.margin = '20px 0';
    addNewBtn.style.cursor = 'pointer';
    
    // Add button below the table
    const tableContainer = document.querySelector('.table-responsive');
    tableContainer.insertAdjacentElement('afterend', addNewBtn);
    
    // Add event listener for new button
    addNewBtn.addEventListener('click', function() {
        resetForm();
        document.getElementById('creditFormContainer').scrollIntoView({ behavior: 'smooth' });
    });
}

// Form validation
function validateForm() {
    const amount = document.getElementById('amount').value;
    const description = document.getElementById('description').value;
    const farmerId = document.getElementById('farmerId').value;
    const orderId = document.getElementById('orderId').value;
    
    let isValid = true;
    let errorMessage = '';
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        errorMessage += 'Please enter a valid positive amount.<br>';
        isValid = false;
    }
    
    if (!description || description.trim().length < 10) {
        errorMessage += 'Please enter a detailed description (at least 10 characters).<br>';
        isValid = false;
    }
    
    if (!farmerId || farmerId.trim().length === 0) {
        errorMessage += 'Farmer ID is required.<br>';
        isValid = false;
    }
    
    if (!orderId || orderId.trim().length === 0) {
        errorMessage += 'Order ID is required.<br>';
        isValid = false;
    }
    
    if (!isValid) {
        // Show validation error message
        const validationMessage = document.createElement('div');
        validationMessage.className = 'alert alert-warning';
        validationMessage.innerHTML = `<strong>Form Incomplete:</strong><br>${errorMessage}`;
        validationMessage.style.position = 'fixed';
        validationMessage.style.top = '20px';
        validationMessage.style.right = '20px';
        validationMessage.style.zIndex = '1000';
        document.body.appendChild(validationMessage);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            validationMessage.style.opacity = '0';
            setTimeout(() => document.body.removeChild(validationMessage), 500);
        }, 5000);
    }
    
    return isValid;
}