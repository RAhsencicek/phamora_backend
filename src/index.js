const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const fdaRoutes = require('./routes/fdaRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Bağlantısı
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Cluster53739:1910@cluster53739.lsf3k.mongodb.net/test';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/fda', fdaRoutes);

// Sağlık kontrolü endpoint'i
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sunucu çalışıyor' });
});

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Bir şeyler ters gitti!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
}); 