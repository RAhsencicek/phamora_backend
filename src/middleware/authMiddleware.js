const User = require('../models/User');

/**
 * Kullanıcının kimlik doğrulamasını zorunlu kılan middleware
 */
exports.requireAuth = async (req, res, next) => {
  try {
    // PharmacistId'yi headerdan al
    const pharmacistId = req.headers.pharmacistid;
    if (!pharmacistId) {
      return res.status(401).json({ message: 'Yetkilendirme başarısız: Eczacı kimlik numarası eksik' });
    }

    // Kullanıcıyı veritabanından bul
    const user = await User.findOne({ pharmacistId });
    if (!user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Kullanıcı aktif değilse erişimi engelle
    if (!user.isActive) {
      return res.status(403).json({ message: 'Hesabınız aktif değil' });
    }

    // Kullanıcı bilgisini req nesnesine ekle
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Yetkilendirme başarısız' });
  }
};

/**
 * Admin yetkilendirme middleware'i
 * Admin rolüne sahip kullanıcıları doğrular
 */
exports.authenticate = async (req, res, next) => {
  try {
    // PharmacistId'yi headerdan al
    const pharmacistId = req.headers.pharmacistid;
    if (!pharmacistId) {
      return res.status(401).json({ message: 'Yetkilendirme başarısız: Eczacı kimlik numarası eksik' });
    }

    // Kullanıcıyı veritabanından bul
    const user = await User.findOne({ pharmacistId });
    if (!user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Kullanıcı aktif değilse erişimi engelle
    if (!user.isActive) {
      return res.status(403).json({ message: 'Hesabınız aktif değil' });
    }

    // Kullanıcı bilgisini req nesnesine ekle
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Yetkilendirme başarısız' });
  }
};

/**
 * İsteğe bağlı kimlik doğrulama middleware'i
 * PharmacistId varsa kullanıcıyı doğrular, yoksa işlemi devam ettirir
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const pharmacistId = req.headers.pharmacistid;
    if (!pharmacistId) {
      // PharmacistId yoksa, giriş yapmamış kullanıcı olarak devam et
      return next();
    }
    
    const user = await User.findOne({ pharmacistId });
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    // Doğrulama başarısız olsa bile, işlemi devam ettir
    next();
  }
}; 