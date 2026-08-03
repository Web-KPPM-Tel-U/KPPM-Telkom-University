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
const mysql = require(path.join(SERVICE_DIR, 'node_modules', 'mysql2', 'promise'));
require(path.join(SERVICE_DIR, 'node_modules', 'dotenv')).config({
  path: path.join(SERVICE_DIR, '.env'),
});

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
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
      nim              VARCHAR(20)  NOT NULL PRIMARY KEY,
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
      nip              VARCHAR(30)  NOT NULL PRIMARY KEY,
      lecturer_name    VARCHAR(100) NOT NULL,
      email            VARCHAR(100) NULL DEFAULT NULL,
      password         VARCHAR(255) NOT NULL,
      is_verified      TINYINT(1)   NOT NULL DEFAULT 0,
      password_changed TINYINT(1)   NOT NULL DEFAULT 0,
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`,
  },
  {
    description: 'Create internship_registrations table',
    sql: `CREATE TABLE IF NOT EXISTS internship_management.internship_registrations (
      registration_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
      nim                 VARCHAR(20)  NOT NULL,
      lecturer_nip        VARCHAR(30)  NOT NULL,
      semester_code       VARCHAR(20)  NOT NULL,
      whatsapp_number     VARCHAR(20)  NOT NULL,
      company_name        VARCHAR(150) NOT NULL,
      internship_position VARCHAR(100) NOT NULL,
      internship_start    DATE NOT NULL,
      internship_end      DATE NOT NULL,
      toss_cover_letter_file VARCHAR(255) NOT NULL,
      mentor_name         VARCHAR(100) NOT NULL,
      mentor_nip          VARCHAR(30)  NOT NULL DEFAULT '',
      mentor_position     VARCHAR(100) NOT NULL,
      mentor_email        VARCHAR(100) NOT NULL,
      mentor_phone        VARCHAR(20)  NOT NULL,
      status ENUM('pending_approval','approved','cancelled','rejected') DEFAULT 'pending_approval',
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_at  DATETIME NULL,
      cancelled_at DATETIME NULL,
      rejected_at  DATETIME NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_registration_student
        FOREIGN KEY (nim) REFERENCES internship_management.students(nim) ON DELETE CASCADE,
      CONSTRAINT fk_registration_lecturer
        FOREIGN KEY (lecturer_nip) REFERENCES internship_management.lecturers(nip)
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

  // ── v2: Tabel student_otps untuk verifikasi email mahasiswa ──────────────────
  {
    description: 'Create student_otps table',
    sql: `CREATE TABLE IF NOT EXISTS internship_management.student_otps (
      otp_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
      nim          VARCHAR(20) NOT NULL,
      email_target VARCHAR(100) NOT NULL,
      otp_code     VARCHAR(6) NOT NULL,
      expired_at   DATETIME NOT NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_student_otp
        FOREIGN KEY (nim) REFERENCES internship_management.students(nim) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,
  },

  // ── v3: Tabel lecturer_otps untuk verifikasi email dosen ──────────────────────
  {
    description: 'Create lecturer_otps table',
    sql: `CREATE TABLE IF NOT EXISTS internship_management.lecturer_otps (
      otp_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
      nip          VARCHAR(30) NOT NULL,
      email_target VARCHAR(100) NOT NULL,
      otp_code     VARCHAR(6) NOT NULL,
      expired_at   DATETIME NOT NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_lecturer_otp
        FOREIGN KEY (nip) REFERENCES internship_management.lecturers(nip) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,
  },

  // ── v4: Add mentor_nip column to internship_registrations ────────────────────
  {
    description: 'Add mentor_nip column to internship_registrations (if missing)',
    sql: `ALTER TABLE internship_management.internship_registrations
          ADD COLUMN mentor_nip VARCHAR(30) NOT NULL DEFAULT '' AFTER mentor_name;`,
    ignoreErrorCode: 1060, // ER_DUP_FIELDNAME — kolom sudah ada
  },

];

// ─── Seed data ────────────────────────────────────────────────────────────────
// Password default = NIM (plain text). Saat mahasiswa ganti password,
// akan di-hash dengan bcrypt dan password_changed di-set ke 1.
const SEEDS = `
INSERT IGNORE INTO internship_management.students
  (nim, student_name, class, email, is_verified, password_changed, password) VALUES
  ('1301213001', 'Reynaldy Pratama', 'IF-46-01', NULL, 0, 0, '1301213001'),
  ('1301213002', 'Budi Santoso',     'IF-46-02', NULL, 0, 0, '1301213002'),
  ('1301213003', 'Siti Rahayu',      'SI-46-01', NULL, 0, 0, '1301213003');

INSERT IGNORE INTO internship_management.lecturers
  (nip, lecturer_name, email, password, is_verified, password_changed) VALUES
  ('198001012005011001', 'Dr. Bambang Supriyanto, M.T.', NULL, '198001012005011001', 0, 0),
  ('198205152009121002', 'Dra. Siti Aminah, M.Kom.',     NULL, '198205152009121002', 0, 0),
  ('197803232003121003', 'Ir. Hendra Kusuma, M.T., Ph.D.', NULL, '197803232003121003', 0, 0);
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
