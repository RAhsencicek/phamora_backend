const { validationResult } = require('express-validator');
const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'phamora_secret_key';

exports.register = async (req, res) => {
  // Transaction başlat
  const session = await mongoose.startSession();
  session.startTransaction();

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
      location,
      pharmacyDetails
    } = req.body;

    // Eczane bilgilerinin varlığını kontrol et
    if (!pharmacyDetails || !pharmacyDetails.name || !pharmacyDetails.licenseNumber) {
      return res.status(400).json({
        message: 'Eczane bilgileri eksik. En azından isim ve ruhsat numarası gereklidir.'
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { pharmacistId }]
    }).session(session);

    if (existingUser) {
      return res.status(400).json({
        message: 'Bu e-posta veya eczacı kimlik numarası zaten kayıtlı.'
      });
    }

    // Eczane lisans numarası kontrolü
    const existingPharmacy = await Pharmacy.findOne({
      licenseNumber: pharmacyDetails.licenseNumber
    }).session(session);

    if (existingPharmacy) {
      return res.status(400).json({
        message: 'Bu lisans numarasına sahip bir eczane zaten kayıtlı.'
      });
    }

    // Kullanıcıyı oluştur
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

    // Kullanıcıyı geçici olarak kaydet (pharmacy alanı sonradan eklenecek)
    const savedUser = await user.save({ session });

    // Eczane oluştur
    const pharmacy = new Pharmacy({
      name: pharmacyDetails.name,
      owner: savedUser._id,
      address: pharmacyDetails.address || {
        street: address.street || '',
        city: address.city || '',
        district: address.district || '',
        postalCode: address.postalCode || ''
      },
      location: pharmacyDetails.location || location,
      phone: pharmacyDetails.phone || phone,
      email: pharmacyDetails.email || email,
      licenseNumber: pharmacyDetails.licenseNumber,
      description: pharmacyDetails.description || '',
      services: pharmacyDetails.services || [],
      workingHours: pharmacyDetails.workingHours || {}
    });

    // Eczaneyi kaydet
    const savedPharmacy = await pharmacy.save({ session });

    // Kullanıcıya eczane referansını ekle
    savedUser.pharmacy = savedPharmacy._id;
    await savedUser.save({ session });

    // İşlemi onayla
    await session.commitTransaction();
    session.endSession();

    // JWT token oluştur
    const token = jwt.sign({ id: savedUser._id }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'Kullanıcı ve eczane başarıyla oluşturuldu',
      token,
      user: {
        id: savedUser._id,
        pharmacistId: savedUser.pharmacistId,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        pharmacy: {
          id: savedPharmacy._id,
          name: savedPharmacy.name,
          licenseNumber: savedPharmacy.licenseNumber
        }
      }
    });
  } catch (error) {
    // Hata durumunda işlemi geri al
    await session.abortTransaction();
    session.endSession();

    console.error('Kayıt hatası:', error);
    
    if (error.code === 11000) {
      // MongoDB duplicate key hatası
      return res.status(400).json({ 
        message: 'Bu kimlik numarası, e-posta, telefon veya eczane lisans numarası zaten kayıtlı' 
      });
    }
    
    res.status(500).json({ message: 'Sunucu hatası oluştu', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pharmacistId, password } = req.body;

    const user = await User.findOne({ pharmacistId }).populate('pharmacy', 'name licenseNumber address phone email isOnDuty');
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

    // JWT token oluştur
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Giriş başarılı',
      token,
      user: {
        id: user._id,
        pharmacistId: user.pharmacistId,
        name: user.name,
        email: user.email,
        role: user.role,
        pharmacy: user.pharmacy ? {
          id: user.pharmacy._id,
          name: user.pharmacy.name,
          licenseNumber: user.pharmacy.licenseNumber,
          address: user.pharmacy.address,
          phone: user.pharmacy.phone,
          email: user.pharmacy.email,
          isOnDuty: user.pharmacy.isOnDuty
        } : null
      }
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası oluştu' });
  }
}; 