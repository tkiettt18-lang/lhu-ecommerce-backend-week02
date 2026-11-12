
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { sendOrderConfirmationEmail } = require("../services/emailService");

// 1. Lấy danh sách đơn hàng
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("items.productId", "name image salePrice stock");

    res.status(200).json({
      success: true,
      total: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Lấy chi tiết đơn hàng
exports.getOrderById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID đơn hàng không hợp lệ",
      });
    }

    const order = await Order.findById(req.params.id)
      .populate("items.productId", "name image salePrice stock");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Tạo đơn hàng
exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      items,
      shippingFee = 25000,
      voucherCode = "",
      discountAmount = 0,
      note = "",
      paymentMethod = "COD",
    } = req.body;

    // Kiểm tra thông tin khách hàng
    if (
      !customerName?.trim() ||
      !customerPhone?.trim() ||
      !shippingAddress?.trim() ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin đơn hàng",
      });
    }

    if (!["COD", "VIETQR", "MOMO_QR"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Phương thức thanh toán không hợp lệ",
      });
    }

    if (
      !Number.isFinite(Number(shippingFee)) ||
      Number(shippingFee) < 0 ||
      !Number.isFinite(Number(discountAmount)) ||
      Number(discountAmount) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Phí vận chuyển hoặc giảm giá không hợp lệ",
      });
    }

    // Gộp sản phẩm trùng ID
    const quantities = new Map();

    for (const item of items) {
      const productId = String(
        item.productId || item.product || ""
      );

      const quantity = Number(item.quantity);

      if (
        !mongoose.isValidObjectId(productId) ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Sản phẩm hoặc số lượng không hợp lệ",
        });
      }

      quantities.set(
        productId,
        (quantities.get(productId) || 0) + quantity
      );
    }

    let newOrder;

    await session.withTransaction(async () => {
      const orderItems = [];
      let subtotal = 0;

      // Kiểm tra và trừ tồn kho
      for (const [productId, quantity] of quantities) {
        const product = await Product.findOneAndUpdate(
          {
            _id: productId,
            stock: { $gte: quantity },
          },
          {
            $inc: { stock: -quantity },
          },
          {
            new: true,
            session,
          }
        );

        if (!product) {
          throw new Error(
            `Sản phẩm ${productId} không tồn tại hoặc không đủ tồn kho`
          );
        }

        orderItems.push({
          productId: product._id,
          name: product.name,
          image: product.image,
          quantity,
          price: product.salePrice,
          unit: "",
        });

        subtotal += product.salePrice * quantity;
      }

      const discount = Number(discountAmount);
      const shipping = Number(shippingFee);

      if (discount > subtotal) {
        throw new Error("Số tiền giảm giá không được vượt quá tiền hàng");
      }

      const totalAmount = subtotal - discount + shipping;

      const orderCode = `DH${Date.now()}`;

      const createdOrders = await Order.create(
        [
          {
            orderCode,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : "",
            shippingAddress: shippingAddress.trim(),
            items: orderItems,
            subtotal,
            shippingFee: shipping,
            voucherCode,
            discountAmount: discount,
            totalAmount,
            note,
            paymentMethod,
            paymentStatus: "UNPAID",
            orderStatus: "PENDING",
            stockDeducted: true,
          },
        ],
        { session }
      );

      newOrder = createdOrders[0];
    });

    const populatedOrder = await Order.findById(newOrder._id)
      .populate("items.productId", "name image salePrice");

    const emailNotification = await sendOrderConfirmationEmail(populatedOrder);

    res.status(201).json({
      success: true,
      message: "Tạo đơn hàng thành công",
      data: populatedOrder,
      emailNotification,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    await session.endSession();
  }
};

// 4. Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { orderStatus } = req.body;

    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPING",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái đơn hàng không hợp lệ",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID đơn hàng không hợp lệ",
      });
    }

    let updatedOrder;

    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);

      if (!order) {
        throw new Error("Không tìm thấy đơn hàng");
      }

      // Không cho phép thay đổi đơn đã hủy
      if (
        order.orderStatus === "CANCELLED" &&
        orderStatus !== "CANCELLED"
      ) {
        throw new Error("Không thể thay đổi trạng thái đơn hàng đã hủy");
      }

      // Không cho hủy đơn đã giao hoặc hoàn tất
      if (
        orderStatus === "CANCELLED" &&
        ["DELIVERED", "COMPLETED"].includes(order.orderStatus)
      ) {
        throw new Error("Không thể hủy đơn hàng đã hoàn tất");
      }

      // Chỉ hoàn kho khi đơn thực sự đã trừ kho
      if (
        orderStatus === "CANCELLED" &&
        order.orderStatus !== "CANCELLED" &&
        order.stockDeducted
      ) {
        for (const item of order.items) {
          const productId = item.productId;

          const restoredProduct = await Product.findByIdAndUpdate(
            productId,
            {
              $inc: { stock: item.quantity },
            },
            {
              new: true,
              session,
            }
          );

          if (!restoredProduct) {
            throw new Error(
              `Không tìm thấy sản phẩm ${productId} để hoàn kho`
            );
          }
        }

        order.stockDeducted = false;
      }

      order.orderStatus = orderStatus;

      await order.save({ session });

      updatedOrder = order;
    });

    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate("items.productId", "name image salePrice");

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: populatedOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    await session.endSession();
  }
};
