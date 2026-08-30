require('dotenv').config();
const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Kopi123!@#',
    database: process.env.DB_NAME || 'kppm_db'
  });
  try {
    const [rows] = await pool.execute(`
      SELECT
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
       WHERE ir.mentor_email = 'hendrikdenis3@gmail.com' AND ir.status = 'approved'
       ORDER BY ir.approved_at DESC
    `);
    console.log('SUCCESS:', rows.length, 'rows');
  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    pool.end();
  }
}
run();
