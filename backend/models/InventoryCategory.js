const mongoose = require('mongoose');

const inventoryCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['window_type', 'glass_type', 'frame_material', 'grille_pattern', 'color_option', 'hardware', 'accessory'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  specifications: {
    // Dynamic specifications based on category type
    properties: [{
      key: String,
      label: String,
      type: {
        type: String,
        enum: ['string', 'number', 'boolean', 'array']
      },
      options: [String], // For dropdown values
      unit: String // e.g., 'mm', 'degrees', 'kg'
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better search performance
inventoryCategorySchema.index({ name: 'text', type: 1 });

module.exports = mongoose.model('InventoryCategory', inventoryCategorySchema);