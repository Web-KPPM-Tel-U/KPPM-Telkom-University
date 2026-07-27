import { Router } from 'express';
import { getProfile, getDashboard, changePassword } from '../controllers/studentController';
import { submitRegistration, getRegistrations, getRegistrationDetail, getLecturers, cancelRegistration, getLecturerStudents, updateRegistrationStatus, upload } from '../controllers/kppmController';
import { getMentorDashboard } from '../controllers/mentorController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// ─── Student Routes ───────────────────────────────────────────────────────────
router.get('/profile',   verifyToken, getProfile);
router.get('/dashboard', verifyToken, getDashboard);
router.patch('/change-password', verifyToken, changePassword);

// ─── KPPM Registration Routes ─────────────────────────────────────────────────
// POST   /student/kppm/register           — submit form pendaftaran KPPM (dengan upload file)
// GET    /student/kppm/registrations      — riwayat pendaftaran mahasiswa
// GET    /student/kppm/registrations/:id  — detail satu pendaftaran
router.post('/kppm/register',           verifyToken, upload.single('surat_toss'), submitRegistration);
router.get('/kppm/registrations',       verifyToken, getRegistrations);
router.get('/kppm/registrations/:id',    verifyToken, getRegistrationDetail);
router.delete('/kppm/registrations/:id', verifyToken, cancelRegistration);
router.get('/lecturers',                 verifyToken, getLecturers);

// ─── Lecturer Routes ──────────────────────────────────────────────────────────
// GET   /student/lecturer/students              — daftar mahasiswa bimbingan + status pengajuan
// PATCH /student/lecturer/registrations/:id/status — approve atau reject pengajuan
router.get('/lecturer/students',                        verifyToken, getLecturerStudents);
router.patch('/lecturer/registrations/:id/status',      verifyToken, updateRegistrationStatus);

// ─── Mentor Routes ───────────────────────────────────────────────────────────
// GET /student/mentor/dashboard — data mahasiswa yang dibimbing mentor (role: mentor)
router.get('/mentor/dashboard', verifyToken, getMentorDashboard);

export default router;

