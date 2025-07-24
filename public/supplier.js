import { db, validateDocumentReferences, populateReferenceDropdown } from './database-utils.js';
import { 
    collection, 
    getDocs, 
    addDoc, 
    doc, 
    updateDoc, 
    deleteDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

class SupplierManager {
    constructor() {
        this.supplierForm = document.getElementById('supplierForm');
        this.fulfillmentForm = document.getElementById('fulfillmentForm');
        this.stockForm = document.getElementById('stockForm');
        
        this.inventoryRequestsTable = document.getElementById('inventoryRequestsTable').getElementsByTagName('tbody')[0];
        this.supplierStockTable = document.getElementById('supplierStockTable').getElementsByTagName('tbody')[0];
        this.fulfillmentHistoryTable = document.getElementById('fulfillmentHistoryTable').getElementsByTagName('tbody')[0];
        
        this.currentSupplier = this.getCurrentSupplier();
        this.currentFilter = 'all';
        
        this.init();
    }

    getCurrentSupplier() {
        // In a real app, get from authentication
        return { id: 'current_supplier_id', name: 'Current Supplier' };
    }

    async init() {
        this.attachEventListeners();
        await this.loadSupplierProfile();
        await this.loadInventoryRequests();
        await this.loadSupplierStock();
        await this.loadFulfillmentHistory();
        await this.populateRequestDropdown();
        await this.updateStatistics();
    }

    attachEventListeners() {
        this.supplierForm.addEventListener('submit', (e) => this.handleSupplierSubmit(e));
        this.fulfillmentForm.addEventListener('submit', (e) => this.handleFulfillmentSubmit(e));
        this.stockForm.addEventListener('submit', (e) => this.handleStockSubmit(e));
    }

    async handleSupplierSubmit(e) {
        e.preventDefault();
        
        const supplierId = document.getElementById('supplierId').value.trim();
        const supplierName = document.getElementById('supplierName').value.trim();
        const contactPerson = document.getElementById('contactPerson').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const specialization = document.getElementById('specialization').value.trim();

        if (!supplierName) {
            alert('Please fill in the supplier name.');
            return;
        }

        try {
            const supplierData = {
                supplierName,
                contactPerson,
                email,
                phone,
                address,
                specialization,
                updated_at: new Date().toISOString()
            };

            if (supplierId) {
                // Update existing supplier
                const supplierRef = doc(db, 'supplier', supplierId);
                await updateDoc(supplierRef, supplierData);
                alert('Supplier profile updated successfully!');
            } else {
                // Add new supplier
                supplierData.created_at = new Date().toISOString();
                await addDoc(collection(db, 'supplier'), supplierData);
                alert('Supplier profile created successfully!');
            }

            this.resetSupplierForm();
            await this.loadSupplierProfile();
        } catch (error) {
            console.error('Error managing supplier:', error);
            alert('Error managing supplier profile. Please try again.');
        }
    }

    async handleFulfillmentSubmit(e) {
        e.preventDefault();
        
        const requestId = document.getElementById('requestSelect').value;
        const availableQuantity = parseInt(document.getElementById('availableQuantity').value);
        const unitPrice = parseFloat(document.getElementById('unitPrice').value);
        const estimatedDelivery = document.getElementById('estimatedDelivery').value;
        const fulfillmentNotes = document.getElementById('fulfillmentNotes').value;
        const fulfillmentStatus = document.getElementById('fulfillmentStatus').value;

        if (!requestId || !availableQuantity || !unitPrice || !estimatedDelivery) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            // Create fulfillment record
            const fulfillmentData = {
                inventory_request_id: requestId,
                supplier_id: this.currentSupplier.id,
                available_quantity: availableQuantity,
                unit_price: unitPrice,
                total_price: availableQuantity * unitPrice,
                estimated_delivery: estimatedDelivery,
                fulfillment_notes,
                status: fulfillmentStatus,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            await addDoc(collection(db, 'inventory_fulfillments'), fulfillmentData);

            // Update the original inventory request status
            const inventoryRef = doc(db, 'inventory', requestId);
            await updateDoc(inventoryRef, {
                fulfillment_status: fulfillmentStatus,
                supplier_response_date: new Date().toISOString(),
                estimated_delivery: estimatedDelivery,
                quoted_price: unitPrice * availableQuantity,
                updated_at: new Date().toISOString()
            });

            alert('Request processed successfully!');
            this.resetFulfillmentForm();
            await this.loadInventoryRequests();
            await this.loadFulfillmentHistory();
            await this.updateStatistics();
        } catch (error) {
            console.error('Error processing fulfillment:', error);
            alert('Error processing request. Please try again.');
        }
    }

    async handleStockSubmit(e) {
        e.preventDefault();
        
        const stockId = document.getElementById('stockId').value.trim();
        const itemName = document.getElementById('itemName').value.trim();
        const category = document.getElementById('category').value;
        const stockQuantity = parseInt(document.getElementById('stockQuantity').value);
        const stockPrice = parseFloat(document.getElementById('stockPrice').value);
        const description = document.getElementById('description').value.trim();

        if (!itemName || !category || !stockQuantity || !stockPrice) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            const stockData = {
                supplier_id: this.currentSupplier.id,
                item_name: itemName,
                category,
                available_quantity: stockQuantity,
                price_per_unit: stockPrice,
                total_value: stockQuantity * stockPrice,
                description,
                updated_at: new Date().toISOString()
            };

            if (stockId) {
                // Update existing stock
                const stockRef = doc(db, 'supplier_stock', stockId);
                await updateDoc(stockRef, stockData);
                alert('Stock updated successfully!');
            } else {
                // Add new stock
                stockData.created_at = new Date().toISOString();
                await addDoc(collection(db, 'supplier_stock'), stockData);
                alert('Stock added successfully!');
            }

            this.resetStockForm();
            await this.loadSupplierStock();
            await this.updateStatistics();
        } catch (error) {
            console.error('Error managing stock:', error);
            alert('Error managing stock. Please try again.');
        }
    }

    async loadSupplierProfile() {
        try {
            // Load current supplier profile if exists
            const supplierQuery = query(
                collection(db, 'supplier'),
                where('supplier_id', '==', this.currentSupplier.id)
            );
            
            const snapshot = await getDocs(supplierQuery);
            
            if (!snapshot.empty) {
                const supplierData = snapshot.docs[0].data();
                document.getElementById('supplierId').value = snapshot.docs[0].id;
                document.getElementById('supplierName').value = supplierData.supplierName || '';
                document.getElementById('contactPerson').value = supplierData.contactPerson || '';
                document.getElementById('email').value = supplierData.email || '';
                document.getElementById('phone').value = supplierData.phone || '';
                document.getElementById('address').value = supplierData.address || '';
                document.getElementById('specialization').value = supplierData.specialization || '';
            }
        } catch (error) {
            console.error('Error loading supplier profile:', error);
        }
    }

    async loadInventoryRequests() {
        try {
            const snapshot = await getDocs(collection(db, 'inventory'));
            this.inventoryRequestsTable.innerHTML = '';

            const users = new Map();
            const userSnapshot = await getDocs(collection(db, 'users'));
            userSnapshot.forEach(doc => users.set(doc.id, doc.data()));

            snapshot.forEach((doc) => {
                const request = doc.data();
                
                // Show requests for this supplier or all if no specific supplier filter
                const shouldShow = this.currentFilter === 'all' || 
                                 (this.currentFilter === 'pending' && !request.fulfillment_status) ||
                                 (this.currentFilter === 'processing' && request.fulfillment_status === 'processing') ||
                                 (this.currentFilter === 'fulfilled' && request.fulfillment_status === 'delivered');

                if (shouldShow) {
                    const row = this.inventoryRequestsTable.insertRow();
                    const requestedBy = users.get(request.manager_id);
                    
                    row.innerHTML = `
                        <td>${doc.id.substring(0, 8)}...</td>
                        <td>${request.Description || 'No description'}</td>
                        <td>${Array.isArray(request.Products) ? request.Products.length : 'N/A'}</td>
                        <td>${new Date(request.created_at || Date.now()).toLocaleDateString()}</td>
                        <td>${requestedBy?.F_Name || 'Unknown'}</td>
                        <td><span class="priority-high">High</span></td>
                        <td>
                            <span class="status-badge ${request.fulfillment_status || 'pending'}">
                                ${request.fulfillment_status || 'Pending'}
                            </span>
                        </td>
                        <td>
                            <button onclick="supplierManager.selectRequestForFulfillment('${doc.id}')" class="btn-primary">
                                <i class="fas fa-hand-paper"></i> Process
                            </button>
                            <button onclick="supplierManager.viewRequestDetails('${doc.id}')" class="btn-info">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </td>
                    `;
                }
            });
        } catch (error) {
            console.error('Error loading inventory requests:', error);
        }
    }

    async loadSupplierStock() {
        try {
            const stockQuery = query(
                collection(db, 'supplier_stock'),
                where('supplier_id', '==', this.currentSupplier.id)
            );
            
            const snapshot = await getDocs(stockQuery);
            this.supplierStockTable.innerHTML = '';

            snapshot.forEach((doc) => {
                const stock = doc.data();
                const row = this.supplierStockTable.insertRow();
                
                row.innerHTML = `
                    <td>${stock.item_name}</td>
                    <td>${stock.category}</td>
                    <td>${stock.available_quantity}</td>
                    <td>$${stock.price_per_unit.toFixed(2)}</td>
                    <td>$${stock.total_value.toFixed(2)}</td>
                    <td>
                        <button onclick="supplierManager.editStock('${doc.id}')" class="btn-edit">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="supplierManager.deleteStock('${doc.id}')" class="btn-delete">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error loading supplier stock:', error);
        }
    }

    async loadFulfillmentHistory() {
        try {
            const fulfillmentQuery = query(
                collection(db, 'inventory_fulfillments'),
                where('supplier_id', '==', this.currentSupplier.id),
                orderBy('created_at', 'desc')
            );
            
            const snapshot = await getDocs(fulfillmentQuery);
            this.fulfillmentHistoryTable.innerHTML = '';

            snapshot.forEach((doc) => {
                const fulfillment = doc.data();
                const row = this.fulfillmentHistoryTable.insertRow();
                
                row.innerHTML = `
                    <td>${new Date(fulfillment.created_at).toLocaleDateString()}</td>
                    <td>${fulfillment.inventory_request_id.substring(0, 8)}...</td>
                    <td>Various Items</td>
                    <td>${fulfillment.available_quantity}</td>
                    <td>$${fulfillment.total_price.toFixed(2)}</td>
                    <td>
                        <span class="status-badge ${fulfillment.status}">
                            ${fulfillment.status}
                        </span>
                    </td>
                    <td>${new Date(fulfillment.estimated_delivery).toLocaleDateString()}</td>
                `;
            });
        } catch (error) {
            console.error('Error loading fulfillment history:', error);
        }
    }

    async populateRequestDropdown() {
        try {
            const requestSelect = document.getElementById('requestSelect');
            requestSelect.innerHTML = '<option value="">Select a request to fulfill</option>';

            const snapshot = await getDocs(collection(db, 'inventory'));
            
            snapshot.forEach((doc) => {
                const request = doc.data();
                // Only show pending requests
                if (!request.fulfillment_status || request.fulfillment_status === 'pending') {
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = `${doc.id.substring(0, 8)} - ${request.Description || 'No description'}`;
                    requestSelect.appendChild(option);
                }
            });
        } catch (error) {
            console.error('Error populating request dropdown:', error);
        }
    }

    async updateStatistics() {
        try {
            // Get pending requests count
            const inventorySnapshot = await getDocs(collection(db, 'inventory'));
            let pendingCount = 0;
            let fulfilledCount = 0;
            
            inventorySnapshot.forEach(doc => {
                const data = doc.data();
                if (!data.fulfillment_status || data.fulfillment_status === 'pending') {
                    pendingCount++;
                } else if (data.fulfillment_status === 'delivered') {
                    fulfilledCount++;
                }
            });

            // Get stock count
            const stockQuery = query(
                collection(db, 'supplier_stock'),
                where('supplier_id', '==', this.currentSupplier.id)
            );
            const stockSnapshot = await getDocs(stockQuery);
            let totalStock = 0;
            
            stockSnapshot.forEach(doc => {
                totalStock += doc.data().available_quantity || 0;
            });

            // Get monthly revenue
            const currentMonth = new Date().getMonth();
            const fulfillmentQuery = query(
                collection(db, 'inventory_fulfillments'),
                where('supplier_id', '==', this.currentSupplier.id)
            );
            const fulfillmentSnapshot = await getDocs(fulfillmentQuery);
            let monthlyRevenue = 0;
            
            fulfillmentSnapshot.forEach(doc => {
                const data = doc.data();
                const createdDate = new Date(data.created_at);
                if (createdDate.getMonth() === currentMonth) {
                    monthlyRevenue += data.total_price || 0;
                }
            });

            // Update UI
            document.getElementById('pendingRequests').textContent = pendingCount;
            document.getElementById('fulfilledRequests').textContent = fulfilledCount;
            document.getElementById('totalStock').textContent = totalStock;
            document.getElementById('monthlyRevenue').textContent = `$${monthlyRevenue.toFixed(2)}`;
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }

    selectRequestForFulfillment(requestId) {
        document.getElementById('requestSelect').value = requestId;
        document.getElementById('fulfillmentForm').scrollIntoView({ behavior: 'smooth' });
    }

    viewRequestDetails(requestId) {
        alert(`View details for request: ${requestId}\n\nThis would open a detailed view of the inventory request.`);
    }

    async editStock(stockId) {
        try {
            const stockRef = doc(db, 'supplier_stock', stockId);
            const stockSnap = await getDoc(stockRef);
            
            if (stockSnap.exists()) {
                const stock = stockSnap.data();
                
                document.getElementById('stockId').value = stockId;
                document.getElementById('itemName').value = stock.item_name;
                document.getElementById('category').value = stock.category;
                document.getElementById('stockQuantity').value = stock.available_quantity;
                document.getElementById('stockPrice').value = stock.price_per_unit;
                document.getElementById('description').value = stock.description;
                document.getElementById('submitStock').textContent = 'Update Stock';
                
                document.getElementById('stockForm').scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Error loading stock for edit:', error);
        }
    }

    async deleteStock(stockId) {
        if (confirm('Are you sure you want to delete this stock item?')) {
            try {
                await deleteDoc(doc(db, 'supplier_stock', stockId));
                alert('Stock deleted successfully!');
                await this.loadSupplierStock();
                await this.updateStatistics();
            } catch (error) {
                console.error('Error deleting stock:', error);
                alert('Error deleting stock.');
            }
        }
    }

    filterRequests(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        this.loadInventoryRequests();
    }

    resetSupplierForm() {
        this.supplierForm.reset();
        document.getElementById('supplierId').value = '';
        document.getElementById('submitSupplier').textContent = 'Add/Update Supplier';
    }

    resetFulfillmentForm() {
        this.fulfillmentForm.reset();
        document.getElementById('requestId').value = '';
        document.getElementById('submitFulfillment').textContent = 'Process Request';
    }

    resetStockForm() {
        this.stockForm.reset();
        document.getElementById('stockId').value = '';
        document.getElementById('submitStock').textContent = 'Add/Update Stock';
    }
}

// Initialize the supplier manager when the page loads
const supplierManager = new SupplierManager();

// Make it globally accessible for onclick handlers
window.supplierManager = supplierManager;

// Global filter function
window.filterRequests = (filter) => supplierManager.filterRequests(filter);
