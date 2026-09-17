require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("./models/Category");
const Product = require("./models/Product");
const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Đã kết nối Atlas để chuẩn bị nạp dữ liệu...");
    await Product.deleteMany({});
    await Category.deleteMany({});
    // 1. Tạo danh mục mẫu
    const createdCategories = await Category.insertMany([
      {
        name: "Thời Trang Nam",
        slug: "thoi-trang-nam",
        image:
          "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=500",
      },
      {
        name: "Thời Trang Nữ",
        slug: "thoi-trang-nu",
        image:
          "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500",
      },
      {
        name: "Phụ Kiện & Giày Dép",
        slug: "phu-kien-giay-dep",
        image:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
      },
    ]);
    // 2. Tạo sản phẩm mẫu có sẵn thương hiệu (brand)
    await Product.insertMany([
      {
        name: "Áo Thun Polo LHU Cao Cấp",
        category: createdCategories[0]._id,
        brand: "LHU Fashion",
        originalPrice: 250000,
        salePrice: 199000,
        stock: 50,
        image:
          "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500",
        description:
          "Chất liệu cotton 100% thoáng mát, thấm hút mồ hôi cực tốt.",
        rating: 4.9,
        isFeatured: true,
      },
      {
        name: "Đầm Xòe Nữ Phong Cách Hàn Quốc",
        category: createdCategories[1]._id,
        brand: "Korean Style",
        originalPrice: 420000,
        salePrice: 349000,
        stock: 25,
        image:
          "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=500",
        description: "Thiết kế thanh lịch, voan lụa mềm mại.",
        rating: 5.0,
        isFeatured: true,
      },
      {
        name: "Giày Sneaker Trắng Năng Động",
        category: createdCategories[2]._id,
        brand: "Dynamic Shoes",
        originalPrice: 600000,
        salePrice: 480000,
        stock: 40,
        image:
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500",
        description: "Đế êm chống trượt, êm chân suốt ngày dài.",
        rating: 4.9,
        isFeatured: true,
      },
    ]);
    console.log("🎉 NẠP DỮ LIỆU SEED THÀNH CÔNG VÀO MONGODB ATLAS!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi seed:", error);
    process.exit(1);
  }
};
seedData();
