import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                // Auto-fill trainerId and trainerName if present
                document.getElementById('trainerId').value = user.uid;
                if (user.displayName) {
                    document.getElementById('trainerName').value = user.displayName;
                } else {
                    // Optionally fetch from Users collection if displayName is not present
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists() && userDoc.data().displayName) {
                        document.getElementById('trainerName').value = userDoc.data().displayName;
                    }
                }
                fetchCertificationData();
            } catch (error) {
                const msg = error && error.message ? error.message : String(error);
                console.error("Error during trainer auto-fill: ", error.code || '', msg);
                alert(`An error occurred while auto-filling trainer info: ${msg}`);
            }
        } else {
            window.location.href = "login.html";
        }
    });
});

// Fetch and display certification data
async function fetchCertificationData() {
    try {
        const querySnapshot = await getDocs(collection(db, "certifications"));
        const certificationTableBody = document.getElementById('certificationTable').getElementsByTagName('tbody')[0];
        certificationTableBody.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const certification = docSnap.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${docSnap.id}</td>
                <td>${certification.userEmail}</td>
                <td>${certification.estimatedCompletionTime}</td>
                <td>${certification.courseName}</td>
                <td>${certification.issueDate && certification.issueDate.seconds ? new Date(certification.issueDate.seconds * 1000).toLocaleDateString() : ''}</td>
                <td>${certification.description}</td>
                <td>${certification.status}</td>
                <td>${certification.trainerId}</td>
                <td>${certification.trainerName}</td>
                <td>${certification.bookingId || ''}</td>
                <td>
                    <button onclick="editCertification('${docSnap.id}', '${certification.userEmail}', '${certification.estimatedCompletionTime}', '${certification.courseName}', '${certification.issueDate && certification.issueDate.seconds ? new Date(certification.issueDate.seconds * 1000).toISOString().split('T')[0] : ''}', '${certification.description}', '${certification.status}', '${certification.trainerId}', '${certification.trainerName}', '${certification.bookingId || ''}')">Edit</button>
                    <button onclick="deleteCertification('${docSnap.id}')">Delete</button>
                </td>
            `;
            certificationTableBody.appendChild(row);
        });
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error fetching certifications: ", error.code || '', msg);
        alert(`An error occurred while fetching certifications: ${msg}`);
    }
}

// Add or update certification entry
async function addOrUpdateCertification(certificationId, userEmail, estimatedCompletionTime, courseName, issueDate, description, status, trainerId, trainerName, bookingId) {
    try {
        const certData = {
            userEmail,
            estimatedCompletionTime,
            courseName,
            issueDate: new Date(issueDate),
            description,
            status,
            trainerId,
            trainerName,
            bookingId // Reference to Bookings collection
        };
        let docRef;
        if (certificationId) {
            const certificationRef = doc(db, "certifications", certificationId);
            await updateDoc(certificationRef, certData);
            docRef = certificationRef;
            await logDatabaseActivity('update', 'Certifications', certificationId, certData);
        } else {
            docRef = await addDoc(collection(db, "certifications"), certData);
            await logDatabaseActivity('create', 'Certifications', docRef.id, certData);
        }
        fetchCertificationData();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error adding/updating certification: ", error.code || '', msg);
        alert(`An error occurred while saving the certification: ${msg}`);
    }
}

// Delete certification entry
async function deleteCertification(certificationId) {
    try {
        const certificationRef = doc(db, "certifications", certificationId);
        await deleteDoc(certificationRef);
        await logDatabaseActivity('delete', 'Certifications', certificationId, {});
        fetchCertificationData();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error deleting certification: ", error.code || '', msg);
        alert(`An error occurred while deleting the certification: ${msg}`);
    }
}

// Edit certification entry
window.editCertification = function(certificationId, userEmail, estimatedCompletionTime, courseName, issueDate, description, status, trainerId, trainerName, bookingId) {
    document.getElementById('userEmail').value = userEmail;
    document.getElementById('estimatedCompletionTime').value = estimatedCompletionTime;
    document.getElementById('courseName').value = courseName;
    document.getElementById('issueDate').value = issueDate;
    document.getElementById('description').value = description;
    document.getElementById('status').value = status;
    document.getElementById('trainerId').value = trainerId;
    document.getElementById('trainerName').value = trainerName;
    document.getElementById('bookingId').value = bookingId || '';
    document.getElementById('certificationForm').dataset.certificationId = certificationId;
}

// Delete certification entry (make sure it's globally accessible)
window.deleteCertification = deleteCertification;

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
    const bookingId = document.getElementById('bookingId').value;
    addOrUpdateCertification(certificationId, userEmail, estimatedCompletionTime, courseName, issueDate, description, status, trainerId, trainerName, bookingId);
    event.target.reset();
    delete event.target.dataset.certificationId;
});