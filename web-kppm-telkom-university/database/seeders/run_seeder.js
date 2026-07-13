/**
 * Seeder: Insert data mahasiswa untuk login
 * Jalankan dengan: node database/seeders/run_seeder.js
 *
 * Pastikan .env sudah dikonfigurasi di root project atau
 * set environment variable sebelum menjalankan.
 */

const path   = require('path');

// Pastikan mysql2 bisa di-resolve dari student-service/node_modules
// sehingga script bisa dijalankan dari direktori manapun
const studentServiceModules = path.join(__dirname, '../../services/student-service/node_modules');
require('module').Module._nodeModulePaths = ((orig) => function(from) {
  const paths = orig.call(this, from);
  if (!paths.includes(studentServiceModules)) paths.unshift(studentServiceModules);
  return paths;
})(require('module').Module._nodeModulePaths);

const mysql  = require('mysql2/promise');
require('dotenv').config({
  path: path.join(__dirname, '../../services/student-service/.env'),
});

const DB_CONFIG = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'internship_management',
};

const LECTURERS = [
  {
    nip:           '198001012005011001',
    lecturer_name: 'Dr. Bambang Supriyanto, M.T.',
    password:      'password123',
  },
  {
    nip:           '198205152009121002',
    lecturer_name: 'Dra. Siti Aminah, M.Kom.',
    password:      'password123',
  },
  {
    nip:           '197803232003121003',
    lecturer_name: 'Ir. Hendra Kusuma, M.T., Ph.D.',
    password:      'password123',
  },
];

const STUDENTS = [
  {
    nim:          '1301213001',
    student_name: 'Reynaldy Pratama',
    class:        'IF-46-01',
    email:        'reynaldy.pratama@student.telkomuniversity.ac.id',
    password:     'password123',
  },
  {
    nim:          '1301213002',
    student_name: 'Budi Santoso',
    class:        'IF-46-02',
    email:        'budi.santoso@student.telkomuniversity.ac.id',
    password:     'password123',
  },
  {
    nim:          '1301213003',
    student_name: 'Siti Rahayu',
    class:        'SI-46-01',
    email:        'siti.rahayu@student.telkomuniversity.ac.id',
    password:     'password123',
  },
];

async function runSeeder() {
  let conn;
  try {
    console.log('\n🌱 Menjalankan seeder...');
    console.log(`   Host: ${DB_CONFIG.host}:${DB_CONFIG.port}`);
    console.log(`   Database: ${DB_CONFIG.database}\n`);

    conn = await mysql.createConnection(DB_CONFIG);

    // ─── Seeder Dosen Pembimbing ──────────────────────────────────────────────────
    console.log('📚 Seeder Dosen Pembimbing:');
    let lecturerInserted = 0, lecturerSkipped = 0;
    for (const l of LECTURERS) {
      const [existing] = await conn.execute(
        'SELECT lecturer_id FROM lecturers WHERE nip = ?', [l.nip]
      );
      if (existing.length > 0) {
        console.log(`   ⏭  Skip  — NIP ${l.nip} (${l.lecturer_name}) sudah ada`);
        lecturerSkipped++;
        continue;
      }
      await conn.execute(
        'INSERT INTO lecturers (nip, lecturer_name, password) VALUES (?, ?, ?)',
        [l.nip, l.lecturer_name, l.password]
      );
      console.log(`   ✅ Insert — NIP ${l.nip} (${l.lecturer_name})`);
      lecturerInserted++;
    }
    console.log(`   → ${lecturerInserted} ditambahkan, ${lecturerSkipped} dilewati\n`);

    // ─── Seeder Mahasiswa ────────────────────────────────────────────────────────
    console.log('👥 Seeder Mahasiswa:');
    let studentInserted = 0, studentSkipped = 0;
    for (const s of STUDENTS) {
      const [existing] = await conn.execute(
        'SELECT student_id FROM students WHERE nim = ?', [s.nim]
      );
      if (existing.length > 0) {
        console.log(`   ⏭  Skip  — NIM ${s.nim} (${s.student_name}) sudah ada`);
        studentSkipped++;
        continue;
      }
      await conn.execute(
        'INSERT INTO students (nim, student_name, class, email, password) VALUES (?, ?, ?, ?, ?)',
        [s.nim, s.student_name, s.class, s.email, s.password]
      );
      console.log(`   ✅ Insert — NIM ${s.nim} (${s.student_name})`);
      studentInserted++;
    }
    console.log(`   → ${studentInserted} ditambahkan, ${studentSkipped} dilewati\n`);

    // Tampilkan ringkasan
    const [lecRows] = await conn.execute(
      'SELECT lecturer_id, nip, lecturer_name FROM lecturers ORDER BY lecturer_id'
    );
    const [stuRows] = await conn.execute(
      'SELECT student_id, nim, student_name, class FROM students ORDER BY student_id'
    );

    console.log(`📋 Dosen di database (${lecRows.length} total):`);
    console.log('─'.repeat(70));
    lecRows.forEach(r => {
      console.log(`   [${r.lecturer_id}] ${r.nip} | ${r.lecturer_name}`);
    });

    console.log(`\n📋 Mahasiswa di database (${stuRows.length} total):`);
    console.log('─'.repeat(70));
    stuRows.forEach(r => {
      console.log(`   [${r.student_id}] ${r.nim} | ${r.student_name} | ${r.class}`);
    });
    console.log('─'.repeat(70));

    console.log('\n📌 Kredensial login untuk testing:');
    console.log('   Mahasiswa — NIM      : 1301213001 / 1301213002 / 1301213003');
    console.log('               Password : password123');
    console.log('   Dosen     — NIP      : 198001012005011001 (dst.)');
    console.log('               Password : password123\n');

  } catch (err) {
    console.error('\n❌ Seeder gagal:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

runSeeder();
