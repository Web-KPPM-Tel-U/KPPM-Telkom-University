#!/usr/bin/env node
// Requires bcryptjs for admin password hashing — loaded from student-service node_modules
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
const bcrypt = require(path.join(SERVICE_DIR, 'node_modules', 'bcryptjs'));
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
      nim                    VARCHAR(20)  NOT NULL PRIMARY KEY,
      student_name           VARCHAR(100) NOT NULL,
      class                  VARCHAR(20)  NOT NULL,
      email                  VARCHAR(100) NULL DEFAULT NULL,
      password               VARCHAR(255) NOT NULL,
      is_verified            TINYINT(1)   NOT NULL DEFAULT 0,
      password_changed       TINYINT(1)   NOT NULL DEFAULT 0,
      is_active              TINYINT(1)   NOT NULL DEFAULT 1,
      assigned_lecturer_code VARCHAR(3)   NULL DEFAULT NULL,
      created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`,
  },
  {
    description: 'Create lecturers table',
    sql: `CREATE TABLE IF NOT EXISTS internship_management.lecturers (
      nip              VARCHAR(30)  NOT NULL PRIMARY KEY,
      lecturer_name    VARCHAR(100) NOT NULL,
      lecturer_code    VARCHAR(3)   NULL DEFAULT NULL,
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
      mentor_access_revoked TINYINT(1) NOT NULL DEFAULT 0,
      status ENUM('pending_approval','approved','cancelled','rejected') DEFAULT 'pending_approval',
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_at  DATETIME NULL,
      cancelled_at DATETIME NULL,
      rejected_at  DATETIME NULL,
      mentor_access_revoked TINYINT(1) DEFAULT 0,
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

  // ── v4b: Add mentor_access_revoked column to internship_registrations ────────
  {
    description: 'Add mentor_access_revoked column to internship_registrations (if missing)',
    sql: `ALTER TABLE internship_management.internship_registrations
          ADD COLUMN mentor_access_revoked TINYINT(1) NOT NULL DEFAULT 0 AFTER mentor_phone;`,
    ignoreErrorCode: 1060, // ER_DUP_FIELDNAME
  },

  // ── v4c: Add lecturer_code column to lecturers ────────
  {
    description: 'Add lecturer_code column to lecturers (if missing)',
    sql: `ALTER TABLE internship_management.lecturers
          ADD COLUMN lecturer_code VARCHAR(3) NULL DEFAULT NULL AFTER lecturer_name;`,
    ignoreErrorCode: 1060, // ER_DUP_FIELDNAME
  },

  // ── v4d: Add assigned_lecturer_code column to students ────────────────────
  {
    description: 'Add assigned_lecturer_code column to students (if missing)',
    sql: `ALTER TABLE internship_management.students
          ADD COLUMN assigned_lecturer_code VARCHAR(3) NULL DEFAULT NULL AFTER is_active;`,
    ignoreErrorCode: 1060, // ER_DUP_FIELDNAME
  },

  // ── v4e: Add is_active column to students (if missing) ────────────────────
  {
    description: 'Add is_active column to students (if missing)',
    sql: `ALTER TABLE internship_management.students
          ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER password_changed;`,
    ignoreErrorCode: 1060, // ER_DUP_FIELDNAME
  },

  // ── v4f: Add is_active column to lecturers (if missing) ────────────────────
  {
    description: 'Add is_active column to lecturers (if missing)',
    sql: `ALTER TABLE internship_management.lecturers
          ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER password_changed;`,
    ignoreErrorCode: 1060, // ER_DUP_FIELDNAME
  },

  // ── v5: Tabel admin_users untuk Admin/PIC ────────────────────────────────────
  {
    description: 'Create admin_users table',
    sql: `CREATE TABLE IF NOT EXISTS internship_management.admin_users (
      admin_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
      username   VARCHAR(50)  NOT NULL UNIQUE,
      email      VARCHAR(100) NOT NULL UNIQUE,
      password   VARCHAR(255) NOT NULL,
      full_name  VARCHAR(100) NOT NULL,
      role       ENUM('admin','pic') NOT NULL DEFAULT 'pic',
      is_active  TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`,
  },

  // ── v5b: Add email column to admin_users if missing (for existing installs) ──────
  {
    description: 'Add email column to admin_users (if missing)',
    sql: `ALTER TABLE internship_management.admin_users
          ADD COLUMN email VARCHAR(100) NOT NULL DEFAULT '' AFTER username,
          ADD UNIQUE KEY uq_admin_email (email);`,
    ignoreErrorCode: 1060, // ER_DUP_FIELDNAME
  },

  // ── v6: Tabel semester_codes untuk kelola semester ──────────────────────────
  {
    description: 'Create semester_codes table',
    sql: `CREATE TABLE IF NOT EXISTS internship_management.semester_codes (
      semester_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
      code         VARCHAR(20)  NOT NULL UNIQUE,
      label        VARCHAR(100) NOT NULL,
      is_active    TINYINT(1)   NOT NULL DEFAULT 0,
      start_date   DATE NULL,
      end_date     DATE NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`,
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

  // Seed admin akun default
  process.stdout.write(`  ▸ Seeding default admin account... `);
  try {
    const [existing] = await conn.execute(
      'SELECT admin_id FROM internship_management.admin_users WHERE username = ?',
      ['admin']
    );
    if (!existing || existing.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await conn.execute(
        `INSERT INTO internship_management.admin_users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)`,
        ['admin', 'admin@telkomuniversity.ac.id', hashedPassword, 'Administrator KPPM', 'admin']
      );
      console.log('✅ (admin@telkomuniversity.ac.id / admin123 dibuat)');
    } else {
      // Pastikan email sudah terisi jika akun lama belum punya email
      await conn.execute(
        `UPDATE internship_management.admin_users SET email = 'admin@telkomuniversity.ac.id' WHERE username = 'admin' AND (email = '' OR email IS NULL)`,
        []
      ).catch(() => { });
      console.log('⏭️  (admin sudah ada)');
    }
  } catch (err) {
    console.log('⚠️  admin seed warning:', err.message);
  }

  await conn.end();
  console.log('─'.repeat(52));
  console.log(`\n✨ Done! (${applied} applied, ${skipped} skipped)\n`);
}

run().catch((err) => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
