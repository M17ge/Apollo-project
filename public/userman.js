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