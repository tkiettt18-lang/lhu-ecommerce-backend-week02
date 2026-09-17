# 🎨 BỘ GIAO DIỆN MẪU E-COMMERCE (FRONTEND TEMPLATE)
**Học phần:** Lập trình ứng dụng (Mã HP: 112175) — Ngành Thương mại điện tử – Trường ĐH Lạc Hồng

---

## 🌟 GIỚI THIỆU
Đây là bộ giao diện Web Thương mại điện tử hoàn chỉnh, được thiết kế chuẩn mực, hiện đại, tương thích hoàn toàn với chuẩn **API Contract** của học phần:
* **Giao diện Khách hàng (`index.html`):** Banner khuyến mãi, Bộ lọc danh mục sản phẩm, Ô tìm kiếm thông minh, Lưới sản phẩm responsive, Xem chi tiết sản phẩm modal, Giỏ hàng trượt (Cart Drawer), Form đặt hàng & Thanh toán mã QR (VietQR / MoMo QR), Widget Trợ lý ảo AI Gemini nổi góc màn hình.
* **Giao diện Quản trị (`admin.html`):** Thống kê nhanh Tổng sản phẩm, Tổng đơn hàng, Doanh thu; Bảng quản lý thêm/xóa sản phẩm và cập nhật trạng thái đơn hàng.

---

## 🚀 HƯỚNG DẪN SỬ DỤNG

### Bước 1: Khởi động máy chủ Backend API
Mở terminal tại thư mục bài tập của tuần (Ví dụ: `Tuan03_CRUD_SanPham_DanhMuc/project` hoặc `Tuan10_.../project`) và gõ:
```bash
npm run dev
```
Đảm bảo máy chủ Backend đang chạy tại: `http://localhost:5000`

### Bước 2: Mở giao diện Frontend
Có 2 cách rất đơn giản:
* **Cách 1 (Khuyên dùng):** Cài extension **Live Server** trên VS Code -> Chuột phải vào file `index.html` -> Chọn **Open with Live Server**.
* **Cách 2:** Nhấp đúp chuột trực tiếp vào file `index.html` để mở trên trình duyệt (Chrome / Edge).

### Bước 3: Cấu hình địa chỉ API (Khi deploy Cloud)
Mặc định file `js/api.js` đã trỏ về máy cá nhân:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```
Khi bạn triển khai Backend lên Cloud (Render.com ở Tuần 07), chỉ cần thay đổi đường link này thành:
```javascript
const API_BASE_URL = 'https://dia-chi-backend-cua-ban.onrender.com/api';
```
Toàn bộ giao diện sẽ tự động hoạt động online toàn cầu!
