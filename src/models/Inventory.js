const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true
  },
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unitPrice: {
    currency: {
      type: String,
      default: 'TRY'
    },
    amount: {
      type: Number,
      required: true
    }
  },
  costPrice: {
    currency: {
      type: String,
      default: 'TRY'
    },
    amount: Number
  },
  batchNumber: String,
  expiryDate: {
    type: Date,
    required: true
  },
  minStockLevel: {
    type: Number,
    default: 10
  },
  maxStockLevel: {
    type: Number,
    default: 100
  },
  isAvailableForTrade: {
    type: Boolean,
    default: true
  },
  location: {
    shelf: String,
    section: String,
    notes: String
  },
  supplier: {
    name: String,
    contact: String
  },
  lastRestockDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'reserved', 'expired', 'out_of_stock'],
    default: 'in_stock'
  },
  notes: String,
  reservedQuantity: {
    type: Number,
    default: 0
  },
  availableQuantity: {
    type: Number,
    default: function() {
      return this.quantity - this.reservedQuantity;
    }
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  lowStockNotificationSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// İndeksler
inventorySchema.index({ pharmacy: 1, medicine: 1 }, { unique: true });
inventorySchema.index({ pharmacy: 1 });
inventorySchema.index({ medicine: 1 });
inventorySchema.index({ expiryDate: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ isAvailableForTrade: 1 });
inventorySchema.index({ quantity: 1 });

// Virtual field for availability status
inventorySchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.minStockLevel && this.quantity > 0;
});

inventorySchema.virtual('isOutOfStock').get(function() {
  return this.quantity === 0;
});

inventorySchema.virtual('isNearExpiry').get(function() {
  if (!this.expiryDate) return false;
  const today = new Date();
  const daysUntilExpiry = Math.ceil((this.expiryDate - today) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 30; // 30 gün içinde expires
});

// Middleware
inventorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Status'u otomatik güncelle
  if (this.quantity === 0) {
    this.status = 'out_of_stock';
  } else if (this.quantity <= this.minStockLevel) {
    this.status = 'low_stock';
  } else {
    this.status = 'in_stock';
  }
  
  // Expiry kontrolü
  if (this.expiryDate && this.expiryDate < new Date()) {
    this.status = 'expired';
  }
  
  // Available quantity'yi güncelle
  this.availableQuantity = this.quantity - this.reservedQuantity;
  
  next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory; 