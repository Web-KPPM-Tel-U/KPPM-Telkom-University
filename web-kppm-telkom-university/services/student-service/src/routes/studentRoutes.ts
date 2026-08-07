import { Router } from 'express';
import multer from 'multer';
import { getProfile, getDashboard, changePassword, getMyGrades } from '../controllers/studentController';
import { submitRegistration, getRegistrations, getRegistrationDetail, getLecturers, cancelRegistration, getLecturerStudents, updateRegistrationStatus, upload } from '../controllers/kppmController';
import { getMentorDashboard } from '../controllers/mentorController';
import { submitMentorGrade, getMentorGrade, getAllMentorGrades } from '../controllers/mentorGradesController';
import { submitLecturerGrade, getLecturerGrade, getLecturerStudentFullGrades } from '../controllers/lecturerGradesController';
import { getAdminStats, getAdminLecturers, getAdminStudents, getAdminSemesters, injectStudents, injectLecturers } from '../controllers/adminController';
import { verifyToken, verifyAdminToken } from '../middleware/authMiddleware';

const router = Router();

// Multer in-memory untuk inject CSV/XLSX (max 5 MB)
const uploadInMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream',
    ];
    const ext = file.originalname.toLowerCase();
    if (allowed.includes(file.mimetype) || ext.endsWith('.csv') || ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file CSV atau XLSX yang diizinkan.'));
    }
  },
});

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
// GET   /student/lecturer/grades/:id            — ambil nilai satu mahasiswa
// POST  /student/lecturer/grades/:id            — submit / update nilai mahasiswa
router.get('/lecturer/students',                        verifyToken, getLecturerStudents);
router.patch('/lecturer/registrations/:id/status',      verifyToken, updateRegistrationStatus);
router.get('/lecturer/grades/:registration_id',          verifyToken, getLecturerGrade);
router.post('/lecturer/grades/:registration_id',         verifyToken, submitLecturerGrade);
router.get('/lecturer/student-grades/:registration_id',  verifyToken, getLecturerStudentFullGrades);

// ─── Mentor Routes ───────────────────────────────────────────────────────────
// GET  /student/mentor/dashboard           — data mahasiswa yang dibimbing
// GET  /student/mentor/grades              — semua nilai yang sudah diinput
// GET  /student/mentor/grades/:id          — nilai satu mahasiswa
// POST /student/mentor/grades/:id          — submit / update nilai mahasiswa
router.get('/mentor/dashboard',              verifyToken, getMentorDashboard);
router.get('/mentor/grades',                 verifyToken, getAllMentorGrades);
router.get('/mentor/grades/:registration_id', verifyToken, getMentorGrade);
router.post('/mentor/grades/:registration_id', verifyToken, submitMentorGrade);

// ─── Admin / PIC Routes ─────────────────────────────────────
// GET  /admin/stats               — statistik ringkasan
// GET  /admin/lecturers           — daftar semua dosen
// GET  /admin/students            — daftar semua mahasiswa
// GET  /admin/semesters           — daftar kode semester
// POST /admin/inject/students     — import mahasiswa dari CSV/XLSX
// POST /admin/inject/lecturers    — import dosen dari CSV/XLSX
router.get('/admin/stats',                   verifyAdminToken, getAdminStats);
router.get('/admin/lecturers',               verifyAdminToken, getAdminLecturers);
router.get('/admin/students',                verifyAdminToken, getAdminStudents);
router.get('/admin/semesters',               verifyAdminToken, getAdminSemesters);
router.post('/admin/inject/students',  verifyAdminToken, uploadInMemory.single('file'), injectStudents);
router.post('/admin/inject/lecturers', verifyAdminToken, uploadInMemory.single('file'), injectLecturers);

export default router;
