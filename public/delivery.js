import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAVhK5GNgwz-DsMilSapF-6OO4LPhyfLXA",
    authDomain: "apollo-project-9c70b.firebaseapp.com",
    projectId: "apollo-project-9c70b",
    storageBucket: "apollo-project-9c70b.firebasestorage.app",
    messagingSenderId: "89948471233",
    appId: "1:89948471233:web:1cb2261333c6539a727940",
    measurementId: "G-GR4K54E6FP"
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
        } else {
            console.log("No user is logged in");
            // Redirect to login page
            window.location.href = "login.html";
        }
    });
});

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
            <td>${booking.trainerName}</td>
            <td>${booking.employeeId}</td>
            <td>${new Date(booking.issueDate.seconds * 1000).toLocaleDateString()}</td>
            <td>${booking.userEmail}</td>
            <td>
                <button onclick="editBooking('${doc.id}', '${booking.certificationId}', '${booking.trainerName}', '${booking.employeeId}', '${new Date(booking.issueDate.seconds * 1000).toISOString().split('T')[0]}', '${booking.userEmail}')">Edit</button>
                <button onclick="deleteBooking('${doc.id}')">Delete</button>
            </td>
        `;
        bookingTableBody.appendChild(row);
    });
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
}

// Add or update booking entry
async function addOrUpdateBooking(bookingId, certificationId, trainerName, employeeId, issueDate, userEmail) {
    if (bookingId) {
        const bookingRef = doc(db, "bookings", bookingId);
        await updateDoc(bookingRef, { certificationId, trainerName, employeeId, issueDate: new Date(issueDate), userEmail });
    } else {
        await addDoc(collection(db, "bookings"), { certificationId, trainerName, employeeId, issueDate: new Date(issueDate), userEmail });
    }
    fetchBookingData();
}

// Add or update order entry
async function addOrUpdateOrder(orderId, orderUserEmail, quantity, orderDate, orderStatus, itemList, totalPrice) {
    if (orderId) {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { orderUserEmail, quantity, orderDate: new Date(orderDate), orderStatus, itemList, totalPrice });
    } else {
        await addDoc(collection(db, "orders"), { orderUserEmail, quantity, orderDate: new Date(orderDate), orderStatus, itemList, totalPrice });
    }
    fetchOrderingData();
}

// Add or update delivery entry
async function addOrUpdateDelivery(deliveryId, bookingIds, orderingIds, inventoryIds, county, address, driverId, dispatchManagerId, vehiclePlate, deliveryStatus) {
    if (deliveryId) {
        const deliveryRef = doc(db, "deliveries", deliveryId);
        await updateDoc(deliveryRef, { bookingIds, orderingIds, inventoryIds, county, address, driverId, dispatchManagerId, vehiclePlate, deliveryStatus });
    } else {
        await addDoc(collection(db, "deliveries"), { bookingIds, orderingIds, inventoryIds, county, address, driverId, dispatchManagerId, vehiclePlate, deliveryStatus });
    }
    fetchDeliveryData();
}

// Delete booking entry
async function deleteBooking(bookingId) {
    await deleteDoc(doc(db, "bookings", bookingId));
    fetchBookingData();
}

// Delete order entry
async function deleteOrder(orderId) {
    await deleteDoc(doc(db, "orders", orderId));
    fetchOrderingData();
}

// Delete delivery entry
async function deleteDelivery(deliveryId) {
    await deleteDoc(doc(db, "deliveries", deliveryId));
    fetchDeliveryData();
}

// Edit booking entry
function editBooking(bookingId, certificationId, trainerName, employeeId, issueDate, userEmail) {
    document.getElementById('certificationId').value = certificationId;
    document.getElementById('trainerName').value = trainerName;
    document.getElementById('employeeId').value = employeeId;
    document.getElementById('issueDate').value = issueDate;
    document.getElementById('userEmail').value = userEmail;
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

// Event listener for booking form submission
document.getElementById('bookingForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const bookingId = event.target.dataset.bookingId || null;
    const certificationId = document.getElementById('certificationId').value;
    const trainerName = document.getElementById('trainerName').value;
    const employeeId = document.getElementById('employeeId').value;
    const issueDate = document.getElementById('issueDate').value;
    const userEmail = document.getElementById('userEmail').value;
    addOrUpdateBooking(bookingId, certificationId, trainerName, employeeId, issueDate, userEmail);
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