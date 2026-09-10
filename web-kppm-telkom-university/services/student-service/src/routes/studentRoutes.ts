import { Router } from 'express';
import { getProfile, updateProfile, getDashboard, changePassword, getMyGrades } from '../controllers/studentController';
import { submitRegistration, getRegistrations, getRegistrationDetail, getLecturers, getActiveSemesters, cancelRegistration, getLecturerStudents, updateRegistrationStatus, upload, uploadKpDocuments, getKpResults, uploadKpResults, getLecturerKpResults } from '../controllers/kppmController';
import { getMentorDashboard } from '../controllers/mentorController';
import { submitMentorGrade, getMentorGrade, getAllMentorGrades } from '../controllers/mentorGradesController';
import { submitLecturerGrade, getLecturerGrade, getLecturerStudentFullGrades } from '../controllers/lecturerGradesController';
import { verifyToken, verifyMentorToken } from '../middleware/authMiddleware';

const router = Router();

// ─── Student Routes ───────────────────────────────────────────────────────────
router.get('/profile',   verifyToken, getProfile);
router.patch('/profile', verifyToken, updateProfile);
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
router.get('/semesters/active',          verifyToken, getActiveSemesters);

// ─── KP Results Routes ──────────────────────────────────────────────────────────
router.get('/kppm/results',  verifyToken, getKpResults);
router.post('/kppm/results', verifyToken, (req, res, next) => {
  const multerHandler = uploadKpDocuments.fields([
    { name: 'certificate_file',               maxCount: 1 },
    { name: 'field_supervisor_score_file',    maxCount: 1 },
    { name: 'academic_supervisor_score_file', maxCount: 1 },
    { name: 'implementation_agreement_file',  maxCount: 1 },
    { name: 'final_report_file',              maxCount: 1 },
  ]);
  multerHandler(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'Ukuran file melebihi batas maksimum 5 MB. Kompres file Anda lalu coba lagi.',
        });
      }
      return res.status(400).json({
        success: false,
        message: `Gagal memproses file: ${err.message}`,
      });
    }
    next();
  });
}, uploadKpResults);

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
router.get('/lecturer/kp-results',                       verifyToken, getLecturerKpResults);

// ─── Mentor Routes ───────────────────────────────────────────────────────────
// GET  /student/mentor/dashboard           — data mahasiswa yang dibimbing
// GET  /student/mentor/grades              — semua nilai yang sudah diinput
// GET  /student/mentor/grades/:id          — nilai satu mahasiswa
// POST /student/mentor/grades/:id          — submit / update nilai mahasiswa
router.get('/mentor/dashboard',               verifyMentorToken, getMentorDashboard);
router.get('/mentor/grades',                  verifyMentorToken, getAllMentorGrades);
router.get('/mentor/grades/:registration_id', verifyMentorToken, getMentorGrade);
router.post('/mentor/grades/:registration_id', verifyMentorToken, submitMentorGrade);

export default router;
