import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { logAuth, logError, logActivity } from './logging.js';

// Your web app's Firebase configuration
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
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', function() {
    // Log page access
    logActivity('page_access', 'navigation', null, { page: 'login' });
    
    const form = document.getElementById('login-form');

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Set persistence to local
        setPersistence(auth, browserLocalPersistence)
            .then(() => {
                // Authenticate the user with Firebase
                return signInWithEmailAndPassword(auth, email, password);
            })
            .then(async (userCredential) => {
                // Signed in
                const user = userCredential.user;
                console.log('User signed in:', user);
                
                // Log successful authentication
                await logAuth('auth_login_success', {
                    userId: user.uid,
                    email: user.email,
                    displayName: user.displayName || null
                });
                
                // Redirect to landing.html
                window.location.href = 'Landing.html';
            })
            .catch(async (error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error('Error signing in:', errorCode, errorMessage);
                
                // Log failed authentication attempt
                await logError('auth', 'Failed login attempt', {
                    email: email, // Only log the email that was used for the attempt
                    errorCode: errorCode,
                    errorMessage: errorMessage
                });
                
                alert('Error signing in: ' + errorMessage);
            });
    });
});