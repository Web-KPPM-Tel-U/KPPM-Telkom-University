import 'dotenv/config';
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import pool from '../config/db';

// ─── Helper: derive prodi from class code ─────────────────────────────────────
function getProdiFromClass(classCode: string): string {
  const code = classCode?.toUpperCase() || '';
  if (code.startsWith('IF'))   return 'S1 Informatika';
  if (code.startsWith('SI'))   return 'S1 Sistem Informasi';
  if (code.startsWith('IK'))   return 'S1 Ilmu Komputasi';
  if (code.startsWith('TI'))   return 'D3 Teknologi Informasi';
  if (code.startsWith('RPL'))  return 'D3 Rekayasa Perangkat Lunak';
  return 'Program Studi Lainnya';
}

// ─── Get Profile ──────────────────────────────────────────────────────────────
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT student_id, nim, student_name, class, email FROM students WHERE student_id = ?',
      [userId]
    );

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
  } catch (err: any) {
    console.error('[Student Service] getProfile error:', err.message);
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      res.status(503).json({ success: false, message: 'Koneksi ke database terputus. Pastikan service database berjalan.' });
    } else {
      res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.' });
    }
  }
};

// ─── Get Dashboard ────────────────────────────────────────────────────────────
export const getDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  try {
    // 1. Profil mahasiswa
    const [studentRows] = await pool.execute<any[]>(
      'SELECT student_id, nim, student_name, class, email FROM students WHERE student_id = ?',
      [userId]
    );

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

    // 2. Status pendaftaran KPPM (ambil yang terbaru, prioritaskan non-cancelled)
    const [regRows] = await pool.execute<any[]>(
      `SELECT registration_id, status, company_name, internship_start, internship_end,
              submitted_at, approved_at, cancelled_at, rejected_at
       FROM internship_registrations
       WHERE student_id = ?
       ORDER BY
         CASE status
           WHEN 'approved'         THEN 1
           WHEN 'pending_approval' THEN 2
           WHEN 'cancelled'        THEN 3
           WHEN 'rejected'         THEN 4
         END,
         created_at DESC
       LIMIT 1`,
      [userId]
    );

    let kppmStatus;
    // Jika tidak ada registrasi AKTIF (belum daftar sama sekali, atau semua sudah dibatalkan/ditolak),
    // tampilkan status "Belum Mendaftar" — cancelled & rejected dianggap reset ke titik awal
    const hasActiveReg = regRows && regRows.length > 0
      && regRows[0].status !== 'cancelled'
      && regRows[0].status !== 'rejected';

    if (!hasActiveReg) {
      // Belum pernah daftar
      kppmStatus = {
        registration_id: null,
        status: 'belum_daftar',
        current_step: 0,
        steps: [
          { step: 1, label: 'Pengisian Data',               completed: false, date: null },
          { step: 2, label: 'Verifikasi Dosen',              completed: false, date: null },
          { step: 3, label: 'Penilaian Pembimbing Lapangan', completed: false, date: null },
          { step: 4, label: 'Penilaian Pembimbing Akademik', completed: false, date: null },
          { step: 5, label: 'Upload Hasil KP',              completed: false, date: null },
        ],
        next_steps: [
          { label: 'Isi data pendaftaran KPPM',          completed: false },
          { label: 'Verifikasi oleh Dosen Pembimbing',   completed: false },
          { label: 'Penilaian Pembimbing Lapangan',      completed: false },
          { label: 'Penilaian Pembimbing Akademik',      completed: false },
          { label: 'Upload Hasil KP',                    completed: false },
        ],
      };
    } else {
      const reg        = regRows[0];
      const isPending  = reg.status === 'pending_approval';
      const isApproved = reg.status === 'approved';
      const isCancelled = reg.status === 'cancelled';

      // Cek apakah mentor sudah menginput nilai (step 3)
      let hasMentorScore = false;
      if (isApproved) {
        const [scoreRows] = await pool.execute<any[]>(
          'SELECT mentor_score_id FROM mentor_scores WHERE registration_id = ? LIMIT 1',
          [reg.registration_id]
        );
        hasMentorScore = scoreRows.length > 0;
      }

      // current_step = index step TERAKHIR yang selesai (0-based dari step 1)
      // pending_approval → hanya step 1 selesai → current_step = 1
      // approved         → step 1 & 2 selesai   → current_step = 2
      // approved + nilai mentor → step 1,2,3 selesai → current_step = 3
      const currentStep = hasMentorScore ? 3 : (isApproved ? 2 : (isPending ? 1 : 0));

      kppmStatus = {
        registration_id:  reg.registration_id,
        status:           reg.status,
        company_name:     reg.company_name,
        internship_start: reg.internship_start,
        internship_end:   reg.internship_end,
        submitted_at:     reg.submitted_at,
        approved_at:      reg.approved_at,
        cancelled_at:     reg.cancelled_at,
        current_step:     currentStep,
        steps: [
          // Step 1: Pengisian Data → selesai begitu ada registrasi (kecuali cancelled)
          { step: 1, label: 'Pengisian Data',               completed: !isCancelled,    date: reg.submitted_at },
          // Step 2: Verifikasi Dosen → selesai hanya jika approved
          { step: 2, label: 'Verifikasi Dosen',              completed: isApproved,      date: isApproved ? reg.approved_at : null },
          // Step 3: Penilaian Pembimbing Lapangan → selesai jika mentor sudah input nilai
          { step: 3, label: 'Penilaian Pembimbing Lapangan', completed: hasMentorScore,  date: null },
          { step: 4, label: 'Penilaian Pembimbing Akademik', completed: false,            date: null },
          { step: 5, label: 'Upload Hasil KP',              completed: false,            date: null },
        ],
        next_steps: [
          { label: 'Isi data pendaftaran KPPM',          completed: !isCancelled },
          { label: 'Verifikasi oleh Dosen Pembimbing',   completed: isApproved },
          { label: 'Penilaian Pembimbing Lapangan',      completed: hasMentorScore },
          { label: 'Penilaian Pembimbing Akademik',      completed: false },
          { label: 'Upload Hasil KP',                    completed: false },
        ],
      };
    }

    res.status(200).json({
      success: true,
      data: { profile, kppm_status: kppmStatus },
    });
  } catch (err: any) {
    console.error('[Student Service] getDashboard error:', err.message);
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      res.status(503).json({ success: false, message: 'Koneksi ke database terputus. Pastikan service database berjalan.' });
    } else {
      res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.' });
    }
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.sub;

  if (!userId) {
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
    const bcrypt = await import('bcryptjs');

    // Ambil password saat ini dari database
    const [rows] = await pool.execute<any[]>(
      'SELECT password FROM students WHERE student_id = ?',
      [userId]
    );

    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan' });
      return;
    }

    const storedPassword = rows[0].password;

    // Verifikasi password lama
    let isCurrentPasswordValid = false;
    if (storedPassword.startsWith('$2')) {
      isCurrentPasswordValid = await bcrypt.compare(currentPassword, storedPassword);
    } else {
      isCurrentPasswordValid = storedPassword === currentPassword;
    }

    if (!isCurrentPasswordValid) {
      res.status(400).json({ success: false, message: 'Password lama yang Anda masukkan salah' });
      return;
    }

    // Hash password baru dan simpan
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE students SET password = ? WHERE student_id = ?',
      [hashedNewPassword, userId]
    );

    res.status(200).json({ success: true, message: 'Password berhasil diubah' });
  } catch (err: any) {
    console.error('[Student Service] changePassword error:', err.message);
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      res.status(503).json({ success: false, message: 'Koneksi ke database terputus.' });
    } else {
      res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.' });
    }
  }
};

