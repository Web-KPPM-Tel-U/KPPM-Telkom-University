"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const studentController_1 = require("../controllers/studentController");
const kppmController_1 = require("../controllers/kppmController");
const mentorController_1 = require("../controllers/mentorController");
const mentorGradesController_1 = require("../controllers/mentorGradesController");
const lecturerGradesController_1 = require("../controllers/lecturerGradesController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// ─── Student Routes ───────────────────────────────────────────────────────────
router.get('/profile', authMiddleware_1.verifyToken, studentController_1.getProfile);
router.patch('/profile', authMiddleware_1.verifyToken, studentController_1.updateProfile);
router.get('/dashboard', authMiddleware_1.verifyToken, studentController_1.getDashboard);
router.get('/grades', authMiddleware_1.verifyToken, studentController_1.getMyGrades);
router.patch('/change-password', authMiddleware_1.verifyToken, studentController_1.changePassword);
// ─── KPPM Registration Routes ─────────────────────────────────────────────────
// POST   /student/kppm/register           — submit form pendaftaran KPPM (dengan upload file)
// GET    /student/kppm/registrations      — riwayat pendaftaran mahasiswa
// GET    /student/kppm/registrations/:id  — detail satu pendaftaran
router.post('/kppm/register', authMiddleware_1.verifyToken, kppmController_1.upload.single('surat_toss'), kppmController_1.submitRegistration);
router.get('/kppm/registrations', authMiddleware_1.verifyToken, kppmController_1.getRegistrations);
router.get('/kppm/registrations/:id', authMiddleware_1.verifyToken, kppmController_1.getRegistrationDetail);
router.delete('/kppm/registrations/:id', authMiddleware_1.verifyToken, kppmController_1.cancelRegistration);
router.get('/lecturers', authMiddleware_1.verifyToken, kppmController_1.getLecturers);
router.get('/semesters/active', authMiddleware_1.verifyToken, kppmController_1.getActiveSemesters);
// ─── KP Results Routes ──────────────────────────────────────────────────────────
router.get('/kppm/results', authMiddleware_1.verifyToken, kppmController_1.getKpResults);
router.post('/kppm/results', authMiddleware_1.verifyToken, (req, res, next) => {
    const multerHandler = kppmController_1.uploadKpDocuments.fields([
        { name: 'certificate_file', maxCount: 1 },
        { name: 'field_supervisor_score_file', maxCount: 1 },
        { name: 'academic_supervisor_score_file', maxCount: 1 },
        { name: 'implementation_agreement_file', maxCount: 1 },
        { name: 'final_report_file', maxCount: 1 },
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
}, kppmController_1.uploadKpResults);
// ─── Lecturer Routes ──────────────────────────────────────────────────────────
// GET   /student/lecturer/students              — daftar mahasiswa bimbingan + status pengajuan
// PATCH /student/lecturer/registrations/:id/status — approve atau reject pengajuan
// GET   /student/lecturer/grades/:id            — ambil nilai satu mahasiswa
// POST  /student/lecturer/grades/:id            — submit / update nilai mahasiswa
router.get('/lecturer/students', authMiddleware_1.verifyToken, kppmController_1.getLecturerStudents);
router.patch('/lecturer/registrations/:id/status', authMiddleware_1.verifyToken, kppmController_1.updateRegistrationStatus);
router.get('/lecturer/grades/:registration_id', authMiddleware_1.verifyToken, lecturerGradesController_1.getLecturerGrade);
router.post('/lecturer/grades/:registration_id', authMiddleware_1.verifyToken, lecturerGradesController_1.submitLecturerGrade);
router.get('/lecturer/student-grades/:registration_id', authMiddleware_1.verifyToken, lecturerGradesController_1.getLecturerStudentFullGrades);
router.get('/lecturer/kp-results', authMiddleware_1.verifyToken, kppmController_1.getLecturerKpResults);
// ─── Mentor Routes ───────────────────────────────────────────────────────────
// GET  /student/mentor/dashboard           — data mahasiswa yang dibimbing
// GET  /student/mentor/grades              — semua nilai yang sudah diinput
// GET  /student/mentor/grades/:id          — nilai satu mahasiswa
// POST /student/mentor/grades/:id          — submit / update nilai mahasiswa
router.get('/mentor/dashboard', authMiddleware_1.verifyMentorToken, mentorController_1.getMentorDashboard);
router.get('/mentor/grades', authMiddleware_1.verifyMentorToken, mentorGradesController_1.getAllMentorGrades);
router.get('/mentor/grades/:registration_id', authMiddleware_1.verifyMentorToken, mentorGradesController_1.getMentorGrade);
router.post('/mentor/grades/:registration_id', authMiddleware_1.verifyMentorToken, mentorGradesController_1.submitMentorGrade);
exports.default = router;
