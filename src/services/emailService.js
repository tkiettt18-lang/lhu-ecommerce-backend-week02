const nodemailer = require("nodemailer");

const PAYMENT_METHOD_LABELS = {
  COD: "Thanh toán tiền mặt khi nhận hàng (COD)",
  VIETQR: "Chuyển khoản Ngân hàng (VietQR)",
  MOMO_QR: "Ví điện tử MoMo (QR)",
};

const ORDER_STATUS_LABELS = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPING: "Đang giao hàng",
  DELIVERED: "Đã giao hàng",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

const formatCurrency = (amount) => `${Number(amount || 0).toLocaleString("vi-VN")} đ`;

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

let cachedTransporter = { key: null, transporter: null };

/**
 * Tạo Nodemailer transporter từ biến môi trường (.env).
 * Hỗ trợ Gmail (EMAIL_USER + EMAIL_PASS) hoặc custom SMTP (SMTP_HOST/PORT/USER/PASS).
 */
const getTransporter = () => {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER)?.trim();
  const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS)?.replace(/\s+/g, "");

  if (!user || !pass) {
    return null;
  }

  const cacheKey = `${smtpHost || "gmail"}|${smtpPort}|${smtpSecure}|${user}|${pass}`;
  if (cachedTransporter.transporter && cachedTransporter.key === cacheKey) {
    return cachedTransporter.transporter;
  }

  const transportOptions = smtpHost
    ? {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: { user, pass },
      }
    : {
        service: "gmail",
        auth: { user, pass },
      };

  const transporter = nodemailer.createTransport({
    ...transportOptions,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });

  cachedTransporter = { key: cacheKey, transporter };
  return transporter;
};

/**
 * Tạo nội dung HTML và text thuần cho email xác nhận đơn hàng.
 */
const buildOrderEmailContent = (order) => {
  const items = Array.isArray(order.items) ? order.items : [];
  const paymentLabel = PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod;
  const statusLabel = ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus;
  const createdAt = order.createdAt
    ? new Date(order.createdAt).toLocaleString("vi-VN")
    : new Date().toLocaleString("vi-VN");

  const itemRowsHtml = items
    .map((item, idx) => {
      const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;">${idx + 1}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.name)}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;">${Number(item.quantity)}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatCurrency(item.price)}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${formatCurrency(lineTotal)}</td>
        </tr>
      `;
    })
    .join("");

  const itemLinesText = items
    .map((item, idx) => {
      const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
      return `${idx + 1}. ${item.name} x${item.quantity} - ${formatCurrency(item.price)} = ${formatCurrency(lineTotal)}`;
    })
    .join("\n");

  const discountRowHtml =
    Number(order.discountAmount) > 0
      ? `<tr><td style="padding:6px 0;color:#16a34a;">Giảm giá${order.voucherCode ? ` (${escapeHtml(order.voucherCode)})` : ""}:</td><td style="padding:6px 0;text-align:right;color:#16a34a;">-${formatCurrency(order.discountAmount)}</td></tr>`
      : "";

  const noteHtml = order.note
    ? `<p style="margin:6px 0;"><strong>Ghi chú:</strong> ${escapeHtml(order.note)}</p>`
    : "";

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;background:#f8fafc;padding:24px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#ffffff;padding:20px 24px;">
        <h2 style="margin:0;font-size:20px;">🛒 LHU E-Commerce Store</h2>
        <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Xác nhận đặt hàng thành công</p>
      </div>

      <div style="padding:24px;">
        <p style="margin-top:0;">Xin chào <strong>${escapeHtml(order.customerName)}</strong>,</p>
        <p>Cảm ơn bạn đã đặt hàng tại <strong>LHU Store</strong>! Dưới đây là thông tin chi tiết đơn hàng của bạn:</p>

        <div style="background:#f1f5f9;border-radius:8px;padding:14px 16px;margin:16px 0;font-size:14px;">
          <p style="margin:4px 0;"><strong>Mã đơn hàng:</strong> #${escapeHtml(order.orderCode)}</p>
          <p style="margin:4px 0;"><strong>Thời gian đặt:</strong> ${escapeHtml(createdAt)}</p>
          <p style="margin:4px 0;"><strong>Trạng thái:</strong> ${escapeHtml(statusLabel)}</p>
          <p style="margin:4px 0;"><strong>Thanh toán:</strong> ${escapeHtml(paymentLabel)} (${order.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"})</p>
        </div>

        <div style="margin:16px 0;font-size:14px;">
          <h3 style="margin:0 0 8px;font-size:15px;color:#1e293b;">📍 Thông tin người nhận</h3>
          <p style="margin:4px 0;"><strong>Họ tên:</strong> ${escapeHtml(order.customerName)}</p>
          <p style="margin:4px 0;"><strong>Số điện thoại:</strong> ${escapeHtml(order.customerPhone)}</p>
          <p style="margin:4px 0;"><strong>Email:</strong> ${escapeHtml(order.customerEmail || "Không có")}</p>
          <p style="margin:4px 0;"><strong>Địa chỉ giao hàng:</strong> ${escapeHtml(order.shippingAddress)}</p>
          ${noteHtml}
        </div>

        <h3 style="margin:20px 0 8px;font-size:15px;color:#1e293b;">📦 Chi tiết sản phẩm</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f8fafc;color:#475569;">
              <th style="padding:10px;border-bottom:2px solid #cbd5e1;text-align:center;">#</th>
              <th style="padding:10px;border-bottom:2px solid #cbd5e1;text-align:left;">Sản phẩm</th>
              <th style="padding:10px;border-bottom:2px solid #cbd5e1;text-align:center;">SL</th>
              <th style="padding:10px;border-bottom:2px solid #cbd5e1;text-align:right;">Đơn giá</th>
              <th style="padding:10px;border-bottom:2px solid #cbd5e1;text-align:right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml}
          </tbody>
        </table>

        <table style="width:100%;margin-top:16px;font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#475569;">Tạm tính:</td>
            <td style="padding:6px 0;text-align:right;">${formatCurrency(order.subtotal)}</td>
          </tr>
          ${discountRowHtml}
          <tr>
            <td style="padding:6px 0;color:#475569;">Phí vận chuyển:</td>
            <td style="padding:6px 0;text-align:right;">${formatCurrency(order.shippingFee)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0 0;border-top:2px solid #e2e8f0;font-size:16px;font-weight:bold;">Tổng cộng:</td>
            <td style="padding:10px 0 0;border-top:2px solid #e2e8f0;font-size:18px;font-weight:bold;text-align:right;color:#ef4444;">${formatCurrency(order.totalAmount)}</td>
          </tr>
        </table>
      </div>

      <div style="background:#f8fafc;padding:16px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;">
        Cảm ơn bạn đã mua sắm tại LHU E-Commerce Store! Email này được gửi tự động từ hệ thống.
      </div>
    </div>
  </div>`;

  const text = [
    `LHU E-COMMERCE STORE - XÁC NHẬN ĐƠN HÀNG #${order.orderCode}`,
    `Xin chào ${order.customerName},`,
    `Thời gian đặt: ${createdAt}`,
    `Trạng thái: ${statusLabel}`,
    `Thanh toán: ${paymentLabel}`,
    ``,
    `THÔNG TIN NHẬN HÀNG:`,
    `- Người nhận: ${order.customerName}`,
    `- SĐT: ${order.customerPhone}`,
    `- Địa chỉ: ${order.shippingAddress}`,
    order.note ? `- Ghi chú: ${order.note}` : null,
    ``,
    `CHI TIẾT SẢN PHẨM:`,
    itemLinesText,
    ``,
    `Tạm tính: ${formatCurrency(order.subtotal)}`,
    Number(order.discountAmount) > 0 ? `Giảm giá: -${formatCurrency(order.discountAmount)}` : null,
    `Phí vận chuyển: ${formatCurrency(order.shippingFee)}`,
    `TỔNG CỘNG: ${formatCurrency(order.totalAmount)}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  return {
    subject: `[LHU Store] Xác nhận đơn hàng #${order.orderCode}`,
    html,
    text,
  };
};

/**
 * Gửi email chi tiết đơn hàng tới khách hàng (và BCC admin nếu cấu hình ADMIN_EMAIL).
 * Không ném lỗi để tránh làm gián đoạn quá trình tạo đơn hàng.
 */
const sendOrderConfirmationEmail = async (order, customTransporter = null) => {
  const recipient = order?.customerEmail?.trim() || process.env.ADMIN_EMAIL?.trim();
  if (!recipient) {
    return { sent: false, reason: "MISSING_RECIPIENT_EMAIL" };
  }

  const transporter = customTransporter || getTransporter();
  if (!transporter) {
    console.warn("⚠️ Chưa cấu hình EMAIL_USER và EMAIL_PASS trong .env nên chưa gửi email đơn hàng.");
    return { sent: false, reason: "EMAIL_NOT_CONFIGURED" };
  }

  const senderEmail = (process.env.SMTP_USER || process.env.EMAIL_USER)?.trim();
  const from = process.env.EMAIL_FROM?.trim() || (senderEmail ? `"LHU Store" <${senderEmail}>` : '"LHU Store" <no-reply@lhu-store.local>');
  const bcc = process.env.ADMIN_EMAIL?.trim() || undefined;
  const { subject, html, text } = buildOrderEmailContent(order);

  try {
    const info = await transporter.sendMail({
      from,
      to: recipient,
      ...(bcc && bcc.toLowerCase() !== recipient.toLowerCase() ? { bcc } : {}),
      subject,
      text,
      html,
    });

    console.log(`📧 Đã gửi email xác nhận đơn #${order.orderCode} tới ${recipient} (messageId: ${info.messageId})`);
    return { sent: true, recipient, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Lỗi gửi email đơn hàng #${order.orderCode}:`, error.message);
    return { sent: false, reason: "SEND_FAILED", error: error.message };
  }
};

module.exports = {
  buildOrderEmailContent,
  sendOrderConfirmationEmail,
};
