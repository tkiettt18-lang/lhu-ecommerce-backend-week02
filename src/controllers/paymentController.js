
const Order = require('../models/Order');

// [POST] /api/payment/create-qr
// Tạo mã QR thanh toán VietQR hoặc MoMo
exports.createPaymentQR = async (req, res) => {
    try {
        const { orderId, paymentMethod } = req.body;

        // 1. Kiểm tra dữ liệu đầu vào
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã đơn hàng!'
            });
        }

        const method = paymentMethod || 'VIETQR';

        if (!['VIETQR', 'MOMO_QR'].includes(method)) {
            return res.status(400).json({
                success: false,
                message: 'Phương thức thanh toán không hợp lệ!'
            });
        }

        // 2. Tìm đơn hàng
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng!'
            });
        }

        if (order.paymentStatus === 'PAID') {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng đã được thanh toán!'
            });
        }

        const totalAmount = order.totalAmount;
        const orderCode = order.orderCode;

        let qrUrl = '';

        // 3. Tạo VietQR
        if (method === 'VIETQR') {
            const bankId = process.env.BANK_ID;
            const accountNo = process.env.BANK_ACCOUNT_NO;
            const accountName = encodeURIComponent(
                process.env.BANK_ACCOUNT_NAME || ''
            );

            if (!bankId || !accountNo) {
                return res.status(500).json({
                    success: false,
                    message: 'Chưa cấu hình tài khoản ngân hàng trong .env!'
                });
            }

            const addInfo = encodeURIComponent(`DH ${orderCode}`);

            qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${totalAmount}&addInfo=${addInfo}&accountName=${accountName}`;
        }

        // 4. Tạo MoMo QR
        if (method === 'MOMO_QR') {
            const momoPhone = process.env.MOMO_PHONE;

            if (!momoPhone) {
                return res.status(500).json({
                    success: false,
                    message: 'Chưa cấu hình số điện thoại MoMo!'
                });
            }

            const momoName = encodeURIComponent('LHU STORE');

            const momoData = encodeURIComponent(
                `2|99|${momoPhone}|${momoName}||0|0|${totalAmount}|DH ${orderCode}|transfer_myqr`
            );

            qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${momoData}`;
        }

        // 5. Lưu phương thức thanh toán
        order.paymentMethod = method;
        await order.save();

        // 6. Trả kết quả
        res.status(200).json({
            success: true,
            message: 'Tạo mã thanh toán QR thành công!',
            data: {
                orderId: order._id,
                orderCode: order.orderCode,
                totalAmount,
                paymentMethod: method,
                qrUrl,
                transferNote: `DH ${orderCode}`
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// [POST] /api/payment/confirm-paid
// Xác nhận thanh toán
exports.confirmPayment = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã đơn hàng!'
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng!'
            });
        }

        order.paymentStatus = 'PAID';
        order.orderStatus = 'CONFIRMED';

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Xác nhận thanh toán thành công!',
            data: order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

