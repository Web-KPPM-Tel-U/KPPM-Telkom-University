import { Response } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// ─── Bobot tiap indikator PA (dalam %) ───────────────────────────────────────
const BOBOT: Record<string, number> = {
  commitment:     10,
  planning:        5,
  guidance:        5,
  presentation:   15,
  report:         10,
  identification: 10,
};

const SCORE_FIELDS = Object.keys(BOBOT);

// ─── Helper: verifikasi dosen punya akses ke registration_id ini ──────────────
async function verifyLecturerAccess(
  lecturerId: number,
  registrationId: number
): Promise<{ allowed: boolean; row?: any }> {
  const [rows] = await pool.execute<any[]>(
    `SELECT ir.registration_id, s.nim, s.student_name, ir.company_name, ir.semester_code
     FROM internship_registrations ir
     JOIN students s ON ir.nim = s.nim
     WHERE ir.registration_id = ? AND ir.lecturer_id = ? AND ir.status = 'approved'`,
    [registrationId, lecturerId]
  );
  return { allowed: rows.length > 0, row: rows[0] };
}

// ─── Submit / Update Nilai Dosen ─────────────────────────────────────────────
// POST /student/lecturer/grades/:registration_id
export const submitLecturerGrade = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const lecturerId = Number(req.user?.sub);
  const role       = req.user?.role;
  const registrationId = Number(req.params.registration_id);

  if (!lecturerId || isNaN(lecturerId)) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  if (role !== 'lecturer') {
    res.status(403).json({ success: false, message: 'Akses ditolak. Hanya untuk dosen.' });
    return;
  }

  if (isNaN(registrationId)) {
    res.status(400).json({ success: false, message: 'registration_id tidak valid' });
    return;
  }

  const { allowed, row } = await verifyLecturerAccess(lecturerId, registrationId);
  if (!allowed) {
    res.status(403).json({ success: false, message: 'Anda tidak berhak menilai mahasiswa ini atau status bukan approved' });
    return;
  }

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

  let total = 0;
  for (const field of SCORE_FIELDS) {
    total += (BOBOT[field] / 100) * Number(body[field]);
  }

  try {
    const [existing] = await pool.execute<any[]>(
      'SELECT lecturer_score_id FROM lecturer_scores WHERE registration_id = ?',
      [registrationId]
    );

    if (existing.length > 0) {
      await pool.execute(
        `UPDATE lecturer_scores SET
           plo05_clo01_commitment     = ?,
           plo07_clo02_planning       = ?,
           plo05_clo04_guidance       = ?,
           plo05_clo04_presentation   = ?,
           plo05_clo04_report         = ?,
           plo01_clo05_identification = ?,
           updated_at = NOW()
         WHERE registration_id = ?`,
        [
          body.commitment, body.planning, body.guidance,
          body.presentation, body.report, body.identification,
          registrationId,
        ]
      );
    } else {
      await pool.execute(
        `INSERT INTO lecturer_scores
           (registration_id, plo05_clo01_commitment, plo07_clo02_planning,
            plo05_clo04_guidance, plo05_clo04_presentation, plo05_clo04_report,
            plo01_clo05_identification)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          registrationId,
          body.commitment, body.planning, body.guidance,
          body.presentation, body.report, body.identification,
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
          commitment:     Number(body.commitment),
          planning:       Number(body.planning),
          guidance:       Number(body.guidance),
          presentation:   Number(body.presentation),
          report:         Number(body.report),
          identification: Number(body.identification),
        },
        total_nilai_pa: parseFloat(total.toFixed(2)),
      },
    });
  } catch (err: any) {
    console.error('[Lecturer Grades] submitLecturerGrade error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// ─── Get Nilai Satu Mahasiswa ─────────────────────────────────────────────────
// GET /student/lecturer/grades/:registration_id
export const getLecturerGrade = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const lecturerId = Number(req.user?.sub);
  const role       = req.user?.role;
  const registrationId = Number(req.params.registration_id);

  if (!lecturerId || isNaN(lecturerId)) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  if (role !== 'lecturer') {
    res.status(403).json({ success: false, message: 'Akses ditolak. Hanya untuk dosen.' });
    return;
  }

  const { allowed } = await verifyLecturerAccess(lecturerId, registrationId);
  if (!allowed) {
    res.status(403).json({ success: false, message: 'Anda tidak berhak mengakses nilai ini' });
    return;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT * FROM lecturer_scores WHERE registration_id = ?',
      [registrationId]
    );

    if (rows.length === 0) {
      res.status(200).json({ success: true, data: null, message: 'Belum ada nilai' });
      return;
    }

    const row = rows[0];
    const scores = {
      commitment:     Number(row.plo05_clo01_commitment),
      planning:       Number(row.plo07_clo02_planning),
      guidance:       Number(row.plo05_clo04_guidance),
      presentation:   Number(row.plo05_clo04_presentation),
      report:         Number(row.plo05_clo04_report),
      identification: Number(row.plo01_clo05_identification),
    };

    let total = 0;
    for (const field of SCORE_FIELDS) {
      total += (BOBOT[field] / 100) * scores[field as keyof typeof scores];
    }

    res.status(200).json({
      success: true,
      data: {
        lecturer_score_id: row.lecturer_score_id,
        registration_id: row.registration_id,
        scores,
        total_nilai_pa: parseFloat(total.toFixed(2)),
        updated_at: row.updated_at,
      },
    });
  } catch (err: any) {
    console.error('[Lecturer Grades] getLecturerGrade error:', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};
