const mongoose = require('mongoose');

const windowSpecSchema = new mongoose.Schema({
  id: String,
  name: String,
  location: String,
  type: String,
  dimensions: {
    width: Number,
    height: Number
  },
  specifications: {
    glass: String,
    glassTint: String,
    glassThickness: Number,
    frame: {
      material: String,
      color: String
    },
    frameMaterial: String,
    frameColor: String,
    lockPosition: String,
    openingType: String,
    hardware: String,
    panels: Number,
    tracks: Number,
    screenIncluded: Boolean,
    motorized: Boolean,
    security: String,
    grille: {
      enabled: Boolean,
      style: String,
      pattern: String
    },
    grillColor: String
  },
  pricing: {
    sqFtPrice: Number,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number
  }
});

const quoteSchema = new mongoose.Schema({
  quotationNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected', 'archived'],
    default: 'draft'
  },
  clientInfo: {
    name: {
      type: String,
      required: true
    },
    address: String,
    city: String,
    phone: String,
    email: String
  },
  companyDetails: {
    name: String,
    address: String,
    phone: String,
    email: String,
    website: String,
    gstin: String
  },
  windowSpecs: [windowSpecSchema],
  selectedWindowType: String,
  slidingConfig: {
    panels: Number,
    combination: String
  },
  bayConfig: {
    windows: Number,
    angle: Number,
    fixedSides: Boolean
  },
  casementConfig: {
    openingType: String,
    panels: Number
  },
  awningConfig: {
    size: String,
    orientation: String
  },
  pricing: {
    subtotal: Number,
    tax: Number,
    discount: Number,
    total: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  notes: String,
  createdBy: {
    type: String,
    required: true,
    default: 'System User'
  },
  lastModifiedBy: String,
  lastModifiedDate: {
    type: Date,
    default: Date.now
  },
  submittedDate: Date,
  pdfGenerated: {
    type: Boolean,
    default: false
  },
  pdfPath: String
}, {
  timestamps: true
});

// Indexes for efficient querying
quoteSchema.index({ quotationNumber: 1 });
quoteSchema.index({ 'clientInfo.name': 1 });
quoteSchema.index({ status: 1 });
quoteSchema.index({ date: -1 });
quoteSchema.index({ createdAt: -1 });

// Pre-save middleware to update lastModifiedDate
quoteSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModifiedDate = new Date();
  }
  next();
});

// Virtual for total calculation
quoteSchema.virtual('calculatedTotal').get(function() {
  if (this.windowSpecs && this.windowSpecs.length > 0) {
    return this.windowSpecs.reduce((total, spec) => {
      return total + (spec.pricing?.totalPrice || 0);
    }, 0);
  }
  return this.pricing?.total || 0;
});

// Method to update status
quoteSchema.methods.updateStatus = function(newStatus, userId) {
  this.status = newStatus;
  this.lastModifiedBy = userId;
  this.lastModifiedDate = new Date();
  
  if (newStatus === 'submitted' && !this.submittedDate) {
    this.submittedDate = new Date();
  }
  
  return this.save();
};

// Static method to find quotes by client
quoteSchema.statics.findByClient = function(clientName) {
  return this.find({ 'clientInfo.name': new RegExp(clientName, 'i') });
};

// Static method to find quotes by status
quoteSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

// Static method to get quotes summary
quoteSchema.statics.getSummary = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$pricing.total' }
      }
    }
  ]);
};

module.exports = mongoose.model('Quote', quoteSchema);