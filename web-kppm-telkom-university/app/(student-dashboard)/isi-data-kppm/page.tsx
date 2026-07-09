'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUser, StudentUser } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'list' | 'form' | 'success';

interface KpmmRegistration {
  id: number;
  tanggal_pengajuan: string;
  perusahaan: string;
  posisi: string;
  status: 'pending_approval' | 'approved' | 'rejected';
}

// ─── Mock Data (sementara, sebelum backend tersedia) ─────────────────────────

const MOCK_REGISTRATIONS: KpmmRegistration[] = [];

// ─── Icons ────────────────────────────────────────────────────────────────────

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M5 21V7l7-4 7 4v14" />
    <path d="M9 21V11h6v10" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const UploadCloudIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16,16 12,12 8,16" /><line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,6 5,6 21,6" /><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6" />
    <path d="M10,11v6M14,11v6M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2" />
  </svg>
);

const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" />
  </svg>
);

const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12,19 5,12 12,5" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

// ─── Loading Spinner ───────────────────────────────────────────────────────────

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full min-h-64">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-[#CC0000] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-gray-500 text-sm font-medium">Memuat data...</p>
    </div>
  </div>
);


// ─── Form Field Components ─────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  readOnly?: boolean;
  hint?: string;
  children: React.ReactNode;
}

const FormField = ({ label, required, readOnly, hint, children }: FieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
      {label}
      {required && <span className="text-[#CC0000]">*</span>}
      {readOnly && (
        <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full ml-1">
          <LockIcon /> Auto
        </span>
      )}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = ({ icon, className = '', ...props }: InputProps) => (
  <div className="relative">
    {icon && (
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        {icon}
      </span>
    )}
    <input
      className={`w-full h-10 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000] transition-all
        disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
        read-only:bg-gray-50 read-only:text-gray-600 read-only:cursor-default
        ${icon ? 'pl-9 pr-3' : 'px-3'}
        ${className}`}
      {...props}
    />
  </div>
);

interface SectionProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  color?: string;
}

const SectionHeader = ({ title, subtitle }: SectionProps) => (
  <div className="mb-5">
    <h2 className="text-sm font-bold text-gray-800">{title}</h2>
    {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function IsiDataKppmPage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('list');
  const [registrations, setRegistrations] = useState<KpmmRegistration[]>(MOCK_REGISTRATIONS);

  const [form, setForm] = useState({
    kodeSemester: '',
    whatsapp: '',
    perusahaan: '',
    posisiDivisi: '',
    tanggalMulai: '',
    tanggalAkhir: '',
    mentorName: '',
    mentorPosition: '',
    mentorEmail: '',
    mentorPhone: '',
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [listSearch, setListSearch] = useState('');
  const [listEntries, setListEntries] = useState(10);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }
    try {
      const userData = getUser();
      if (userData && userData.role === 'student') {
        setStudent(userData as StudentUser);
      } else {
        setError('Data mahasiswa tidak ditemukan. Silakan login ulang.');
      }
    } catch {
      setError('Tidak dapat memuat data profil mahasiswa.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFile = (file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      alert('Format file tidak didukung. Gunakan PDF, JPG, atau PNG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5 MB.');
      return;
    }
    setUploadedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const resetForm = () => {
    setForm({ kodeSemester: '', whatsapp: '', perusahaan: '', posisiDivisi: '', tanggalMulai: '', tanggalAkhir: '', mentorName: '', mentorPosition: '', mentorEmail: '', mentorPhone: '' });
    setUploadedFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Tambahkan ke list (mock, sebelum API tersedia)
    const newEntry: KpmmRegistration = {
      id: Date.now(),
      tanggal_pengajuan: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
      perusahaan: form.perusahaan,
      posisi: form.posisiDivisi,
      status: 'pending_approval',
    };
    setRegistrations((prev) => [newEntry, ...prev]);
    resetForm();
    setView('success');
  };

  const progress = (() => {
    const fields = [
      form.kodeSemester, form.whatsapp, form.perusahaan, form.posisiDivisi,
      form.tanggalMulai, form.tanggalAkhir, form.mentorName, form.mentorPosition,
      form.mentorEmail, form.mentorPhone, uploadedFile ? 'ok' : '',
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  })();

  // ── States ────────────────────────────────────────────────────────────────────

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-red-700 font-semibold mb-1">Koneksi Bermasalah</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#CC0000] text-white rounded-lg text-sm font-medium hover:bg-[#A30000] transition-colors"
          >
            <RefreshIcon />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // ── Success View ───────────────────────────────────────────────────────────

  if (view === 'success') {
    return (
      <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Pendaftaran Berhasil Dikirim</h1>
        <p className="text-gray-500 text-sm mb-6 max-w-sm">
          Data KP/Magang Anda telah dikirim dan sedang menunggu verifikasi dari pembimbing akademik.
        </p>
        <button
          onClick={() => setView('list')}
          className="px-5 py-2.5 bg-[#CC0000] text-white rounded-lg text-sm font-semibold hover:bg-[#A30000] transition-colors"
        >
          Kembali ke Daftar Pendaftaran
        </button>
      </div>
    );
  }

  // ── Form View ──────────────────────────────────────────────────────────────

  if (view === 'form') {
    return (
      <div className="p-5 md:p-6 max-w-4xl mx-auto">

        {/* Page Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { resetForm(); setView('list'); }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeftIcon />
              Kembali
            </button>
            <span className="text-gray-300">|</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Formulir Pendaftaran KP / Magang</h1>
              <p className="text-gray-500 text-sm mt-0.5">Lengkapi semua data sebelum mengirim</p>
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <span className="text-xs font-semibold text-gray-500">{progress}% lengkap</span>
            <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#16A34A' : '#CC0000' }}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* SECTION 1: Data Mahasiswa */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <SectionHeader
              icon={<UserIcon />}
              title="Data Mahasiswa"
              subtitle="Terisi otomatis berdasarkan profil akun Anda"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="NIM" readOnly>
                <Input id="field-nim" value={student?.nim ?? ''} readOnly icon={<LockIcon />} />
              </FormField>
              <FormField label="Nama Lengkap" readOnly>
                <Input id="field-nama" value={student?.name ?? ''} readOnly icon={<LockIcon />} />
              </FormField>
              <FormField label="Kelas" readOnly>
                <Input id="field-kelas" value={student?.class ?? ''} readOnly icon={<LockIcon />} />
              </FormField>
              <FormField label="Kode Semester" required hint="Contoh: 20242">
                <Input id="field-kode-semester" placeholder="20242" value={form.kodeSemester} onChange={(e) => handleChange('kodeSemester', e.target.value)} maxLength={5} />
              </FormField>
              <FormField label="Email" readOnly>
                <Input id="field-email" type="email" value={student?.email ?? ''} readOnly icon={<LockIcon />} />
              </FormField>
              <FormField label="No. WhatsApp" required hint="Format: 628xxxxxxxxxx">
                <Input id="field-whatsapp" placeholder="628123456789" value={form.whatsapp} onChange={(e) => handleChange('whatsapp', e.target.value)} type="tel" />
              </FormField>
            </div>
          </div>

          {/* SECTION 2: Data Perusahaan */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <SectionHeader
              icon={<BuildingIcon />}
              title="Data Tempat KP / Magang"
              subtitle="Informasi perusahaan atau instansi tempat Anda melaksanakan KP"
              color="#2563EB"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Perusahaan / Instansi Tempat KP" required>
                <Input id="field-perusahaan" placeholder="Contoh: PT. Telkom Indonesia" value={form.perusahaan} onChange={(e) => handleChange('perusahaan', e.target.value)} icon={<BuildingIcon />} />
              </FormField>
              <FormField label="Posisi / Divisi Penempatan KP" required>
                <Input id="field-posisi" placeholder="Contoh: Software Engineer Intern" value={form.posisiDivisi} onChange={(e) => handleChange('posisiDivisi', e.target.value)} />
              </FormField>
              <FormField label="Tanggal Mulai KP" required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><CalendarIcon /></span>
                  <input id="field-tanggal-mulai" type="date" value={form.tanggalMulai} onChange={(e) => handleChange('tanggalMulai', e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000] transition-all" />
                </div>
              </FormField>
              <FormField label="Tanggal Berakhir KP" required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><CalendarIcon /></span>
                  <input id="field-tanggal-akhir" type="date" value={form.tanggalAkhir} min={form.tanggalMulai} onChange={(e) => handleChange('tanggalAkhir', e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000] transition-all" />
                </div>
              </FormField>
            </div>
            {form.tanggalMulai && form.tanggalAkhir && new Date(form.tanggalAkhir) >= new Date(form.tanggalMulai) && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-xl px-4 py-2.5 border border-blue-100">
                <CalendarIcon />
                <span>Durasi KP: <strong className="text-blue-700">{Math.ceil((new Date(form.tanggalAkhir).getTime() - new Date(form.tanggalMulai).getTime()) / (1000 * 60 * 60 * 24))} hari</strong></span>
              </div>
            )}
          </div>

          {/* SECTION 3: Surat Pengantar TOSS */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <SectionHeader
              icon={<FileIcon />}
              title="Surat Pengantar TOSS"
              subtitle="Upload surat pengantar dari sistem TOSS (PDF / JPG / PNG, maks. 5 MB)"
              color="#D97706"
            />
            {!uploadedFile ? (
              <div
                id="drop-zone-toss"
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200
                  ${isDragging ? 'border-[#CC0000] bg-red-50 scale-[1.01]' : 'border-gray-200 bg-gray-50 hover:border-[#CC0000]/50 hover:bg-red-50/40'}`}
              >
                <div className={`transition-colors ${isDragging ? 'text-[#CC0000]' : 'text-gray-300'}`}><UploadCloudIcon /></div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">{isDragging ? 'Lepaskan file di sini...' : 'Drag & drop atau klik untuk upload'}</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — Maksimal 5 MB</p>
                </div>
                <span className="text-xs font-semibold text-[#CC0000] bg-red-50 border border-red-100 px-4 py-1.5 rounded-full">Pilih File</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0"><FileIcon /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(uploadedFile.size)}</p>
                </div>
                <button type="button" onClick={() => setUploadedFile(null)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><TrashIcon /></button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          </div>

          {/* SECTION 4: Pembimbing Lapang */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <SectionHeader
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              }
              title="Data Pembimbing Lapang / Mentor"
              subtitle="Pembimbing dari perusahaan atau instansi tempat KP"
              color="#7C3AED"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Nama Pembimbing Lapang / Mentor" required>
                <Input id="field-mentor-name" placeholder="Nama lengkap pembimbing" value={form.mentorName} onChange={(e) => handleChange('mentorName', e.target.value)} icon={<UserIcon />} />
              </FormField>
              <FormField label="Posisi / Jabatan Pembimbing" required>
                <Input id="field-mentor-position" placeholder="Contoh: Senior Software Engineer" value={form.mentorPosition} onChange={(e) => handleChange('mentorPosition', e.target.value)} />
              </FormField>
              <FormField label="Email Pembimbing" required>
                <Input id="field-mentor-email" type="email" placeholder="email@perusahaan.com" value={form.mentorEmail} onChange={(e) => handleChange('mentorEmail', e.target.value)} />
              </FormField>
              <FormField label="No. Telepon Pembimbing" required>
                <Input id="field-mentor-phone" type="tel" placeholder="628123456789" value={form.mentorPhone} onChange={(e) => handleChange('mentorPhone', e.target.value)} />
              </FormField>
            </div>
          </div>

          {/* SECTION 5: Pembimbing Akademik */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <SectionHeader
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              }
              title="Pembimbing Akademik"
              subtitle="Dosen pembimbing akademik dari Telkom University"
              color="#CC0000"
            />
            <div className="max-w-sm">
              <FormField label="Nama Pembimbing Akademik" readOnly hint="Ditetapkan oleh sistem">
                <Input id="field-pa" value="Akan ditentukan oleh sistem" readOnly icon={<LockIcon />} />
              </FormField>
            </div>
          </div>

          {/* Submit */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              <span className="text-[#CC0000]">*</span> Wajib diisi — Pastikan semua data sudah benar sebelum mengirim.
            </p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => { resetForm(); setView('list'); }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button id="btn-submit-form" type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#CC0000] text-white hover:bg-[#A30000] active:scale-95 transition-all shadow-sm flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9" />
                </svg>
                Kirim Pendaftaran
              </button>
            </div>
          </div>

        </form>
      </div>
    );
  }

  // ── List View (default) ────────────────────────────────────────────────────

  const statusConfig: Record<KpmmRegistration['status'], { text: string; bg: string; dot: string; text_color: string }> = {
    pending_approval: { text: 'Menunggu Verifikasi', bg: 'bg-amber-50',  dot: 'bg-amber-400', text_color: 'text-amber-700' },
    approved:         { text: 'Disetujui',           bg: 'bg-green-50',  dot: 'bg-green-500', text_color: 'text-green-700' },
    rejected:         { text: 'Ditolak',             bg: 'bg-red-50',    dot: 'bg-red-500',   text_color: 'text-red-700'   },
  };

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-bold text-gray-900">Pendaftaran KP / Magang</h1>
          <p className="text-xs text-gray-400 mt-0.5">Riwayat pengajuan KPPM Anda</p>
        </div>
        <nav className="text-xs text-gray-400 flex items-center gap-1.5">
          <span className="text-gray-500">Pendaftaran KP</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><polyline points="9,18 15,12 9,6" /></svg>
          <span className="text-[#CC0000] font-semibold">Daftar</span>
        </nav>
      </div>

      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>

        {/* Card Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: '#fafafa', borderBottom: '2px solid #ebebeb' }}>
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-[#CC0000]" />
            <span className="text-sm font-semibold text-gray-700">Daftar Pengajuan</span>
            {registrations.length > 0 && (
              <span className="text-xs font-semibold text-[#CC0000] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                {registrations.length}
              </span>
            )}
          </div>
          <button
            id="btn-ajukan-pendaftaran"
            onClick={() => setView('form')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#CC0000] text-white text-sm font-semibold rounded-lg hover:bg-[#A30000] transition-colors"
            style={{ boxShadow: '0 2px 6px rgba(180,0,0,0.2)' }}
          >
            <PlusIcon />
            Ajukan Pendaftaran
          </button>
        </div>

        {/* Show entries — digabung dengan thead agar tidak bikin section sendiri */}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f4f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest" style={{ borderRight: '1px solid #e5e7eb' }}>Tanggal Pengajuan</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest" style={{ borderRight: '1px solid #e5e7eb' }}>Status</th>
                <th className="text-right px-6 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-gray-400 font-normal">Tampilkan</span>
                    <select
                      value={listEntries}
                      onChange={(e) => setListEntries(Number(e.target.value))}
                      className="border border-gray-300 rounded px-1.5 py-0.5 text-xs text-gray-600 bg-white focus:outline-none"
                    >
                      {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span className="text-xs text-gray-400 font-normal">data</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      <p className="text-sm font-medium text-gray-400">Belum ada pengajuan</p>
                      <p className="text-xs text-gray-300">Klik tombol &quot;Ajukan Pendaftaran&quot; untuk memulai</p>
                    </div>
                  </td>
                </tr>
              ) : (
                registrations.slice(0, listEntries).map((reg, idx) => {
                  const s = statusConfig[reg.status];
                  return (
                    <tr
                      key={reg.id}
                      className="transition-colors hover:bg-red-50/30"
                      style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}
                    >
                      <td className="px-6 py-4" style={{ borderRight: '1px solid #f0f0f0' }}>
                        <span className="text-sm font-medium" style={{ color: '#374151' }}>{reg.tanggal_pengajuan}</span>
                      </td>
                      <td className="px-6 py-4" style={{ borderRight: '1px solid #f0f0f0' }}>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text_color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:border-[#CC0000]/50 hover:text-[#CC0000] px-3 py-1.5 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <EyeIcon />
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 flex items-center justify-between gap-3" style={{ background: '#f4f4f6', borderTop: '2px solid #e5e7eb' }}>
          <p className="text-xs text-gray-400">
            {registrations.length === 0
              ? 'Tidak ada data'
              : `Menampilkan ${Math.min(listEntries, registrations.length)} dari ${registrations.length} data`}
          </p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 text-xs text-gray-400 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-30 transition-colors" disabled>
              Sebelumnya
            </button>
            <button className="px-3 py-1 text-xs font-bold bg-[#CC0000] text-white rounded-lg">
              1
            </button>
            <button className="px-3 py-1 text-xs text-gray-400 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-30 transition-colors" disabled>
              Selanjutnya
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

