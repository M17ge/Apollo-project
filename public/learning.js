import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
                    const userDoc = await getDoc(doc(db, "Users", user.uid));
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
                <td>${certification.Name || ''}</td>
                <td>${certification.Duration || ''}</td>
                <td>
                    <button onclick="editCertification('${docSnap.id}', '${certification.Name || ''}', '${certification.Duration || ''}')">Edit</button>
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
async function addOrUpdateCertification(certificationId, Name, Duration) {
    try {
        const certData = {
            Name,
            Duration
        };
        let docRef;
        if (certificationId) {
            const certificationRef = doc(db, "certifications", certificationId);
            await updateDoc(certificationRef, certData);
            docRef = certificationRef;
            await logDatabaseActivity('update', 'certifications', certificationId, certData);
        } else {
            docRef = await addDoc(collection(db, "certifications"), certData);
            await logDatabaseActivity('create', 'certifications', docRef.id, certData);
        }
        fetchCertificationData();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error adding/updating certification: ", error.code || '', msg);
        alert(`An error occurred while saving the certification: ${msg}`);
    }
}

// Edit certification entry
window.editCertification = function(certificationId, Name, Duration) {
    document.getElementById('Name').value = Name;
    document.getElementById('Duration').value = Duration;
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
    const Name = document.getElementById('Name').value;
    const Duration = document.getElementById('Duration').value;
    addOrUpdateCertification(certificationId, Name, Duration);
    event.target.reset();
    delete event.target.dataset.certificationId;
});