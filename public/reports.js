import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
            document.getElementById('adminId').value = user.uid;
        } else {
            console.log("No user is logged in");
            // Redirect to login page
            window.location.href = "login.html";
        }
    });

    document.getElementById('reportForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        fetchReports();
    });
});

// Fetch and display reports
async function fetchReports() {
    const querySnapshot = await getDocs(collection(db, "transactions"));
    const reportTableBody = document.getElementById('reportTable').getElementsByTagName('tbody')[0];
    reportTableBody.innerHTML = ''; // Clear existing data
    querySnapshot.forEach((doc) => {
        const transaction = doc.data();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${doc.id}</td>
            <td>${transaction.userId}</td>
            <td>${transaction.action}</td>
            <td>${new Date(transaction.timestamp.seconds * 1000).toLocaleString()}</td>
            <td>${transaction.documentId}</td>
            <td>${transaction.collection}</td>
            <td>${JSON.stringify(transaction.data)}</td>
        `;
        reportTableBody.appendChild(row);
    });
}