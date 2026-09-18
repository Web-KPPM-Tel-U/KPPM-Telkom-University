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
exports.getMyGrades = exports.changePassword = exports.getDashboard = exports.updateProfile = exports.getProfile = void 0;
require("dotenv/config");
const db_1 = __importDefault(require("../config/db"));
// ─── Helper: derive prodi from class code ─────────────────────────────────────
function getProdiFromClass(classCode) {
    const code = classCode?.toUpperCase() || '';
    if (code.startsWith('IF'))
        return 'S1 Informatika';
    if (code.startsWith('SI'))
        return 'S1 Sistem Informasi';
    if (code.startsWith('IK'))
        return 'S1 Ilmu Komputasi';
    if (code.startsWith('TI'))
        return 'D3 Teknologi Informasi';
    if (code.startsWith('RPL'))
        return 'D3 Rekayasa Perangkat Lunak';
    return 'Program Studi Lainnya';
}
// ─── Get Profile ──────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
    const nim = req.user?.nim || String(req.user?.sub || '');
    if (!nim) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute(`SELECT s.nim, s.student_name, s.class, s.email, s.assigned_lecturer_code,
              l.nip AS assigned_lecturer_nip, l.lecturer_name AS assigned_lecturer_name
       FROM students s
       LEFT JOIN lecturers l ON l.lecturer_code = s.assigned_lecturer_code
       WHERE s.nim = ?`, [nim]);
        if (!rows || rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan' });
            return;
        }
        const s = rows[0];
        res.status(200).json({
            success: true,
            data: {
                nim: s.nim,
                name: s.student_name,
                class: s.class,
                email: s.email,
                prodi: getProdiFromClass(s.class),
                fakultas: 'Fakultas Informatika',
                foto_url: null,
                assigned_lecturer_code: s.assigned_lecturer_code ?? null,
                assigned_lecturer_nip: s.assigned_lecturer_nip ?? null,
                assigned_lecturer_name: s.assigned_lecturer_name ?? null,
            },
        });
    }
    catch (err) {
        console.error('[Student Service] getProfile error:', err.message);
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
            res.status(503).json({ success: false, message: 'Koneksi ke database terputus. Pastikan service database berjalan.' });
        }
        else {
            res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.' });
        }
    }
};
exports.getProfile = getProfile;
// ─── Update Profile (Email) ───────────────────────────────────────────────────
const updateProfile = async (req, res) => {
    const nim = req.user?.nim || String(req.user?.sub || '');
    if (!nim) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    const { email } = req.body;
    if (email === undefined) {
        res.status(400).json({ success: false, message: 'Data email wajib disertakan' });
        return;
    }
    try {
        await db_1.default.execute('UPDATE students SET email = ?, updated_at = NOW() WHERE nim = ?', [email?.trim() || null, nim]);
        res.status(200).json({ success: true, message: 'Email berhasil diperbarui' });
    }
    catch (err) {
        console.error('[Student Service] updateProfile error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.' });
    }
};
exports.updateProfile = updateProfile;
// ─── Get Dashboard ────────────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
    const nim = req.user?.nim || String(req.user?.sub || '');
    if (!nim) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    try {
        // 1. Profil mahasiswa (include assigned lecturer)
        const [studentRows] = await db_1.default.execute(`SELECT s.nim, s.student_name, s.class, s.email, s.assigned_lecturer_code,
              l.nip AS assigned_lecturer_nip, l.lecturer_name AS assigned_lecturer_name
       FROM students s
       LEFT JOIN lecturers l ON l.lecturer_code = s.assigned_lecturer_code
       WHERE s.nim = ?`, [nim]);
        if (!studentRows || studentRows.length === 0) {
            res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan' });
            return;
        }
        const s = studentRows[0];
        const profile = {
            nim: s.nim,
            name: s.student_name,
            class: s.class,
            email: s.email,
            prodi: getProdiFromClass(s.class),
            fakultas: 'Fakultas Informatika',
            foto_url: null,
        };
        // 2. Status pendaftaran KPPM
        const [regRows] = await db_1.default.execute(`SELECT registration_id, status, company_name, internship_start, internship_end,
              submitted_at, approved_at, cancelled_at, rejected_at
       FROM internship_registrations
       WHERE nim = ?
       ORDER BY
         CASE status
           WHEN 'approved'         THEN 1
           WHEN 'pending_approval' THEN 2
           WHEN 'cancelled'        THEN 3
           WHEN 'rejected'         THEN 4
         END,
         created_at DESC
       LIMIT 1`, [nim]);
        let kppmStatus;
        const hasActiveReg = regRows && regRows.length > 0
            && regRows[0].status !== 'cancelled'
            && regRows[0].status !== 'rejected';
        if (!hasActiveReg) {
            kppmStatus = {
                registration_id: null,
                status: 'belum_daftar',
                current_step: 0,
                steps: [
                    { step: 1, label: 'Pengisian Data', completed: false, date: null },
                    { step: 2, label: 'Verifikasi Dosen', completed: false, date: null },
                    { step: 3, label: 'Penilaian Pembimbing Lapangan', completed: false, date: null },
                    { step: 4, label: 'Penilaian Pembimbing Akademik', completed: false, date: null },
                    { step: 5, label: 'Upload Hasil KP', completed: false, date: null },
                ],
                next_steps: [
                    { label: 'Isi data pendaftaran KPPM', completed: false },
                    { label: 'Verifikasi oleh Dosen Pembimbing', completed: false },
                    { label: 'Penilaian Pembimbing Lapangan', completed: false },
                    { label: 'Penilaian Pembimbing Akademik', completed: false },
                    { label: 'Upload Hasil KP', completed: false },
                ],
            };
        }
        else {
            const reg = regRows[0];
            const isPending = reg.status === 'pending_approval';
            const isApproved = reg.status === 'approved';
            const isCancelled = reg.status === 'cancelled';
            let hasMentorScore = false;
            if (isApproved) {
                const [scoreRows] = await db_1.default.execute('SELECT mentor_score_id FROM mentor_scores WHERE registration_id = ? LIMIT 1', [reg.registration_id]);
                hasMentorScore = scoreRows.length > 0;
            }
            let hasLecturerScore = false;
            if (isApproved) {
                const [lsRows] = await db_1.default.execute('SELECT lecturer_score_id FROM lecturer_scores WHERE registration_id = ? LIMIT 1', [reg.registration_id]);
                hasLecturerScore = lsRows.length > 0;
            }
            let hasUploadedDocs = false;
            if (isApproved) {
                const [docRows] = await db_1.default.execute('SELECT document_id FROM internship_documents WHERE registration_id = ? LIMIT 1', [reg.registration_id]);
                hasUploadedDocs = docRows.length > 0;
            }
            const currentStep = hasUploadedDocs ? 5
                : hasLecturerScore ? 4
                    : hasMentorScore ? 3
                        : isApproved ? 2
                            : isPending ? 1
                                : 0;
            kppmStatus = {
                registration_id: reg.registration_id,
                status: reg.status,
                company_name: reg.company_name,
                internship_start: reg.internship_start,
                internship_end: reg.internship_end,
                submitted_at: reg.submitted_at,
                approved_at: reg.approved_at,
                cancelled_at: reg.cancelled_at,
                current_step: currentStep,
                steps: [
                    { step: 1, label: 'Pengisian Data', completed: !isCancelled, date: reg.submitted_at },
                    { step: 2, label: 'Verifikasi Dosen', completed: isApproved, date: isApproved ? reg.approved_at : null },
                    { step: 3, label: 'Penilaian Pembimbing Lapangan', completed: hasMentorScore, date: null },
                    { step: 4, label: 'Penilaian Pembimbing Akademik', completed: hasLecturerScore, date: null },
                    { step: 5, label: 'Upload Hasil KP', completed: hasUploadedDocs, date: null },
                ],
                next_steps: [
                    { label: 'Isi data pendaftaran KPPM', completed: !isCancelled },
                    { label: 'Verifikasi oleh Dosen Pembimbing', completed: isApproved },
                    { label: 'Penilaian Pembimbing Lapangan', completed: hasMentorScore },
                    { label: 'Penilaian Pembimbing Akademik', completed: hasLecturerScore },
                    { label: 'Upload Hasil KP', completed: hasUploadedDocs },
                ],
            };
        }
        res.status(200).json({
            success: true,
            data: { profile, kppm_status: kppmStatus },
        });
    }
    catch (err) {
        console.error('[Student Service] getDashboard error:', err.message);
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
            res.status(503).json({ success: false, message: 'Koneksi ke database terputus. Pastikan service database berjalan.' });
        }
        else {
            res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.' });
        }
    }
};
exports.getDashboard = getDashboard;
// ─── Change Password ──────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
    const nim = req.user?.nim || String(req.user?.sub || '');
    if (!nim) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, message: 'Password lama dan password baru wajib diisi' });
        return;
    }
    if (newPassword.length < 8) {
        res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter' });
        return;
    }
    if (currentPassword === newPassword) {
        res.status(400).json({ success: false, message: 'Password baru tidak boleh sama dengan password lama' });
        return;
    }
    try {
        const bcrypt = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
        const [rows] = await db_1.default.execute('SELECT password FROM students WHERE nim = ?', [nim]);
        if (!rows || rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan' });
            return;
        }
        const storedPassword = rows[0].password;
        let isCurrentPasswordValid = false;
        if (storedPassword.startsWith('$2')) {
            isCurrentPasswordValid = await bcrypt.compare(currentPassword, storedPassword);
        }
        else {
            isCurrentPasswordValid = storedPassword === currentPassword;
        }
        if (!isCurrentPasswordValid) {
            res.status(400).json({ success: false, message: 'Password lama yang Anda masukkan salah' });
            return;
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await db_1.default.execute('UPDATE students SET password = ? WHERE nim = ?', [hashedNewPassword, nim]);
        res.status(200).json({ success: true, message: 'Password berhasil diubah' });
    }
    catch (err) {
        console.error('[Student Service] changePassword error:', err.message);
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
            res.status(503).json({ success: false, message: 'Koneksi ke database terputus.' });
        }
        else {
            res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.' });
        }
    }
};
exports.changePassword = changePassword;
// ─── Get My Grades ────────────────────────────────────────────────────────────
const MENTOR_BOBOT = {
    attendance: 5, discipline: 5, commitment: 5, planning: 5,
    teamwork: 10, guidance: 5, report: 5, problem_solving: 5,
};
const getMyGrades = async (req, res) => {
    const nim = req.user?.nim || String(req.user?.sub || '');
    if (!nim) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    try {
        const [regRows] = await db_1.default.execute(`SELECT ir.registration_id, ir.company_name, ir.internship_position,
              ir.internship_start, ir.internship_end, ir.semester_code,
              ir.mentor_name, ir.mentor_nip, ir.mentor_position, ir.mentor_email,
              ir.lecturer_nip,
              ir.submitted_at, ir.approved_at,
              l.lecturer_name AS dosen_name, l.nip AS dosen_nip
       FROM internship_registrations ir
       JOIN lecturers l ON ir.lecturer_nip = l.nip
       WHERE ir.nim = ? AND ir.status = 'approved'
       ORDER BY ir.approved_at DESC
       LIMIT 1`, [nim]);
        if (regRows.length === 0) {
            res.status(200).json({
                success: true,
                data: null,
                message: 'Belum ada pendaftaran KPPM yang disetujui',
            });
            return;
        }
        const reg = regRows[0];
        const [mentorRows] = await db_1.default.execute('SELECT * FROM mentor_scores WHERE registration_id = ?', [reg.registration_id]);
        let mentorGrades = null;
        if (mentorRows.length > 0) {
            const ms = mentorRows[0];
            const fields = Object.keys(MENTOR_BOBOT);
            const total = fields.reduce((sum, f) => sum + (MENTOR_BOBOT[f] / 100) * Number(ms[f]), 0);
            mentorGrades = {
                attendance: Number(ms.attendance),
                discipline: Number(ms.discipline),
                commitment: Number(ms.commitment),
                planning: Number(ms.planning),
                teamwork: Number(ms.teamwork),
                guidance: Number(ms.guidance),
                report: Number(ms.report),
                problem_solving: Number(ms.problem_solving),
                total: parseFloat(total.toFixed(2)),
                updated_at: ms.updated_at,
            };
        }
        const [lecturerRows] = await db_1.default.execute('SELECT * FROM lecturer_scores WHERE registration_id = ?', [reg.registration_id]);
        const LECTURER_BOBOT = {
            commitment: 10,
            planning: 5,
            guidance: 5,
            presentation: 15,
            report: 10,
            identification: 10,
        };
        let lecturerGrades = null;
        if (lecturerRows.length > 0) {
            const ls = lecturerRows[0];
            const scores = {
                commitment: Number(ls.plo05_clo01_commitment),
                planning: Number(ls.plo07_clo02_planning),
                guidance: Number(ls.plo05_clo04_guidance),
                presentation: Number(ls.plo05_clo04_presentation),
                report: Number(ls.plo05_clo04_report),
                identification: Number(ls.plo01_clo05_identification),
            };
            const total = Object.keys(LECTURER_BOBOT).reduce((sum, f) => sum + (LECTURER_BOBOT[f] / 100) * scores[f], 0);
            lecturerGrades = {
                ...scores,
                total: parseFloat(total.toFixed(2)),
                updated_at: ls.updated_at,
            };
        }
        res.status(200).json({
            success: true,
            data: {
                registration: {
                    registration_id: reg.registration_id,
                    company_name: reg.company_name,
                    internship_position: reg.internship_position,
                    internship_start: reg.internship_start,
                    internship_end: reg.internship_end,
                    semester_code: reg.semester_code,
                    mentor_name: reg.mentor_name,
                    mentor_nip: reg.mentor_nip ?? '',
                    mentor_position: reg.mentor_position,
                    dosen_name: reg.dosen_name,
                    dosen_nip: reg.dosen_nip ?? '',
                    submitted_at: reg.submitted_at,
                    approved_at: reg.approved_at,
                },
                mentor_grades: mentorGrades,
                lecturer_grades: lecturerGrades,
            },
        });
    }
    catch (err) {
        console.error('[Student Service] getMyGrades error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.' });
    }
};
exports.getMyGrades = getMyGrades;
