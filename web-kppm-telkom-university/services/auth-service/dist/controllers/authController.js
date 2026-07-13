"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.mentorVerifyOtp = exports.mentorSendOtp = exports.lecturerLogin = exports.studentLogin = void 0;
require("dotenv/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../config/db"));
const JWT_SECRET = process.env.JWT_SECRET || 'kppm-telkom-secret-dev-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
// ─── Student Login ────────────────────────────────────────────────────────────
const studentLogin = async (req, res) => {
    const { nim, password } = req.body;
    if (!nim || !password) {
        res.status(400).json({ success: false, message: 'NIM dan password wajib diisi' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute('SELECT student_id, nim, student_name, class, email, password FROM students WHERE nim = ?', [nim]);
        if (!rows || rows.length === 0) {
            res.status(401).json({ success: false, message: 'NIM atau password salah' });
            return;
        }
        const student = rows[0];
        // Cek password — support bcrypt hash dan plain text (untuk seed data awal)
        let passwordValid = false;
        if (student.password.startsWith('$2')) {
            // Bcrypt hash
            passwordValid = await bcryptjs_1.default.compare(password, student.password);
        }
        else {
            // Plain text (fallback untuk dev — akan dihapus setelah semua di-hash)
            passwordValid = student.password === password;
        }
        if (!passwordValid) {
            res.status(401).json({ success: false, message: 'NIM atau password salah' });
            return;
        }
        const payload = {
            sub: student.student_id,
            nim: student.nim,
            name: student.student_name,
            role: 'student',
        };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.status(200).json({
            success: true,
            message: 'Login berhasil',
            data: {
                token,
                user: {
                    id: student.student_id,
                    nim: student.nim,
                    name: student.student_name,
                    class: student.class,
                    email: student.email,
                    role: 'student',
                },
            },
        });
    }
    catch (err) {
        console.error('[Auth Service] studentLogin error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server. Silakan coba lagi.' });
    }
};
exports.studentLogin = studentLogin;
// ─── Lecturer Login ───────────────────────────────────────────────────────────
const lecturerLogin = async (req, res) => {
    const { nip, password } = req.body;
    if (!nip || !password) {
        res.status(400).json({ success: false, message: 'NIP dan password wajib diisi' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute('SELECT lecturer_id, nip, lecturer_name, password FROM lecturers WHERE nip = ?', [nip]);
        if (!rows || rows.length === 0) {
            res.status(401).json({ success: false, message: 'NIP atau password salah' });
            return;
        }
        const lecturer = rows[0];
        let passwordValid = false;
        if (lecturer.password.startsWith('$2')) {
            passwordValid = await bcryptjs_1.default.compare(password, lecturer.password);
        }
        else {
            passwordValid = lecturer.password === password;
        }
        if (!passwordValid) {
            res.status(401).json({ success: false, message: 'NIP atau password salah' });
            return;
        }
        const payload = {
            sub: lecturer.lecturer_id,
            nip: lecturer.nip,
            name: lecturer.lecturer_name,
            role: 'lecturer',
        };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.status(200).json({
            success: true,
            message: 'Login berhasil',
            data: {
                token,
                user: {
                    id: lecturer.lecturer_id,
                    nip: lecturer.nip,
                    name: lecturer.lecturer_name,
                    role: 'lecturer',
                },
            },
        });
    }
    catch (err) {
        console.error('[Auth Service] lecturerLogin error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server. Silakan coba lagi.' });
    }
};
exports.lecturerLogin = lecturerLogin;
// ─── Mentor: Send OTP ─────────────────────────────────────────────────────────
const mentorSendOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ success: false, message: 'Email wajib diisi' });
        return;
    }
    try {
        // Cek apakah email mentor valid di registrasi
        const [rows] = await db_1.default.execute('SELECT registration_id FROM internship_registrations WHERE mentor_email = ? AND status = ?', [email, 'approved']);
        if (!rows || rows.length === 0) {
            res.status(404).json({ success: false, message: 'Email mentor tidak ditemukan atau belum disetujui' });
            return;
        }
        const registrationId = rows[0].registration_id;
        // Generate OTP 6 digit
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiredAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit
        // Simpan OTP ke database (hapus OTP lama dulu)
        await db_1.default.execute('DELETE FROM mentor_otps WHERE registration_id = ?', [registrationId]);
        await db_1.default.execute('INSERT INTO mentor_otps (registration_id, otp_code, expired_at) VALUES (?, ?, ?)', [registrationId, otp, expiredAt]);
        console.log(`[Auth Service] OTP untuk ${email}: ${otp}`);
        res.status(200).json({
            success: true,
            message: `OTP telah dikirim ke ${email}`,
            dev_otp: otp, // DEV ONLY
        });
    }
    catch (err) {
        console.error('[Auth Service] mentorSendOtp error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.mentorSendOtp = mentorSendOtp;
// ─── Mentor: Verify OTP ───────────────────────────────────────────────────────
const mentorVerifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        res.status(400).json({ success: false, message: 'Email dan OTP wajib diisi' });
        return;
    }
    try {
        // Cari OTP valid berdasarkan email mentor
        const [rows] = await db_1.default.execute(`SELECT mo.otp_id, mo.registration_id, mo.otp_code, mo.expired_at
       FROM mentor_otps mo
       JOIN internship_registrations ir ON mo.registration_id = ir.registration_id
       WHERE ir.mentor_email = ? AND mo.otp_code = ?
       ORDER BY mo.created_at DESC LIMIT 1`, [email, otp]);
        if (!rows || rows.length === 0) {
            res.status(401).json({ success: false, message: 'OTP salah atau tidak ditemukan' });
            return;
        }
        const otpRow = rows[0];
        if (new Date() > new Date(otpRow.expired_at)) {
            await db_1.default.execute('DELETE FROM mentor_otps WHERE otp_id = ?', [otpRow.otp_id]);
            res.status(401).json({ success: false, message: 'OTP sudah kadaluarsa. Kirim OTP baru.' });
            return;
        }
        // Hapus OTP setelah dipakai
        await db_1.default.execute('DELETE FROM mentor_otps WHERE otp_id = ?', [otpRow.otp_id]);
        // Buat session token
        const sessionToken = jsonwebtoken_1.default.sign({ email, role: 'mentor', registration_id: otpRow.registration_id }, JWT_SECRET, { expiresIn: '8h' });
        const sessionExpiredAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
        await db_1.default.execute('INSERT INTO mentor_sessions (registration_id, session_token, session_expired_at) VALUES (?, ?, ?)', [otpRow.registration_id, sessionToken, sessionExpiredAt]);
        res.status(200).json({
            success: true,
            message: 'Verifikasi OTP berhasil',
            data: {
                token: sessionToken,
                user: { email, role: 'mentor' },
            },
        });
    }
    catch (err) {
        console.error('[Auth Service] mentorVerifyOtp error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.mentorVerifyOtp = mentorVerifyOtp;
// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = (_req, res) => {
    res.status(200).json({ success: true, message: 'Logout berhasil' });
};
exports.logout = logout;
