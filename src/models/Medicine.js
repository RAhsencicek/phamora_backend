const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  barcode: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  genericName: String,
  manufacturer: {
    type: String,
    required: true
  },
  activeIngredients: [{
    name: String,
    strength: String,
    unit: String
  }],
  dosageForm: {
    type: String,
    required: true,
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'patch', 'suppository', 'other']
  },
  strength: String,
  packageSize: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['piece', 'ml', 'mg', 'g', 'box', 'tube', 'bottle']
  },
  description: String,
  indications: [String], // Ne için kullanılır
  contraindications: [String], // Kullanılmaması gereken durumlar
  sideEffects: [String], // Yan etkiler
  dosage: String, // Kullanım dozu
  storageConditions: String,
  prescriptionRequired: {
    type: Boolean,
    default: true
  },
  atcCode: String, // Anatomical Therapeutic Chemical kod
  price: {
    currency: {
      type: String,
      default: 'TRY'
    },
    amount: Number
  },
  categories: [String],
  images: [String],
  approvalDate: Date,
  expiryWarning: {
    type: Number,
    default: 30 // Kaç gün kala uyarı versin
  },
  isActive: {
    type: Boolean,
    default: true
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
medicineSchema.index({ barcode: 1 }, { unique: true });
medicineSchema.index({ name: 'text', genericName: 'text', manufacturer: 'text' });
medicineSchema.index({ 'activeIngredients.name': 1 });
medicineSchema.index({ categories: 1 });
medicineSchema.index({ dosageForm: 1 });

// Middleware
medicineSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = Medicine; 