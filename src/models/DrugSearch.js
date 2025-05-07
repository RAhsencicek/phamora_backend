const mongoose = require('mongoose');

const DrugSearchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  query: {
    type: String,
    required: true
  },
  resultCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// İndeksleme için
DrugSearchSchema.index({ userId: 1, createdAt: -1 });
DrugSearchSchema.index({ query: 1 });

const DrugSearch = mongoose.model('DrugSearch', DrugSearchSchema);

module.exports = DrugSearch; 