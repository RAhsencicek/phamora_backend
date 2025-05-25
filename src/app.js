const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Routes import
const authRoutes = require('./routes/authRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const fdaRoutes = require('./routes/fdaRoutes');
const adminRoutes = require('./routes/adminRoutes');
// Bildirim rotalarını ekle
const notificationRoutes = require('./routes/notificationRoutes');

// Scheduler import
const scheduler = require('./utils/scheduler');

// Environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phamora', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB bağlantısı başarılı');
  
  // Zamanlanmış görevleri başlat
  scheduler.startJobs();
})
.catch((err) => {
  console.error('MongoDB bağlantı hatası:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fda', fdaRoutes);
app.use('/api/admin', adminRoutes);
// Bildirim rotalarını ekle
app.use('/api/notifications', notificationRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Phamora API çalışıyor');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası',
    error: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});

// Manuel görev çalıştırma endpoint'i (sadece geliştirme amaçlı)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/run-jobs', async (req, res) => {
    try {
      const result = await scheduler.runJobsManually();
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Görevler çalıştırılırken hata oluştu',
        error: error.message
      });
    }
  });
}

module.exports = app; 