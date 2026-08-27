import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'kppm-telkom-secret-dev-2024';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string | number;  // nim (mahasiswa, string) atau nip (dosen, string)
    nim?: string;          // NIM mahasiswa (hanya ada di JWT mahasiswa)
    nip?: string;          // NIP dosen (hanya ada di JWT dosen)
    admin_id?: number;     // ID admin (hanya ada di JWT admin)
    username?: string;     // Username admin
    name: string;
    role: string;          // 'student' | 'lecturer' | 'mentor' | 'admin' | 'pic'
  };
}

/**
 * Middleware: Verifikasi JWT dari header Authorization
 */
export const verifyToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthenticatedRequest['user'];
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa' });
  }
};

/**
 * Middleware: Verifikasi JWT Admin/PIC
 * Hanya mengizinkan role 'admin' atau 'pic'
 */
export const verifyAdminToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token admin tidak ditemukan' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthenticatedRequest['user'];
    if (decoded?.role !== 'admin' && decoded?.role !== 'pic') {
      res.status(403).json({ success: false, message: 'Akses ditolak. Hanya untuk Admin/PIC.' });
      return;
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token admin tidak valid atau sudah kadaluarsa' });
  }
};

/**
 * Middleware: Verifikasi JWT khusus PIC
 * Hanya mengizinkan role 'pic'
 */
export const verifyPicToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthenticatedRequest['user'];
    if (decoded?.role !== 'pic') {
      res.status(403).json({ success: false, message: 'Akses ditolak. Hanya untuk PIC.' });
      return;
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa' });
  }
};

/**
 * Middleware: Verifikasi JWT mentor + validasi session DB + cek mentor_access_revoked (real-time).
 *
 * Dipakai di semua route /mentor/*.
 * Memastikan:
 *   1. JWT valid dan role = 'mentor'
 *   2. Session masih terdaftar di tabel mentor_sessions (belum di-revoke)
 *   3. Kolom mentor_access_revoked = 0 pada internship_registrations
 *
 * Jika salah satu gagal, request langsung ditolak meski JWT belum expired.
 */
export const verifyMentorToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token mentor tidak ditemukan' });
    return;
  }

  const token = authHeader.split(' ')[1];

  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    res.status(401).json({ success: false, message: 'Token mentor tidak valid atau sudah kadaluarsa' });
    return;
  }

  if (decoded?.role !== 'mentor') {
    res.status(403).json({ success: false, message: 'Akses ditolak. Hanya untuk Mentor.' });
    return;
  }

  const registrationId = decoded.registration_id;
  if (!registrationId) {
    res.status(401).json({ success: false, message: 'Token mentor tidak valid.' });
    return;
  }

  try {
    // 1. Cek apakah session masih aktif di DB
    const [sessionRows] = await (pool as any).execute(
      'SELECT mentor_session_id FROM mentor_sessions WHERE registration_id = ? AND session_token = ?',
      [registrationId, token]
    ) as [any[], any];

    if (!sessionRows || sessionRows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Sesi Anda telah berakhir. Silakan login kembali.',
      });
      return;
    }

    // 2. Cek apakah akses mentor sudah dicabut
    const [regRows] = await (pool as any).execute(
      'SELECT mentor_access_revoked FROM internship_registrations WHERE registration_id = ?',
      [registrationId]
    ) as [any[], any];

    if (!regRows || regRows.length === 0 || regRows[0].mentor_access_revoked === 1) {
      res.status(403).json({
        success: false,
        message: 'Akses Anda telah dinonaktifkan karena mahasiswa telah menyelesaikan upload dokumen KP.',
      });
      return;
    }
  } catch (err: any) {
    console.error('[authMiddleware] verifyMentorToken DB error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    return;
  }

  req.user = decoded;
  next();
};
