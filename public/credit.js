import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Set the Finance Manager field (readonly)
            const managerInput = document.createElement('input');
            managerInput.type = "text";
            managerInput.id = "managerID";
            managerInput.placeholder = "Finance Manager";
            managerInput.readOnly = true;
            managerInput.value = user.email || user.uid;
            // Insert as the first input in the form
            const form = document.getElementById('creditForm');
            form.insertBefore(managerInput, form.firstChild);

            initializeForms();
            fetchCreditData();
        } else {
            window.location.href = "login.html";
        }
    });
});

// Role-based page access control
const allowedRoles = {
  "payment.html": ["admin", "finance_manager"],
  "credit.html": ["admin", "finance_manager"],
  "delivery.html": ["admin", "dispatch_manager", "driver"],
  "inventory.html": ["admin", "inventory_manager"],
  "stock.html": ["admin", "inventory_manager"],
  "learning.html": ["admin", "trainer"],
  // Add more as needed
};

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    const userDoc = await getDoc(doc(db, "Users", user.uid));
    const userRole = userDoc.exists() ? (userDoc.data().role || userDoc.data().userRole) : null;
    const page = window.location.pathname.split('/').pop();
    if (allowedRoles[page] && !allowedRoles[page].includes(userRole)) {
      window.location.href = "404.html";
    }
  });
});

// Fetch and display credit data
async function fetchCreditData() {
    try {
        const querySnapshot = await getDocs(collection(db, "Credit"));
        const creditTableBody = document.getElementById('creditTable').getElementsByTagName('tbody')[0];
        creditTableBody.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const credit = docSnap.data();
            // Repayment Value = ((100 + interest) * amount) / 100
            const repaymentValue = ((100 + Number(credit.interest)) * Number(credit.amount)) / 100;
            const row = document.createElement('tr');
            row.innerHTML = `
    <td>${docSnap.id}</td>
    <td>${credit.amount}</td>
    <td>${credit.interest}</td>
    <td>${repaymentValue.toFixed(2)}</td>
    <td>${credit.dateIssued && credit.dateIssued.seconds ? new Date(credit.dateIssued.seconds * 1000).toLocaleDateString() : ''}</td>
    <td>${credit.userEmail}</td>
    <td>${credit.status}</td>
    <td>${credit.financeManager || ''}</td>
    <td>
        <button onclick="editCredit('${docSnap.id}', ${credit.amount}, ${credit.interest}, '${credit.dateIssued && credit.dateIssued.seconds ? new Date(credit.dateIssued.seconds * 1000).toISOString().split('T')[0] : ''}', '${credit.userEmail}', '${credit.status}', '${credit.financeManager || ''}')">Edit</button>
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

// Only use these fields for Credit:
// - creditID: string
// - amount: number
// - date: DateTime
// - employeeID: string
// Remove all other fields and logic related to other properties.

// Add or update credit entry
async function addOrUpdateCredit(creditId, amount, interest, dateIssued, userEmail, status) {
    try {
        const financeManager = document.getElementById('managerID').value;
        const creditData = { amount, interest, dateIssued: new Date(dateIssued), userEmail, status, financeManager };
        let docRef;
        if (creditId) {
            const creditRef = doc(db, "Credit", creditId);
            await updateDoc(creditRef, creditData);
            docRef = creditRef;
            await logDatabaseActivity('update', 'Credit', creditId, creditData);
        } else {
            docRef = await addDoc(collection(db, "Credit"), creditData);
            await logDatabaseActivity('create', 'Credit', docRef.id, creditData);
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
        const creditRef = doc(db, "Credit", creditId);
        await deleteDoc(creditRef);
        await logDatabaseActivity('delete', 'Credit', creditId, {});
        fetchCreditData();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error deleting credit: ", error.code || '', msg);
        alert(`An error occurred while deleting the credit: ${msg}`);
    }
}

// Edit credit entry
window.editCredit = function (creditId, amount, interest, dateIssued, userEmail, status) {
    document.getElementById('amount').value = amount;
    document.getElementById('interest').value = interest;
    document.getElementById('dateIssued').value = dateIssued;
    document.getElementById('userEmail').value = userEmail;
    document.getElementById('status').value = status;
    document.getElementById('creditForm').dataset.creditId = creditId;
}

// Delete credit entry (make sure it's globally accessible)
window.deleteCredit = deleteCredit;

// Event listener for form submission
function initializeForms() {
    document.getElementById('creditForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const creditId = event.target.dataset.creditId || null;
        const amount = parseFloat(document.getElementById('amount').value);
        const interest = parseFloat(document.getElementById('interest').value);
        const dateIssued = document.getElementById('dateIssued').value;
        const userEmail = document.getElementById('userEmail').value;
        const status = document.getElementById('status').value;
        addOrUpdateCredit(creditId, amount, interest, dateIssued, userEmail, status);
        event.target.reset();
        delete event.target.dataset.creditId;
    });
}

// Credit collection fields:
// - creditID: string
// - amount: number
// - date: string (or DateTime)
// - employeeID: string