const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên sản phẩm không được để trống"],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Sản phẩm phải thuộc về một danh mục"],
    },
    brand: {
      type: String,
      default: "LHU Brand",
      trim: true,
    },
    originalPrice: {
      type: Number,
      required: [true, "Giá gốc không được để trống"],
      min: [0, "Giá tiền không được nhỏ hơn 0"],
    },
    salePrice: {
      type: Number,
      required: [true, "Giá bán không được để trống"],
      min: [0, "Giá tiền không được nhỏ hơn 0"],
    },
    stock: {
      type: Number,
      default: 10,
      min: [0, "Số lượng kho không thể âm"],
    },
    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    },
    description: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Product", productSchema);
