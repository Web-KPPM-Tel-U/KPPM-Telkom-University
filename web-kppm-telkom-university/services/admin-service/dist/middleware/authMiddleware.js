"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdminToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'kppm-telkom-secret-dev-2024';
/**
 * Middleware: Verifikasi JWT Admin/PIC
 * Hanya mengizinkan role 'admin' atau 'pic'
 */
const verifyAdminToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Token admin tidak ditemukan' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded?.role !== 'admin' && decoded?.role !== 'pic') {
            res.status(403).json({ success: false, message: 'Akses ditolak. Hanya untuk Admin/PIC.' });
            return;
        }
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({ success: false, message: 'Token admin tidak valid atau sudah kadaluarsa' });
    }
};
exports.verifyAdminToken = verifyAdminToken;
