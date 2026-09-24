const express = require('express');

const {
  register,
  login,
  getMe
} = require('../controllers/authController');

const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Đăng ký tài khoản
router.post('/register', register);

// Đăng nhập
router.post('/login', login);

// Lấy thông tin tài khoản hiện tại
router.get('/me', protect, getMe);

module.exports = router;