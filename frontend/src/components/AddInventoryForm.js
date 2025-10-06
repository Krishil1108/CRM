import React, { useState } from 'react';
import { inventoryAPI, handleAPIError } from '../services/api';
import { dataEventManager, DATA_TYPES } from '../services/dataEventManager';

const AddInventoryForm = ({ selectedDate, onClose, onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    quantity: '',
    unitPrice: '',
    supplier: '',
    sku: '',
    status: 'In Stock',
    reorderLevel: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await inventoryAPI.create({
        ...formData,
        quantity: Number(formData.quantity) || 0,
        unitPrice: Number(formData.unitPrice) || 0,
        reorderLevel: Number(formData.reorderLevel) || 0,
        dateAdded: selectedDate.toISOString()
      });
      
      console.log('Inventory item added successfully:', response.data);
      dataEventManager.emit(DATA_TYPES.INVENTORY, response.data);
      onClose();
    } catch (err) {
      setError(handleAPIError(err));
      console.error('Error adding inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Item Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Enter item name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              placeholder="e.g., Electronics, Office Supplies"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Item description..."
            rows="2"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity">Quantity *</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              required
              min="0"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="unitPrice">Unit Price *</label>
            <input
              type="number"
              id="unitPrice"
              name="unitPrice"
              value={formData.unitPrice}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="supplier">Supplier</label>
            <input
              type="text"
              id="supplier"
              name="supplier"
              value={formData.supplier}
              onChange={handleInputChange}
              placeholder="Supplier name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="sku">SKU</label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              placeholder="Stock Keeping Unit"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Discontinued">Discontinued</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="reorderLevel">Reorder Level</label>
            <input
              type="number"
              id="reorderLevel"
              name="reorderLevel"
              value={formData.reorderLevel}
              onChange={handleInputChange}
              min="0"
              placeholder="Minimum quantity"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Storage location (e.g., Warehouse A, Shelf B2)"
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-back" onClick={onBack}>
            ← Back
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Adding...' : 'Add Inventory'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddInventoryForm;