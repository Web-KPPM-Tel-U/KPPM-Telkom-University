import { Router } from 'express';
import {
  studentLogin,
  lecturerLogin,
  changeLecturerPassword,
  mentorSendOtp,
  mentorVerifyOtp,
  logout,
} from '../controllers/authController';

const router = Router();

// Mahasiswa
router.post('/student/login', studentLogin);

// Dosen
router.post('/lecturer/login', lecturerLogin);
router.patch('/lecturer/change-password', changeLecturerPassword);

// Mentor
router.post('/mentor/send-otp', mentorSendOtp);
router.post('/mentor/verify-otp', mentorVerifyOtp);

// Logout (semua role)
router.post('/logout', logout);

export default router;
