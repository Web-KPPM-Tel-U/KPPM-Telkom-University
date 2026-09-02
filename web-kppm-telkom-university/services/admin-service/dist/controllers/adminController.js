"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreviewGrades = exports.exportGradesBySemester = exports.toggleSemesterStatus = exports.createSemester = exports.toggleStudentStatus = exports.toggleLecturerStatus = exports.assignLecturerToStudent = exports.updateStudent = exports.updateLecturer = exports.injectLecturers = exports.injectStudents = exports.createLecturer = exports.createStudent = exports.getAdminStudents = exports.getAdminSemesters = exports.getAdminLecturers = exports.getAdminStats = void 0;
const db_1 = __importDefault(require("../config/db"));
const XLSX = __importStar(require("xlsx"));
const exceljs_1 = __importDefault(require("exceljs"));
const sync_1 = require("csv-parse/sync");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// ─── Admin: Get Dashboard Stats ───────────────────────────────────────────────
/**
 * GET /admin/stats
 * Mengembalikan statistik ringkasan untuk dashboard admin.
 */
const getAdminStats = async (_req, res) => {
    try {
        const [[studentRow]] = await db_1.default.execute('SELECT COUNT(*) AS total FROM students');
        const [[lecturerRow]] = await db_1.default.execute('SELECT COUNT(*) AS total FROM lecturers');
        const [[pendingRow]] = await db_1.default.execute(`SELECT COUNT(*) AS total FROM internship_registrations WHERE status = 'pending_approval'`);
        const [[approvedRow]] = await db_1.default.execute(`SELECT COUNT(*) AS total FROM internship_registrations WHERE status = 'approved'`);
        const [[activeSemRow]] = await db_1.default.execute(`SELECT COUNT(*) AS total FROM semester_codes WHERE is_active = 1`);
        const [[totalRegRow]] = await db_1.default.execute('SELECT COUNT(*) AS total FROM internship_registrations');
        res.status(200).json({
            success: true,
            data: {
                total_students: studentRow?.total ?? 0,
                total_lecturers: lecturerRow?.total ?? 0,
                pending_registrations: pendingRow?.total ?? 0,
                approved_registrations: approvedRow?.total ?? 0,
                active_semesters: activeSemRow?.total ?? 0,
                total_registrations: totalRegRow?.total ?? 0,
            },
        });
    }
    catch (err) {
        console.error('[Admin] getAdminStats error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.getAdminStats = getAdminStats;
// ─── Admin: Get All Lecturers ──────────────────────────────────────────────────
/**
 * GET /admin/lecturers
 * Mengembalikan daftar seluruh dosen.
 */
const getAdminLecturers = async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search || '';
    try {
        const searchParam = `%${search}%`;
        const [rows] = await db_1.default.execute(`SELECT nip, lecturer_name, lecturer_code, email, is_verified, password_changed, is_active, created_at, updated_at
       FROM lecturers
       WHERE lecturer_name LIKE ? OR nip LIKE ?
       ORDER BY lecturer_name ASC
       LIMIT ? OFFSET ?`, [searchParam, searchParam, limit, offset]);
        const [[countRow]] = await db_1.default.execute('SELECT COUNT(*) AS total FROM lecturers WHERE lecturer_name LIKE ? OR nip LIKE ?', [searchParam, searchParam]);
        res.status(200).json({
            success: true,
            data: rows,
            meta: { total: countRow?.total ?? 0, limit, offset },
        });
    }
    catch (err) {
        console.error('[Admin] getAdminLecturers error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.getAdminLecturers = getAdminLecturers;
// ─── Admin: Get Semester Codes ────────────────────────────────────────────────
/**
 * GET /admin/semesters
 * Mengembalikan daftar kode semester.
 */
const getAdminSemesters = async (_req, res) => {
    try {
        const [rows] = await db_1.default.execute('SELECT * FROM semester_codes ORDER BY created_at DESC');
        res.status(200).json({ success: true, data: rows });
    }
    catch (err) {
        console.error('[Admin] getAdminSemesters error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.getAdminSemesters = getAdminSemesters;
// ─── Admin: Get All Students ───────────────────────────────────────────────────
/**
 * GET /admin/students
 * Mengembalikan daftar seluruh mahasiswa.
 */
const getAdminStudents = async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search || '';
    try {
        const searchParam = `%${search}%`;
        const [rows] = await db_1.default.execute(`SELECT s.nim, s.student_name, s.class, s.email, s.is_verified, s.password_changed,
              s.is_active, s.created_at, s.assigned_lecturer_code,
              l.lecturer_name AS assigned_lecturer_name
       FROM students s
       LEFT JOIN lecturers l ON l.lecturer_code = s.assigned_lecturer_code
       WHERE s.student_name LIKE ? OR s.nim LIKE ?
       ORDER BY s.student_name ASC
       LIMIT ? OFFSET ?`, [searchParam, searchParam, limit, offset]);
        const [[countRow]] = await db_1.default.execute('SELECT COUNT(*) AS total FROM students WHERE student_name LIKE ? OR nim LIKE ?', [searchParam, searchParam]);
        res.status(200).json({
            success: true,
            data: rows,
            meta: { total: countRow?.total ?? 0, limit, offset },
        });
    }
    catch (err) {
        console.error('[Admin] getAdminStudents error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.getAdminStudents = getAdminStudents;
// ─── Helper: Parse file ke array of objects ──────────────────────────────────
function parseFile(buffer, mimetype, originalname) {
    const ext = originalname.toLowerCase().split('.').pop();
    const isExcel = ext === 'xlsx' || ext === 'xls' ||
        mimetype.includes('spreadsheet') || mimetype.includes('excel');
    if (isExcel) {
        const wb = XLSX.read(buffer, { type: 'buffer' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        return XLSX.utils.sheet_to_json(sheet, { defval: '' });
    }
    // CSV
    return (0, sync_1.parse)(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });
}
// ─── Helper: Normalisasi header fleksibel ─────────────────────────────────────
const STUDENT_FIELD_MAP = {
    nim: 'nim', 'nomor induk mahasiswa': 'nim', 'no induk': 'nim',
    student_name: 'student_name', 'nama': 'student_name', 'nama mahasiswa': 'student_name',
    'nama lengkap': 'student_name',
    class: 'class', 'kelas': 'class',
    email: 'email',
};
const LECTURER_FIELD_MAP = {
    nip: 'nip', 'nomor induk pegawai': 'nip', 'no induk pegawai': 'nip',
    lecturer_name: 'lecturer_name', 'nama': 'lecturer_name', 'nama dosen': 'lecturer_name',
    'nama lengkap': 'lecturer_name',
    lecturer_code: 'lecturer_code', 'kode': 'lecturer_code', 'kode dosen': 'lecturer_code',
    email: 'email',
};
function normalizeRow(raw, fieldMap) {
    const normalized = {};
    for (const [key, val] of Object.entries(raw)) {
        const std = fieldMap[key.toLowerCase().trim()];
        if (std)
            normalized[std] = String(val).trim();
    }
    return normalized;
}
// ─── Admin: Create Student Manually ──────────────────────────────────────────
/**
 * POST /admin/students/add
 */
const createStudent = async (req, res) => {
    const { nim, student_name, class: kelas, email } = req.body;
    if (!nim?.trim() || !student_name?.trim() || !kelas?.trim()) {
        res.status(400).json({ success: false, message: 'NIM, Nama, dan Kelas wajib diisi.' });
        return;
    }
    try {
        const hashedPassword = await bcryptjs_1.default.hash(nim.trim(), 10);
        const [insertRes] = await db_1.default.execute(`INSERT INTO students (nim, student_name, class, email, password, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`, [nim.trim(), student_name.trim(), kelas.trim(), email?.trim() || null, hashedPassword]);
        const [newRow] = await db_1.default.execute('SELECT nim, student_name, class, email, is_verified, password_changed, is_active, created_at FROM students WHERE nim = ?', [nim.trim()]);
        res.status(201).json({
            success: true,
            message: `Mahasiswa ${nim.trim()} berhasil ditambahkan.`,
            data: newRow[0],
        });
    }
    catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ success: false, message: `Mahasiswa dengan NIM ${nim.trim()} sudah terdaftar.` });
            return;
        }
        console.error('[Admin] createStudent error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.createStudent = createStudent;
// ─── Admin: Create Lecturer Manually ─────────────────────────────────────────
/**
 * POST /admin/lecturers/add
 */
const createLecturer = async (req, res) => {
    const { nip, lecturer_name, lecturer_code, email } = req.body;
    if (!nip?.trim() || !lecturer_name?.trim() || !lecturer_code?.trim()) {
        res.status(400).json({ success: false, message: 'NIP, Nama Dosen, dan Kode Dosen wajib diisi.' });
        return;
    }
    if (lecturer_code.trim().length > 3) {
        res.status(400).json({ success: false, message: 'Kode Dosen maksimal 3 karakter.' });
        return;
    }
    try {
        const hashedPassword = await bcryptjs_1.default.hash(nip.trim(), 10);
        const [insertRes] = await db_1.default.execute(`INSERT INTO lecturers (nip, lecturer_name, lecturer_code, email, password, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`, [nip.trim(), lecturer_name.trim(), lecturer_code.trim().toUpperCase(), email?.trim() || null, hashedPassword]);
        const [newRow] = await db_1.default.execute('SELECT nip, lecturer_name, lecturer_code, email, is_verified, password_changed, is_active, created_at, updated_at FROM lecturers WHERE nip = ?', [nip.trim()]);
        res.status(201).json({
            success: true,
            message: `Dosen ${nip.trim()} berhasil ditambahkan.`,
            data: newRow[0],
        });
    }
    catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ success: false, message: `Dosen dengan NIP ${nip.trim()} sudah terdaftar.` });
            return;
        }
        console.error('[Admin] createLecturer error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.createLecturer = createLecturer;
// ─── Admin: Inject Students ───────────────────────────────────────────────────
/**
 * POST /admin/inject/students
 * Upload CSV atau XLSX mahasiswa → batch insert ke tabel students.
 * Password default = NIM mahasiswa.
 */
const injectStudents = async (req, res) => {
    if (!req.file) {
        res.status(400).json({ success: false, message: 'File wajib diupload.' });
        return;
    }
    let rawRows;
    try {
        rawRows = parseFile(req.file.buffer, req.file.mimetype, req.file.originalname);
    }
    catch {
        res.status(422).json({ success: false, message: 'File tidak dapat dibaca. Pastikan format CSV atau XLSX yang valid.' });
        return;
    }
    if (rawRows.length === 0) {
        res.status(422).json({ success: false, message: 'File kosong atau tidak memiliki baris data.' });
        return;
    }
    const result = { inserted: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rawRows.length; i++) {
        const rowNum = i + 2;
        const row = normalizeRow(rawRows[i], STUDENT_FIELD_MAP);
        if (!row.nim) {
            result.errors.push({ row: rowNum, message: 'Kolom NIM kosong atau tidak ditemukan.' });
            continue;
        }
        if (!row.student_name) {
            result.errors.push({ row: rowNum, message: `NIM ${row.nim}: Kolom nama mahasiswa kosong.` });
            continue;
        }
        if (!row.class) {
            result.errors.push({ row: rowNum, message: `NIM ${row.nim}: Kolom kelas kosong.` });
            continue;
        }
        try {
            const hashedPassword = await bcryptjs_1.default.hash(row.nim, 10);
            const [insertRes] = await db_1.default.execute(`INSERT IGNORE INTO students (nim, student_name, class, email, password)
         VALUES (?, ?, ?, ?, ?)`, [row.nim, row.student_name, row.class, row.email || null, hashedPassword]);
            if (insertRes.affectedRows === 0) {
                result.skipped++;
            }
            else {
                result.inserted++;
            }
        }
        catch (err) {
            result.errors.push({ row: rowNum, message: `NIM ${row.nim}: ${err.message}` });
        }
    }
    res.status(200).json({
        success: true,
        message: `Proses selesai: ${result.inserted} ditambahkan, ${result.skipped} dilewati, ${result.errors.length} error.`,
        data: result,
    });
};
exports.injectStudents = injectStudents;
// ─── Admin: Inject Lecturers ──────────────────────────────────────────────────
/**
 * POST /admin/inject/lecturers
 * Upload CSV atau XLSX dosen → batch insert ke tabel lecturers.
 * Password default = NIP dosen.
 */
const injectLecturers = async (req, res) => {
    if (!req.file) {
        res.status(400).json({ success: false, message: 'File wajib diupload.' });
        return;
    }
    let rawRows;
    try {
        rawRows = parseFile(req.file.buffer, req.file.mimetype, req.file.originalname);
    }
    catch {
        res.status(422).json({ success: false, message: 'File tidak dapat dibaca. Pastikan format CSV atau XLSX yang valid.' });
        return;
    }
    if (rawRows.length === 0) {
        res.status(422).json({ success: false, message: 'File kosong atau tidak memiliki baris data.' });
        return;
    }
    const result = { inserted: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rawRows.length; i++) {
        const rowNum = i + 2;
        const row = normalizeRow(rawRows[i], LECTURER_FIELD_MAP);
        if (!row.nip) {
            result.errors.push({ row: rowNum, message: 'Kolom NIP kosong atau tidak ditemukan.' });
            continue;
        }
        if (!row.lecturer_name) {
            result.errors.push({ row: rowNum, message: `NIP ${row.nip}: Kolom nama dosen kosong.` });
            continue;
        }
        if (!row.lecturer_code) {
            result.errors.push({ row: rowNum, message: `NIP ${row.nip}: Kolom kode dosen kosong (wajib diisi).` });
            continue;
        }
        if (row.lecturer_code.trim().length > 3) {
            result.errors.push({ row: rowNum, message: `NIP ${row.nip}: Kode dosen maksimal 3 karakter.` });
            continue;
        }
        try {
            const hashedPassword = await bcryptjs_1.default.hash(row.nip, 10);
            const [insertRes] = await db_1.default.execute(`INSERT IGNORE INTO lecturers (nip, lecturer_name, lecturer_code, email, password)
         VALUES (?, ?, ?, ?, ?)`, [row.nip, row.lecturer_name, row.lecturer_code.trim().toUpperCase(), row.email || null, hashedPassword]);
            if (insertRes.affectedRows === 0) {
                result.skipped++;
            }
            else {
                result.inserted++;
            }
        }
        catch (err) {
            result.errors.push({ row: rowNum, message: `NIP ${row.nip}: ${err.message}` });
        }
    }
    res.status(200).json({
        success: true,
        message: `Proses selesai: ${result.inserted} ditambahkan, ${result.skipped} dilewati, ${result.errors.length} error.`,
        data: result,
    });
};
exports.injectLecturers = injectLecturers;
// ─── Admin/PIC: Update Dosen ──────────────────────────────────────────────────
/**
 * PATCH /admin/lecturers/:nip
 * PIC dapat mengubah nama dan email dosen.
 */
const updateLecturer = async (req, res) => {
    const { nip } = req.params;
    const { lecturer_name, lecturer_code, email } = req.body;
    if (!lecturer_name?.trim() && lecturer_code === undefined && email === undefined) {
        res.status(400).json({ success: false, message: 'Tidak ada data yang akan diubah.' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute('SELECT nip FROM lecturers WHERE nip = ?', [nip]);
        if (!rows || rows.length === 0) {
            res.status(404).json({ success: false, message: 'Dosen tidak ditemukan.' });
            return;
        }
        const fields = [];
        const values = [];
        if (lecturer_name?.trim()) {
            fields.push('lecturer_name = ?');
            values.push(lecturer_name.trim());
        }
        if (lecturer_code !== undefined) {
            const code = lecturer_code?.trim().toUpperCase().slice(0, 3) || null;
            fields.push('lecturer_code = ?');
            values.push(code);
        }
        if (email !== undefined) {
            fields.push('email = ?');
            values.push(email?.trim() || null);
        }
        values.push(nip);
        await db_1.default.execute(`UPDATE lecturers SET ${fields.join(', ')}, updated_at = NOW() WHERE nip = ?`, values);
        const [updated] = await db_1.default.execute('SELECT nip, lecturer_name, lecturer_code, email, is_verified, password_changed, updated_at FROM lecturers WHERE nip = ?', [nip]);
        res.status(200).json({
            success: true,
            message: 'Data dosen berhasil diperbarui.',
            data: updated[0],
        });
    }
    catch (err) {
        console.error('[Admin] updateLecturer error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.updateLecturer = updateLecturer;
// ─── Admin/PIC: Update Mahasiswa ───────────────────────────────────────────────
/**
 * PATCH /admin/students/:nim
 * PIC dapat mengubah nama, kelas, dan email mahasiswa.
 */
const updateStudent = async (req, res) => {
    const { nim } = req.params;
    const { student_name, class: kelas, email } = req.body;
    if (!student_name?.trim() && !kelas?.trim() && email === undefined) {
        res.status(400).json({ success: false, message: 'Tidak ada data yang akan diubah.' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute('SELECT nim FROM students WHERE nim = ?', [nim]);
        if (!rows || rows.length === 0) {
            res.status(404).json({ success: false, message: 'Mahasiswa tidak ditemukan.' });
            return;
        }
        const fields = [];
        const values = [];
        if (student_name?.trim()) {
            fields.push('student_name = ?');
            values.push(student_name.trim());
        }
        if (kelas?.trim()) {
            fields.push('class = ?');
            values.push(kelas.trim());
        }
        if (email !== undefined) {
            fields.push('email = ?');
            values.push(email?.trim() || null);
        }
        values.push(nim);
        await db_1.default.execute(`UPDATE students SET ${fields.join(', ')}, updated_at = NOW() WHERE nim = ?`, values);
        const [updated] = await db_1.default.execute('SELECT nim, student_name, class, email, is_verified, password_changed, updated_at FROM students WHERE nim = ?', [nim]);
        res.status(200).json({
            success: true,
            message: `Data mahasiswa ${nim} berhasil diperbarui.`,
            data: updated[0],
        });
    }
    catch (err) {
        console.error('[Admin] updateStudent error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.updateStudent = updateStudent;
// ─── Admin: Assign Dosen Pembimbing ke Mahasiswa ──────────────────────────────
/**
 * PATCH /admin/students/:nim/assign-lecturer
 * Menetapkan dosen pembimbing ke mahasiswa berdasarkan lecturer_code.
 * Kirim { lecturer_code: null } untuk melepas assignment.
 */
const assignLecturerToStudent = async (req, res) => {
    const { nim } = req.params;
    const { lecturer_code } = req.body;
    if (lecturer_code === undefined) {
        res.status(400).json({ success: false, message: 'Field lecturer_code wajib disertakan (kirim null untuk melepas).' });
        return;
    }
    try {
        // Cek mahasiswa ada
        const [studentRows] = await db_1.default.execute('SELECT nim FROM students WHERE nim = ?', [nim]);
        if (!studentRows || studentRows.length === 0) {
            res.status(404).json({ success: false, message: 'Mahasiswa tidak ditemukan.' });
            return;
        }
        let assignedLecturer = null;
        if (lecturer_code) {
            // Validasi lecturer_code ada di DB
            const code = String(lecturer_code).trim().toUpperCase().slice(0, 3);
            const [lecturerRows] = await db_1.default.execute('SELECT nip, lecturer_name, lecturer_code FROM lecturers WHERE lecturer_code = ?', [code]);
            if (!lecturerRows || lecturerRows.length === 0) {
                res.status(400).json({ success: false, message: `Kode dosen "${code}" tidak ditemukan. Pastikan kode dosen sudah terdaftar.` });
                return;
            }
            assignedLecturer = lecturerRows[0];
            await db_1.default.execute('UPDATE students SET assigned_lecturer_code = ?, updated_at = NOW() WHERE nim = ?', [code, nim]);
        }
        else {
            // Lepas assignment
            await db_1.default.execute('UPDATE students SET assigned_lecturer_code = NULL, updated_at = NOW() WHERE nim = ?', [nim]);
        }
        res.status(200).json({
            success: true,
            message: assignedLecturer
                ? `Dosen ${assignedLecturer.lecturer_name} (${assignedLecturer.lecturer_code}) berhasil di-assign ke mahasiswa ${nim}.`
                : `Assignment dosen untuk mahasiswa ${nim} berhasil dilepas.`,
            data: {
                nim,
                assigned_lecturer_code: assignedLecturer?.lecturer_code ?? null,
                assigned_lecturer_name: assignedLecturer?.lecturer_name ?? null,
            },
        });
    }
    catch (err) {
        console.error('[Admin] assignLecturerToStudent error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.assignLecturerToStudent = assignLecturerToStudent;
// ─── Admin: Toggle Account Status ─────────────────────────────────────────────
/**
 * PATCH /admin/lecturers/:nip/toggle-status
 */
const toggleLecturerStatus = async (req, res) => {
    const { nip } = req.params;
    try {
        const [rows] = await db_1.default.execute('SELECT nip, is_active FROM lecturers WHERE nip = ?', [nip]);
        if (!rows || rows.length === 0) {
            res.status(404).json({ success: false, message: 'Dosen tidak ditemukan.' });
            return;
        }
        const newStatus = rows[0].is_active === 1 ? 0 : 1;
        await db_1.default.execute('UPDATE lecturers SET is_active = ?, updated_at = NOW() WHERE nip = ?', [newStatus, nip]);
        res.status(200).json({
            success: true,
            message: newStatus === 1 ? 'Akun dosen berhasil diaktifkan.' : 'Akun dosen berhasil dinonaktifkan.',
            data: { nip, is_active: newStatus },
        });
    }
    catch (err) {
        console.error('[Admin] toggleLecturerStatus error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.toggleLecturerStatus = toggleLecturerStatus;
/**
 * PATCH /admin/students/:nim/toggle-status
 */
const toggleStudentStatus = async (req, res) => {
    const { nim } = req.params;
    try {
        const [rows] = await db_1.default.execute('SELECT nim, is_active FROM students WHERE nim = ?', [nim]);
        if (!rows || rows.length === 0) {
            res.status(404).json({ success: false, message: 'Mahasiswa tidak ditemukan.' });
            return;
        }
        const newStatus = rows[0].is_active === 1 ? 0 : 1;
        await db_1.default.execute('UPDATE students SET is_active = ?, updated_at = NOW() WHERE nim = ?', [newStatus, nim]);
        res.status(200).json({
            success: true,
            message: newStatus === 1 ? 'Akun mahasiswa berhasil diaktifkan.' : 'Akun mahasiswa berhasil dinonaktifkan.',
            data: { nim, is_active: newStatus },
        });
    }
    catch (err) {
        console.error('[Admin] toggleStudentStatus error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.toggleStudentStatus = toggleStudentStatus;
// ─── Admin: Create Semester ───────────────────────────────────────────────────
/**
 * POST /admin/semesters
 */
const createSemester = async (req, res) => {
    const { code, label } = req.body;
    if (!code?.trim() || !label?.trim()) {
        res.status(400).json({ success: false, message: 'Kode dan label semester wajib diisi.' });
        return;
    }
    const codeClean = code.trim();
    if (!/^\d{4}-[12]$/.test(codeClean)) {
        res.status(400).json({ success: false, message: 'Format kode semester tidak valid. Gunakan format seperti "2526-1".' });
        return;
    }
    try {
        const [existing] = await db_1.default.execute('SELECT semester_id FROM semester_codes WHERE code = ?', [codeClean]);
        if (existing && existing.length > 0) {
            res.status(409).json({ success: false, message: `Kode semester "${codeClean}" sudah ada.` });
            return;
        }
        const [insertRes] = await db_1.default.execute('INSERT INTO semester_codes (code, label, is_active) VALUES (?, ?, 0)', [codeClean, label.trim()]);
        const [newRow] = await db_1.default.execute('SELECT * FROM semester_codes WHERE semester_id = ?', [insertRes.insertId]);
        res.status(201).json({
            success: true,
            message: `Semester "${codeClean}" berhasil dibuat.`,
            data: newRow[0],
        });
    }
    catch (err) {
        console.error('[Admin] createSemester error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.createSemester = createSemester;
// ─── Admin: Toggle Semester Status ───────────────────────────────────────────
/**
 * PATCH /admin/semesters/:id/toggle-status
 */
const toggleSemesterStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db_1.default.execute('SELECT semester_id, code, is_active FROM semester_codes WHERE semester_id = ?', [id]);
        if (!rows || rows.length === 0) {
            res.status(404).json({ success: false, message: 'Semester tidak ditemukan.' });
            return;
        }
        const current = rows[0];
        const newStatus = current.is_active === 1 ? 0 : 1;
        // Jika mengaktifkan, pastikan tidak ada semester lain yang sudah aktif
        if (newStatus === 1) {
            const [activeRows] = await db_1.default.execute('SELECT semester_id, code FROM semester_codes WHERE is_active = 1 AND semester_id != ?', [id]);
            if (activeRows.length > 0) {
                res.status(409).json({
                    success: false,
                    message: `Nonaktifkan semester "${activeRows[0].code}" terlebih dahulu sebelum mengaktifkan semester lain.`,
                });
                return;
            }
        }
        await db_1.default.execute('UPDATE semester_codes SET is_active = ?, updated_at = NOW() WHERE semester_id = ?', [newStatus, id]);
        res.status(200).json({
            success: true,
            message: newStatus === 1
                ? `Semester "${current.code}" berhasil diaktifkan.`
                : `Semester "${current.code}" berhasil dinonaktifkan.`,
            data: { semester_id: current.semester_id, code: current.code, is_active: newStatus },
        });
    }
    catch (err) {
        console.error('[Admin] toggleSemesterStatus error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.toggleSemesterStatus = toggleSemesterStatus;
// ─── Admin: Export Grades by Semester ────────────────────────────────────────
/**
 * GET /admin/export/grades?semester_code=...
 * Mengunduh nilai mahasiswa dalam format XLSX untuk semester tertentu.
 */
const exportGradesBySemester = async (req, res) => {
    const semesterCode = req.query.semester_code;
    if (!semesterCode) {
        res.status(400).json({ success: false, message: 'semester_code diperlukan.' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute(`SELECT 
        s.class, 
        s.student_name, 
        s.nim,
        ls.plo05_clo01_commitment AS pa_commitment,
        ls.plo07_clo02_planning AS pa_planning,
        ls.plo05_clo04_guidance AS pa_guidance,
        ls.plo05_clo04_presentation AS pa_presentation,
        ls.plo05_clo04_report AS pa_report,
        ls.plo01_clo05_identification AS pa_identification,
        ms.attendance AS pl_attendance,
        ms.discipline AS pl_discipline,
        ms.commitment AS pl_commitment,
        ms.planning AS pl_planning,
        ms.teamwork AS pl_teamwork,
        ms.guidance AS pl_guidance,
        ms.report AS pl_report,
        ms.problem_solving AS pl_problem_solving
       FROM internship_registrations r
       JOIN students s ON r.nim = s.nim
       LEFT JOIN lecturer_scores ls ON r.registration_id = ls.registration_id
       LEFT JOIN mentor_scores ms ON r.registration_id = ms.registration_id
       WHERE r.semester_code = ?
       ORDER BY s.class ASC, s.student_name ASC`, [semesterCode]);
        const workbook = new exceljs_1.default.Workbook();
        const worksheetPA = workbook.addWorksheet('Penilaian Pembimbing Akademik');
        const worksheetPL = workbook.addWorksheet('Penilaian Pembimbing Lapangan');
        // Definisi kolom Pembimbing Akademik
        worksheetPA.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Kelas', key: 'kelas', width: 15 },
            { header: 'Nama', key: 'nama', width: 35 },
            { header: 'NIM', key: 'nim', width: 20 },
            { header: 'PLO05-CLO01 - Komitmen terhadap tugas / pekerjaan', key: 'pa_commitment', width: 25 },
            { header: 'PLO07-CLO02 - Mahasiswa mampu merencanakan penyelesaian tugas atau pekerjaan, bekerja efektif dan mandiri selama KP', key: 'pa_planning', width: 30 },
            { header: 'PLO05-CLO04 - Frekuensi bimbingan dengan pembimbing akademik', key: 'pa_guidance', width: 30 },
            { header: 'PLO05-CLO04 - Kualitas Presentasi', key: 'pa_presentation', width: 25 },
            { header: 'PLO05-CLO04 - Kualitas Laporan', key: 'pa_report', width: 25 },
            { header: 'PLO01-CLO05 PA - Identifikasi dan Formulasi Masalah', key: 'pa_identification', width: 30 }
        ];
        // Definisi kolom Pembimbing Lapangan
        worksheetPL.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Kelas', key: 'kelas', width: 15 },
            { header: 'Nama', key: 'nama', width: 35 },
            { header: 'NIM', key: 'nim', width: 20 },
            { header: 'PLO05-CLO01 - Kehadiran Tepat Waktu', key: 'pl_attendance', width: 25 },
            { header: 'PLO05-CLO01 - Kedisiplinan', key: 'pl_discipline', width: 25 },
            { header: 'PLO05-CLO01 - Komitmen terhadap tugas / pekerjaan', key: 'pl_commitment', width: 25 },
            { header: 'PLO07-CLO02 - Mahasiswa mampu merencanakan penyelesaian tugas atau pekerjaan, bekerja efektif dan mandiri selama KP', key: 'pl_planning', width: 30 },
            { header: 'PLO03-CLO03 - Mahasiswa mampu bekerjasama di dalam tim organisasi/perusahaan selama KP', key: 'pl_teamwork', width: 30 },
            { header: 'PLO05-CLO04 - Frekuensi bimbingan dengan pembimbing lapangan / Mentor', key: 'pl_guidance', width: 30 },
            { header: 'PLO05-CLO04 - Kualitas Laporan', key: 'pl_report', width: 25 },
            { header: 'PLO01-CLO05 PA - Identifikasi dan Formulasi Masalah', key: 'pl_problem_solving', width: 30 }
        ];
        // Helper styling header
        const styleHeader = (ws, gradeStartCol) => {
            const headerRow = ws.getRow(1);
            headerRow.height = 40;
            headerRow.eachCell((cell, colNumber) => {
                cell.font = { bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                // Warna hijau terang untuk header nilai
                if (colNumber >= gradeStartCol) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFC6EFCE' } // Light green
                    };
                }
            });
        };
        styleHeader(worksheetPA, 5);
        styleHeader(worksheetPL, 5);
        // Tambah baris data & beri styling
        rows.forEach((r, i) => {
            // Untuk NIM (dan lain-lain yang bisa dianggap numerik oleh Excel tapi aslinya string), kita tidak memaksakan tanda kutip tunggal di exceljs karena type 'string' sudah cukup
            // Atau bisa tambahkan ' jika benar-benar butuh: `'${r.nim || '-'}`
            const rowPA = worksheetPA.addRow({
                no: i + 1,
                kelas: r.class || '-',
                nama: r.student_name || '-',
                nim: r.nim ? `'${r.nim}` : '-', // Format khusus NIM agar seperti string di excel
                pa_commitment: r.pa_commitment ?? '-',
                pa_planning: r.pa_planning ?? '-',
                pa_guidance: r.pa_guidance ?? '-',
                pa_presentation: r.pa_presentation ?? '-',
                pa_report: r.pa_report ?? '-',
                pa_identification: r.pa_identification ?? '-'
            });
            const rowPL = worksheetPL.addRow({
                no: i + 1,
                kelas: r.class || '-',
                nama: r.student_name || '-',
                nim: r.nim ? `'${r.nim}` : '-',
                pl_attendance: r.pl_attendance ?? '-',
                pl_discipline: r.pl_discipline ?? '-',
                pl_commitment: r.pl_commitment ?? '-',
                pl_planning: r.pl_planning ?? '-',
                pl_teamwork: r.pl_teamwork ?? '-',
                pl_guidance: r.pl_guidance ?? '-',
                pl_report: r.pl_report ?? '-',
                pl_problem_solving: r.pl_problem_solving ?? '-'
            });
            // Styling cell data
            [rowPA, rowPL].forEach(row => {
                row.eachCell((cell, colNumber) => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    if (colNumber === 3) {
                        // Nama mahasiswa rata kiri, yang lain rata tengah
                        cell.alignment = { vertical: 'middle', horizontal: 'left' };
                    }
                    else {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    }
                    if (colNumber >= 5) {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFC6EFCE' }
                        };
                    }
                });
            });
        });
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Disposition', `attachment; filename="Nilai_Mahasiswa_Semester_${semesterCode}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.status(200).send(buffer);
    }
    catch (err) {
        console.error('[Admin] exportGradesBySemester error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat mengunduh nilai.' });
    }
};
exports.exportGradesBySemester = exportGradesBySemester;
// ─── Admin: Preview Grades by Semester ────────────────────────────────────────
/**
 * GET /admin/export/preview?semester_code=...
 * Mengembalikan maksimal 5 baris pertama dari data nilai mahasiswa untuk preview.
 */
const getPreviewGrades = async (req, res) => {
    const semesterCode = req.query.semester_code;
    if (!semesterCode) {
        res.status(400).json({ success: false, message: 'semester_code diperlukan.' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute(`SELECT 
        s.class, 
        s.student_name, 
        s.nim,
        ls.plo05_clo01_commitment AS pa_commitment,
        ls.plo07_clo02_planning AS pa_planning,
        ls.plo05_clo04_guidance AS pa_guidance,
        ls.plo05_clo04_presentation AS pa_presentation,
        ls.plo05_clo04_report AS pa_report,
        ls.plo01_clo05_identification AS pa_identification,
        ms.attendance AS pl_attendance,
        ms.discipline AS pl_discipline,
        ms.commitment AS pl_commitment,
        ms.planning AS pl_planning,
        ms.teamwork AS pl_teamwork,
        ms.guidance AS pl_guidance,
        ms.report AS pl_report,
        ms.problem_solving AS pl_problem_solving
       FROM internship_registrations r
       JOIN students s ON r.nim = s.nim
       LEFT JOIN lecturer_scores ls ON r.registration_id = ls.registration_id
       LEFT JOIN mentor_scores ms ON r.registration_id = ms.registration_id
       WHERE r.semester_code = ?
       ORDER BY s.class ASC, s.student_name ASC
       LIMIT 5`, [semesterCode]);
        res.status(200).json({
            success: true,
            data: rows
        });
    }
    catch (err) {
        console.error('[Admin] getPreviewGrades error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat mengambil preview nilai.' });
    }
};
exports.getPreviewGrades = getPreviewGrades;
