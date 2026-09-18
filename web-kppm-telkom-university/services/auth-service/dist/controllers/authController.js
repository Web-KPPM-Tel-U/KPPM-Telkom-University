"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeAdminPassword = exports.adminLogin = exports.changeLecturerPassword = exports.lecturerVerifyEmail = exports.lecturerSendVerifyOtp = exports.logout = exports.mentorVerifyOtp = exports.mentorSendOtp = exports.lecturerLogin = exports.changeStudentPassword = exports.studentVerifyEmail = exports.studentSendVerifyOtp = exports.studentLogin = void 0;
require("dotenv/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../config/db"));
const emailService_1 = require("../services/emailService");
const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET env variable is required'); })();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
// ─── Student Login (menggunakan NIM) ─────────────────────────────────────────
const studentLogin = async (req, res) => {
    const { nim, password } = req.body;
    if (!nim || !password) {
        res.status(400).json({ success: false, message: 'NIM dan password wajib diisi' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute('SELECT nim, student_name, class, email, password, is_verified, password_changed, is_active FROM students WHERE nim = ?', [nim]);
        if (!rows || rows.length === 0) {
            res.status(401).json({ success: false, message: 'NIM atau password salah' });
            return;
        }
        const student = rows[0];
        if (student.is_active === 0) {
            res.status(403).json({ success: false, message: 'Akun Anda telah dinonaktifkan oleh Admin.' });
            return;
        }
        let passwordValid = false;
        if (student.password.startsWith('$2')) {
            passwordValid = await bcryptjs_1.default.compare(password, student.password);
        }
        else {
            passwordValid = student.password === password;
        }
        if (!passwordValid) {
            res.status(401).json({ success: false, message: 'NIM atau password salah' });
            return;
        }
        const isVerified = student.is_verified === 1;
        const passwordChanged = student.password_changed === 1;
        const payload = {
            sub: student.nim, // NIM sebagai identifier utama
            nim: student.nim,
            name: student.student_name,
            class: student.class,
            role: 'student',
            is_verified: isVerified,
            password_changed: passwordChanged,
        };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.status(200).json({
            success: true,
            message: 'Login berhasil',
            data: {
                token,
                user: {
                    nim: student.nim,
                    name: student.student_name,
                    class: student.class,
                    email: student.email,
                    role: 'student',
                    is_verified: isVerified,
                    password_changed: passwordChanged,
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
// ─── Student: Send Verify OTP ─────────────────────────────────────────────────
const studentSendVerifyOtp = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    let studentNim;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.role !== 'student') {
            res.status(403).json({ success: false, message: 'Akses ditolak' });
            return;
        }
        studentNim = decoded.nim;
    }
    catch {
        res.status(401).json({ success: false, message: 'Token tidak valid' });
        return;
    }
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ success: false, message: 'Email wajib diisi' });
        return;
    }
    if (!email.endsWith('@student.telkomuniversity.ac.id')) {
        res.status(400).json({
            success: false,
            message: 'Email harus menggunakan domain @student.telkomuniversity.ac.id',
        });
        return;
    }
    try {
        // Cek apakah email sudah dipakai oleh mahasiswa lain
        const [existing] = await db_1.default.execute('SELECT nim FROM students WHERE email = ? AND nim != ?', [email, studentNim]);
        if (existing && existing.length > 0) {
            res.status(409).json({ success: false, message: 'Email ini sudah terdaftar oleh akun lain' });
            return;
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiredAt = new Date(Date.now() + 5 * 60 * 1000);
        await db_1.default.execute('DELETE FROM student_otps WHERE nim = ?', [studentNim]);
        await db_1.default.execute('INSERT INTO student_otps (nim, email_target, otp_code, expired_at) VALUES (?, ?, ?, ?)', [studentNim, email, otp, expiredAt]);
        try {
            await (0, emailService_1.sendStudentVerifyOtpEmail)(email, otp);
            console.log(`[Auth Service] OTP verifikasi dikirim ke: ${email}`);
        }
        catch (emailErr) {
            console.error(`[Auth Service] Gagal kirim email ke ${email}:`, emailErr.message);
            console.log(`[Auth Service] FALLBACK OTP untuk ${email}: ${otp}`);
        }
        res.status(200).json({
            success: true,
            message: `Kode OTP telah dikirim ke ${email}. Silakan cek inbox Anda.`,
        });
    }
    catch (err) {
        console.error('[Auth Service] studentSendVerifyOtp error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.studentSendVerifyOtp = studentSendVerifyOtp;
// ─── Student: Verify Email ────────────────────────────────────────────────────
const studentVerifyEmail = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    let studentNim;
    let name;
    let studentClass;
    let passwordChanged;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.role !== 'student') {
            res.status(403).json({ success: false, message: 'Akses ditolak' });
            return;
        }
        studentNim = decoded.nim;
        name = decoded.name;
        studentClass = decoded.class;
        passwordChanged = decoded.password_changed === true;
    }
    catch {
        res.status(401).json({ success: false, message: 'Token tidak valid' });
        return;
    }
    const { email, otp } = req.body;
    if (!email || !otp) {
        res.status(400).json({ success: false, message: 'Email dan OTP wajib diisi' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute(`SELECT otp_id, email_target, otp_code, expired_at
       FROM student_otps
       WHERE nim = ? AND email_target = ? AND otp_code = ?
       ORDER BY created_at DESC LIMIT 1`, [studentNim, email, otp]);
        if (!rows || rows.length === 0) {
            res.status(401).json({ success: false, message: 'OTP salah atau tidak ditemukan' });
            return;
        }
        const otpRow = rows[0];
        if (new Date() > new Date(otpRow.expired_at)) {
            await db_1.default.execute('DELETE FROM student_otps WHERE otp_id = ?', [otpRow.otp_id]);
            res.status(401).json({ success: false, message: 'OTP sudah kadaluarsa. Kirim OTP baru.' });
            return;
        }
        await db_1.default.execute('DELETE FROM student_otps WHERE otp_id = ?', [otpRow.otp_id]);
        await db_1.default.execute('UPDATE students SET email = ?, is_verified = 1 WHERE nim = ?', [email, studentNim]);
        const newPayload = {
            sub: studentNim,
            nim: studentNim,
            name,
            class: studentClass,
            role: 'student',
            is_verified: true,
            password_changed: passwordChanged,
        };
        const newToken = jsonwebtoken_1.default.sign(newPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.status(200).json({
            success: true,
            message: 'Email berhasil diverifikasi',
            data: {
                token: newToken,
                user: {
                    nim: studentNim,
                    name,
                    class: studentClass,
                    email,
                    role: 'student',
                    is_verified: true,
                    password_changed: passwordChanged,
                },
            },
        });
    }
    catch (err) {
        console.error('[Auth Service] studentVerifyEmail error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.studentVerifyEmail = studentVerifyEmail;
// ─── Student: Change Password ─────────────────────────────────────────────────
const changeStudentPassword = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    let studentNim;
    let name;
    let studentClass;
    let isVerified;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.role !== 'student') {
            res.status(403).json({ success: false, message: 'Akses ditolak' });
            return;
        }
        studentNim = decoded.nim;
        name = decoded.name;
        studentClass = decoded.class;
        isVerified = decoded.is_verified === true;
    }
    catch {
        res.status(401).json({ success: false, message: 'Token tidak valid' });
        return;
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, message: 'Password lama dan password baru wajib diisi' });
        return;
    }
    if (newPassword.length < 8) {
        res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter' });
        return;
    }
    if (currentPassword === newPassword) {
        res.status(400).json({ success: false, message: 'Password baru tidak boleh sama dengan password saat ini' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute('SELECT password, email FROM students WHERE nim = ?', [studentNim]);
        if (!rows || rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan' });
            return;
        }
        const storedPassword = rows[0].password;
        const freshEmail = rows[0].email;
        let isCurrentValid = false;
        if (storedPassword.startsWith('$2')) {
            isCurrentValid = await bcryptjs_1.default.compare(currentPassword, storedPassword);
        }
        else {
            isCurrentValid = storedPassword === currentPassword;
        }
        if (!isCurrentValid) {
            res.status(400).json({ success: false, message: 'Password lama yang Anda masukkan salah' });
            return;
        }
        const hashedNew = await bcryptjs_1.default.hash(newPassword, 10);
        await db_1.default.execute('UPDATE students SET password = ?, password_changed = 1 WHERE nim = ?', [hashedNew, studentNim]);
        const newPayload = {
            sub: studentNim,
            nim: studentNim,
            name,
            class: studentClass,
            role: 'student',
            is_verified: isVerified,
            password_changed: true,
        };
        const newToken = jsonwebtoken_1.default.sign(newPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.status(200).json({
            success: true,
            message: 'Password berhasil diubah',
            data: {
                token: newToken,
                user: {
                    nim: studentNim,
                    name,
                    class: studentClass,
                    email: freshEmail,
                    role: 'student',
                    is_verified: isVerified,
                    password_changed: true,
                },
            },
        });
    }
    catch (err) {
        console.error('[Auth Service] changeStudentPassword error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.' });
    }
};
exports.changeStudentPassword = changeStudentPassword;
// ─── Lecturer Login ───────────────────────────────────────────────────────────
const lecturerLogin = async (req, res) => {
    const { nip, password } = req.body;
    if (!nip || !password) {
        res.status(400).json({ success: false, message: 'NIP dan password wajib diisi' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute('SELECT nip, lecturer_name, email, password, is_verified, password_changed, is_active FROM lecturers WHERE nip = ?', [nip]);
        if (!rows || rows.length === 0) {
            res.status(401).json({ success: false, message: 'NIP atau password salah' });
            return;
        }
        const lecturer = rows[0];
        if (lecturer.is_active === 0) {
            res.status(403).json({ success: false, message: 'Akun Anda telah dinonaktifkan oleh Admin.' });
            return;
        }
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
        const isVerified = lecturer.is_verified === 1;
        const passwordChanged = lecturer.password_changed === 1;
        const payload = {
            sub: lecturer.nip,
            nip: lecturer.nip,
            name: lecturer.lecturer_name,
            email: lecturer.email,
            role: 'lecturer',
            is_verified: isVerified,
            password_changed: passwordChanged,
        };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.status(200).json({
            success: true,
            message: 'Login berhasil',
            data: {
                token,
                user: {
                    id: lecturer.nip,
                    nip: lecturer.nip,
                    name: lecturer.lecturer_name,
                    email: lecturer.email,
                    role: 'lecturer',
                    is_verified: isVerified,
                    password_changed: passwordChanged,
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
        const [rows] = await db_1.default.execute('SELECT registration_id, mentor_access_revoked FROM internship_registrations WHERE mentor_email = ? AND status = ?', [email, 'approved']);
        if (!rows || rows.length === 0) {
            res.status(404).json({ success: false, message: 'Email mentor tidak ditemukan atau belum disetujui' });
            return;
        }
        // Pisahkan registrasi yang masih aktif (mentor masih dibutuhkan) vs sudah selesai
        const activeRegistrations = rows.filter((r) => r.mentor_access_revoked === 0);
        // Blokir mentor HANYA jika SEMUA mahasiswa bimbingan sudah upload hasil KP
        if (activeRegistrations.length === 0) {
            res.status(403).json({
                success: false,
                message: 'Akses Anda telah dinonaktifkan karena semua mahasiswa bimbingan Anda telah menyelesaikan proses upload dokumen KP.',
            });
            return;
        }
        // Gunakan registrasi aktif pertama (mentor login per mahasiswa bimbingan)
        const registrationId = activeRegistrations[0].registration_id;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiredAt = new Date(Date.now() + 5 * 60 * 1000);
        await db_1.default.execute('DELETE FROM mentor_otps WHERE registration_id = ?', [registrationId]);
        await db_1.default.execute('INSERT INTO mentor_otps (registration_id, otp_code, expired_at) VALUES (?, ?, ?)', [registrationId, otp, expiredAt]);
        try {
            await (0, emailService_1.sendOtpEmail)(email, otp);
            console.log(`[Auth Service] OTP berhasil dikirim ke email: ${email}`);
        }
        catch (emailErr) {
            console.error(`[Auth Service] Gagal mengirim email ke ${email}:`, emailErr.message);
            console.log(`[Auth Service] FALLBACK OTP untuk ${email}: ${otp}`);
        }
        res.status(200).json({
            success: true,
            message: `Kode OTP telah dikirim ke email ${email}. Silakan cek inbox Anda.`,
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
        await db_1.default.execute('DELETE FROM mentor_otps WHERE otp_id = ?', [otpRow.otp_id]);
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
// ─── Lecturer: Send Verify OTP ────────────────────────────────────────────────
const lecturerSendVerifyOtp = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    let lecturerNip;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.role !== 'lecturer') {
            res.status(403).json({ success: false, message: 'Akses ditolak' });
            return;
        }
        lecturerNip = decoded.nip;
    }
    catch {
        res.status(401).json({ success: false, message: 'Token tidak valid' });
        return;
    }
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ success: false, message: 'Email wajib diisi' });
        return;
    }
    try {
        // Cek apakah email sudah dipakai oleh dosen lain
        const [existing] = await db_1.default.execute('SELECT nip FROM lecturers WHERE email = ? AND nip != ?', [email, lecturerNip]);
        if (existing && existing.length > 0) {
            res.status(409).json({ success: false, message: 'Email ini sudah terdaftar oleh akun dosen lain' });
            return;
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiredAt = new Date(Date.now() + 5 * 60 * 1000);
        await db_1.default.execute('DELETE FROM lecturer_otps WHERE nip = ?', [lecturerNip]);
        await db_1.default.execute('INSERT INTO lecturer_otps (nip, email_target, otp_code, expired_at) VALUES (?, ?, ?, ?)', [lecturerNip, email, otp, expiredAt]);
        try {
            await (0, emailService_1.sendLecturerVerifyOtpEmail)(email, otp);
            console.log(`[Auth Service] OTP verifikasi dosen dikirim ke: ${email}`);
        }
        catch (emailErr) {
            console.error(`[Auth Service] Gagal kirim email ke ${email}:`, emailErr.message);
            console.log(`[Auth Service] FALLBACK OTP dosen untuk ${email}: ${otp}`);
        }
        res.status(200).json({
            success: true,
            message: `Kode OTP telah dikirim ke ${email}. Silakan cek inbox Anda.`,
        });
    }
    catch (err) {
        console.error('[Auth Service] lecturerSendVerifyOtp error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.lecturerSendVerifyOtp = lecturerSendVerifyOtp;
// ─── Lecturer: Verify Email ───────────────────────────────────────────────────
const lecturerVerifyEmail = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    let lecturerNip;
    let lecturerName;
    let passwordChanged;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.role !== 'lecturer') {
            res.status(403).json({ success: false, message: 'Akses ditolak' });
            return;
        }
        lecturerNip = decoded.nip;
        lecturerName = decoded.name;
        passwordChanged = decoded.password_changed === true;
    }
    catch {
        res.status(401).json({ success: false, message: 'Token tidak valid' });
        return;
    }
    const { email, otp } = req.body;
    if (!email || !otp) {
        res.status(400).json({ success: false, message: 'Email dan OTP wajib diisi' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute(`SELECT otp_id, email_target, otp_code, expired_at
       FROM lecturer_otps
       WHERE nip = ? AND email_target = ? AND otp_code = ?
       ORDER BY created_at DESC LIMIT 1`, [lecturerNip, email, otp]);
        if (!rows || rows.length === 0) {
            res.status(401).json({ success: false, message: 'OTP salah atau tidak ditemukan' });
            return;
        }
        const otpRow = rows[0];
        if (new Date() > new Date(otpRow.expired_at)) {
            await db_1.default.execute('DELETE FROM lecturer_otps WHERE otp_id = ?', [otpRow.otp_id]);
            res.status(401).json({ success: false, message: 'OTP sudah kadaluarsa. Kirim OTP baru.' });
            return;
        }
        await db_1.default.execute('DELETE FROM lecturer_otps WHERE otp_id = ?', [otpRow.otp_id]);
        await db_1.default.execute('UPDATE lecturers SET email = ?, is_verified = 1 WHERE nip = ?', [email, lecturerNip]);
        const newPayload = {
            sub: lecturerNip,
            nip: lecturerNip,
            name: lecturerName,
            email,
            role: 'lecturer',
            is_verified: true,
            password_changed: passwordChanged,
        };
        const newToken = jsonwebtoken_1.default.sign(newPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.status(200).json({
            success: true,
            message: 'Email berhasil diverifikasi',
            data: {
                token: newToken,
                user: {
                    nip: lecturerNip,
                    name: lecturerName,
                    email,
                    role: 'lecturer',
                    is_verified: true,
                    password_changed: passwordChanged,
                },
            },
        });
    }
    catch (err) {
        console.error('[Auth Service] lecturerVerifyEmail error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.lecturerVerifyEmail = lecturerVerifyEmail;
// ─── Lecturer: Change Password ────────────────────────────────────────────────
const changeLecturerPassword = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    let lecturerNip;
    let lecturerName;
    let isVerified;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.role !== 'lecturer') {
            res.status(403).json({ success: false, message: 'Akses ditolak' });
            return;
        }
        lecturerNip = decoded.nip;
        lecturerName = decoded.name;
        isVerified = decoded.is_verified === true;
    }
    catch {
        res.status(401).json({ success: false, message: 'Token tidak valid' });
        return;
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, message: 'Password lama dan password baru wajib diisi' });
        return;
    }
    if (newPassword.length < 8) {
        res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter' });
        return;
    }
    if (currentPassword === newPassword) {
        res.status(400).json({ success: false, message: 'Password baru tidak boleh sama dengan password lama' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute('SELECT password, email FROM lecturers WHERE nip = ?', [lecturerNip]);
        if (!rows || rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data dosen tidak ditemukan' });
            return;
        }
        const storedPassword = rows[0].password;
        const freshEmail = rows[0].email;
        let isCurrentPasswordValid = false;
        if (storedPassword.startsWith('$2')) {
            isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, storedPassword);
        }
        else {
            isCurrentPasswordValid = storedPassword === currentPassword;
        }
        if (!isCurrentPasswordValid) {
            res.status(400).json({ success: false, message: 'Password lama yang Anda masukkan salah' });
            return;
        }
        const hashedNew = await bcryptjs_1.default.hash(newPassword, 10);
        await db_1.default.execute('UPDATE lecturers SET password = ?, password_changed = 1 WHERE nip = ?', [hashedNew, lecturerNip]);
        const newPayload = {
            sub: lecturerNip,
            nip: lecturerNip,
            name: lecturerName,
            email: freshEmail,
            role: 'lecturer',
            is_verified: isVerified,
            password_changed: true,
        };
        const newToken = jsonwebtoken_1.default.sign(newPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.status(200).json({
            success: true,
            message: 'Password berhasil diubah',
            data: {
                token: newToken,
                user: {
                    nip: lecturerNip,
                    name: lecturerName,
                    email: freshEmail,
                    role: 'lecturer',
                    is_verified: isVerified,
                    password_changed: true,
                },
            },
        });
    }
    catch (err) {
        console.error('[Auth Service] changeLecturerPassword error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.' });
    }
};
exports.changeLecturerPassword = changeLecturerPassword;
// ─── Admin / PIC Login ──────────────────────────────────────────────────────────────
const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute('SELECT admin_id, username, email, password, full_name, role, is_active FROM admin_users WHERE email = ?', [email]);
        if (!rows || rows.length === 0) {
            res.status(401).json({ success: false, message: 'Email atau password salah' });
            return;
        }
        const admin = rows[0];
        if (!admin.is_active) {
            res.status(403).json({ success: false, message: 'Akun admin tidak aktif. Hubungi administrator.' });
            return;
        }
        const passwordValid = await bcryptjs_1.default.compare(password, admin.password);
        if (!passwordValid) {
            res.status(401).json({ success: false, message: 'Email atau password salah' });
            return;
        }
        const payload = {
            sub: String(admin.admin_id),
            admin_id: admin.admin_id,
            username: admin.username,
            email: admin.email,
            name: admin.full_name,
            role: admin.role,
        };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '8h' });
        res.status(200).json({
            success: true,
            message: 'Login admin berhasil',
            data: {
                token,
                user: {
                    admin_id: admin.admin_id,
                    username: admin.username,
                    email: admin.email,
                    name: admin.full_name,
                    role: admin.role,
                },
            },
        });
    }
    catch (err) {
        console.error('[Auth Service] adminLogin error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server. Silakan coba lagi.' });
    }
};
exports.adminLogin = adminLogin;
// ─── Admin: Ubah Password ────────────────────────────────────────────────────
const changeAdminPassword = async (req, res) => {
    // Ambil admin_id dari Authorization header (JWT)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Token tidak ditemukan.' });
        return;
    }
    const token = authHeader.split(' ')[1];
    let adminId;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (!decoded.admin_id || (decoded.role !== 'admin' && decoded.role !== 'pic')) {
            res.status(403).json({ success: false, message: 'Akses ditolak.' });
            return;
        }
        adminId = decoded.admin_id;
    }
    catch {
        res.status(401).json({ success: false, message: 'Token tidak valid.' });
        return;
    }
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
        res.status(400).json({ success: false, message: 'Password lama dan password baru wajib diisi.' });
        return;
    }
    if (new_password.length < 8) {
        res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter.' });
        return;
    }
    if (old_password === new_password) {
        res.status(400).json({ success: false, message: 'Password baru tidak boleh sama dengan password lama.' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute('SELECT admin_id, password FROM admin_users WHERE admin_id = ?', [adminId]);
        if (!rows || rows.length === 0) {
            res.status(404).json({ success: false, message: 'Admin tidak ditemukan.' });
            return;
        }
        const admin = rows[0];
        const oldValid = await bcryptjs_1.default.compare(old_password, admin.password);
        if (!oldValid) {
            res.status(400).json({ success: false, message: 'Password lama yang Anda masukkan salah.' });
            return;
        }
        const hashedNew = await bcryptjs_1.default.hash(new_password, 12);
        await db_1.default.execute('UPDATE admin_users SET password = ? WHERE admin_id = ?', [hashedNew, adminId]);
        res.status(200).json({ success: true, message: 'Password berhasil diubah.' });
    }
    catch (err) {
        console.error('[Auth Service] changeAdminPassword error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.changeAdminPassword = changeAdminPassword;
