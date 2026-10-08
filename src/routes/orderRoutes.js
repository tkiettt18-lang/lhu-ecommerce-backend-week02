const express = require('express');

const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController');

// [POST] /api/orders - Đặt hàng mới
router.post('/', createOrder);

// [GET] /api/orders - Lấy danh sách đơn hàng
router.get('/', getOrders);

// [GET] /api/orders/:id - Xem chi tiết đơn hàng
router.get('/:id', getOrderById);

// [PUT] /api/orders/:id/status - Cập nhật trạng thái đơn hàng
router.put('/:id/status', updateOrderStatus);

module.exports = router;