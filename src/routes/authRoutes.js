const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    body('pharmacistId').notEmpty().withMessage('Eczacı kimlik numarası zorunludur'),
    body('name').notEmpty().withMessage('İsim zorunludur'),
    body('surname').notEmpty().withMessage('Soyisim zorunludur'),
    body('email').isEmail().withMessage('Geçerli bir e-posta adresi giriniz'),
    body('phone').notEmpty().withMessage('Telefon numarası zorunludur'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Şifre en az 6 karakter olmalıdır'),
    body('address').notEmpty().withMessage('Adres bilgileri zorunludur'),
    body('location').notEmpty().withMessage('Konum bilgileri zorunludur')
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Geçerli bir e-posta adresi giriniz'),
    body('password').notEmpty().withMessage('Şifre zorunludur')
  ],
  authController.login
);

module.exports = router; 