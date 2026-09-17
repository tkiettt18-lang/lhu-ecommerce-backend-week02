/**
 * CẤU HÌNH KẾT NỐI API BACKEND CHO FRONTEND TEMPLATE
 * Sinh viên chỉ cần đảm bảo Backend chạy tại cổng 5000, 
 * hoặc thay đổi đường dẫn này khi deploy lên Cloud (Render.com)
 */
const API_BASE_URL = 'http://localhost:5000/api';

const API = {
  // 1. Danh mục
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      return await res.json();
    } catch (err) {
      console.error('Lỗi lấy danh mục:', err);
      return { success: false, data: [] };
    }
  },

  // 2. Sản phẩm
  async getProducts(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.category) query.append('category', params.category);
      if (params.search) query.append('search', params.search);
      if (params.sort) query.append('sort', params.sort);

      const url = `${API_BASE_URL}/products${query.toString() ? '?' + query.toString() : ''}`;
      const res = await fetch(url);
      return await res.json();
    } catch (err) {
      console.error('Lỗi lấy sản phẩm:', err);
      return { success: false, data: [] };
    }
  },

  async getProductById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`);
      return await res.json();
    } catch (err) {
      console.error('Lỗi lấy chi tiết sản phẩm:', err);
      return { success: false, message: 'Lỗi kết nối máy chủ' };
    }
  },

  async createProduct(productData, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi thêm sản phẩm:', err);
      return { success: false, message: err.message };
    }
  },

  async deleteProduct(id, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi xóa sản phẩm:', err);
      return { success: false, message: err.message };
    }
  },

  // 3. Đăng nhập / Đăng ký
  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      return { success: false, message: 'Không thể kết nối đến máy chủ API' };
    }
  },

  // 4. Đơn hàng
  async createOrder(orderData) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi đặt hàng:', err);
      return { success: false, message: err.message };
    }
  },

  async getOrders(token) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi lấy đơn hàng:', err);
      return { success: false, data: [] };
    }
  },

  async updateOrderStatus(id, status, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi cập nhật đơn hàng:', err);
      return { success: false, message: err.message };
    }
  },

  // 5. Thanh toán QR
  async createPaymentQR(orderId, paymentMethod) {
    try {
      const res = await fetch(`${API_BASE_URL}/payment/create-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentMethod })
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi tạo mã thanh toán QR:', err);
      return { success: false, message: err.message };
    }
  },

  // 6. Trợ lý AI Gemini
  async askAI(message) {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi gọi AI Chatbot:', err);
      return {
        success: false,
        reply: 'Hệ thống AI đang bận hoặc chưa khởi động máy chủ Backend. Bạn vui lòng thử lại sau nhé!'
      };
    }
  }
};
