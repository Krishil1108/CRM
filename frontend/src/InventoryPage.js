import React, { useState, useEffect } from 'react';
import InventoryService from './services/InventoryService';
import ExcelExportService from './services/ExcelExportService';
import './PageContent.css';

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [itemData, setItemData] = useState({
    name: '',
    category: '',
    description: '',
    quantity: '',
    unitPrice: '',
    supplier: '',
    sku: '',
    reorderLevel: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError('');
      const inventoryData = await InventoryService.getAllInventory();
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
    } catch (error) {
      setError('Failed to load inventory items. Please try again.');
      console.error('Error loading inventory:', error);
      setInventory([]); // Ensure inventory remains an array even on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await InventoryService.deleteInventoryItem(itemId);
        setInventory(Array.isArray(inventory) ? inventory.filter(item => item._id !== itemId) : []);
      } catch (error) {
        setError('Failed to delete inventory item. Please try again.');
        console.error('Error deleting inventory item:', error);
      }
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      const updatedItem = await InventoryService.updateInventoryItem(itemId, { status: newStatus });
      setInventory(Array.isArray(inventory) ? inventory.map(item =>
        item._id === itemId ? updatedItem : item
      ) : []);
    } catch (error) {
      setError('Failed to update item status. Please try again.');
      console.error('Error updating item status:', error);
    }
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 0) return;
    
    try {
      const updatedItem = await InventoryService.updateInventoryItem(itemId, { quantity: parseInt(newQuantity) });
      setInventory(Array.isArray(inventory) ? inventory.map(item =>
        item._id === itemId ? updatedItem : item
      ) : []);
    } catch (error) {
      setError('Failed to update quantity. Please try again.');
      console.error('Error updating quantity:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setItemData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const newItemData = {
        name: itemData.name,
        category: itemData.category,
        description: itemData.description,
        quantity: parseInt(itemData.quantity) || 0,
        unitPrice: parseFloat(itemData.unitPrice) || 0,
        supplier: itemData.supplier,
        sku: itemData.sku || InventoryService.generateSKU(itemData.name, itemData.category),
        reorderLevel: parseInt(itemData.reorderLevel) || 10,
        location: itemData.location,
        notes: itemData.notes
      };
      
      const newItem = await InventoryService.createInventoryItem(newItemData);
      setInventory([...(Array.isArray(inventory) ? inventory : []), newItem]);
      
      // Reset form and close popup
      setItemData({
        name: '',
        category: '',
        description: '',
        quantity: '',
        unitPrice: '',
        supplier: '',
        sku: '',
        reorderLevel: '',
        location: '',
        notes: ''
      });
      
      setShowAddPopup(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setError('Failed to add inventory item. Please try again.');
      console.error('Error creating inventory item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePopup = () => {
    setShowAddPopup(false);
    setItemData({
      name: '',
      category: '',
      description: '',
      quantity: '',
      unitPrice: '',
      supplier: '',
      sku: '',
      reorderLevel: '',
      location: '',
      notes: ''
    });
  };

  // Filter and sort inventory
  const filteredInventory = (Array.isArray(inventory) ? inventory : [])
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      
      // Date range filtering
      let matchesDateRange = true;
      if (startDate || endDate) {
        const itemDate = new Date(item.createdAt);
        const start = startDate ? new Date(startDate) : new Date('1900-01-01');
        const end = endDate ? new Date(endDate) : new Date('2100-12-31');
        end.setHours(23, 59, 59, 999); // Set to end of day
        matchesDateRange = itemDate >= start && itemDate <= end;
      }
      
      return matchesSearch && matchesCategory && matchesStatus && matchesDateRange;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'quantity':
          return b.quantity - a.quantity;
        case 'price':
          return b.unitPrice - a.unitPrice;
        case 'totalValue':
          return b.totalValue - a.totalValue;
        case 'date':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock': return 'status-in-stock';
      case 'Low Stock': return 'status-low-stock';
      case 'Out of Stock': return 'status-out-of-stock';
      case 'Discontinued': return 'status-discontinued';
      default: return 'status-pending';
    }
  };

  // Excel export function
  const handleExportToExcel = () => {
    const filters = {
      searchTerm,
      filterCategory,
      filterStatus,
      sortBy,
      dateRange: startDate || endDate ? `${startDate || 'beginning'}_to_${endDate || 'present'}` : null
    };

    const filename = ExcelExportService.generateFilename('inventory', filters);
    const result = ExcelExportService.exportInventoryToExcel(filteredInventory, filters, filename);
    
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(result.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  // Clear date filters
  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
    setShowDateFilter(false);
  };

  // Get unique categories for filter
  const categories = [...new Set(Array.isArray(inventory) ? inventory.map(item => item.category) : [])];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1>Inventory Management</h1>
          <p>Manage your products, stock levels, and inventory operations</p>
        </div>
        <div className="header-actions">
          <button 
            className="export-btn"
            onClick={handleExportToExcel}
            title="Export to Excel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            Export to Excel ({filteredInventory.length} items)
          </button>
          <button 
            className="date-filter-btn"
            onClick={() => setShowDateFilter(!showDateFilter)}
            title="Date Range Filter"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
            Date Filter
          </button>
          <button 
            className="add-client-btn"
            onClick={() => setShowAddPopup(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Add Inventory Item
          </button>
        </div>
      </div>
      
      <div className="page-content">
        {/* Success Message */}
        {saved && (
          <div className="success-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '8px'}}>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Inventory item added successfully!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '8px'}}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-message">
            <div className="loading-spinner"></div>
            Loading inventory...
          </div>
        )}

        {/* Date Range Filter */}
        {showDateFilter && (
          <div className="date-filter-section">
            <div className="date-filter-container">
              <h3>Filter by Date Range</h3>
              <div className="date-inputs">
                <div className="date-input-group">
                  <label htmlFor="startDate">From Date:</label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="date-input-group">
                  <label htmlFor="endDate">To Date:</label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="date-filter-actions">
                  <button className="apply-date-btn" onClick={() => setShowDateFilter(false)}>
                    Apply Filter
                  </button>
                  <button className="clear-date-btn" onClick={clearDateFilters}>
                    Clear
                  </button>
                </div>
              </div>
              {(startDate || endDate) && (
                <div className="active-date-filter">
                  <span>Active filter: {startDate || 'Beginning'} to {endDate || 'Present'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="client-controls">
          <div className="search-section">
            <div className="search-input-container">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                placeholder="Search inventory items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-section">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Sort by Name</option>
              <option value="category">Sort by Category</option>
              <option value="quantity">Sort by Quantity</option>
              <option value="price">Sort by Price</option>
              <option value="totalValue">Sort by Total Value</option>
              <option value="date">Sort by Date Added</option>
            </select>

            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Discontinued">Discontinued</option>
            </select>
          </div>
        </div>

        {/* Inventory Statistics */}
        <div className="client-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{Array.isArray(inventory) ? inventory.length : 0}</div>
              <div className="stat-label">Total Items</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon in-stock">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{Array.isArray(inventory) ? inventory.filter(i => i.status === 'In Stock').length : 0}</div>
              <div className="stat-label">In Stock</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon low-stock">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{Array.isArray(inventory) ? inventory.filter(i => i.status === 'Low Stock').length : 0}</div>
              <div className="stat-label">Low Stock</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon total-value">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{formatCurrency(Array.isArray(inventory) ? inventory.reduce((sum, item) => sum + (item.totalValue || 0), 0) : 0)}</div>
              <div className="stat-label">Total Value</div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="client-table-container">
          {filteredInventory.length === 0 ? (
            <div className="no-clients">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/>
              </svg>
              <h3>No inventory items found</h3>
              <p>Start by adding your first inventory item using the "Add Inventory Item" button.</p>
            </div>
          ) : (
            <table className="client-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(item => (
                  <tr key={item._id}>
                    <td>
                      <div className="item-info">
                        <div className="item-name">
                          <strong>{item.name}</strong>
                          {item.supplier && <div className="item-supplier">Supplier: {item.supplier}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.sku || '-'}</td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                        className="quantity-input"
                        min="0"
                      />
                    </td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{formatCurrency(item.totalValue)}</td>
                    <td>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item._id, e.target.value)}
                        className={`status-select ${getStatusColor(item.status)}`}
                      >
                        <option value="In Stock">In Stock</option>
                        <option value="Low Stock">Low Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                        <option value="Discontinued">Discontinued</option>
                      </select>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(item._id)}
                          title="Delete Item"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Inventory Item Popup */}
      {showAddPopup && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h2>Add New Inventory Item</h2>
              <button className="close-btn" onClick={handleClosePopup}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="popup-form">
              <div className="form-section">
                <h3>Product Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Product Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={itemData.name}
                      onChange={handleInputChange}
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="category">Category *</label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      value={itemData.category}
                      onChange={handleInputChange}
                      placeholder="e.g., Electronics, Clothing, etc."
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={itemData.description}
                    onChange={handleInputChange}
                    placeholder="Product description"
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Inventory Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="quantity">Quantity *</label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={itemData.quantity}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="unitPrice">Unit Price *</label>
                    <input
                      type="number"
                      id="unitPrice"
                      name="unitPrice"
                      value={itemData.unitPrice}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="reorderLevel">Reorder Level</label>
                    <input
                      type="number"
                      id="reorderLevel"
                      name="reorderLevel"
                      value={itemData.reorderLevel}
                      onChange={handleInputChange}
                      placeholder="10"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="sku">SKU</label>
                    <input
                      type="text"
                      id="sku"
                      name="sku"
                      value={itemData.sku}
                      onChange={handleInputChange}
                      placeholder="Leave empty to auto-generate"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Additional Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="supplier">Supplier</label>
                    <input
                      type="text"
                      id="supplier"
                      name="supplier"
                      value={itemData.supplier}
                      onChange={handleInputChange}
                      placeholder="Supplier name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="location">Storage Location</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={itemData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Warehouse A, Shelf 3"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={itemData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes"
                    rows="3"
                  />
                </div>
              </div>

              <div className="popup-footer">
                <button type="button" onClick={handleClosePopup} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Inventory Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;