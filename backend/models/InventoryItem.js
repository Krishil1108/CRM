const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryCategory',
    required: true
  },
  categoryType: {
    type: String,
    enum: ['window_type', 'glass_type', 'frame_material', 'grille_pattern', 'color_option', 'hardware', 'accessory'],
    required: true
  },
  
  // Product Specifications
  specifications: {
    // Window Type specific
    windowType: {
      type: String,
      enum: ['sliding', 'casement', 'bay', 'double_hung', 'fixed', 'awning', 'picture', 'single_hung', 'pivot', 'metal', 'louvered', 'glass_block']
    },
    
    // Glass Type specific
    glassType: {
      type: String,
      enum: ['single', 'double', 'triple', 'laminated', 'tempered', 'low_e', 'tinted', 'reflective']
    },
    thickness: {
      type: Number, // in mm
      min: 3,
      max: 50
    },
    
    // Frame Material specific
    frameMaterial: {
      type: String,
      enum: ['aluminum', 'upvc', 'wooden', 'steel', 'composite', 'fiberglass']
    },
    finish: {
      type: String,
      enum: ['powder_coated', 'anodized', 'painted', 'natural', 'laminated']
    },
    
    // Grille Pattern specific
    grillePattern: {
      type: String,
      enum: ['colonial', 'prairie', 'diamond', 'georgian', 'custom_grid', 'between_glass', 'snap_in']
    },
    grilleWidth: {
      type: Number // in mm
    },
    
    // Color Options
    colorCode: {
      type: String,
      trim: true
    },
    colorFamily: {
      type: String,
      enum: ['white', 'black', 'brown', 'grey', 'bronze', 'silver', 'custom']
    },
    
    // Dimensional specifications
    dimensions: {
      width: {
        min: Number,
        max: Number,
        standard: Number,
        unit: {
          type: String,
          default: 'mm'
        }
      },
      height: {
        min: Number,
        max: Number,
        standard: Number,
        unit: {
          type: String,
          default: 'mm'
        }
      },
      depth: {
        min: Number,
        max: Number,
        standard: Number,
        unit: {
          type: String,
          default: 'mm'
        }
      }
    },
    
    // Performance characteristics
    performance: {
      thermalRating: Number,
      soundReduction: Number, // in dB
      waterResistance: Number,
      windResistance: Number,
      energyRating: {
        type: String,
        enum: ['A+', 'A', 'B', 'C', 'D', 'E']
      }
    },
    
    // Additional properties
    properties: [{
      key: String,
      value: mongoose.Schema.Types.Mixed,
      unit: String
    }]
  },
  
  // Inventory Management
  stock: {
    currentQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    reservedQuantity: {
      type: Number,
      min: 0,
      default: 0
    },
    availableQuantity: {
      type: Number,
      default: function() {
        return this.stock.currentQuantity - this.stock.reservedQuantity;
      }
    },
    reorderLevel: {
      type: Number,
      min: 0,
      default: 5
    },
    reorderQuantity: {
      type: Number,
      min: 1,
      default: 20
    }
  },
  
  // Pricing
  pricing: {
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    costPrice: {
      type: Number,
      min: 0
    },
    marginPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    bulkPricing: [{
      minQuantity: Number,
      unitPrice: Number,
      discountPercentage: Number
    }]
  },
  
  // Supply Chain
  supplier: {
    name: {
      type: String,
      trim: true
    },
    contactPerson: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    leadTime: {
      type: Number, // in days
      default: 7
    }
  },
  
  // Status and Tracking
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued', 'out_of_stock', 'low_stock'],
    default: 'active'
  },
  
  // Location in warehouse
  location: {
    warehouse: {
      type: String,
      trim: true
    },
    section: {
      type: String,
      trim: true
    },
    row: {
      type: String,
      trim: true
    },
    shelf: {
      type: String,
      trim: true
    }
  },
  
  // Additional metadata
  description: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  images: [String],
  technicalDataSheet: String,
  warranty: {
    period: Number, // in months
    terms: String
  }
}, {
  timestamps: true
});

// Pre-save middleware to update status and calculations
inventoryItemSchema.pre('save', function(next) {
  // Calculate available quantity
  this.stock.availableQuantity = this.stock.currentQuantity - this.stock.reservedQuantity;
  
  // Auto-update status based on stock levels
  if (this.stock.currentQuantity === 0) {
    this.status = 'out_of_stock';
  } else if (this.stock.currentQuantity <= this.stock.reorderLevel) {
    this.status = 'low_stock';
  } else if (this.status === 'out_of_stock' || this.status === 'low_stock') {
    this.status = 'active';
  }
  
  // Calculate margin percentage if cost price is provided
  if (this.pricing.costPrice && this.pricing.unitPrice > this.pricing.costPrice) {
    this.pricing.marginPercentage = ((this.pricing.unitPrice - this.pricing.costPrice) / this.pricing.costPrice * 100).toFixed(2);
  }
  
  next();
});

// Indexes for better search performance
inventoryItemSchema.index({ name: 'text', sku: 'text', 'supplier.name': 'text' });
inventoryItemSchema.index({ category: 1, categoryType: 1 });
inventoryItemSchema.index({ 'specifications.windowType': 1 });
inventoryItemSchema.index({ 'specifications.glassType': 1 });
inventoryItemSchema.index({ 'specifications.frameMaterial': 1 });
inventoryItemSchema.index({ status: 1 });
inventoryItemSchema.index({ 'stock.currentQuantity': 1 });

// Virtual for total value
inventoryItemSchema.virtual('totalValue').get(function() {
  return Math.round((this.stock.currentQuantity * this.pricing.unitPrice) * 100) / 100;
});

// Method to reserve stock
inventoryItemSchema.methods.reserveStock = function(quantity) {
  if (this.stock.availableQuantity >= quantity) {
    this.stock.reservedQuantity += quantity;
    return true;
  }
  return false;
};

// Method to release reserved stock
inventoryItemSchema.methods.releaseReservedStock = function(quantity) {
  const releaseQuantity = Math.min(quantity, this.stock.reservedQuantity);
  this.stock.reservedQuantity -= releaseQuantity;
  return releaseQuantity;
};

// Method to consume stock (for quotations/sales)
inventoryItemSchema.methods.consumeStock = function(quantity) {
  const consumeQuantity = Math.min(quantity, this.stock.availableQuantity);
  this.stock.currentQuantity -= consumeQuantity;
  return consumeQuantity;
};

// Method to add stock
inventoryItemSchema.methods.addStock = function(quantity, notes = '') {
  this.stock.currentQuantity += quantity;
  this.notes = notes ? (this.notes ? this.notes + '\n' + notes : notes) : this.notes;
  return this.stock.currentQuantity;
};

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);