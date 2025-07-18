import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, doc, query, where, addDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Keep track of the previous authentication state to detect sign-ins and sign-outs
let previousAuthState = null;

// Import our logging functions
import { logActivity, logAuth, logError } from './logging.js';

document.addEventListener('DOMContentLoaded', () => {
    // Log page access
    logActivity('page_access', 'navigation', null, { page: 'reports' });
    
    // Set up the auth state change listener
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("User is logged in:", user);
            document.getElementById('adminId').value = user.uid;
            
            // Optionally, fetch user metadata
            await fetchUserMetadata(user.uid);
        } else {
            console.log("No user is logged in");
            window.location.href = "login.html";
        }
    });

    document.getElementById('reportForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await fetchReports();
    });

    // Add event listeners for print and download buttons
    document.getElementById('printReport').addEventListener('click', printReport);
    document.getElementById('downloadPDF').addEventListener('click', downloadReportAsPDF);
});

// Fetch and display user metadata (creation time, etc.)
async function fetchUserMetadata(userId) {
    try {
        // Get the element and check if it exists first
        const userCreatedAtElement = document.getElementById('userCreatedAt');
        if (!userCreatedAtElement) {
            console.warn("Element with ID 'userCreatedAt' not found in the DOM");
            return; // Exit early if element doesn't exist
        }
        
        // Use lowercase 'users' if that's your collection name
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            userCreatedAtElement.textContent = userData.createdAt
                ? new Date(userData.createdAt.seconds * 1000).toLocaleString()
                : "N/A";
        } else {
            userCreatedAtElement.textContent = "N/A";
        }
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error fetching user metadata: ", error.code || '', msg);
        // Don't alert as this is not critical for the user experience
        console.warn("Failed to fetch user metadata, but continuing with application");
    }
}

// Add this after your Firebase initialization

/**
 * Enhanced function to log database and authentication activities
 * @param {string} eventType - Type of event (create, update, delete, auth_login, auth_logout, etc)
 * @param {string} collection - The collection being affected
 * @param {string} documentId - The ID of the document being affected
 * @param {Object} data - The data involved in the operation
 * @param {Object} options - Additional options like oldData for updates
 * @returns {Promise<string>} - Returns the ID of the created log entry
 */
async function logDatabaseActivity(eventType, collection, documentId, data, options = {}) {
    try {
        const timestamp = new Date();
        const currentUser = auth.currentUser;
        
        const logData = {
            // Event metadata
            eventType,
            timestamp,
            source: 'client_application',
            
            // Resource identifiers
            collection,
            documentId: documentId || 'N/A',
            
            // Actor information
            userId: currentUser?.uid || 'unknown',
            userEmail: currentUser?.email || 'unknown',
            displayName: currentUser?.displayName || 'unknown',
            
            // Authorization context
            authorizedBy: options.authorizedBy || currentUser?.uid || 'unknown',
            editedBy: options.editedBy || currentUser?.email || 'unknown',
            
            // Change details
            details: {
                operation: eventType,
                newData: data || null,
                oldData: options.oldData || null,
                changeDescription: options.changeDescription || null
            },
            
            // Client context
            clientInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                appVersion: 'Apollo Project v1.0'
            }
        };

        const docRef = await addDoc(collection(db, "reports"), logData);
        console.log(`Activity logged successfully: ${eventType} on ${collection}/${documentId}`);
        return docRef.id;
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error logging activity: ", error.code || '', msg);
        
        // Don't alert the user for logging failures, just silently report to console
        // This prevents disrupting user experience if logging fails
        return null;
    }
}

// Function to handle printing the report
function printReport() {
    try {
        // Log the print action
        logActivity('print_report', 'user_actions', null, {
            timestamp: new Date().toISOString()
        });
        
        // Store the original page title
        const originalTitle = document.title;
        
        // Set a more descriptive title for the print
        document.title = `Apollo Report - ${new Date().toLocaleDateString()}`;
        
        // Hide elements not needed in print
        const backIcon = document.querySelector('.back-icon');
        const form = document.getElementById('reportForm');
        const buttonContainer = document.querySelector('.button-container');
        
        if (backIcon) backIcon.style.display = 'none';
        if (form) form.style.display = 'none';
        if (buttonContainer) buttonContainer.style.display = 'none';
        
        // Add a print header
        const printHeader = document.createElement('div');
        printHeader.classList.add('print-header');
        printHeader.innerHTML = `
            <div class="print-logo">Apollo Agriculture Solutions</div>
            <div class="print-date">Report generated on ${new Date().toLocaleString()}</div>
        `;
        document.body.insertBefore(printHeader, document.body.firstChild);
        
        // Trigger the print dialog
        window.print();
        
        // Restore the elements after printing
        setTimeout(() => {
            if (backIcon) backIcon.style.display = '';
            if (form) form.style.display = '';
            if (buttonContainer) buttonContainer.style.display = '';
            document.title = originalTitle;
            
            // Remove the print header
            if (document.querySelector('.print-header')) {
                document.body.removeChild(document.querySelector('.print-header'));
            }
        }, 1000);
    } catch (error) {
        console.error("Error printing report:", error);
        alert("Failed to print report. Please try again.");
    }
}

// Function to download the report as PDF
function downloadReportAsPDF() {
    try {
        // Log the download action
        logActivity('download_pdf', 'user_actions', null, {
            filters: {
                startDate: document.getElementById('startDate').value || 'N/A',
                endDate: document.getElementById('endDate').value || 'N/A',
                collection: document.getElementById('collectionFilter').value || 'All',
                action: document.getElementById('actionFilter').value || 'All'
            },
            timestamp: new Date().toISOString()
        });
        
        // Get table data
        const table = document.getElementById('reportTable');
        if (!table || !table.rows || table.rows.length <= 1) {
            alert("No data to download. Please generate a report first.");
            return;
        }
        
        // Create PDF document
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'pt', 'a4');  // landscape orientation
        
        // Add title and date
        doc.setFontSize(18);
        doc.setTextColor(0, 121, 107);
        doc.text('Apollo Agriculture Report', 40, 40);
        
        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 60);
        
        // Get filter information
        const startDate = document.getElementById('startDate').value || 'N/A';
        const endDate = document.getElementById('endDate').value || 'N/A';
        const collection = document.getElementById('collectionFilter').value || 'All';
        const action = document.getElementById('actionFilter').value || 'All';
        
        doc.text(`Filters: ${startDate} to ${endDate} | Collection: ${collection} | Action: ${action}`, 40, 80);
        
        // Add the table using autotable plugin
        doc.autoTable({
            html: '#reportTable',
            startY: 100,
            styles: {
                fontSize: 8,
                cellPadding: 3,
                overflow: 'linebreak'
            },
            headStyles: {
                fillColor: [0, 121, 107],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [240, 248, 255]
            },
            margin: { top: 100 },
            didDrawPage: (data) => {
                // Add page number
                doc.setFontSize(8);
                doc.text(`Page ${doc.internal.getNumberOfPages()}`, data.settings.margin.right, doc.internal.pageSize.height - 10);
            }
        });
        
        // Generate a filename with date
        const date = new Date();
        const dateString = date.toISOString().split('T')[0];
        const timeString = date.toTimeString().split(' ')[0].replace(/:/g, '-');
        const filename = `Apollo_Report_${dateString}_${timeString}.pdf`;
        
        // Save the PDF
        doc.save(filename);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF. Please try again.");
    }
}

/**
 * Log creation of a document
 */
async function logCreate(collection, documentId, data) {
    return logDatabaseActivity('create', collection, documentId, data);
}

/**
 * Log update of a document
 */
async function logUpdate(collection, documentId, newData, oldData) {
    return logDatabaseActivity('update', collection, documentId, newData, { oldData });
}

/**
 * Log deletion of a document
 */
async function logDelete(collection, documentId, deletedData) {
    return logDatabaseActivity('delete', collection, documentId, null, { oldData: deletedData });
}

/**
 * Log authentication events
 */
async function logAuthEvent(eventType, userData) {
    return logDatabaseActivity(eventType, 'authentication', userData?.uid || 'anonymous', userData);
}

// Fetch and display reports (transactions)
async function fetchReports() {
    try {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const collectionFilter = document.getElementById('collectionFilter').value;
        const actionFilter = document.getElementById('actionFilter').value;
        
        // Log the report generation request
        await logActivity('generate_report', 'user_actions', null, { 
            filters: { startDate, endDate, collection: collectionFilter, action: actionFilter }
        });

        let queryRef = collection(db, "reports"); // Updated to use 'reports' collection

        // Apply filters
        const filters = [];
        if (startDate) {
            filters.push(where('timestamp', '>=', new Date(startDate)));
        }
        if (endDate) {
            // Add 1 day to endDate to include the whole day
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1);
            filters.push(where('timestamp', '<', end));
        }
        if (collectionFilter) {
            filters.push(where('collection', '==', collectionFilter));
        }
        if (actionFilter) {
            filters.push(where('action', '==', actionFilter));
        }
        if (filters.length > 0) {
            queryRef = query(queryRef, ...filters);
        }

        const querySnapshot = await getDocs(queryRef);
        const reportTableBody = document.getElementById('reportTable').getElementsByTagName('tbody')[0];
        reportTableBody.innerHTML = '';

        querySnapshot.forEach((docSnap) => {
            const transaction = docSnap.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${docSnap.id}</td>
                <td>${transaction.userId || ''}</td>
                <td>${transaction.action || ''}</td>
                <td>${transaction.timestamp && transaction.timestamp.toDate ? transaction.timestamp.toDate().toLocaleString() : ''}</td>
                <td>${transaction.documentId || ''}</td>
                <td>${transaction.collection || ''}</td>
                <td>${JSON.stringify(transaction.data) || ''}</td>
                <td>${transaction.authorizedBy || ''}</td>
                <td>${transaction.editedBy || ''}</td>
            `;
            reportTableBody.appendChild(row);
        });
    } catch (error) {
        const msg = error && error.message ? error.message : String(error);
        console.error("Error fetching reports: ", error.code || '', msg);
        
        // Log the error
        await logError('reports', 'Failed to fetch reports', {
            filters: {
                startDate: document.getElementById('startDate').value || 'N/A',
                endDate: document.getElementById('endDate').value || 'N/A',
                collection: document.getElementById('collectionFilter').value || 'All',
                action: document.getElementById('actionFilter').value || 'All'
            },
            errorMessage: msg
        });
        
        alert(`An error occurred while fetching reports: ${msg}`);
    }
}