const nodemailer = require('nodemailer');

const sendOrderInvoice = async (order) => {
  // 1. Luôn in hóa đơn ASCII ra màn hình Terminal
  // để test offline không bị lỗi
  console.log(
    '\n============================================================='
  );
  console.log(' 🧾 HÓA ĐƠN ĐẶT HÀNG - LHU E-COMMERCE ');
  console.log(
    '============================================================='
  );

  console.log(`Mã đơn hàng: #${order.orderCode}`);
  console.log(
    `Khách hàng: ${order.customerName} | SĐT: ${order.customerPhone}`
  );
  console.log(`Email: ${order.customerEmail}`);
  console.log(`Địa chỉ nhận: ${order.shippingAddress}`);
  console.log(
    `Thanh toán: ${order.paymentMethod} (${order.paymentStatus})`
  );

  console.log(
    '-------------------------------------------------------------'
  );
  console.log('CHI TIẾT MẶT HÀNG:');

  order.items.forEach((item, idx) => {
    console.log(
      ` ${idx + 1}. ${item.name} x ${item.quantity} = ${
        (item.price * item.quantity).toLocaleString('vi-VN')
      } đ`
    );
  });

  console.log(
    '-------------------------------------------------------------'
  );

  console.log(
    `Phí vận chuyển: ${order.shippingFee.toLocaleString('vi-VN')} đ`
  );

  console.log(
    `TỔNG CỘNG: ${order.totalAmount.toLocaleString('vi-VN')} đ`
  );

  console.log(
    '=============================================================\n'
  );

  // 2. Gửi Email thật nếu cấu hình biến môi trường
  if (
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_USER !== 'your_email@gmail.com'
  ) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"LHU E-Commerce Store" <${process.env.EMAIL_USER}>`,
        to: order.customerEmail,
        subject: `[Xác Nhận Đơn Hàng #${order.orderCode}] Cảm ơn bạn đã mua sắm!`,

        html: `
          <h2>Đơn hàng #${order.orderCode} đã đặt thành công!</h2>

          <p>
            <strong>Tổng thanh toán:</strong>
            ${order.totalAmount.toLocaleString('vi-VN')} đ
          </p>
        `,
      });

      console.log(
        `📧 [Nodemailer] Đã gửi email hóa đơn thành công tới: ${order.customerEmail}`
      );
    } catch (err) {
      console.warn(
        `⚠️ [Nodemailer] Không thể gửi email: ${err.message}`
      );
    }
  }
};

module.exports = sendOrderInvoice;