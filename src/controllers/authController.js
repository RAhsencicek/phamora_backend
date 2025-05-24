const { validationResult } = require('express-validator');
const User = require('../models/User');

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

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
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

    const { pharmacistId, password } = req.body;

    const user = await User.findOne({ pharmacistId });
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

    res.json({
      message: 'Giriş başarılı',
      user: {
        id: user._id,
        pharmacistId: user.pharmacistId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası oluştu' });
  }
}; 