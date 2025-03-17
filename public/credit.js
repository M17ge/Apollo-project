import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import{ getAuth, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Your web app's Firebase configuration
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
            // Set the manager ID in the form field
            document.getElementById('managerID').value = user.uid;
            initializeForms();
        } else {
            console.log("No user is logged in");
            // Redirect to login page
            window.location.href = "login.html";
        }
    });
});
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