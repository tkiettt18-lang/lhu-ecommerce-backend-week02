require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const connectDB = require("./config/db");
const Order = require("./models/Order");

const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const orderRoutes = require("./routes/orderRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Health Check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "OK",
        message: "Backend đang hoạt động!"
    });
});

// 3. API Debug kiểm tra đơn hàng
app.get("/api/debug/order", async (req, res) => {
    try {
        const orderId = req.query.orderId;

        const order = orderId
            ? await Order.findById(orderId)
            : null;

        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select(
                "_id orderCode customerName totalAmount paymentMethod paymentStatus"
            );

        res.status(200).json({
            success: true,
            database: mongoose.connection.name,
            host: mongoose.connection.host,
            collection: Order.collection.name,
            totalOrders: await Order.countDocuments(),
            orderFound: !!order,
            order: order,
            allOrders: orders
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 4. Đăng ký Routes API
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/ai", aiRoutes);

// 5. Phục vụ giao diện Frontend an toàn (chỉ public css, js và HTML)
const rootDir = path.join(__dirname, "..");
app.use("/css", express.static(path.join(rootDir, "css")));
app.use("/js", express.static(path.join(rootDir, "js")));

app.get(["/", "/index.html"], (req, res) => {
    res.sendFile(path.join(rootDir, "index.html"));
});

app.get(["/admin", "/admin.html"], (req, res) => {
    res.sendFile(path.join(rootDir, "admin.html"));
});

// 6. Xử lý Route / API không tồn tại
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Không tìm thấy API: ${req.method} ${req.originalUrl}`
    });
});

// 7. Khởi động Server sau khi kết nối MongoDB
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log("----------------------------------");
            console.log("🚀 LHU E-COMMERCE BACKEND");
            console.log(`🌐 Server: http://localhost:${PORT}`);
            console.log(`🗄️ Database: ${mongoose.connection.name}`);
            console.log("📦 Order API: http://localhost:" + PORT + "/api/orders");
            console.log("----------------------------------");
        });

    } catch (error) {
        console.error("❌ Không thể khởi động Server:", error.message);
        process.exit(1);
    }
};

startServer();
