const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');

const JWT_SECRET = process.env.JWT_SECRET || 'gizli_anahtar_buraya_gelecek';

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      pharmacistId,
      name,
      surname,
      email,
      phone,
      password,
      address,
      location
    } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { pharmacistId }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Bu e-posta veya eczacı kimlik numarası zaten kayıtlı.'
      });
    }

    const user = new User({
      pharmacistId,
      name,
      surname,
      email,
      phone,
      passwordHash: password,
      address,
      location,
      role: 'pharmacist'
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      token,
      user: {
        id: user._id,
        pharmacistId: user.pharmacistId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası oluştu' });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Kullanıcıyı pharmacy ile birlikte getir
    const user = await User.findOne({ email }).populate('pharmacy');
    if (!user) {
      return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Hesabınız aktif değil' });
    }

    // JWT token'a pharmacy bilgisi de ekle
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        pharmacyId: user.pharmacy?._id 
      },
      JWT_SECRET,
      { expiresIn: '30d' } // 30 güne çıkarıldı
    );

    // Response hazırla
    const response = {
      message: 'Giriş başarılı',
      token,
      user: {
        id: user._id,
        pharmacistId: user.pharmacistId,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        pharmacyId: user.pharmacy?._id || null,
        pharmacyName: user.pharmacy?.name || null
      }
    };

    // Pharmacy bilgisi varsa ekle
    if (user.pharmacy) {
      response.pharmacy = {
        _id: user.pharmacy._id,
        name: user.pharmacy.name,
        address: user.pharmacy.address,
        phone: user.pharmacy.phone,
        email: user.pharmacy.email,
        licenseNumber: user.pharmacy.licenseNumber,
        isActive: user.pharmacy.isActive,
        location: user.pharmacy.location,
        rating: user.pharmacy.rating,
        description: user.pharmacy.description,
        services: user.pharmacy.services,
        createdAt: user.pharmacy.createdAt,
        updatedAt: user.pharmacy.updatedAt
      };
    } else {
      response.pharmacy = null;
      // Uyarı mesajı ekle
      response.warning = 'Kullanıcıya ait eczane bilgisi bulunamadı';
    }

    res.json(response);
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası oluştu' });
  }
}; 