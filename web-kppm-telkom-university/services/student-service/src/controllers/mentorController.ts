import 'dotenv/config';
import { Request, Response } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// ─── Get Mentor Dashboard ─────────────────────────────────────────────────────
// Mentor login menggunakan email, JWT payload-nya berisi: { email, role: 'mentor', registration_id }
export const getMentorDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const mentorEmail = (req.user as any)?.email;
  const registrationId = (req.user as any)?.registration_id;

  if (!mentorEmail) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi sebagai mentor' });
    return;
  }

  try {
    // Ambil semua pendaftaran yang mentor_email-nya cocok dan status approved
    const [regRows] = (await (pool as any).execute(
      `SELECT
         ir.registration_id,
         ir.status,
         ir.company_name,
         ir.internship_position,
         ir.internship_start,
         ir.internship_end,
         ir.semester_code,
         ir.submitted_at,
         ir.approved_at,
         ir.whatsapp_number,
         ir.mentor_name,
         ir.mentor_position,
         ir.mentor_phone,
         s.nim,
         s.student_name,
         s.class AS student_class,
         s.email AS student_email,
         l.lecturer_name AS pembimbing_akademik
       FROM internship_registrations ir
       JOIN students s ON ir.nim = s.nim
       LEFT JOIN lecturers l ON ir.lecturer_nip = l.nip
       WHERE ir.mentor_email = ? AND ir.status = 'approved'
       ORDER BY ir.approved_at DESC`,
      [mentorEmail]
    )) as [any[], any];

    // Ambil data mentor dari baris pertama jika ada
    const firstReg = regRows && regRows.length > 0 ? regRows[0] : null;

    const mentorInfo = {
      name: firstReg?.mentor_name || mentorEmail,
      position: firstReg?.mentor_position || '-',
      email: mentorEmail,
      phone: firstReg?.mentor_phone || '-',
      company_name: firstReg?.company_name || '-',
    };

    const mentees = (regRows || []).map((r: any) => ({
      registration_id: r.registration_id,
      status: r.status,
      semester_code: r.semester_code,
      company_name: r.company_name,
      internship_position: r.internship_position,
      internship_start: r.internship_start,
      internship_end: r.internship_end,
      submitted_at: r.submitted_at,
      approved_at: r.approved_at,
      student: {
        nim: r.nim,
        name: r.student_name,
        class: r.student_class,
        email: r.student_email,
        whatsapp: r.whatsapp_number,
      },
      pembimbing_akademik: r.pembimbing_akademik,
    }));

    res.status(200).json({
      success: true,
      data: {
        mentor: mentorInfo,
        total_mentees: mentees.length,
        mentees,
      },
    });
  } catch (err: any) {
    console.error('[Mentor Controller] getMentorDashboard error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};
