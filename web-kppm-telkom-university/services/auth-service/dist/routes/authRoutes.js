"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authController_1 = require("../controllers/authController");
const forgotPasswordController_1 = require("../controllers/forgotPasswordController");
const router = (0, express_1.Router)();
// ─── Rate Limiters ────────────────────────────────────────────────────────────
// Login: maks 30 percobaan per 15 menit per IP
// (tester bisa coba login berkali-kali, tetap ketat untuk brute-force yang butuh ribuan percobaan)
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
});
// OTP: maks 20 permintaan OTP per 15 menit per IP
const otpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Terlalu banyak permintaan OTP. Coba lagi dalam 15 menit.' },
});
// Password change: maks 10 permintaan per 15 menit
const passwordLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Terlalu banyak permintaan. Coba lagi dalam 15 menit.' },
});
// ─── Mahasiswa ────────────────────────────────────────────────────────────────
router.post('/student/login', loginLimiter, authController_1.studentLogin);
router.post('/student/send-verify-otp', otpLimiter, authController_1.studentSendVerifyOtp);
router.post('/student/verify-email', otpLimiter, authController_1.studentVerifyEmail);
router.patch('/student/change-password', passwordLimiter, authController_1.changeStudentPassword);
// ─── Dosen ────────────────────────────────────────────────────────────────────
router.post('/lecturer/login', loginLimiter, authController_1.lecturerLogin);
router.post('/lecturer/send-verify-otp', otpLimiter, authController_1.lecturerSendVerifyOtp);
router.post('/lecturer/verify-email', otpLimiter, authController_1.lecturerVerifyEmail);
router.patch('/lecturer/change-password', passwordLimiter, authController_1.changeLecturerPassword);
// ─── Mentor ───────────────────────────────────────────────────────────────────
router.post('/mentor/send-otp', otpLimiter, authController_1.mentorSendOtp);
router.post('/mentor/verify-otp', loginLimiter, authController_1.mentorVerifyOtp);
// ─── Forgot Password Routes ───────────────────────────────────────────────────
router.post('/forgot-password/send-otp', forgotPasswordController_1.forgotPasswordSendOtp);
router.post('/forgot-password/verify-reset', forgotPasswordController_1.forgotPasswordVerifyReset);
// ─── Logout (semua role) ──────────────────────────────────────────────────────
router.post('/logout', authController_1.logout);
// ─── Admin / PIC ──────────────────────────────────────────────────────────────
router.post('/admin/login', loginLimiter, authController_1.adminLogin);
router.patch('/admin/change-password', passwordLimiter, authController_1.changeAdminPassword);
exports.default = router;
