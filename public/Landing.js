import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// Your web app's Firebase configuration
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
const auth = getAuth(app);
// Check if user is authenticated
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is signed in:', user);
        // Fetch and display items from Firestore
      //  fetchItems();
    } else {
        console.log('No user is signed in.');
        // Redirect to login page if not authenticated
        window.location.href = 'Login.html';
    }
});
// Function to toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('main');
    if (sidebar.style.width === '250px') {
        sidebar.style.width = '0';
        main.style.marginLeft = '0';
    } else {
        sidebar.style.width = '250px';
        main.style.marginLeft = '250px';
    }
    console.log('Sidebar toggled');
}
//Attach toggleSidebar function to the window object to make it accessible globally
window.toggleSidebar = toggleSidebar;
// Function to toggle profile dropdown
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'block';
    }
}
// Attach toggleProfileDropdown function to the window object to make it accessible globally
window.toggleProfileDropdown = toggleProfileDropdown;
// Function to sign out
function signOutUser() {
    signOut(auth).then(() => {
        console.log('User signed out.');
        window.location.href = 'Login.html';
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
}
// Attach signOutUser function to the window object to make it accessible globally
window.signOut = signOutUser;
// Function to toggle dropdown content
function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
    } else {
        dropdown.classList.add('show');
    }
}
// Attach toggleDropdown function to the window object to make it accessible globally
window.toggleDropdown = toggleDropdown;