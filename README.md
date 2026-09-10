<div align="center">

# Sistem Manajemen KPPM
### Telkom University Jakarta

**Platform terpadu untuk manajemen Kerja Praktik dan Proyek Mahasiswa (KPPM)**  
yang menghubungkan mahasiswa, dosen pembimbing, pembimbing lapangan, dan administrasi.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js)](https://nodejs.org/)
[![MariaDB](https://img.shields.io/badge/MariaDB-10.x-003545?logo=mariadb)](https://mariadb.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Fitur Utama](#fitur-utama)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Tech Stack](#tech-stack)
- [Prasyarat](#prasyarat)
- [Instalasi & Menjalankan Secara Lokal](#instalasi--menjalankan-secara-lokal)
- [Konfigurasi Environment Variables](#konfigurasi-environment-variables)
- [Migrasi Database](#migrasi-database)
- [Akun Default (Seed Data)](#akun-default-seed-data)
- [Struktur Proyek](#struktur-proyek)
- [API Reference](#api-reference)
- [Skema Database](#skema-database)
- [Alur Pengguna](#alur-pengguna)
- [Panduan Deployment](#panduan-deployment)
- [Kontribusi](#kontribusi)

---

## Tentang Proyek

Sistem Manajemen KPPM adalah aplikasi web full-stack yang dirancang untuk menyederhanakan seluruh proses administrasi Kerja Praktik dan Proyek Mahasiswa (KPPM) di Telkom University. Sistem ini menggantikan alur manual berbasis dokumen fisik dengan platform digital yang terintegrasi.

**Masalah yang Diselesaikan:**
- Pendaftaran KPPM yang sebelumnya manual kini bisa dilakukan secara online
- Penilaian dari Pembimbing Akademik (PA) dan Pembimbing Lapangan (PL) terpusat
- Admin dapat memantau seluruh status mahasiswa dalam satu dashboard
- Perhitungan nilai akhir otomatis berdasarkan formula: `PA (55%) + PL (45%)`

---

## Fitur Utama

### Mahasiswa

| Fitur | Deskripsi |
|---|---|
| Pendaftaran KPPM | Submit formulir pengajuan dengan upload Surat TOSS |
| Lihat Status Pengajuan | Pantau status pendaftaran secara real-time |
| Upload Dokumen Hasil KP | Upload sertifikat, scan penilaian, dan dokumen IA (opsional) |
| Lihat Nilai Akhir | Melihat nilai dari PA, PL, dan nilai akhir yang dihitung otomatis |
| Verifikasi Email (OTP) | Konfirmasi akun melalui kode OTP yang dikirim ke email kampus |
| Ganti Password | Ubah password dengan validasi kekuatan dan keamanan |
| Lupa Password | Reset password melalui OTP email |

### Dosen Pembimbing Akademik (PA)

| Fitur | Deskripsi |
|---|---|
| Dashboard Mahasiswa Bimbingan | Lihat semua mahasiswa yang ditugaskan |
| Input Nilai | Berikan nilai berdasarkan kriteria PLO/CLO yang terstandarisasi |
| Lihat Dokumen Hasil KP | Akses dokumen yang diunggah mahasiswa |
| Ganti Password | Pengaturan keamanan akun |

### Pembimbing Lapangan (Mentor Perusahaan)

| Fitur | Deskripsi |
|---|---|
| Login via OTP Email | Akses tanpa perlu membuat akun — cukup email terdaftar |
| Input Nilai | Berikan penilaian berdasarkan 8 kriteria kerja |
| Akses Otomatis Dicabut | Setelah mahasiswa upload hasil KP, akses mentor dihentikan |

### Admin / PIC KPPM

| Fitur | Deskripsi |
|---|---|
| Dashboard Statistik | Ringkasan jumlah pendaftaran, penilaian, dan status |
| Kelola Mahasiswa | Tambah, edit, aktifkan/nonaktifkan, assign dosen PA |
| Kelola Dosen | Tambah, edit, aktifkan/nonaktifkan dosen |
| Kelola Pengajuan | Lihat status dengan filter: Semua / Sudah Dinilai / Belum Dinilai / Belum Pengajuan |
| Injeksi Data Massal | Upload file CSV/XLSX untuk import data mahasiswa dan dosen |
| Kelola Semester | Tambah dan aktifkan/nonaktifkan periode semester |
| Unduh Nilai | Export nilai akhir seluruh mahasiswa per semester ke file XLSX |
| Ubah Password | Ganti password akun admin |

---

## Arsitektur Sistem

Sistem ini menggunakan arsitektur **Microservices** di sisi backend, di mana setiap layanan berjalan secara independen dan berkomunikasi melalui sebuah API Gateway terpusat.

```
┌─────────────────────────────────────────────┐
│           Browser / Client                  │
│         (Next.js — Port 3000)               │
└──────────────────┬──────────────────────────┘
                   │ HTTP Request
                   ▼
┌─────────────────────────────────────────────┐
│            API Gateway                      │
│            (Port 4000)                      │
│   • Rate Limiting                           │
│   • Request Proxying                        │
│   • Static File Serving (/uploads/*)        │
└────────┬──────────────┬───────────┬─────────┘
         │              │           │
    /auth/*         /student/*   /admin/*
         │              │           │
         ▼              ▼           ▼
┌──────────────┐ ┌───────────┐ ┌───────────┐
│ Auth Service │ │  Student  │ │  Admin    │
│  (Port 4001) │ │  Service  │ │  Service  │
│              │ │ (Port 4002│ │ (Port 4003│
│  • Login     │ │           │ │           │
│  • OTP       │ │ • KPPM    │ │ • Data    │
│  • JWT       │ │ • Grading │ │ • Export  │
│  • Reset PW  │ │ • Upload  │ │ • Stats   │
└──────────────┘ └─────┬─────┘ └─────┬─────┘
                       │             │
                       ▼             ▼
              ┌───────────────────────────┐
              │   MariaDB / MySQL         │
              │   internship_management   │
              └───────────────────────────┘
```

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| **Backend Services** | Node.js 20, Express.js, TypeScript |
| **Database** | MariaDB / MySQL |
| **Authentication** | JWT (JSON Web Token), bcryptjs |
| **OTP / Email** | Nodemailer (SMTP) |
| **File Upload** | Multer |
| **Data Export** | ExcelJS (XLSX), csv-parse |
| **Security** | express-rate-limit, CORS |

---

## Prasyarat

Pastikan perangkat Anda sudah menginstal semua dependensi berikut sebelum memulai:

- **Node.js** versi `20.x` atau lebih baru — [Download](https://nodejs.org/)
- **npm** versi `10.x` atau lebih baru (biasanya sudah terpaket bersama Node.js)
- **MariaDB** atau **MySQL** versi `10.x` / `8.x` yang sedang berjalan di lokal

Untuk memeriksa versi yang terinstal:
```bash
node --version
npm --version
mariadb --version
```

---

## Instalasi & Menjalankan Secara Lokal

### Langkah 1: Clone Repository

```bash
git clone https://github.com/ORGANISASI/KPPM-Telkom-University.git
cd KPPM-Telkom-University/web-kppm-telkom-university
```

### Langkah 2: Install Semua Dependensi

Install dependensi untuk setiap layanan (frontend dan 4 backend services):

```bash
# Frontend (Next.js)
npm install

# Backend Services
cd services/api-gateway && npm install && cd ../..
cd services/auth-service && npm install && cd ../..
cd services/admin-service && npm install && cd ../..
cd services/student-service && npm install && cd ../..
```

### Langkah 3: Konfigurasi Environment Variables

Buat file `.env` untuk setiap service (lihat bagian [Konfigurasi](#konfigurasi-environment-variables) di bawah).

### Langkah 4: Inisialisasi Database

```bash
# Pastikan MariaDB/MySQL sudah berjalan, lalu jalankan:
npm run db:migrate
```

Perintah ini akan membuat database, semua tabel, dan data awal (seed) secara otomatis.

### Langkah 5: Jalankan Semua Service

Buka **5 terminal terpisah** dan jalankan masing-masing:

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — API Gateway
cd services/api-gateway && npm run dev

# Terminal 3 — Auth Service
cd services/auth-service && npm run dev

# Terminal 4 — Admin Service
cd services/admin-service && npm run dev

# Terminal 5 — Student Service
cd services/student-service && npm run dev
```

Aplikasi akan dapat diakses di: **http://localhost:3000**

---

## Konfigurasi Environment Variables

Buat file `.env` di dalam setiap direktori service. Salin template di bawah ini dan isi nilainya.

### `services/auth-service/.env`

```env
# ─── Database ──────────────────────────────────────────────────────────────────
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password_database_anda
DB_NAME=internship_management

# ─── JWT ───────────────────────────────────────────────────────────────────────
JWT_SECRET=kunci_rahasia_jwt_yang_sangat_panjang_dan_acak
JWT_EXPIRES_IN=7d

# ─── SMTP (untuk OTP Email) ────────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alamat_email_pengirim@gmail.com
SMTP_PASS=app_password_gmail_anda

# ─── Server ────────────────────────────────────────────────────────────────────
PORT=4001
```

### `services/student-service/.env`

```env
# ─── Database ──────────────────────────────────────────────────────────────────
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password_database_anda
DB_NAME=internship_management

# ─── JWT ───────────────────────────────────────────────────────────────────────
JWT_SECRET=kunci_rahasia_jwt_yang_sangat_panjang_dan_acak

# ─── Server ────────────────────────────────────────────────────────────────────
PORT=4002
```

### `services/admin-service/.env`

```env
# ─── Database ──────────────────────────────────────────────────────────────────
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password_database_anda
DB_NAME=internship_management

# ─── JWT ───────────────────────────────────────────────────────────────────────
JWT_SECRET=kunci_rahasia_jwt_yang_sangat_panjang_dan_acak

# ─── Server ────────────────────────────────────────────────────────────────────
PORT=4003
```

### `services/api-gateway/.env` *(opsional)*

```env
PORT=4000
```

> **Penting:** Pastikan nilai `JWT_SECRET` **identik persis** di semua service agar token yang di-generate oleh auth-service dapat diverifikasi oleh service lainnya.

> **Tips Gmail:** Gunakan **App Password**, bukan password Gmail biasa. Aktifkan di: Google Account → Security → 2-Step Verification → App passwords.

---

## Migrasi Database

Proyek ini menyertakan script migrasi yang **aman dan idempoten** — dapat dijalankan berkali-kali tanpa menghapus data yang ada.

```bash
# Dari direktori root (web-kppm-telkom-university/)
npm run db:migrate
```

Script ini akan secara otomatis:
1. Membuat database `internship_management` (jika belum ada)
2. Membuat semua tabel yang diperlukan (jika belum ada)
3. Memasukkan akun admin default dengan password yang sudah di-hash (bcrypt)
4. Memasukkan data mahasiswa dan dosen contoh

---

## Akun Default (Seed Data)

Setelah migrasi berhasil, akun-akun berikut tersedia untuk pengujian:

### Admin

| Email | Password | Role |
|---|---|---|
| `admin@telkomuniversity.ac.id` | `Kp@Admin#IA0KN42025!` | Administrator |

### Mahasiswa (Password = NIM masing-masing)

| NIM | Nama | Kelas | Password |
|---|---|---|---|
| `1301213001` | Reynaldy Pratama | IF-46-01 | `1301213001` |
| `1301213002` | Budi Santoso | IF-46-02 | `1301213002` |
| `1301213003` | Siti Rahayu | SI-46-01 | `1301213003` |

### Dosen (Password = NIP masing-masing)

| NIP | Nama | Kode |
|---|---|---|
| `198001012005011001` | Dr. Bambang Supriyanto, M.T. | BBS |
| `198205152009121002` | Dra. Siti Aminah, M.Kom. | STA |
| `197803232003121003` | Ir. Hendra Kusuma, M.T., Ph.D. | HNK |

> **Keamanan:** Ganti semua password default ini segera setelah pertama kali masuk, terutama password admin.

---

## Struktur Proyek

```
web-kppm-telkom-university/
├── app/                          # Next.js App Router (Frontend)
│   ├── (admin)/                  # Route Group: Halaman Admin
│   │   ├── admin-login/          # Halaman login admin
│   │   └── admin/
│   │       ├── dashboard/        # Dashboard statistik
│   │       ├── pengajuan/        # Kelola pengajuan mahasiswa
│   │       ├── dosen/            # Kelola dosen
│   │       ├── mahasiswa/        # Kelola mahasiswa
│   │       ├── semester/         # Kelola semester
│   │       ├── injeksi/          # Import data CSV/XLSX
│   │       ├── unduh-nilai/      # Export nilai ke XLSX
│   │       └── ubah-password/    # Ubah password admin
│   ├── (auth)/                   # Route Group: Autentikasi
│   │   └── login/                # Halaman login mahasiswa/dosen
│   ├── (student-dashboard)/      # Route Group: Dashboard Mahasiswa
│   │   ├── dashboard/            # Dashboard utama mahasiswa
│   │   ├── isi-data-kppm/        # Form pendaftaran KPPM
│   │   ├── lihat-nilai/          # Halaman nilai mahasiswa
│   │   ├── upload-hasil-kp/      # Upload dokumen hasil KP
│   │   └── pengaturan/           # Profil & ganti password
│   ├── (lecturer-dashboard)/     # Route Group: Dashboard Dosen PA
│   └── (mentor-dashboard)/       # Route Group: Dashboard Mentor
│
├── components/                   # Komponen React yang dapat digunakan ulang
├── lib/
│   └── api.ts                    # Semua fungsi API client (fetch helper)
│
├── database/
│   ├── migration.sql             # Skema DDL SQL (untuk ERD & referensi)
│   └── migrate.js                # Script migrasi otomatis Node.js
│
├── services/                     # Backend Microservices
│   ├── api-gateway/              # Pintu masuk tunggal (Port 4000)
│   ├── auth-service/             # Autentikasi & OTP (Port 4001)
│   ├── student-service/          # Logika mahasiswa, dosen, mentor (Port 4002)
│   └── admin-service/            # Logika admin & laporan (Port 4003)
│
├── public/                       # Aset statis (gambar, ikon)
├── package.json                  # Dependensi frontend & script utama
└── next.config.ts                # Konfigurasi Next.js
```

---

## API Reference

Semua request dikirim melalui **API Gateway** di `http://localhost:4000`.

### Authentication (`/auth/*`)

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `POST` | `/auth/student/login` | Login mahasiswa | — |
| `POST` | `/auth/lecturer/login` | Login dosen | — |
| `POST` | `/auth/admin/login` | Login admin/PIC | — |
| `POST` | `/auth/mentor/send-otp` | Kirim OTP ke email mentor | — |
| `POST` | `/auth/mentor/verify-otp` | Verifikasi OTP mentor | — |
| `POST` | `/auth/student/send-verify-otp` | Kirim OTP verifikasi email mahasiswa | JWT |
| `POST` | `/auth/student/verify-email` | Verifikasi email mahasiswa | JWT |
| `PATCH` | `/auth/student/change-password` | Ganti password mahasiswa | JWT |
| `PATCH` | `/auth/lecturer/change-password` | Ganti password dosen | JWT |
| `PATCH` | `/auth/admin/change-password` | Ganti password admin | JWT Admin |
| `POST` | `/auth/forgot-password/send-otp` | Kirim OTP reset password | — |
| `POST` | `/auth/forgot-password/verify-reset` | Reset password dengan OTP | — |
| `POST` | `/auth/logout` | Logout semua role | JWT |

### Student Service (`/student/*`)

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/student/profile` | Ambil profil mahasiswa | JWT |
| `PATCH` | `/student/profile` | Update profil | JWT |
| `GET` | `/student/dashboard` | Data dashboard mahasiswa | JWT |
| `GET` | `/student/grades` | Lihat nilai akhir | JWT |
| `GET` | `/student/lecturers` | Daftar dosen PA | JWT |
| `GET` | `/student/semesters/active` | Daftar semester aktif | JWT |
| `POST` | `/student/kppm/register` | Submit pendaftaran KPPM | JWT |
| `GET` | `/student/kppm/registrations` | Riwayat pendaftaran | JWT |
| `GET` | `/student/kppm/registrations/:id` | Detail pendaftaran | JWT |
| `GET` | `/student/kppm/results` | Status eligibility upload | JWT |
| `POST` | `/student/kppm/results` | Upload dokumen hasil KP | JWT |
| `GET` | `/student/lecturer/students` | Mahasiswa bimbingan (dosen) | JWT Dosen |
| `POST` | `/student/lecturer/grades/:id` | Input nilai mahasiswa (dosen) | JWT Dosen |
| `GET` | `/student/mentor/dashboard` | Dashboard mentor | JWT Mentor |
| `POST` | `/student/mentor/grades/:id` | Input nilai (mentor) | JWT Mentor |

### Admin Service (`/admin/*`)

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/admin/stats` | Statistik dashboard | JWT Admin |
| `GET` | `/admin/students` | Daftar mahasiswa | JWT Admin |
| `GET` | `/admin/lecturers` | Daftar dosen | JWT Admin |
| `GET` | `/admin/semesters` | Daftar semester | JWT Admin |
| `POST` | `/admin/students/add` | Tambah mahasiswa | JWT Admin |
| `POST` | `/admin/lecturers/add` | Tambah dosen | JWT Admin |
| `POST` | `/admin/inject/students` | Import mahasiswa (CSV/XLSX) | JWT Admin |
| `POST` | `/admin/inject/lecturers` | Import dosen (CSV/XLSX) | JWT Admin |
| `PATCH` | `/admin/students/:nim` | Edit data mahasiswa | JWT Admin |
| `PATCH` | `/admin/lecturers/:nip` | Edit data dosen | JWT Admin |
| `PATCH` | `/admin/students/:nim/assign-lecturer` | Assign dosen PA ke mahasiswa | JWT Admin |
| `PATCH` | `/admin/semesters/:id/toggle-status` | Aktifkan/nonaktifkan semester | JWT Admin |
| `GET` | `/admin/registrations` | Daftar pengajuan per semester | JWT Admin |
| `GET` | `/admin/registrations/no-submission` | Mahasiswa belum mengajukan | JWT Admin |
| `GET` | `/admin/registrations/:id` | Detail pengajuan | JWT Admin |
| `GET` | `/admin/export/grades` | Export nilai ke XLSX | JWT Admin |

---

## Skema Database

Database `internship_management` memiliki **12 tabel** dengan relasi sebagai berikut:

```
students ──────────────────────────────┐
    │ nim (PK)                         │
    └──► internship_registrations      │
              │ registration_id (PK)   │
              │ nim (FK → students)    │
              │ lecturer_nip (FK)      │
              │                        │
              ├──► internship_documents│
              │      (sertifikat, dll) │
              │                        │
              ├──► lecturer_scores     │
              │      (nilai dosen PA)  │
              │                        │
              ├──► mentor_scores       │
              │      (nilai mentor)    │
              │                        │
              ├──► mentor_otps         │
              ├──► mentor_sessions     │
              └──► (status pengajuan)  │
                                       │
lecturers ─────────────────────────────┘
    │ nip (PK)
    └──► lecturer_otps
    └──► lecturer_scores (via registrations)

students
    └──► student_otps

admin_users (tabel terpisah untuk admin)
```

### Tabel Utama

| Tabel | Deskripsi |
|---|---|
| `students` | Data mahasiswa (NIM, nama, kelas, email, password) |
| `lecturers` | Data dosen PA (NIP, nama, kode, email, password) |
| `admin_users` | Data admin/PIC (email, password bcrypt) |
| `internship_registrations` | Rekaman pengajuan KPPM per mahasiswa per semester |
| `internship_documents` | File hasil KP yang diunggah mahasiswa |
| `lecturer_scores` | Penilaian dari Dosen PA (6 kriteria PLO/CLO) |
| `mentor_scores` | Penilaian dari Pembimbing Lapangan (8 kriteria) |
| `mentor_sessions` | Sesi login mentor berbasis OTP |
| `semester_codes` | Daftar kode semester yang dikelola admin |
| `student_otps` | OTP untuk verifikasi email dan reset password mahasiswa |
| `lecturer_otps` | OTP untuk verifikasi email dosen |
| `mentor_otps` | OTP untuk login mentor |



![Entity Relationship Diagram Sistem KPPM](./Entity%20Relationship%20Diagram%20KPPM.png)
---

## Alur Pengguna

### Alur Mahasiswa (End-to-End)

```
1. Login → 2. Verifikasi Email (OTP) → 3. Ganti Password Default
     |
4. Isi Data KPPM (Form + Upload Surat TOSS)
     |
5. [Otomatis disetujui] Status: Approved
     |
6. Tunggu penilaian dari:
   ├── Dosen PA (input nilai di dashboard dosen)
   └── Mentor Perusahaan (input nilai via OTP)
     |
7. Jika kedua nilai sudah ada → Halaman Upload Dokumen Terbuka
     |
8. Upload Dokumen Hasil KP (Sertifikat + Scan Penilaian)
     |
9. Lihat Nilai Akhir (PA 55% + PL 45%)
```

### Formula Nilai Akhir

```
Nilai PA    = Rata-rata bobot dari 6 kriteria PLO/CLO dosen PA
Nilai PL    = Rata-rata bobot dari 8 kriteria pembimbing lapangan
Nilai Akhir = (Nilai PA x 55%) + (Nilai PL x 45%)
```

---

## Panduan Deployment

> **Prasyarat Deployment:** Aplikasi ini memerlukan **VPS (Virtual Private Server)** karena menggunakan Node.js untuk backend. Shared hosting biasa (termasuk Hostinger Premium) tidak mendukung ini.

### Rekomendasi Platform
- **VPS:** Hostinger VPS, DigitalOcean Droplet, Vultr
- **Alternatif Terpisah:** Frontend di Vercel, Backend di Render/Railway, DB di PlanetScale

### Langkah Dasar di VPS Linux (Ubuntu 22.04)

#### 1. Install Dependensi Server

```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# MariaDB
sudo apt install mariadb-server -y
sudo mysql_secure_installation

# PM2 (Process Manager)
sudo npm install -g pm2

# Nginx (Web Server / Reverse Proxy)
sudo apt install nginx -y
```

#### 2. Upload Kode & Install Dependensi

```bash
git clone <url-repo> && cd web-kppm-telkom-university
npm install
cd services/api-gateway && npm install && cd ../..
cd services/auth-service && npm install && cd ../..
cd services/admin-service && npm install && cd ../..
cd services/student-service && npm install && cd ../..
```

#### 3. Buat File .env untuk Produksi

Buat file `.env` di setiap service dengan konfigurasi database server yang sesungguhnya.

#### 4. Inisialisasi Database & Build

```bash
npm run db:migrate

# Build semua TypeScript services
cd services/api-gateway && npm run build && cd ../..
cd services/auth-service && npm run build && cd ../..
cd services/admin-service && npm run build && cd ../..
cd services/student-service && npm run build && cd ../..

# Build Next.js
npm run build
```

#### 5. Jalankan dengan PM2

```bash
pm2 start services/api-gateway/dist/index.js    --name "api-gateway"
pm2 start services/auth-service/dist/index.js   --name "auth-service"
pm2 start services/admin-service/dist/index.js  --name "admin-service"
pm2 start services/student-service/dist/index.js --name "student-service"
pm2 start npm --name "frontend" -- start

pm2 save
pm2 startup
```

#### 6. Konfigurasi Nginx

Buat file konfigurasi Nginx agar domain publik diarahkan ke aplikasi:

```nginx
server {
    listen 80;
    server_name domain-anda.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api/ {
        proxy_pass http://localhost:4000;
    }
}
```

---

## Kontribusi

Kontribusi sangat diterima. Jika Anda ingin berkontribusi:

1. Fork repository ini
2. Buat branch fitur baru: `git checkout -b fitur/nama-fitur-anda`
3. Commit perubahan: `git commit -m 'feat: tambahkan fitur X'`
4. Push ke branch: `git push origin fitur/nama-fitur-anda`
5. Buat Pull Request

---

<div align="center">

Dikembangkan untuk **Telkom University Jakarta**

</div>