import { Response } from 'express';
import { Request as ExpressRequest } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as XLSX from 'xlsx';
import { parse as csvParse } from 'csv-parse/sync';
import bcrypt from 'bcryptjs';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InjectResult {
  inserted: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

// ─── Admin: Get Dashboard Stats ───────────────────────────────────────────────

/**
 * GET /admin/stats
 * Mengembalikan statistik ringkasan untuk dashboard admin.
 */
export const getAdminStats = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const [[studentRow]] = await pool.execute<any[]>(
      'SELECT COUNT(*) AS total FROM students'
    );
    const [[lecturerRow]] = await pool.execute<any[]>(
      'SELECT COUNT(*) AS total FROM lecturers'
    );
    const [[pendingRow]] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS total FROM internship_registrations WHERE status = 'pending_approval'`
    );
    const [[approvedRow]] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS total FROM internship_registrations WHERE status = 'approved'`
    );
    const [[activeSemRow]] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS total FROM semester_codes WHERE is_active = 1`
    );
    const [[totalRegRow]] = await pool.execute<any[]>(
      'SELECT COUNT(*) AS total FROM internship_registrations'
    );

    res.status(200).json({
      success: true,
      data: {
        total_students:         studentRow?.total  ?? 0,
        total_lecturers:        lecturerRow?.total ?? 0,
        pending_registrations:  pendingRow?.total  ?? 0,
        approved_registrations: approvedRow?.total ?? 0,
        active_semesters:       activeSemRow?.total ?? 0,
        total_registrations:    totalRegRow?.total  ?? 0,
      },
    });
  } catch (err: any) {
    console.error('[Admin] getAdminStats error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Admin: Get All Lecturers ──────────────────────────────────────────────────

/**
 * GET /admin/lecturers
 * Mengembalikan daftar seluruh dosen.
 */
export const getAdminLecturers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const limit  = Math.min(Number(req.query.limit)  || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const search = (req.query.search as string) || '';

  try {
    const searchParam = `%${search}%`;
    const [rows] = await pool.execute<any[]>(
      `SELECT nip, lecturer_name, email, is_verified, password_changed, created_at, updated_at
       FROM lecturers
       WHERE lecturer_name LIKE ? OR nip LIKE ?
       ORDER BY lecturer_name ASC
       LIMIT ? OFFSET ?`,
      [searchParam, searchParam, limit, offset]
    );

    const [[countRow]] = await pool.execute<any[]>(
      'SELECT COUNT(*) AS total FROM lecturers WHERE lecturer_name LIKE ? OR nip LIKE ?',
      [searchParam, searchParam]
    );

    res.status(200).json({
      success: true,
      data: rows,
      meta: { total: countRow?.total ?? 0, limit, offset },
    });
  } catch (err: any) {
    console.error('[Admin] getAdminLecturers error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Admin: Get Semester Codes ────────────────────────────────────────────────

/**
 * GET /admin/semesters
 * Mengembalikan daftar kode semester.
 */
export const getAdminSemesters = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT * FROM semester_codes ORDER BY created_at DESC'
    );
    res.status(200).json({ success: true, data: rows });
  } catch (err: any) {
    console.error('[Admin] getAdminSemesters error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Admin: Get All Students ───────────────────────────────────────────────────

/**
 * GET /admin/students
 * Mengembalikan daftar seluruh mahasiswa.
 */
export const getAdminStudents = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const limit  = Math.min(Number(req.query.limit)  || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const search = (req.query.search as string) || '';

  try {
    const searchParam = `%${search}%`;
    const [rows] = await pool.execute<any[]>(
      `SELECT nim, student_name, class, email, is_verified, password_changed, created_at
       FROM students
       WHERE student_name LIKE ? OR nim LIKE ?
       ORDER BY student_name ASC
       LIMIT ? OFFSET ?`,
      [searchParam, searchParam, limit, offset]
    );

    const [[countRow]] = await pool.execute<any[]>(
      'SELECT COUNT(*) AS total FROM students WHERE student_name LIKE ? OR nim LIKE ?',
      [searchParam, searchParam]
    );

    res.status(200).json({
      success: true,
      data: rows,
      meta: { total: countRow?.total ?? 0, limit, offset },
    });
  } catch (err: any) {
    console.error('[Admin] getAdminStudents error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Helper: Parse file ke array of objects ──────────────────────────────────

function parseFile(buffer: Buffer, mimetype: string, originalname: string): Record<string, string>[] {
  const ext = originalname.toLowerCase().split('.').pop();
  const isExcel = ext === 'xlsx' || ext === 'xls' ||
    mimetype.includes('spreadsheet') || mimetype.includes('excel');

  if (isExcel) {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
  }

  // CSV
  return csvParse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];
}

// ─── Helper: Normalisasi header fleksibel ─────────────────────────────────────

const STUDENT_FIELD_MAP: Record<string, string> = {
  nim: 'nim', 'nomor induk mahasiswa': 'nim', 'no induk': 'nim',
  student_name: 'student_name', 'nama': 'student_name', 'nama mahasiswa': 'student_name',
  'nama lengkap': 'student_name',
  class: 'class', 'kelas': 'class',
  email: 'email',
};

const LECTURER_FIELD_MAP: Record<string, string> = {
  nip: 'nip', 'nomor induk pegawai': 'nip', 'no induk pegawai': 'nip',
  lecturer_name: 'lecturer_name', 'nama': 'lecturer_name', 'nama dosen': 'lecturer_name',
  'nama lengkap': 'lecturer_name',
  email: 'email',
};

function normalizeRow(
  raw: Record<string, string>,
  fieldMap: Record<string, string>
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, val] of Object.entries(raw)) {
    const std = fieldMap[key.toLowerCase().trim()];
    if (std) normalized[std] = String(val).trim();
  }
  return normalized;
}

// ─── Admin: Inject Students ───────────────────────────────────────────────────

/**
 * POST /admin/inject/students
 * Upload CSV atau XLSX mahasiswa → batch insert ke tabel students.
 * Password default = NIM mahasiswa.
 */
export const injectStudents = async (
  req: ExpressRequest,
  res: Response
): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'File wajib diupload.' });
    return;
  }

  let rawRows: Record<string, string>[];
  try {
    rawRows = parseFile(req.file.buffer, req.file.mimetype, req.file.originalname);
  } catch {
    res.status(422).json({ success: false, message: 'File tidak dapat dibaca. Pastikan format CSV atau XLSX yang valid.' });
    return;
  }

  if (rawRows.length === 0) {
    res.status(422).json({ success: false, message: 'File kosong atau tidak memiliki baris data.' });
    return;
  }

  const result: InjectResult = { inserted: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rawRows.length; i++) {
    const rowNum = i + 2;
    const row = normalizeRow(rawRows[i], STUDENT_FIELD_MAP);

    if (!row.nim)          { result.errors.push({ row: rowNum, message: 'Kolom NIM kosong atau tidak ditemukan.' }); continue; }
    if (!row.student_name) { result.errors.push({ row: rowNum, message: `NIM ${row.nim}: Kolom nama mahasiswa kosong.` }); continue; }
    if (!row.class)        { result.errors.push({ row: rowNum, message: `NIM ${row.nim}: Kolom kelas kosong.` }); continue; }

    try {
      const hashedPassword = await bcrypt.hash(row.nim, 10);
      const [insertRes] = await pool.execute<any>(
        `INSERT IGNORE INTO students (nim, student_name, class, email, password)
         VALUES (?, ?, ?, ?, ?)`,
        [row.nim, row.student_name, row.class, row.email || null, hashedPassword]
      );
      if (insertRes.affectedRows === 0) {
        result.skipped++;
      } else {
        result.inserted++;
      }
    } catch (err: any) {
      result.errors.push({ row: rowNum, message: `NIM ${row.nim}: ${err.message}` });
    }
  }

  res.status(200).json({
    success: true,
    message: `Proses selesai: ${result.inserted} ditambahkan, ${result.skipped} dilewati, ${result.errors.length} error.`,
    data: result,
  });
};

// ─── Admin: Inject Lecturers ──────────────────────────────────────────────────

/**
 * POST /admin/inject/lecturers
 * Upload CSV atau XLSX dosen → batch insert ke tabel lecturers.
 * Password default = NIP dosen.
 */
export const injectLecturers = async (
  req: ExpressRequest,
  res: Response
): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'File wajib diupload.' });
    return;
  }

  let rawRows: Record<string, string>[];
  try {
    rawRows = parseFile(req.file.buffer, req.file.mimetype, req.file.originalname);
  } catch {
    res.status(422).json({ success: false, message: 'File tidak dapat dibaca. Pastikan format CSV atau XLSX yang valid.' });
    return;
  }

  if (rawRows.length === 0) {
    res.status(422).json({ success: false, message: 'File kosong atau tidak memiliki baris data.' });
    return;
  }

  const result: InjectResult = { inserted: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rawRows.length; i++) {
    const rowNum = i + 2;
    const row = normalizeRow(rawRows[i], LECTURER_FIELD_MAP);

    if (!row.nip)           { result.errors.push({ row: rowNum, message: 'Kolom NIP kosong atau tidak ditemukan.' }); continue; }
    if (!row.lecturer_name) { result.errors.push({ row: rowNum, message: `NIP ${row.nip}: Kolom nama dosen kosong.` }); continue; }

    try {
      const hashedPassword = await bcrypt.hash(row.nip, 10);
      const [insertRes] = await pool.execute<any>(
        `INSERT IGNORE INTO lecturers (nip, lecturer_name, email, password)
         VALUES (?, ?, ?, ?)`,
        [row.nip, row.lecturer_name, row.email || null, hashedPassword]
      );
      if (insertRes.affectedRows === 0) {
        result.skipped++;
      } else {
        result.inserted++;
      }
    } catch (err: any) {
      result.errors.push({ row: rowNum, message: `NIP ${row.nip}: ${err.message}` });
    }
  }

  res.status(200).json({
    success: true,
    message: `Proses selesai: ${result.inserted} ditambahkan, ${result.skipped} dilewati, ${result.errors.length} error.`,
    data: result,
  });
};

// ─── Admin/PIC: Update Dosen ──────────────────────────────────────────────────

/**
 * PATCH /admin/lecturers/:nip
 * PIC dapat mengubah nama dan email dosen.
 */
export const updateLecturer = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { nip } = req.params;
  const { lecturer_name, email } = req.body as { lecturer_name?: string; email?: string };

  if (!lecturer_name?.trim() && email === undefined) {
    res.status(400).json({ success: false, message: 'Tidak ada data yang akan diubah.' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT nip FROM lecturers WHERE nip = ?',
      [nip]
    );
    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dosen tidak ditemukan.' });
      return;
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (lecturer_name?.trim()) {
      fields.push('lecturer_name = ?');
      values.push(lecturer_name.trim());
    }
    if (email !== undefined) {
      fields.push('email = ?');
      values.push(email?.trim() || null);
    }

    values.push(nip);
    await pool.execute(
      `UPDATE lecturers SET ${fields.join(', ')}, updated_at = NOW() WHERE nip = ?`,
      values
    );

    const [updated] = await pool.execute<any[]>(
      'SELECT nip, lecturer_name, email, is_verified, password_changed, updated_at FROM lecturers WHERE nip = ?',
      [nip]
    );

    res.status(200).json({
      success: true,
      message: 'Data dosen berhasil diperbarui.',
      data: updated[0],
    });
  } catch (err: any) {
    console.error('[Admin] updateLecturer error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Admin: Toggle Account Status ─────────────────────────────────────────────

/**
 * PATCH /admin/lecturers/:nip/toggle-status
 */
export const toggleLecturerStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { nip } = req.params;
  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT nip, is_active FROM lecturers WHERE nip = ?',
      [nip]
    );
    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dosen tidak ditemukan.' });
      return;
    }
    const newStatus = rows[0].is_active === 1 ? 0 : 1;
    await pool.execute(
      'UPDATE lecturers SET is_active = ?, updated_at = NOW() WHERE nip = ?',
      [newStatus, nip]
    );
    res.status(200).json({
      success: true,
      message: newStatus === 1 ? 'Akun dosen berhasil diaktifkan.' : 'Akun dosen berhasil dinonaktifkan.',
      data: { nip, is_active: newStatus },
    });
  } catch (err: any) {
    console.error('[Admin] toggleLecturerStatus error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

/**
 * PATCH /admin/students/:nim/toggle-status
 */
export const toggleStudentStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { nim } = req.params;
  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT nim, is_active FROM students WHERE nim = ?',
      [nim]
    );
    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: 'Mahasiswa tidak ditemukan.' });
      return;
    }
    const newStatus = rows[0].is_active === 1 ? 0 : 1;
    await pool.execute(
      'UPDATE students SET is_active = ?, updated_at = NOW() WHERE nim = ?',
      [newStatus, nim]
    );
    res.status(200).json({
      success: true,
      message: newStatus === 1 ? 'Akun mahasiswa berhasil diaktifkan.' : 'Akun mahasiswa berhasil dinonaktifkan.',
      data: { nim, is_active: newStatus },
    });
  } catch (err: any) {
    console.error('[Admin] toggleStudentStatus error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Admin: Create Semester ───────────────────────────────────────────────────

/**
 * POST /admin/semesters
 */
export const createSemester = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { code, label } = req.body as { code?: string; label?: string };

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
    const [existing] = await pool.execute<any[]>(
      'SELECT semester_id FROM semester_codes WHERE code = ?',
      [codeClean]
    );
    if (existing && existing.length > 0) {
      res.status(409).json({ success: false, message: `Kode semester "${codeClean}" sudah ada.` });
      return;
    }

    const [insertRes] = await pool.execute<any>(
      'INSERT INTO semester_codes (code, label, is_active) VALUES (?, ?, 0)',
      [codeClean, label.trim()]
    );

    const [newRow] = await pool.execute<any[]>(
      'SELECT * FROM semester_codes WHERE semester_id = ?',
      [(insertRes as any).insertId]
    );

    res.status(201).json({
      success: true,
      message: `Semester "${codeClean}" berhasil dibuat.`,
      data: newRow[0],
    });
  } catch (err: any) {
    console.error('[Admin] createSemester error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Admin: Toggle Semester Status ───────────────────────────────────────────

/**
 * PATCH /admin/semesters/:id/toggle-status
 */
export const toggleSemesterStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT semester_id, code, is_active FROM semester_codes WHERE semester_id = ?',
      [id]
    );
    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: 'Semester tidak ditemukan.' });
      return;
    }
    const newStatus = rows[0].is_active === 1 ? 0 : 1;
    await pool.execute(
      'UPDATE semester_codes SET is_active = ?, updated_at = NOW() WHERE semester_id = ?',
      [newStatus, id]
    );
    res.status(200).json({
      success: true,
      message: newStatus === 1
        ? `Semester "${rows[0].code}" berhasil diaktifkan.`
        : `Semester "${rows[0].code}" berhasil dinonaktifkan.`,
      data: { semester_id: rows[0].semester_id, code: rows[0].code, is_active: newStatus },
    });
  } catch (err: any) {
    console.error('[Admin] toggleSemesterStatus error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};
