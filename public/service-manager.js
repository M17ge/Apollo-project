import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    updateDoc, 
    doc, 
    getDoc,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { logActivity, logUpdate, logError } from './logging.js';

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

// Global data storage
let bookingsData = [];
let farmersData = {};
let trainersData = {};
let certificationsData = {};

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Service Manager logged in:", user);
            logActivity('service-manager', 'Service manager page accessed', { userId: user.uid });
            initializePage();
        } else {
            console.log("No user logged in");
            window.location.href = "index.html";
        }
    });

    // Modal functionality
    const modal = document.getElementById('assignTrainerModal');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancelAssign');

    closeBtn.onclick = () => { modal.style.display = 'none'; };
    cancelBtn.onclick = () => { modal.style.display = 'none'; };
    
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    // Form submission
    document.getElementById('assignTrainerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await assignTrainerToBooking();
    });

    // Trainer selection change event
    document.getElementById('modal-trainer-select').addEventListener('change', (e) => {
        showTrainerInfo(e.target.value);
    });

    // Filter controls
    document.getElementById('statusFilter').addEventListener('change', () => {
        displayBookingRequests();
    });

    document.getElementById('certificationFilter').addEventListener('change', () => {
        displayBookingRequests();
    });

    document.getElementById('refreshButton').addEventListener('click', async () => {
        await loadAllData();
        displayBookingRequests();
        updateStatistics();
    });
});

async function initializePage() {
    try {
        await loadAllData();
        displayBookingRequests();
        updateStatistics();
    } catch (error) {
        console.error("Error initializing page:", error);
        await logError('service-manager', 'Failed to initialize page', { error: error.message });
        alert("Error loading data. Please refresh the page.");
    }
}

async function loadAllData() {
    try {
        // Load farmers
        const farmersSnapshot = await getDocs(collection(db, "farmers"));
        farmersData = {};
        farmersSnapshot.forEach(doc => {
            farmersData[doc.id] = { id: doc.id, ...doc.data() };
        });

        // Load trainers (from users collection)
        const trainersSnapshot = await getDocs(
            query(collection(db, "users"), where("role", "==", "Trainer"))
        );
        trainersData = {};
        trainersSnapshot.forEach(doc => {
            trainersData[doc.id] = { id: doc.id, ...doc.data() };
        });

        // Load certifications
        const certificationsSnapshot = await getDocs(collection(db, "certifications"));
        certificationsData = {};
        certificationsSnapshot.forEach(doc => {
            certificationsData[doc.id] = { id: doc.id, ...doc.data() };
        });

        // Load bookings
        const bookingsSnapshot = await getDocs(collection(db, "bookings"));
        bookingsData = [];
        bookingsSnapshot.forEach(doc => {
            bookingsData.push({ id: doc.id, ...doc.data() });
        });

        // Populate certification filter
        populateCertificationFilter();

        // Populate trainer dropdown in modal
        populateTrainerDropdown();

        console.log("Data loaded:", {
            farmers: Object.keys(farmersData).length,
            trainers: Object.keys(trainersData).length,
            certifications: Object.keys(certificationsData).length,
            bookings: bookingsData.length
        });

    } catch (error) {
        console.error("Error loading data:", error);
        await logError('service-manager', 'Failed to load data', { error: error.message });
        throw error;
    }
}

function populateCertificationFilter() {
    const certificationFilter = document.getElementById('certificationFilter');
    certificationFilter.innerHTML = '<option value="all">All Certifications</option>';
    
    Object.values(certificationsData).forEach(cert => {
        const option = document.createElement('option');
        option.value = cert.id;
        option.textContent = cert.certification_name || 'Unknown Certification';
        certificationFilter.appendChild(option);
    });
}

function populateTrainerDropdown() {
    const trainerSelect = document.getElementById('modal-trainer-select');
    trainerSelect.innerHTML = '<option value="">-- Select a Trainer --</option>';
    
    Object.values(trainersData).forEach(trainer => {
        const option = document.createElement('option');
        option.value = trainer.id;
        option.textContent = trainer.F_Name || trainer.email || 'Unknown Trainer';
        trainerSelect.appendChild(option);
    });
}

function showTrainerInfo(trainerId) {
    const trainerInfo = document.getElementById('trainer-info');
    
    if (!trainerId) {
        trainerInfo.style.display = 'none';
        return;
    }

    const trainer = trainersData[trainerId];
    if (trainer) {
        document.getElementById('trainer-display-name').textContent = trainer.F_Name || 'N/A';
        document.getElementById('trainer-phone').textContent = trainer.Phone_Number || 'N/A';
        document.getElementById('trainer-location').textContent = trainer.location || 'N/A';
        trainerInfo.style.display = 'block';
    } else {
        trainerInfo.style.display = 'none';
    }
}

function displayBookingRequests() {
    const tableBody = document.getElementById('requestsTable').querySelector('tbody');
    const noRequestsMessage = document.getElementById('noRequestsMessage');
    const statusFilter = document.getElementById('statusFilter').value;
    const certificationFilter = document.getElementById('certificationFilter').value;

    tableBody.innerHTML = '';

    // Filter bookings
    let filteredBookings = bookingsData.filter(booking => {
        // Status filter
        if (statusFilter === 'pending' && booking.booked === true) return false;
        if (statusFilter === 'confirmed' && booking.booked !== true) return false;

        // Certification filter
        if (certificationFilter !== 'all' && booking.certification_id !== certificationFilter) return false;

        return true;
    });

    if (filteredBookings.length === 0) {
        noRequestsMessage.style.display = 'block';
        return;
    }

    noRequestsMessage.style.display = 'none';

    filteredBookings.forEach(booking => {
        const row = document.createElement('tr');
        row.className = booking.booked ? 'confirmed' : 'pending';

        // Get related data
        const farmer = farmersData[booking.farmer_id] || {};
        const trainer = trainersData[booking.trainer_id] || {};
        const certification = certificationsData[booking.certification_id] || {};

        // Format start time
        let startTimeDisplay = 'Not set';
        if (booking.expected_start_time) {
            if (booking.expected_start_time.toDate) {
                startTimeDisplay = booking.expected_start_time.toDate().toLocaleString();
            } else if (booking.expected_start_time instanceof Date) {
                startTimeDisplay = booking.expected_start_time.toLocaleString();
            }
        }

        row.innerHTML = `
            <td>${booking.id}</td>
            <td>${farmer.F_Name || 'Unknown'}</td>
            <td>${farmer.Phone_Number || 'N/A'}</td>
            <td>${certification.certification_name || 'Unknown'}</td>
            <td>${startTimeDisplay}</td>
            <td>${booking.training_location || 'Not specified'}</td>
            <td>${trainer.F_Name || 'Not assigned'}</td>
            <td>
                <span class="status-badge ${booking.booked ? 'status-confirmed' : 'status-pending'}">
                    ${booking.booked ? 'Confirmed' : 'Pending'}
                </span>
            </td>
            <td>
                <button class="action-button" onclick="openAssignModal('${booking.id}')" ${booking.booked ? 'disabled' : ''}>
                    <i class="fas fa-user-plus"></i> ${booking.booked ? 'Assigned' : 'Assign Trainer'}
                </button>
                ${booking.booked ? `
                    <button class="action-button view-button" onclick="viewBookingDetails('${booking.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                ` : ''}
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Make functions available globally for onclick handlers
window.openAssignModal = function(bookingId) {
    const booking = bookingsData.find(b => b.id === bookingId);
    if (!booking) {
        alert("Booking not found");
        return;
    }

    const farmer = farmersData[booking.farmer_id] || {};
    const certification = certificationsData[booking.certification_id] || {};

    // Populate modal with booking details
    document.getElementById('modal-booking-id').value = bookingId;
    document.getElementById('modal-farmer-name').textContent = farmer.F_Name || 'Unknown';
    document.getElementById('modal-certification').textContent = certification.certification_name || 'Unknown';
    
    // Format start time for display
    let startTimeDisplay = 'Not set';
    let startTimeValue = '';
    if (booking.expected_start_time) {
        if (booking.expected_start_time.toDate) {
            const date = booking.expected_start_time.toDate();
            startTimeDisplay = date.toLocaleString();
            startTimeValue = formatDateForInput(date);
        }
    }
    
    document.getElementById('modal-start-time').textContent = startTimeDisplay;
    document.getElementById('modal-location').textContent = booking.training_location || 'Not specified';
    
    // Pre-fill form fields
    document.getElementById('modal-training-location').value = booking.training_location || farmer.location || '';
    document.getElementById('modal-expected-start').value = startTimeValue || formatDateForInput(new Date());
    document.getElementById('modal-trainer-select').value = booking.trainer_id || '';
    document.getElementById('modal-notes').value = '';
    
    // Show trainer info if already selected
    if (booking.trainer_id) {
        showTrainerInfo(booking.trainer_id);
    }

    // Show modal
    document.getElementById('assignTrainerModal').style.display = 'block';
}

window.viewBookingDetails = function(bookingId) {
    const booking = bookingsData.find(b => b.id === bookingId);
    if (!booking) {
        alert("Booking not found");
        return;
    }

    const farmer = farmersData[booking.farmer_id] || {};
    const trainer = trainersData[booking.trainer_id] || {};
    const certification = certificationsData[booking.certification_id] || {};

    let startTimeDisplay = 'Not set';
    if (booking.expected_start_time && booking.expected_start_time.toDate) {
        startTimeDisplay = booking.expected_start_time.toDate().toLocaleString();
    }

    const details = `
Booking Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Booking ID: ${booking.id}
Status: ${booking.booked ? 'CONFIRMED' : 'PENDING'}

Farmer Information:
• Name: ${farmer.F_Name || 'Unknown'}
• Contact: ${farmer.Phone_Number || 'N/A'}
• Location: ${farmer.location || 'N/A'}

Certification:
• ${certification.certification_name || 'Unknown'}

Trainer Assigned:
• Name: ${trainer.F_Name || 'Not assigned'}
• Contact: ${trainer.Phone_Number || 'N/A'}
• Location: ${trainer.location || 'N/A'}

Training Details:
• Expected Start: ${startTimeDisplay}
• Location: ${booking.training_location || 'Not specified'}
${booking.notes ? `\nNotes:\n${booking.notes}` : ''}
    `;

    alert(details);
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

async function assignTrainerToBooking() {
    const bookingId = document.getElementById('modal-booking-id').value;
    const trainerId = document.getElementById('modal-trainer-select').value;
    const trainingLocation = document.getElementById('modal-training-location').value;
    const expectedStart = new Date(document.getElementById('modal-expected-start').value);
    const notes = document.getElementById('modal-notes').value;

    if (!trainerId) {
        alert("Please select a trainer");
        return;
    }

    try {
        const bookingRef = doc(db, "bookings", bookingId);
        
        // Get old data for logging
        const oldBookingSnap = await getDoc(bookingRef);
        const oldData = oldBookingSnap.exists() ? oldBookingSnap.data() : null;

        const updateData = {
            trainer_id: trainerId,
            training_location: trainingLocation,
            expected_start_time: expectedStart,
            booked: true,
            notes: notes || null,
            assigned_at: new Date(),
            assigned_by: auth.currentUser?.uid || 'unknown'
        };

        await updateDoc(bookingRef, updateData);

        // Log the update
        await logUpdate('bookings', bookingId, updateData, oldData);
        await logActivity('service-manager', 'Trainer assigned to booking', {
            bookingId,
            trainerId,
            assignedBy: auth.currentUser?.uid
        });

        // Update local data
        const bookingIndex = bookingsData.findIndex(b => b.id === bookingId);
        if (bookingIndex !== -1) {
            bookingsData[bookingIndex] = { ...bookingsData[bookingIndex], ...updateData };
        }

        // Close modal and refresh display
        document.getElementById('assignTrainerModal').style.display = 'none';
        displayBookingRequests();
        updateStatistics();

        alert("Trainer successfully assigned to booking!");

    } catch (error) {
        console.error("Error assigning trainer:", error);
        await logError('service-manager', 'Failed to assign trainer', {
            bookingId,
            trainerId,
            error: error.message
        });
        alert("Error assigning trainer. Please try again.");
    }
}

function updateStatistics() {
    const pendingCount = bookingsData.filter(b => !b.booked).length;
    const confirmedCount = bookingsData.filter(b => b.booked === true).length;
    const trainersCount = Object.keys(trainersData).length;
    const certificationsCount = Object.keys(certificationsData).length;

    document.getElementById('stat-pending').textContent = pendingCount;
    document.getElementById('stat-confirmed').textContent = confirmedCount;
    document.getElementById('stat-trainers').textContent = trainersCount;
    document.getElementById('stat-certifications').textContent = certificationsCount;
}
