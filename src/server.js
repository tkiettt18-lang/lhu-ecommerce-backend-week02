require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import các Routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Kết nối MongoDB Atlas
connectDB();

// 2. Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Hệ thống Auth & Phân quyền hoạt động ổn định!'
  });
});

// 4. Định tuyến API
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);

// 5. Bắt lỗi 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Đường dẫn [${req.method}] ${req.originalUrl} không tồn tại!`
  });
});

// 6. Khởi chạy Server
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Server Tuần 04 đang chạy tại: http://localhost:${PORT}`);
  console.log(`🔑 Test Đăng nhập: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`📦 Test Sản phẩm: GET http://localhost:${PORT}/api/products`);
  console.log('====================================================');
});