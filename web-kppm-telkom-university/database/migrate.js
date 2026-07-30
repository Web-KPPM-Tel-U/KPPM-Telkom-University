#!/usr/bin/env node
/**
 * ─── KPPM Safe Database Migrator ─────────────────────────────────────────────
 *
 * Jalankan ini setelah git pull untuk memastikan schema database lokal
 * selalu sinkron TANPA menghapus data yang sudah ada.
 *
 *   npm run db:migrate
 */

const path = require('path');

// Resolve dependencies dari student-service/node_modules
const SERVICE_DIR = path.join(__dirname, '..', 'services', 'student-service');
const mysql  = require(path.join(SERVICE_DIR, 'node_modules', 'mysql2', 'promise'));
require(path.join(SERVICE_DIR, 'node_modules', 'dotenv')).config({
  path: path.join(SERVICE_DIR, '.env'),
});

const DB_CONFIG = {
  host    : process.env.DB_HOST     || '127.0.0.1',
  port    : parseInt(process.env.DB_PORT || '3306', 10),
  user    : process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

// ─── Daftar migrasi ────────────────────────────────────────────────────────────
// Tambahkan entri baru di bawah tiap ada perubahan schema.
// Setiap item HARUS bersifat idempoten (aman dijalankan berkali-kali).
const MIGRATIONS = [

  // ── v1: Buat database & semua tabel ──────────────────────────────────────────
  {
    description: 'Create database if not exists',
    sql: `CREATE DATABASE IF NOT EXISTS internship_management
          CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
  },
  {
    description: 'Create students table',
    sql: `CREATE TABLE IF NOT EXISTS internship_management.students (
      student_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
      nim              VARCHAR(20)  NOT NULL UNIQUE,
      student_name     VARCHAR(100) NOT NULL,
      class            VARCHAR(20)  NOT NULL,
      email            VARCHAR(100) NULL DEFAULT NULL,
      password         VARCHAR(255) NOT NULL,
      is_verified      TINYINT(1)   NOT NULL DEFAULT 0,
      password_changed TINYINT(1)   NOT NULL DEFAULT 0,
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`,
  },
  {
    description: 'Create lecturers table',
    sql: `CREATE TABLE IF NOT EXISTS internship_management.lecturers (
      lecturer_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
      nip           VARCHAR(30)  NOT NULL UNIQUE,
      lecturer_name VARCHAR(100) NOT NULL,
      email         VARCHAR(100) NOT NULL DEFAULT '',
      password      VARCHAR(255) NOT NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`,
  },
  {
    description: 'Create internship_registrations table',
    sql: `CREATE TABLE IF NOT EXISTS internship_management.internship_registrations (
      registration_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
      student_id          BIGINT NOT NULL,
      lecturer_id         BIGINT NOT NULL,
      semester_code       VARCHAR(20)  NOT NULL,
      whatsapp_number     VARCHAR(20)  NOT NULL,
      company_name        VARCHAR(150) NOT NULL,
      internship_position VARCHAR(100) NOT NULL,
      internship_start    DATE NOT NULL,
      internship_end      DATE NOT NULL,
      toss_cover_letter_file VARCHAR(255) NOT NULL,
      mentor_name         VARCHAR(100) NOT NULL,
      mentor_position     VARCHAR(100) NOT NULL,
      mentor_email        VARCHAR(100) NOT NULL,
      mentor_phone        VARCHAR(20)  NOT NULL,
      status ENUM('pending_approval','approved','cancelled') DEFAULT 'pending_approval',
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_at  DATETIME NULL,
      cancelled_at DATETIME NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_registration_student
        FOREIGN KEY (student_id) REFERENCES internship_management.students(student_id) ON DELETE CASCADE,
      CONSTRAINT fk_registration_lecturer
        FOREIGN KEY (lecturer_id) REFERENCES internship_management.lecturers(lecturer_id)
    ) ENGINE=InnoDB;`,
  },
  {
    description: 'Create internship_documents table',
    sql: `CREATE TABLE IF NOT EXISTS internship_management.internship_documents (
      document_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
      registration_id BIGINT NOT NULL UNIQUE,
      field_supervisor_score_file    VARCHAR(255) NOT NULL,
      academic_supervisor_score_file VARCHAR(255) NOT NULL,
      certificate_file               VARCHAR(255) NOT NULL,
      implementation_agreement_file  VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_document_registration
        FOREIGN KEY (registration_id)
        REFERENCES internship_management.internship_registrations(registration_id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,
  },
  {
    description: 'Create lecturer_scores table',
    sql: `CREATE TABLE IF NOT EXISTS internship_management.lecturer_scores (
      lecturer_score_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
      registration_id         BIGINT NOT NULL UNIQUE,
      plo05_clo01_commitment  DECIMAL(5,2) NOT NULL,
      plo07_clo02_planning    DECIMAL(5,2) NOT NULL,
      plo05_clo04_guidance    DECIMAL(5,2) NOT NULL,
      plo05_clo04_presentation DECIMAL(5,2) NOT NULL,
      plo05_clo04_report      DECIMAL(5,2) NOT NULL,
      plo01_clo05_identification DECIMAL(5,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_lecturer_score_registration
        FOREIGN KEY (registration_id)
        REFERENCES internship_management.internship_registrations(registration_id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,
  },
  {
    description: 'Create mentor_otps table',
    sql: `CREATE TABLE IF NOT EXISTS internship_management.mentor_otps (
      otp_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
      registration_id BIGINT NOT NULL,
      otp_code        VARCHAR(6) NOT NULL,
      expired_at      DATETIME NOT NULL,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_mentor_otp_registration
        FOREIGN KEY (registration_id)
        REFERENCES internship_management.internship_registrations(registration_id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,
  },
  {
    description: 'Create mentor_sessions table',
    sql: `CREATE TABLE IF NOT EXISTS internship_management.mentor_sessions (
      mentor_session_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
      registration_id    BIGINT NOT NULL,
      session_token      VARCHAR(255) NOT NULL,
      session_expired_at DATETIME NOT NULL,
      created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_mentor_session_registration
        FOREIGN KEY (registration_id)
        REFERENCES internship_management.internship_registrations(registration_id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,
  },
  {
    description: 'Create mentor_scores table',
    sql: `CREATE TABLE IF NOT EXISTS internship_management.mentor_scores (
      mentor_score_id BIGINT AUTO_INCREMENT PRIMARY KEY,
      registration_id BIGINT NOT NULL UNIQUE,
      attendance      DECIMAL(5,2) NOT NULL,
      discipline      DECIMAL(5,2) NOT NULL,
      commitment      DECIMAL(5,2) NOT NULL,
      planning        DECIMAL(5,2) NOT NULL,
      teamwork        DECIMAL(5,2) NOT NULL,
      guidance        DECIMAL(5,2) NOT NULL,
      report          DECIMAL(5,2) NOT NULL,
      problem_solving DECIMAL(5,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_mentor_score_registration
        FOREIGN KEY (registration_id)
        REFERENCES internship_management.internship_registrations(registration_id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,
  },

  // ── v2: Tambah kolom cancelled_at (aman jika sudah ada) ──────────────────────
  {
    description: 'Add cancelled_at column (if missing)',
    sql: `ALTER TABLE internship_management.internship_registrations
          ADD COLUMN cancelled_at DATETIME NULL AFTER approved_at;`,
    ignoreErrorCode: 1060, // ER_DUP_FIELDNAME — kolom sudah ada
  },

  // ── v2: Pastikan ENUM punya nilai cancelled ───────────────────────────────────
  {
    description: 'Ensure status ENUM includes cancelled',
    sql: `ALTER TABLE internship_management.internship_registrations
          MODIFY COLUMN status
          ENUM('pending_approval','approved','cancelled') DEFAULT 'pending_approval';`,
  },

  // ── v3: Hapus constraint uq_student_semester ─────────────────────────────────
  // uq_student_semester = UNIQUE KEY (student_id, semester_code)
  // MySQL/MariaDB tidak mengizinkan DROP INDEX jika kolom dalam index tersebut
  // juga dipakai oleh FOREIGN KEY. Urutan yang benar:
  //   1. Drop FK yang memakai student_id (fk_registration_student)
  //   2. Drop UNIQUE KEY uq_student_semester
  //   3. Buat ulang FK fk_registration_student
  {
    description: 'Step 1/3 — Drop fk_registration_student (temp, to unblock unique key drop)',
    sql: `ALTER TABLE internship_management.internship_registrations
          DROP FOREIGN KEY fk_registration_student;`,
    ignoreErrorCode: 1091,
  },
  {
    description: 'Step 2/3 — Drop uq_student_semester (allows re-registration after cancellation)',
    sql: `ALTER TABLE internship_management.internship_registrations
          DROP INDEX uq_student_semester;`,
    ignoreErrorCode: 1091,
  },
  {
    description: 'Step 3/3 — Re-add fk_registration_student',
    sql: `ALTER TABLE internship_management.internship_registrations
          ADD CONSTRAINT fk_registration_student
          FOREIGN KEY (student_id) REFERENCES internship_management.students(student_id)
          ON DELETE CASCADE;`,
    ignoreErrorCode: 1826, // ER_DUP_CONSTRAINT_NAME — FK sudah ada (jika step 1 di-skip)
  },

  // ── v4: Tambah kolom email ke tabel lecturers (untuk login dosen pakai email) ─
  {
    description: 'Add email column to lecturers (if missing)',
    sql: `ALTER TABLE internship_management.lecturers
          ADD COLUMN email VARCHAR(100) NOT NULL DEFAULT '' AFTER lecturer_name;`,
    ignoreErrorCode: 1060, // ER_DUP_FIELDNAME — kolom sudah ada
  },
  {
    description: 'Populate email for existing lecturers',
    sql: `UPDATE internship_management.lecturers
          SET email = CONCAT(nip, '@telkomuniversity.ac.id')
          WHERE email = '';`,
  },
  {
    description: 'Add unique index on lecturers.email (if missing)',
    sql: `ALTER TABLE internship_management.lecturers
          ADD UNIQUE INDEX uq_lecturer_email (email);`,
    ignoreErrorCode: 1061, // ER_DUP_KEYNAME — index sudah ada
  },


  // ── v5: Pastikan kolom email ada di tabel lecturers (untuk integrasi dashboard dosen) ─
  {
    description: 'Add email column to lecturers CREATE TABLE (if missing)',
    sql: `ALTER TABLE internship_management.lecturers
          ADD COLUMN email VARCHAR(100) NOT NULL DEFAULT '' AFTER lecturer_name;`,
    ignoreErrorCode: 1060, // ER_DUP_FIELDNAME — kolom sudah ada
  },
  {
    description: 'Populate email for lecturers with empty email',
    sql: `UPDATE internship_management.lecturers
          SET email = CONCAT(nip, '@telkomuniversity.ac.id')
          WHERE email = '';`,
  },
  {
    description: 'Add unique index on lecturers.email (v5, if missing)',
    sql: `ALTER TABLE internship_management.lecturers
          ADD UNIQUE INDEX uq_lecturer_email_v5 (email);`,
    ignoreErrorCode: 1061, // ER_DUP_KEYNAME — index sudah ada
  },

  // ── v5b: Tabel student_otps untuk verifikasi email mahasiswa ───────────────────
  {
    description: 'Create student_otps table',
    sql: `CREATE TABLE IF NOT EXISTS internship_management.student_otps (
      otp_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
      student_id   BIGINT NOT NULL,
      email_target VARCHAR(100) NOT NULL,
      otp_code     VARCHAR(6) NOT NULL,
      expired_at   DATETIME NOT NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_student_otp
        FOREIGN KEY (student_id) REFERENCES internship_management.students(student_id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,
  },

  // ── v6: Tambah status 'rejected' — dosen tolak pengajuan ─────────────────────
  {
    description: 'Add rejected status to internship_registrations ENUM',
    sql: `ALTER TABLE internship_management.internship_registrations
          MODIFY COLUMN status
          ENUM('pending_approval','approved','cancelled','rejected') DEFAULT 'pending_approval';`,
  },
  {
    description: 'Add rejected_at column (if missing)',
    sql: `ALTER TABLE internship_management.internship_registrations
          ADD COLUMN rejected_at DATETIME NULL AFTER cancelled_at;`,
    ignoreErrorCode: 1060,
  },

];

// ─── Seed data ────────────────────────────────────────────────────────────────
// Password default = NIM (plain text). Saat mahasiswa ganti password,
// akan di-hash dengan bcrypt dan password_changed di-set ke 1.
const SEEDS = `
INSERT IGNORE INTO internship_management.students
  (nim, student_name, class, email, is_verified, password_changed, password) VALUES
  ('12345678', 'Budi Santoso', 'IF-45-01', NULL, 0, 0, '12345678'),
  ('23456789', 'Siti Rahayu',  'IF-45-02', NULL, 0, 0, '23456789'),
  ('34567890', 'Ahmad Fauzan', 'SI-45-01', NULL, 0, 0, '34567890');
`;

// ─── Runner ───────────────────────────────────────────────────────────────────
async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('\n🗄️  KPPM Database Migrator\n' + '─'.repeat(52));

  let applied = 0;
  let skipped = 0;

  for (const m of MIGRATIONS) {
    process.stdout.write(`  ▸ ${m.description}... `);
    try {
      await conn.execute(m.sql);
      console.log('✅');
      applied++;
    } catch (err) {
      if (m.ignoreErrorCode && err.errno === m.ignoreErrorCode) {
        console.log('⏭️  (skipped — already ok)');
        skipped++;
      } else {
        console.log('❌ ERROR');
        console.error('   ', err.message);
        await conn.end();
        process.exit(1);
      }
    }
  }

  // Seed
  process.stdout.write(`  ▸ Seeding default student data... `);
  try {
    await conn.query(SEEDS);
    console.log('✅');
  } catch (err) {
    console.log('⚠️  seed warning:', err.message);
  }

  await conn.end();
  console.log('─'.repeat(52));
  console.log(`\n✨ Done! (${applied} applied, ${skipped} skipped)\n`);
}

run().catch((err) => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
