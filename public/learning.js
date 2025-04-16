import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Firebase configuration
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
            document.getElementById('trainerId').value = user.uid;
            fetchCertificationData();
        } else {
            console.log("No user is logged in");
            // Redirect to login page
            window.location.href = "login.html";
        }
    });
});

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
            <td>${certification.estimatedCompletionTime}</td>
            <td>${certification.courseName}</td>
            <td>${new Date(certification.issueDate.seconds * 1000).toLocaleDateString()}</td>
            <td>${certification.description}</td>
            <td>${certification.status}</td>
            <td>${certification.trainerId}</td>
            <td>${certification.trainerName}</td>
            <td>
                <button onclick="editCertification('${doc.id}', '${certification.userEmail}', '${certification.estimatedCompletionTime}', '${certification.courseName}', '${new Date(certification.issueDate.seconds * 1000).toISOString().split('T')[0]}', '${certification.description}', '${certification.status}', '${certification.trainerId}', '${certification.trainerName}')">Edit</button>
                <button onclick="deleteCertification('${doc.id}')">Delete</button>
            </td>
        `;
        certificationTableBody.appendChild(row);
    });
}

// Add or update certification entry
async function addOrUpdateCertification(certificationId, userEmail, estimatedCompletionTime, courseName, issueDate, description, status, trainerId, trainerName) {
    if (certificationId) {
        const certificationRef = doc(db, "certifications", certificationId);
        await updateDoc(certificationRef, { userEmail, estimatedCompletionTime, courseName, issueDate: new Date(issueDate), description, status, trainerId, trainerName });
    } else {
        await addDoc(collection(db, "certifications"), { userEmail, estimatedCompletionTime, courseName, issueDate: new Date(issueDate), description, status, trainerId, trainerName });
    }
    fetchCertificationData();
}

// Delete certification entry
async function deleteCertification(certificationId) {
    await deleteDoc(doc(db, "certifications", certificationId));
    fetchCertificationData();
}

// Edit certification entry
function editCertification(certificationId, userEmail, estimatedCompletionTime, courseName, issueDate, description, status, trainerId, trainerName) {
    document.getElementById('userEmail').value = userEmail;
    document.getElementById('estimatedCompletionTime').value = estimatedCompletionTime;
    document.getElementById('courseName').value = courseName;
    document.getElementById('issueDate').value = issueDate;
    document.getElementById('description').value = description;
    document.getElementById('status').value = status;
    document.getElementById('trainerId').value = trainerId;
    document.getElementById('trainerName').value = trainerName;
    document.getElementById('certificationForm').dataset.certificationId = certificationId;
}

// Event listener for form submission
document.getElementById('certificationForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const certificationId = event.target.dataset.certificationId || null;
    const userEmail = document.getElementById('userEmail').value;
    const estimatedCompletionTime = document.getElementById('estimatedCompletionTime').value;
    const courseName = document.getElementById('courseName').value;
    const issueDate = document.getElementById('issueDate').value;
    const description = document.getElementById('description').value;
    const status = document.getElementById('status').value;
    const trainerId = document.getElementById('trainerId').value;
    const trainerName = document.getElementById('trainerName').value;
    addOrUpdateCertification(certificationId, userEmail, estimatedCompletionTime, courseName, issueDate, description, status, trainerId, trainerName);
    event.target.reset();
    delete event.target.dataset.certificationId;
});

// Fetch and display certification data on page load
document.addEventListener('DOMContentLoaded', fetchCertificationData);