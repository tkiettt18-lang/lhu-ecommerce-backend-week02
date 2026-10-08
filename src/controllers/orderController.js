const Order = require('../models/Order');
const Product = require('../models/Product');
const sendOrderInvoice = require('../utils/sendEmail');

// [POST] /api/orders - Đặt hàng mới (Trừ tồn kho & In hóa đơn)
exports.createOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      paymentMethod,
      items,
      shippingFee,
      note,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng của bạn đang trống!',
      });
    }

    if (
      !customerName ||
      !customerPhone ||
      !customerEmail ||
      !shippingAddress
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Vui lòng điền đầy đủ: Họ tên, Số điện thoại, Email và Địa chỉ nhận hàng!',
      });
    }

    let subtotal = 0;
    const verifiedItems = [];

    // Duyệt qua từng món hàng, kiểm tra tồn kho và trừ kho
    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy sản phẩm có mã ID: ${item.productId}`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${product.name}" chỉ còn ${product.stock} món trong kho (bạn đặt ${item.quantity})!`,
        });
      }

      // Trừ tồn kho
      product.stock -= item.quantity;
      await product.save();

      subtotal += product.salePrice * item.quantity;

      verifiedItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.salePrice,
      });
    }

    const finalShippingFee =
      shippingFee !== undefined ? Number(shippingFee) : 25000;

    const totalAmount = subtotal + finalShippingFee;

    const orderCode = 'DH' + Date.now().toString().slice(-8);

    const order = await Order.create({
      orderCode,
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      items: verifiedItems,
      shippingFee: finalShippingFee,
      totalAmount,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: 'UNPAID',
      orderStatus: 'PENDING',
      note: note || '',
    });

    // In và gửi hóa đơn
    sendOrderInvoice(order);

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công!',
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// [GET] /api/orders - Lấy danh sách tất cả đơn hàng
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

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

// [GET] /api/orders/:id - Xem chi tiết đơn hàng
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng!',
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

// [PUT] /api/orders/:id/status - Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;

    const updateData = {};

    if (status) {
      updateData.orderStatus = status;
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng!',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};