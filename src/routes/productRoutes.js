
const express = require('express');
const router = express.Router();

const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

// API lấy danh sách sản phẩm
router.get('/', getProducts);

// API lấy chi tiết sản phẩm
router.get('/:id', getProductById);

// API thêm sản phẩm
router.post('/', createProduct);

// API cập nhật sản phẩm
router.put('/:id', updateProduct);

// API xóa sản phẩm
router.delete('/:id', deleteProduct);

module.exports = router;
