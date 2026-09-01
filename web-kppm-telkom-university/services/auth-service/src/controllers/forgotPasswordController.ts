import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db';
import { sendForgotPasswordOtpEmail } from '../services/emailService';

export const forgotPasswordSendOtp = async (req: Request, res: Response): Promise<void> => {
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
    const [students] = await pool.execute<any[]>('SELECT nim FROM students WHERE email = ?', [email]);
    if (!students || students.length === 0) {
      // Return success anyway to prevent email enumeration
      res.status(200).json({ success: true, message: `Jika email terdaftar, OTP telah dikirim ke ${email}.` });
      return;
    }
    
    const studentNim = students[0].nim;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

    // Using student_otps table to store the OTP
    await pool.execute('DELETE FROM student_otps WHERE email_target = ?', [email]);
    await pool.execute(
      'INSERT INTO student_otps (nim, email_target, otp_code, expired_at) VALUES (?, ?, ?, ?)',
      [studentNim, email, otp, expiredAt]
    );

    try {
      await sendForgotPasswordOtpEmail(email, otp);
      console.log(`[Auth Service] OTP Lupa Password dikirim ke: ${email}`);
    } catch (emailErr: any) {
      console.error(`[Auth Service] Gagal kirim email lupa password ke ${email}:`, emailErr.message);
      console.log(`[Auth Service] FALLBACK LUPA PASSWORD OTP untuk ${email}: ${otp}`);
    }

    res.status(200).json({
      success: true,
      message: `Kode OTP telah dikirim ke ${email}. Silakan cek inbox Anda.`,
    });
  } catch (err: any) {
    console.error('[Auth Service] forgotPasswordSendOtp error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

export const forgotPasswordVerifyReset = async (req: Request, res: Response): Promise<void> => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    res.status(400).json({ success: false, message: 'Email, OTP, dan Password Baru wajib diisi' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT otp_id, nim, expired_at
       FROM student_otps
       WHERE email_target = ? AND otp_code = ?
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    if (!rows || rows.length === 0) {
      res.status(401).json({ success: false, message: 'OTP salah atau tidak ditemukan' });
      return;
    }

    const otpRow = rows[0];
    if (new Date() > new Date(otpRow.expired_at)) {
      await pool.execute('DELETE FROM student_otps WHERE otp_id = ?', [otpRow.otp_id]);
      res.status(401).json({ success: false, message: 'OTP sudah kadaluarsa. Silakan minta ulang OTP.' });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.execute('UPDATE students SET password = ?, password_changed = 1 WHERE nim = ?', [hashedPassword, otpRow.nim]);
    
    // Delete used OTP
    await pool.execute('DELETE FROM student_otps WHERE otp_id = ?', [otpRow.otp_id]);

    res.status(200).json({
      success: true,
      message: 'Password berhasil diubah. Silakan login menggunakan password baru Anda.',
    });
  } catch (err: any) {
    console.error('[Auth Service] forgotPasswordVerifyReset error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};
