import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { logAuth, logError, logActivity } from './logging.js';

// Firebase configuration for apollo-mobile-7013d
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
// Check if user is authenticated
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User is logged in:", user);
        // User is logged in, show landing page
        
        // Log page access with user information
        await logActivity('page_access', 'navigation', null, { 
            page: 'landing',
            userId: user.uid,
            email: user.email
        });
    } else {
        // No user, redirect to login
        window.location.href = 'index.html';
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
    // Capture user information before sign out
    const user = auth.currentUser;
    const userData = user ? {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || null
    } : { userId: 'unknown' };
    
    signOut(auth).then(async () => {
        console.log('User signed out.');
        
        // Log the sign out event
        await logAuth('auth_logout', userData);
        
        window.location.href = 'index.html';
    }).catch(async (error) => {
        console.error('Error signing out:', error);
        
        // Log sign out error
        await logError('auth', 'Failed to sign out', {
            ...userData,
            errorMessage: error.message
        });
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