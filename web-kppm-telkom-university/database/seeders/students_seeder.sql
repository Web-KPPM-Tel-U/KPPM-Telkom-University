-- =============================================================================
-- SEEDER: Data Mahasiswa & Dosen Pembimbing untuk Login
-- Database: internship_management
-- =============================================================================
-- Cara menjalankan:
--   $env:NODE_PATH = "services\student-service\node_modules"; node database/seeders/run_seeder.js
-- =============================================================================

USE internship_management;

-- ─── Dosen Pembimbing ─────────────────────────────────────────────────────────
DELETE FROM lecturers WHERE nip IN (
  '198001012005011001',
  '198205152009121002',
  '197803232003121003'
);

INSERT INTO lecturers (nip, lecturer_name, password) VALUES
  ('198001012005011001', 'Dr. Bambang Supriyanto, M.T.',   'password123'),
  ('198205152009121002', 'Dra. Siti Aminah, M.Kom.',       'password123'),
  ('197803232003121003', 'Ir. Hendra Kusuma, M.T., Ph.D.', 'password123');

-- ─── Mahasiswa ────────────────────────────────────────────────────────────────
DELETE FROM students WHERE nim IN (
  '1301213001',
  '1301213002',
  '1301213003'
);

-- Insert data mahasiswa
-- Password disimpan sebagai plain text.
-- Auth service otomatis mendukung ini (lihat authController.ts baris 56).
-- Untuk production, ganti dengan bcrypt hash.
INSERT INTO students (nim, student_name, class, email, password) VALUES
  ('1301213001', 'Reynaldy Pratama',   'IF-46-01', 'reynaldy.pratama@student.telkomuniversity.ac.id',   'password123'),
  ('1301213002', 'Budi Santoso',       'IF-46-02', 'budi.santoso@student.telkomuniversity.ac.id',       'password123'),
  ('1301213003', 'Siti Rahayu',        'SI-46-01', 'siti.rahayu@student.telkomuniversity.ac.id',        'password123');

-- Verifikasi
SELECT student_id, nim, student_name, class, email FROM students;
