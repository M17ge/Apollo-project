import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { logCreate, logUpdate, logDelete, logActivity, logError } from './logging.js';

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
    // Log page access
    logActivity('page_access', 'navigation', null, { page: 'learning' });
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                fetchCertificationData();
            } catch (error) {
                const msg = error && error.message ? error.message : String(error);
                console.error("Error initializing: ", error.code || '', msg);
                
                // Log the error
                await logError('learning', "Failed to initialize page", {
                    error: msg
                });
                
                alert(`An error occurred while initializing the page: ${msg}`);
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
                <td>${certification.price || ''}</td>
                <td>
                    <button onclick="editCertification('${docSnap.id}', '${certification.Name || ''}', '${certification.Duration || ''}', '${certification.price || ''}')">Edit</button>
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
async function addOrUpdateCertification(certificationId, name, duration, price) {
    try {
        const certData = {
            Name: name,
            Duration: duration,
            price: Number(price)
        };
        let docRef;
        if (certificationId) {
            // Get old data for logging
            const certificationRef = doc(db, "certifications", certificationId);
            const oldDataSnap = await getDoc(certificationRef);
            const oldData = oldDataSnap.exists() ? oldDataSnap.data() : null;
            
            // Update the document
            await updateDoc(certificationRef, certData);
            docRef = certificationRef;
            
            // Log the update
            await logUpdate('certifications', certificationId, certData, oldData);
        } else {
            // Create new document
            docRef = await addDoc(collection(db, "certifications"), certData);
            
            // Log the creation
            await logCreate('certifications', docRef.id, certData);
        }
        fetchCertificationData();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error adding/updating certification: ", error.code || '', msg);
        
        // Log the error
        await logError('certifications', "Failed to save certification", {
            name,
            error: msg
        });
        
        alert(`An error occurred while saving the certification: ${msg}`);
    }
}

// Delete certification entry
async function deleteCertification(certificationId) {
    try {
        // Get data before deletion for logging
        const certificationRef = doc(db, "certifications", certificationId);
        const certSnap = await getDoc(certificationRef);
        const deletedData = certSnap.exists() ? certSnap.data() : null;
        
        // Delete the document
        await deleteDoc(certificationRef);
        
        // Log the deletion
        await logDelete('certifications', certificationId, deletedData);
        
        fetchCertificationData();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error deleting certification: ", error.code || '', msg);
        
        // Log the error
        await logError('certifications', "Failed to delete certification", {
            certificationId,
            error: msg
        });
        
        alert(`An error occurred while deleting the certification: ${msg}`);
    }
}

// Edit certification entry
window.editCertification = function(certificationId, name, duration, price) {
    document.getElementById('certId').value = certificationId;
    document.getElementById('name').value = name;
    document.getElementById('duration').value = duration;
    document.getElementById('price').value = price;
    document.getElementById('certificationForm').dataset.certificationId = certificationId;
}

// Delete certification entry (make sure it's globally accessible)
window.deleteCertification = deleteCertification;

// This function is deprecated - using the new logging.js module instead

// Event listener for form submission
document.getElementById('certificationForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const certificationId = event.target.dataset.certificationId || null;
    const name = document.getElementById('name').value;
    const duration = document.getElementById('duration').value;
    const price = document.getElementById('price').value;
    addOrUpdateCertification(certificationId, name, duration, price);
    event.target.reset();
    delete event.target.dataset.certificationId;
});