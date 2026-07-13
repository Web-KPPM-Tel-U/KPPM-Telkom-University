CREATE DATABASE IF NOT EXISTS internship_management
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE internship_management;

CREATE TABLE IF NOT EXISTS students (
    student_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    nim VARCHAR(20) NOT NULL UNIQUE,
    student_name VARCHAR(100) NOT NULL,
    class VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS lecturers (
    lecturer_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    nip VARCHAR(30) NOT NULL UNIQUE,
    lecturer_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS internship_registrations (
    registration_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    student_id BIGINT NOT NULL,
    lecturer_id BIGINT NOT NULL,

    semester_code VARCHAR(20) NOT NULL,

    whatsapp_number VARCHAR(20) NOT NULL,

    company_name VARCHAR(150) NOT NULL,
    internship_position VARCHAR(100) NOT NULL,

    internship_start DATE NOT NULL,
    internship_end DATE NOT NULL,

    toss_cover_letter_file VARCHAR(255) NOT NULL,

    mentor_name VARCHAR(100) NOT NULL,
    mentor_position VARCHAR(100) NOT NULL,
    mentor_email VARCHAR(100) NOT NULL,
    mentor_phone VARCHAR(20) NOT NULL,

    status ENUM(
        'pending_approval',
        'approved'
    ) DEFAULT 'pending_approval',

    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_student_semester
        UNIQUE (student_id, semester_code),

    CONSTRAINT fk_registration_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_registration_lecturer
        FOREIGN KEY (lecturer_id)
        REFERENCES lecturers(lecturer_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS internship_documents (
    document_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    registration_id BIGINT NOT NULL UNIQUE,

    field_supervisor_score_file VARCHAR(255) NOT NULL,
    academic_supervisor_score_file VARCHAR(255) NOT NULL,
    certificate_file VARCHAR(255) NOT NULL,
    implementation_agreement_file VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_document_registration
        FOREIGN KEY (registration_id)
        REFERENCES internship_registrations(registration_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS lecturer_scores (
    lecturer_score_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    registration_id BIGINT NOT NULL UNIQUE,

    plo05_clo01_commitment DECIMAL(5,2) NOT NULL,
    plo07_clo02_planning DECIMAL(5,2) NOT NULL,
    plo05_clo04_guidance DECIMAL(5,2) NOT NULL,
    plo05_clo04_presentation DECIMAL(5,2) NOT NULL,
    plo05_clo04_report DECIMAL(5,2) NOT NULL,
    plo01_clo05_identification DECIMAL(5,2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_lecturer_score_registration
        FOREIGN KEY (registration_id)
        REFERENCES internship_registrations(registration_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mentor_otps (
    otp_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    registration_id BIGINT NOT NULL,

    otp_code VARCHAR(6) NOT NULL,
    expired_at DATETIME NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mentor_otp_registration
        FOREIGN KEY (registration_id)
        REFERENCES internship_registrations(registration_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mentor_sessions (
    mentor_session_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    registration_id BIGINT NOT NULL,

    session_token VARCHAR(255) NOT NULL,
    session_expired_at DATETIME NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mentor_session_registration
        FOREIGN KEY (registration_id)
        REFERENCES internship_registrations(registration_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mentor_scores (
    mentor_score_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    registration_id BIGINT NOT NULL UNIQUE,

    attendance DECIMAL(5,2) NOT NULL,
    discipline DECIMAL(5,2) NOT NULL,
    commitment DECIMAL(5,2) NOT NULL,
    planning DECIMAL(5,2) NOT NULL,
    teamwork DECIMAL(5,2) NOT NULL,
    guidance DECIMAL(5,2) NOT NULL,
    report DECIMAL(5,2) NOT NULL,
    problem_solving DECIMAL(5,2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_mentor_score_registration
        FOREIGN KEY (registration_id)
        REFERENCES internship_registrations(registration_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED DATA (menggunakan INSERT IGNORE — aman dijalankan berulang kali)
-- Password semua akun: password123
-- Hash: bcrypt cost 10
-- ─────────────────────────────────────────────────────────────────────────────

-- Mahasiswa
INSERT IGNORE INTO students (nim, student_name, class, email, password) VALUES
    ('12345678', 'Budi Santoso',  'IF-45-01', 'budi.santoso@student.telkomuniversity.ac.id',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy'),
    ('23456789', 'Siti Rahayu',   'IF-45-02', 'siti.rahayu@student.telkomuniversity.ac.id',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy'),
    ('34567890', 'Ahmad Fauzan',  'SI-45-01', 'ahmad.fauzan@student.telkomuniversity.ac.id',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy');

-- Dosen (Ditunda karena masih fokus service mahasiswa)
-- INSERT IGNORE INTO lecturers (nip, lecturer_name, password) VALUES ...

