const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware kiểm tra Token
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message:
        'Bạn chưa đăng nhập! Vui lòng gửi kèm mã Token (Bearer Token).'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('-password');

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Mã Token không hợp lệ hoặc đã hết hạn!'
    });
  }
};

// Middleware phân quyền Admin
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message:
        'Quyền truy cập bị từ chối! Chức năng này chỉ dành cho Quản trị viên (Admin).'
    });
  }
};