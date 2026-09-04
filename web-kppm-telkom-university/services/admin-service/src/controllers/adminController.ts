import { Response } from 'express';
import { Request as ExpressRequest } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
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
      `SELECT nip, lecturer_name, lecturer_code, email, is_verified, password_changed, is_active, created_at, updated_at
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
      `SELECT s.nim, s.student_name, s.class, s.email, s.is_verified, s.password_changed,
              s.is_active, s.created_at, s.assigned_lecturer_code,
              l.lecturer_name AS assigned_lecturer_name
       FROM students s
       LEFT JOIN lecturers l ON l.lecturer_code = s.assigned_lecturer_code
       WHERE s.student_name LIKE ? OR s.nim LIKE ?
       ORDER BY s.student_name ASC
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
  lecturer_code: 'lecturer_code', 'kode': 'lecturer_code', 'kode dosen': 'lecturer_code',
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

// ─── Admin: Create Student Manually ──────────────────────────────────────────

/**
 * POST /admin/students/add
 */
export const createStudent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { nim, student_name, class: kelas, email } = req.body as { nim: string; student_name: string; class: string; email?: string };

  if (!nim?.trim() || !student_name?.trim() || !kelas?.trim()) {
    res.status(400).json({ success: false, message: 'NIM, Nama, dan Kelas wajib diisi.' });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(nim.trim(), 10);
    const [insertRes] = await pool.execute<any>(
      `INSERT INTO students (nim, student_name, class, email, password, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [nim.trim(), student_name.trim(), kelas.trim(), email?.trim() || null, hashedPassword]
    );

    const [newRow] = await pool.execute<any[]>(
      'SELECT nim, student_name, class, email, is_verified, password_changed, is_active, created_at FROM students WHERE nim = ?',
      [nim.trim()]
    );

    res.status(201).json({
      success: true,
      message: `Mahasiswa ${nim.trim()} berhasil ditambahkan.`,
      data: newRow[0],
    });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ success: false, message: `Mahasiswa dengan NIM ${nim.trim()} sudah terdaftar.` });
      return;
    }
    console.error('[Admin] createStudent error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Admin: Create Lecturer Manually ─────────────────────────────────────────

/**
 * POST /admin/lecturers/add
 */
export const createLecturer = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { nip, lecturer_name, lecturer_code, email } = req.body as { nip: string; lecturer_name: string; lecturer_code: string; email?: string };

  if (!nip?.trim() || !lecturer_name?.trim() || !lecturer_code?.trim()) {
    res.status(400).json({ success: false, message: 'NIP, Nama Dosen, dan Kode Dosen wajib diisi.' });
    return;
  }
  if (lecturer_code.trim().length > 3) {
    res.status(400).json({ success: false, message: 'Kode Dosen maksimal 3 karakter.' });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(nip.trim(), 10);
    const [insertRes] = await pool.execute<any>(
      `INSERT INTO lecturers (nip, lecturer_name, lecturer_code, email, password, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [nip.trim(), lecturer_name.trim(), lecturer_code.trim().toUpperCase(), email?.trim() || null, hashedPassword]
    );

    const [newRow] = await pool.execute<any[]>(
      'SELECT nip, lecturer_name, lecturer_code, email, is_verified, password_changed, is_active, created_at, updated_at FROM lecturers WHERE nip = ?',
      [nip.trim()]
    );

    res.status(201).json({
      success: true,
      message: `Dosen ${nip.trim()} berhasil ditambahkan.`,
      data: newRow[0],
    });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ success: false, message: `Dosen dengan NIP ${nip.trim()} sudah terdaftar.` });
      return;
    }
    console.error('[Admin] createLecturer error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

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
    if (!row.lecturer_code) { result.errors.push({ row: rowNum, message: `NIP ${row.nip}: Kolom kode dosen kosong (wajib diisi).` }); continue; }
    if (row.lecturer_code.trim().length > 3) { result.errors.push({ row: rowNum, message: `NIP ${row.nip}: Kode dosen maksimal 3 karakter.` }); continue; }

    try {
      const hashedPassword = await bcrypt.hash(row.nip, 10);
      const [insertRes] = await pool.execute<any>(
        `INSERT IGNORE INTO lecturers (nip, lecturer_name, lecturer_code, email, password)
         VALUES (?, ?, ?, ?, ?)`,
        [row.nip, row.lecturer_name, row.lecturer_code.trim().toUpperCase(), row.email || null, hashedPassword]
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
  const { lecturer_name, lecturer_code, email } = req.body as { lecturer_name?: string; lecturer_code?: string; email?: string };

  if (!lecturer_name?.trim() && lecturer_code === undefined && email === undefined) {
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
    await pool.execute(
      `UPDATE lecturers SET ${fields.join(', ')}, updated_at = NOW() WHERE nip = ?`,
      values
    );

    const [updated] = await pool.execute<any[]>(
      'SELECT nip, lecturer_name, lecturer_code, email, is_verified, password_changed, updated_at FROM lecturers WHERE nip = ?',
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

// ─── Admin/PIC: Update Mahasiswa ───────────────────────────────────────────────

/**
 * PATCH /admin/students/:nim
 * PIC dapat mengubah nama, kelas, dan email mahasiswa.
 */
export const updateStudent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { nim } = req.params;
  const { student_name, class: kelas, email } = req.body as { student_name?: string; class?: string; email?: string };

  if (!student_name?.trim() && !kelas?.trim() && email === undefined) {
    res.status(400).json({ success: false, message: 'Tidak ada data yang akan diubah.' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT nim FROM students WHERE nim = ?',
      [nim]
    );
    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: 'Mahasiswa tidak ditemukan.' });
      return;
    }

    const fields: string[] = [];
    const values: any[] = [];

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
    await pool.execute(
      `UPDATE students SET ${fields.join(', ')}, updated_at = NOW() WHERE nim = ?`,
      values
    );

    const [updated] = await pool.execute<any[]>(
      'SELECT nim, student_name, class, email, is_verified, password_changed, updated_at FROM students WHERE nim = ?',
      [nim]
    );

    res.status(200).json({
      success: true,
      message: `Data mahasiswa ${nim} berhasil diperbarui.`,
      data: updated[0],
    });
  } catch (err: any) {
    console.error('[Admin] updateStudent error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Admin: Assign Dosen Pembimbing ke Mahasiswa ──────────────────────────────

/**
 * PATCH /admin/students/:nim/assign-lecturer
 * Menetapkan dosen pembimbing ke mahasiswa berdasarkan lecturer_code.
 * Kirim { lecturer_code: null } untuk melepas assignment.
 */
export const assignLecturerToStudent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { nim } = req.params;
  const { lecturer_code } = req.body as { lecturer_code: string | null };

  if (lecturer_code === undefined) {
    res.status(400).json({ success: false, message: 'Field lecturer_code wajib disertakan (kirim null untuk melepas).' });
    return;
  }

  try {
    // Cek mahasiswa ada
    const [studentRows] = await pool.execute<any[]>(
      'SELECT nim FROM students WHERE nim = ?',
      [nim]
    );
    if (!studentRows || studentRows.length === 0) {
      res.status(404).json({ success: false, message: 'Mahasiswa tidak ditemukan.' });
      return;
    }

    let assignedLecturer: any = null;

    if (lecturer_code) {
      // Validasi lecturer_code ada di DB
      const code = String(lecturer_code).trim().toUpperCase().slice(0, 3);
      const [lecturerRows] = await pool.execute<any[]>(
        'SELECT nip, lecturer_name, lecturer_code FROM lecturers WHERE lecturer_code = ?',
        [code]
      );
      if (!lecturerRows || lecturerRows.length === 0) {
        res.status(400).json({ success: false, message: `Kode dosen "${code}" tidak ditemukan. Pastikan kode dosen sudah terdaftar.` });
        return;
      }
      assignedLecturer = lecturerRows[0];
      await pool.execute(
        'UPDATE students SET assigned_lecturer_code = ?, updated_at = NOW() WHERE nim = ?',
        [code, nim]
      );
    } else {
      // Lepas assignment
      await pool.execute(
        'UPDATE students SET assigned_lecturer_code = NULL, updated_at = NOW() WHERE nim = ?',
        [nim]
      );
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
  } catch (err: any) {
    console.error('[Admin] assignLecturerToStudent error:', err.message);
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

    const current = rows[0];
    const newStatus = current.is_active === 1 ? 0 : 1;

    // Jika mengaktifkan, pastikan tidak ada semester lain yang sudah aktif
    if (newStatus === 1) {
      const [activeRows] = await pool.execute<any[]>(
        'SELECT semester_id, code FROM semester_codes WHERE is_active = 1 AND semester_id != ?',
        [id]
      );
      if (activeRows.length > 0) {
        res.status(409).json({
          success: false,
          message: `Nonaktifkan semester "${activeRows[0].code}" terlebih dahulu sebelum mengaktifkan semester lain.`,
        });
        return;
      }
    }

    await pool.execute(
      'UPDATE semester_codes SET is_active = ?, updated_at = NOW() WHERE semester_id = ?',
      [newStatus, id]
    );
    res.status(200).json({
      success: true,
      message: newStatus === 1
        ? `Semester "${current.code}" berhasil diaktifkan.`
        : `Semester "${current.code}" berhasil dinonaktifkan.`,
      data: { semester_id: current.semester_id, code: current.code, is_active: newStatus },
    });
  } catch (err: any) {
    console.error('[Admin] toggleSemesterStatus error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Admin: Export Grades by Semester ────────────────────────────────────────

/**
 * GET /admin/export/grades?semester_code=...
 * Mengunduh nilai mahasiswa dalam format XLSX untuk semester tertentu.
 */
export const exportGradesBySemester = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const semesterCode = req.query.semester_code as string;
  
  if (!semesterCode) {
    res.status(400).json({ success: false, message: 'semester_code diperlukan.' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT 
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
       ORDER BY s.class ASC, s.student_name ASC`,
      [semesterCode]
    );

    const workbook = new ExcelJS.Workbook();
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
    const styleHeader = (ws: ExcelJS.Worksheet, gradeStartCol: number) => {
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
          } else {
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

  } catch (err: any) {
    console.error('[Admin] exportGradesBySemester error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat mengunduh nilai.' });
  }
};

// ─── Admin: Preview Grades by Semester ────────────────────────────────────────

/**
 * GET /admin/export/preview?semester_code=...
 * Mengembalikan maksimal 5 baris pertama dari data nilai mahasiswa untuk preview.
 */
export const getPreviewGrades = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const semesterCode = req.query.semester_code as string;
  
  if (!semesterCode) {
    res.status(400).json({ success: false, message: 'semester_code diperlukan.' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT 
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
       LIMIT 5`,
      [semesterCode]
    );

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (err: any) {
    console.error('[Admin] getPreviewGrades error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat mengambil preview nilai.' });
  }
};

// ─── Admin: Get Registrations by Semester ─────────────────────────────────────

/**
 * GET /admin/registrations?semester_code=...&search=...&limit=...&offset=...
 * Mengembalikan daftar semua pengajuan KPPM (termasuk mahasiswa yang belum mengajukan)
 * berdasarkan semester. Mahasiswa yang belum mengajukan tetap ditampilkan dengan status "belum_daftar".
 */
export const getRegistrationsBySemester = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const semesterCode = (req.query.semester_code as string) || '';
  const search       = (req.query.search as string) || '';
  const limit        = Math.min(Number(req.query.limit)  || 50, 200);
  const offset       = Number(req.query.offset) || 0;

  try {
    const searchParam = `%${search}%`;

    // ── Bobot PA & PL (sama dengan getRegistrationDetail) ────────────────────
    const PA_WEIGHTS: Record<string, number> = {
      commitment: 10, planning: 5, guidance: 5,
      presentation: 15, report: 10, identification: 10,
    };
    const PL_WEIGHTS: Record<string, number> = {
      attendance: 5, discipline: 5, commitment: 5, planning: 5,
      teamwork: 10, guidance: 5, report: 5, problem_solving: 5,
    };

    const computePA = (row: any): string | null => {
      const vals = {
        commitment: row.pa_commitment, planning: row.pa_planning,
        guidance: row.pa_guidance, presentation: row.pa_presentation,
        report: row.pa_report, identification: row.pa_identification,
      };
      if (Object.values(vals).every(v => v === null || v === undefined)) return null;
      const sum = Object.entries(PA_WEIGHTS).reduce((acc, [k, w]) =>
        acc + (w / 100) * (parseFloat(vals[k as keyof typeof vals] ?? 0) || 0), 0);
      return sum.toFixed(2);
    };

    const computePL = (row: any): string | null => {
      const vals = {
        attendance: row.pl_attendance, discipline: row.pl_discipline,
        commitment: row.pl_commitment, planning: row.pl_planning,
        teamwork: row.pl_teamwork, guidance: row.pl_guidance,
        report: row.pl_report, problem_solving: row.pl_problem_solving,
      };
      if (Object.values(vals).every(v => v === null || v === undefined)) return null;
      const sum = Object.entries(PL_WEIGHTS).reduce((acc, [k, w]) =>
        acc + (w / 100) * (parseFloat(vals[k as keyof typeof vals] ?? 0) || 0), 0);
      return sum.toFixed(2);
    };

    const SCORE_SELECT = `
           ls.plo05_clo01_commitment   AS pa_commitment,
           ls.plo07_clo02_planning     AS pa_planning,
           ls.plo05_clo04_guidance     AS pa_guidance,
           ls.plo05_clo04_presentation AS pa_presentation,
           ls.plo05_clo04_report       AS pa_report,
           ls.plo01_clo05_identification AS pa_identification,
           ms.attendance    AS pl_attendance,
           ms.discipline    AS pl_discipline,
           ms.commitment    AS pl_commitment,
           ms.planning      AS pl_planning,
           ms.teamwork      AS pl_teamwork,
           ms.guidance      AS pl_guidance,
           ms.report        AS pl_report,
           ms.problem_solving AS pl_problem_solving`;

    if (semesterCode) {
      const [rows] = await pool.execute<any[]>(
        `SELECT
           s.nim, s.student_name, s.class,
           r.registration_id, r.semester_code, r.status, r.company_name, r.submitted_at,
           CASE WHEN ls.registration_id IS NOT NULL THEN 1 ELSE 0 END AS has_lecturer_score,
           CASE WHEN ms.registration_id IS NOT NULL THEN 1 ELSE 0 END AS has_mentor_score,
           ${SCORE_SELECT}
         FROM internship_registrations r
         INNER JOIN students s ON r.nim = s.nim
         LEFT JOIN lecturer_scores ls ON ls.registration_id = r.registration_id
         LEFT JOIN mentor_scores   ms ON ms.registration_id = r.registration_id
         WHERE r.semester_code = ?
           AND (s.student_name LIKE ? OR s.nim LIKE ?)
         ORDER BY s.student_name ASC
         LIMIT ? OFFSET ?`,
        [semesterCode, searchParam, searchParam, limit, offset]
      );

      const [[countRow]] = await pool.execute<any[]>(
        `SELECT COUNT(*) AS total
         FROM internship_registrations r
         INNER JOIN students s ON r.nim = s.nim
         WHERE r.semester_code = ? AND (s.student_name LIKE ? OR s.nim LIKE ?)`,
        [semesterCode, searchParam, searchParam]
      );

      const mapped = rows.map(r => ({ ...r, pa_total: computePA(r), pl_total: computePL(r) }));

      res.status(200).json({
        success: true,
        data: mapped,
        meta: { total: countRow?.total ?? 0, limit, offset },
      });
    } else {
      // Tanpa filter semester: tampilkan semua pengajuan yang ada
      const [rows] = await pool.execute<any[]>(
        `SELECT
           s.nim,
           s.student_name,
           s.class,
           r.registration_id,
           r.semester_code,
           r.status,
           r.company_name,
           r.submitted_at,
           CASE WHEN ls.registration_id IS NOT NULL THEN 1 ELSE 0 END AS has_lecturer_score,
           CASE WHEN ms.registration_id IS NOT NULL THEN 1 ELSE 0 END AS has_mentor_score,
           ${SCORE_SELECT}
         FROM internship_registrations r
         JOIN students s ON r.nim = s.nim
         LEFT JOIN lecturer_scores ls ON ls.registration_id = r.registration_id
         LEFT JOIN mentor_scores   ms ON ms.registration_id = r.registration_id
         WHERE (s.student_name LIKE ? OR s.nim LIKE ?)
         ORDER BY r.submitted_at DESC
         LIMIT ? OFFSET ?`,
        [searchParam, searchParam, limit, offset]
      );

      const [[countRow]] = await pool.execute<any[]>(
        `SELECT COUNT(*) AS total FROM internship_registrations r
         JOIN students s ON r.nim = s.nim
         WHERE (s.student_name LIKE ? OR s.nim LIKE ?)`,
        [searchParam, searchParam]
      );

      const mapped = rows.map(r => ({ ...r, pa_total: computePA(r), pl_total: computePL(r) }));

      res.status(200).json({
        success: true,
        data: mapped,
        meta: { total: countRow?.total ?? 0, limit, offset },
      });
    }
  } catch (err: any) {
    console.error('[Admin] getRegistrationsBySemester error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Admin: Mahasiswa Belum Mengajukan di Semester Tertentu ───────────────────

/**
 * GET /admin/registrations/no-submission?semester_code=xxx&search=xxx&limit=xxx&offset=xxx
 * Mengembalikan daftar mahasiswa aktif yang belum mengajukan KPPM di semester tertentu.
 */
export const getStudentsWithoutRegistration = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const semesterCode = (req.query.semester_code as string) || '';
  const search       = (req.query.search as string) || '';
  const limit        = Math.min(Number(req.query.limit)  || 50, 200);
  const offset       = Number(req.query.offset) || 0;

  if (!semesterCode) {
    res.status(400).json({ success: false, message: 'semester_code wajib diisi untuk filter ini.' });
    return;
  }

  try {
    const searchParam = `%${search}%`;

    const [rows] = await pool.execute<any[]>(
      `SELECT
         s.nim,
         s.student_name,
         s.class,
         s.email
       FROM students s
       WHERE s.is_active = 1
         AND (s.student_name LIKE ? OR s.nim LIKE ?)
         AND NOT EXISTS (
           SELECT 1 FROM internship_registrations r
           WHERE r.nim = s.nim AND r.semester_code = ?
         )
       ORDER BY s.student_name ASC
       LIMIT ? OFFSET ?`,
      [searchParam, searchParam, semesterCode, limit, offset]
    );

    const [[countRow]] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS total
       FROM students s
       WHERE s.is_active = 1
         AND (s.student_name LIKE ? OR s.nim LIKE ?)
         AND NOT EXISTS (
           SELECT 1 FROM internship_registrations r
           WHERE r.nim = s.nim AND r.semester_code = ?
         )`,
      [searchParam, searchParam, semesterCode]
    );

    res.status(200).json({
      success: true,
      data: rows,
      meta: { total: countRow?.total ?? 0, limit, offset },
    });
  } catch (err: any) {
    console.error('[Admin] getStudentsWithoutRegistration error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Admin: Get Registration Detail ──────────────────────────────────────────

/**
 * GET /admin/registrations/:id
 * Mengembalikan detail lengkap satu pengajuan KPPM termasuk info mahasiswa,
 * dosen, nilai dosen, dan nilai mentor.
 */
export const getRegistrationDetail = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT
         r.registration_id,
         r.nim,
         r.lecturer_nip,
         r.semester_code,
         r.status,
         r.company_name,
         r.internship_position,
         r.internship_start,
         r.internship_end,
         r.mentor_name,
         r.mentor_email,
         r.submitted_at,
         s.student_name,
         s.class,
         s.email AS student_email,
         l.lecturer_name,
         l.lecturer_code,
         l.email AS lecturer_email,
         /* Nilai Dosen (Pembimbing Akademik) */
         ls.plo05_clo01_commitment  AS pa_commitment,
         ls.plo07_clo02_planning    AS pa_planning,
         ls.plo05_clo04_guidance    AS pa_guidance,
         ls.plo05_clo04_presentation AS pa_presentation,
         ls.plo05_clo04_report      AS pa_report,
         ls.plo01_clo05_identification AS pa_identification,
         /* Nilai Mentor (Pembimbing Lapangan) */
         ms.attendance    AS pl_attendance,
         ms.discipline    AS pl_discipline,
         ms.commitment    AS pl_commitment,
         ms.planning      AS pl_planning,
         ms.teamwork      AS pl_teamwork,
         ms.guidance      AS pl_guidance,
         ms.report        AS pl_report,
         ms.problem_solving AS pl_problem_solving
       FROM internship_registrations r
       JOIN    students s  ON r.nim = s.nim
       LEFT JOIN lecturers l  ON r.lecturer_nip = l.nip
       LEFT JOIN lecturer_scores ls ON r.registration_id = ls.registration_id
       LEFT JOIN mentor_scores   ms ON r.registration_id = ms.registration_id
       WHERE r.registration_id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data pengajuan tidak ditemukan.' });
      return;
    }

    const row = rows[0];

    // ── Nilai Dosen (Pembimbing Akademik) — Bobot × Nilai ──────────────────────
    // Bobot: commitment=10, planning=5, guidance=5, presentation=15, report=10, identification=10
    const PA_WEIGHTS = {
      commitment:     10,
      planning:        5,
      guidance:        5,
      presentation:   15,
      report:         10,
      identification: 10,
    };
    const paValues = {
      commitment:     row.pa_commitment,
      planning:       row.pa_planning,
      guidance:       row.pa_guidance,
      presentation:   row.pa_presentation,
      report:         row.pa_report,
      identification: row.pa_identification,
    };
    const paHasValue = Object.values(paValues).some(v => v !== null && v !== undefined);
    let paTotal: string | null = null;
    if (paHasValue) {
      const sum = Object.entries(PA_WEIGHTS).reduce((acc, [key, bobot]) => {
        const val = parseFloat(paValues[key as keyof typeof paValues] ?? 0) || 0;
        return acc + (bobot / 100) * val;
      }, 0);
      paTotal = sum.toFixed(2);
    }

    // ── Nilai Mentor (Pembimbing Lapangan) — Bobot × Nilai ─────────────────────
    // Bobot: attendance=5, discipline=5, commitment=5, planning=5, teamwork=10, guidance=5, report=5, problem_solving=5
    const PL_WEIGHTS = {
      attendance:     5,
      discipline:     5,
      commitment:     5,
      planning:       5,
      teamwork:      10,
      guidance:       5,
      report:         5,
      problem_solving:5,
    };
    const plValues = {
      attendance:      row.pl_attendance,
      discipline:      row.pl_discipline,
      commitment:      row.pl_commitment,
      planning:        row.pl_planning,
      teamwork:        row.pl_teamwork,
      guidance:        row.pl_guidance,
      report:          row.pl_report,
      problem_solving: row.pl_problem_solving,
    };
    const plHasValue = Object.values(plValues).some(v => v !== null && v !== undefined);
    let plTotal: string | null = null;
    if (plHasValue) {
      const sum = Object.entries(PL_WEIGHTS).reduce((acc, [key, bobot]) => {
        const val = parseFloat(plValues[key as keyof typeof plValues] ?? 0) || 0;
        return acc + (bobot / 100) * val;
      }, 0);
      plTotal = sum.toFixed(2);
    }

    // Gabungan PA + PL
    const combinedTotal = (paHasValue && plHasValue && paTotal && plTotal)
      ? (parseFloat(paTotal) + parseFloat(plTotal)).toFixed(2)
      : null;

    res.status(200).json({
      success: true,
      data: {
        registration_id:    row.registration_id,
        nim:                row.nim,
        student_name:       row.student_name,
        student_class:      row.class,
        student_email:      row.student_email,
        lecturer_nip:       row.lecturer_nip,
        lecturer_name:      row.lecturer_name,
        lecturer_code:      row.lecturer_code,
        lecturer_email:     row.lecturer_email,
        semester_code:      row.semester_code,
        status:             row.status,
        company_name:       row.company_name,
        internship_position: row.internship_position,
        internship_start:   row.internship_start,
        internship_end:     row.internship_end,
        mentor_name:        row.mentor_name,
        mentor_email:       row.mentor_email,
        submitted_at:       row.submitted_at,
        lecturer_score_total: paTotal,
        mentor_score_total:   plTotal,
        combined_total:       combinedTotal,
        has_lecturer_score:   paHasValue,
        has_mentor_score:     plHasValue,
      },
    });
  } catch (err: any) {
    console.error('[Admin] getRegistrationDetail error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Admin: Update Registration Semester ──────────────────────────────────────

/**
 * PATCH /admin/registrations/:id/semester
 * Mengganti kode semester pada pengajuan KPPM.
 * Hanya diizinkan jika dosen DAN mentor belum memberikan nilai.
 */
export const updateRegistrationSemester = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { semester_code } = req.body as { semester_code: string };

  if (!semester_code?.trim()) {
    res.status(400).json({ success: false, message: 'Kode semester baru wajib diisi.' });
    return;
  }

  try {
    // Cek pengajuan ada
    const [regRows] = await pool.execute<any[]>(
      'SELECT registration_id, semester_code FROM internship_registrations WHERE registration_id = ?',
      [id]
    );
    if (!regRows || regRows.length === 0) {
      res.status(404).json({ success: false, message: 'Data pengajuan tidak ditemukan.' });
      return;
    }

    // Cek apakah sudah ada nilai dosen
    const [lecturerScoreRows] = await pool.execute<any[]>(
      'SELECT lecturer_score_id FROM lecturer_scores WHERE registration_id = ?',
      [id]
    );
    if (lecturerScoreRows && lecturerScoreRows.length > 0) {
      res.status(409).json({
        success: false,
        message: 'Semester tidak dapat diubah karena dosen pembimbing sudah memberikan nilai.',
      });
      return;
    }

    // Cek apakah sudah ada nilai mentor
    const [mentorScoreRows] = await pool.execute<any[]>(
      'SELECT mentor_score_id FROM mentor_scores WHERE registration_id = ?',
      [id]
    );
    if (mentorScoreRows && mentorScoreRows.length > 0) {
      res.status(409).json({
        success: false,
        message: 'Semester tidak dapat diubah karena pembimbing lapangan (mentor) sudah memberikan nilai.',
      });
      return;
    }

    // Cek semester tujuan ada & aktif
    const [semRows] = await pool.execute<any[]>(
      'SELECT code, is_active FROM semester_codes WHERE code = ?',
      [semester_code.trim()]
    );
    if (!semRows || semRows.length === 0) {
      res.status(400).json({
        success: false,
        message: `Kode semester "${semester_code.trim()}" tidak terdaftar di sistem.`,
      });
      return;
    }
    if (!semRows[0].is_active) {
      res.status(400).json({
        success: false,
        message: `Semester "${semester_code.trim()}" tidak aktif. Mahasiswa hanya dapat dipindahkan ke semester yang sedang aktif.`,
      });
      return;
    }

    // Update semester
    await pool.execute(
      'UPDATE internship_registrations SET semester_code = ?, updated_at = NOW() WHERE registration_id = ?',
      [semester_code.trim(), id]
    );

    res.status(200).json({
      success: true,
      message: `Kode semester pengajuan berhasil diubah ke "${semester_code.trim()}".`,
      data: { registration_id: parseInt(id), semester_code: semester_code.trim() },
    });
  } catch (err: any) {
    console.error('[Admin] updateRegistrationSemester error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};
