const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT sırrı - gerçek uygulama için .env'ye taşımalısınız
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

/**
 * Kullanıcının kimlik doğrulamasını zorunlu kılan middleware
 */
exports.requireAuth = async (req, res, next) => {
  try {
    // Token'ı headerdan al
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Yetkilendirme başarısız' });
    }

    const token = authHeader.split(' ')[1];

    // Token'ı doğrula
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Kullanıcıyı veritabanından bul
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
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
 * Token varsa kullanıcıyı doğrular, yoksa işlemi devam ettirir
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Token yoksa, giriş yapmamış kullanıcı olarak devam et
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    // Token doğrulama başarısız olsa bile, işlemi devam ettir
    next();
  }
}; 