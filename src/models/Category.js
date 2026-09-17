const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên danh mục không được để trống"],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500",
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Category", categorySchema);
