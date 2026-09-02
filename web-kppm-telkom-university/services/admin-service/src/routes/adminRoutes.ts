import { Router } from 'express';
import multer from 'multer';
import {
  getAdminStats,
  getAdminLecturers,
  getAdminStudents,
  getAdminSemesters,
  injectStudents,
  injectLecturers,
  updateLecturer,
  toggleLecturerStatus,
  toggleStudentStatus,
  createSemester,
  toggleSemesterStatus,
  createStudent,
  createLecturer,
  updateStudent,
  assignLecturerToStudent,
  exportGradesBySemester,
  getPreviewGrades,
} from '../controllers/adminController';
import { verifyAdminToken } from '../middleware/authMiddleware';

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

// ─── Admin / PIC Routes ─────────────────────────────────────────────────────
// GET  /admin/stats               — statistik ringkasan
// GET  /admin/lecturers           — daftar semua dosen
// GET  /admin/students            — daftar semua mahasiswa
// GET  /admin/semesters           — daftar kode semester
// POST /admin/inject/students     — import mahasiswa dari CSV/XLSX
// POST /admin/inject/lecturers    — import dosen dari CSV/XLSX
router.get('/stats',                              verifyAdminToken, getAdminStats);
router.get('/lecturers',                          verifyAdminToken, getAdminLecturers);
router.get('/students',                           verifyAdminToken, getAdminStudents);
router.get('/semesters',                          verifyAdminToken, getAdminSemesters);
router.get('/export/grades',                      verifyAdminToken, exportGradesBySemester);
router.get('/export/preview',                     verifyAdminToken, getPreviewGrades);
router.post('/students/add',                      verifyAdminToken, createStudent);
router.post('/lecturers/add',                     verifyAdminToken, createLecturer);
router.post('/inject/students',  verifyAdminToken, uploadInMemory.single('file'), injectStudents);
router.post('/inject/lecturers', verifyAdminToken, uploadInMemory.single('file'), injectLecturers);
router.patch('/lecturers/:nip',               verifyAdminToken, updateLecturer);
router.patch('/students/:nim',                verifyAdminToken, updateStudent);
router.patch('/lecturers/:nip/toggle-status', verifyAdminToken, toggleLecturerStatus);
router.patch('/students/:nim/toggle-status',  verifyAdminToken, toggleStudentStatus);
router.patch('/students/:nim/assign-lecturer', verifyAdminToken, assignLecturerToStudent);
router.post('/semesters',                     verifyAdminToken, createSemester);
router.patch('/semesters/:id/toggle-status',  verifyAdminToken, toggleSemesterStatus);

export default router;
