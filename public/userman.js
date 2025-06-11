import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile, deleteUser, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, setDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
    // Check authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is logged in:", user);
            fetchUsers(); // Fetch users on page load
        } else {
            console.log("No user is logged in");
            // Redirect to login page
            window.location.href = "login.html";
        }
    });

    // Add user form submission
    document.getElementById('addUserForm').addEventListener('submit', function (event) {
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
    // Update user form submission
    document.getElementById('updateUserForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const userId = document.getElementById('userId_update').value;
        const newDisplayName = document.getElementById('newDisplayName').value;
        const newPhoneNumber = document.getElementById('newPhoneNumber').value;
        const newShortDescription = document.getElementById('newShortDescription').value;
        const newLongDescription = document.getElementById('newLongDescription').value;
        const newFarmSize = document.getElementById('newFarmSize').value;
        const newCounty = document.getElementById('newCounty').value;
        const newUserRole = document.getElementById('newUserRole').value;

        updateUser(userId, {
            displayName: newDisplayName,
            phoneNumber: newPhoneNumber,
            shortDescription: newShortDescription,
            longDescription: newLongDescription,
            farmSize: newFarmSize,
            county: newCounty,
            userRole: newUserRole
        });
    });

    // Remove user form submission
    document.getElementById('removeUserForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const userId = document.getElementById('userId_remove').value;
        removeUser(userId);
    });
});


// Add a new user
async function addUser(email, password, additionalData) {
    try {
        // Validate input fields
        if (!email || !password || password.length < 6) {
            alert("Please provide a valid email and a password with at least 6 characters.");
            return;
        }

        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update the user's display name in Firebase Authentication
        try {
            await updateProfile(user, { displayName: additionalData.displayName });
        } catch (e) {
            console.error("Error updating user profile:", e.code, e.message);
            alert(`An error occurred while updating the user profile: ${e.message}`);
            return;
        }

        // Log the user creation success
        console.log("User created with ID: ", user.uid);

        // Add the new user directly to the table in the DOM
        const userTableBody = document.getElementById('userTable').getElementsByTagName('tbody')[0];
        if (!userTableBody) {
            console.error("User table body not found in the DOM.");
            return;
        }

        const row = userTableBody.insertRow();
        row.insertCell(0).textContent = user.uid; // Use UID as the unique identifier
        row.insertCell(1).textContent = email;
        row.insertCell(2).textContent = additionalData.displayName;
        row.insertCell(3).textContent = additionalData.phoneNumber;
        row.insertCell(4).textContent = additionalData.shortDescription;
        row.insertCell(5).textContent = additionalData.longDescription;
        row.insertCell(6).textContent = additionalData.farmSize;
        row.insertCell(7).textContent = additionalData.county;
        row.insertCell(8).textContent = additionalData.userRole;

        // Store the user information in the "Farmers" collection in Firestore
        try {
            await setDoc(doc(db, "Farmers", user.uid), {
                email: email,
                displayName: additionalData.displayName,
                phoneNumber: additionalData.phoneNumber,
                shortDescription: additionalData.shortDescription,
                longDescription: additionalData.longDescription,
                farmSize: additionalData.farmSize,
                county: additionalData.county,
                userRole: additionalData.userRole
            });
            await logDatabaseActivity('create', 'Farmers', user.uid, additionalData);
            console.log("User information stored in the 'Farmers' collection.");
        } catch (e) {
            console.error("Error storing user information in Firestore:", e.code, e.message);
            alert(`An error occurred while storing the user information: ${e.message}`);
        }

        // Clear the form fields after submission
        document.getElementById('addUserForm').reset();
    } catch (e) {
        console.error("Error adding user:", e.code, e.message);
        alert(`An error occurred: ${e.message}`);
    }
}
// Update user profile
async function updateUser(userId, updatedData) {
    try {
        // Update the user's document in the "Farmers" collection in Firestore
        const userRef = doc(db, "Farmers", userId); // Changed to "Farmers"
        await updateDoc(userRef, updatedData);
        await logDatabaseActivity('update', 'Farmers', userId, updatedData);
        console.log(`User document with ID ${userId} updated in Firestore.`);

        // Update the user's information in the DOM table
        const userTableBody = document.getElementById('userTable').getElementsByTagName('tbody')[0];
        if (!userTableBody) {
            console.error("User table body not found in the DOM.");
            return;
        }

        // Find the row corresponding to the userId and update its cells
        for (let row of userTableBody.rows) {
            if (row.cells[0].textContent === userId) {
                row.cells[2].textContent = updatedData.displayName;
                row.cells[3].textContent = updatedData.phoneNumber;
                row.cells[4].textContent = updatedData.shortDescription;
                row.cells[5].textContent = updatedData.longDescription;
                row.cells[6].textContent = updatedData.farmSize;
                row.cells[7].textContent = updatedData.county;
                row.cells[8].textContent = updatedData.userRole;
                console.log(`User with ID ${userId} updated in the DOM table.`);
                break;
            }
        }
    } catch (error) {
        console.error("Error updating user:", error);
        alert("An error occurred while updating the user. Please try again.");
    }
}

// Delete a user
async function removeUser(userId) {
    try {
        // Delete the user's document from Firestore
        const userRef = doc(db, "Farmers", userId); // Changed to "Farmers"
        await deleteDoc(userRef);
        await logDatabaseActivity('delete', 'Farmers', userId, {});
        console.log(`User document with ID ${userId} deleted from Firestore.`);

        // Refresh the user list
        fetchUsers();
    } catch (error) {
        console.error("Error removing user:", error);

        // Provide user-friendly feedback
        if (error.code === "auth/requires-recent-login") {
            alert("You need to log in again to delete this user.");
        } else {
            alert("An error occurred while trying to remove the user. Please try again.");
        }
    }
}

// Fetch and display user data
async function fetchUsers() {
    try {
        const querySnapshot = await getDocs(collection(db, "Farmers")); // Changed to "Farmers"
        const userTableBody = document.getElementById('userTable').getElementsByTagName('tbody')[0];
        userTableBody.innerHTML = ''; // Clear existing data
        querySnapshot.forEach((doc) => {
            const user = doc.data();
            const row = userTableBody.insertRow();
            row.insertCell(0).textContent = doc.id; // Use UID as the document ID
            row.insertCell(1).textContent = user.email;
            row.insertCell(2).textContent = user.displayName;
            row.insertCell(3).textContent = user.phoneNumber;
            row.insertCell(4).textContent = user.shortDescription;
            row.insertCell(5).textContent = user.longDescription;
            row.insertCell(6).textContent = user.farmSize;
            row.insertCell(7).textContent = user.county;
            row.insertCell(8).textContent = user.userRole;
        });
    } catch (error) {
        console.error("Error fetching users: ", error);
    }
}

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