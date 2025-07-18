import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { logCreate, logUpdate, logDelete, logActivity, logError } from './logging.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA2asaFAVw0PSlJFbyuPbOd3Zao-yqSS4g",
    authDomain: "apollo-mobile-7013d.firebaseapp.com",
    projectId: "apollo-mobile-7013d",
    storageBucket: "apollo-mobile-7013d.firebasestorage.app",
    messagingSenderId: "1044454240066",
    appId: "1:1044454240066:web:77e3984fb8fdfe6d2ea2db",
    measurementId: "G-FCKNKS0L5Z"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // Log page access
    logActivity('page_access', 'navigation', null, { page: 'delivery' });
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is logged in:", user);
            document.getElementById('manger_id').value = user.uid;
            fetchBookingData();
            fetchOrderingData();
            fetchDispatchData();
            
            // Event listener for dispatch form submission
            document.getElementById('dispatchForm').addEventListener('submit', function(event) {
                event.preventDefault();
                const dispatchId = this.dataset.dispatchId || null;
                const disTim = document.getElementById('disTim').value;
                const dispatched = document.getElementById('dispatched').value;
                const driverId = document.getElementById('driver_id').value;
                const location = document.getElementById('location').value;
                const mangerId = document.getElementById('manger_id').value;
                const vehicle = document.getElementById('vehicle').value;
                const bookingIds = document.getElementById('booking_id').value;
                const orderIds = document.getElementById('order_id').value;
                
                addOrUpdateDispatch(dispatchId, disTim, dispatched, driverId, location, mangerId, vehicle, bookingIds, orderIds);
                this.reset();
                delete this.dataset.dispatchId;
                document.getElementById('manger_id').value = user.uid; // Reset the manager ID
            });
        } else {
            console.log("No user is logged in");
            window.location.href = "login.html";
        }
    });
});

// Fetch and display booking data
async function fetchBookingData() {
    try {
        const querySnapshot = await getDocs(collection(db, "bookings"));
        const bookingTableBody = document.getElementById('bookingTable').getElementsByTagName('tbody')[0];
        bookingTableBody.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const booking = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${booking.certification_id || ''}</td>
                <td>${booking.farmer_id || ''}</td>
                <td>${booking.trainer_id || ''}</td>
                <td>${booking.Expected_Start_Time && booking.Expected_Start_Time.seconds ? new Date(booking.Expected_Start_Time.seconds * 1000).toLocaleString() : ''}</td>
                <td>${booking.booked ? 'Yes' : 'No'}</td>
                <td>
                    <button onclick="editBooking('${doc.id}', '${booking.certification_id || ''}', '${booking.farmer_id || ''}', '${booking.trainer_id || ''}', '${booking.Expected_Start_Time && booking.Expected_Start_Time.seconds ? new Date(booking.Expected_Start_Time.seconds * 1000).toISOString().slice(0, 16) : ''}', ${booking.booked})">Edit</button>
                    <button onclick="deleteBooking('${doc.id}')">Delete</button>
                </td>
            `;
            bookingTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching bookings: ", error.code, error.message);
        alert(`An error occurred while fetching bookings: ${error.message}`);
    }
}

// Fetch and display ordering data
async function fetchOrderingData() {
    try {
        const querySnapshot = await getDocs(collection(db, "order"));
        const orderingTableBody = document.getElementById('orderingTable').getElementsByTagName('tbody')[0];
        orderingTableBody.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const order = doc.data();
            const row = document.createElement('tr');
            
            // Format timestamps if they exist
            let etaDisplay = '';
            if (order.ETA && order.ETA.toDate) {
                etaDisplay = order.ETA.toDate().toLocaleString();
            }
            
            let createdAtDisplay = '';
            if (order.created_at && order.created_at.toDate) {
                createdAtDisplay = order.created_at.toDate().toLocaleString();
            }
            
            // Format product_id array for display
            let productIdsDisplay = '';
            if (order.product_id && Array.isArray(order.product_id)) {
                productIdsDisplay = order.product_id.map((item, index) => 
                    `${index}: ${item}`
                ).join(', ');
            }
            
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${etaDisplay}</td>
                <td>${order.Location || ''}</td>
                <td>${createdAtDisplay}</td>
                <td>${order.farmer_id || ''}</td>
                <td>${order.payment || ''}</td>
                <td>${productIdsDisplay}</td>
                <td>${order.quantity || ''}</td>
                <td>${order.totalprice || ''}</td>
                <td>
                    <button onclick="editOrder('${doc.id}')">Edit</button>
                    <button onclick="deleteOrder('${doc.id}')">Delete</button>
                </td>
            `;
            orderingTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching orders: ", error.code, error.message);
        alert(`An error occurred while fetching orders: ${error.message}`);
    }
}

// Fetch and display dispatch data
async function fetchDispatchData() {
    try {
        const querySnapshot = await getDocs(collection(db, "dispatches"));
        const dispatchTableBody = document.getElementById('dispatchTable').getElementsByTagName('tbody')[0];
        dispatchTableBody.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const dispatch = doc.data();
            const row = document.createElement('tr');
            
            // Format booking_id and order_id arrays for display
            let bookingIds = Array.isArray(dispatch.booking_id) ? dispatch.booking_id.join(', ') : dispatch.booking_id || '';
            let orderIds = Array.isArray(dispatch.order_id) ? dispatch.order_id.join(', ') : dispatch.order_id || '';
            
            // Format dispatch time
            let dispatchTime = '';
            if (dispatch.DisTim) {
                if (dispatch.DisTim.seconds) {
                    dispatchTime = new Date(dispatch.DisTim.seconds * 1000).toLocaleString();
                } else if (dispatch.DisTim instanceof Date) {
                    dispatchTime = dispatch.DisTim.toLocaleString();
                } else {
                    dispatchTime = String(dispatch.DisTim);
                }
            }
            
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${dispatchTime}</td>
                <td>${dispatch.Dispatched ? 'Yes' : 'No'}</td>
                <td>${dispatch.Driver_id || ''}</td>
                <td>${dispatch.Location || ''}</td>
                <td>${dispatch.Manger_id || ''}</td>
                <td>${dispatch.Vehicle || ''}</td>
                <td>${bookingIds}</td>
                <td>${orderIds}</td>
                <td>
                    <button onclick="editDispatch('${doc.id}', '${dispatchTime ? new Date(dispatch.DisTim.seconds * 1000).toISOString().slice(0, 16) : ''}', ${dispatch.Dispatched}, '${dispatch.Driver_id || ''}', '${dispatch.Location || ''}', '${dispatch.Manger_id || ''}', '${dispatch.Vehicle || ''}', '${bookingIds}', '${orderIds}')">Edit</button>
                    <button onclick="deleteDispatch('${doc.id}')">Delete</button>
                </td>
            `;
            dispatchTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching dispatches: ", error.code, error.message);
        alert(`An error occurred while fetching dispatches: ${error.message}`);
    }
}

// Add or update booking entry
async function addOrUpdateBooking(bookingId, certificationId, farmerId, trainerId, expectedStartTime, booked) {
    try {
        const bookingData = { 
            certification_id: certificationId, 
            farmer_id: farmerId, 
            trainer_id: trainerId, 
            Expected_Start_Time: new Date(expectedStartTime), 
            booked: booked === 'true' || booked === true
        };
        let docRef;
        if (bookingId) {
            // Get old data for logging
            const bookingRef = doc(db, "bookings", bookingId);
            const oldDataSnap = await getDoc(bookingRef);
            const oldData = oldDataSnap.exists() ? oldDataSnap.data() : null;
            
            // Update document
            await updateDoc(bookingRef, bookingData);
            docRef = bookingRef;
            
            // Log the update
            await logUpdate('bookings', bookingId, bookingData, oldData);
        } else {
            // Create new document
            docRef = await addDoc(collection(db, "bookings"), bookingData);
            
            // Log the creation
            await logCreate('bookings', docRef.id, bookingData);
        }
        fetchBookingData();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error adding/updating booking: ", error.code || '', msg);
        
        // Log the error
        await logError('bookings', "Failed to save booking", {
            error: msg
        });
        
        alert(`An error occurred while saving the booking: ${msg}`);
    }
}

// Add or update order entry
async function addOrUpdateOrder(orderId) {
    try {
        // Get form values
        const eta = document.getElementById('eta').value;
        const location = document.getElementById('orderLocation').value;
        const farmerId = document.getElementById('orderFarmerId').value;
        const payment = document.getElementById('payment').value;
        const productIdsText = document.getElementById('productIds').value;
        const quantity = parseInt(document.getElementById('quantity').value);
        const totalPrice = parseFloat(document.getElementById('totalprice').value);
        
        // Process product IDs from textarea
        const productIds = productIdsText.split(',')
            .map(id => id.trim())
            .filter(id => id.length > 0);
            
        // Create order object
        const orderData = {
            ETA: new Date(eta),
            Location: location,
            farmer_id: farmerId,
            payment: payment,
            product_id: productIds,
            quantity: quantity,
            totalprice: totalPrice
        };
        
        // If it's a new order, add created_at timestamp using serverTimestamp
        if (!orderId) {
            orderData.created_at = serverTimestamp();
        }
        
        let docRef;
        if (orderId) {
            // Get old data for logging
            const orderRef = doc(db, "order", orderId);
            const oldDataSnap = await getDoc(orderRef);
            const oldData = oldDataSnap.exists() ? oldDataSnap.data() : null;
            
            // Update the document
            await updateDoc(orderRef, orderData);
            docRef = orderRef;
            
            // Log the update
            await logUpdate('order', orderId, orderData, oldData);
            alert("Order updated successfully!");
        } else {
            // Create new document
            docRef = await addDoc(collection(db, "order"), orderData);
            
            // Log the creation
            await logCreate('order', docRef.id, orderData);
            alert("Order created successfully!");
        }
        fetchOrderingData();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error adding/updating order: ", error.code || '', msg);
        
        // Log the error
        await logError('order', "Failed to save order", {
            error: msg
        });
        
        alert(`An error occurred while saving the order: ${msg}`);
    }
}

// Add or update dispatch entry
async function addOrUpdateDispatch(dispatchId, disTim, dispatched, driverId, location, mangerId, vehicle, bookingIds, orderIds) {
    try {
        // Convert comma-separated strings to arrays
        const bookingIdArray = bookingIds.split(',').map(id => id.trim()).filter(id => id);
        const orderIdArray = orderIds.split(',').map(id => id.trim()).filter(id => id);
        
        const dispatchData = {
            DisTim: new Date(disTim),
            Dispatched: dispatched === 'true' || dispatched === true,
            Driver_id: driverId,
            Location: location,
            Manger_id: mangerId,
            Vehicle: vehicle,
            booking_id: bookingIdArray,
            order_id: orderIdArray
        };
        
        let docRef;
        if (dispatchId) {
            // Get old data for logging
            const dispatchRef = doc(db, "dispatches", dispatchId);
            const oldDataSnap = await getDoc(dispatchRef);
            const oldData = oldDataSnap.exists() ? oldDataSnap.data() : null;
            
            // Update the document
            await updateDoc(dispatchRef, dispatchData);
            docRef = dispatchRef;
            
            // Log the update
            await logUpdate('dispatches', dispatchId, dispatchData, oldData);
        } else {
            // Create new document
            docRef = await addDoc(collection(db, "dispatches"), dispatchData);
            
            // Log the creation
            await logCreate('dispatches', docRef.id, dispatchData);
        }
        fetchDispatchData();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error adding/updating dispatch: ", error.code || '', msg);
        
        // Log the error
        await logError('dispatches', "Failed to save dispatch", {
            error: msg
        });
        
        alert(`An error occurred while saving the dispatch: ${msg}`);
    }
}

// Delete booking entry
async function deleteBooking(bookingId) {
    try {
        // Get data before deletion for logging
        const bookingRef = doc(db, "bookings", bookingId);
        const bookingSnap = await getDoc(bookingRef);
        const deletedData = bookingSnap.exists() ? bookingSnap.data() : null;
        
        // Delete the document
        await deleteDoc(bookingRef);
        
        // Log the deletion
        await logDelete('bookings', bookingId, deletedData);
        
        fetchBookingData();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error deleting booking: ", error.code || '', msg);
        
        // Log the error
        await logError('bookings', "Failed to delete booking", {
            bookingId,
            error: msg
        });
        
        alert(`An error occurred while deleting the booking: ${msg}`);
    }
}

// Delete order entry
async function deleteOrder(orderId) {
    if (confirm('Are you sure you want to delete this order?')) {
        try {
            // Get data before deletion for logging
            const orderRef = doc(db, "order", orderId);
            const orderSnap = await getDoc(orderRef);
            const deletedData = orderSnap.exists() ? orderSnap.data() : null;
            
            // Delete the document
            await deleteDoc(orderRef);
            
            // Log the deletion
            await logDelete('order', orderId, deletedData);
            
            alert("Order deleted successfully!");
            fetchOrderingData();
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            console.error("Error deleting order: ", error.code || '', msg);
            
            // Log the error
            await logError('order', "Failed to delete order", {
                orderId,
                error: msg
            });
            
            alert(`An error occurred while deleting the order: ${msg}`);
        }
    }
}

// Delete dispatch entry
async function deleteDispatch(dispatchId) {
    try {
        // Get data before deletion for logging
        const dispatchRef = doc(db, "dispatches", dispatchId);
        const dispatchSnap = await getDoc(dispatchRef);
        const deletedData = dispatchSnap.exists() ? dispatchSnap.data() : null;
        
        // Delete the document
        await deleteDoc(dispatchRef);
        
        // Log the deletion
        await logDelete('dispatches', dispatchId, deletedData);
        
        fetchDispatchData();
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error deleting dispatch: ", error.code || '', msg);
        
        // Log the error
        await logError('dispatches', "Failed to delete dispatch", {
            dispatchId,
            error: msg
        });
        
        alert(`An error occurred while deleting the dispatch: ${msg}`);
    }
}

// Edit booking entry
function editBooking(bookingId, certificationId, farmerId, trainerId, expectedStartTime, booked) {
    document.getElementById('certificationId').value = certificationId;
    document.getElementById('farmerId').value = farmerId;
    document.getElementById('trainerId').value = trainerId;
    document.getElementById('expectedStartTime').value = expectedStartTime;
    document.getElementById('booked').value = booked ? 'true' : 'false';
    document.getElementById('bookingForm').dataset.bookingId = bookingId;
}

// Edit order entry
async function editOrder(orderId) {
    try {
        // Fetch the order data
        const orderRef = doc(db, "order", orderId);
        const orderSnapshot = await getDoc(orderRef);
        
        if (orderSnapshot.exists()) {
            const orderData = orderSnapshot.data();
            
            // Format ETA for datetime-local input
            let etaValue = '';
            if (orderData.ETA && orderData.ETA.toDate) {
                const etaDate = orderData.ETA.toDate();
                etaValue = etaDate.toISOString().slice(0, 16);
            }
            
            // Set form values
            document.getElementById('orderId').value = orderId;
            document.getElementById('eta').value = etaValue;
            document.getElementById('orderLocation').value = orderData.Location || '';
            document.getElementById('orderFarmerId').value = orderData.farmer_id || '';
            document.getElementById('payment').value = orderData.payment || '';
            
            // Format product_id array for textarea
            if (orderData.product_id && Array.isArray(orderData.product_id)) {
                document.getElementById('productIds').value = orderData.product_id.join(', ');
            } else {
                document.getElementById('productIds').value = '';
            }
            
            document.getElementById('quantity').value = orderData.quantity || '';
            document.getElementById('totalprice').value = orderData.totalprice || '';
            
            // Set form dataset for submission handler
            document.getElementById('orderingForm').dataset.orderId = orderId;
            
            // Scroll to form
            document.getElementById('orderingForm').scrollIntoView();
        } else {
            console.error("Order not found");
            alert("Order not found");
        }
    } catch (error) {
        console.error("Error loading order for edit: ", error.code, error.message);
        alert(`An error occurred while loading the order: ${error.message}`);
    }
}

// Edit dispatch entry
function editDispatch(dispatchId, disTim, dispatched, driverId, location, mangerId, vehicle, bookingIds, orderIds) {
    document.getElementById('dispatchId').value = dispatchId;
    document.getElementById('disTim').value = disTim;
    document.getElementById('dispatched').value = dispatched ? 'true' : 'false';
    document.getElementById('driver_id').value = driverId;
    document.getElementById('location').value = location;
    document.getElementById('manger_id').value = mangerId;
    document.getElementById('vehicle').value = vehicle;
    document.getElementById('booking_id').value = bookingIds;
    document.getElementById('order_id').value = orderIds;
    document.getElementById('dispatchForm').dataset.dispatchId = dispatchId;
}

// This function is deprecated - using the new logging.js module instead

// Make functions available globally for onclick handlers
window.editDispatch = editDispatch;
window.deleteDispatch = deleteDispatch;
window.editOrder = editOrder;
window.deleteOrder = deleteOrder;
window.editBooking = editBooking;
window.deleteBooking = deleteBooking;

// Event listener for booking form submission
document.getElementById('bookingForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const bookingId = event.target.dataset.bookingId || null;
    const certificationId = document.getElementById('certificationId').value;
    const farmerId = document.getElementById('farmerId').value;
    const trainerId = document.getElementById('trainerId').value;
    const expectedStartTime = document.getElementById('expectedStartTime').value;
    const isBooked = document.getElementById('booked').value;
    
    addOrUpdateBooking(bookingId, certificationId, farmerId, trainerId, expectedStartTime, isBooked);
    event.target.reset();
    delete event.target.dataset.bookingId;
});

// Event listener for ordering form submission
document.getElementById('orderingForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const orderId = event.target.dataset.orderId || null;
    
    // Call addOrUpdateOrder with just the orderId - it will fetch values from form
    addOrUpdateOrder(orderId);
    
    // Reset the form and remove the orderId from dataset
    event.target.reset();
    delete event.target.dataset.orderId;
});