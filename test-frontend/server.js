const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Routes
const usersRoutes = require('./routes/users');
const pharmaciesRoutes = require('./routes/pharmacies');
const authRoutes = require('./routes/auth');

app.use('/api/admin/users', usersRoutes);
app.use('/api/pharmacies', pharmaciesRoutes);
app.use('/api/auth', authRoutes);

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Cluster53739:1910@cluster53739.lsf3k.mongodb.net/pharmora';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('MongoDB\'ye bağlandı');
    })
    .catch(err => {
        console.error('MongoDB bağlantı hatası:', err);
    });

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Hata yakalama middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
}); 