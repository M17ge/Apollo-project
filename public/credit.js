import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

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
    <td>${credit.Amount}</td>
    <td>${credit["Approved by"]}</td>
    <td>${credit.Cleared}</td>
    <td>${credit["Description of credit"]}</td>
    <td>${credit.farmer_id}</td>
    <td>${credit.order_id}</td>
    <td>
        <button onclick="editCredit('${docSnap.id}', ${credit.Amount}, '${credit["Approved by"]}', ${credit.Cleared}, '${credit["Description of credit"]}', '${credit.farmer_id}', '${credit.order_id}')">Edit</button>
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
async function addOrUpdateCredit(creditId, Amount, ApprovedBy, Cleared, DescriptionOfCredit, farmer_id, order_id) {
    try {
        const creditData = {
            Amount: Number(Amount),
            "Approved by": ApprovedBy,
            Cleared: Cleared === 'true' || Cleared === true,
            "Description of credit": DescriptionOfCredit,
            farmer_id,
            order_id
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
        await logDatabaseActivity('delete', 'Credit', creditId, {});
        fetchCreditData();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error deleting credit: ", error.code || '', msg);
        alert(`An error occurred while deleting the credit: ${msg}`);
    }
}

// Edit credit entry
window.editCredit = function (creditId, Amount, ApprovedBy, Cleared, DescriptionOfCredit, farmer_id, order_id) {
    document.getElementById('Amount').value = Amount;
    document.getElementById('ApprovedBy').value = ApprovedBy;
    document.getElementById('Cleared').checked = Cleared === true || Cleared === 'true';
    document.getElementById('DescriptionOfCredit').value = DescriptionOfCredit;
    document.getElementById('farmer_id').value = farmer_id;
    document.getElementById('order_id').value = order_id;
    document.getElementById('creditForm').dataset.creditId = creditId;
}

// Delete credit entry (make sure it's globally accessible)
window.deleteCredit = deleteCredit;

// Event listener for form submission
function initializeForms() {
    document.getElementById('creditForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const creditId = event.target.dataset.creditId || null;
        const Amount = document.getElementById('Amount').value;
        const ApprovedBy = document.getElementById('ApprovedBy').value;
        const Cleared = document.getElementById('Cleared').checked;
        const DescriptionOfCredit = document.getElementById('DescriptionOfCredit').value;
        const farmer_id = document.getElementById('farmer_id').value;
        const order_id = document.getElementById('order_id').value;
        addOrUpdateCredit(creditId, Amount, ApprovedBy, Cleared, DescriptionOfCredit, farmer_id, order_id);
        event.target.reset();
        delete event.target.dataset.creditId;
    });
}

// Credit collection fields:
// - creditID: string
// - amount: number
// - date: string (or DateTime)
// - employeeID: string