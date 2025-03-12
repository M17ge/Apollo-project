import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile, deleteUser } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
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
const auth = getAuth(app);
const db = getFirestore(app);

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
    } catch (e) {
        console.error("Error adding user: ", e);
    }
}

// Update user profile
async function updateUser(userId, updatedData) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, updatedData);
}

// Delete a user
async function removeUser(userId) {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    const user = auth.currentUser;
    await deleteUser(user);
}

// Fetch and display user data
async function fetchUsers() {
    const querySnapshot = await getDocs(collection(db, "users"));
    const userList = document.getElementById('userList');
    userList.innerHTML = ''; // Clear existing data
    querySnapshot.forEach((doc) => {
        const user = doc.data();
        const userItem = document.createElement('li');
        userItem.textContent = `Name: ${user.displayName}, Email: ${user.email}, Phone: ${user.phoneNumber}, Short Description: ${user.shortDescription}, Long Description: ${user.longDescription}, Farm Size: ${user.farmSize}, County: ${user.county}, Role: ${user.userRole}`;
        userList.appendChild(userItem);
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