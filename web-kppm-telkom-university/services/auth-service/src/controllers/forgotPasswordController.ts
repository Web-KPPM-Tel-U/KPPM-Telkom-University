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

  // Hanya izinkan domain Telkom University (mahasiswa & dosen)
  if (!email.toLowerCase().endsWith('telkomuniversity.ac.id')) {
    res.status(400).json({
      success: false,
      message: 'Email harus menggunakan domain telkomuniversity.ac.id',
    });
    return;
  }

  try {
    // Cek apakah email terdaftar sebagai mahasiswa
    const [students] = await pool.execute<any[]>(
      'SELECT nim, password_changed FROM students WHERE email = ?',
      [email]
    );

    // Cek apakah email terdaftar sebagai dosen
    const [lecturers] = await pool.execute<any[]>(
      'SELECT nip, password_changed FROM lecturers WHERE email = ?',
      [email]
    );

    // Jika tidak ditemukan di kedua tabel → respons generik (anti email enumeration)
    if ((!students || students.length === 0) && (!lecturers || lecturers.length === 0)) {
      res.status(200).json({ success: true, message: `Jika email terdaftar, OTP telah dikirim ke ${email}.` });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

    // ── Prioritaskan mahasiswa jika email ditemukan di kedua tabel ──
    if (students && students.length > 0) {
      const student = students[0];

      // Blokir jika password masih default (= NIM, belum pernah diubah)
      if (!student.password_changed || student.password_changed === 0) {
        res.status(403).json({
          success: false,
          message: 'Fitur lupa password tidak dapat digunakan karena Anda belum pernah mengganti password. Silakan login menggunakan NIM Anda sebagai password, lalu ganti password melalui menu Pengaturan.',
        });
        return;
      }

      // Simpan OTP untuk mahasiswa
      await pool.execute('DELETE FROM student_otps WHERE email_target = ?', [email]);
      await pool.execute(
        'INSERT INTO student_otps (nim, email_target, otp_code, expired_at) VALUES (?, ?, ?, ?)',
        [student.nim, email, otp, expiredAt]
      );
    } else {
      // Email ditemukan sebagai dosen
      const lecturer = lecturers[0];

      // Blokir jika password masih default (= NIP, belum pernah diubah)
      if (!lecturer.password_changed || lecturer.password_changed === 0) {
        res.status(403).json({
          success: false,
          message: 'Fitur lupa password tidak dapat digunakan karena Anda belum pernah mengganti password. Silakan login menggunakan NIP Anda sebagai password, lalu ganti password melalui menu Pengaturan.',
        });
        return;
      }

      // Simpan OTP untuk dosen
      await pool.execute('DELETE FROM lecturer_otps WHERE email_target = ?', [email]);
      await pool.execute(
        'INSERT INTO lecturer_otps (nip, email_target, otp_code, expired_at) VALUES (?, ?, ?, ?)',
        [lecturer.nip, email, otp, expiredAt]
      );
    }

    // Kirim email OTP
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
    // Coba cocokkan OTP di tabel mahasiswa terlebih dahulu
    const [studentRows] = await pool.execute<any[]>(
      `SELECT otp_id, nim, expired_at
       FROM student_otps
       WHERE email_target = ? AND otp_code = ?
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    // Coba cocokkan OTP di tabel dosen
    const [lecturerRows] = await pool.execute<any[]>(
      `SELECT otp_id, nip, expired_at
       FROM lecturer_otps
       WHERE email_target = ? AND otp_code = ?
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    if (studentRows && studentRows.length > 0) {
      // ── Reset password mahasiswa ──
      const otpRow = studentRows[0];
      if (new Date() > new Date(otpRow.expired_at)) {
        await pool.execute('DELETE FROM student_otps WHERE otp_id = ?', [otpRow.otp_id]);
        res.status(401).json({ success: false, message: 'OTP sudah kadaluarsa. Silakan minta ulang OTP.' });
        return;
      }

      await pool.execute(
        'UPDATE students SET password = ?, password_changed = 1 WHERE nim = ?',
        [hashedPassword, otpRow.nim]
      );
      await pool.execute('DELETE FROM student_otps WHERE otp_id = ?', [otpRow.otp_id]);

    } else if (lecturerRows && lecturerRows.length > 0) {
      // ── Reset password dosen ──
      const otpRow = lecturerRows[0];
      if (new Date() > new Date(otpRow.expired_at)) {
        await pool.execute('DELETE FROM lecturer_otps WHERE otp_id = ?', [otpRow.otp_id]);
        res.status(401).json({ success: false, message: 'OTP sudah kadaluarsa. Silakan minta ulang OTP.' });
        return;
      }

      await pool.execute(
        'UPDATE lecturers SET password = ?, password_changed = 1 WHERE nip = ?',
        [hashedPassword, otpRow.nip]
      );
      await pool.execute('DELETE FROM lecturer_otps WHERE otp_id = ?', [otpRow.otp_id]);

    } else {
      res.status(401).json({ success: false, message: 'OTP salah atau tidak ditemukan' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Password berhasil diubah. Silakan login menggunakan password baru Anda.',
    });
  } catch (err: any) {
    console.error('[Auth Service] forgotPasswordVerifyReset error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};
