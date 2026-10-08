require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

const PORT = process.env.PORT || 5000;

// Kết nối Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Hệ thống Quản lý Đơn hàng hoạt động ổn định!',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// 404 - Route không tồn tại
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Đường dẫn [${req.method}] ${req.originalUrl} không tồn tại!`,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(
    `🚀 Server Tuần 05 đang chạy tại: http://localhost:${PORT}`
  );
  console.log(
    `🛒 Test Đặt hàng: POST http://localhost:${PORT}/api/orders`
  );
  console.log(
    `📋 Test Danh sách đơn: GET http://localhost:${PORT}/api/orders`
  );
  console.log('====================================================');
});