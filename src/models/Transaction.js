const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['sale', 'purchase', 'exchange', 'transfer'],
    required: true
  },
  seller: {
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  buyer: {
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  items: [{
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      currency: { type: String, default: 'TRY' },
      amount: { type: Number, required: true }
    },
    totalPrice: {
      currency: { type: String, default: 'TRY' },
      amount: { type: Number, required: true }
    },
    batchNumber: String,
    expiryDate: Date
  }],
  totalAmount: {
    currency: { type: String, default: 'TRY' },
    amount: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_transit', 'delivered', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'debit_card', 'crypto', 'trade_credit'],
    default: 'bank_transfer'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  deliveryInfo: {
    method: {
      type: String,
      enum: ['pickup', 'delivery', 'courier', 'mail'],
      default: 'pickup'
    },
    address: {
      street: String,
      city: String,
      district: String,
      postalCode: String,
      fullAddress: String
    },
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    trackingNumber: String,
    courierCompany: String,
    deliveryFee: {
      currency: { type: String, default: 'TRY' },
      amount: { type: Number, default: 0 }
    }
  },
  notes: String,
  sellerNotes: String,
  buyerNotes: String,
  cancellationReason: String,
  refundReason: String,
  rating: {
    sellerRating: { type: Number, min: 1, max: 5 },
    buyerRating: { type: Number, min: 1, max: 5 },
    sellerComment: String,
    buyerComment: String
  },
  documents: [{
    type: { type: String, enum: ['invoice', 'receipt', 'prescription', 'certificate', 'other'] },
    url: String,
    name: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  timeline: [{
    status: String,
    date: { type: Date, default: Date.now },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

// İndeksler
transactionSchema.index({ transactionId: 1 }, { unique: true });
transactionSchema.index({ 'seller.pharmacy': 1 });
transactionSchema.index({ 'buyer.pharmacy': 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ paymentStatus: 1 });

// Virtual fields
transactionSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

transactionSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

transactionSchema.virtual('canBeCancelled').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});

// Transaction ID generator
transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.transactionId = `TXN-${timestamp}-${random}`;
  }
  
  this.updatedAt = Date.now();
  
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Timeline'a status değişikliğini ekle
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      date: new Date(),
      note: `Status changed to ${this.status}`
    });
  }
  
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 