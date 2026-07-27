import { Response } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Bobot tiap indikator (dalam %)
const BOBOT: Record<string, number> = {
  attendance: 5,
  discipline: 5,
  commitment: 5,
  planning: 5,
  teamwork: 10,
  guidance: 5,
  report: 5,
  problem_solving: 5,
};

const SCORE_FIELDS = Object.keys(BOBOT);

// ─── Helper: pastikan mentor punya akses ke registration_id ini ─────────────
async function verifyMentorAccess(
  mentorEmail: string,
  registrationId: number
): Promise<{ allowed: boolean; row?: any }> {
  const [rows] = await pool.execute<any[]>(
    `SELECT ir.registration_id, ir.mentor_email, s.nim, s.student_name, ir.company_name, ir.semester_code
     FROM internship_registrations ir
     JOIN students s ON ir.student_id = s.student_id
     WHERE ir.registration_id = ? AND ir.mentor_email = ? AND ir.status = 'approved'`,
    [registrationId, mentorEmail]
  );
  return { allowed: rows.length > 0, row: rows[0] };
}

// ─── Submit / Update Nilai ───────────────────────────────────────────────────
// POST /student/mentor/grades/:registration_id
export const submitMentorGrade = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const mentorEmail = (req.user as any)?.email;
  const registrationId = Number(req.params.registration_id);

  if (!mentorEmail) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi sebagai mentor' });
    return;
  }

  if (isNaN(registrationId)) {
    res.status(400).json({ success: false, message: 'registration_id tidak valid' });
    return;
  }

  // Verifikasi akses
  const { allowed, row } = await verifyMentorAccess(mentorEmail, registrationId);
  if (!allowed) {
    res.status(403).json({ success: false, message: 'Anda tidak berhak menilai mahasiswa ini' });
    return;
  }

  // Validasi body
  const body = req.body;
  for (const field of SCORE_FIELDS) {
    const val = body[field];
    if (val === undefined || val === null || val === '') {
      res.status(400).json({ success: false, message: `Field "${field}" wajib diisi` });
      return;
    }
    const num = Number(val);
    if (isNaN(num) || num < 0 || num > 100) {
      res.status(400).json({ success: false, message: `Nilai "${field}" harus antara 0 - 100` });
      return;
    }
  }

  // Hitung total (Bobot x Nilai / 100) untuk masing-masing, lalu jumlahkan
  let total = 0;
  for (const field of SCORE_FIELDS) {
    total += (BOBOT[field] / 100) * Number(body[field]);
  }

  try {
    // Cek apakah sudah pernah dinilai (UPSERT)
    const [existing] = await pool.execute<any[]>(
      'SELECT mentor_score_id FROM mentor_scores WHERE registration_id = ?',
      [registrationId]
    );

    if (existing.length > 0) {
      // UPDATE
      await pool.execute(
        `UPDATE mentor_scores SET
           attendance = ?, discipline = ?, commitment = ?, planning = ?,
           teamwork = ?, guidance = ?, report = ?, problem_solving = ?,
           updated_at = NOW()
         WHERE registration_id = ?`,
        [
          body.attendance, body.discipline, body.commitment, body.planning,
          body.teamwork, body.guidance, body.report, body.problem_solving,
          registrationId,
        ]
      );
    } else {
      // INSERT
      await pool.execute(
        `INSERT INTO mentor_scores
           (registration_id, attendance, discipline, commitment, planning, teamwork, guidance, report, problem_solving)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          registrationId,
          body.attendance, body.discipline, body.commitment, body.planning,
          body.teamwork, body.guidance, body.report, body.problem_solving,
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: `Nilai untuk ${row.student_name} berhasil disimpan`,
      data: {
        registration_id: registrationId,
        student_name: row.student_name,
        nim: row.nim,
        scores: {
          attendance: Number(body.attendance),
          discipline: Number(body.discipline),
          commitment: Number(body.commitment),
          planning: Number(body.planning),
          teamwork: Number(body.teamwork),
          guidance: Number(body.guidance),
          report: Number(body.report),
          problem_solving: Number(body.problem_solving),
        },
        total_nilai_lapangan: parseFloat(total.toFixed(2)),
      },
    });
  } catch (err: any) {
    console.error('[Mentor Grades] submitMentorGrade error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// ─── Get Nilai Satu Mahasiswa ─────────────────────────────────────────────────
// GET /student/mentor/grades/:registration_id
export const getMentorGrade = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const mentorEmail = (req.user as any)?.email;
  const registrationId = Number(req.params.registration_id);

  if (!mentorEmail) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi sebagai mentor' });
    return;
  }

  const { allowed } = await verifyMentorAccess(mentorEmail, registrationId);
  if (!allowed) {
    res.status(403).json({ success: false, message: 'Anda tidak berhak mengakses nilai ini' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT * FROM mentor_scores WHERE registration_id = ?',
      [registrationId]
    );

    if (rows.length === 0) {
      res.status(200).json({ success: true, data: null, message: 'Belum ada nilai' });
      return;
    }

    const row = rows[0];
    let total = 0;
    for (const field of SCORE_FIELDS) {
      total += (BOBOT[field] / 100) * Number(row[field]);
    }

    res.status(200).json({
      success: true,
      data: {
        mentor_score_id: row.mentor_score_id,
        registration_id: row.registration_id,
        scores: {
          attendance: Number(row.attendance),
          discipline: Number(row.discipline),
          commitment: Number(row.commitment),
          planning: Number(row.planning),
          teamwork: Number(row.teamwork),
          guidance: Number(row.guidance),
          report: Number(row.report),
          problem_solving: Number(row.problem_solving),
        },
        total_nilai_lapangan: parseFloat(total.toFixed(2)),
        updated_at: row.updated_at,
      },
    });
  } catch (err: any) {
    console.error('[Mentor Grades] getMentorGrade error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// ─── Get Semua Nilai yang Sudah Diinput Mentor ────────────────────────────────
// GET /student/mentor/grades
export const getAllMentorGrades = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const mentorEmail = (req.user as any)?.email;

  if (!mentorEmail) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi sebagai mentor' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT ms.*, s.nim, s.student_name, ir.company_name, ir.semester_code, ir.internship_position
       FROM mentor_scores ms
       JOIN internship_registrations ir ON ms.registration_id = ir.registration_id
       JOIN students s ON ir.student_id = s.student_id
       WHERE ir.mentor_email = ?
       ORDER BY ms.updated_at DESC`,
      [mentorEmail]
    );

    const data = rows.map((row) => {
      let total = 0;
      for (const field of SCORE_FIELDS) {
        total += (BOBOT[field] / 100) * Number(row[field]);
      }
      return {
        mentor_score_id: row.mentor_score_id,
        registration_id: row.registration_id,
        student: { nim: row.nim, name: row.student_name },
        company_name: row.company_name,
        semester_code: row.semester_code,
        total_nilai_lapangan: parseFloat(total.toFixed(2)),
        updated_at: row.updated_at,
      };
    });

    res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error('[Mentor Grades] getAllMentorGrades error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};
