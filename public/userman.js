import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile, deleteUser, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, setDoc, getDocs, updateDoc, deleteDoc, doc, addDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Your web app's Firebase configuration
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
        const F_Name = document.getElementById('F_Name').value;
        const ID_NUMBER = document.getElementById('ID_NUMBER').value;
        const Phone_Number = document.getElementById('Phone_Number').value;
        const Crop = document.getElementById('Crop').value;
        const County = document.getElementById('County').value;
        const Role = document.getElementById('Role').value;

        addUser(email, password, { F_Name, ID_NUMBER, Phone_Number, Crop, County, Role });
    });
    // Update user form submission
    document.getElementById('updateUserForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const userId = document.getElementById('userId_update').value;
        const newF_Name = document.getElementById('newF_Name').value;
        const newID_NUMBER = document.getElementById('newID_NUMBER').value;
        const newPhone_Number = document.getElementById('newPhone_Number').value;
        const newCrop = document.getElementById('newCrop').value;
        const newCounty = document.getElementById('newCounty').value;
        const newRole = document.getElementById('newRole').value;

        updateUser(userId, {
            F_Name: newF_Name,
            ID_NUMBER: newID_NUMBER,
            "Phone Number": newPhone_Number,
            Crop: newCrop,
            County: newCounty,
            Role: newRole
        });
    });

    // Remove user form submission
    document.getElementById('removeUserForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const userId = document.getElementById('userId_remove').value;
        removeUser(userId);
    });
});


// Add a new farmer
async function addUser(email, password, additionalData) {
    try {
        if (!email) {
            alert("Please provide a valid email.");
            return;
        }
        // Create a new farmer document in Firestore
        const farmerData = {
            email: email,
            F_Name: additionalData.F_Name,
            ID_NUMBER: Number(additionalData.ID_NUMBER),
            "Phone Number": Number(additionalData.Phone_Number),
            Crop: additionalData.Crop,
            County: additionalData.County,
            Role: "Farmer"
        };
        const docRef = await addDoc(collection(db, "farmers"), farmerData);
        await logDatabaseActivity('create', 'farmers', docRef.id, farmerData);
        fetchUsers();
        document.getElementById('addUserForm').reset();
    } catch (e) {
        console.error("Error adding farmer:", e.code, e.message);
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

// Fetch and display farmer data
async function fetchUsers() {
    try {
        const querySnapshot = await getDocs(collection(db, "farmers"));
        const userTableBody = document.getElementById('userTable').getElementsByTagName('tbody')[0];
        userTableBody.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const farmer = doc.data();
            const row = userTableBody.insertRow();
            row.insertCell(0).textContent = doc.id;
            row.insertCell(1).textContent = farmer.email;
            row.insertCell(2).textContent = farmer.F_Name;
            row.insertCell(3).textContent = farmer.ID_NUMBER;
            row.insertCell(4).textContent = farmer["Phone Number"];
            row.insertCell(5).textContent = farmer.Crop;
            row.insertCell(6).textContent = farmer.County;
            row.insertCell(7).textContent = farmer.Role;
        });
    } catch (error) {
        console.error("Error fetching farmers: ", error);
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