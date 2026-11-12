
const express = require("express");
const router = express.Router();

const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} = require("../controllers/orderController");

// Lấy danh sách đơn hàng
router.get("/", getOrders);

// Tạo đơn hàng
router.post("/", createOrder);

// Lấy chi tiết đơn hàng
router.get("/:id", getOrderById);

// Cập nhật trạng thái
router.put("/:id/status", updateOrderStatus);

module.exports = router;
