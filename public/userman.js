import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, setDoc, getDocs, updateDoc, deleteDoc, doc, addDoc, query, where, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { logCreate, logUpdate, logDelete, logActivity, logError, logAuth } from './logging.js';

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
        const location = document.getElementById('location').value;
        const approved = document.getElementById('approved').checked;
        const userRole = document.getElementById('userRole').value;

        addUser(email, password, { displayName, phoneNumber, shortDescription, longDescription, farmSize, county, location, approved, userRole });
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
        const newLocation = document.getElementById('newLocation').value;
        const newApproved = document.getElementById('newApproved').checked;
        const newUserRole = document.getElementById('newUserRole').value;

        updateUser(userId, collectionName, {
            displayName: newDisplayName,
            phoneNumber: newPhoneNumber,
            shortDescription: newShortDescription,
            longDescription: newLongDescription,
            farmSize: newFarmSize,
            county: newCounty,
            location: newLocation,
            approved: newApproved,
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
            location: additionalData.location,
            role: additionalData.userRole, // Changed from Role to role (lowercase)
            userRole: additionalData.userRole, // For FlutterFlow compatibility
            approved: additionalData.approved,
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
            
            // Try to set custom claims for FlutterFlow role-based routing
            await setUserCustomClaims(user.uid, {
                role: additionalData.userRole,
                userRole: additionalData.userRole,
                collection: collectionName
            });
            
            // Log the user creation in Firestore
            await logCreate(collectionName, user.uid, userData);
            
            // Also log the auth event
            await logAuth('user_created', {
                userId: user.uid,
                email: email,
                displayName: additionalData.displayName,
                role: additionalData.userRole
            });
            
            console.log(`User information stored in the '${collectionName}' collection.`);
            
            // Refresh user list to show the new user with correct formatting
            fetchUsers();
            
            // Clear the form fields after submission
            document.getElementById('addUserForm').reset();
            
            alert(`User ${additionalData.displayName} created successfully!\n\nNote: If using FlutterFlow role-based routing, the user may need to log out and log back in for custom claims to take effect.`);
        } catch (e) {
            const msg = e && e.message ? e.message : String(e);
            console.error("Error storing user information in Firestore:", e.code || '', msg);
            
            // Log the error
            await logError(collectionName, "Failed to store user information", {
                userId: user.uid,
                email: email,
                error: msg
            });
            
            alert(`An error occurred while storing the user information: ${msg}`);
        }
    } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        console.error("Error adding user:", e.code || '', msg);
        
        // Log the error
        await logError('auth', "Failed to create user", {
            email: email,
            displayName: additionalData.displayName,
            error: msg
        });
        
        alert(`An error occurred: ${msg}`);
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
            document.getElementById('newLocation').value = userData.location || '';
            document.getElementById('newApproved').checked = userData.approved || false;
            // Check both role and Role for backwards compatibility
            document.getElementById('newUserRole').value = userData.role || userData.Role || '';
            
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
            location: updatedData.location,
            approved: updatedData.approved,
            role: updatedData.userRole // Changed from Role to role (lowercase)
        };
        
        // Add farm size if provided
        if (updatedData.farmSize) {
            firestoreData.Farm_Size = updatedData.farmSize;
        }
        
        // Add long description if provided
        if (updatedData.longDescription) {
            firestoreData.Description = updatedData.longDescription;
        }
        
        // Get old data for logging
        const userRef = doc(db, collectionName, userId);
        const oldDataSnap = await getDoc(userRef);
        const oldData = oldDataSnap.exists() ? oldDataSnap.data() : null;
        
        // Update the user's document in Firestore
        await updateDoc(userRef, firestoreData);
        
        // Log the update
        await logUpdate(collectionName, userId, firestoreData, oldData);
        
        console.log(`User document with ID ${userId} updated in Firestore.`);

        // Refresh the user list to show updated data
        fetchUsers();
        
        // Clear the form
        document.getElementById('updateUserForm').reset();
        
        alert("User updated successfully!");
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error updating user:", error.code || '', msg);
        
        // Log the error
        await logError(collectionName, "Failed to update user", {
            userId: userId,
            error: msg
        });
        
        alert("An error occurred while updating the user. Please try again.");
    }
}

// Delete a user
async function removeUser(userId, collectionName) {
    try {
        // Get data before deletion for logging
        const userRef = doc(db, collectionName, userId);
        const userSnap = await getDoc(userRef);
        const deletedData = userSnap.exists() ? userSnap.data() : null;
        
        if (!userSnap.exists()) {
            // Skip if the user doesn't exist in this collection
            return;
        }
        
        // Delete the user's document from Firestore
        await deleteDoc(userRef);
        
        // Log the deletion
        await logDelete(collectionName, userId, deletedData);
        
        // Also log as auth event if we have email info
        if (deletedData && deletedData.email) {
            await logAuth('user_deleted', {
                userId: userId,
                email: deletedData.email,
                displayName: deletedData.F_Name || 'unknown'
            });
        }
        
        console.log(`User document with ID ${userId} deleted from ${collectionName} collection.`);

        // Refresh the user list
        fetchUsers();
        
        alert("User successfully deleted!");
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error removing user:", error.code || '', msg);
        
        // Log the error
        await logError(collectionName, "Failed to delete user", {
            userId: userId,
            error: msg
        });

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
        
        try {
            // Fetch farmers
            console.log("Attempting to fetch farmers collection...");
            const farmersSnapshot = await getDocs(collection(db, "farmers"));
            console.log("Farmers collection access successful, got", farmersSnapshot.size, "documents");
            
            farmersSnapshot.forEach((doc) => {
                const user = doc.data();
                addUserToTable(userTableBody, doc.id, user, 'farmers');
            });
        } catch (farmersError) {
            console.error("Error fetching farmers:", farmersError.code, farmersError.message);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = `<strong>Farmers Collection Error:</strong> ${farmersError.code || ''} - ${farmersError.message}`;
            document.getElementById('main').insertBefore(errorDiv, document.getElementById('userTable'));
        }
        
        try {
            // Fetch other users
            console.log("Attempting to fetch users collection...");
            const usersSnapshot = await getDocs(collection(db, "users"));
            console.log("Users collection access successful, got", usersSnapshot.size, "documents");
            
            usersSnapshot.forEach((doc) => {
                const user = doc.data();
                addUserToTable(userTableBody, doc.id, user, 'users');
            });
        } catch (usersError) {
            console.error("Error fetching users:", usersError.code, usersError.message);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = `<strong>Users Collection Error:</strong> ${usersError.code || ''} - ${usersError.message}`;
            document.getElementById('main').insertBefore(errorDiv, document.getElementById('userTable'));
        }
        
    } catch (error) {
        console.error("Error in fetchUsers function:", error.code, error.message);
        alert(`An error occurred while fetching users: ${error.code || ''} - ${error.message}`);
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
    
    // Insert location
    row.insertCell(8).textContent = userData.location || '';
    
    // Insert approved status
    row.insertCell(9).textContent = userData.approved ? 'Yes' : 'No';
    
    // Insert role - check both role and Role for backwards compatibility
    row.insertCell(10).textContent = userData.role || userData.Role || '';
    
    // Add edit and delete buttons
    const actionsCell = row.insertCell(11);
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

// This function is deprecated - using the new logging.js module instead

// Test Firestore permissions for a specific collection
async function testFirestorePermissions(collectionName) {
    try {
        // Test READ permissions
        console.log(`Testing read permissions for ${collectionName} collection...`);
        let readSuccess = false;
        let readError = null;
        let docCount = 0;
        
        try {
            const testSnapshot = await getDocs(collection(db, collectionName));
            docCount = testSnapshot.size;
            readSuccess = true;
            console.log(`✅ Read permission GRANTED for ${collectionName} collection. Found ${testSnapshot.size} documents.`);
        } catch (error) {
            readSuccess = false;
            readError = error;
            console.error(`❌ Read permission DENIED for ${collectionName} collection:`, error.code, error.message);
        }
        
        // Test WRITE permissions
        console.log(`Testing write permissions for ${collectionName} collection...`);
        let writeSuccess = false;
        let writeError = null;
        let docRef = null;
        const testDocId = `test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        try {
            docRef = await addDoc(collection(db, collectionName), {
                test: true,
                testId: testDocId,
                description: "This is a test document for permission testing",
                timestamp: new Date()
            });
            writeSuccess = true;
            console.log(`✅ Write permission GRANTED for ${collectionName} collection. Added test document.`);
        } catch (error) {
            writeSuccess = false;
            writeError = error;
            console.error(`❌ Write permission DENIED for ${collectionName} collection:`, error.code, error.message);
        }
        
        // Test UPDATE permissions (only if write succeeded)
        let updateSuccess = false;
        let updateError = null;
        
        if (writeSuccess && docRef) {
            console.log(`Testing update permissions for ${collectionName} collection...`);
            try {
                await updateDoc(docRef, {
                    updated: true,
                    updateTime: new Date()
                });
                updateSuccess = true;
                console.log(`✅ Update permission GRANTED for ${collectionName} collection.`);
            } catch (error) {
                updateSuccess = false;
                updateError = error;
                console.error(`❌ Update permission DENIED for ${collectionName} collection:`, error.code, error.message);
            }
        }
        
        // Test DELETE permissions (only if write succeeded)
        let deleteSuccess = false;
        let deleteError = null;
        
        if (writeSuccess && docRef) {
            console.log(`Testing delete permissions for ${collectionName} collection...`);
            try {
                await deleteDoc(docRef);
                deleteSuccess = true;
                console.log(`✅ Delete permission GRANTED for ${collectionName} collection.`);
            } catch (error) {
                deleteSuccess = false;
                deleteError = error;
                console.error(`❌ Delete permission DENIED for ${collectionName} collection:`, error.code, error.message);
            }
        }
        
        return {
            collection: collectionName,
            read: {
                success: readSuccess,
                message: readSuccess ? `Found ${docCount} documents` : `${readError?.code || 'Error'}: ${readError?.message}`,
                error: readError
            },
            write: {
                success: writeSuccess,
                message: writeSuccess ? `Added test document successfully` : `${writeError?.code || 'Error'}: ${writeError?.message}`,
                error: writeError
            },
            update: {
                success: updateSuccess,
                tested: writeSuccess, // Only tested if write succeeded
                message: !writeSuccess ? 'Not tested (write failed)' : 
                         updateSuccess ? 'Updated test document successfully' : `${updateError?.code || 'Error'}: ${updateError?.message}`,
                error: updateError
            },
            delete: {
                success: deleteSuccess,
                tested: writeSuccess, // Only tested if write succeeded
                message: !writeSuccess ? 'Not tested (write failed)' : 
                         deleteSuccess ? 'Deleted test document successfully' : `${deleteError?.code || 'Error'}: ${deleteError?.message}`,
                error: deleteError
            },
            testDocRef: !writeSuccess || deleteSuccess ? null : docRef,
            hasUncleanedTestDoc: writeSuccess && !deleteSuccess
        };
    } catch (error) {
        console.error(`Error testing permissions for ${collectionName}:`, error);
        return {
            collection: collectionName,
            error: error,
            message: `General error testing collection: ${error.message}`
        };
    }
}

// Function to test all relevant collections
async function testAllCollections() {
    const collections = ['users', 'farmers', 'inventory', 'products', 'order', 'payments', 'reports'];
    const results = {};
    const resultsDiv = document.createElement('div');
    resultsDiv.id = 'permissionResults';
    resultsDiv.className = 'permission-results';
    
    const heading = document.createElement('h3');
    heading.textContent = 'Firestore Permissions Test Results';
    resultsDiv.appendChild(heading);
    
    // Add a loading message
    resultsDiv.innerHTML += '<p>Testing permissions for collections... Please wait.</p>';
    
    // Insert at top of page
    document.getElementById('main').insertBefore(resultsDiv, document.getElementById('main').firstChild);
    
    let anyHasUncleanedTestDoc = false;
    
    for (const collectionName of collections) {
        const result = await testFirestorePermissions(collectionName);
        results[collectionName] = result;
        
        // Track if any test docs remain
        if (result.hasUncleanedTestDoc) {
            anyHasUncleanedTestDoc = true;
        }
        
        // Create result item
        const resultItem = document.createElement('div');
        resultItem.className = 'collection-result';
        
        // Create table for this collection
        let tableHTML = `
            <h4>${collectionName}</h4>
            <table class="permission-table">
                <thead>
                    <tr>
                        <th>Operation</th>
                        <th>Status</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Add READ results
        tableHTML += `
            <tr>
                <td><strong>READ</strong></td>
                <td>${result.read?.success ? '✅ GRANTED' : '❌ DENIED'}</td>
                <td>${result.read?.message || 'Not tested'}</td>
            </tr>
        `;
        
        // Add WRITE results
        tableHTML += `
            <tr>
                <td><strong>WRITE</strong></td>
                <td>${result.write?.success ? '✅ GRANTED' : '❌ DENIED'}</td>
                <td>${result.write?.message || 'Not tested'}</td>
            </tr>
        `;
        
        // Add UPDATE results
        tableHTML += `
            <tr>
                <td><strong>UPDATE</strong></td>
                <td>${!result.update?.tested ? '⚠️ NOT TESTED' : 
                       result.update?.success ? '✅ GRANTED' : '❌ DENIED'}</td>
                <td>${result.update?.message || 'Not tested'}</td>
            </tr>
        `;
        
        // Add DELETE results
        tableHTML += `
            <tr>
                <td><strong>DELETE</strong></td>
                <td>${!result.delete?.tested ? '⚠️ NOT TESTED' : 
                       result.delete?.success ? '✅ GRANTED' : '❌ DENIED'}</td>
                <td>${result.delete?.message || 'Not tested'}</td>
            </tr>
        `;
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        // Add note if test document remains
        if (result.hasUncleanedTestDoc) {
            tableHTML += `
                <div class="permission-advice" style="margin-top: 5px;">
                    <strong>Note:</strong> A test document remains in this collection because delete permission was denied.
                </div>
            `;
        }
        
        resultItem.innerHTML = tableHTML;
        
        // Add to results div
        const loadingMsg = resultsDiv.querySelector('p');
        if (loadingMsg) resultsDiv.removeChild(loadingMsg);
        resultsDiv.appendChild(resultItem);
    }
    
    // Add advice based on results
    const readResults = Object.values(results).map(r => r.read?.success);
    const writeResults = Object.values(results).map(r => r.write?.success);
    const updateResults = Object.values(results).map(r => r.update?.success);
    const deleteResults = Object.values(results).map(r => r.delete?.success);
    
    const allReadsFailed = readResults.every(r => r === false);
    const allWritesFailed = writeResults.every(r => r === false);
    const someReadsFailed = readResults.some(r => r === false);
    const someWritesFailed = writeResults.some(r => r === false);
    
    const adviceDiv = document.createElement('div');
    adviceDiv.className = 'permission-advice';
    
    let adviceHTML = '<strong>Security Rules Analysis:</strong><br>';
    
    if (allReadsFailed && allWritesFailed) {
        adviceHTML += `• All operations failed: This likely indicates an authentication issue or overly restrictive Firestore rules.<br>
                      • Check that your rules include <code>allow read, write: if request.auth != null;</code> for collections that should be accessible.<br>`;
    } else if (allReadsFailed) {
        adviceHTML += `• All read operations failed but some writes succeeded: Your rules may be missing read permissions.<br>
                      • Check for missing <code>allow read</code> statements in your security rules.<br>`;
    } else if (allWritesFailed) {
        adviceHTML += `• All write operations failed but reads succeeded: Your rules may be set to read-only mode.<br>
                      • Add write permissions with <code>allow write: if request.auth != null;</code> to enable writes.<br>`;
    } else if (someReadsFailed || someWritesFailed) {
        adviceHTML += `• Some operations failed: Your rules appear to be selective about which collections are accessible.<br>
                      • This may be intentional if different collections need different access levels.<br>`;
    } else {
        adviceHTML += `• All basic operations succeeded: Your Firestore permissions are working correctly for these collections.<br>`;
    }
    
    if (anyHasUncleanedTestDoc) {
        adviceHTML += `<br><strong>Warning:</strong> Some test documents could not be deleted. These will remain in your database and may need manual cleanup.<br>`;
    }
    
    adviceHTML += `<br><strong>Recommended Security Rules:</strong><br>
                 <code>
                 rules_version = '2';<br>
                 service cloud.firestore {<br>
                   match /databases/{database}/documents {<br>
                     // Allow authenticated users to read and write to all collections<br>
                     match /{document=**} {<br>
                       allow read, write: if request.auth != null;<br>
                     }<br>
                     <br>
                     // Optional: Add more specific rules for certain collections<br>
                     match /users/{userId} {<br>
                       // Users can only read/write their own documents<br>
                       allow read, write: if request.auth != null && request.auth.uid == userId;<br>
                     }<br>
                   }<br>
                 }</code>`;
    
    adviceDiv.innerHTML = adviceHTML;
    resultsDiv.appendChild(adviceDiv);
    
    return results;
}

// Function to migrate existing user data to ensure consistent role fields
async function migrateUserRoleFields() {
    const collections = ['users', 'farmers'];
    let totalUpdated = 0;
    
    // Role mapping to ensure proper capitalization
    const roleMapping = {
        'admin': 'Administrator',
        'Admin': 'Administrator',
        'administrator': 'Administrator',
        'Administrator': 'Administrator',
        'dispatch_manager': 'Dispatch Manager',
        'Dispatch_Manager': 'Dispatch Manager',
        'dispatch manager': 'Dispatch Manager',
        'Dispatch Manager': 'Dispatch Manager',
        'inventory_manager': 'Inventory Manager',
        'Inventory_Manager': 'Inventory Manager',
        'inventory manager': 'Inventory Manager',
        'Inventory Manager': 'Inventory Manager',
        'finance_manager': 'Finance Manager',
        'Finance_Manager': 'Finance Manager',
        'finance manager': 'Finance Manager',
        'Finance Manager': 'Finance Manager',
        'driver': 'Driver',
        'Driver': 'Driver',
        'trainer': 'Trainer',
        'Trainer': 'Trainer',
        'supplier': 'Supplier',
        'Supplier': 'Supplier',
        'farmer': 'Farmer',
        'Farmer': 'Farmer'
    };
    
    console.log('🔄 Starting user role field migration...');
    
    for (const collectionName of collections) {
        try {
            console.log(`📋 Processing ${collectionName} collection...`);
            const snapshot = await getDocs(collection(db, collectionName));
            
            for (const docSnap of snapshot.docs) {
                const userData = docSnap.data();
                const userId = docSnap.id;
                let needsUpdate = false;
                const updates = {};
                
                // Get the current role value (from either field)
                const currentRole = userData.role || userData.Role;
                
                // Normalize the role using the mapping
                const normalizedRole = roleMapping[currentRole] || currentRole;
                
                // Check if user needs role field updates
                if (currentRole && normalizedRole !== userData.role) {
                    updates.role = normalizedRole;
                    needsUpdate = true;
                    console.log(`📝 Updating 'role' field for user ${userId}: ${currentRole} -> ${normalizedRole}`);
                }
                
                // Ensure userRole field exists with proper capitalization
                if (!userData.userRole || userData.userRole !== normalizedRole) {
                    updates.userRole = normalizedRole;
                    needsUpdate = true;
                    console.log(`📝 Adding/updating 'userRole' field for user ${userId}: ${normalizedRole}`);
                }
                
                // Keep uppercase Role field for backwards compatibility
                if (currentRole && normalizedRole !== userData.Role) {
                    updates.Role = normalizedRole;
                    needsUpdate = true;
                }
                
                // Apply updates if needed
                if (needsUpdate) {
                    try {
                        await updateDoc(doc(db, collectionName, userId), updates);
                        totalUpdated++;
                        console.log(`✅ Updated user ${userId} in ${collectionName}`);
                    } catch (error) {
                        console.error(`❌ Failed to update user ${userId}:`, error);
                    }
                }
            }
            
        } catch (error) {
            console.error(`❌ Error processing ${collectionName}:`, error);
        }
    }
    
    console.log(`🎉 Migration complete! Updated ${totalUpdated} user documents.`);
    alert(`Migration complete! Updated role fields for ${totalUpdated} users.\n\nAll roles now have proper capitalization:\n• "Dispatch Manager" (not "Dispatch_Manager")\n• "Inventory Manager" (not "Inventory_Manager")\n• "Administrator" (not "Admin")\n\nThis ensures compatibility with FlutterFlow role-based routing.`);
    
    // Refresh the user list to show updated data
    fetchUsers();
}

// Add migration button to the page
document.addEventListener('DOMContentLoaded', () => {
    // Add migration button after the main content loads
    setTimeout(() => {
        const mainDiv = document.getElementById('main');
        if (mainDiv) {
            const migrationButton = document.createElement('button');
            migrationButton.textContent = '🔄 Migrate User Role Fields';
            migrationButton.className = 'migration-button';
            migrationButton.style.cssText = `
                background: #4CAF50; 
                color: white; 
                padding: 10px 20px; 
                border: none; 
                border-radius: 5px; 
                cursor: pointer; 
                margin: 10px 0;
                font-weight: bold;
            `;
            migrationButton.onclick = migrateUserRoleFields;
            
            // Add diagnostic button
            const diagnosticButton = document.createElement('button');
            diagnosticButton.textContent = '🔍 Check User Role Fields';
            diagnosticButton.className = 'diagnostic-button';
            diagnosticButton.style.cssText = `
                background: #2196F3; 
                color: white; 
                padding: 10px 20px; 
                border: none; 
                border-radius: 5px; 
                cursor: pointer; 
                margin: 10px 5px;
                font-weight: bold;
            `;
            diagnosticButton.onclick = async () => {
                const userId = prompt('Enter User ID to check (e.g., ZBjvuk702CXSix2rbeeeUpmD1vy2):');
                if (userId) {
                    await checkUserRoleFields(userId);
                }
            };
            
            // Add FlutterFlow custom claims migration button
            const flutterFlowButton = document.createElement('button');
            flutterFlowButton.textContent = '🦋 FlutterFlow Role Migration';
            flutterFlowButton.className = 'flutterflow-button';
            flutterFlowButton.style.cssText = `
                background: #6B46C1; 
                color: white; 
                padding: 10px 20px; 
                border: none; 
                border-radius: 5px; 
                cursor: pointer; 
                margin: 10px 5px;
                font-weight: bold;
            `;
            flutterFlowButton.onclick = migrateUserRoleFieldsWithClaims;
            
            // Add Cloud Function helper button
            const cloudFunctionButton = document.createElement('button');
            cloudFunctionButton.textContent = '☁️ Show Cloud Function Code';
            cloudFunctionButton.className = 'cloud-function-button';
            cloudFunctionButton.style.cssText = `
                background: #FF9800; 
                color: white; 
                padding: 10px 20px; 
                border: none; 
                border-radius: 5px; 
                cursor: pointer; 
                margin: 10px 5px;
                font-weight: bold;
            `;
            cloudFunctionButton.onclick = showCloudFunctionCode;
            
            // Insert after the welcome message
            const welcomeH2 = mainDiv.querySelector('h2');
            if (welcomeH2) {
                welcomeH2.insertAdjacentElement('afterend', migrationButton);
                migrationButton.insertAdjacentElement('afterend', diagnosticButton);
                diagnosticButton.insertAdjacentElement('afterend', flutterFlowButton);
                flutterFlowButton.insertAdjacentElement('afterend', cloudFunctionButton);
            }
        }
    }, 1000);
});

// Function to check a specific user's role field structure
async function checkUserRoleFields(userId) {
    const collections = ['users', 'farmers'];
    let found = false;
    
    // Expected role formats for FlutterFlow
    const expectedRoles = [
        'Administrator',
        'Finance Manager',
        'Dispatch Manager', 
        'Driver',
        'Inventory Manager',
        'Trainer',
        'Supplier',
        'Farmer'
    ];
    
    console.log(`🔍 Checking user ${userId} role fields...`);
    
    for (const collectionName of collections) {
        try {
            const userDoc = await getDoc(doc(db, collectionName, userId));
            if (userDoc.exists()) {
                found = true;
                const userData = userDoc.data();
                
                console.log(`📋 Found user in ${collectionName} collection:`);
                console.log('📊 Role field analysis:', {
                    'role (lowercase)': userData.role || 'NOT SET',
                    'Role (uppercase)': userData.Role || 'NOT SET', 
                    'userRole': userData.userRole || 'NOT SET',
                    'email': userData.email,
                    'F_Name': userData.F_Name
                });
                
                let status = `User: ${userData.F_Name || userData.email}\n`;
                status += `Collection: ${collectionName}\n\n`;
                status += `Role Fields:\n`;
                status += `• role (lowercase): ${userData.role || 'NOT SET'}\n`;
                status += `• Role (uppercase): ${userData.Role || 'NOT SET'}\n`;
                status += `• userRole: ${userData.userRole || 'NOT SET'}\n\n`;
                
                // Check capitalization
                const currentRole = userData.role || userData.Role;
                const hasCorrectCapitalization = expectedRoles.includes(currentRole);
                
                status += `Capitalization Check:\n`;
                status += `• Current role: "${currentRole}"\n`;
                status += `• Expected formats: ${expectedRoles.join(', ')}\n`;
                status += `• Correct capitalization: ${hasCorrectCapitalization ? '✅ YES' : '❌ NO'}\n\n`;
                
                if (userData.role && userData.userRole && hasCorrectCapitalization) {
                    status += `✅ User has correct role fields for FlutterFlow routing`;
                } else if (userData.Role && !userData.role) {
                    status += `⚠️ User has old Role field. Run migration to fix.`;
                } else if (!hasCorrectCapitalization) {
                    status += `⚠️ Role has incorrect capitalization. Run migration to fix.`;
                } else {
                    status += `❌ User missing required role fields. Update user data.`;
                }
                
                alert(status);
                break;
            }
        } catch (error) {
            console.error(`Error checking ${collectionName}:`, error);
        }
    }
    
    if (!found) {
        alert(`❌ User ${userId} not found in either users or farmers collection.`);
    }
}

// Function to set custom claims (requires Firebase Admin SDK or Cloud Functions)
async function setUserCustomClaims(uid, claims) {
    try {
        // This is a client-side workaround since we can't directly set custom claims
        // We'll create a document in a special collection that can be processed by a Cloud Function
        await setDoc(doc(db, 'customClaimRequests', uid), {
            uid: uid,
            claims: claims,
            timestamp: new Date(),
            processed: false
        });
        
        console.log(`📝 Custom claim request created for user ${uid}:`, claims);
        
        // Note: You would need a Cloud Function to actually set the custom claims
        return true;
    } catch (error) {
        console.error('❌ Error creating custom claim request:', error);
        return false;
    }
}

// Enhanced migration function that also handles custom claims
async function migrateUserRoleFieldsWithClaims() {
    const collections = ['users', 'farmers'];
    let totalUpdated = 0;
    
    // Role mapping to ensure proper capitalization
    const roleMapping = {
        'admin': 'Administrator',
        'Admin': 'Administrator',
        'administrator': 'Administrator',
        'Administrator': 'Administrator',
        'dispatch_manager': 'Dispatch Manager',
        'Dispatch_Manager': 'Dispatch Manager',
        'dispatch manager': 'Dispatch Manager',
        'Dispatch Manager': 'Dispatch Manager',
        'inventory_manager': 'Inventory Manager',
        'Inventory_Manager': 'Inventory Manager',
        'inventory manager': 'Inventory Manager',
        'Inventory Manager': 'Inventory Manager',
        'finance_manager': 'Finance Manager',
        'Finance_Manager': 'Finance Manager',
        'finance manager': 'Finance Manager',
        'Finance Manager': 'Finance Manager',
        'driver': 'Driver',
        'Driver': 'Driver',
        'trainer': 'Trainer',
        'Trainer': 'Trainer',
        'supplier': 'Supplier',
        'Supplier': 'Supplier',
        'farmer': 'Farmer',
        'Farmer': 'Farmer'
    };
    
    console.log('🔄 Starting user role field migration with custom claims...');
    
    for (const collectionName of collections) {
        try {
            console.log(`📋 Processing ${collectionName} collection...`);
            const snapshot = await getDocs(collection(db, collectionName));
            
            for (const docSnap of snapshot.docs) {
                const userData = docSnap.data();
                const userId = docSnap.id;
                let needsUpdate = false;
                const updates = {};
                
                // Get the current role value (from either field)
                const currentRole = userData.role || userData.Role;
                
                // Normalize the role using the mapping
                const normalizedRole = roleMapping[currentRole] || currentRole;
                
                if (normalizedRole) {
                    // Update Firestore document
                    updates.role = normalizedRole;
                    updates.userRole = normalizedRole;
                    updates.Role = normalizedRole; // backwards compatibility
                    needsUpdate = true;
                    
                    // Create custom claims request
                    await setUserCustomClaims(userId, {
                        role: normalizedRole,
                        userRole: normalizedRole,
                        collection: collectionName
                    });
                }
                
                // Apply updates if needed
                if (needsUpdate) {
                    try {
                        await updateDoc(doc(db, collectionName, userId), updates);
                        totalUpdated++;
                        console.log(`✅ Updated user ${userId} in ${collectionName} with role: ${normalizedRole}`);
                    } catch (error) {
                        console.error(`❌ Failed to update user ${userId}:`, error);
                    }
                }
            }
            
        } catch (error) {
            console.error(`❌ Error processing ${collectionName}:`, error);
        }
    }
    
    console.log(`🎉 Migration complete! Updated ${totalUpdated} user documents.`);
    
    const message = `Migration complete! Updated role fields for ${totalUpdated} users.\n\n` +
        `✅ Updated Firestore collections with proper role fields\n` +
        `✅ Created custom claim requests for Firebase Auth users\n\n` +
        `⚠️ IMPORTANT: For FlutterFlow role-based routing to work, you need to:\n` +
        `1. Deploy a Cloud Function to process custom claims\n` +
        `2. Have users log out and log back in\n\n` +
        `Would you like me to show you the Cloud Function code needed?`;
    
    alert(message);
    
    // Refresh the user list to show updated data
    fetchUsers();
}

// Function to show the Cloud Function code needed for custom claims
function showCloudFunctionCode() {
    const cloudFunctionCode = `
// Firebase Cloud Function to set custom claims based on Firestore data
// Deploy this to Firebase Functions to enable FlutterFlow role-based routing

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Trigger when customClaimRequests documents are created
exports.processCustomClaims = functions.firestore
    .document('customClaimRequests/{userId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const userId = context.params.userId;
        
        try {
            // Set custom claims on the user
            await admin.auth().setCustomUserClaims(userId, data.claims);
            
            console.log(\`Custom claims set for user \${userId}:\`, data.claims);
            
            // Mark as processed
            await snap.ref.update({ processed: true });
            
        } catch (error) {
            console.error('Error setting custom claims:', error);
            await snap.ref.update({ 
                processed: false, 
                error: error.message 
            });
        }
    });

// Alternative: Manual trigger function
exports.setUserRole = functions.https.onCall(async (data, context) => {
    // Ensure the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 
            'The function must be called by an authenticated user.');
    }
    
    const { userId, role } = data;
    
    if (!userId || !role) {
        throw new functions.https.HttpsError('invalid-argument', 
            'userId and role are required.');
    }
    
    try {
        // Set custom claims
        await admin.auth().setCustomUserClaims(userId, {
            role: role,
            userRole: role
        });
        
        return { success: true, message: \`Role \${role} set for user \${userId}\` };
    } catch (error) {
        console.error('Error setting custom claims:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// Deploy with: firebase deploy --only functions
    `;
    
    // Create a modal or new window to display the code
    const codeWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    codeWindow.document.write(`
        <html>
            <head>
                <title>Cloud Function Code for Custom Claims</title>
                <style>
                    body { font-family: monospace; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
                    pre { background: #2d2d30; padding: 20px; border-radius: 5px; overflow: auto; }
                    h1 { color: #569cd6; }
                    .steps { background: #252526; padding: 15px; border-radius: 5px; margin: 10px 0; }
                    .command { background: #0d1117; color: #58a6ff; padding: 5px; border-radius: 3px; }
                </style>
            </head>
            <body>
                <h1>Firebase Cloud Function for Custom Claims</h1>
                
                <div class="steps">
                    <h2>📋 Setup Instructions:</h2>
                    <ol>
                        <li>Install Firebase CLI: <span class="command">npm install -g firebase-tools</span></li>
                        <li>Initialize functions: <span class="command">firebase init functions</span></li>
                        <li>Add this code to <strong>functions/index.js</strong></li>
                        <li>Deploy: <span class="command">firebase deploy --only functions</span></li>
                        <li>Run FlutterFlow migration to create custom claim requests</li>
                        <li>Users need to log out and back in for claims to take effect</li>
                    </ol>
                </div>
                
                <h2>📄 Cloud Function Code:</h2>
                <pre>${cloudFunctionCode}</pre>
                
                <div class="steps">
                    <h2>🎯 Alternative: Use FlutterFlow's Built-in User Documents</h2>
                    <p>Instead of custom claims, you can:</p>
                    <ol>
                        <li>Create a user document with the same UID as the authenticated user</li>
                        <li>Store role information in that document</li>
                        <li>Use Firestore rules to ensure users can only access their own data</li>
                        <li>In FlutterFlow, query the user document based on the authenticated user's UID</li>
                    </ol>
                </div>
            </body>
        </html>
    `);
}