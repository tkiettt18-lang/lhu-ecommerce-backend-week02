const Product = require("../models/Product");

// Ưu tiên Gemini 2.5 Flash nếu API key hỗ trợ; tự động fallback sang model thay thế do Google cung cấp khi 2.5 trả về 404, quá tải (503) hoặc timeout
const DEFAULT_MODELS = [
    "gemini-2.5-flash",
    "gemini-3-flash-preview",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite"
];

const MODEL_TIMEOUT_MS = 12000;
const unavailableModels = new Set();
let cachedClient = { apiKey: null, client: null };

const getAIClient = async () => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
        throw new Error("Chưa cấu hình GEMINI_API_KEY trong file .env");
    }

    if (!cachedClient.client || cachedClient.apiKey !== apiKey) {
        const { GoogleGenAI } = await import("@google/genai");
        cachedClient = {
            apiKey,
            client: new GoogleGenAI({ apiKey })
        };
    }

    return cachedClient.client;
};

const getCandidateModels = () => {
    const customModel = process.env.GEMINI_MODEL?.trim();
    const list = customModel ? [customModel, ...DEFAULT_MODELS] : DEFAULT_MODELS;
    return [...new Set(list)].filter((model) => !unavailableModels.has(model));
};

const isModelFallbackError = (error) => {
    const status = error?.status || error?.code;
    const name = String(error?.name || "");
    const msg = String(error?.message || "");
    return (
        status === 404 ||
        status === 503 ||
        status === 429 ||
        name === "AbortError" ||
        name === "TimeoutError" ||
        msg.includes('"code":404') ||
        msg.includes('"code":503') ||
        msg.includes('"code":429') ||
        msg.includes("NOT_FOUND") ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("timed out") ||
        msg.includes("aborted")
    );
};

const isPermanentModelError = (error) => {
    const status = error?.status || error?.code;
    const msg = String(error?.message || "");
    return status === 404 || msg.includes('"code":404') || msg.includes("NOT_FOUND");
};

const generateReplyWithFallback = async (ai, prompt) => {
    let candidates = getCandidateModels();
    if (candidates.length === 0) {
        unavailableModels.clear();
        candidates = DEFAULT_MODELS;
    }

    let lastError = null;
    for (const model of candidates) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    abortSignal: AbortSignal.timeout(MODEL_TIMEOUT_MS)
                }
            });
            return { response, model };
        } catch (error) {
            lastError = error;
            console.warn(`AI model "${model}" failed:`, error.message || error);
            if (isPermanentModelError(error)) {
                unavailableModels.add(model);
            }
            if (!isModelFallbackError(error)) {
                throw error;
            }
        }
    }

    throw lastError || new Error("Không có mô hình Gemini khả dụng.");
};

// POST /api/ai/chat
exports.chatWithAI = async (req, res) => {
    try {
        const { message } = req.body || {};

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập nội dung cần tư vấn."
            });
        }

        // Lấy dữ liệu sản phẩm thực tế từ MongoDB
        const products = await Product.find()
            .populate("category", "name")
            .select("name brand originalPrice salePrice stock description rating isFeatured")
            .lean();

        const productContext = products.map((product, index) => ({
            stt: index + 1,
            ten: product.name,
            danhMuc: product.category?.name || "Chưa phân loại",
            thuongHieu: product.brand,
            giaGoc: product.originalPrice,
            giaBan: product.salePrice,
            tonKho: product.stock,
            moTa: product.description,
            danhGia: product.rating,
            noiBat: product.isFeatured
        }));

        const prompt = `Bạn là LHU AI Assistant, trợ lý tư vấn khách hàng của cửa hàng LHU E-Commerce.

NHIỆM VỤ:
- Trả lời bằng tiếng Việt, thân thiện, lịch sự và dễ hiểu.
- Tư vấn sản phẩm, giá bán, danh mục, tồn kho và combo phù hợp.
- Dựa vào dữ liệu sản phẩm được cung cấp bên dưới.
- Không tự tạo sản phẩm, giá bán, số lượng tồn kho hoặc khuyến mãi.
- Nếu không có sản phẩm phù hợp, hãy nói rõ và đề xuất khách hàng cung cấp thêm nhu cầu.
- Giá tiền trình bày bằng VNĐ.
- Khi khách hỏi combo, gợi ý kết hợp các sản phẩm thực sự có trong danh sách.
- Không khẳng định đã đặt hàng hoặc thanh toán thay khách hàng.

DỮ LIỆU SẢN PHẨM TỪ MONGODB (${products.length} sản phẩm):
${JSON.stringify(productContext)}

CÂU HỎI KHÁCH HÀNG:
${message.trim()}`;

        const ai = await getAIClient();
        const { response, model } = await generateReplyWithFallback(ai, prompt);

        const reply =
            response?.candidates?.[0]?.content?.parts?.[0]?.text ||
            response?.text ||
            "Xin lỗi, hiện tại em chưa thể tạo câu trả lời. Bạn vui lòng thử lại nhé.";

        return res.status(200).json({
            success: true,
            message: "Tư vấn thành công!",
            reply,
            data: {
                reply,
                model
            }
        });

    } catch (error) {
        console.error("AI CHAT ERROR:", error.message || error);

        return res.status(500).json({
            success: false,
            message: "Không thể xử lý câu hỏi AI. Vui lòng kiểm tra GEMINI_API_KEY và kết nối mạng.",
            error: error.message
        });
    }
};
