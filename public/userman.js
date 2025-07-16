import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, setDoc, getDocs, updateDoc, deleteDoc, doc, addDoc, query, where, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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
        const collectionName = document.getElementById('collectionName').value;
        const newDisplayName = document.getElementById('newDisplayName').value;
        const newPhoneNumber = document.getElementById('newPhoneNumber').value;
        const newShortDescription = document.getElementById('newShortDescription').value;
        const newLongDescription = document.getElementById('newLongDescription').value;
        const newFarmSize = document.getElementById('newFarmSize').value;
        const newCounty = document.getElementById('newCounty').value;
        const newUserRole = document.getElementById('newUserRole').value;

        updateUser(userId, collectionName, {
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
        
        // Ask for confirmation
        if (confirm('Are you sure you want to delete this user?')) {
            // Try to remove from both collections since we don't know which one it belongs to
            removeUser(userId, 'farmers');
            removeUser(userId, 'users');
        }
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

        // Determine which collection to use based on role
        const isFarmer = additionalData.userRole.toLowerCase() === "farmer";
        const collectionName = isFarmer ? "farmers" : "users";
        
        // Use the same schema for both collections
        const userData = {
            email: email,
            F_Name: additionalData.displayName,
            Phone_Number: additionalData.phoneNumber,
            ID_NUMBER: additionalData.shortDescription,
            County: additionalData.county,
            Role: additionalData.userRole,
            approved: true,
            Created_Time: new Date()
        };
        
        // Add farm size only for farmers if provided
        if (isFarmer && additionalData.farmSize) {
            userData.Farm_Size = additionalData.farmSize;
        }
        
        // Add long description if provided
        if (additionalData.longDescription) {
            userData.Description = additionalData.longDescription;
        }

        // Store the user information in the appropriate collection in Firestore
        try {
            await setDoc(doc(db, collectionName, user.uid), userData);
            await logDatabaseActivity('create', collectionName, user.uid, userData);
            console.log(`User information stored in the '${collectionName}' collection.`);
            
            // Refresh user list to show the new user with correct formatting
            fetchUsers();
            
            // Clear the form fields after submission
            document.getElementById('addUserForm').reset();
            
            alert(`User ${additionalData.displayName} created successfully!`);
        } catch (e) {
            console.error("Error storing user information in Firestore:", e.code, e.message);
            alert(`An error occurred while storing the user information: ${e.message}`);
        }
    } catch (e) {
        console.error("Error adding user:", e.code, e.message);
        alert(`An error occurred: ${e.message}`);
    }
}
// Load user data for editing
async function loadUserForEdit(userId, collectionName) {
    try {
        const userRef = doc(db, collectionName, userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            
            // Populate update form fields
            document.getElementById('userId_update').value = userId;
            document.getElementById('collectionName').value = collectionName;
            
            // Use consistent field mapping for both collections
            document.getElementById('newDisplayName').value = userData.F_Name || '';
            document.getElementById('newPhoneNumber').value = userData.Phone_Number || '';
            document.getElementById('newShortDescription').value = userData.ID_NUMBER || '';
            document.getElementById('newLongDescription').value = userData.Description || '';
            document.getElementById('newFarmSize').value = userData.Farm_Size || '';
            document.getElementById('newCounty').value = userData.County || '';
            document.getElementById('newUserRole').value = userData.Role || '';
            
            // Scroll to update form and highlight it
            document.getElementById('updateUserForm').scrollIntoView({ behavior: 'smooth' });
            document.getElementById('updateUserForm').classList.add('highlight');
            setTimeout(() => {
                document.getElementById('updateUserForm').classList.remove('highlight');
            }, 1500);
        } else {
            console.error("No user found with ID:", userId);
            alert("User not found in the database.");
        }
    } catch (error) {
        console.error("Error loading user data:", error);
        alert("An error occurred while loading user data. Please try again.");
    }
}

// Update user profile
async function updateUser(userId, collectionName, updatedData) {
    try {
        // Use consistent schema for both collections
        const firestoreData = {
            F_Name: updatedData.displayName,
            Phone_Number: updatedData.phoneNumber,
            ID_NUMBER: updatedData.shortDescription,
            County: updatedData.county,
            Role: updatedData.userRole
        };
        
        // Add farm size if provided
        if (updatedData.farmSize) {
            firestoreData.Farm_Size = updatedData.farmSize;
        }
        
        // Add long description if provided
        if (updatedData.longDescription) {
            firestoreData.Description = updatedData.longDescription;
        }
        
        // Update the user's document in Firestore
        const userRef = doc(db, collectionName, userId);
        await updateDoc(userRef, firestoreData);
        await logDatabaseActivity('update', collectionName, userId, firestoreData);
        console.log(`User document with ID ${userId} updated in Firestore.`);

        // Refresh the user list to show updated data
        fetchUsers();
        
        // Clear the form
        document.getElementById('updateUserForm').reset();
        
        alert("User updated successfully!");
    } catch (error) {
        console.error("Error updating user:", error);
        alert("An error occurred while updating the user. Please try again.");
    }
}

// Delete a user
async function removeUser(userId, collectionName) {
    try {
        // Delete the user's document from Firestore
        const userRef = doc(db, collectionName, userId);
        await deleteDoc(userRef);
        await logDatabaseActivity('delete', collectionName, userId, {});
        console.log(`User document with ID ${userId} deleted from ${collectionName} collection.`);

        // Refresh the user list
        fetchUsers();
        
        alert("User successfully deleted!");
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

// Fetch and display user data from both farmers and users collections
async function fetchUsers() {
    try {
        const userTableBody = document.getElementById('userTable').getElementsByTagName('tbody')[0];
        userTableBody.innerHTML = ''; // Clear existing data
        
        // Fetch farmers
        const farmersSnapshot = await getDocs(collection(db, "farmers"));
        farmersSnapshot.forEach((doc) => {
            const user = doc.data();
            addUserToTable(userTableBody, doc.id, user, 'farmers');
        });
        
        // Fetch other users
        const usersSnapshot = await getDocs(collection(db, "users"));
        usersSnapshot.forEach((doc) => {
            const user = doc.data();
            addUserToTable(userTableBody, doc.id, user, 'users');
        });
    } catch (error) {
        console.error("Error fetching users: ", error);
        alert("An error occurred while fetching users. Please try again.");
    }
}

// Helper function to add user to the table with proper field mapping
function addUserToTable(tableBody, userId, userData, collectionName) {
    const row = tableBody.insertRow();
    row.setAttribute('data-collection', collectionName); // Store collection name as a data attribute
    
    // Insert user ID
    row.insertCell(0).textContent = userId;
    
    // Insert email
    row.insertCell(1).textContent = userData.email || '';
    
    // Insert name using consistent schema
    row.insertCell(2).textContent = userData.F_Name || '';
    
    // Insert phone number using consistent schema
    row.insertCell(3).textContent = userData.Phone_Number || '';
    
    // Insert ID_NUMBER or short description
    row.insertCell(4).textContent = userData.ID_NUMBER || '';
    
    // Insert long description
    row.insertCell(5).textContent = userData.Description || '';
    
    // Insert farm size
    row.insertCell(6).textContent = userData.Farm_Size || '';
    
    // Insert county
    row.insertCell(7).textContent = userData.County || '';
    
    // Insert role
    row.insertCell(8).textContent = userData.Role || '';
    
    // Add edit and delete buttons
    const actionsCell = row.insertCell(9);
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'edit-button';
    editButton.onclick = function() { loadUserForEdit(userId, collectionName); };
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete-button';
    deleteButton.onclick = function() { 
        if (confirm('Are you sure you want to delete this user?')) {
            removeUser(userId, collectionName); 
        }
    };
    
    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);
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
        await addDoc(collection(db, "reports"), logData);
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error logging activity: ", error.code || '', msg);
        alert(`An error occurred while logging activity: ${msg}`);
    }
}