"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const studentRoutes_1 = __importDefault(require("./routes/studentRoutes"));
const app = (0, express_1.default)();
// Percayai header X-Forwarded-For dari API Gateway supaya rate limiter membaca IP klien asli
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4002;
// ─── Middleware ───────────────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:4000'],
    credentials: true,
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
// ─── Rate Limiter ────────────────────────────────────────────────────────────────
// 1500 request per IP per 15 menit = ~100 req/menit per user, sangat longgar untuk pemakaian normal
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Terlalu banyak permintaan. Coba lagi dalam 15 menit.' },
});
app.use(apiLimiter);
// ─── Static Files (Uploaded Documents) ───────────────────────────────────────
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'student-service',
        timestamp: new Date().toISOString(),
    });
});
// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/student', studentRoutes_1.default);
// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found on Student Service' });
});
// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n[Student Service] Running at http://localhost:${PORT}`);
    console.log(`   Routes:`);
    console.log(`   GET  /student/profile                 (requires JWT)`);
    console.log(`   GET  /student/dashboard               (requires JWT)`);
    console.log(`   POST /student/kppm/register           (requires JWT, multipart/form-data)`);
    console.log(`   GET  /student/kppm/registrations      (requires JWT)`);
    console.log(`   GET  /student/kppm/registrations/:id  (requires JWT)\n`);
});
