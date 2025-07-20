// logging.js - Centralized logging utilities for Apollo Project
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2asaFAVw0PSlJFbyuPbOd3Zao-yqSS4g",
  authDomain: "apollo-mobile-7013d.firebaseapp.com",
  projectId: "apollo-mobile-7013d",
  storageBucket: "apollo-mobile-7013d.firebasestorage.app",
  messagingSenderId: "1044454240066",
  appId: "1:1044454240066:web:77e3984fb8fdfe6d2ea2db",
  measurementId: "G-FCKNKS0L5Z"
};

// Initialize Firebase or use existing instance
let app, auth, db;
try {
    // Try to get the existing instance
    app = firebase.app();
    auth = getAuth();
    db = getFirestore();
} catch (e) {
    // If no instance exists, initialize a new one
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
}

/**
 * Core logging function - logs any event to the reports collection
 * @param {string} action - Action performed (create, update, delete, login, etc)
 * @param {string} collectionName - The collection being affected
 * @param {string} documentId - The ID of the document being affected
 * @param {Object} data - The data involved in the operation
 * @param {Object} oldData - Previous data (for updates)
 * @returns {Promise<string>} - Returns the ID of the created log entry
 */
export async function logActivity(action, collectionName, documentId, data, oldData = null) {
    try {
        const timestamp = new Date();
        const currentUser = auth.currentUser;
        
        const logData = {
            action,
            timestamp,
            collection: collectionName,
            documentId: documentId || 'N/A',
            userId: currentUser?.uid || 'unknown',
            userEmail: currentUser?.email || 'unknown',
            data,
            oldData,
            clientInfo: navigator.userAgent
        };

        const docRef = await addDoc(collection(db, "reports"), logData);
        console.log(`Logged: ${action} on ${collection}/${documentId}`);
        return docRef.id;
    } catch (error) {
        console.error("Logging error:", error);
        return null;
    }
}

// Convenience methods for common operations

/**
 * Log document creation
 */
export async function logCreate(collectionName, documentId, data) {
    return logActivity('create', collectionName, documentId, data);
}

/**
 * Log document update
 */
export async function logUpdate(collectionName, documentId, newData, oldData) {
    return logActivity('update', collectionName, documentId, newData, oldData);
}

/**
 * Log document deletion
 */
export async function logDelete(collectionName, documentId, deletedData) {
    return logActivity('delete', collectionName, documentId, null, deletedData);
}

/**
 * Log authentication events (login, logout, register)
 */
export async function logAuth(action, userId, details) {
    return logActivity(action, 'auth', userId, details);
}

/**
 * Log errors that occur in the application
 */
export async function logError(source, message, details) {
    return logActivity('error', 'errors', null, { source, message, details });
}

// Set up global error catching to log all unhandled errors
window.addEventListener('error', (event) => {
    logError('app', event.message, {
        location: `${event.filename}:${event.lineno}:${event.colno}`,
        stack: event.error?.stack
    });
});

// Track Promise rejections
window.addEventListener('unhandledrejection', (event) => {
    logError('promise', event.reason?.toString() || 'Unknown rejection', {
        stack: event.reason?.stack
    });
});

console.log('Apollo logging system activated');
