const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const { category, status, search, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    let query = {};
    
    // Add filters
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const inventory = await Inventory.find(query).sort(sortOptions);
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Error fetching inventory items', error: error.message });
  }
});

// Get single inventory item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ message: 'Error fetching inventory item', error: error.message });
  }
});

// Create new inventory item
router.post('/', async (req, res) => {
  try {
    const inventoryData = req.body;
    
    // Validate required fields
    if (!inventoryData.name || !inventoryData.category || inventoryData.quantity === undefined || !inventoryData.unitPrice) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, category, quantity, and unitPrice are required' 
      });
    }
    
    const newItem = new Inventory(inventoryData);
    await newItem.save();
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'SKU already exists' });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ message: 'Error creating inventory item', error: error.message });
  }
});

// Update inventory item
router.put('/:id', async (req, res) => {
  try {
    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'SKU already exists' });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ message: 'Error updating inventory item', error: error.message });
  }
});

// Delete inventory item
router.delete('/:id', async (req, res) => {
  try {
    const deletedItem = await Inventory.findByIdAndDelete(req.params.id);
    
    if (!deletedItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.json({ message: 'Inventory item deleted successfully', item: deletedItem });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ message: 'Error deleting inventory item', error: error.message });
  }
});

// Bulk update quantities (useful for inventory adjustments)
router.patch('/bulk-update', async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, quantity }
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: 'Updates must be an array' });
    }
    
    const results = [];
    
    for (const update of updates) {
      try {
        const item = await Inventory.findByIdAndUpdate(
          update.id,
          { quantity: update.quantity },
          { new: true, runValidators: true }
        );
        if (item) {
          results.push(item);
        }
      } catch (error) {
        console.error(`Error updating item ${update.id}:`, error);
      }
    }
    
    res.json({ message: 'Bulk update completed', updatedItems: results });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({ message: 'Error in bulk update', error: error.message });
  }
});

// Get inventory statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: '$totalValue' },
          averagePrice: { $avg: '$unitPrice' },
          inStock: {
            $sum: { $cond: [{ $eq: ['$status', 'In Stock'] }, 1, 0] }
          },
          lowStock: {
            $sum: { $cond: [{ $eq: ['$status', 'Low Stock'] }, 1, 0] }
          },
          outOfStock: {
            $sum: { $cond: [{ $eq: ['$status', 'Out of Stock'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const categoryStats = await Inventory.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalValue' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      summary: stats[0] || {
        totalItems: 0,
        totalQuantity: 0,
        totalValue: 0,
        averagePrice: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0
      },
      categories: categoryStats
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({ message: 'Error fetching inventory statistics', error: error.message });
  }
});

module.exports = router;