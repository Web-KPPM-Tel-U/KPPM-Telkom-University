"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Multer in-memory untuk inject CSV/XLSX (max 5 MB)
const uploadInMemory = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
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
        }
        else {
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
router.get('/stats', authMiddleware_1.verifyAdminToken, adminController_1.getAdminStats);
router.get('/lecturers', authMiddleware_1.verifyAdminToken, adminController_1.getAdminLecturers);
router.get('/students', authMiddleware_1.verifyAdminToken, adminController_1.getAdminStudents);
router.get('/semesters', authMiddleware_1.verifyAdminToken, adminController_1.getAdminSemesters);
router.get('/export/grades', authMiddleware_1.verifyAdminToken, adminController_1.exportGradesBySemester);
router.get('/export/preview', authMiddleware_1.verifyAdminToken, adminController_1.getPreviewGrades);
router.post('/students/add', authMiddleware_1.verifyAdminToken, adminController_1.createStudent);
router.post('/lecturers/add', authMiddleware_1.verifyAdminToken, adminController_1.createLecturer);
router.post('/inject/students', authMiddleware_1.verifyAdminToken, uploadInMemory.single('file'), adminController_1.injectStudents);
router.post('/inject/lecturers', authMiddleware_1.verifyAdminToken, uploadInMemory.single('file'), adminController_1.injectLecturers);
router.patch('/lecturers/:nip', authMiddleware_1.verifyAdminToken, adminController_1.updateLecturer);
router.patch('/students/:nim', authMiddleware_1.verifyAdminToken, adminController_1.updateStudent);
router.patch('/lecturers/:nip/toggle-status', authMiddleware_1.verifyAdminToken, adminController_1.toggleLecturerStatus);
router.patch('/students/:nim/toggle-status', authMiddleware_1.verifyAdminToken, adminController_1.toggleStudentStatus);
router.patch('/students/:nim/assign-lecturer', authMiddleware_1.verifyAdminToken, adminController_1.assignLecturerToStudent);
router.post('/semesters', authMiddleware_1.verifyAdminToken, adminController_1.createSemester);
router.patch('/semesters/:id/toggle-status', authMiddleware_1.verifyAdminToken, adminController_1.toggleSemesterStatus);
exports.default = router;
