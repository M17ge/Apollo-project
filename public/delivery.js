import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is logged in:", user);
            document.getElementById('dispatchManagerId').value = user.uid;
            fetchBookingData();
            fetchOrderingData();
            fetchDeliveryData();
            fetchDispatchData();
            fetchOrderData();
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
        querySnapshot.forEach((docSnap) => {
            const booking = docSnap.data();
            const expectedStartTime = booking["Expected Start Time"] ? new Date(booking["Expected Start Time"]).toLocaleString() : '';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${docSnap.id}</td>
                <td>${booking.certification_id || ''}</td>
                <td>${booking.farmer_id || ''}</td>
                <td>${booking.trainer_id || ''}</td>
                <td>${booking.status ? 'Active' : 'Inactive'}</td>
                <td>${expectedStartTime}</td>
                <td>
                    <button onclick="editBooking('${docSnap.id}', '${booking.certification_id || ''}', '${booking.farmer_id || ''}', '${booking.trainer_id || ''}', '${booking.status}', '${booking["Expected Start Time"] || ''}')">Edit</button>
                    <button onclick="deleteBooking('${docSnap.id}')">Delete</button>
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
        const querySnapshot = await getDocs(collection(db, "Orders"));
        const orderingTableBody = document.getElementById('orderingTable').getElementsByTagName('tbody')[0];
        orderingTableBody.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const order = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${order.orderUserEmail}</td>
                <td>${order.quantity}</td>
                <td>${order.orderDate}</td>
                <td>${order.orderStatus}</td>
                <td>${order.itemList}</td>
                <td>${order.totalPrice}</td>
                <td>
                    <button onclick="editOrder('${doc.id}', '${order.orderUserEmail}', ${order.quantity}, '${order.orderDate}', '${order.orderStatus}', '${order.itemList}', ${order.totalPrice})">Edit</button>
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

// Fetch and display delivery data
async function fetchDeliveryData() {
    try {
        const querySnapshot = await getDocs(collection(db, "Deliveries"));
        const deliveryTableBody = document.getElementById('deliveryTable').getElementsByTagName('tbody')[0];
        deliveryTableBody.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const delivery = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${delivery.bookingIds}</td>
                <td>${delivery.orderingIds}</td>
                <td>${delivery.inventoryIds}</td>
                <td>${delivery.county}</td>
                <td>${delivery.address}</td>
                <td>${delivery.driverId}</td>
                <td>${delivery.dispatchManagerId}</td>
                <td>${delivery.vehiclePlate}</td>
                <td>${delivery.deliveryStatus}</td>
                <td>
                    <button onclick="editDelivery('${doc.id}', '${delivery.bookingIds}', '${delivery.orderingIds}', '${delivery.inventoryIds}', '${delivery.county}', '${delivery.address}', '${delivery.driverId}', '${delivery.dispatchManagerId}', '${delivery.vehiclePlate}', '${delivery.deliveryStatus}')">Edit</button>
                    <button onclick="deleteDelivery('${doc.id}')">Delete</button>
                </td>
            `;
            deliveryTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching deliveries: ", error.code, error.message);
        alert(`An error occurred while fetching deliveries: ${error.message}`);
    }
}

// Fetch and display dispatch data
async function fetchDispatchData() {
    try {
        const querySnapshot = await getDocs(collection(db, "dispatches"));
        const dispatchTableBody = document.getElementById('dispatchTable').getElementsByTagName('tbody')[0];
        dispatchTableBody.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const dispatch = docSnap.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${docSnap.id}</td>
                <td>${dispatch.DisTim ? new Date(dispatch.DisTim).toLocaleString() : ''}</td>
                <td>${dispatch.Dispatched ? 'Yes' : 'No'}</td>
                <td>${dispatch.Driver_id || ''}</td>
                <td>${dispatch.Location || ''}</td>
                <td>${dispatch.Manger_id || ''}</td>
                <td>${dispatch.Trainer_id || ''}</td>
                <td>${dispatch.Vehicle || ''}</td>
                <td>${dispatch.order_id || ''}</td>
                <td>
                    <button onclick="editDispatch('${docSnap.id}', '${dispatch.DisTim}', ${dispatch.Dispatched}, '${dispatch.Driver_id}', '${dispatch.Location}', '${dispatch.Manger_id}', '${dispatch.Trainer_id}', '${dispatch.Vehicle}', '${dispatch.order_id}')">Edit</button>
                    <button onclick="deleteDispatch('${docSnap.id}')">Delete</button>
                </td>
            `;
            dispatchTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching dispatches: ", error.code, error.message);
        alert(`An error occurred while fetching dispatches: ${error.message}`);
    }
}

// Fetch and display order data
async function fetchOrderData() {
    try {
        const querySnapshot = await getDocs(collection(db, "order"));
        const orderTableBody = document.getElementById('orderTable').getElementsByTagName('tbody')[0];
        orderTableBody.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const order = docSnap.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${docSnap.id}</td>
                <td>${order.farmer_id}</td>
                <td>${order.payment}</td>
                <td>${Array.isArray(order.product_id) ? order.product_id.join(', ') : ''}</td>
                <td>${order.quantity}</td>
                <td>${order.totalprice}</td>
                <td>${order.created_at ? new Date(order.created_at).toLocaleString() : ''}</td>
                <td>${order.ETA ? new Date(order.ETA).toLocaleString() : ''}</td>
                <td>Actions</td>
            `;
            orderTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching orders: ", error.code, error.message);
        alert(`An error occurred while fetching orders: ${error.message}`);
    }
}

// Add or update booking entry
async function addOrUpdateBooking(bookingId, certification_id, farmer_id, trainer_id, status, expected_start_time) {
    try {
        const bookingData = {
            certification_id,
            farmer_id,
            trainer_id,
            status: status === 'true' || status === true,
            "Expected Start Time": new Date(expected_start_time)
        };
        let docRef;
        if (bookingId) {
            const bookingRef = doc(db, "bookings", bookingId);
            await updateDoc(bookingRef, bookingData);
            docRef = bookingRef;
            await logDatabaseActivity('update', 'bookings', bookingId, bookingData);
        } else {
            docRef = await addDoc(collection(db, "bookings"), bookingData);
            await logDatabaseActivity('create', 'bookings', docRef.id, bookingData);
        }
        fetchBookingData();
    } catch (error) {
        console.error("Error adding/updating booking: ", error.code, error.message);
        alert(`An error occurred while saving the booking: ${error.message}`);
    }
}

// Add or update order entry
async function addOrUpdateOrder(orderId, orderUserEmail, quantity, orderDate, orderStatus, itemList, totalPrice) {
    try {
        const orderData = { orderUserEmail, quantity, orderDate: new Date(orderDate), orderStatus, itemList, totalPrice };
        let docRef;
        if (orderId) {
            const orderRef = doc(db, "Orders", orderId);
            await updateDoc(orderRef, orderData);
            docRef = orderRef;
            await logDatabaseActivity('update', 'Orders', orderId, orderData);
        } else {
            docRef = await addDoc(collection(db, "Orders"), orderData);
            await logDatabaseActivity('create', 'Orders', docRef.id, orderData);
        }
        fetchOrderingData();
    } catch (error) {
        console.error("Error adding/updating order: ", error.code, error.message);
        alert(`An error occurred while saving the order: ${error.message}`);
    }
}

// Add or update delivery entry
async function addOrUpdateDelivery(deliveryId, bookingIds, orderingIds, inventoryIds, county, address, driverId, dispatchManagerId, vehiclePlate, deliveryStatus) {
    try {
        const deliveryData = { bookingIds, orderingIds, inventoryIds, county, address, driverId, dispatchManagerId, vehiclePlate, deliveryStatus };
        let docRef;
        if (deliveryId) {
            const deliveryRef = doc(db, "Deliveries", deliveryId);
            await updateDoc(deliveryRef, deliveryData);
            docRef = deliveryRef;
            await logDatabaseActivity('update', 'Deliveries', deliveryId, deliveryData);
        } else {
            docRef = await addDoc(collection(db, "Deliveries"), deliveryData);
            await logDatabaseActivity('create', 'Deliveries', docRef.id, deliveryData);
        }
        fetchDeliveryData();
    } catch (error) {
        console.error("Error adding/updating delivery: ", error.code, error.message);
        alert(`An error occurred while saving the delivery: ${error.message}`);
    }
}

// Add or update dispatch entry
async function addOrUpdateDispatch(dispatchId, DisTim, Dispatched, Driver_id, Location, Manger_id, Trainer_id, Vehicle, order_id) {
    try {
        const dispatchData = {
            DisTim: DisTim ? new Date(DisTim) : null,
            Dispatched: !!Dispatched,
            Driver_id,
            Location,
            Manger_id,
            Trainer_id,
            Vehicle,
            order_id
        };
        let docRef;
        if (dispatchId) {
            const dispatchRef = doc(db, "dispatches", dispatchId);
            await updateDoc(dispatchRef, dispatchData);
            docRef = dispatchRef;
            await logDatabaseActivity('update', 'dispatches', dispatchId, dispatchData);
        } else {
            docRef = await addDoc(collection(db, "dispatches"), dispatchData);
            await logDatabaseActivity('create', 'dispatches', docRef.id, dispatchData);
        }
        fetchDispatchData();
    } catch (error) {
        console.error("Error adding/updating dispatch: ", error.code, error.message);
        alert(`An error occurred while saving the dispatch: ${error.message}`);
    }
}

// Delete booking entry
async function deleteBooking(bookingId) {
    try {
        const bookingRef = doc(db, "Bookings", bookingId);
        await deleteDoc(bookingRef);
        await logDatabaseActivity('delete', 'Bookings', bookingId, {});
        fetchBookingData();
    } catch (error) {
        console.error("Error deleting booking: ", error.code, error.message);
        alert(`An error occurred while deleting the booking: ${error.message}`);
    }
}

// Delete order entry
async function deleteOrder(orderId) {
    try {
        const orderRef = doc(db, "Orders", orderId);
        await deleteDoc(orderRef);
        await logDatabaseActivity('delete', 'Orders', orderId, {});
        fetchOrderingData();
    } catch (error) {
        console.error("Error deleting order: ", error.code, error.message);
        alert(`An error occurred while deleting the order: ${error.message}`);
    }
}

// Delete delivery entry
async function deleteDelivery(deliveryId) {
    try {
        const deliveryRef = doc(db, "Deliveries", deliveryId);
        await deleteDoc(deliveryRef);
        await logDatabaseActivity('delete', 'Deliveries', deliveryId, {});
        fetchDeliveryData();
    } catch (error) {
        console.error("Error deleting delivery: ", error.code, error.message);
        alert(`An error occurred while deleting the delivery: ${error.message}`);
    }
}

// Delete dispatch entry
async function deleteDispatch(dispatchId) {
    try {
        const dispatchRef = doc(db, "dispatches", dispatchId);
        await deleteDoc(dispatchRef);
        await logDatabaseActivity('delete', 'dispatches', dispatchId, {});
        fetchDispatchData();
    } catch (error) {
        console.error("Error deleting dispatch: ", error.code, error.message);
        alert(`An error occurred while deleting the dispatch: ${error.message}`);
    }
}

// Edit booking entry
function editBooking(bookingId, certification_id, farmer_id, trainer_id, status, expected_start_time) {
    document.getElementById('certification_id').value = certification_id;
    document.getElementById('farmer_id').value = farmer_id;
    document.getElementById('trainer_id').value = trainer_id;
    document.getElementById('status').value = status;
    document.getElementById('expected_start_time').value = expected_start_time;
    document.getElementById('bookingForm').dataset.bookingId = bookingId;
}

// Edit order entry
function editOrder(orderId, orderUserEmail, quantity, orderDate, orderStatus, itemList, totalPrice) {
    document.getElementById('orderUserEmail').value = orderUserEmail;
    document.getElementById('quantity').value = quantity;
    document.getElementById('orderDate').value = orderDate;
    document.getElementById('orderStatus').value = orderStatus;
    document.getElementById('itemList').value = itemList;
    document.getElementById('totalPrice').value = totalPrice;
    document.getElementById('orderingForm').dataset.orderId = orderId;
}

// Edit delivery entry
function editDelivery(deliveryId, bookingIds, orderingIds, inventoryIds, county, address, driverId, dispatchManagerId, vehiclePlate, deliveryStatus) {
    document.getElementById('bookingIds').value = bookingIds;
    document.getElementById('orderingIds').value = orderingIds;
    document.getElementById('inventoryIds').value = inventoryIds;
    document.getElementById('county').value = county;
    document.getElementById('address').value = address;
    document.getElementById('driverId').value = driverId;
    document.getElementById('dispatchManagerId').value = dispatchManagerId;
    document.getElementById('vehiclePlate').value = vehiclePlate;
    document.getElementById('deliveryStatus').value = deliveryStatus;
    document.getElementById('deliveryForm').dataset.deliveryId = deliveryId;
}

// Edit dispatch entry
window.editDispatch = function (dispatchId, DisTim, Dispatched, Driver_id, Location, Manger_id, Trainer_id, Vehicle, order_id) {
    document.getElementById('DisTim').value = DisTim ? new Date(DisTim).toISOString().slice(0,16) : '';
    document.getElementById('Dispatched').checked = Dispatched === true || Dispatched === 'true';
    document.getElementById('Driver_id').value = Driver_id;
    document.getElementById('Location').value = Location;
    document.getElementById('Manger_id').value = Manger_id;
    document.getElementById('Trainer_id').value = Trainer_id;
    document.getElementById('Vehicle').value = Vehicle;
    document.getElementById('order_id').value = order_id;
    document.getElementById('dispatchForm').dataset.dispatchId = dispatchId;
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

// Event listener for booking form submission
document.getElementById('bookingForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const bookingId = event.target.dataset.bookingId || null;
    const certification_id = document.getElementById('certification_id').value;
    const farmer_id = document.getElementById('farmer_id').value;
    const trainer_id = document.getElementById('trainer_id').value;
    const status = document.getElementById('status').value;
    const expected_start_time = document.getElementById('expected_start_time').value;
    addOrUpdateBooking(bookingId, certification_id, farmer_id, trainer_id, status, expected_start_time);
    event.target.reset();
    delete event.target.dataset.bookingId;
});

// Event listener for ordering form submission
document.getElementById('orderingForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const orderId = event.target.dataset.orderId || null;
    const orderUserEmail = document.getElementById('orderUserEmail').value;
    const quantity = document.getElementById('quantity').value;
    const orderDate = document.getElementById('orderDate').value;
    const orderStatus = document.getElementById('orderStatus').value;
    const itemList = document.getElementById('itemList').value;
    const totalPrice = document.getElementById('totalPrice').value;
    addOrUpdateOrder(orderId, orderUserEmail, quantity, orderDate, orderStatus, itemList, totalPrice);
    event.target.reset();
    delete event.target.dataset.orderId;
});

// Event listener for delivery form submission
document.getElementById('deliveryForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const deliveryId = event.target.dataset.deliveryId || null;
    const bookingIds = document.getElementById('bookingIds').value;
    const orderingIds = document.getElementById('orderingIds').value;
    const inventoryIds = document.getElementById('inventoryIds').value;
    const county = document.getElementById('county').value;
    const address = document.getElementById('address').value;
    const driverId = document.getElementById('driverId').value;
    const dispatchManagerId = document.getElementById('dispatchManagerId').value;
    const vehiclePlate = document.getElementById('vehiclePlate').value;
    const deliveryStatus = document.getElementById('deliveryStatus').value;
    addOrUpdateDelivery(deliveryId, bookingIds, orderingIds, inventoryIds, county, address, driverId, dispatchManagerId, vehiclePlate, deliveryStatus);
    event.target.reset();
    delete event.target.dataset.deliveryId;
});

// Event listener for dispatch form submission
if (document.getElementById('dispatchForm')) {
    document.getElementById('dispatchForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const dispatchId = event.target.dataset.dispatchId || null;
        const DisTim = document.getElementById('DisTim').value;
        const Dispatched = document.getElementById('Dispatched').checked;
        const Driver_id = document.getElementById('Driver_id').value;
        const Location = document.getElementById('Location').value;
        const Manger_id = document.getElementById('Manger_id').value;
        const Trainer_id = document.getElementById('Trainer_id').value;
        const Vehicle = document.getElementById('Vehicle').value;
        const order_id = document.getElementById('order_id').value;
        addOrUpdateDispatch(dispatchId, DisTim, Dispatched, Driver_id, Location, Manger_id, Trainer_id, Vehicle, order_id);
        event.target.reset();
        delete event.target.dataset.dispatchId;
    });
}

// Call fetchDispatchData on load
if (document.getElementById('dispatchTable')) {
    fetchDispatchData();
}

// Call fetchOrderData on load
if (document.getElementById('orderTable')) {
    fetchOrderData();
}

// Only use these fields for Bookings:
// - bookingID: string
// - certificationID: string
// - employeeID: string
// - issueDate: string
// Remove all other fields and logic related to other properties.