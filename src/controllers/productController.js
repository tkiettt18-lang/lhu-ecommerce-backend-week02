const Product = require('../models/Product');

// [GET] /api/products - Lấy danh sách sản phẩm (Lọc, Tìm kiếm, Sắp xếp)
exports.getProducts = async (req, res) => {
    try {
        const { category, search, minPrice, maxPrice, sort } = req.query;

        const filter = {};

        // 1. Lọc theo danh mục
        if (category) filter.category = category;

        // 2. Tìm kiếm theo tên (không phân biệt hoa thường)
        if (search) filter.name = { $regex: search, $options: 'i' };

        // 3. Lọc theo khoảng giá
        if (minPrice || maxPrice) {
            filter.salePrice = {};

            if (minPrice) filter.salePrice.$gte = Number(minPrice);
            if (maxPrice) filter.salePrice.$lte = Number(maxPrice);
        }

        // 4. Sắp xếp giá
        let sortQuery = { createdAt: -1 };

        if (sort === 'price_asc') sortQuery = { salePrice: 1 };
        if (sort === 'price_desc') sortQuery = { salePrice: -1 };

        const products = await Product.find(filter)
            .populate('category', 'name slug')
            .sort(sortQuery);

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách sản phẩm thành công',
            total: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// [GET] /api/products/:id - Lấy chi tiết 1 sản phẩm
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name slug');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm yêu cầu!'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy chi tiết sản phẩm thành công',
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// [POST] /api/products - Thêm sản phẩm mới
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            category,
            brand,
            originalPrice,
            salePrice,
            stock,
            image,
            description
        } = req.body;

        if (!name || !category || !originalPrice || !salePrice) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ: Tên sản phẩm, Danh mục, Giá gốc và Giá bán!'
            });
        }

        const newProduct = await Product.create({
            name,
            category,
            brand: brand || 'LHU Brand',
            originalPrice,
            salePrice,
            stock: stock || 10,
            image,
            description
        });

        const populated = await Product.findById(newProduct._id)
            .populate('category', 'name');

        res.status(201).json({
            success: true,
            message: 'Thêm sản phẩm mới thành công',
            data: populated
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// [PUT] /api/products/:id - Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate('category', 'name');

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm để cập nhật!'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật sản phẩm thành công',
            data: updated
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// [DELETE] /api/products/:id - Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm để xóa!'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Đã xóa sản phẩm thành công',
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};