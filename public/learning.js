import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
// Import logging functions
import { logCreate, logUpdate, logDelete, logActivity, logError } from './logging.js';
// Import database utilities for foreign key management
import { 
    initializeDatabase, 
    validateDocumentReferences, 
    populateReferenceDropdown, 
    DISPLAY_FORMATTERS 
} from './database-utils.js';

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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize database utilities
initializeDatabase(db);

document.addEventListener('DOMContentLoaded', async () => {
    // Skip authentication for testing - directly initialize
    console.log("Initializing training manager...");
    
    // Initialize foreign key dropdowns
    await initializeForeignKeyDropdowns();
    
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
        await logActivity('learning_page_loaded', 'Learning/Training page accessed', 'test_trainer_id');
        console.log("Apollo logging system activated");
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
            
            // Get display names for foreign keys
            let certificationName = booking.certification_id || '';
            let farmerName = booking.farmer_id || '';
            let trainerName = booking.trainer_id || '';
            
            try {
                if (DISPLAY_FORMATTERS && DISPLAY_FORMATTERS.certification_id) {
                    certificationName = await DISPLAY_FORMATTERS.certification_id(booking.certification_id);
                }
                if (DISPLAY_FORMATTERS && DISPLAY_FORMATTERS.farmer_id) {
                    farmerName = await DISPLAY_FORMATTERS.farmer_id(booking.farmer_id);
                }
                if (DISPLAY_FORMATTERS && DISPLAY_FORMATTERS.trainer_id) {
                    trainerName = await DISPLAY_FORMATTERS.trainer_id(booking.trainer_id);
                }
            } catch (error) {
                console.error('Error formatting display names:', error);
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

        // Validate foreign key relationships
        const validation = await validateDocumentReferences('bookings', bookingData);
        
        if (!validation.valid) {
            alert('Validation errors:\n' + validation.errors.join('\n'));
            return;
        }
        
        let docRef;
        if (bookingID) {
            // Get the old data for logging
            const bookingRef = doc(db, "bookings", bookingID);
            const docSnap = await getDoc(bookingRef);
            const oldData = docSnap.exists() ? docSnap.data() : null;
            
            // Update existing booking with validated data
            validation.validatedData.updated_at = serverTimestamp();
            await updateDoc(bookingRef, validation.validatedData);
            docRef = bookingRef;
            
            // Log the update with our logging module
            await logUpdate('bookings', bookingID, validation.validatedData, oldData);
            
            alert("Booking updated successfully!");
        } else {
            // Add timestamps for new bookings
            validation.validatedData.created_at = serverTimestamp();
            validation.validatedData.updated_at = serverTimestamp();
            
            // Create new booking with validated data
            docRef = await addDoc(collection(db, "bookings"), validation.validatedData);
            
            // Log the creation with our logging module
            await logCreate('bookings', docRef.id, validation.validatedData);
            
            alert("Booking added successfully!");
        }
        await fetchBookings();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error adding/updating booking: ", error.code || '', msg);
        
        // Log the error with our logging module
        await logError('booking', "Failed to save booking", { 
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
            
            // Log the deletion with our logging module
            await logDelete('bookings', bookingID, deletedData);
            
            alert("Booking deleted successfully!");
            await fetchBookings();
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error deleting booking: ", error.code || '', msg);
            
            // Log the error with our logging module
            await logError('booking', "Failed to delete booking", { 
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

// Initialize foreign key dropdowns
async function initializeForeignKeyDropdowns() {
    try {
        // Populate certification dropdown
        await populateReferenceDropdown('certification_id', 'certification', 'name');
        
        // Populate farmer dropdown
        await populateReferenceDropdown('farmer_id', 'farmer', 'name');
        
        // Populate trainer dropdown with users who have trainer role
        await populateReferenceDropdown('trainer_id', 'users', 'name');
        
    } catch (error) {
        console.error('Error initializing foreign key dropdowns:', error);
    }
}
