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
} from '../controllers/authController';

const router = Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────

// Login: maks 10 percobaan per 15 menit per IP (anti brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
});

// OTP: maks 10 permintaan OTP per 15 menit per IP (anti OTP spam)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak permintaan OTP. Coba lagi dalam 15 menit.' },
});

// Password change: maks 5 permintaan per 15 menit
const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
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

// ─── Logout (semua role) ──────────────────────────────────────────────────────
router.post('/logout', logout);

// ─── Admin / PIC ──────────────────────────────────────────────────────────────
router.post('/admin/login', loginLimiter, adminLogin);

export default router;
