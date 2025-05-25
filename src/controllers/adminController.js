const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const mongoose = require('mongoose');

// Tüm kullanıcıları getiren fonksiyon
exports.getAllUsers = async (req, res) => {
  try {
    // Tüm kullanıcıları getir
    const users = await User.find({})
      .select('-passwordHash -__v')
      .populate('pharmacy', 'name address location phone email');

    res.json(users);
  } catch (error) {
    console.error('Kullanıcıları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcılar alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Kullanıcıya eczane atayan fonksiyon
exports.assignPharmacyToUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, pharmacyId } = req.body;

    if (!userId || !pharmacyId) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID ve eczane ID gereklidir'
      });
    }

    // Kullanıcıyı kontrol et
    const user = await User.findById(userId).session(session);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Kullanıcının zaten bir eczanesi olup olmadığını kontrol et
    if (user.pharmacy) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcının zaten bir eczanesi var'
      });
    }

    // Eczaneyi kontrol et
    const pharmacy = await Pharmacy.findById(pharmacyId).session(session);
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Eczane bulunamadı'
      });
    }

    // Eczanenin zaten bir sahibi olup olmadığını kontrol et
    const existingOwner = await User.findOne({ pharmacy: pharmacyId }).session(session);
    if (existingOwner) {
      return res.status(400).json({
        success: false,
        message: 'Eczanenin zaten bir sahibi var'
      });
    }

    // Kullanıcıya eczane atama
    user.pharmacy = pharmacyId;
    await user.save({ session });

    // Eczane sahibini güncelleme
    pharmacy.owner = userId;
    await pharmacy.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: 'Kullanıcıya eczane başarıyla atandı',
      user: {
        id: user._id,
        name: user.name,
        surname: user.surname,
        pharmacy: pharmacyId
      },
      pharmacy: {
        id: pharmacy._id,
        name: pharmacy.name,
        owner: userId
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('Eczane atama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Eczane atama işlemi sırasında bir hata oluştu',
      error: error.message
    });
  }
};

// Kullanıcıdan eczane bağlantısını kaldıran fonksiyon
exports.removePharmacyFromUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId } = req.params;

    // Kullanıcıyı kontrol et
    const user = await User.findById(userId).session(session);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Kullanıcının bir eczanesi var mı kontrol et
    if (!user.pharmacy) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcının bir eczanesi yok'
      });
    }

    // Eczaneyi bul
    const pharmacy = await Pharmacy.findById(user.pharmacy).session(session);
    if (pharmacy) {
      // Eczanenin sahibini null yap
      pharmacy.owner = null;
      await pharmacy.save({ session });
    }

    // Kullanıcıdan eczane referansını kaldır
    user.pharmacy = null;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: 'Kullanıcı-eczane bağlantısı başarıyla kaldırıldı',
      user: {
        id: user._id,
        name: user.name,
        surname: user.surname
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('Eczane bağlantısı kaldırma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Eczane bağlantısı kaldırılırken bir hata oluştu',
      error: error.message
    });
  }
}; 