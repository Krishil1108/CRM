const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalValue: {
    type: Number,
    default: function() {
      return this.quantity * this.unitPrice;
    }
  },
  supplier: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'],
    default: 'In Stock'
  },
  reorderLevel: {
    type: Number,
    min: 0,
    default: 10
  },
  location: {
    type: String,
    trim: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Middleware to update totalValue before saving
inventorySchema.pre('save', function(next) {
  this.totalValue = this.quantity * this.unitPrice;
  this.lastUpdated = new Date();
  
  // Auto-update status based on quantity
  if (this.quantity === 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity <= this.reorderLevel) {
    this.status = 'Low Stock';
  } else if (this.status === 'Out of Stock' || this.status === 'Low Stock') {
    this.status = 'In Stock';
  }
  
  next();
});

// Index for better search performance
inventorySchema.index({ name: 'text', category: 'text', supplier: 'text' });

module.exports = mongoose.model('Inventory', inventorySchema);