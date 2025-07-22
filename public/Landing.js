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

// WebView Authentication Functions
async function authenticateFromUrlToken() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (!token) return false;
        
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.users && data.users.length > 0) {
                const userData = data.users[0];
                sessionStorage.setItem('webviewAuth', JSON.stringify({
                    authenticated: true,
                    user: {
                        uid: userData.localId,
                        email: userData.email,
                        displayName: userData.displayName || 'WebView User'
                    },
                    timestamp: Date.now()
                }));
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Token authentication failed:', error);
        return false;
    }
}

function isAuthenticatedViaWebView() {
    try {
        const authInfo = sessionStorage.getItem('webviewAuth');
        if (authInfo) {
            const parsed = JSON.parse(authInfo);
            return (Date.now() - parsed.timestamp) < 3600000; // 1 hour
        }
    } catch (error) {
        console.error('Error checking WebView auth:', error);
    }
    return false;
}

// Check if user is authenticated
// Enhanced authentication check
document.addEventListener('DOMContentLoaded', async () => {
    const tokenAuthSuccess = await authenticateFromUrlToken();
    
    if (tokenAuthSuccess) {
        console.log('✅ WebView authentication successful');
        // User is authenticated via WebView token
    } else {
        // Fall back to Firebase authentication
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("User is logged in:", user);
                // User is logged in, show landing page
            } else if (!isAuthenticatedViaWebView()) {
                // No user, redirect to login
                window.location.href = 'index.html';
            }
        });
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
        window.location.href = 'index.html';
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