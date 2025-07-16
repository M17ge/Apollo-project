import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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
        querySnapshot.forEach((docSnap) => {
            const credit = docSnap.data();
            const row = document.createElement('tr');
            row.innerHTML = `
    <td>${docSnap.id}</td>
    <td>${credit.Amount || ''}</td>
    <td>${credit.Approved_by || ''}</td>
    <td>${credit.Cleared ? 'Yes' : 'No'}</td>
    <td>${credit.Description_of_credit || ''}</td>
    <td>${credit.farmer_id || ''}</td>
    <td>${credit.order_id || ''}</td>
    <td>
        <button onclick="editCredit('${docSnap.id}', '${credit.Amount || ''}', '${credit.Approved_by || ''}', ${credit.Cleared}, '${credit.Description_of_credit || ''}', '${credit.farmer_id || ''}', '${credit.order_id || ''}')">Edit</button>
        <button onclick="deleteCredit('${docSnap.id}')">Delete</button>
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

// Add or update credit entry
async function addOrUpdateCredit(creditId, amount, approvedBy, cleared, description, farmerId, orderId) {
    try {
        const creditData = { 
            Amount: amount, 
            Approved_by: approvedBy,
            Cleared: cleared === 'true',
            Description_of_credit: description,
            farmer_id: farmerId,
            order_id: orderId
        };
        
        let docRef;
        if (creditId) {
            const creditRef = doc(db, "credit_requests", creditId);
            await updateDoc(creditRef, creditData);
            docRef = creditRef;
            await logDatabaseActivity('update', 'credit_requests', creditId, creditData);
        } else {
            docRef = await addDoc(collection(db, "credit_requests"), creditData);
            await logDatabaseActivity('create', 'credit_requests', docRef.id, creditData);
        }
        fetchCreditData();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error adding/updating credit: ", error.code || '', msg);
        alert(`An error occurred while saving the credit: ${msg}`);
    }
}

// Delete credit entry
async function deleteCredit(creditId) {
    try {
        const creditRef = doc(db, "credit_requests", creditId);
        await deleteDoc(creditRef);
        await logDatabaseActivity('delete', 'credit_requests', creditId, {});
        fetchCreditData();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error deleting credit: ", error.code || '', msg);
        alert(`An error occurred while deleting the credit: ${msg}`);
    }
}

// Edit credit entry
window.editCredit = function (creditId, amount, approvedBy, cleared, description, farmerId, orderId) {
    document.getElementById('creditId').value = creditId;
    document.getElementById('amount').value = amount;
    document.getElementById('approvedBy').value = approvedBy;
    document.getElementById('cleared').value = cleared ? 'true' : 'false';
    document.getElementById('description').value = description;
    document.getElementById('farmerId').value = farmerId;
    document.getElementById('orderId').value = orderId;
    document.getElementById('creditForm').dataset.creditId = creditId;
}

// Delete credit entry (make sure it's globally accessible)
window.deleteCredit = deleteCredit;

// Event listener for form submission
function initializeForms() {
    document.getElementById('creditForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const creditId = document.getElementById('creditId').value || null;
        const amount = document.getElementById('amount').value;
        const approvedBy = document.getElementById('approvedBy').value;
        const cleared = document.getElementById('cleared').value;
        const description = document.getElementById('description').value;
        const farmerId = document.getElementById('farmerId').value;
        const orderId = document.getElementById('orderId').value;
        
        addOrUpdateCredit(creditId, amount, approvedBy, cleared, description, farmerId, orderId);
        event.target.reset();
        delete event.target.dataset.creditId;
    });
}