"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLecturerKpResults = exports.uploadKpResults = exports.getKpResults = exports.updateRegistrationStatus = exports.getLecturerStudents = exports.cancelRegistration = exports.getActiveSemesters = exports.getLecturers = exports.getRegistrationDetail = exports.getRegistrations = exports.submitRegistration = exports.uploadKpDocuments = exports.upload = void 0;
require("dotenv/config");
const db_1 = __importDefault(require("../config/db"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// ─── Multer Storage Config (TOSS Cover Letter) ───────────────────────────────
const uploadDir = path_1.default.join(__dirname, '../../uploads/toss');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `toss-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Format file tidak didukung. Gunakan PDF, JPG, atau PNG.'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
// ─── Multer Storage Config (KP Results Documents) ────────────────────────────
const kpResultsUploadDir = path_1.default.join(__dirname, '../../uploads/kp-results');
if (!fs_1.default.existsSync(kpResultsUploadDir)) {
    fs_1.default.mkdirSync(kpResultsUploadDir, { recursive: true });
}
const kpResultsStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, kpResultsUploadDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `kp-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    },
});
const kpResultsFileFilter = (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Format file tidak didukung. Gunakan PDF, JPG, atau PNG.'));
    }
};
exports.uploadKpDocuments = (0, multer_1.default)({
    storage: kpResultsStorage,
    fileFilter: kpResultsFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
});
// ─── Submit Pendaftaran KPPM ──────────────────────────────────────────────────
/**
 * POST /student/kppm/register
 * Body (multipart/form-data):
 *   - kode_semester   : string  → semester_code
 *   - whatsapp        : string  → whatsapp_number
 *   - perusahaan      : string  → company_name
 *   - posisi_divisi   : string  → internship_position
 *   - tanggal_mulai   : string  → internship_start (YYYY-MM-DD)
 *   - tanggal_akhir   : string  → internship_end   (YYYY-MM-DD)
 *   - mentor_name     : string
 *   - mentor_position : string
 *   - mentor_email    : string
 *   - mentor_phone    : string
 *   - surat_toss      : File (PDF / JPG / PNG, max 5 MB) → toss_cover_letter_file
 *
 * lecturer_id di-assign otomatis dari dosen yang tersedia di sistem.
 */
const submitRegistration = async (req, res) => {
    const nim = req.user?.nim || String(req.user?.sub || '');
    if (!nim) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    const { kode_semester, whatsapp, perusahaan, posisi_divisi, tanggal_mulai, tanggal_akhir, mentor_name, mentor_nip, mentor_position, mentor_email, mentor_phone, } = req.body;
    // Validasi field wajib
    const requiredFields = {
        kode_semester,
        whatsapp,
        perusahaan,
        posisi_divisi,
        tanggal_mulai,
        tanggal_akhir,
        mentor_name,
        mentor_nip,
        mentor_position,
        mentor_email,
        mentor_phone,
    };
    const missingFields = Object.entries(requiredFields)
        .filter(([, v]) => !v || String(v).trim() === '')
        .map(([k]) => k);
    if (missingFields.length > 0) {
        res.status(400).json({
            success: false,
            message: `Field berikut wajib diisi: ${missingFields.join(', ')}`,
        });
        return;
    }
    if (!req.file) {
        res.status(400).json({
            success: false,
            message: 'Surat pengantar TOSS wajib diupload.',
        });
        return;
    }
    // Validasi tanggal
    const start = new Date(tanggal_mulai);
    const end = new Date(tanggal_akhir);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({ success: false, message: 'Format tanggal tidak valid.' });
        return;
    }
    if (end < start) {
        res.status(400).json({
            success: false,
            message: 'Tanggal berakhir tidak boleh sebelum tanggal mulai.',
        });
        return;
    }
    // Validasi No. WhatsApp — hanya angka, panjang 9-15 digit
    const phoneRegex = /^\d+$/;
    const whatsappClean = String(whatsapp).trim();
    if (!phoneRegex.test(whatsappClean)) {
        res.status(400).json({ success: false, message: 'Nomor WhatsApp hanya boleh berisi angka.' });
        return;
    }
    if (whatsappClean.length < 9) {
        res.status(400).json({ success: false, message: 'Nomor WhatsApp terlalu pendek (minimal 9 digit).' });
        return;
    }
    if (whatsappClean.length > 15) {
        res.status(400).json({ success: false, message: 'Nomor WhatsApp tidak boleh melebihi 15 digit.' });
        return;
    }
    // Validasi No. Telepon Pembimbing — hanya angka, panjang 9-15 digit
    const mentorPhoneClean = String(mentor_phone).trim();
    if (!phoneRegex.test(mentorPhoneClean)) {
        res.status(400).json({ success: false, message: 'Nomor telepon pembimbing hanya boleh berisi angka.' });
        return;
    }
    if (mentorPhoneClean.length < 9) {
        res.status(400).json({ success: false, message: 'Nomor telepon pembimbing terlalu pendek (minimal 9 digit).' });
        return;
    }
    if (mentorPhoneClean.length > 15) {
        res.status(400).json({ success: false, message: 'Nomor telepon pembimbing tidak boleh melebihi 15 digit.' });
        return;
    }
    // Validasi Email Pembimbing — harus mengandung @
    if (!String(mentor_email).trim().includes('@')) {
        res.status(400).json({ success: false, message: 'Email pembimbing tidak valid. Harus mengandung karakter @.' });
        return;
    }
    // Path file TOSS yang akan disimpan di DB
    const tossFilePath = `/uploads/toss/${req.file.filename}`;
    try {
        // Cek apakah mahasiswa sudah punya pengajuan AKTIF
        // cancelled & rejected dianggap selesai — mahasiswa boleh mengajukan lagi
        const [existingRows] = await db_1.default.execute(`SELECT registration_id, status
       FROM internship_registrations
       WHERE nim = ? AND status NOT IN ('cancelled', 'rejected')
       LIMIT 1`, [nim]);
        if (existingRows && existingRows.length > 0) {
            res.status(409).json({
                success: false,
                message: 'Anda sudah memiliki pengajuan KPPM yang aktif. Jika Anda ingin mengajukan ulang atau terdapat kekeliruan data, silakan hubungi Admin KPPM.',
            });
            return;
        }
        // Lookup dosen yang di-assign ke mahasiswa ini (via assigned_lecturer_code)
        const [studentRows] = await db_1.default.execute(`SELECT s.assigned_lecturer_code, l.nip AS lecturer_nip, l.lecturer_name
       FROM students s
       LEFT JOIN lecturers l ON l.lecturer_code = s.assigned_lecturer_code
       WHERE s.nim = ?`, [nim]);
        if (!studentRows || studentRows.length === 0) {
            res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan.' });
            return;
        }
        if (!studentRows[0].assigned_lecturer_code || !studentRows[0].lecturer_nip) {
            res.status(403).json({
                success: false,
                message: 'Dosen pembimbing belum ditentukan. Hubungi admin KPPM untuk mendapatkan dosen pembimbing sebelum melakukan pengajuan.',
            });
            return;
        }
        const assignedLecturerNip = studentRows[0].lecturer_nip;
        // Insert pendaftaran ke tabel internship_registrations
        // Status langsung 'approved' — tidak ada proses approval dosen PA
        const [result] = await db_1.default.execute(`INSERT INTO internship_registrations
         (nim, lecturer_nip, semester_code, whatsapp_number,
          company_name, internship_position,
          internship_start, internship_end,
          toss_cover_letter_file,
          mentor_name, mentor_nip, mentor_position, mentor_email, mentor_phone,
          status, submitted_at, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', NOW(), NOW())`, [
            nim,
            assignedLecturerNip,
            kode_semester.trim(),
            whatsapp.trim(),
            perusahaan.trim(),
            posisi_divisi.trim(),
            tanggal_mulai,
            tanggal_akhir,
            tossFilePath,
            mentor_name.trim(),
            String(mentor_nip || '').trim(),
            mentor_position.trim(),
            mentor_email.trim(),
            mentor_phone.trim(),
        ]);
        res.status(201).json({
            success: true,
            message: 'Pendaftaran KPPM berhasil dikirim dan langsung disetujui. Selamat menjalankan KP/Magang!',
            data: {
                registration_id: result.insertId,
                status: 'approved',
                assigned_lecturer: assignedLecturerNip,
                submitted_at: new Date().toISOString(),
                approved_at: new Date().toISOString(),
            },
        });
    }
    catch (err) {
        console.error('[KPPM] submitRegistration error:', err.message);
        // MySQL ER_DUP_ENTRY (errno 1062) — terjadi jika ada UNIQUE CONSTRAINT di DB
        // (misal: uq_student_semester). Tampilkan pesan yang ramah, bukan error 500.
        if (err.errno === 1062 || err.code === 'ER_DUP_ENTRY') {
            res.status(409).json({
                success: false,
                message: 'Anda sudah memiliki pendaftaran KPPM aktif untuk semester ini. Tidak dapat mengajukan duplikat.',
            });
            return;
        }
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.submitRegistration = submitRegistration;
// ─── Get Riwayat Pendaftaran KPPM ────────────────────────────────────────────
/**
 * GET /student/kppm/registrations
 * Query params (opsional):
 *   - limit  : number (default 10, max 100)
 *   - offset : number (default 0)
 */
const getRegistrations = async (req, res) => {
    const nim = req.user?.nim || String(req.user?.sub || '');
    if (!nim) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const offset = Number(req.query.offset) || 0;
    try {
        const [rows] = await db_1.default.execute(`SELECT registration_id, semester_code, company_name, internship_position,
              internship_start, internship_end, status,
              submitted_at, approved_at, cancelled_at, created_at
       FROM internship_registrations
       WHERE nim = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`, [nim, limit, offset]);
        const [countRows] = await db_1.default.execute('SELECT COUNT(*) AS total FROM internship_registrations WHERE nim = ?', [nim]);
        res.status(200).json({
            success: true,
            data: rows,
            meta: {
                total: countRows[0]?.total ?? 0,
                limit,
                offset,
            },
        });
    }
    catch (err) {
        console.error('[KPPM] getRegistrations error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.getRegistrations = getRegistrations;
// ─── Get Detail Pendaftaran KPPM ──────────────────────────────────────────────
/**
 * GET /student/kppm/registrations/:id
 */
const getRegistrationDetail = async (req, res) => {
    const nim = req.user?.nim || String(req.user?.sub || '');
    const registrationId = Number(req.params.id);
    if (!nim) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    if (isNaN(registrationId)) {
        res.status(400).json({ success: false, message: 'ID pendaftaran tidak valid.' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute(`SELECT r.registration_id, r.semester_code, r.whatsapp_number,
              r.company_name, r.internship_position,
              r.internship_start, r.internship_end,
              r.toss_cover_letter_file,
              r.mentor_name, r.mentor_nip, r.mentor_position, r.mentor_email, r.mentor_phone,
              r.status, r.submitted_at, r.approved_at, r.cancelled_at, r.created_at,
              l.lecturer_name AS pembimbing_akademik,
              s.nim, s.student_name, s.class AS student_class, s.email AS student_email
       FROM internship_registrations r
       LEFT JOIN lecturers l ON l.nip = r.lecturer_nip
       LEFT JOIN students  s ON s.nim  = r.nim
       WHERE r.registration_id = ? AND r.nim = ?`, [registrationId, nim]);
        if (!rows || rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data pendaftaran tidak ditemukan.' });
            return;
        }
        res.status(200).json({ success: true, data: rows[0] });
    }
    catch (err) {
        console.error('[KPPM] getRegistrationDetail error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.getRegistrationDetail = getRegistrationDetail;
// ─── Get Daftar Dosen Pembimbing ──────────────────────────────────────────────
/**
 * GET /student/lecturers
 * Mengembalikan list dosen untuk ditampilkan sebagai dropdown di form pendaftaran.
 */
const getLecturers = async (_req, res) => {
    try {
        const [rows] = await db_1.default.execute('SELECT nip, lecturer_name FROM lecturers ORDER BY lecturer_name ASC');
        res.status(200).json({ success: true, data: rows });
    }
    catch (err) {
        console.error('[KPPM] getLecturers error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.getLecturers = getLecturers;
// ─── Get Active Semesters (untuk dropdown di form mahasiswa) ──────────────────
/**
 * GET /student/semesters/active
 * Mengembalikan daftar semester yang aktif (is_active = 1).
 * Digunakan untuk dropdown kode semester pada form pendaftaran KPPM.
 */
const getActiveSemesters = async (_req, res) => {
    try {
        const [rows] = await db_1.default.execute('SELECT semester_id, code, label FROM semester_codes WHERE is_active = 1 ORDER BY code DESC');
        res.status(200).json({ success: true, data: rows });
    }
    catch (err) {
        console.error('[KPPM] getActiveSemesters error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.getActiveSemesters = getActiveSemesters;
// ─── Cancel / Batalkan Pendaftaran KPPM ──────────────────────────────────────
/**
 * DELETE /student/kppm/registrations/:id
 * DIBEKUKAN: Dengan sistem auto-approve, mahasiswa tidak bisa lagi membatalkan pengajuan.
 */
const cancelRegistration = async (req, res) => {
    res.status(403).json({
        success: false,
        message: 'Pengajuan yang sudah disubmit tidak dapat dibatalkan.',
    });
};
exports.cancelRegistration = cancelRegistration;
// ─── Get Daftar Mahasiswa Bimbingan (untuk Dosen) ────────────────────────────
/**
 * GET /student/lecturer/students
 * Mengembalikan daftar mahasiswa yang punya pengajuan KPPM ke dosen yang login.
 * Requires JWT dengan role 'lecturer'.
 */
const getLecturerStudents = async (req, res) => {
    const lecturerNip = req.user?.sub;
    const role = req.user?.role;
    if (!lecturerNip) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    if (role !== 'lecturer') {
        res.status(403).json({ success: false, message: 'Akses ditolak. Hanya untuk dosen.' });
        return;
    }
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    try {
        // Ambil semua mahasiswa yang ditugaskan ke dosen ini (dari students) 
        // DAN/ATAU pengajuan yang ditujukan ke dosen ini (dari internship_registrations)
        const [rows] = await db_1.default.execute(`SELECT
         s.nim,
         s.student_name,
         s.class         AS student_class,
         s.email         AS student_email,
         r.registration_id,
         r.semester_code,
         r.company_name,
         r.internship_position,
         r.internship_start,
         r.internship_end,
         r.status,
         r.submitted_at,
         r.approved_at,
         r.cancelled_at,
         r.rejected_at,
         r.whatsapp_number,
         r.mentor_name,
         r.mentor_nip,
         r.mentor_position,
         r.mentor_email,
         r.mentor_phone,
         r.toss_cover_letter_file,
         IF(ls.registration_id IS NOT NULL, 1, 0) AS is_graded
       FROM students s
       LEFT JOIN lecturers l ON l.nip = ?
       LEFT JOIN internship_registrations r ON s.nim = r.nim
       LEFT JOIN lecturer_scores ls ON ls.registration_id = r.registration_id
       WHERE s.assigned_lecturer_code = l.lecturer_code
          OR r.lecturer_nip = ?
       ORDER BY r.submitted_at DESC, s.nim ASC
       LIMIT ? OFFSET ?`, [lecturerNip, lecturerNip, limit, offset]);
        const [countRows] = await db_1.default.execute(`SELECT COUNT(DISTINCT s.nim) AS total
       FROM students s
       LEFT JOIN lecturers l ON l.nip = ?
       LEFT JOIN internship_registrations r ON s.nim = r.nim
       WHERE s.assigned_lecturer_code = l.lecturer_code
          OR r.lecturer_nip = ?`, [lecturerNip, lecturerNip]);
        res.status(200).json({
            success: true,
            data: rows,
            meta: {
                total: countRows[0]?.total ?? 0,
                limit,
                offset,
            },
        });
    }
    catch (err) {
        console.error('[KPPM] getLecturerStudents error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.getLecturerStudents = getLecturerStudents;
// --- Update Status Pengajuan (untuk Dosen) ---
const updateRegistrationStatus = async (req, res) => {
    const lecturerNip = req.user?.sub;
    const role = req.user?.role;
    const registrationId = Number(req.params.id);
    const { action } = req.body;
    if (!lecturerNip) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi.' });
        return;
    }
    if (role !== 'lecturer') {
        res.status(403).json({ success: false, message: 'Akses ditolak. Hanya untuk dosen.' });
        return;
    }
    if (isNaN(registrationId)) {
        res.status(400).json({ success: false, message: 'ID pendaftaran tidak valid.' });
        return;
    }
    if (!['approved', 'rejected'].includes(action)) {
        res.status(400).json({ success: false, message: 'Aksi tidak valid.' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute(`SELECT registration_id, status FROM internship_registrations WHERE registration_id = ? AND lecturer_nip = ?`, [registrationId, lecturerNip]);
        if (!rows || rows.length === 0) {
            res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan.' });
            return;
        }
        const reg = rows[0];
        if (reg.status !== 'pending_approval') {
            res.status(400).json({ success: false, message: `Pengajuan status '${reg.status}' tidak dapat diubah.` });
            return;
        }
        if (action === 'approved') {
            await db_1.default.execute(`UPDATE internship_registrations SET status = 'approved', approved_at = NOW() WHERE registration_id = ?`, [registrationId]);
            res.status(200).json({ success: true, message: 'Pengajuan berhasil disetujui.' });
        }
        else {
            await db_1.default.execute(`UPDATE internship_registrations SET status = 'rejected', rejected_at = NOW() WHERE registration_id = ?`, [registrationId]);
            res.status(200).json({ success: true, message: 'Pengajuan berhasil ditolak.' });
        }
    }
    catch (err) {
        console.error('[KPPM] updateRegistrationStatus error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.updateRegistrationStatus = updateRegistrationStatus;
// ─── Get KP Results Status ────────────────────────────────────────────────────
/**
 * GET /student/kppm/results
 * Cek eligibility upload dan ambil data yang sudah diupload (jika ada).
 * Returns:
 *   - eligible: boolean
 *   - reason: string (jika tidak eligible)
 *   - registration: data registrasi KP
 *   - documents: data dokumen yang sudah diupload (null jika belum)
 *   - grades_status: { mentor: boolean, lecturer: boolean }
 */
const getKpResults = async (req, res) => {
    const nim = req.user?.nim || String(req.user?.sub || '');
    if (!nim) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    try {
        // Ambil pendaftaran KP yang sudah disetujui (JOIN students untuk data mahasiswa)
        const [regRows] = await db_1.default.execute(`SELECT ir.registration_id, ir.company_name, ir.internship_position,
              ir.internship_start, ir.internship_end, ir.semester_code,
              ir.mentor_name, ir.mentor_position, ir.mentor_email, ir.mentor_phone,
              ir.whatsapp_number,
              s.nim AS student_nim, s.student_name, s.class AS student_class, s.email AS student_email,
              l.lecturer_name AS dosen_name, l.nip AS dosen_nip
       FROM internship_registrations ir
       JOIN lecturers l ON ir.lecturer_nip = l.nip
       JOIN students  s ON ir.nim = s.nim
       WHERE ir.nim = ? AND ir.status = 'approved'
       ORDER BY ir.approved_at DESC
       LIMIT 1`, [nim]);
        if (regRows.length === 0) {
            res.status(200).json({
                success: true,
                data: {
                    eligible: false,
                    reason: 'no_approved_registration',
                    message: 'Belum ada pendaftaran KPPM yang disetujui.',
                    registration: null,
                    documents: null,
                    grades_status: { mentor: false, lecturer: false },
                },
            });
            return;
        }
        const reg = regRows[0];
        // Cek nilai mentor
        const [mentorRows] = await db_1.default.execute('SELECT mentor_score_id FROM mentor_scores WHERE registration_id = ? LIMIT 1', [reg.registration_id]);
        const hasMentorGrade = mentorRows.length > 0;
        // Cek nilai dosen PA
        const [lecturerRows] = await db_1.default.execute('SELECT lecturer_score_id FROM lecturer_scores WHERE registration_id = ? LIMIT 1', [reg.registration_id]);
        const hasLecturerGrade = lecturerRows.length > 0;
        const eligible = hasMentorGrade && hasLecturerGrade;
        let reason = '';
        if (!hasMentorGrade && !hasLecturerGrade) {
            reason = 'no_grades';
        }
        else if (!hasMentorGrade) {
            reason = 'no_mentor_grade';
        }
        else if (!hasLecturerGrade) {
            reason = 'no_lecturer_grade';
        }
        // Ambil dokumen yang sudah diupload (jika ada)
        const [docRows] = await db_1.default.execute('SELECT * FROM internship_documents WHERE registration_id = ? LIMIT 1', [reg.registration_id]);
        const documents = docRows.length > 0 ? {
            document_id: docRows[0].document_id,
            certificate_file: docRows[0].certificate_file,
            field_supervisor_score_file: docRows[0].field_supervisor_score_file,
            academic_supervisor_score_file: docRows[0].academic_supervisor_score_file,
            implementation_agreement_file: docRows[0].implementation_agreement_file,
            final_report_file: docRows[0].final_report_file ?? null,
            created_at: docRows[0].created_at,
            updated_at: docRows[0].updated_at,
        } : null;
        res.status(200).json({
            success: true,
            data: {
                eligible,
                reason,
                registration: {
                    registration_id: reg.registration_id,
                    // Data mahasiswa
                    student_nim: reg.student_nim,
                    student_name: reg.student_name,
                    student_class: reg.student_class,
                    student_email: reg.student_email,
                    whatsapp_number: reg.whatsapp_number,
                    // Data KP
                    company_name: reg.company_name,
                    internship_position: reg.internship_position,
                    internship_start: reg.internship_start,
                    internship_end: reg.internship_end,
                    semester_code: reg.semester_code,
                    // Data mentor / pembimbing lapang
                    mentor_name: reg.mentor_name,
                    mentor_position: reg.mentor_position,
                    mentor_email: reg.mentor_email,
                    mentor_phone: reg.mentor_phone,
                    // Data dosen PA
                    dosen_name: reg.dosen_name,
                },
                documents,
                grades_status: {
                    mentor: hasMentorGrade,
                    lecturer: hasLecturerGrade,
                },
            },
        });
    }
    catch (err) {
        console.error('[KPPM] getKpResults error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.getKpResults = getKpResults;
// ─── Helper: Cabut Akses Mentor ───────────────────────────────────────────────
/**
 * Setelah mahasiswa mengupload dokumen hasil KP, akses mentor dicabut:
 * 1. Set mentor_access_revoked = 1 pada registration
 * 2. Hapus semua session aktif mentor
 * 3. Hapus semua OTP pending mentor
 * Mentor tidak dapat login kembali ke sistem setelah ini.
 */
const revokeMentorAccess = async (registrationId) => {
    try {
        await db_1.default.execute('UPDATE internship_registrations SET mentor_access_revoked = 1 WHERE registration_id = ?', [registrationId]);
        await db_1.default.execute('DELETE FROM mentor_sessions WHERE registration_id = ?', [registrationId]);
        await db_1.default.execute('DELETE FROM mentor_otps WHERE registration_id = ?', [registrationId]);
        console.log(`[KPPM] Akses mentor dicabut untuk registration_id=${registrationId}`);
    }
    catch (err) {
        console.error(`[KPPM] Gagal mencabut akses mentor (registration_id=${registrationId}):`, err.message);
    }
};
// ─── Upload KP Results ────────────────────────────────────────────────────────
/**
 * POST /student/kppm/results
 * Body (multipart/form-data):
 *   - certificate_file              : File (PDF/JPG/PNG, max 5MB) — Wajib
 *   - field_supervisor_score_file   : File (PDF/JPG/PNG, max 5MB) — Wajib
 *   - academic_supervisor_score_file: File (PDF/JPG/PNG, max 5MB) — Wajib
 *   - implementation_agreement_file : File (PDF/JPG/PNG, max 5MB) — Opsional
 *   - final_report_file             : File (PDF/JPG/PNG, max 5MB) — Opsional
 */
const uploadKpResults = async (req, res) => {
    const nim = req.user?.nim || String(req.user?.sub || '');
    if (!nim) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    try {
        // Ambil registration yang approved
        const [regRows] = await db_1.default.execute(`SELECT registration_id FROM internship_registrations
       WHERE nim = ? AND status = 'approved'
       ORDER BY approved_at DESC LIMIT 1`, [nim]);
        if (regRows.length === 0) {
            res.status(400).json({ success: false, message: 'Tidak ada pendaftaran KPPM yang disetujui.' });
            return;
        }
        const registrationId = regRows[0].registration_id;
        // Verifikasi eligibility: kedua pembimbing harus sudah memberikan nilai
        const [mentorRows] = await db_1.default.execute('SELECT mentor_score_id FROM mentor_scores WHERE registration_id = ? LIMIT 1', [registrationId]);
        const [lecturerRows] = await db_1.default.execute('SELECT lecturer_score_id FROM lecturer_scores WHERE registration_id = ? LIMIT 1', [registrationId]);
        if (mentorRows.length === 0 || lecturerRows.length === 0) {
            res.status(403).json({
                success: false,
                message: 'Kedua pembimbing harus memberikan nilai sebelum dapat mengupload dokumen hasil KP.',
            });
            return;
        }
        // Ambil file yang diupload
        const files = req.files;
        const certificateFile = files?.certificate_file?.[0];
        const fieldSupervisorScoreFile = files?.field_supervisor_score_file?.[0];
        const academicSupervisorScoreFile = files?.academic_supervisor_score_file?.[0];
        const implementationAgreementFile = files?.implementation_agreement_file?.[0];
        const finalReportFile = files?.final_report_file?.[0];
        // Validasi file wajib
        if (!certificateFile) {
            res.status(400).json({ success: false, message: 'File sertifikat/surat selesai magang wajib diupload.' });
            return;
        }
        if (!fieldSupervisorScoreFile) {
            res.status(400).json({ success: false, message: 'Scan penilaian pembimbing lapang wajib diupload.' });
            return;
        }
        if (!academicSupervisorScoreFile) {
            res.status(400).json({ success: false, message: 'Scan penilaian pembimbing akademik wajib diupload.' });
            return;
        }
        if (!finalReportFile) {
            res.status(400).json({ success: false, message: 'Laporan akhir KP wajib diupload.' });
            return;
        }
        const certPath = `kp-results/${certificateFile.filename}`;
        const fieldPath = `kp-results/${fieldSupervisorScoreFile.filename}`;
        const acadPath = `kp-results/${academicSupervisorScoreFile.filename}`;
        const iaPath = implementationAgreementFile
            ? `kp-results/${implementationAgreementFile.filename}`
            : null;
        const finalPath = finalReportFile
            ? `kp-results/${finalReportFile.filename}`
            : null;
        // Cek apakah sudah ada dokumen sebelumnya
        const [existingDocs] = await db_1.default.execute('SELECT document_id FROM internship_documents WHERE registration_id = ? LIMIT 1', [registrationId]);
        if (existingDocs.length > 0) {
            // Update dokumen yang sudah ada
            await db_1.default.execute(`UPDATE internship_documents
         SET certificate_file = ?,
             field_supervisor_score_file = ?,
             academic_supervisor_score_file = ?,
             implementation_agreement_file = ?,
             final_report_file = ?
         WHERE registration_id = ?`, [certPath, fieldPath, acadPath, iaPath, finalPath, registrationId]);
            // Cabut akses mentor (update dokumen berarti proses selesai)
            await revokeMentorAccess(registrationId);
            res.status(200).json({ success: true, message: 'Dokumen hasil KP berhasil diperbarui.' });
        }
        else {
            // Insert dokumen baru
            await db_1.default.execute(`INSERT INTO internship_documents
         (registration_id, certificate_file, field_supervisor_score_file, academic_supervisor_score_file, implementation_agreement_file, final_report_file)
         VALUES (?, ?, ?, ?, ?, ?)`, [registrationId, certPath, fieldPath, acadPath, iaPath, finalPath]);
            // Cabut akses mentor setelah mahasiswa upload pertama kali
            await revokeMentorAccess(registrationId);
            res.status(201).json({ success: true, message: 'Dokumen hasil KP berhasil diupload.' });
        }
    }
    catch (err) {
        console.error('[KPPM] uploadKpResults error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.uploadKpResults = uploadKpResults;
// ─── Get KP Results Mahasiswa Bimbingan (untuk Dosen) ─────────────────────────
/**
 * GET /student/lecturer/kp-results
 * Mengembalikan semua mahasiswa approved beserta status dokumen hasil KP mereka.
 * Requires JWT dengan role 'lecturer'.
 */
const getLecturerKpResults = async (req, res) => {
    const lecturerNip = req.user?.sub;
    const role = req.user?.role;
    if (!lecturerNip) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi.' });
        return;
    }
    if (role !== 'lecturer') {
        res.status(403).json({ success: false, message: 'Akses ditolak. Hanya untuk dosen.' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute(`SELECT
         r.registration_id,
         s.nim,
         s.student_name,
         s.class          AS student_class,
         s.email          AS student_email,
         r.whatsapp_number,
         r.company_name,
         r.internship_position,
         r.internship_start,
         r.internship_end,
         r.semester_code,
         r.approved_at,
         r.mentor_name,
         r.mentor_position,
         r.mentor_email,
         r.mentor_phone,
         d.document_id,
         d.certificate_file,
         d.field_supervisor_score_file,
         d.academic_supervisor_score_file,
         d.implementation_agreement_file,
         d.created_at     AS uploaded_at,
         d.updated_at     AS updated_at
       FROM internship_registrations r
       JOIN students s ON s.nim = r.nim
       LEFT JOIN internship_documents d ON d.registration_id = r.registration_id
       WHERE r.lecturer_nip = ?
         AND r.status = 'approved'
       ORDER BY d.updated_at DESC, r.registration_id DESC`, [lecturerNip]);
        res.status(200).json({ success: true, data: rows });
    }
    catch (err) {
        console.error('[KPPM] getLecturerKpResults error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.getLecturerKpResults = getLecturerKpResults;
