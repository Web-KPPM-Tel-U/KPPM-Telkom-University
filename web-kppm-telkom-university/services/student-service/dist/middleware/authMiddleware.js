"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMentorToken = exports.verifyPicToken = exports.verifyAdminToken = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET env variable is required'); })();
/**
 * Middleware: Verifikasi JWT dari header Authorization
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa' });
    }
};
exports.verifyToken = verifyToken;
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
/**
 * Middleware: Verifikasi JWT khusus PIC
 * Hanya mengizinkan role 'pic'
 */
const verifyPicToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded?.role !== 'pic') {
            res.status(403).json({ success: false, message: 'Akses ditolak. Hanya untuk PIC.' });
            return;
        }
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa' });
    }
};
exports.verifyPicToken = verifyPicToken;
/**
 * Middleware: Verifikasi JWT mentor + validasi session DB + cek mentor_access_revoked (real-time).
 *
 * Dipakai di semua route /mentor/*.
 * Memastikan:
 *   1. JWT valid dan role = 'mentor'
 *   2. Session masih terdaftar di tabel mentor_sessions (belum di-revoke)
 *   3. Kolom mentor_access_revoked = 0 pada internship_registrations
 *
 * Jika salah satu gagal, request langsung ditolak meski JWT belum expired.
 */
const verifyMentorToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Token mentor tidak ditemukan' });
        return;
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch {
        res.status(401).json({ success: false, message: 'Token mentor tidak valid atau sudah kadaluarsa' });
        return;
    }
    if (decoded?.role !== 'mentor') {
        res.status(403).json({ success: false, message: 'Akses ditolak. Hanya untuk Mentor.' });
        return;
    }
    const registrationId = decoded.registration_id;
    if (!registrationId) {
        res.status(401).json({ success: false, message: 'Token mentor tidak valid.' });
        return;
    }
    try {
        // 1. Cek apakah session masih aktif di DB
        const [sessionRows] = await db_1.default.execute('SELECT mentor_session_id FROM mentor_sessions WHERE registration_id = ? AND session_token = ?', [registrationId, token]);
        if (!sessionRows || sessionRows.length === 0) {
            res.status(401).json({
                success: false,
                message: 'Sesi Anda telah berakhir. Silakan login kembali.',
            });
            return;
        }
        // 2. Cek apakah akses mentor sudah dicabut
        const [regRows] = await db_1.default.execute('SELECT mentor_access_revoked FROM internship_registrations WHERE registration_id = ?', [registrationId]);
        if (!regRows || regRows.length === 0 || regRows[0].mentor_access_revoked === 1) {
            res.status(403).json({
                success: false,
                message: 'Akses Anda telah dinonaktifkan karena mahasiswa telah menyelesaikan upload dokumen KP.',
            });
            return;
        }
    }
    catch (err) {
        console.error('[authMiddleware] verifyMentorToken DB error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
        return;
    }
    req.user = decoded;
    next();
};
exports.verifyMentorToken = verifyMentorToken;
