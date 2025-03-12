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

// Fetch and display certification data
async function fetchCertificationData() {
    const querySnapshot = await getDocs(collection(db, "certifications"));
    const certificationTableBody = document.getElementById('certificationTable').getElementsByTagName('tbody')[0];
    certificationTableBody.innerHTML = ''; // Clear existing data
    querySnapshot.forEach((doc) => {
        const certification = doc.data();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${doc.id}</td>
            <td>${certification.userEmail}</td>
            <td>${certification.amount}</td>
            <td>${certification.courseName}</td>
            <td>${new Date(certification.issueDate.seconds * 1000).toLocaleDateString()}</td>
            <td>${certification.description}</td>
            <td>${certification.status}</td>
            <td>${certification.employeeId}</td>
            <td>
                <button onclick="editCertification('${doc.id}', '${certification.userEmail}', ${certification.amount}, '${certification.courseName}', '${new Date(certification.issueDate.seconds * 1000).toISOString().split('T')[0]}', '${certification.description}', '${certification.status}', '${certification.employeeId}')">Edit</button>
                <button onclick="deleteCertification('${doc.id}')">Delete</button>
            </td>
        `;
        certificationTableBody.appendChild(row);
    });
}

// Add or update certification entry
async function addOrUpdateCertification(certificationId, userEmail, amount, courseName, issueDate, description, status, employeeId) {
    if (certificationId) {
        const certificationRef = doc(db, "certifications", certificationId);
        await updateDoc(certificationRef, { userEmail, amount, courseName, issueDate: new Date(issueDate), description, status, employeeId });
    } else {
        await addDoc(collection(db, "certifications"), { userEmail, amount, courseName, issueDate: new Date(issueDate), description, status, employeeId });
    }
    fetchCertificationData();
}

// Delete certification entry
async function deleteCertification(certificationId) {
    await deleteDoc(doc(db, "certifications", certificationId));
    fetchCertificationData();
}

// Edit certification entry
function editCertification(certificationId, userEmail, amount, courseName, issueDate, description, status, employeeId) {
    document.getElementById('userEmail').value = userEmail;
    document.getElementById('amount').value = amount;
    document.getElementById('courseName').value = courseName;
    document.getElementById('issueDate').value = issueDate;
    document.getElementById('description').value = description;
    document.getElementById('status').value = status;
    document.getElementById('employeeId').value = employeeId;
    document.getElementById('certificationForm').dataset.certificationId = certificationId;
}

// Event listener for form submission
document.getElementById('certificationForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const certificationId = event.target.dataset.certificationId || null;
    const userEmail = document.getElementById('userEmail').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const courseName = document.getElementById('courseName').value;
    const issueDate = document.getElementById('issueDate').value;
    const description = document.getElementById('description').value;
    const status = document.getElementById('status').value;
    const employeeId = document.getElementById('employeeId').value;
    addOrUpdateCertification(certificationId, userEmail, amount, courseName, issueDate, description, status, employeeId);
    event.target.reset();
    delete event.target.dataset.certificationId;
});

// Fetch and display certification data on page load
document.addEventListener('DOMContentLoaded', fetchCertificationData);