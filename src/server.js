require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Kết nối CSDL MongoDB Atlas
connectDB();

// 2. Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend và MongoDB Atlas đang kết nối ổn định!",
  });
});

// 4. Routes
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);

// 5. Khởi chạy Server
app.listen(PORT, () => {
  console.log(`🚀 Server Tuần 02 đang chạy tại: http://localhost:${PORT}`);
});
