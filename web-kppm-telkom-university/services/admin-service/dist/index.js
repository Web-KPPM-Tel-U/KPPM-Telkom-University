"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const app = (0, express_1.default)();
// Percayai header X-Forwarded-For dari API Gateway supaya rate limiter membaca IP klien asli
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4003;
// ─── Middleware ───────────────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:4000'],
    credentials: true,
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
// ─── Rate Limiter (Admin panel) ──────────────────────────────────────────────────
// Admin panel hanya diakses PIC/admin (bukan mahasiswa), 500/15mnt sudah lebih dari cukup
const adminLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Terlalu banyak permintaan admin. Coba lagi dalam 15 menit.' },
});
app.use(adminLimiter);
// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'admin-service',
        timestamp: new Date().toISOString(),
    });
});
// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/admin', adminRoutes_1.default);
// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found on Admin Service' });
});
// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n[Admin Service] Running at http://localhost:${PORT}`);
    console.log(`   Routes:`);
    console.log(`   GET  /admin/stats`);
    console.log(`   GET  /admin/lecturers`);
    console.log(`   GET  /admin/students`);
    console.log(`   GET  /admin/semesters`);
    console.log(`   POST /admin/inject/students`);
    console.log(`   POST /admin/inject/lecturers\n`);
});
