const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, changePassword, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['freelancer', 'client']).withMessage('Role must be freelancer or client'),
];

router.post('/register', registerRules, register);
router.post('/login',    login);
router.get( '/me',       protect, getMe);
router.put( '/change-password', protect, changePassword);
router.post('/logout',   protect, logout);

module.exports = router;
