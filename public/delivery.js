import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fetch and display booking data
async function fetchBookingData() {
    const querySnapshot = await getDocs(collection(db, "bookings"));
    const bookingTableBody = document.getElementById('bookingTable').getElementsByTagName('tbody')[0];
    bookingTableBody.innerHTML = ''; // Clear existing data
    querySnapshot.forEach((doc) => {
        const booking = doc.data();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${doc.id}</td>
            <td>${booking.certificationId}</td>
            <td>${booking.status}</td>
            <td>${booking.employeeId}</td>
            <td>${new Date(booking.issueDate.seconds * 1000).toLocaleDateString()}</td>
            <td>${booking.userEmail}</td>
            <td>
                <button onclick="editBooking('${doc.id}', '${booking.certificationId}', '${booking.status}', '${booking.employeeId}', '${new Date(booking.issueDate.seconds * 1000).toISOString().split('T')[0]}', '${booking.userEmail}')">Edit</button>
                <button onclick="deleteBooking('${doc.id}')">Delete</button>
            </td>
        `;
        bookingTableBody.appendChild(row);
    });
}

// Add or update booking entry
async function addOrUpdateBooking(bookingId, certificationId, status, employeeId, issueDate, userEmail) {
    if (bookingId) {
        const bookingRef = doc(db, "bookings", bookingId);
        const bookingDoc = await getDoc(bookingRef);
        const existingData = bookingDoc.data();
        const updatedData = {
            ...existingData,
            certificationId,
            status,
            employeeId,
            issueDate: new Date(issueDate),
            userEmail
        };
        await updateDoc(bookingRef, updatedData);
    } else {
        await addDoc(collection(db, "bookings"), { certificationId, status, employeeId, issueDate: new Date(issueDate), userEmail });
    }
    fetchBookingData();
}

// Delete booking entry
async function deleteBooking(bookingId) {
    await deleteDoc(doc(db, "bookings", bookingId));
    fetchBookingData();
}

// Edit booking entry
function editBooking(bookingId, certificationId, status, employeeId, issueDate, userEmail) {
    document.getElementById('certificationId').value = certificationId;
    document.getElementById('bookingStatus').value = status;
    document.getElementById('employeeId').value = employeeId;
    document.getElementById('issueDate').value = issueDate;
    document.getElementById('userEmail').value = userEmail;
    document.getElementById('bookingForm').dataset.bookingId = bookingId;
}

// Fetch and display ordering data
async function fetchOrderingData() {
    const querySnapshot = await getDocs(collection(db, "orders"));
    const orderingTableBody = document.getElementById('orderingTable').getElementsByTagName('tbody')[0];
    orderingTableBody.innerHTML = ''; // Clear existing data
    querySnapshot.forEach((doc) => {
        const order = doc.data();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${doc.id}</td>
            <td>${order.userEmail}</td>
            <td>${order.quantity}</td>
            <td>${new Date(order.date.seconds * 1000).toLocaleDateString()}</td>
            <td>${order.status}</td>
            <td>${order.itemName}</td>
            <td>
                <button onclick="editOrder('${doc.id}', '${order.userEmail}', ${order.quantity}, '${new Date(order.date.seconds * 1000).toISOString().split('T')[0]}', '${order.status}', '${order.itemName}')">Edit</button>
                <button onclick="deleteOrder('${doc.id}')">Delete</button>
            </td>
        `;
        orderingTableBody.appendChild(row);
    });
}

// Add or update order entry
async function addOrUpdateOrder(orderId, userEmail, quantity, date, status, itemName) {
    if (orderId) {
        const orderRef = doc(db, "orders", orderId);
        const orderDoc = await getDoc(orderRef);
        const existingData = orderDoc.data();
        const updatedData = {
            ...existingData,
            userEmail,
            quantity,
            date: new Date(date),
            status,
            itemName
        };
        await updateDoc(orderRef, updatedData);
    } else {
        await addDoc(collection(db, "orders"), { userEmail, quantity, date: new Date(date), status, itemName });
    }
    fetchOrderingData();
}

// Delete order entry
async function deleteOrder(orderId) {
    await deleteDoc(doc(db, "orders", orderId));
    fetchOrderingData();
}

// Edit order entry
function editOrder(orderId, userEmail, quantity, date, status, itemName) {
    document.getElementById('orderUserEmail').value = userEmail;
    document.getElementById('quantity').value = quantity;
    document.getElementById('orderDate').value = date;
    document.getElementById('orderStatus').value = status;
    document.getElementById('itemName').value = itemName;
    document.getElementById('orderingForm').dataset.orderId = orderId;
}

// Fetch and display delivery data
async function fetchDeliveryData() {
    const querySnapshot = await getDocs(collection(db, "deliveries"));
    const deliveryTableBody = document.getElementById('deliveryTable').getElementsByTagName('tbody')[0];
    deliveryTableBody.innerHTML = ''; // Clear existing data
    querySnapshot.forEach((doc) => {
        const delivery = doc.data();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${doc.id}</td>
            <td>${delivery.bookingIds.join(', ')}</td>
            <td>${delivery.orderingIds.join(', ')}</td>
            <td>${delivery.inventoryIds.join(', ')}</td>
            <td>${delivery.county}</td>
            <td>${delivery.shortDescription}</td>
            <td>${delivery.driverId}</td>
            <td>${delivery.dispatchManagerId}</td>
            <td>${delivery.vehiclePlate}</td>
            <td>
                <button onclick="editDelivery('${doc.id}', '${delivery.bookingIds.join(', ')}', '${delivery.orderingIds.join(', ')}', '${delivery.inventoryIds.join(', ')}', '${delivery.county}', '${delivery.shortDescription}', '${delivery.driverId}', '${delivery.dispatchManagerId}', '${delivery.vehiclePlate}')">Edit</button>
                <button onclick="deleteDelivery('${doc.id}')">Delete</button>
            </td>
        `;
        deliveryTableBody.appendChild(row);
    });
}

// Add or update delivery entry
async function addOrUpdateDelivery(deliveryId, bookingIds, orderingIds, inventoryIds, county, shortDescription, driverId, dispatchManagerId, vehiclePlate) {
    if (deliveryId) {
        const deliveryRef = doc(db, "deliveries", deliveryId);
        const deliveryDoc = await getDoc(deliveryRef);
        const existingData = deliveryDoc.data();
        const updatedData = {
            ...existingData,
            bookingIds: bookingIds.split(', '),
            orderingIds: orderingIds.split(', '),
            inventoryIds: inventoryIds.split(', '),
            county,
            shortDescription,
            driverId,
            dispatchManagerId,
            vehiclePlate
        };
        await updateDoc(deliveryRef, updatedData);
    } else {
        await addDoc(collection(db, "deliveries"), { bookingIds: bookingIds.split(', '), orderingIds: orderingIds.split(', '), inventoryIds: inventoryIds.split(', '), county, shortDescription, driverId, dispatchManagerId, vehiclePlate });
    }
    fetchDeliveryData();
}

// Delete delivery entry
async function deleteDelivery(deliveryId) {
    await deleteDoc(doc(db, "deliveries", deliveryId));
    fetchDeliveryData();
}

// Edit delivery entry
function editDelivery(deliveryId, bookingIds, orderingIds, inventoryIds, county, shortDescription, driverId, dispatchManagerId, vehiclePlate) {
    document.getElementById('bookingIds').value = bookingIds;
    document.getElementById('orderingIds').value = orderingIds;
    document.getElementById('inventoryIds').value = inventoryIds;
    document.getElementById('county').value = county;
    document.getElementById('shortDescription').value = shortDescription;
    document.getElementById('driverId').value = driverId;
    document.getElementById('dispatchManagerId').value = dispatchManagerId;
    document.getElementById('vehiclePlate').value = vehiclePlate;
    document.getElementById('deliveryForm').dataset.deliveryId = deliveryId;
}

// Event listeners for form submissions
document.getElementById('bookingForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const bookingId = event.target.dataset.bookingId || null;
    const certificationId = document.getElementById('certificationId').value;
    const status = document.getElementById('bookingStatus').value;
    const employeeId = document.getElementById('employeeId').value;
    const issueDate = document.getElementById('issueDate').value;
    const userEmail = document.getElementById('userEmail').value;
    addOrUpdateBooking(bookingId, certificationId, status, employeeId, issueDate, userEmail);
    event.target.reset();
    delete event.target.dataset.bookingId;
});

document.getElementById('orderingForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const orderId = event.target.dataset.orderId || null;
    const userEmail = document.getElementById('orderUserEmail').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const date = document.getElementById('orderDate').value;
    const status = document.getElementById('orderStatus').value;
    const itemName = document.getElementById('itemName').value;
    addOrUpdateOrder(orderId, userEmail, quantity, date, status, itemName);
    event.target.reset();
    delete event.target.dataset.orderId;
});

document.getElementById('deliveryForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const deliveryId = event.target.dataset.deliveryId || null;
    const bookingIds = document.getElementById('bookingIds').value;
    const orderingIds = document.getElementById('orderingIds').value;
    const inventoryIds = document.getElementById('inventoryIds').value;
    const county = document.getElementById('county').value;
    const shortDescription = document.getElementById('shortDescription').value;
    const driverId = document.getElementById('driverId').value;
    const dispatchManagerId = document.getElementById('dispatchManagerId').value;
    const vehiclePlate = document.getElementById('vehiclePlate').value;
    addOrUpdateDelivery(deliveryId, bookingIds, orderingIds, inventoryIds, county, shortDescription, driverId, dispatchManagerId, vehiclePlate);
    event.target.reset();
    delete event.target.dataset.deliveryId;
});

// Fetch and display data on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchBookingData();
    fetchOrderingData();
    fetchDeliveryData();
});