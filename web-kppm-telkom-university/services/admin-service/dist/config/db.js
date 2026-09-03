"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const pool = promise_1.default.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'internship_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
// ─── Test connection on startup ──────────────────────────────────────────────
pool.getConnection()
    .then((conn) => {
    console.log('[Admin Service] Database connected successfully');
    conn.release();
})
    .catch((err) => {
    console.error('[Admin Service] Database connection failed:', err.message);
});
exports.default = pool;
