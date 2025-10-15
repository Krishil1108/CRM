const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const InventoryItem = require('../models/InventoryItem');
const InventoryCategory = require('../models/InventoryCategory');
const StockTransaction = require('../models/StockTransaction');
const Activity = require('../models/Activity');

// ===========================================
// NEW ENHANCED INVENTORY SYSTEM ROUTES (SPECIFIC ROUTES FIRST)
// ===========================================

// INVENTORY CATEGORIES ROUTES
// ===========================================

// Get all inventory categories
router.get('/categories/list', async (req, res) => {
  try {
    const { type, active } = req.query;
    let query = {};
    
    if (type) query.type = type;
    if (active !== undefined) query.isActive = active === 'true';
    
    const categories = await InventoryCategory.find(query).sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Get all inventory categories (simple endpoint for frontend)
router.get('/categories', async (req, res) => {
  try {
    const categories = await InventoryCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Create new inventory category
router.post('/categories', async (req, res) => {
  try {
    const category = new InventoryCategory(req.body);
    await category.save();
    
    // Log activity
    await Activity.create({
      type: 'inventory_added',
      description: `Created new inventory category: ${category.name}`,
      entityId: category._id,
      entityType: 'Inventory',
      entityName: category.name,
      userId: req.body.createdBy || 'System',
      metadata: { categoryId: category._id, categoryType: category.type }
    });
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
});

// INVENTORY ITEMS ROUTES (NEW ENHANCED SYSTEM)
// ===========================================

// Get all inventory items with advanced filtering
router.get('/items', async (req, res) => {
  try {
    const { 
      category, 
      categoryType, 
      status, 
      windowType, 
      glassType, 
      frameMaterial,
      lowStock,
      search, 
      sortBy = 'name', 
      sortOrder = 'asc',
      page = 1,
      limit = 50
    } = req.query;
    
    let query = {};
    
    // Add filters
    if (category) query.category = category;
    if (categoryType) query.categoryType = categoryType;
    if (status) query.status = status;
    if (windowType) query['specifications.windowType'] = windowType;
    if (glassType) query['specifications.glassType'] = glassType;
    if (frameMaterial) query['specifications.frameMaterial'] = frameMaterial;
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock.currentQuantity', '$stock.reorderLevel'] };
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'supplier.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const [items, total] = await Promise.all([
      InventoryItem.find(query)
        .populate('category', 'name code type')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      InventoryItem.countDocuments(query)
    ]);
    
    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ message: 'Error fetching inventory items', error: error.message });
  }
});

// Create new inventory item
router.post('/items', async (req, res) => {
  try {
    const item = new InventoryItem(req.body);
    await item.save();
    
    // Create initial stock transaction
    if (item.stock.currentQuantity > 0) {
      await StockTransaction.create({
        inventoryItem: item._id,
        transactionType: 'stock_in',
        quantity: item.stock.currentQuantity,
        stockBefore: 0,
        stockAfter: item.stock.currentQuantity,
        referenceType: 'manual',
        performedBy: req.body.createdBy || 'System',
        reason: 'Initial stock entry'
      });
    }
    
    // Log activity
    await Activity.create({
      type: 'inventory_added',
      description: `Created new inventory item: ${item.name} (SKU: ${item.sku})`,
      entityId: item._id,
      entityType: 'Inventory',
      entityName: item.name,
      userId: req.body.createdBy || 'System',
      metadata: { itemId: item._id, sku: item.sku, quantity: item.stock.currentQuantity }
    });
    
    await item.populate('category');
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ message: 'Error creating inventory item', error: error.message });
  }
});

// Get inventory dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue,
      categoryStats
    ] = await Promise.all([
      InventoryItem.countDocuments({ status: 'active' }),
      InventoryItem.countDocuments({ status: 'low_stock' }),
      InventoryItem.countDocuments({ status: 'out_of_stock' }),
      InventoryItem.aggregate([
        { $match: { status: 'active' } },
        { $group: { 
          _id: null, 
          totalValue: { $sum: { $multiply: ['$stock.currentQuantity', '$pricing.unitPrice'] } }
        }}
      ]),
      InventoryItem.aggregate([
        { $group: { 
          _id: '$categoryType', 
          count: { $sum: 1 },
          totalStock: { $sum: '$stock.currentQuantity' },
          totalValue: { $sum: { $multiply: ['$stock.currentQuantity', '$pricing.unitPrice'] } }
        }}
      ])
    ]);
    
    res.json({
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue: totalValue[0]?.totalValue || 0,
      categoryStats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
});

// Get low stock items
router.get('/reports/low-stock', async (req, res) => {
  try {
    const lowStockItems = await InventoryItem.find({
      $expr: { $lte: ['$stock.currentQuantity', '$stock.reorderLevel'] }
    }).populate('category').sort({ 'stock.currentQuantity': 1 });
    
    res.json(lowStockItems);
  } catch (error) {
    console.error('Error fetching low stock report:', error);
    res.status(500).json({ message: 'Error fetching low stock report', error: error.message });
  }
});

// Get stats summary
router.get('/stats/summary', async (req, res) => {
  try {
    const totalItems = await InventoryItem.countDocuments();
    const totalValue = await InventoryItem.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$stock.currentQuantity', '$pricing.unitPrice'] } }
        }
      }
    ]);

    const lowStockCount = await InventoryItem.countDocuments({
      $expr: { $lte: ['$stock.currentQuantity', '$stock.reorderLevel'] }
    });

    res.json({
      totalItems,
      totalValue: totalValue[0]?.totalValue || 0,
      lowStockCount,
      categories: await InventoryCategory.countDocuments()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// PARAMETERIZED ROUTES (MUST COME AFTER SPECIFIC ROUTES)
// ===========================================

// Get single inventory item by ID
router.get('/items/:id', async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id).populate('category');
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ message: 'Error fetching inventory item', error: error.message });
  }
});

// Update inventory item
router.put('/items/:id', async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category');
    
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    // Log activity
    await Activity.create({
      type: 'inventory_updated',
      description: `Updated inventory item: ${item.name}`,
      entityId: item._id,
      entityType: 'Inventory',
      entityName: item.name,
      userId: req.body.updatedBy || 'System',
      metadata: { itemId: item._id, sku: item.sku }
    });
    
    res.json(item);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ message: 'Error updating inventory item', error: error.message });
  }
});

// Delete inventory item
router.delete('/items/:id', async (req, res) => {
  try {
    const deletedItem = await InventoryItem.findByIdAndDelete(req.params.id);
    
    if (!deletedItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    // Create activity log
    try {
      await Activity.create({
        type: 'inventory_updated', // Using existing enum value
        description: `Deleted inventory item: ${deletedItem.name}`,
        entityId: deletedItem._id,
        entityType: 'Inventory',
        entityName: deletedItem.name,
        userId: 'System',
        metadata: {
          name: deletedItem.name,
          sku: deletedItem.sku,
          category: deletedItem.category
        }
      });
    } catch (activityError) {
      console.warn('Failed to create activity log:', activityError);
    }
    
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ message: 'Error deleting inventory item', error: error.message });
  }
});

// Add stock to an item
router.post('/items/:id/stock/add', async (req, res) => {
  try {
    const { quantity, reason, reference, referenceType = 'manual', performedBy = 'System' } = req.body;
    
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    const stockBefore = item.stock.currentQuantity;
    const addedQuantity = item.addStock(quantity, reason);
    await item.save();
    
    // Create stock transaction record
    await StockTransaction.create({
      inventoryItem: item._id,
      transactionType: 'stock_in',
      quantity: quantity,
      stockBefore,
      stockAfter: item.stock.currentQuantity,
      reference,
      referenceType,
      performedBy,
      reason
    });
    
    // Log activity
    await Activity.create({
      type: 'inventory_updated',
      description: `Added ${quantity} units to ${item.name} (SKU: ${item.sku})`,
      entityId: item._id,
      entityType: 'Inventory',
      entityName: item.name,
      userId: performedBy,
      metadata: { 
        itemId: item._id, 
        sku: item.sku, 
        quantity, 
        stockBefore, 
        stockAfter: item.stock.currentQuantity 
      }
    });
    
    res.json({ 
      message: `Successfully added ${quantity} units`, 
      item: await item.populate('category')
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({ message: 'Error adding stock', error: error.message });
  }
});

// Consume stock from an item
router.post('/items/:id/stock/consume', async (req, res) => {
  try {
    const { quantity, reason, reference, referenceType = 'manual', performedBy = 'System' } = req.body;
    
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    if (item.stock.availableQuantity < quantity) {
      return res.status(400).json({ 
        message: 'Insufficient stock available',
        available: item.stock.availableQuantity,
        requested: quantity
      });
    }
    
    const stockBefore = item.stock.currentQuantity;
    const consumedQuantity = item.consumeStock(quantity);
    await item.save();
    
    // Create stock transaction record
    await StockTransaction.create({
      inventoryItem: item._id,
      transactionType: 'stock_out',
      quantity: consumedQuantity,
      stockBefore,
      stockAfter: item.stock.currentQuantity,
      reference,
      referenceType,
      performedBy,
      reason
    });
    
    // Log activity
    await Activity.create({
      type: 'inventory_updated',
      description: `Consumed ${consumedQuantity} units from ${item.name} (SKU: ${item.sku})`,
      entityId: item._id,
      entityType: 'Inventory',
      entityName: item.name,
      userId: performedBy,
      metadata: { 
        itemId: item._id, 
        sku: item.sku, 
        quantity: consumedQuantity, 
        stockBefore, 
        stockAfter: item.stock.currentQuantity 
      }
    });
    
    res.json({ 
      message: `Successfully consumed ${consumedQuantity} units`, 
      item: await item.populate('category')
    });
  } catch (error) {
    console.error('Error consuming stock:', error);
    res.status(500).json({ message: 'Error consuming stock', error: error.message });
  }
});

// Reserve stock for quotations
router.post('/items/:id/stock/reserve', async (req, res) => {
  try {
    const { quantity, reason, reference, performedBy = 'System' } = req.body;
    
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    const success = item.reserveStock(quantity);
    if (!success) {
      return res.status(400).json({ 
        message: 'Insufficient stock available for reservation',
        available: item.stock.availableQuantity,
        requested: quantity
      });
    }
    
    await item.save();
    
    // Create stock transaction record
    await StockTransaction.create({
      inventoryItem: item._id,
      transactionType: 'reservation',
      quantity,
      stockBefore: item.stock.currentQuantity,
      stockAfter: item.stock.currentQuantity, // Same as current quantity doesn't change
      reference,
      referenceType: 'quotation',
      performedBy,
      reason
    });
    
    res.json({ 
      message: `Successfully reserved ${quantity} units`, 
      item: await item.populate('category')
    });
  } catch (error) {
    console.error('Error reserving stock:', error);
    res.status(500).json({ message: 'Error reserving stock', error: error.message });
  }
});

// Get stock transactions for an item
router.get('/items/:id/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      StockTransaction.find({ inventoryItem: req.params.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      StockTransaction.countDocuments({ inventoryItem: req.params.id })
    ]);
    
    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

// ===========================================
// LEGACY ROUTES FOR BACKWARDS COMPATIBILITY
// ===========================================

// Get all inventory items (legacy route)
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
        { description: { $regex: search, $options: 'i' } },
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

// Create new inventory item (legacy)
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
    
    // Create activity log
    try {
      await Activity.create({
        type: 'inventory_added',
        inventoryId: newItem._id,
        description: `Added inventory item: ${newItem.name}`,
        user: 'System',
        metadata: {
          name: newItem.name,
          category: newItem.category,
          quantity: newItem.quantity,
          unitPrice: newItem.unitPrice
        }
      });
    } catch (activityError) {
      console.warn('Failed to create activity log:', activityError);
    }
    
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

// Update inventory item (legacy)
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

// Delete inventory item (legacy)
router.delete('/:id', async (req, res) => {
  try {
    const deletedItem = await Inventory.findByIdAndDelete(req.params.id);
    
    if (!deletedItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    // Create activity log
    try {
      await Activity.create({
        type: 'inventory_deleted',
        description: `Deleted inventory item: ${deletedItem.name}`,
        entityId: deletedItem._id,
        entityType: 'Inventory',
        entityName: deletedItem.name,
        userId: 'System',
        metadata: {
          name: deletedItem.name,
          category: deletedItem.category
        }
      });
    } catch (activityError) {
      console.warn('Failed to create activity log:', activityError);
    }
    
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ message: 'Error deleting inventory item', error: error.message });
  }
});

// Bulk import
router.post('/bulk', async (req, res) => {
  try {
    const { items, replaceExisting = false } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items provided for import' });
    }
    
    const results = {
      imported: 0,
      updated: 0,
      errors: []
    };
    
    for (let i = 0; i < items.length; i++) {
      try {
        const itemData = items[i];
        
        // Validate required fields
        if (!itemData.name || !itemData.category) {
          results.errors.push({
            row: i + 1,
            error: 'Missing required fields: name and category'
          });
          continue;
        }
        
        // Check if item exists
        let existingItem = null;
        if (itemData.sku) {
          existingItem = await Inventory.findOne({ sku: itemData.sku });
        }
        
        if (existingItem && replaceExisting) {
          // Update existing item
          await Inventory.findByIdAndUpdate(existingItem._id, itemData);
          results.updated++;
        } else if (!existingItem) {
          // Create new item
          const newItem = new Inventory(itemData);
          await newItem.save();
          results.imported++;
        } else {
          results.errors.push({
            row: i + 1,
            error: 'Item with this SKU already exists'
          });
        }
      } catch (error) {
        results.errors.push({
          row: i + 1,
          error: error.message
        });
      }
    }
    
    res.json({
      message: `Import completed. ${results.imported} items imported, ${results.updated} items updated`,
      results
    });
  } catch (error) {
    console.error('❌ Error in bulk import:', error);
    res.status(500).json({ message: 'Server error during bulk import' });
  }
});

module.exports = router;