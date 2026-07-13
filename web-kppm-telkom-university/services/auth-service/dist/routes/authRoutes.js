"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
// Mahasiswa
router.post('/student/login', authController_1.studentLogin);
// Dosen
router.post('/lecturer/login', authController_1.lecturerLogin);
// Mentor
router.post('/mentor/send-otp', authController_1.mentorSendOtp);
router.post('/mentor/verify-otp', authController_1.mentorVerifyOtp);
// Logout (semua role)
router.post('/logout', authController_1.logout);
exports.default = router;
