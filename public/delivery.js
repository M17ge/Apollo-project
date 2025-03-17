import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAVhK5GNgwz-DsMilSapF-6OO4LPhyfLXA",
    authDomain: "apollo-project-9c70b.firebaseapp.com",
    projectId: "apollo-project-9c70b",
    storageBucket: "apollo-project-9c70b.firebasestorage.app",
    messagingSenderId: "89948471233",
    appId: "1:89948471233:web:1cb2261333c6539a727940",
    measurementId: "G-GR4K54E6FP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is logged in:", user);
            // Set the dispatch manager ID in the form field
            document.getElementById('dispatchManagerId').value = user.uid;
            initializeForms();
        } else {
            console.log("No user is logged in");
            // Redirect to login page
            window.location.href = "login.html";
        }
    });
});

function initializeForms() {
    // Booking form submission
    document.getElementById('bookingForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const certificationName = document.getElementById('certificationName').value;
        const stockId = document.getElementById('stockId').value;
        const employeeId = document.getElementById('employeeId').value;
        const issueDate = document.getElementById('issueDate').value;
        const userEmail = document.getElementById('userEmail').value;

        try {
            const docRef = await addDoc(collection(db, "bookings"), {
                certificationName,
                stockId,
                employeeId,
                issueDate,
                userEmail
            });
            console.log("Booking added with ID: ", docRef.id);
            fetchBookings(); // Refresh the booking list
        } catch (e) {
            console.error("Error adding booking: ", e);
        }
    });

    // Ordering form submission
    document.getElementById('orderingForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const orderUserEmail = document.getElementById('orderUserEmail').value;
        const quantity = document.getElementById('quantity').value;
        const orderDate = document.getElementById('orderDate').value;
        const orderStatus = document.getElementById('orderStatus').value;
        const itemName = document.getElementById('itemName').value;

        try {
            const docRef = await addDoc(collection(db, "orders"), {
                orderUserEmail,
                quantity,
                orderDate,
                orderStatus,
                itemName
            });
            console.log("Order added with ID: ", docRef.id);
            fetchOrders(); // Refresh the order list
        } catch (e) {
            console.error("Error adding order: ", e);
        }
    });

    // Delivery form submission
    document.getElementById('deliveryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const bookingIds = document.getElementById('bookingIds').value;
        const orderingIds = document.getElementById('orderingIds').value;
        const inventoryIds = document.getElementById('inventoryIds').value;
        const county = document.getElementById('county').value;
        const shortDescription = document.getElementById('shortDescription').value;
        const driverId = document.getElementById('driverId').value;
        const dispatchManagerId = document.getElementById('dispatchManagerId').value;
        const vehiclePlate = document.getElementById('vehiclePlate').value;
        const deliveryStatus = document.getElementById('deliveryStatus').value;

        try {
            const docRef = await addDoc(collection(db, "deliveries"), {
                bookingIds,
                orderingIds,
                inventoryIds,
                county,
                shortDescription,
                driverId,
                dispatchManagerId,
                vehiclePlate,
                deliveryStatus
            });
            console.log("Delivery added with ID: ", docRef.id);
            fetchDeliveries(); // Refresh the delivery list
        } catch (e) {
            console.error("Error adding delivery: ", e);
        }
    });

    // Fetch and display bookings
    async function fetchBookings() {
        const querySnapshot = await getDocs(collection(db, "bookings"));
        const bookingTableBody = document.getElementById('bookingTable').getElementsByTagName('tbody')[0];
        bookingTableBody.innerHTML = ''; // Clear existing data
        querySnapshot.forEach((doc) => {
            const booking = doc.data();
            const row = bookingTableBody.insertRow();
            row.insertCell(0).textContent = doc.id;
            row.insertCell(1).textContent = booking.certificationName;
            row.insertCell(2).textContent = booking.stockId;
            row.insertCell(3).textContent = booking.employeeId;
            row.insertCell(4).textContent = booking.issueDate;
            row.insertCell(5).textContent = booking.userEmail;
            row.insertCell(6).textContent = 'Actions'; // Placeholder for actions
        });
    }

    // Fetch and display orders
    async function fetchOrders() {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const orderingTableBody = document.getElementById('orderingTable').getElementsByTagName('tbody')[0];
        orderingTableBody.innerHTML = ''; // Clear existing data
        querySnapshot.forEach((doc) => {
            const order = doc.data();
            const row = orderingTableBody.insertRow();
            row.insertCell(0).textContent = doc.id;
            row.insertCell(1).textContent = order.orderUserEmail;
            row.insertCell(2).textContent = order.quantity;
            row.insertCell(3).textContent = order.orderDate;
            row.insertCell(4).textContent = order.orderStatus;
            row.insertCell(5).textContent = order.itemName;
            row.insertCell(6).textContent = 'Actions'; // Placeholder for actions
        });
    }

    // Fetch and display deliveries
    async function fetchDeliveries() {
        const querySnapshot = await getDocs(collection(db, "deliveries"));
        const deliveryTableBody = document.getElementById('deliveryTable').getElementsByTagName('tbody')[0];
        deliveryTableBody.innerHTML = ''; // Clear existing data
        querySnapshot.forEach((doc) => {
            const delivery = doc.data();
            const row = deliveryTableBody.insertRow();
            row.insertCell(0).textContent = doc.id;
            row.insertCell(1).textContent = delivery.bookingIds;
            row.insertCell(2).textContent = delivery.orderingIds;
            row.insertCell(3).textContent = delivery.inventoryIds;
            row.insertCell(4).textContent = delivery.county;
            row.insertCell(5).textContent = delivery.shortDescription;
            row.insertCell(6).textContent = delivery.driverId;
            row.insertCell(7).textContent = delivery.dispatchManagerId;
            row.insertCell(8).textContent = delivery.vehiclePlate;
            row.insertCell(9).textContent = delivery.deliveryStatus;
            row.insertCell(10).textContent = 'Actions'; // Placeholder for actions
        });
    }

    // Fetch data on page load
    fetchBookings();
    fetchOrders();
    fetchDeliveries();
}