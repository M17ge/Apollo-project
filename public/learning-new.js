import { db, validateDocumentReferences, populateReferenceDropdown } from './database-utils.js';
import { 
    collection, 
    getDocs, 
    addDoc, 
    doc, 
    updateDoc, 
    deleteDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

class TrainerManager {
    constructor() {
        this.certificationForm = document.getElementById('certificationForm');
        this.bookingForm = document.getElementById('bookingForm');
        this.certificationTable = document.getElementById('certificationTable').getElementsByTagName('tbody')[0];
        this.confirmedBookingsTable = document.getElementById('confirmedBookingsTable').getElementsByTagName('tbody')[0];
        this.pendingBookingsTable = document.getElementById('pendingBookingsTable').getElementsByTagName('tbody')[0];
        this.trainerScheduleTable = document.getElementById('trainerScheduleTable').getElementsByTagName('tbody')[0];
        
        this.currentUser = this.getCurrentUser();
        this.init();
    }

    getCurrentUser() {
        // In a real app, get from authentication
        return { id: 'current_user_id', role: 'trainer' };
    }

    async init() {
        this.attachEventListeners();
        await this.populateDropdowns();
        await this.loadCertifications();
        await this.loadBookings();
        await this.loadTrainerSchedule();
    }

    attachEventListeners() {
        this.certificationForm.addEventListener('submit', (e) => this.handleCertificationSubmit(e));
        this.bookingForm.addEventListener('submit', (e) => this.handleBookingSubmit(e));
    }

    async populateDropdowns() {
        try {
            await populateReferenceDropdown('certification_id', 'certification', 'name');
            await populateReferenceDropdown('farmer_id', 'farmer', 'name');
            await populateReferenceDropdown('trainer_id', 'users', 'name', 
                doc => doc.role === 'trainer');
        } catch (error) {
            console.error('Error populating dropdowns:', error);
        }
    }

    async handleCertificationSubmit(e) {
        e.preventDefault();
        
        const certId = document.getElementById('certId').value.trim();
        const name = document.getElementById('name').value.trim();
        const duration = document.getElementById('duration').value.trim();
        const price = parseFloat(document.getElementById('price').value);
        const description = document.getElementById('description').value.trim();
        const prerequisites = document.getElementById('prerequisites').value.trim();

        if (!name || !duration || isNaN(price)) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            const certificationData = {
                name,
                duration,
                price,
                description,
                prerequisites,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            if (certId) {
                // Update existing certification
                const certRef = doc(db, 'certification', certId);
                await updateDoc(certRef, certificationData);
                alert('Certification updated successfully!');
            } else {
                // Add new certification
                await addDoc(collection(db, 'certification'), certificationData);
                alert('Certification added successfully!');
            }

            this.resetCertificationForm();
            await this.loadCertifications();
            await this.populateDropdowns(); // Refresh dropdowns
        } catch (error) {
            console.error('Error managing certification:', error);
            alert('Error managing certification. Please try again.');
        }
    }

    async handleBookingSubmit(e) {
        e.preventDefault();
        
        const bookingId = document.getElementById('bookingId').value.trim();
        const certification_id = document.getElementById('certification_id').value;
        const farmer_id = document.getElementById('farmer_id').value;
        const trainer_id = document.getElementById('trainer_id').value;
        const expected_start_time = document.getElementById('expected_start_time').value;
        const training_location = document.getElementById('training_location').value;
        const booked = document.getElementById('booked').value === 'true';
        const booking_notes = document.getElementById('booking_notes').value;

        if (!certification_id || !farmer_id || !trainer_id || !expected_start_time) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            // Validate foreign key references
            const isValid = await validateDocumentReferences({
                certification_id,
                farmer_id,
                trainer_id
            });

            if (!isValid) {
                alert('Invalid reference selected. Please check your selections.');
                return;
            }

            const bookingData = {
                certification_id,
                farmer_id,
                trainer_id,
                expected_start_time,
                training_location,
                booked,
                booking_notes,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            if (bookingId) {
                // Update existing booking
                const bookingRef = doc(db, 'bookings', bookingId);
                await updateDoc(bookingRef, bookingData);
                alert('Booking updated successfully!');
            } else {
                // Add new booking
                await addDoc(collection(db, 'bookings'), bookingData);
                alert('Booking added successfully!');
            }

            this.resetBookingForm();
            await this.loadBookings();
            await this.loadTrainerSchedule();
        } catch (error) {
            console.error('Error managing booking:', error);
            alert('Error managing booking. Please try again.');
        }
    }

    async loadCertifications() {
        try {
            const snapshot = await getDocs(collection(db, 'certification'));
            this.certificationTable.innerHTML = '';

            snapshot.forEach((doc) => {
                const certification = doc.data();
                const row = this.certificationTable.insertRow();
                
                row.innerHTML = `
                    <td>${doc.id.substring(0, 8)}...</td>
                    <td>${certification.name}</td>
                    <td>${certification.duration}</td>
                    <td>$${certification.price.toFixed(2)}</td>
                    <td>${certification.description || 'No description'}</td>
                    <td>
                        <button onclick="trainerManager.editCertification('${doc.id}', '${certification.name}', '${certification.duration}', ${certification.price}, '${certification.description || ''}', '${certification.prerequisites || ''}')">Edit</button>
                        <button onclick="trainerManager.deleteCertification('${doc.id}')">Delete</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error loading certifications:', error);
            alert('Error loading certifications.');
        }
    }

    async loadBookings() {
        try {
            const snapshot = await getDocs(collection(db, 'bookings'));
            this.confirmedBookingsTable.innerHTML = '';
            this.pendingBookingsTable.innerHTML = '';

            const certifications = new Map();
            const farmers = new Map();
            const trainers = new Map();

            // Load reference data
            const [certSnapshot, farmerSnapshot, trainerSnapshot] = await Promise.all([
                getDocs(collection(db, 'certification')),
                getDocs(collection(db, 'farmer')),
                getDocs(query(collection(db, 'users'), where('role', '==', 'trainer')))
            ]);

            certSnapshot.forEach(doc => certifications.set(doc.id, doc.data()));
            farmerSnapshot.forEach(doc => farmers.set(doc.id, doc.data()));
            trainerSnapshot.forEach(doc => trainers.set(doc.id, doc.data()));

            snapshot.forEach((doc) => {
                const booking = doc.data();
                const certification = certifications.get(booking.certification_id);
                const farmer = farmers.get(booking.farmer_id);
                const trainer = trainers.get(booking.trainer_id);

                const row = `
                    <td>${doc.id.substring(0, 8)}...</td>
                    <td>${certification?.name || 'Unknown'}</td>
                    <td>${farmer?.name || 'Unknown'}</td>
                    <td>${trainer?.name || 'Unknown'}</td>
                    <td>${new Date(booking.expected_start_time).toLocaleString()}</td>
                    <td>${booking.training_location || 'TBD'}</td>
                    <td>
                        <button onclick="trainerManager.editBooking('${doc.id}')">Edit</button>
                        <button onclick="trainerManager.toggleBookingStatus('${doc.id}', ${!booking.booked})">${booking.booked ? 'Mark Pending' : 'Confirm'}</button>
                        <button onclick="trainerManager.deleteBooking('${doc.id}')">Delete</button>
                    </td>
                `;

                if (booking.booked) {
                    this.confirmedBookingsTable.insertRow().innerHTML = row;
                } else {
                    this.pendingBookingsTable.insertRow().innerHTML = row;
                }
            });
        } catch (error) {
            console.error('Error loading bookings:', error);
            alert('Error loading bookings.');
        }
    }

    async loadTrainerSchedule() {
        try {
            // Get all bookings for schedule view (in a real app, filter by current trainer)
            const bookingsQuery = query(
                collection(db, 'bookings'),
                where('booked', '==', true),
                orderBy('expected_start_time')
            );

            const snapshot = await getDocs(bookingsQuery);
            this.trainerScheduleTable.innerHTML = '';

            const certifications = new Map();
            const farmers = new Map();

            // Load reference data
            const [certSnapshot, farmerSnapshot] = await Promise.all([
                getDocs(collection(db, 'certification')),
                getDocs(collection(db, 'farmer'))
            ]);

            certSnapshot.forEach(doc => certifications.set(doc.id, doc.data()));
            farmerSnapshot.forEach(doc => farmers.set(doc.id, doc.data()));

            snapshot.forEach((doc) => {
                const booking = doc.data();
                const certification = certifications.get(booking.certification_id);
                const farmer = farmers.get(booking.farmer_id);
                const startTime = new Date(booking.expected_start_time);

                const row = this.trainerScheduleTable.insertRow();
                row.innerHTML = `
                    <td>${startTime.toLocaleDateString()}</td>
                    <td>${startTime.toLocaleTimeString()}</td>
                    <td>${certification?.name || 'Unknown'}</td>
                    <td>${farmer?.name || 'Unknown'}</td>
                    <td>${booking.training_location || 'TBD'}</td>
                    <td><span class="status-confirmed">Confirmed</span></td>
                    <td>
                        <button onclick="trainerManager.viewBookingDetails('${doc.id}')">Details</button>
                        <button onclick="trainerManager.completeTraining('${doc.id}')">Complete</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error loading trainer schedule:', error);
        }
    }

    editCertification(id, name, duration, price, description, prerequisites) {
        document.getElementById('certId').value = id;
        document.getElementById('name').value = name;
        document.getElementById('duration').value = duration;
        document.getElementById('price').value = price;
        document.getElementById('description').value = description;
        document.getElementById('prerequisites').value = prerequisites;
        document.getElementById('submitCertification').textContent = 'Update Certification';
    }

    async editBooking(bookingId) {
        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            const bookingSnap = await getDoc(bookingRef);
            
            if (bookingSnap.exists()) {
                const booking = bookingSnap.data();
                
                document.getElementById('bookingId').value = bookingId;
                document.getElementById('certification_id').value = booking.certification_id;
                document.getElementById('farmer_id').value = booking.farmer_id;
                document.getElementById('trainer_id').value = booking.trainer_id;
                document.getElementById('expected_start_time').value = booking.expected_start_time;
                document.getElementById('training_location').value = booking.training_location;
                document.getElementById('booked').value = booking.booked.toString();
                document.getElementById('booking_notes').value = booking.booking_notes;
                document.getElementById('submitBooking').textContent = 'Update Booking';
            }
        } catch (error) {
            console.error('Error loading booking for edit:', error);
        }
    }

    async toggleBookingStatus(bookingId, newStatus) {
        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            await updateDoc(bookingRef, { 
                booked: newStatus,
                updated_at: new Date().toISOString()
            });
            await this.loadBookings();
            await this.loadTrainerSchedule();
        } catch (error) {
            console.error('Error updating booking status:', error);
        }
    }

    async deleteCertification(id) {
        if (confirm('Are you sure you want to delete this certification?')) {
            try {
                await deleteDoc(doc(db, 'certification', id));
                alert('Certification deleted successfully!');
                await this.loadCertifications();
                await this.populateDropdowns();
            } catch (error) {
                console.error('Error deleting certification:', error);
                alert('Error deleting certification.');
            }
        }
    }

    async deleteBooking(id) {
        if (confirm('Are you sure you want to delete this booking?')) {
            try {
                await deleteDoc(doc(db, 'bookings', id));
                alert('Booking deleted successfully!');
                await this.loadBookings();
                await this.loadTrainerSchedule();
            } catch (error) {
                console.error('Error deleting booking:', error);
                alert('Error deleting booking.');
            }
        }
    }

    async completeTraining(bookingId) {
        if (confirm('Mark this training as completed?')) {
            try {
                const bookingRef = doc(db, 'bookings', bookingId);
                await updateDoc(bookingRef, {
                    completed: true,
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
                alert('Training marked as completed!');
                await this.loadTrainerSchedule();
            } catch (error) {
                console.error('Error completing training:', error);
            }
        }
    }

    viewBookingDetails(bookingId) {
        // This could open a modal or navigate to a details page
        alert(`View details for booking: ${bookingId}`);
    }

    resetCertificationForm() {
        this.certificationForm.reset();
        document.getElementById('certId').value = '';
        document.getElementById('submitCertification').textContent = 'Add Certification';
    }

    resetBookingForm() {
        this.bookingForm.reset();
        document.getElementById('bookingId').value = '';
        document.getElementById('submitBooking').textContent = 'Add Booking';
    }
}

// Initialize the trainer manager when the page loads
const trainerManager = new TrainerManager();

// Make it globally accessible for onclick handlers
window.trainerManager = trainerManager;
