import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile, deleteUser } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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

// Add a new user
async function addUser(email, password, additionalData) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: additionalData.displayName });
        await addDoc(collection(db, "users"), {
            uid: user.uid,
            email: email,
            phoneNumber: additionalData.phoneNumber,
            shortDescription: additionalData.shortDescription,
            longDescription: additionalData.longDescription,
            farmSize: additionalData.farmSize,
            county: additionalData.county,
            userRole: additionalData.userRole
        });
        console.log("User created with ID: ", user.uid);
        document.getElementById('userId').value = user.uid;
        fetchUsers(); // Refresh the user list
    } catch (e) {
        console.error("Error adding user: ", e);
    }
}

// Update user profile
async function updateUser(userId, updatedData) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, updatedData);
    fetchUsers(); // Refresh the user list
}

// Delete a user
async function removeUser(userId) {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    const user = auth.currentUser;
    await deleteUser(user);
    fetchUsers(); // Refresh the user list
}

// Fetch and display user data
async function fetchUsers() {
    const querySnapshot = await getDocs(collection(db, "users"));
    const userTableBody = document.getElementById('userTable').getElementsByTagName('tbody')[0];
    userTableBody.innerHTML = ''; // Clear existing data
    querySnapshot.forEach((doc) => {
        const user = doc.data();
        const row = userTableBody.insertRow();
        row.insertCell(0).textContent = user.uid;
        row.insertCell(1).textContent = user.email;
        row.insertCell(2).textContent = user.displayName;
        row.insertCell(3).textContent = user.phoneNumber;
        row.insertCell(4).textContent = user.shortDescription;
        row.insertCell(5).textContent = user.longDescription;
        row.insertCell(6).textContent = user.farmSize;
        row.insertCell(7).textContent = user.county;
        row.insertCell(8).textContent = user.userRole;
    });
}

// Event listeners for form submissions
document.getElementById('addUserForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const displayName = document.getElementById('displayName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const shortDescription = document.getElementById('shortDescription').value;
    const longDescription = document.getElementById('longDescription').value;
    const farmSize = document.getElementById('farmSize').value;
    const county = document.getElementById('county').value;
    const userRole = document.getElementById('userRole').value;
    addUser(email, password, { displayName, phoneNumber, shortDescription, longDescription, farmSize, county, userRole });
});

document.getElementById('updateUserForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const userId = document.getElementById('userId').value;
    const newDisplayName = document.getElementById('newDisplayName').value;
    const newPhoneNumber = document.getElementById('newPhoneNumber').value;
    const newShortDescription = document.getElementById('newShortDescription').value;
    const newLongDescription = document.getElementById('newLongDescription').value;
    const newFarmSize = document.getElementById('newFarmSize').value;
    const newCounty = document.getElementById('newCounty').value;
    const newUserRole = document.getElementById('newUserRole').value;
    updateUser(userId, { displayName: newDisplayName, phoneNumber: newPhoneNumber, shortDescription: newShortDescription, longDescription: newLongDescription, farmSize: newFarmSize, county: newCounty, userRole: newUserRole });
});

document.getElementById('removeUserForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const userId = document.getElementById('removeUserId').value;
    removeUser(userId);
});

// Fetch and display users on page load
document.addEventListener('DOMContentLoaded', fetchUsers);