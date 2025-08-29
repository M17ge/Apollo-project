import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { logActivity, logCreate, logUpdate, logDelete, logError } from './logging.js';

// Firebase configuration
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
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Initializing training manager...");
    logActivity('learning', 'Training manager initialized');
    
    // Load dropdown data
    await loadDropdownData();
    
    await fetchBookings();

    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form values
            const bookingID = document.getElementById('bookingId').value;
            const certification_id = document.getElementById('certification_id').value;
            const farmer_id = document.getElementById('farmer_id').value;
            const trainer_id = document.getElementById('trainer_id').value;
            const expected_start_time = new Date(document.getElementById('expected_start_time').value);
            const training_location = document.getElementById('training_location').value;
            const booked = document.getElementById('booked').value === 'true';
            
            // Call the addOrUpdateBooking function
            await addOrUpdateBooking(bookingID, certification_id, farmer_id, trainer_id, expected_start_time, training_location, booked);
            
            // Reset form and state
            e.target.reset();
            const submitButton = document.getElementById('submitBooking');
            if (submitButton) {
                submitButton.textContent = 'Add Booking';
            }
        });
    }

    // Log page access
    try {
        logActivity('learning', 'Learning page loaded');
        console.log("Learning system activated");
    } catch (error) {
        console.error('Logging error:', error);
    }
});

// Fetch and display bookings
async function fetchBookings() {
    try {
        const querySnapshot = await getDocs(collection(db, "bookings"));
        const tableBody = document.getElementById('bookingsTable');
        
        if (!tableBody) {
            console.error('Bookings table not found');
            return;
        }

        const tbody = tableBody.getElementsByTagName('tbody')[0];
        if (!tbody) {
            console.error('Bookings table tbody not found');
            return;
        }
        
        // Clear existing data
        tbody.innerHTML = '';

        for (const docSnap of querySnapshot.docs) {
            const booking = docSnap.data();
            const row = document.createElement('tr');
            
            // Format expected_start_time timestamp if it exists
            let startTimeDisplay = '';
            if (booking.expected_start_time && booking.expected_start_time.toDate) {
                startTimeDisplay = booking.expected_start_time.toDate().toLocaleString();
            } else if (booking.expected_start_time) {
                startTimeDisplay = new Date(booking.expected_start_time).toLocaleString();
            }
            
            // Get display names for foreign keys - simple approach
            let certificationName = booking.certification_id || 'N/A';
            let farmerName = booking.farmer_id || 'N/A';
            let trainerName = booking.trainer_id || 'N/A';
            
            // Try to get friendly names if possible
            try {
                if (booking.certification_id) {
                    const certDoc = await getDoc(doc(db, "certification", booking.certification_id));
                    if (certDoc.exists()) {
                        const certData = certDoc.data();
                        certificationName = certData.name || certData.certification_name || booking.certification_id;
                    }
                }
                
                if (booking.farmer_id) {
                    const farmerDoc = await getDoc(doc(db, "farmer", booking.farmer_id));
                    if (farmerDoc.exists()) {
                        const farmerData = farmerDoc.data();
                        farmerName = farmerData.name || farmerData.F_Name || booking.farmer_id;
                    }
                }
                
                if (booking.trainer_id) {
                    const trainerDoc = await getDoc(doc(db, "users", booking.trainer_id));
                    if (trainerDoc.exists()) {
                        const trainerData = trainerDoc.data();
                        trainerName = trainerData.F_Name || trainerData.name || trainerData.email || booking.trainer_id;
                    }
                }
            } catch (error) {
                console.error('Error loading reference data:', error);
            }
            
            // Create row HTML
            row.innerHTML = `
                <td>${docSnap.id}</td>
                <td>${certificationName}</td>
                <td>${farmerName}</td>
                <td>${trainerName}</td>
                <td>${startTimeDisplay}</td>
                <td>${booking.training_location || ''}</td>
                <td><span class="status ${booking.booked ? 'confirmed' : 'pending'}">${booking.booked ? 'Confirmed' : 'Pending'}</span></td>
                <td>
                    <button onclick="editBooking('${docSnap.id}')">Edit</button>
                    <button onclick="deleteBooking('${docSnap.id}')">Delete</button>
                </td>
            `;
            
            tbody.appendChild(row);
        }
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error fetching bookings: ", error.code || '', msg);
        alert(`An error occurred while fetching bookings: ${msg}`);
    }
}

// Add or update booking entry
async function addOrUpdateBooking(bookingID, certification_id, farmer_id, trainer_id, expected_start_time, training_location, booked) {
    try {
        // Create the booking data object
        const bookingData = {
            certification_id: certification_id,
            farmer_id: farmer_id,
            trainer_id: trainer_id,
            expected_start_time: expected_start_time,
            training_location: training_location,
            booked: booked
        };

        // Basic validation
        if (!certification_id) {
            alert('Please select a certification');
            return;
        }
        if (!farmer_id) {
            alert('Please select a farmer');
            return;
        }
        if (!trainer_id) {
            alert('Please select a trainer');
            return;
        }
        
        let docRef;
        if (bookingID) {
            // Get the old data for logging
            const bookingRef = doc(db, "bookings", bookingID);
            const docSnap = await getDoc(bookingRef);
            const oldData = docSnap.exists() ? docSnap.data() : null;
            
            // Update existing booking
            bookingData.updated_at = serverTimestamp();
            await updateDoc(bookingRef, bookingData);
            docRef = bookingRef;
            
            // Log the update
            logUpdate('learning', 'Updated booking', { bookingID, data: bookingData });
            
            alert("Booking updated successfully!");
        } else {
            // Add timestamps for new bookings
            bookingData.created_at = serverTimestamp();
            bookingData.updated_at = serverTimestamp();
            
            // Create new booking
            docRef = await addDoc(collection(db, "bookings"), bookingData);
            
            // Log the creation
            logCreate('learning', 'Created booking', { bookingID: docRef.id, data: bookingData });
            
            alert("Booking added successfully!");
        }
        await fetchBookings();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error adding/updating booking: ", error.code || '', msg);
        
        // Log the error
        logError('learning', 'Failed to save booking', { 
            bookingID, 
            error: msg,
            attempted_action: bookingID ? 'update' : 'create'
        });
        
        alert(`An error occurred while saving the booking: ${msg}`);
    }
}

// Delete booking entry
async function deleteBooking(bookingID) {
    if (confirm('Are you sure you want to delete this booking?')) {
        try {
            // Get the data that will be deleted for logging
            const bookingRef = doc(db, "bookings", bookingID);
            const docSnap = await getDoc(bookingRef);
            const deletedData = docSnap.exists() ? docSnap.data() : null;
            
            // Delete the document
            await deleteDoc(bookingRef);
            
            // Log the deletion
            logDelete('learning', 'Deleted booking', { bookingID, deletedData });
            
            alert("Booking deleted successfully!");
            await fetchBookings();
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error deleting booking: ", error.code || '', msg);
            
            // Log the error
            logError('learning', 'Failed to delete booking', { 
                bookingID, 
                error: msg
            });
            
            alert(`An error occurred while deleting the booking: ${msg}`);
        }
    }
}

// Edit booking entry
async function editBooking(bookingID) {
    try {
        const bookingRef = doc(db, "bookings", bookingID);
        const bookingSnap = await getDoc(bookingRef);
        
        if (bookingSnap.exists()) {
            const bookingData = bookingSnap.data();
            
            // Populate form with booking data
            const bookingIdInput = document.getElementById('bookingId');
            const certificationSelect = document.getElementById('certification_id');
            const farmerSelect = document.getElementById('farmer_id');
            const trainerSelect = document.getElementById('trainer_id');
            const startTimeInput = document.getElementById('expected_start_time');
            const locationInput = document.getElementById('training_location');
            const bookedSelect = document.getElementById('booked');
            const submitButton = document.getElementById('submitBooking');
            
            if (bookingIdInput) bookingIdInput.value = bookingID;
            if (certificationSelect) certificationSelect.value = bookingData.certification_id || '';
            if (farmerSelect) farmerSelect.value = bookingData.farmer_id || '';
            if (trainerSelect) trainerSelect.value = bookingData.trainer_id || '';
            if (locationInput) locationInput.value = bookingData.training_location || '';
            if (bookedSelect) bookedSelect.value = bookingData.booked ? 'true' : 'false';
            if (submitButton) submitButton.textContent = 'Update Booking';
            
            // Format datetime for input
            if (startTimeInput && bookingData.expected_start_time) {
                if (bookingData.expected_start_time.toDate) {
                    startTimeInput.value = bookingData.expected_start_time.toDate().toISOString().slice(0, 16);
                } else {
                    startTimeInput.value = new Date(bookingData.expected_start_time).toISOString().slice(0, 16);
                }
            }
            
            // Scroll to form
            const bookingForm = document.getElementById('bookingForm');
            if (bookingForm) {
                bookingForm.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            console.error("Booking not found");
            alert("Booking not found");
        }
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error getting booking: ", error.code || '', msg);
        alert(`An error occurred while getting booking data: ${msg}`);
    }
}

// Make functions available globally for onclick handlers
window.editBooking = editBooking;
window.deleteBooking = deleteBooking;

// Load dropdown data
async function loadDropdownData() {
    try {
        console.log('Loading dropdown data for learning page...');
        
        // Load certifications
        const certSelect = document.getElementById('certification_id');
        if (certSelect) {
            const certSnapshot = await getDocs(collection(db, "certification"));
            certSnapshot.forEach((doc) => {
                const data = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = data.name || data.certification_name || doc.id;
                certSelect.appendChild(option);
            });
        }
        
        // Load farmers
        const farmerSelect = document.getElementById('farmer_id');
        if (farmerSelect) {
            const farmerSnapshot = await getDocs(collection(db, "farmer"));
            farmerSnapshot.forEach((doc) => {
                const data = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = data.name || data.F_Name || doc.id;
                farmerSelect.appendChild(option);
            });
        }
        
        // Load users as trainers
        const trainerSelect = document.getElementById('trainer_id');
        if (trainerSelect) {
            const userSnapshot = await getDocs(collection(db, "users"));
            userSnapshot.forEach((doc) => {
                const data = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = data.F_Name || data.name || data.email || doc.id;
                trainerSelect.appendChild(option);
            });
        }
        
        console.log('Dropdown data loaded successfully');
    } catch (error) {
        console.error('Error loading dropdown data:', error);
        logError('learning', 'Error loading dropdown data', { error: error.message });
    }
}
