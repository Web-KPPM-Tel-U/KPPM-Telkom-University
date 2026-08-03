import { Router } from 'express';
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
} from '../controllers/authController';

const router = Router();

// ─── Mahasiswa ────────────────────────────────────────────────────────────────
router.post('/student/login', studentLogin);
router.post('/student/send-verify-otp', studentSendVerifyOtp);
router.post('/student/verify-email', studentVerifyEmail);
router.patch('/student/change-password', changeStudentPassword);

// ─── Dosen ────────────────────────────────────────────────────────────────────
router.post('/lecturer/login', lecturerLogin);
router.post('/lecturer/send-verify-otp',  lecturerSendVerifyOtp);
router.post('/lecturer/verify-email',     lecturerVerifyEmail);
router.patch('/lecturer/change-password', changeLecturerPassword);

// ─── Mentor ───────────────────────────────────────────────────────────────────
router.post('/mentor/send-otp', mentorSendOtp);
router.post('/mentor/verify-otp', mentorVerifyOtp);

// ─── Logout (semua role) ──────────────────────────────────────────────────────
router.post('/logout', logout);

export default router;
