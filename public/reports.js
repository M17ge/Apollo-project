import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
async function fetchUserMetadata(userId) {
    try {
        // If you store user creation time in Firestore, fetch it here
        const userDoc = await getDoc(doc(db, "Users", userId));
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

// Fetch and display reports (transactions)
async function fetchReports() {
    try {
        const querySnapshot = await getDocs(collection(db, "Transactions")); // Capitalized
        const reportTableBody = document.getElementById('reportTable').getElementsByTagName('tbody')[0];
        reportTableBody.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const transaction = docSnap.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${docSnap.id}</td>
                <td>${transaction.userId || ''}</td>
                <td>${transaction.action || ''}</td>
                <td>${transaction.timestamp && transaction.timestamp.seconds ? new Date(transaction.timestamp.seconds * 1000).toLocaleString() : ''}</td>
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