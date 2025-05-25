const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Kullanıcı girişi
router.post('/login', async (req, res) => {
    try {
        const { pharmacistId, password } = req.body;
        
        if (!pharmacistId || !password) {
            return res.status(400).json({ message: 'Eczacı ID ve şifre gereklidir' });
        }
        
        // Demo için kullanıcıyı bul (gerçek bir uygulamada şifre hashlenip kontrol edilmelidir)
        const user = await User.findOne({ pharmacistId }).populate('pharmacy');
        
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }
        
        // Bu basit bir demo, gerçek bir uygulamada şifre doğrulaması güvenli bir şekilde yapılmalıdır
        // Bu yöntem sadece test amaçlıdır!
        if (password !== '123123') {
            return res.status(401).json({ message: 'Hatalı şifre' });
        }
        
        // Şifre bilgisini çıkararak kullanıcı verisini gönder
        const userToSend = user.toObject();
        delete userToSend.passwordHash;
        
        res.json(userToSend);
    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
});

module.exports = router; 