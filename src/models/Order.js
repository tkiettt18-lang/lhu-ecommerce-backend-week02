
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // 1. Mã đơn hàng
    orderCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // 2. Thông tin người dùng
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // 3. Thông tin khách hàng
    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },

    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    shippingAddress: {
      type: String,
      required: true,
      trim: true,
    },

    // 4. Danh sách sản phẩm
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        name: {
          type: String,
          required: true,
        },

        image: {
          type: String,
          default: "",
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        price: {
          type: Number,
          required: true,
          min: 0,
        },

        unit: {
          type: String,
          default: "",
        },
      },
    ],

    // 5. Tiền hàng
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // 6. Quản lý tồn kho
    stockDeducted: {
      type: Boolean,
      default: false,
    },

    // 7. Phí vận chuyển
    shippingFee: {
      type: Number,
      default: 25000,
      min: 0,
    },

    // 8. Voucher
    voucherCode: {
      type: String,
      default: "",
      trim: true,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // 9. Tổng tiền
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // 10. Ghi chú
    note: {
      type: String,
      default: "",
      trim: true,
    },

    // 11. Phương thức thanh toán
    paymentMethod: {
      type: String,
      enum: ["COD", "VIETQR", "MOMO_QR"],
      default: "COD",
    },

    // 12. Trạng thái thanh toán
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID"],
      default: "UNPAID",
    },

    // 13. Trạng thái đơn hàng
    orderStatus: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPING",
        "DELIVERED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
