import 'dotenv/config';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import pool from '../config/db';
import { sendOtpEmail, sendStudentVerifyOtpEmail } from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'kppm-telkom-secret-dev-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudentRow {
  student_id: number;
  nim: string;
  student_name: string;
  class: string;
  email: string | null;
  password: string;
  is_verified: number;
  password_changed: number;
}

interface LecturerRow {
  lecturer_id: number;
  nip: string;
  lecturer_name: string;
  email: string;
  password: string;
}

// ─── Student Login (menggunakan NIM) ─────────────────────────────────────────
export const studentLogin = async (req: Request, res: Response): Promise<void> => {
  const { nim, password } = req.body;

  if (!nim || !password) {
    res.status(400).json({ success: false, message: 'NIM dan password wajib diisi' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT student_id, nim, student_name, class, email, password, is_verified, password_changed FROM students WHERE nim = ?',
      [nim]
    );

    if (!rows || rows.length === 0) {
      res.status(401).json({ success: false, message: 'NIM atau password salah' });
      return;
    }

    const student = rows[0] as StudentRow;

    // Cek password — support bcrypt hash dan plain text (NIM default)
    let passwordValid = false;
    if (student.password.startsWith('$2')) {
      passwordValid = await bcrypt.compare(password, student.password);
    } else {
      passwordValid = student.password === password;
    }

    if (!passwordValid) {
      res.status(401).json({ success: false, message: 'NIM atau password salah' });
      return;
    }

    const isVerified = student.is_verified === 1;
    const passwordChanged = student.password_changed === 1;

    const payload = {
      sub: student.student_id,
      nim: student.nim,
      name: student.student_name,
      role: 'student',
      is_verified: isVerified,
      password_changed: passwordChanged,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: {
          id: student.student_id,
          nim: student.nim,
          name: student.student_name,
          class: student.class,
          email: student.email,
          role: 'student',
          is_verified: isVerified,
          password_changed: passwordChanged,
        },
      },
    });
  } catch (err: any) {
    console.error('[Auth Service] studentLogin error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server. Silakan coba lagi.' });
  }
};

// ─── Student: Send Verify OTP ─────────────────────────────────────────────────
export const studentSendVerifyOtp = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  let studentId: number;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'student') {
      res.status(403).json({ success: false, message: 'Akses ditolak' });
      return;
    }
    studentId = decoded.sub;
  } catch {
    res.status(401).json({ success: false, message: 'Token tidak valid' });
    return;
  }

  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: 'Email wajib diisi' });
    return;
  }

  // Validasi domain email Telkom
  if (!email.endsWith('@student.telkomuniversity.ac.id')) {
    res.status(400).json({
      success: false,
      message: 'Email harus menggunakan domain @student.telkomuniversity.ac.id',
    });
    return;
  }

  try {
    // Cek apakah email sudah dipakai oleh mahasiswa lain
    const [existing] = await pool.execute<any[]>(
      'SELECT student_id FROM students WHERE email = ? AND student_id != ?',
      [email, studentId]
    );
    if (existing && existing.length > 0) {
      res.status(409).json({ success: false, message: 'Email ini sudah terdaftar oleh akun lain' });
      return;
    }

    // Generate OTP 6 digit
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

    // Hapus OTP lama, simpan yang baru
    await pool.execute('DELETE FROM student_otps WHERE student_id = ?', [studentId]);
    await pool.execute(
      'INSERT INTO student_otps (student_id, email_target, otp_code, expired_at) VALUES (?, ?, ?, ?)',
      [studentId, email, otp, expiredAt]
    );

    // Kirim OTP via email
    try {
      await sendStudentVerifyOtpEmail(email, otp);
      console.log(`[Auth Service] OTP verifikasi dikirim ke: ${email}`);
    } catch (emailErr: any) {
      console.error(`[Auth Service] Gagal kirim email ke ${email}:`, emailErr.message);
      console.log(`[Auth Service] FALLBACK OTP untuk ${email}: ${otp}`);
    }

    res.status(200).json({
      success: true,
      message: `Kode OTP telah dikirim ke ${email}. Silakan cek inbox Anda.`,
    });
  } catch (err: any) {
    console.error('[Auth Service] studentSendVerifyOtp error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Student: Verify Email ────────────────────────────────────────────────────
export const studentVerifyEmail = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  let studentId: number;
  let nim: string;
  let name: string;
  let passwordChanged: boolean;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'student') {
      res.status(403).json({ success: false, message: 'Akses ditolak' });
      return;
    }
    studentId = decoded.sub;
    nim = decoded.nim;
    name = decoded.name;
    passwordChanged = decoded.password_changed === true;
  } catch {
    res.status(401).json({ success: false, message: 'Token tidak valid' });
    return;
  }

  const { email, otp } = req.body;
  if (!email || !otp) {
    res.status(400).json({ success: false, message: 'Email dan OTP wajib diisi' });
    return;
  }

  try {
    // Cari OTP yang valid
    const [rows] = await pool.execute<any[]>(
      `SELECT otp_id, email_target, otp_code, expired_at
       FROM student_otps
       WHERE student_id = ? AND email_target = ? AND otp_code = ?
       ORDER BY created_at DESC LIMIT 1`,
      [studentId, email, otp]
    );

    if (!rows || rows.length === 0) {
      res.status(401).json({ success: false, message: 'OTP salah atau tidak ditemukan' });
      return;
    }

    const otpRow = rows[0];
    if (new Date() > new Date(otpRow.expired_at)) {
      await pool.execute('DELETE FROM student_otps WHERE otp_id = ?', [otpRow.otp_id]);
      res.status(401).json({ success: false, message: 'OTP sudah kadaluarsa. Kirim OTP baru.' });
      return;
    }

    // Hapus OTP setelah dipakai, update email & is_verified di students
    await pool.execute('DELETE FROM student_otps WHERE otp_id = ?', [otpRow.otp_id]);
    await pool.execute(
      'UPDATE students SET email = ?, is_verified = 1 WHERE student_id = ?',
      [email, studentId]
    );

    // Buat token baru dengan is_verified = true
    const newPayload = {
      sub: studentId,
      nim,
      name,
      role: 'student',
      is_verified: true,
      password_changed: passwordChanged,
    };
    const newToken = jwt.sign(newPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);

    res.status(200).json({
      success: true,
      message: 'Email berhasil diverifikasi',
      data: {
        token: newToken,
        user: {
          id: studentId,
          nim,
          name,
          email,
          role: 'student',
          is_verified: true,
          password_changed: passwordChanged,
        },
      },
    });
  } catch (err: any) {
    console.error('[Auth Service] studentVerifyEmail error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Student: Change Password (wajib setelah verifikasi) ─────────────────────
export const changeStudentPassword = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  let studentId: number;
  let nim: string;
  let name: string;
  let email: string;
  let isVerified: boolean;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'student') {
      res.status(403).json({ success: false, message: 'Akses ditolak' });
      return;
    }
    studentId = decoded.sub;
    nim = decoded.nim;
    name = decoded.name;
    email = decoded.email || '';
    isVerified = decoded.is_verified === true;
  } catch {
    res.status(401).json({ success: false, message: 'Token tidak valid' });
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

  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT password FROM students WHERE student_id = ?',
      [studentId]
    );
    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan' });
      return;
    }

    const storedPassword = rows[0].password;
    let isCurrentValid = false;
    if (storedPassword.startsWith('$2')) {
      isCurrentValid = await bcrypt.compare(currentPassword, storedPassword);
    } else {
      isCurrentValid = storedPassword === currentPassword;
    }

    if (!isCurrentValid) {
      res.status(400).json({ success: false, message: 'Password lama yang Anda masukkan salah' });
      return;
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE students SET password = ?, password_changed = 1 WHERE student_id = ?',
      [hashedNew, studentId]
    );

    // Ambil email terbaru dari DB (mungkin baru diset saat verifikasi)
    const [studentRows] = await pool.execute<any[]>(
      'SELECT email FROM students WHERE student_id = ?',
      [studentId]
    );
    const freshEmail = studentRows[0]?.email || email;

    // Buat token baru dengan password_changed = true
    const newPayload = {
      sub: studentId,
      nim,
      name,
      role: 'student',
      is_verified: isVerified,
      password_changed: true,
    };
    const newToken = jwt.sign(newPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);

    res.status(200).json({
      success: true,
      message: 'Password berhasil diubah',
      data: {
        token: newToken,
        user: {
          id: studentId,
          nim,
          name,
          email: freshEmail,
          role: 'student',
          is_verified: isVerified,
          password_changed: true,
        },
      },
    });
  } catch (err: any) {
    console.error('[Auth Service] changeStudentPassword error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.' });
  }
};

// ─── Lecturer Login ───────────────────────────────────────────────────────────
export const lecturerLogin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT lecturer_id, nip, lecturer_name, email, password FROM lecturers WHERE email = ?',
      [email]
    );

    if (!rows || rows.length === 0) {
      res.status(401).json({ success: false, message: 'Email atau password salah' });
      return;
    }

    const lecturer = rows[0] as LecturerRow;

    let passwordValid = false;
    if (lecturer.password.startsWith('$2')) {
      passwordValid = await bcrypt.compare(password, lecturer.password);
    } else {
      passwordValid = lecturer.password === password;
    }

    if (!passwordValid) {
      res.status(401).json({ success: false, message: 'Email atau password salah' });
      return;
    }

    const payload = {
      sub: lecturer.lecturer_id,
      nip: lecturer.nip,
      name: lecturer.lecturer_name,
      email: lecturer.email,
      role: 'lecturer',
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: {
          id: lecturer.lecturer_id,
          nip: lecturer.nip,
          name: lecturer.lecturer_name,
          email: lecturer.email,
          role: 'lecturer',
        },
      },
    });
  } catch (err: any) {
    console.error('[Auth Service] lecturerLogin error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server. Silakan coba lagi.' });
  }
};

// ─── Mentor: Send OTP ─────────────────────────────────────────────────────────
export const mentorSendOtp = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ success: false, message: 'Email wajib diisi' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT registration_id FROM internship_registrations WHERE mentor_email = ? AND status = ?',
      [email, 'approved']
    );

    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: 'Email mentor tidak ditemukan atau belum disetujui' });
      return;
    }

    const registrationId = rows[0].registration_id;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.execute('DELETE FROM mentor_otps WHERE registration_id = ?', [registrationId]);
    await pool.execute(
      'INSERT INTO mentor_otps (registration_id, otp_code, expired_at) VALUES (?, ?, ?)',
      [registrationId, otp, expiredAt]
    );

    try {
      await sendOtpEmail(email, otp);
      console.log(`[Auth Service] OTP berhasil dikirim ke email: ${email}`);
    } catch (emailErr: any) {
      console.error(`[Auth Service] Gagal mengirim email ke ${email}:`, emailErr.message);
      console.log(`[Auth Service] FALLBACK OTP untuk ${email}: ${otp}`);
    }

    res.status(200).json({
      success: true,
      message: `Kode OTP telah dikirim ke email ${email}. Silakan cek inbox Anda.`,
    });
  } catch (err: any) {
    console.error('[Auth Service] mentorSendOtp error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Mentor: Verify OTP ───────────────────────────────────────────────────────
export const mentorVerifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ success: false, message: 'Email dan OTP wajib diisi' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT mo.otp_id, mo.registration_id, mo.otp_code, mo.expired_at
       FROM mentor_otps mo
       JOIN internship_registrations ir ON mo.registration_id = ir.registration_id
       WHERE ir.mentor_email = ? AND mo.otp_code = ?
       ORDER BY mo.created_at DESC LIMIT 1`,
      [email, otp]
    );

    if (!rows || rows.length === 0) {
      res.status(401).json({ success: false, message: 'OTP salah atau tidak ditemukan' });
      return;
    }

    const otpRow = rows[0];
    if (new Date() > new Date(otpRow.expired_at)) {
      await pool.execute('DELETE FROM mentor_otps WHERE otp_id = ?', [otpRow.otp_id]);
      res.status(401).json({ success: false, message: 'OTP sudah kadaluarsa. Kirim OTP baru.' });
      return;
    }

    await pool.execute('DELETE FROM mentor_otps WHERE otp_id = ?', [otpRow.otp_id]);

    const sessionToken = jwt.sign({ email, role: 'mentor', registration_id: otpRow.registration_id }, JWT_SECRET, { expiresIn: '8h' } as any);
    const sessionExpiredAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

    await pool.execute(
      'INSERT INTO mentor_sessions (registration_id, session_token, session_expired_at) VALUES (?, ?, ?)',
      [otpRow.registration_id, sessionToken, sessionExpiredAt]
    );

    res.status(200).json({
      success: true,
      message: 'Verifikasi OTP berhasil',
      data: {
        token: sessionToken,
        user: { email, role: 'mentor' },
      },
    });
  } catch (err: any) {
    console.error('[Auth Service] mentorVerifyOtp error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = (_req: Request, res: Response): void => {
  res.status(200).json({ success: true, message: 'Logout berhasil' });
};

// ─── Lecturer: Change Password ────────────────────────────────────────────────
export const changeLecturerPassword = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  let lecturerId: number;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as { sub: number; role: string };
    if (decoded.role !== 'lecturer') {
      res.status(403).json({ success: false, message: 'Akses ditolak' });
      return;
    }
    lecturerId = decoded.sub;
  } catch {
    res.status(401).json({ success: false, message: 'Token tidak valid' });
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
    const [rows] = await pool.execute<any[]>(
      'SELECT password FROM lecturers WHERE lecturer_id = ?',
      [lecturerId]
    );

    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data dosen tidak ditemukan' });
      return;
    }

    const storedPassword = rows[0].password;

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

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE lecturers SET password = ? WHERE lecturer_id = ?',
      [hashedNew, lecturerId]
    );

    res.status(200).json({ success: true, message: 'Password berhasil diubah' });
  } catch (err: any) {
    console.error('[Auth Service] changeLecturerPassword error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.' });
  }
};
