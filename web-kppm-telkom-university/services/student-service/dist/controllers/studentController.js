"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = exports.getProfile = void 0;
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
    const userId = req.user?.sub;
    if (!userId) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    try {
        const [rows] = await db_1.default.execute('SELECT student_id, nim, student_name, class, email FROM students WHERE student_id = ?', [userId]);
        if (!rows || rows.length === 0) {
            res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan' });
            return;
        }
        const s = rows[0];
        res.status(200).json({
            success: true,
            data: {
                student_id: s.student_id,
                nim: s.nim,
                name: s.student_name,
                class: s.class,
                email: s.email,
                prodi: getProdiFromClass(s.class),
                fakultas: 'Fakultas Informatika',
                foto_url: null,
            },
        });
    }
    catch (err) {
        console.error('[Student Service] getProfile error:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.getProfile = getProfile;
// ─── Get Dashboard ────────────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
    const userId = req.user?.sub;
    if (!userId) {
        res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
        return;
    }
    try {
        // 1. Profil mahasiswa
        const [studentRows] = await db_1.default.execute('SELECT student_id, nim, student_name, class, email FROM students WHERE student_id = ?', [userId]);
        if (!studentRows || studentRows.length === 0) {
            res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan' });
            return;
        }
        const s = studentRows[0];
        const profile = {
            student_id: s.student_id,
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
              submitted_at, approved_at
       FROM internship_registrations
       WHERE student_id = ?
       ORDER BY created_at DESC LIMIT 1`, [userId]);
        let kppmStatus;
        if (!regRows || regRows.length === 0) {
            // Belum pernah daftar
            kppmStatus = {
                registration_id: null,
                status: 'belum_daftar',
                current_step: 0,
                steps: [
                    { step: 1, label: 'Pengisian Data', completed: false, date: null },
                    { step: 2, label: 'Verifikasi Dosen', completed: false, date: null },
                    { step: 3, label: 'Persetujuan Perusahaan', completed: false, date: null },
                    { step: 4, label: 'Selesai', completed: false, date: null },
                ],
                next_steps: [
                    { label: 'Isi data pendaftaran KPPM', completed: false },
                    { label: 'Verifikasi oleh Dosen Pembimbing', completed: false },
                    { label: 'Persetujuan Perusahaan', completed: false },
                ],
            };
        }
        else {
            const reg = regRows[0];
            const isPending = reg.status === 'pending_approval';
            const isApproved = reg.status === 'approved';
            kppmStatus = {
                registration_id: reg.registration_id,
                status: reg.status,
                company_name: reg.company_name,
                internship_start: reg.internship_start,
                internship_end: reg.internship_end,
                submitted_at: reg.submitted_at,
                approved_at: reg.approved_at,
                current_step: isApproved ? 4 : 1,
                steps: [
                    { step: 1, label: 'Pengisian Data', completed: true, date: reg.submitted_at },
                    { step: 2, label: 'Verifikasi Dosen', completed: isPending || isApproved, date: isPending ? reg.submitted_at : null },
                    { step: 3, label: 'Persetujuan Perusahaan', completed: isApproved, date: reg.approved_at },
                    { step: 4, label: 'Selesai', completed: isApproved, date: reg.approved_at },
                ],
                next_steps: [
                    { label: 'Isi data pendaftaran KPPM', completed: true },
                    { label: 'Verifikasi Dosen', completed: isPending || isApproved },
                    { label: 'Persetujuan Perusahaan', completed: isApproved },
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
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
};
exports.getDashboard = getDashboard;
