"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const studentRoutes_1 = __importDefault(require("./routes/studentRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4002;
// ─── Middleware ───────────────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:4000'],
    credentials: true,
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
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
    console.log(`\n🎓 Student Service running at http://localhost:${PORT}`);
    console.log(`   Routes:`);
    console.log(`   GET /student/profile   (requires JWT)`);
    console.log(`   GET /student/dashboard (requires JWT)\n`);
});
