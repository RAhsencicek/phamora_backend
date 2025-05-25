const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['offer', 'purchase', 'expiry', 'system', 'transaction'],
    default: 'system'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  data: {
    // İlgili verilere referans - transaction, inventory, medicine vs.
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine'
    },
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    },
    expiryDate: Date,
    price: Number,
    quantity: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Bildirimler için indeksler
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, type: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 