import { Router } from 'express';
import { getProfile, getDashboard, changePassword, getMyGrades } from '../controllers/studentController';
import { submitRegistration, getRegistrations, getRegistrationDetail, getLecturers, cancelRegistration, getLecturerStudents, updateRegistrationStatus, upload } from '../controllers/kppmController';
import { getMentorDashboard } from '../controllers/mentorController';
import { submitMentorGrade, getMentorGrade, getAllMentorGrades } from '../controllers/mentorGradesController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// ─── Student Routes ───────────────────────────────────────────────────────────
router.get('/profile',   verifyToken, getProfile);
router.get('/dashboard', verifyToken, getDashboard);
router.get('/grades',    verifyToken, getMyGrades);
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
// GET  /student/mentor/dashboard           — data mahasiswa yang dibimbing
// GET  /student/mentor/grades              — semua nilai yang sudah diinput
// GET  /student/mentor/grades/:id          — nilai satu mahasiswa
// POST /student/mentor/grades/:id          — submit / update nilai mahasiswa
router.get('/mentor/dashboard',              verifyToken, getMentorDashboard);
router.get('/mentor/grades',                 verifyToken, getAllMentorGrades);
router.get('/mentor/grades/:registration_id', verifyToken, getMentorGrade);
router.post('/mentor/grades/:registration_id', verifyToken, submitMentorGrade);

export default router;

