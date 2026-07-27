import 'dotenv/config';
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import pool from '../config/db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ─── Multer Storage Config ────────────────────────────────────────────────────

const uploadDir = path.join(__dirname, '../../uploads/toss');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `toss-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan PDF, JPG, atau PNG.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
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
export const submitRegistration = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  const {
    kode_semester,
    whatsapp,
    perusahaan,
    posisi_divisi,
    tanggal_mulai,
    tanggal_akhir,
    mentor_name,
    mentor_position,
    mentor_email,
    mentor_phone,
    lecturer_id,
  } = req.body;

  // Validasi field wajib
  const requiredFields: Record<string, string> = {
    kode_semester,
    whatsapp,
    perusahaan,
    posisi_divisi,
    tanggal_mulai,
    tanggal_akhir,
    mentor_name,
    mentor_position,
    mentor_email,
    mentor_phone,
    lecturer_id,
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
  const end   = new Date(tanggal_akhir);
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
    const [existingRows] = await pool.execute<any[]>(
      `SELECT registration_id, status
       FROM internship_registrations
       WHERE student_id = ? AND status NOT IN ('cancelled', 'rejected')
       LIMIT 1`,
      [userId]
    );

    if (existingRows && existingRows.length > 0) {
      res.status(409).json({
        success: false,
        message:
          'Anda sudah memiliki pengajuan KPPM yang aktif. Batalkan pengajuan tersebut sebelum mengajukan yang baru.',
      });
      return;
    }

    // Validasi lecturer_id — pastikan dosen ada di DB
    const [lecturerRows] = await pool.execute<any[]>(
      'SELECT lecturer_id, lecturer_name FROM lecturers WHERE lecturer_id = ?',
      [lecturer_id]
    );

    if (!lecturerRows || lecturerRows.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Dosen pembimbing tidak valid. Pilih dosen dari daftar yang tersedia.',
      });
      return;
    }

    const assignedLecturerId = lecturerRows[0].lecturer_id;

    // Insert pendaftaran ke tabel internship_registrations
    const [result] = await pool.execute<any>(
      `INSERT INTO internship_registrations
         (student_id, lecturer_id, semester_code, whatsapp_number,
          company_name, internship_position,
          internship_start, internship_end,
          toss_cover_letter_file,
          mentor_name, mentor_position, mentor_email, mentor_phone,
          status, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', NOW())`,
      [
        userId,
        assignedLecturerId,
        kode_semester.trim(),
        whatsapp.trim(),
        perusahaan.trim(),
        posisi_divisi.trim(),
        tanggal_mulai,
        tanggal_akhir,
        tossFilePath,
        mentor_name.trim(),
        mentor_position.trim(),
        mentor_email.trim(),
        mentor_phone.trim(),
      ]
    );

    res.status(201).json({
      success: true,
      message:
        'Pendaftaran KPPM berhasil dikirim. Menunggu verifikasi pembimbing akademik.',
      data: {
        registration_id:    result.insertId,
        status:             'pending_approval',
        assigned_lecturer:  assignedLecturerId,
        submitted_at:       new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('[KPPM] submitRegistration error:', err.message);

    // MySQL ER_DUP_ENTRY (errno 1062) — terjadi jika ada UNIQUE CONSTRAINT di DB
    // (misal: uq_student_semester). Tampilkan pesan yang ramah, bukan error 500.
    if (err.errno === 1062 || err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        success: false,
        message:
          'Anda sudah memiliki pendaftaran KPPM aktif untuk semester ini. Tidak dapat mengajukan duplikat.',
      });
      return;
    }

    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Get Riwayat Pendaftaran KPPM ────────────────────────────────────────────

/**
 * GET /student/kppm/registrations
 * Query params (opsional):
 *   - limit  : number (default 10, max 100)
 *   - offset : number (default 0)
 */
export const getRegistrations = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  const limit  = Math.min(Number(req.query.limit)  || 10, 100);
  const offset = Number(req.query.offset) || 0;

  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT registration_id, semester_code, company_name, internship_position,
              internship_start, internship_end, status,
              submitted_at, approved_at, cancelled_at, created_at
       FROM internship_registrations
       WHERE student_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [countRows] = await pool.execute<any[]>(
      'SELECT COUNT(*) AS total FROM internship_registrations WHERE student_id = ?',
      [userId]
    );

    res.status(200).json({
      success: true,
      data: rows,
      meta: {
        total:  countRows[0]?.total ?? 0,
        limit,
        offset,
      },
    });
  } catch (err: any) {
    console.error('[KPPM] getRegistrations error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Get Detail Pendaftaran KPPM ──────────────────────────────────────────────

/**
 * GET /student/kppm/registrations/:id
 */
export const getRegistrationDetail = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId         = req.user?.sub;
  const registrationId = Number(req.params.id);

  if (!userId) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  if (isNaN(registrationId)) {
    res.status(400).json({ success: false, message: 'ID pendaftaran tidak valid.' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT r.registration_id, r.semester_code, r.whatsapp_number,
              r.company_name, r.internship_position,
              r.internship_start, r.internship_end,
              r.toss_cover_letter_file,
              r.mentor_name, r.mentor_position, r.mentor_email, r.mentor_phone,
              r.status, r.submitted_at, r.approved_at, r.cancelled_at, r.created_at,
              l.lecturer_name AS pembimbing_akademik,
              s.nim, s.student_name, s.class AS student_class, s.email AS student_email
       FROM internship_registrations r
       LEFT JOIN lecturers l ON l.lecturer_id = r.lecturer_id
       LEFT JOIN students  s ON s.student_id  = r.student_id
       WHERE r.registration_id = ? AND r.student_id = ?`,
      [registrationId, userId]
    );

    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data pendaftaran tidak ditemukan.' });
      return;
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (err: any) {
    console.error('[KPPM] getRegistrationDetail error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Get Daftar Dosen Pembimbing ──────────────────────────────────────────────

/**
 * GET /student/lecturers
 * Mengembalikan list dosen untuk ditampilkan sebagai dropdown di form pendaftaran.
 */
export const getLecturers = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT lecturer_id, lecturer_name, nip FROM lecturers ORDER BY lecturer_name ASC'
    );
    res.status(200).json({ success: true, data: rows });
  } catch (err: any) {
    console.error('[KPPM] getLecturers error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Cancel / Batalkan Pendaftaran KPPM ──────────────────────────────────────

/**
 * DELETE /student/kppm/registrations/:id
 * Membatalkan pendaftaran KPPM (soft delete — status diubah ke 'cancelled').
 * Aturan:
 *  - Hanya pemilik pendaftaran yang dapat membatalkan (student_id harus cocok).
 *  - Hanya bisa dibatalkan jika status masih 'pending_approval'.
 *  - Jika sudah 'approved', pembatalan ditolak.
 *  - Data & file TOSS tetap disimpan untuk keperluan logging / riwayat.
 */
export const cancelRegistration = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId         = req.user?.sub;
  const registrationId = Number(req.params.id);

  if (!userId) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  if (isNaN(registrationId)) {
    res.status(400).json({ success: false, message: 'ID pendaftaran tidak valid.' });
    return;
  }

  try {
    // Cek keberadaan dan kepemilikan pendaftaran
    const [rows] = await pool.execute<any[]>(
      `SELECT registration_id, status
       FROM internship_registrations
       WHERE registration_id = ? AND student_id = ?`,
      [registrationId, userId]
    );

    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data pendaftaran tidak ditemukan.' });
      return;
    }

    const reg = rows[0];

    // Tolak jika sudah disetujui
    if (reg.status === 'approved') {
      res.status(403).json({
        success: false,
        message: 'Pendaftaran yang sudah disetujui tidak dapat dibatalkan.',
      });
      return;
    }

    // Tolak jika sudah dibatalkan sebelumnya
    if (reg.status === 'cancelled') {
      res.status(400).json({
        success: false,
        message: 'Pendaftaran ini sudah dibatalkan sebelumnya.',
      });
      return;
    }

    // Hanya boleh jika masih pending_approval
    if (reg.status !== 'pending_approval') {
      res.status(400).json({
        success: false,
        message: `Pendaftaran dengan status '${reg.status}' tidak dapat dibatalkan.`,
      });
      return;
    }

    // Soft delete: update status ke 'cancelled' + catat waktu pembatalan
    await pool.execute(
      `UPDATE internship_registrations
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE registration_id = ? AND student_id = ?`,
      [registrationId, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Pendaftaran KPPM berhasil dibatalkan.',
    });
  } catch (err: any) {
    console.error('[KPPM] cancelRegistration error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Get Daftar Mahasiswa Bimbingan (untuk Dosen) ────────────────────────────

/**
 * GET /student/lecturer/students
 * Mengembalikan daftar mahasiswa yang punya pengajuan KPPM ke dosen yang login.
 * Requires JWT dengan role 'lecturer'.
 */
export const getLecturerStudents = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const lecturerId = req.user?.sub;
  const role       = req.user?.role;

  if (!lecturerId) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  if (role !== 'lecturer') {
    res.status(403).json({ success: false, message: 'Akses ditolak. Hanya untuk dosen.' });
    return;
  }

  const limit  = Math.min(Number(req.query.limit)  || 50, 100);
  const offset = Number(req.query.offset) || 0;

  try {
    // Ambil semua pengajuan yang ditujukan ke dosen ini, beserta data mahasiswa
    const [rows] = await pool.execute<any[]>(
      `SELECT
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
         r.mentor_position,
         r.mentor_email,
         r.mentor_phone,
         r.toss_cover_letter_file,
         IF(ls.registration_id IS NOT NULL, 1, 0) AS is_graded
       FROM internship_registrations r
       JOIN students s ON s.student_id = r.student_id
       LEFT JOIN lecturer_scores ls ON ls.registration_id = r.registration_id
       WHERE r.lecturer_id = ?
       ORDER BY r.submitted_at DESC
       LIMIT ? OFFSET ?`,
      [lecturerId, limit, offset]
    );

    const [countRows] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS total
       FROM internship_registrations
       WHERE lecturer_id = ?`,
      [lecturerId]
    );

    res.status(200).json({
      success: true,
      data: rows,
      meta: {
        total:  countRows[0]?.total ?? 0,
        limit,
        offset,
      },
    });
  } catch (err: any) {
    console.error('[KPPM] getLecturerStudents error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};


// --- Update Status Pengajuan (untuk Dosen) ---

export const updateRegistrationStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const lecturerId     = req.user?.sub;
  const role           = req.user?.role;
  const registrationId = Number(req.params.id);
  const { action }     = req.body as { action: 'approved' | 'cancelled' };

  if (!lecturerId) { res.status(401).json({ success: false, message: 'Tidak terautentikasi.' }); return; }
  if (role !== 'lecturer') { res.status(403).json({ success: false, message: 'Akses ditolak. Hanya untuk dosen.' }); return; }
  if (isNaN(registrationId)) { res.status(400).json({ success: false, message: 'ID pendaftaran tidak valid.' }); return; }
  if (!['approved', 'rejected'].includes(action)) { res.status(400).json({ success: false, message: 'Aksi tidak valid.' }); return; }

  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT registration_id, status FROM internship_registrations WHERE registration_id = ? AND lecturer_id = ?`,
      [registrationId, lecturerId]
    );
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
      await pool.execute(
        `UPDATE internship_registrations SET status = 'approved', approved_at = NOW() WHERE registration_id = ?`,
        [registrationId]
      );
      res.status(200).json({ success: true, message: 'Pengajuan berhasil disetujui.' });
    } else {
      await pool.execute(
        `UPDATE internship_registrations SET status = 'rejected', rejected_at = NOW() WHERE registration_id = ?`,
        [registrationId]
      );
      res.status(200).json({ success: true, message: 'Pengajuan berhasil ditolak.' });
    }
  } catch (err: any) {
    console.error('[KPPM] updateRegistrationStatus error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};
