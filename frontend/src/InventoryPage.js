import React, { useState, useEffect } from 'react';
import InventoryService from './services/InventoryService';
import ExcelExportService from './services/ExcelExportService';
import ExcelImport from './components/ExcelImport';
import { dataEventManager, DATA_TYPES } from './services/dataEventManager';
import { useAppMode } from './contexts/AppModeContext';
import ModeInventoryService from './services/ModeInventoryService';
import './PageContent.css';
import './InventoryPage.css';

const InventoryPage = () => {
  const {
    currentMode,
    getCurrentModeConfig,
    canIgnoreInventory,
    shouldShowInventoryWarnings,
    requiresInventoryValidation,
    allowsUnlimitedConfigurations
  } = useAppMode();
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [inventoryWarnings, setInventoryWarnings] = useState([]);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCategoryType, setFilterCategoryType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);
  
  // UI states
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [stockOperation, setStockOperation] = useState('add');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Enhanced item data structure - Complete backend mapping
  const [itemData, setItemData] = useState({
    name: '',
    sku: '',
    description: '',
    categoryType: 'window_type',
    category: '',
    
    // Complete Specifications matching backend model
    specifications: {
      windowType: '',
      glassType: '',
      thickness: '',
      frameMaterial: '',
      finish: '',
      grillePattern: '',
      grilleWidth: '',
      colorCode: '',
      colorFamily: '',
      dimensions: {
        width: { min: '', max: '', standard: '', unit: 'mm' },
        height: { min: '', max: '', standard: '', unit: 'mm' },
        depth: { min: '', max: '', standard: '', unit: 'mm' }
      },
      performance: {
        thermalRating: '',
        soundReduction: '',
        waterResistance: '',
        windResistance: '',
        energyRating: ''
      }
    },
    
    // Stock information - Enhanced
    stock: {
      currentQuantity: 0,
      reservedQuantity: 0,
      availableQuantity: 0,
      reorderLevel: 5,
      reorderQuantity: 20
    },
    
    // Pricing - Enhanced
    pricing: {
      unitPrice: 0,
      currency: 'INR',
      costPrice: 0,
      marginPercentage: 0
    },
    
    // Supply Chain - Enhanced
    supplier: {
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      leadTime: 7
    },
    
    // Location in warehouse
    location: {
      warehouse: '',
      section: '',
      row: '',
      shelf: ''
    },
    
    // Additional metadata
    status: 'active',
    notes: '',
    warranty: {
      period: '',
      terms: ''
    }
  });

  // Stock operation data
  const [stockData, setStockData] = useState({
    quantity: 0,
    reason: '',
    reference: '',
    performedBy: 'System'
  });

  // Load data on component mount
  useEffect(() => {
    loadInventory();
    loadCategories();
    loadDashboardStats();
  }, []);

  // Reload stats when mode changes
  useEffect(() => {
    if (inventory.length > 0) {
      loadDashboardStats();
    }
  }, [currentMode, inventory]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await InventoryService.getAllItems();
      setInventory(data);
      setError('');
    } catch (error) {
      setError('Failed to load inventory. Please try again.');
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await InventoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const stats = await InventoryService.getDashboardStats();
      
      // Enhance stats with mode-specific data
      const modeSpecificStats = ModeInventoryService.getModeSpecificStats(inventory, currentMode);
      const combinedStats = { ...stats, ...modeSpecificStats };
      setDashboardStats(combinedStats);
      
      // Load mode-based warnings
      if (shouldShowInventoryWarnings()) {
        const warnings = ModeInventoryService.getInventoryWarnings(inventory, currentMode);
        setInventoryWarnings(warnings);
      } else {
        setInventoryWarnings([]);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const resetForm = () => {
    setItemData({
      name: '',
      sku: '',
      description: '',
      categoryType: 'window_type',
      category: '',
      specifications: {
        windowType: '',
        glassType: '',
        thickness: '',
        frameMaterial: '',
        finish: '',
        grillePattern: '',
        grilleWidth: '',
        colorCode: '',
        colorFamily: '',
        dimensions: {
          width: { min: '', max: '', standard: '', unit: 'mm' },
          height: { min: '', max: '', standard: '', unit: 'mm' },
          depth: { min: '', max: '', standard: '', unit: 'mm' }
        },
        performance: {
          thermalRating: '',
          soundReduction: '',
          waterResistance: '',
          windResistance: '',
          energyRating: ''
        }
      },
      stock: {
        currentQuantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        reorderLevel: 5,
        reorderQuantity: 20
      },
      pricing: {
        unitPrice: 0,
        currency: 'INR',
        costPrice: 0,
        marginPercentage: 0
      },
      supplier: {
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        leadTime: 7
      },
      location: {
        warehouse: '',
        section: '',
        row: '',
        shelf: ''
      },
      status: 'active',
      notes: '',
      warranty: {
        period: '',
        terms: ''
      }
    });
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const keys = name.split('.');
      setItemData(prev => {
        const newData = { ...prev };
        let current = newData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        const finalKey = keys[keys.length - 1];
        current[finalKey] = type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value);
        
        return newData;
      });
    } else {
      setItemData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Basic validation
      if (!itemData.name.trim()) {
        setError('Product name is required.');
        return;
      }
      
      // Clean and prepare data for submission
      const cleanedData = {
        ...itemData,
        // Generate SKU if empty
        sku: itemData.sku?.trim() || `SKU-${Date.now()}`,
        // Use default category if not provided (required field)
        category: itemData.category?.trim() || '68ede250298996a8e3b081a4', // Default category ID
        // Set default categoryType (required field)
        categoryType: itemData.categoryType?.trim() || 'window_type',
        // Clean specifications to remove empty enum values
        specifications: {
          ...itemData.specifications,
          // Clean nested objects - remove empty strings for enums
          windowType: itemData.specifications.windowType?.trim() || undefined,
          glassType: itemData.specifications.glassType?.trim() || undefined,
          frameMaterial: itemData.specifications.frameMaterial?.trim() || undefined,
          finish: itemData.specifications.finish?.trim() || undefined,
          colorFamily: itemData.specifications.colorFamily?.trim() || undefined,
          grillePattern: itemData.specifications.grillePattern?.trim() || undefined,
          performance: {
            ...itemData.specifications.performance,
            // Remove empty energy rating to avoid enum validation error
            energyRating: itemData.specifications.performance?.energyRating?.trim() || undefined
          }
        }
      };

      // Remove undefined values from specifications to avoid enum validation errors
      if (!cleanedData.specifications.windowType) {
        delete cleanedData.specifications.windowType;
      }
      if (!cleanedData.specifications.glassType) {
        delete cleanedData.specifications.glassType;
      }
      if (!cleanedData.specifications.frameMaterial) {
        delete cleanedData.specifications.frameMaterial;
      }
      if (!cleanedData.specifications.finish) {
        delete cleanedData.specifications.finish;
      }
      if (!cleanedData.specifications.colorFamily) {
        delete cleanedData.specifications.colorFamily;
      }
      if (!cleanedData.specifications.grillePattern) {
        delete cleanedData.specifications.grillePattern;
      }
      if (!cleanedData.specifications.performance.energyRating) {
        delete cleanedData.specifications.performance.energyRating;
      }
      
      console.log('Submitting cleaned data:', cleanedData);
      
      const result = await InventoryService.createInventoryItem(cleanedData);
      setInventory(prev => [...prev, result]);
      
      resetForm();
      setShowAddPopup(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
      // Refresh dashboard stats
      loadDashboardStats();
    } catch (error) {
      setError('Failed to add inventory item. Please try again.');
      console.error('Error creating inventory item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Clean and prepare data for submission (same as create)
      const cleanedData = {
        ...itemData,
        // Use existing SKU or generate new one if empty
        sku: itemData.sku?.trim() || `SKU-${Date.now()}`,
        // Handle category - it might be an object or string
        category: typeof itemData.category === 'string' 
          ? (itemData.category?.trim() || '68ede250298996a8e3b081a4')
          : (itemData.category?._id || '68ede250298996a8e3b081a4'),
        // Set default categoryType (required field)
        categoryType: itemData.categoryType?.trim() || 'window_type',
        // Clean specifications to remove empty enum values
        specifications: {
          ...itemData.specifications,
          // Clean nested objects - remove empty strings for enums
          windowType: itemData.specifications.windowType?.trim() || undefined,
          glassType: itemData.specifications.glassType?.trim() || undefined,
          frameMaterial: itemData.specifications.frameMaterial?.trim() || undefined,
          finish: itemData.specifications.finish?.trim() || undefined,
          colorFamily: itemData.specifications.colorFamily?.trim() || undefined,
          grillePattern: itemData.specifications.grillePattern?.trim() || undefined,
          performance: {
            ...itemData.specifications.performance,
            // Remove empty energy rating to avoid enum validation error
            energyRating: itemData.specifications.performance?.energyRating?.trim() || undefined
          }
        }
      };

      // Remove undefined values from specifications to avoid enum validation errors
      if (!cleanedData.specifications.windowType) {
        delete cleanedData.specifications.windowType;
      }
      if (!cleanedData.specifications.glassType) {
        delete cleanedData.specifications.glassType;
      }
      if (!cleanedData.specifications.frameMaterial) {
        delete cleanedData.specifications.frameMaterial;
      }
      if (!cleanedData.specifications.finish) {
        delete cleanedData.specifications.finish;
      }
      if (!cleanedData.specifications.colorFamily) {
        delete cleanedData.specifications.colorFamily;
      }
      if (!cleanedData.specifications.grillePattern) {
        delete cleanedData.specifications.grillePattern;
      }
      if (!cleanedData.specifications.performance.energyRating) {
        delete cleanedData.specifications.performance.energyRating;
      }
      
      console.log('Updating with cleaned data:', cleanedData);
      console.log('Editing item ID:', editingItem._id);
      
      const result = await InventoryService.updateItem(editingItem._id, cleanedData);
      console.log('Update result:', result);
      
      // Update the specific item in the state
      setInventory(prev => {
        const updatedInventory = prev.map(item => {
          if (item._id === editingItem._id) {
            console.log('Found matching item to update:', item._id);
            return result;
          }
          return item;
        });
        console.log('Updated inventory state:', updatedInventory);
        return updatedInventory;
      });
      
      resetForm();
      setShowEditPopup(false);
      setEditingItem(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
      // Refresh dashboard stats
      loadDashboardStats();
    } catch (error) {
      setError('Failed to update inventory item. Please try again.');
      console.error('Error updating inventory item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setItemData({
      name: item.name || '',
      sku: item.sku || '',
      description: item.description || '',
      categoryType: item.categoryType || 'window_type',
      category: item.category || '',
      
      specifications: {
        windowType: item.specifications?.windowType || '',
        glassType: item.specifications?.glassType || '',
        thickness: item.specifications?.thickness || '',
        frameMaterial: item.specifications?.frameMaterial || '',
        finish: item.specifications?.finish || '',
        grillePattern: item.specifications?.grillePattern || '',
        grilleWidth: item.specifications?.grilleWidth || '',
        colorCode: item.specifications?.colorCode || '',
        colorFamily: item.specifications?.colorFamily || '',
        dimensions: {
          width: item.specifications?.dimensions?.width || { min: '', max: '', standard: '', unit: 'mm' },
          height: item.specifications?.dimensions?.height || { min: '', max: '', standard: '', unit: 'mm' },
          depth: item.specifications?.dimensions?.depth || { min: '', max: '', standard: '', unit: 'mm' }
        },
        performance: {
          thermalRating: item.specifications?.performance?.thermalRating || '',
          soundReduction: item.specifications?.performance?.soundReduction || '',
          waterResistance: item.specifications?.performance?.waterResistance || '',
          windResistance: item.specifications?.performance?.windResistance || '',
          energyRating: item.specifications?.performance?.energyRating || ''
        }
      },
      
      stock: {
        currentQuantity: item.stock?.currentQuantity || 0,
        reservedQuantity: item.stock?.reservedQuantity || 0,
        availableQuantity: item.stock?.availableQuantity || 0,
        reorderLevel: item.stock?.reorderLevel || 5,
        reorderQuantity: item.stock?.reorderQuantity || 20
      },
      
      pricing: {
        unitPrice: item.pricing?.unitPrice || 0,
        currency: item.pricing?.currency || 'INR',
        costPrice: item.pricing?.costPrice || 0,
        marginPercentage: item.pricing?.marginPercentage || 0
      },
      
      supplier: {
        name: item.supplier?.name || '',
        contactPerson: item.supplier?.contactPerson || '',
        phone: item.supplier?.phone || '',
        email: item.supplier?.email || '',
        leadTime: item.supplier?.leadTime || 7
      },
      
      location: {
        warehouse: item.location?.warehouse || '',
        section: item.location?.section || '',
        row: item.location?.row || '',
        shelf: item.location?.shelf || ''
      },
      
      status: item.status || 'active',
      notes: item.notes || '',
      warranty: {
        period: item.warranty?.period || '',
        terms: item.warranty?.terms || ''
      }
    });
    setShowEditPopup(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        setLoading(true);
        await InventoryService.deleteItem(id);
        setInventory(prev => prev.filter(item => item._id !== id));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        loadDashboardStats();
      } catch (error) {
        setError('Failed to delete inventory item. Please try again.');
        console.error('Error deleting inventory item:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter and search logic
  const getFilteredInventory = () => {
    return inventory.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchesCategoryType = filterCategoryType === 'all' || item.categoryType === filterCategoryType;
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchesLowStock = !showLowStock || (item.stock?.currentQuantity <= item.stock?.reorderLevel);
      
      return matchesSearch && matchesCategory && matchesCategoryType && matchesStatus && matchesLowStock;
    });
  };

  const getSortedInventory = (filtered) => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'sku':
          return (a.sku || '').localeCompare(b.sku || '');
        case 'stock.currentQuantity':
          return (b.stock?.currentQuantity || 0) - (a.stock?.currentQuantity || 0);
        case 'pricing.unitPrice':
          return (b.pricing?.unitPrice || 0) - (a.pricing?.unitPrice || 0);
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });
  };

  const filteredInventory = getFilteredInventory();
  const sortedInventory = getSortedInventory(filteredInventory);
  
  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedInventory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedInventory.length / itemsPerPage);

  // Manufacturing export function
  const handleManufacturingExport = async () => {
    try {
      setLoading(true);
      
      // Generate export data with mode-specific formatting
      const exportData = ModeInventoryService.generateConfigurationExport(
        inventory.map(item => ({
          id: item._id,
          name: item.name,
          sku: item.sku,
          category: item.category,
          stock: item.stock,
          pricing: item.pricing,
          specifications: item.specifications,
          items: [{ id: item._id, quantity: item.stock?.currentQuantity || 0 }]
        })),
        currentMode
      );
      
      // Create downloadable file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manufacturing-inventory-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Show success message
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
    } catch (error) {
      console.error('Error exporting manufacturing data:', error);
      setError('Failed to export manufacturing data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1>Inventory Management</h1>
          <p>Manage and view all your inventory items</p>
        </div>
        <div className="header-actions">
          <button 
            className="add-client-btn"
            onClick={() => setShowAddPopup(true)}
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Add Inventory Item
          </button>
          
          {/* Manufacturing Export Button - Only visible in Manufacturer mode */}
          {currentMode === 'manufacturer' && (
            <button 
              className="export-btn manufacturer-export"
              onClick={handleManufacturingExport}
              disabled={loading || inventory.length === 0}
              title="Export inventory data for manufacturing"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              Export for Manufacturing
            </button>
          )}
        </div>
      </div>

      {/* Mode Indicator */}
      <div className={`mode-indicator mode-${currentMode}`}>
        <div className="mode-info">
          <span className="mode-icon">{getCurrentModeConfig().icon}</span>
          <div className="mode-details">
            <strong>{getCurrentModeConfig().name}</strong>
            <span className="mode-description">{getCurrentModeConfig().description}</span>
          </div>
        </div>
        <div className="mode-features">
          {canIgnoreInventory() && (
            <span className="feature-badge unlimited">Unlimited Stock</span>
          )}
          {requiresInventoryValidation() && (
            <span className="feature-badge validation">Real-time Validation</span>
          )}
          {shouldShowInventoryWarnings() && (
            <span className="feature-badge warnings">Inventory Warnings</span>
          )}
        </div>
      </div>

      {/* Inventory Warnings */}
      {shouldShowInventoryWarnings() && inventoryWarnings.length > 0 && (
        <div className="inventory-warnings">
          <h3>⚠️ Inventory Alerts</h3>
          <div className="warnings-list">
            {inventoryWarnings.map((warning, index) => (
              <div key={index} className={`warning-item ${warning.severity}`}>
                <span className="warning-message">{warning.message}</span>
                <span className="warning-type">{warning.type.replace('-', ' ').toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="page-content">
        {/* Success Message */}
        {saved && (
          <div className="success-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '8px'}}>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Item saved successfully!
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

        {/* Controls */}
        <div className="client-controls">
          <div className="search-section">
            <div className="search-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                placeholder="Search inventory by name, SKU, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-section">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Sort by Name</option>
              <option value="sku">Sort by SKU</option>
              <option value="stock.currentQuantity">Sort by Stock</option>
              <option value="pricing.unitPrice">Sort by Price</option>
              <option value="createdAt">Sort by Date</option>
            </select>

            <select value={filterCategoryType} onChange={(e) => setFilterCategoryType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="window_type">Window Types</option>
              <option value="glass_type">Glass Types</option>
              <option value="frame_material">Frame Materials</option>
              <option value="grille_pattern">Grille Patterns</option>
              <option value="color_option">Color Options</option>
              <option value="hardware">Hardware</option>
              <option value="accessory">Accessories</option>
            </select>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
        </div>

        {/* Inventory Statistics */}
        <div className="client-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">{dashboardStats.totalItems || 0}</div>
              <div className="stat-label">Total Items</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">{dashboardStats.totalStock || 0}</div>
              <div className="stat-label">Total Stock</div>
            </div>
          </div>
          
          <div className="stat-card low-stock">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">{dashboardStats.lowStockItems || 0}</div>
              <div className="stat-label">Low Stock</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">₹{(dashboardStats.totalValue || 0).toLocaleString()}</div>
              <div className="stat-label">Total Value</div>
            </div>
          </div>
        </div>

      {/* Inventory Table */}
      <div className="inventory-table-container">
        {currentItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No inventory items found</h3>
            {inventory.length === 0 ? (
              <p>Start by adding your first inventory item or run the seed script to populate with sample data.</p>
            ) : (
              <p>Try adjusting your search criteria or filters.</p>
            )}
          </div>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item Details</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Pricing</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(item => (
                <tr key={item._id}>
                  <td>
                    <div className="item-details">
                      <div className="item-name">{item.name}</div>
                      <div className="item-sku">SKU: {item.sku}</div>
                      {item.description && (
                        <div className="item-description">{item.description}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="category-info">
                      <div className="category-type">{item.categoryType?.replace('_', ' ')}</div>
                      <div className="category-name">
                        {Array.isArray(categories) ? categories.find(cat => cat._id === item.category)?.name || 'Uncategorized' : 'Uncategorized'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="stock-info">
                      <div className="stock-current">
                        <strong>{item.stock?.currentQuantity || 0}</strong> units
                      </div>
                      {item.stock?.reservedQuantity > 0 && (
                        <div className="stock-reserved">
                          Reserved: {item.stock.reservedQuantity}
                        </div>
                      )}
                      <div className="stock-value">
                        Total: ₹{((item.pricing?.unitPrice || 0) * (item.stock?.currentQuantity || 0)).toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="pricing-info">
                      <div className="unit-price">₹{(item.pricing?.unitPrice || 0).toLocaleString()}</div>
                      {item.pricing?.costPrice > 0 && (
                        <div className="cost-price">Cost: ₹{item.pricing.costPrice.toLocaleString()}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={`status-badge ${item.status}`}>
                      {item.status?.replace('_', ' ')}
                    </div>
                    {item.stock?.currentQuantity <= item.stock?.reorderLevel && (
                      <div className="reorder-alert">
                        🔔 Reorder needed
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(item)}
                        title="Edit item"
                      >
                        ✏️
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(item._id)}
                        title="Delete item"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ← Previous
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {totalPages} ({sortedInventory.length} items)
          </span>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      )}

      {/* Enhanced Add/Edit Inventory Item Modal */}
      {(showAddPopup || showEditPopup) && (
        <div className="popup-overlay">
          <div className="popup-container large-popup">
            <div className="popup-header">
              <h2>{showEditPopup ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
              <button className="close-btn" onClick={() => { setShowAddPopup(false); setShowEditPopup(false); resetForm(); }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <form id="inventory-form" onSubmit={showEditPopup ? handleEditSubmit : handleSubmit} className="comprehensive-form">
              
              {/* Basic Product Information */}
              <div className="form-section">
                <h3>📦 Product Information</h3>
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
                    <label htmlFor="sku">SKU</label>
                    <input
                      type="text"
                      id="sku"
                      name="sku"
                      value={itemData.sku}
                      onChange={handleInputChange}
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="categoryType">Product Type *</label>
                    <select
                      id="categoryType"
                      name="categoryType"
                      value={itemData.categoryType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="window_type">Window Type</option>
                      <option value="glass_type">Glass Type</option>
                      <option value="frame_material">Frame Material</option>
                      <option value="grille_pattern">Grille Pattern</option>
                      <option value="color_option">Color Option</option>
                      <option value="hardware">Hardware</option>
                      <option value="accessory">Accessory</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select
                      id="category"
                      name="category"
                      value={itemData.category}
                      onChange={handleInputChange}
                    >
                      <option value="">Select category</option>
                      {Array.isArray(categories) && categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={itemData.description}
                    onChange={handleInputChange}
                    placeholder="Detailed product description"
                    rows="3"
                  />
                </div>
              </div>

              {/* Specifications Section */}
              <div className="form-section">
                <h3>🔧 Product Specifications</h3>
                
                <div className="form-subsection">
                  <h4>Window & Glass Details</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="specifications.windowType">Window Type</label>
                      <select
                        id="specifications.windowType"
                        name="specifications.windowType"
                        value={itemData.specifications?.windowType || ''}
                        onChange={handleInputChange}
                      >
                        <option value="">Select window type</option>
                        <option value="sliding">Sliding</option>
                        <option value="casement">Casement</option>
                        <option value="bay">Bay</option>
                        <option value="double_hung">Double Hung</option>
                        <option value="fixed">Fixed</option>
                        <option value="awning">Awning</option>
                        <option value="picture">Picture</option>
                        <option value="single_hung">Single Hung</option>
                        <option value="pivot">Pivot</option>
                        <option value="metal">Metal</option>
                        <option value="louvered">Louvered</option>
                        <option value="glass_block">Glass Block</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="specifications.glassType">Glass Type</label>
                      <select
                        id="specifications.glassType"
                        name="specifications.glassType"
                        value={itemData.specifications?.glassType || ''}
                        onChange={handleInputChange}
                      >
                        <option value="">Select glass type</option>
                        <option value="single">Single</option>
                        <option value="double">Double</option>
                        <option value="triple">Triple</option>
                        <option value="laminated">Laminated</option>
                        <option value="tempered">Tempered</option>
                        <option value="low_e">Low-E</option>
                        <option value="tinted">Tinted</option>
                        <option value="reflective">Reflective</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="specifications.thickness">Glass Thickness (mm)</label>
                      <input
                        type="number"
                        id="specifications.thickness"
                        name="specifications.thickness"
                        value={itemData.specifications?.thickness || ''}
                        onChange={handleInputChange}
                        min="3"
                        max="50"
                        placeholder="Enter thickness"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-subsection">
                  <h4>Frame & Material Details</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="specifications.frameMaterial">Frame Material</label>
                      <select
                        id="specifications.frameMaterial"
                        name="specifications.frameMaterial"
                        value={itemData.specifications?.frameMaterial || ''}
                        onChange={handleInputChange}
                      >
                        <option value="">Select frame material</option>
                        <option value="aluminum">Aluminum</option>
                        <option value="upvc">uPVC</option>
                        <option value="wooden">Wooden</option>
                        <option value="steel">Steel</option>
                        <option value="composite">Composite</option>
                        <option value="fiberglass">Fiberglass</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="specifications.finish">Frame Finish</label>
                      <select
                        id="specifications.finish"
                        name="specifications.finish"
                        value={itemData.specifications?.finish || ''}
                        onChange={handleInputChange}
                      >
                        <option value="">Select finish</option>
                        <option value="powder_coated">Powder Coated</option>
                        <option value="anodized">Anodized</option>
                        <option value="painted">Painted</option>
                        <option value="natural">Natural</option>
                        <option value="laminated">Laminated</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-subsection">
                  <h4>Color & Pattern Options</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="specifications.colorFamily">Color Family</label>
                      <select
                        id="specifications.colorFamily"
                        name="specifications.colorFamily"
                        value={itemData.specifications?.colorFamily || ''}
                        onChange={handleInputChange}
                      >
                        <option value="">Select color family</option>
                        <option value="white">White</option>
                        <option value="black">Black</option>
                        <option value="brown">Brown</option>
                        <option value="grey">Grey</option>
                        <option value="bronze">Bronze</option>
                        <option value="silver">Silver</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="specifications.colorCode">Color Code</label>
                      <input
                        type="text"
                        id="specifications.colorCode"
                        name="specifications.colorCode"
                        value={itemData.specifications?.colorCode || ''}
                        onChange={handleInputChange}
                        placeholder="RAL/HEX code"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="specifications.grillePattern">Grille Pattern</label>
                      <select
                        id="specifications.grillePattern"
                        name="specifications.grillePattern"
                        value={itemData.specifications?.grillePattern || ''}
                        onChange={handleInputChange}
                      >
                        <option value="">Select grille pattern</option>
                        <option value="colonial">Colonial</option>
                        <option value="prairie">Prairie</option>
                        <option value="diamond">Diamond</option>
                        <option value="georgian">Georgian</option>
                        <option value="custom_grid">Custom Grid</option>
                        <option value="between_glass">Between Glass</option>
                        <option value="snap_in">Snap In</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="specifications.grilleWidth">Grille Width (mm)</label>
                      <input
                        type="number"
                        id="specifications.grilleWidth"
                        name="specifications.grilleWidth"
                        value={itemData.specifications?.grilleWidth || ''}
                        onChange={handleInputChange}
                        placeholder="Enter grille width"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-subsection">
                  <h4>Dimensions</h4>
                  <div className="dimension-group">
                    <h5>Width (mm)</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="specifications.dimensions.width.min">Min</label>
                        <input
                          type="number"
                          id="specifications.dimensions.width.min"
                          name="specifications.dimensions.width.min"
                          value={itemData.specifications?.dimensions?.width?.min || ''}
                          onChange={handleInputChange}
                          placeholder="Min width"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="specifications.dimensions.width.max">Max</label>
                        <input
                          type="number"
                          id="specifications.dimensions.width.max"
                          name="specifications.dimensions.width.max"
                          value={itemData.specifications?.dimensions?.width?.max || ''}
                          onChange={handleInputChange}
                          placeholder="Max width"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="specifications.dimensions.width.standard">Standard</label>
                        <input
                          type="number"
                          id="specifications.dimensions.width.standard"
                          name="specifications.dimensions.width.standard"
                          value={itemData.specifications?.dimensions?.width?.standard || ''}
                          onChange={handleInputChange}
                          placeholder="Standard width"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="dimension-group">
                    <h5>Height (mm)</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="specifications.dimensions.height.min">Min</label>
                        <input
                          type="number"
                          id="specifications.dimensions.height.min"
                          name="specifications.dimensions.height.min"
                          value={itemData.specifications?.dimensions?.height?.min || ''}
                          onChange={handleInputChange}
                          placeholder="Min height"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="specifications.dimensions.height.max">Max</label>
                        <input
                          type="number"
                          id="specifications.dimensions.height.max"
                          name="specifications.dimensions.height.max"
                          value={itemData.specifications?.dimensions?.height?.max || ''}
                          onChange={handleInputChange}
                          placeholder="Max height"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="specifications.dimensions.height.standard">Standard</label>
                        <input
                          type="number"
                          id="specifications.dimensions.height.standard"
                          name="specifications.dimensions.height.standard"
                          value={itemData.specifications?.dimensions?.height?.standard || ''}
                          onChange={handleInputChange}
                          placeholder="Standard height"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="dimension-group">
                    <h5>Depth (mm)</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="specifications.dimensions.depth.min">Min</label>
                        <input
                          type="number"
                          id="specifications.dimensions.depth.min"
                          name="specifications.dimensions.depth.min"
                          value={itemData.specifications?.dimensions?.depth?.min || ''}
                          onChange={handleInputChange}
                          placeholder="Min depth"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="specifications.dimensions.depth.max">Max</label>
                        <input
                          type="number"
                          id="specifications.dimensions.depth.max"
                          name="specifications.dimensions.depth.max"
                          value={itemData.specifications?.dimensions?.depth?.max || ''}
                          onChange={handleInputChange}
                          placeholder="Max depth"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="specifications.dimensions.depth.standard">Standard</label>
                        <input
                          type="number"
                          id="specifications.dimensions.depth.standard"
                          name="specifications.dimensions.depth.standard"
                          value={itemData.specifications?.dimensions?.depth?.standard || ''}
                          onChange={handleInputChange}
                          placeholder="Standard depth"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-subsection">
                  <h4>Performance Characteristics</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="specifications.performance.thermalRating">Thermal Rating (U-Value)</label>
                      <input
                        type="number"
                        step="0.1"
                        id="specifications.performance.thermalRating"
                        name="specifications.performance.thermalRating"
                        value={itemData.specifications?.performance?.thermalRating || ''}
                        onChange={handleInputChange}
                        placeholder="U-Value"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="specifications.performance.soundReduction">Sound Reduction (dB)</label>
                      <input
                        type="number"
                        id="specifications.performance.soundReduction"
                        name="specifications.performance.soundReduction"
                        value={itemData.specifications?.performance?.soundReduction || ''}
                        onChange={handleInputChange}
                        placeholder="Sound reduction"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="specifications.performance.energyRating">Energy Rating</label>
                      <select
                        id="specifications.performance.energyRating"
                        name="specifications.performance.energyRating"
                        value={itemData.specifications?.performance?.energyRating || ''}
                        onChange={handleInputChange}
                      >
                        <option value="">Select energy rating</option>
                        <option value="A+">A+</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="specifications.performance.waterResistance">Water Resistance</label>
                      <input
                        type="number"
                        id="specifications.performance.waterResistance"
                        name="specifications.performance.waterResistance"
                        value={itemData.specifications?.performance?.waterResistance || ''}
                        onChange={handleInputChange}
                        placeholder="Water resistance rating"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="specifications.performance.windResistance">Wind Resistance</label>
                      <input
                        type="number"
                        id="specifications.performance.windResistance"
                        name="specifications.performance.windResistance"
                        value={itemData.specifications?.performance?.windResistance || ''}
                        onChange={handleInputChange}
                        placeholder="Wind resistance rating"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div className="form-section">
                <h3>📊 Stock Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="stock.currentQuantity">Current Stock *</label>
                    <input
                      type="number"
                      id="stock.currentQuantity"
                      name="stock.currentQuantity"
                      value={itemData.stock?.currentQuantity || 0}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="stock.reservedQuantity">Reserved Stock</label>
                    <input
                      type="number"
                      id="stock.reservedQuantity"
                      name="stock.reservedQuantity"
                      value={itemData.stock?.reservedQuantity || 0}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      readOnly
                      title="Reserved stock is managed automatically"
                      style={{backgroundColor: '#f8f9fa'}}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="stock.availableQuantity">Available Stock</label>
                    <input
                      type="number"
                      id="stock.availableQuantity"
                      name="stock.availableQuantity"
                      value={(itemData.stock?.currentQuantity || 0) - (itemData.stock?.reservedQuantity || 0)}
                      readOnly
                      title="Automatically calculated: Current - Reserved"
                      style={{backgroundColor: '#f8f9fa'}}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="stock.reorderLevel">Reorder Level *</label>
                    <input
                      type="number"
                      id="stock.reorderLevel"
                      name="stock.reorderLevel"
                      value={itemData.stock?.reorderLevel || 5}
                      onChange={handleInputChange}
                      placeholder="5"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="stock.reorderQuantity">Reorder Quantity</label>
                    <input
                      type="number"
                      id="stock.reorderQuantity"
                      name="stock.reorderQuantity"
                      value={itemData.stock?.reorderQuantity || 20}
                      onChange={handleInputChange}
                      placeholder="20"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="form-section">
                <h3>💰 Pricing Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pricing.unitPrice">Unit Price (₹) *</label>
                    <input
                      type="number"
                      id="pricing.unitPrice"
                      name="pricing.unitPrice"
                      value={itemData.pricing?.unitPrice || 0}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pricing.costPrice">Cost Price (₹)</label>
                    <input
                      type="number"
                      id="pricing.costPrice"
                      name="pricing.costPrice"
                      value={itemData.pricing?.costPrice || 0}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pricing.marginPercentage">Margin (%)</label>
                    <input
                      type="number"
                      id="pricing.marginPercentage"
                      name="pricing.marginPercentage"
                      value={itemData.pricing?.marginPercentage || 0}
                      onChange={handleInputChange}
                      placeholder="Auto-calculated"
                      min="0"
                      step="0.01"
                      readOnly
                      title="Automatically calculated from unit price and cost price"
                      style={{backgroundColor: '#f8f9fa'}}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pricing.currency">Currency</label>
                    <select
                      id="pricing.currency"
                      name="pricing.currency"
                      value={itemData.pricing?.currency || 'INR'}
                      onChange={handleInputChange}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div className="form-section">
                <h3>🏭 Supplier Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="supplier.name">Supplier Name</label>
                    <input
                      type="text"
                      id="supplier.name"
                      name="supplier.name"
                      value={itemData.supplier?.name || ''}
                      onChange={handleInputChange}
                      placeholder="Supplier company name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="supplier.contactPerson">Contact Person</label>
                    <input
                      type="text"
                      id="supplier.contactPerson"
                      name="supplier.contactPerson"
                      value={itemData.supplier?.contactPerson || ''}
                      onChange={handleInputChange}
                      placeholder="Contact person name"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="supplier.phone">Phone Number</label>
                    <input
                      type="text"
                      id="supplier.phone"
                      name="supplier.phone"
                      value={itemData.supplier?.phone || ''}
                      onChange={handleInputChange}
                      placeholder="+91 XXXXXXXXXX"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="supplier.email">Email</label>
                    <input
                      type="email"
                      id="supplier.email"
                      name="supplier.email"
                      value={itemData.supplier?.email || ''}
                      onChange={handleInputChange}
                      placeholder="supplier@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="supplier.leadTime">Lead Time (days)</label>
                    <input
                      type="number"
                      id="supplier.leadTime"
                      name="supplier.leadTime"
                      value={itemData.supplier?.leadTime || 7}
                      onChange={handleInputChange}
                      placeholder="7"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Warehouse Location */}
              <div className="form-section">
                <h3>📍 Warehouse Location</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="location.warehouse">Warehouse</label>
                    <input
                      type="text"
                      id="location.warehouse"
                      name="location.warehouse"
                      value={itemData.location?.warehouse || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., Main Warehouse"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="location.section">Section</label>
                    <input
                      type="text"
                      id="location.section"
                      name="location.section"
                      value={itemData.location?.section || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., Glass Section"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="location.row">Row</label>
                    <input
                      type="text"
                      id="location.row"
                      name="location.row"
                      value={itemData.location?.row || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., Row A"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="location.shelf">Shelf</label>
                    <input
                      type="text"
                      id="location.shelf"
                      name="location.shelf"
                      value={itemData.location?.shelf || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., Shelf 1"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="form-section">
                <h3>📋 Additional Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={itemData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="discontinued">Discontinued</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="low_stock">Low Stock</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="warranty.period">Warranty Period (months)</label>
                    <input
                      type="number"
                      id="warranty.period"
                      name="warranty.period"
                      value={itemData.warranty?.period || ''}
                      onChange={handleInputChange}
                      placeholder="12"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes & Comments</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={itemData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional notes, installation instructions, or special considerations..."
                    rows="4"
                  />
                </div>
              </div>
            </form>

            {/* Error Message Display */}
            {error && (
              <div className="form-error-message" style={{
                background: '#fee2e2',
                color: '#dc2626',
                padding: '12px 20px',
                margin: '0 20px',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 17h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                {error}
              </div>
            )}

            {/* Form Actions - Outside form for proper sticky positioning */}
            <div className="popup-footer">
              <button 
                type="button" 
                onClick={() => { 
                  setShowAddPopup(false); 
                  setShowEditPopup(false); 
                  resetForm(); 
                }} 
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="inventory-form"
                className="submit-btn" 
                disabled={loading}
              >
                {loading ? (showEditPopup ? 'Updating...' : 'Adding...') : (showEditPopup ? 'Update Item' : 'Add Inventory Item')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default InventoryPage;