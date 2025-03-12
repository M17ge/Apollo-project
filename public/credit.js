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

// Fetch and display credit data
async function fetchCreditData() {
    const querySnapshot = await getDocs(collection(db, "credits"));
    const creditTableBody = document.getElementById('creditTable').getElementsByTagName('tbody')[0];
    creditTableBody.innerHTML = ''; // Clear existing data
    querySnapshot.forEach((doc) => {
        const credit = doc.data();
        const repaymentValue = credit.amount + (credit.amount * (credit.interest / 100));
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${doc.id}</td>
            <td>${credit.amount}</td>
            <td>${credit.interest}</td>
            <td>${repaymentValue.toFixed(2)}</td>
            <td>${new Date(credit.dateIssued.seconds * 1000).toLocaleDateString()}</td>
            <td>${credit.userEmail}</td>
            <td>${credit.status}</td>
            <td>
                <button onclick="editCredit('${doc.id}', ${credit.amount}, ${credit.interest}, '${new Date(credit.dateIssued.seconds * 1000).toISOString().split('T')[0]}', '${credit.userEmail}', '${credit.status}')">Edit</button>
                <button onclick="deleteCredit('${doc.id}')">Delete</button>
            </td>
        `;
        creditTableBody.appendChild(row);
    });
}

// Add or update credit entry
async function addOrUpdateCredit(creditId, amount, interest, dateIssued, userEmail, status) {
    if (creditId) {
        const creditRef = doc(db, "credits", creditId);
        await updateDoc(creditRef, { amount, interest, dateIssued: new Date(dateIssued), userEmail, status });
    } else {
        await addDoc(collection(db, "credits"), { amount, interest, dateIssued: new Date(dateIssued), userEmail, status });
    }
    fetchCreditData();
}

// Delete credit entry
async function deleteCredit(creditId) {
    await deleteDoc(doc(db, "credits", creditId));
    fetchCreditData();
}

// Edit credit entry
function editCredit(creditId, amount, interest, dateIssued, userEmail, status) {
    document.getElementById('amount').value = amount;
    document.getElementById('interest').value = interest;
    document.getElementById('dateIssued').value = dateIssued;
    document.getElementById('userEmail').value = userEmail;
    document.getElementById('status').value = status;
    document.getElementById('creditForm').dataset.creditId = creditId;
}

// Event listener for form submission
document.getElementById('creditForm').addEventListener('submit', function(event) {
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

// Fetch and display credit data on page load
document.addEventListener('DOMContentLoaded', fetchCreditData);