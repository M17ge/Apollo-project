import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, doc, query, where, addDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { logDatabaseActivity } from './reports.js';

// Then use it after database operations, for example:
try {
    const docRef = await addDoc(collection(db, "Inventory"), inventoryData);
    await logDatabaseActivity('create', 'Inventory', docRef.id, inventoryData);
    // ... rest of your code
} catch (error) {
    // ... error handling
}
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
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("User is logged in:", user);
            document.getElementById('adminId').value = user.uid;
            // Optionally, fetch user metadata
            await fetchUserMetadata(user.uid);
        } else {
            console.log("No user is logged in");
            window.location.href = "login.html";
        }
    });

    document.getElementById('reportForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await fetchReports();
    });
});

// Fetch and display user metadata (creation time, etc.)
// ...existing code...
async function fetchUserMetadata(userId) {
    try {
        // Use lowercase 'users' if that's your collection name
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById('userCreatedAt').textContent = userData.createdAt
                ? new Date(userData.createdAt.seconds * 1000).toLocaleString()
                : "N/A";
        } else {
            document.getElementById('userCreatedAt').textContent = "N/A";
        }
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error fetching user metadata: ", error.code || '', msg);
        alert(`An error occurred while fetching user metadata: ${msg}`);
    }
}
// ...existing code...
// Add this after your Firebase initialization

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
// Fetch and display reports (transactions)
async function fetchReports() {
    try {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const collectionFilter = document.getElementById('collectionFilter').value;
        const actionFilter = document.getElementById('actionFilter').value;

        let queryRef = collection(db, "Reports"); // Updated to use 'Reports' collection

        // Apply filters
        const filters = [];
        if (startDate) {
            filters.push(where('timestamp', '>=', new Date(startDate)));
        }
        if (endDate) {
            // Add 1 day to endDate to include the whole day
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1);
            filters.push(where('timestamp', '<', end));
        }
        if (collectionFilter) {
            filters.push(where('collection', '==', collectionFilter));
        }
        if (actionFilter) {
            filters.push(where('action', '==', actionFilter));
        }
        if (filters.length > 0) {
            queryRef = query(queryRef, ...filters);
        }

        const querySnapshot = await getDocs(queryRef);
        const reportTableBody = document.getElementById('reportTable').getElementsByTagName('tbody')[0];
        reportTableBody.innerHTML = '';

        querySnapshot.forEach((docSnap) => {
            const transaction = docSnap.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${docSnap.id}</td>
                <td>${transaction.userId || ''}</td>
                <td>${transaction.action || ''}</td>
                <td>${transaction.timestamp && transaction.timestamp.toDate ? transaction.timestamp.toDate().toLocaleString() : ''}</td>
                <td>${transaction.documentId || ''}</td>
                <td>${transaction.collection || ''}</td>
                <td>${JSON.stringify(transaction.data) || ''}</td>
                <td>${transaction.authorizedBy || ''}</td>
                <td>${transaction.editedBy || ''}</td>
            `;
            reportTableBody.appendChild(row);
        });
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error fetching reports: ", error.code || '', msg);
        alert(`An error occurred while fetching reports: ${msg}`);
    }
}