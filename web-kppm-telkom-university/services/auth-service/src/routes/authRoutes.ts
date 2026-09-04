import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  studentLogin,
  studentSendVerifyOtp,
  studentVerifyEmail,
  changeStudentPassword,
  lecturerLogin,
  lecturerSendVerifyOtp,
  lecturerVerifyEmail,
  changeLecturerPassword,
  mentorSendOtp,
  mentorVerifyOtp,
  logout,
  adminLogin,
  changeAdminPassword,
} from '../controllers/authController';
import { forgotPasswordSendOtp, forgotPasswordVerifyReset } from '../controllers/forgotPasswordController';

const router = Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────

// Login: maks 30 percobaan per 15 menit per IP
// (tester bisa coba login berkali-kali, tetap ketat untuk brute-force yang butuh ribuan percobaan)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
});

// OTP: maks 20 permintaan OTP per 15 menit per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak permintaan OTP. Coba lagi dalam 15 menit.' },
});

// Password change: maks 10 permintaan per 15 menit
const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak permintaan. Coba lagi dalam 15 menit.' },
});

// ─── Mahasiswa ────────────────────────────────────────────────────────────────
router.post('/student/login',           loginLimiter,    studentLogin);
router.post('/student/send-verify-otp', otpLimiter,      studentSendVerifyOtp);
router.post('/student/verify-email',    otpLimiter,      studentVerifyEmail);
router.patch('/student/change-password', passwordLimiter, changeStudentPassword);

// ─── Dosen ────────────────────────────────────────────────────────────────────
router.post('/lecturer/login',           loginLimiter,    lecturerLogin);
router.post('/lecturer/send-verify-otp', otpLimiter,      lecturerSendVerifyOtp);
router.post('/lecturer/verify-email',    otpLimiter,      lecturerVerifyEmail);
router.patch('/lecturer/change-password', passwordLimiter, changeLecturerPassword);

// ─── Mentor ───────────────────────────────────────────────────────────────────
router.post('/mentor/send-otp',   otpLimiter,   mentorSendOtp);
router.post('/mentor/verify-otp', loginLimiter, mentorVerifyOtp);

// ─── Forgot Password Routes ───────────────────────────────────────────────────
router.post('/forgot-password/send-otp', forgotPasswordSendOtp);
router.post('/forgot-password/verify-reset', forgotPasswordVerifyReset);

// ─── Logout (semua role) ──────────────────────────────────────────────────────
router.post('/logout', logout);

// ─── Admin / PIC ──────────────────────────────────────────────────────────────
router.post('/admin/login', loginLimiter, adminLogin);
router.patch('/admin/change-password', passwordLimiter, changeAdminPassword);

export default router;
