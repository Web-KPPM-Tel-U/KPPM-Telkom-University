import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

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

