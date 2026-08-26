import 'dotenv/config';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import pool from '../config/db';
import { sendOtpEmail, sendStudentVerifyOtpEmail, sendLecturerVerifyOtpEmail } from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'kppm-telkom-secret-dev-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudentRow {
  nim: string;
  student_name: string;
  class: string;
  email: string | null;
  password: string;
  is_verified: number;
  password_changed: number;
}

interface LecturerRow {
  nip: string;
  lecturer_name: string;
  email: string | null;
  password: string;
  is_verified: number;
  password_changed: number;
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
      'SELECT nim, student_name, class, email, password, is_verified, password_changed, is_active FROM students WHERE nim = ?',
      [nim]
    );

    if (!rows || rows.length === 0) {
      res.status(401).json({ success: false, message: 'NIM atau password salah' });
      return;
    }

    const student = rows[0] as StudentRow & { is_active?: number };

    if (student.is_active === 0) {
      res.status(403).json({ success: false, message: 'Akun Anda telah dinonaktifkan oleh Admin.' });
      return;
    }

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
      sub: student.nim,          // NIM sebagai identifier utama
      nim: student.nim,
      name: student.student_name,
      class: student.class,
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

  let studentNim: string;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'student') {
      res.status(403).json({ success: false, message: 'Akses ditolak' });
      return;
    }
    studentNim = decoded.nim;
  } catch {
    res.status(401).json({ success: false, message: 'Token tidak valid' });
    return;
  }

  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: 'Email wajib diisi' });
    return;
  }

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
      'SELECT nim FROM students WHERE email = ? AND nim != ?',
      [email, studentNim]
    );
    if (existing && existing.length > 0) {
      res.status(409).json({ success: false, message: 'Email ini sudah terdaftar oleh akun lain' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.execute('DELETE FROM student_otps WHERE nim = ?', [studentNim]);
    await pool.execute(
      'INSERT INTO student_otps (nim, email_target, otp_code, expired_at) VALUES (?, ?, ?, ?)',
      [studentNim, email, otp, expiredAt]
    );

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

  let studentNim: string;
  let name: string;
  let studentClass: string;
  let passwordChanged: boolean;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'student') {
      res.status(403).json({ success: false, message: 'Akses ditolak' });
      return;
    }
    studentNim = decoded.nim;
    name = decoded.name;
    studentClass = decoded.class;
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
    const [rows] = await pool.execute<any[]>(
      `SELECT otp_id, email_target, otp_code, expired_at
       FROM student_otps
       WHERE nim = ? AND email_target = ? AND otp_code = ?
       ORDER BY created_at DESC LIMIT 1`,
      [studentNim, email, otp]
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

    await pool.execute('DELETE FROM student_otps WHERE otp_id = ?', [otpRow.otp_id]);
    await pool.execute(
      'UPDATE students SET email = ?, is_verified = 1 WHERE nim = ?',
      [email, studentNim]
    );

    const newPayload = {
      sub: studentNim,
      nim: studentNim,
      name,
      class: studentClass,
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
          nim: studentNim,
          name,
          class: studentClass,
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

// ─── Student: Change Password ─────────────────────────────────────────────────
export const changeStudentPassword = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  let studentNim: string;
  let name: string;
  let studentClass: string;
  let isVerified: boolean;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'student') {
      res.status(403).json({ success: false, message: 'Akses ditolak' });
      return;
    }
    studentNim = decoded.nim;
    name = decoded.name;
    studentClass = decoded.class;
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
      'SELECT password, email FROM students WHERE nim = ?',
      [studentNim]
    );
    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan' });
      return;
    }

    const storedPassword = rows[0].password;
    const freshEmail = rows[0].email;

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
      'UPDATE students SET password = ?, password_changed = 1 WHERE nim = ?',
      [hashedNew, studentNim]
    );

    const newPayload = {
      sub: studentNim,
      nim: studentNim,
      name,
      class: studentClass,
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
          nim: studentNim,
          name,
          class: studentClass,
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
  const { nip, password } = req.body;

  if (!nip || !password) {
    res.status(400).json({ success: false, message: 'NIP dan password wajib diisi' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT nip, lecturer_name, email, password, is_verified, password_changed, is_active FROM lecturers WHERE nip = ?',
      [nip]
    );

    if (!rows || rows.length === 0) {
      res.status(401).json({ success: false, message: 'NIP atau password salah' });
      return;
    }

    const lecturer = rows[0] as LecturerRow & { is_active?: number };

    if (lecturer.is_active === 0) {
      res.status(403).json({ success: false, message: 'Akun Anda telah dinonaktifkan oleh Admin.' });
      return;
    }

    let passwordValid = false;
    if (lecturer.password.startsWith('$2')) {
      passwordValid = await bcrypt.compare(password, lecturer.password);
    } else {
      passwordValid = lecturer.password === password;
    }

    if (!passwordValid) {
      res.status(401).json({ success: false, message: 'NIP atau password salah' });
      return;
    }

    const isVerified      = lecturer.is_verified === 1;
    const passwordChanged = lecturer.password_changed === 1;

    const payload = {
      sub: lecturer.nip,
      nip: lecturer.nip,
      name: lecturer.lecturer_name,
      email: lecturer.email,
      role: 'lecturer',
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
          id: lecturer.nip,
          nip: lecturer.nip,
          name: lecturer.lecturer_name,
          email: lecturer.email,
          role: 'lecturer',
          is_verified: isVerified,
          password_changed: passwordChanged,
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

// ─── Lecturer: Send Verify OTP ────────────────────────────────────────────────
export const lecturerSendVerifyOtp = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  let lecturerNip: string;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'lecturer') {
      res.status(403).json({ success: false, message: 'Akses ditolak' });
      return;
    }
    lecturerNip = decoded.nip;
  } catch {
    res.status(401).json({ success: false, message: 'Token tidak valid' });
    return;
  }

  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: 'Email wajib diisi' });
    return;
  }

  try {
    // Cek apakah email sudah dipakai oleh dosen lain
    const [existing] = await pool.execute<any[]>(
      'SELECT nip FROM lecturers WHERE email = ? AND nip != ?',
      [email, lecturerNip]
    );
    if (existing && existing.length > 0) {
      res.status(409).json({ success: false, message: 'Email ini sudah terdaftar oleh akun dosen lain' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.execute('DELETE FROM lecturer_otps WHERE nip = ?', [lecturerNip]);
    await pool.execute(
      'INSERT INTO lecturer_otps (nip, email_target, otp_code, expired_at) VALUES (?, ?, ?, ?)',
      [lecturerNip, email, otp, expiredAt]
    );

    try {
      await sendLecturerVerifyOtpEmail(email, otp);
      console.log(`[Auth Service] OTP verifikasi dosen dikirim ke: ${email}`);
    } catch (emailErr: any) {
      console.error(`[Auth Service] Gagal kirim email ke ${email}:`, emailErr.message);
      console.log(`[Auth Service] FALLBACK OTP dosen untuk ${email}: ${otp}`);
    }

    res.status(200).json({
      success: true,
      message: `Kode OTP telah dikirim ke ${email}. Silakan cek inbox Anda.`,
    });
  } catch (err: any) {
    console.error('[Auth Service] lecturerSendVerifyOtp error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Lecturer: Verify Email ───────────────────────────────────────────────────
export const lecturerVerifyEmail = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  let lecturerNip: string;
  let lecturerName: string;
  let passwordChanged: boolean;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'lecturer') {
      res.status(403).json({ success: false, message: 'Akses ditolak' });
      return;
    }
    lecturerNip   = decoded.nip;
    lecturerName  = decoded.name;
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
    const [rows] = await pool.execute<any[]>(
      `SELECT otp_id, email_target, otp_code, expired_at
       FROM lecturer_otps
       WHERE nip = ? AND email_target = ? AND otp_code = ?
       ORDER BY created_at DESC LIMIT 1`,
      [lecturerNip, email, otp]
    );

    if (!rows || rows.length === 0) {
      res.status(401).json({ success: false, message: 'OTP salah atau tidak ditemukan' });
      return;
    }

    const otpRow = rows[0];
    if (new Date() > new Date(otpRow.expired_at)) {
      await pool.execute('DELETE FROM lecturer_otps WHERE otp_id = ?', [otpRow.otp_id]);
      res.status(401).json({ success: false, message: 'OTP sudah kadaluarsa. Kirim OTP baru.' });
      return;
    }

    await pool.execute('DELETE FROM lecturer_otps WHERE otp_id = ?', [otpRow.otp_id]);
    await pool.execute(
      'UPDATE lecturers SET email = ?, is_verified = 1 WHERE nip = ?',
      [email, lecturerNip]
    );

    const newPayload = {
      sub: lecturerNip,
      nip: lecturerNip,
      name: lecturerName,
      email,
      role: 'lecturer',
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
          nip: lecturerNip,
          name: lecturerName,
          email,
          role: 'lecturer',
          is_verified: true,
          password_changed: passwordChanged,
        },
      },
    });
  } catch (err: any) {
    console.error('[Auth Service] lecturerVerifyEmail error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// ─── Lecturer: Change Password ────────────────────────────────────────────────
export const changeLecturerPassword = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  let lecturerNip: string;
  let lecturerName: string;
  let isVerified: boolean;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as { sub: string; nip: string; name: string; role: string; is_verified: boolean };
    if (decoded.role !== 'lecturer') {
      res.status(403).json({ success: false, message: 'Akses ditolak' });
      return;
    }
    lecturerNip  = decoded.nip;
    lecturerName = decoded.name;
    isVerified   = decoded.is_verified === true;
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
      'SELECT password, email FROM lecturers WHERE nip = ?',
      [lecturerNip]
    );

    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data dosen tidak ditemukan' });
      return;
    }

    const storedPassword = rows[0].password;
    const freshEmail     = rows[0].email;

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
      'UPDATE lecturers SET password = ?, password_changed = 1 WHERE nip = ?',
      [hashedNew, lecturerNip]
    );

    const newPayload = {
      sub: lecturerNip,
      nip: lecturerNip,
      name: lecturerName,
      email: freshEmail,
      role: 'lecturer',
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
          nip: lecturerNip,
          name: lecturerName,
          email: freshEmail,
          role: 'lecturer',
          is_verified: isVerified,
          password_changed: true,
        },
      },
    });
  } catch (err: any) {
    console.error('[Auth Service] changeLecturerPassword error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.' });
  }
};

// ─── Admin / PIC Login ──────────────────────────────────────────────────────────────
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT admin_id, username, email, password, full_name, role, is_active FROM admin_users WHERE email = ?',
      [email]
    );

    if (!rows || rows.length === 0) {
      res.status(401).json({ success: false, message: 'Email atau password salah' });
      return;
    }

    const admin = rows[0];

    if (!admin.is_active) {
      res.status(403).json({ success: false, message: 'Akun admin tidak aktif. Hubungi administrator.' });
      return;
    }

    const passwordValid = await bcrypt.compare(password, admin.password);
    if (!passwordValid) {
      res.status(401).json({ success: false, message: 'Email atau password salah' });
      return;
    }

    const payload = {
      sub:       String(admin.admin_id),
      admin_id:  admin.admin_id,
      username:  admin.username,
      email:     admin.email,
      name:      admin.full_name,
      role:      admin.role as 'admin' | 'pic',
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' } as any);

    res.status(200).json({
      success: true,
      message: 'Login admin berhasil',
      data: {
        token,
        user: {
          admin_id:  admin.admin_id,
          username:  admin.username,
          email:     admin.email,
          name:      admin.full_name,
          role:      admin.role as 'admin' | 'pic',
        },
      },
    });
  } catch (err: any) {
    console.error('[Auth Service] adminLogin error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server. Silakan coba lagi.' });
  }
};
