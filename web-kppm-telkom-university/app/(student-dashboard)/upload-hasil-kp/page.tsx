'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getKpResults, uploadKpResults } from '@/lib/api';
import type { KpResultsData, KpResultsDocuments } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileSlot {
  fieldName: string;
  label: string;
  required: boolean;
  description: string;
  file: File | null;
  error: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000';

// ─── Icon Components ──────────────────────────────────────────────────────────
function CheckCircleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function UploadCloudIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16,16 12,12 8,16" /><line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}

function AlertCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ─── Grade Status Badge ───────────────────────────────────────────────────────
function GradeStatusBadge({ done, label }: { done: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm ${done
      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'}`}>
      {done
        ? <CheckCircleIcon size={16} />
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
      }
      <span className="font-medium flex-1">{label}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${done ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}`}>
        {done ? 'Sudah Dinilai' : 'Menunggu'}
      </span>
    </div>
  );
}

// ─── File Drop Zone ───────────────────────────────────────────────────────────
function FileDropZone({ file, required, label, description, onFileChange, error }: {
  file: File | null; required: boolean; label: string; description: string;
  onFileChange: (f: File | null) => void; error: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFileChange(dropped);
  }, [onFileChange]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}
        {required ? <span className="text-[#CC0000] ml-1">*</span> : <span className="ml-2 text-xs font-normal text-gray-400">(Opsional)</span>}
      </label>
      <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`cursor-pointer border-2 border-dashed rounded-xl transition-all duration-200 ${isDragging ? 'border-[#CC0000] bg-red-50 dark:bg-red-900/10'
            : file ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-900/10'
              : error ? 'border-red-300 dark:border-red-800 bg-red-50/20'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-800/60'}`}
      >
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => onFileChange(e.target.files?.[0] ?? null)} />
        {file ? (
          <div className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{file.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatFileSize(file.size)}</p>
            </div>
            <button type="button" onClick={e => { e.stopPropagation(); onFileChange(null); if (inputRef.current) inputRef.current.value = ''; }} className="text-gray-400 hover:text-red-500 transition-colors">
              <XCircleIcon />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 px-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
              <UploadCloudIcon />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              <span className="font-semibold text-gray-700 dark:text-gray-200">Klik untuk pilih</span> atau drag &amp; drop
            </p>
            <p className="text-xs text-gray-400">PDF, JPG, PNG — maks. 5 MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">⚠ {error}</p>}
    </div>
  );
}

// ─── Uploaded Document Card ───────────────────────────────────────────────────
function UploadedDocCard({ label, filePath, optional, onView }: { label: string; filePath: string | null; optional?: boolean; onView?: (url: string, label: string) => void }) {
  const exists = !!filePath;
  const url = filePath ? `${API_BASE_URL}/uploads/${filePath}` : '';
  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${exists
      ? 'bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
      : 'bg-gray-50 dark:bg-gray-800/40 border-dashed border-gray-200 dark:border-gray-700'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${exists ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
        {exists ? <CheckCircleIcon size={16} /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" /></svg>}
      </div>
      <p className={`text-sm font-medium flex-1 ${exists ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
        {label}
        {optional && !exists && <span className="ml-1 text-xs text-gray-400 font-normal">(Tidak diupload)</span>}
      </p>
      {exists && filePath && (
        onView ? (
          <button type="button" onClick={() => onView(url, label)} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800">
            <EyeIcon /> Lihat
          </button>
        ) : (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800">
            <EyeIcon /> Lihat
          </a>
        )
      )}
    </div>
  );
}

// ─── Duration helper ─────────────────────────────────────────────────────────
function calcDuration(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days} hari`;
  const months = Math.floor(days / 30);
  const rem = days % 30;
  return rem > 0 ? `${months} bulan ${rem} hari` : `${months} bulan`;
}

// ─── Info Grid ────────────────────────────────────────────────────────────────
function InfoGrid({ reg }: { reg: NonNullable<KpResultsData['registration']> }) {

  // Satu baris: label kiri, value kanan
  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex gap-3 py-2.5 border-b border-gray-50 dark:border-gray-700/60 last:border-0">
      <span className="w-44 flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 leading-5">{label}</span>
      <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 dark:text-gray-100 break-words leading-5">{value || '-'}</span>
    </div>
  );

  // Header tiap seksi
  const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-1">
      <span className="text-[#CC0000]">{icon}</span>
      <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">{title}</span>
    </div>
  );

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">

      {/* ── Data Mahasiswa ── */}
      <div className="pb-4">
        <SectionHeader
          title="Data Mahasiswa"
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
        />
        <Row label="NIM" value={reg.student_nim} />
        <Row label="Nama Lengkap" value={reg.student_name} />
        <Row label="Kelas" value={reg.student_class} />
        <Row label="Email" value={reg.student_email ?? '-'} />
        <Row label="No. WhatsApp" value={reg.whatsapp_number} />
      </div>

      {/* ── Data KP / Magang ── */}
      <div className="py-4">
        <SectionHeader
          title="Data KP / Magang"
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>}
        />
        <Row label="Perusahaan Tempat KP" value={reg.company_name} />
        <Row label="Posisi / Divisi Penempatan" value={reg.internship_position} />
        <Row label="Durasi KP" value={`${fmtDate(reg.internship_start)} – ${fmtDate(reg.internship_end)} (${calcDuration(reg.internship_start, reg.internship_end)})`} />
        <Row label="Semester" value={reg.semester_code} />
      </div>

      {/* ── Pembimbing Lapang ── */}
      <div className="pt-4">
        <SectionHeader
          title="Pembimbing Lapang / Mentor"
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>}
        />
        <Row label="Nama Pembimbing Lapang" value={reg.mentor_name} />
        <Row label="Posisi / Jabatan" value={reg.mentor_position} />
        <Row label="Email Pembimbing Lapang" value={reg.mentor_email} />
        <Row label="No. Telp Pembimbing Lapang" value={reg.mentor_phone} />
      </div>

    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
function PageHeader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="mb-6">
      <nav className="flex text-sm font-medium mb-3" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          <li>
            <span className="text-gray-500 dark:text-slate-400">Mahasiswa</span>
          </li>
          <li>
            <span className="text-gray-400 dark:text-slate-500 mx-1">/</span>
          </li>
          <li>
            <span className="text-gray-900 dark:text-slate-100 font-semibold">Upload Hasil KP</span>
          </li>
        </ol>
      </nav>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Upload Hasil KP</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle ?? 'Unggah dokumen hasil kerja praktik Anda'}</p>
        </div>
        <nav className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
          <span className="text-gray-500 dark:text-gray-400">Pendaftaran KP</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><polyline points="9,18 15,12 9,6" /></svg>
          <span className="text-[#CC0000] font-semibold">Upload Hasil KP</span>
        </nav>
      </div>
    </div>
  );
}

// ─── Slot definitions ────────────────────────────────────────────────────────
const SLOT_DEFS: Omit<FileSlot, 'file' | 'error'>[] = [
  { fieldName: 'certificate_file', label: 'Sertifikat / Surat Selesai Magang', required: true, description: 'Sertifikat atau surat keterangan telah menyelesaikan magang dari perusahaan.' },
  { fieldName: 'field_supervisor_score_file', label: 'Scan Penilaian Pembimbing Lapang', required: true, description: 'Scan lembar penilaian yang ditandatangani pembimbing lapang perusahaan.' },
  { fieldName: 'academic_supervisor_score_file', label: 'Scan Penilaian Pembimbing Akademik', required: true, description: 'Scan lembar penilaian yang ditandatangani dosen pembimbing akademik.' },
  { fieldName: 'implementation_agreement_file', label: 'Dokumen IA (Implementation Agreement)', required: false, description: 'Implementation Agreement antara mahasiswa dan perusahaan. Bersifat opsional.' },
];

const makeSlots = (): FileSlot[] => SLOT_DEFS.map(s => ({ ...s, file: null, error: '' }));

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UploadHasilKpPage() {
  const router = useRouter();
  const [data, setData] = useState<KpResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [slots, setSlots] = useState<FileSlot[]>(makeSlots());
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState('');
  // view: 'overview' = halaman KP aktif | 'form' = form upload | 'done' = sukses
  const [view, setView] = useState<'overview' | 'form' | 'done'>('overview');
  const [activeDoc, setActiveDoc] = useState<{ url: string; label: string } | null>(null);
  const [fileError, setFileError] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await getKpResults();
      if (res.success && res.data) {
        setData(res.data);
        // Jika sudah ada dokumen sebelumnya, langsung ke overview (done ditampilkan di overview)
        setView('overview');
      } else {
        setFetchError(res.message || 'Gagal memuat data.');
      }
    } catch {
      setFetchError('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const setFile = (index: number, file: File | null) =>
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, file, error: '' } : s));

  const validate = (): boolean => {
    const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];
    const MAX = 5 * 1024 * 1024;
    let valid = true;
    setSlots(prev => prev.map(slot => {
      if (slot.required && !slot.file) { valid = false; return { ...slot, error: 'File ini wajib diupload.' }; }
      if (slot.file) {
        if (!ALLOWED.includes(slot.file.type)) { valid = false; return { ...slot, error: 'Format tidak valid. Gunakan PDF, JPG, atau PNG.' }; }
        if (slot.file.size > MAX) { valid = false; return { ...slot, error: 'Ukuran file melebihi batas 5 MB.' }; }
      }
      return { ...slot, error: '' };
    }));
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setUploading(true);
    setUploadProgress(0);
    const iv = setInterval(() => setUploadProgress(p => p < 85 ? p + Math.random() * 15 : p), 200);
    try {
      const fd = new FormData();
      slots.forEach(s => { if (s.file) fd.append(s.fieldName, s.file); });
      const res = await uploadKpResults(fd);
      clearInterval(iv);
      setUploadProgress(100);
      if (res.success) {
        setTimeout(() => { setSlots(makeSlots()); fetchData(); setView('done'); }, 500);
      } else {
        setSubmitError(res.message || 'Gagal mengupload dokumen.');
        setUploadProgress(0);
      }
    } catch {
      clearInterval(iv);
      setSubmitError('Tidak dapat terhubung ke server.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#CC0000] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Memuat data...</p>
      </div>
    </div>
  );

  // ─── Fetch Error ──────────────────────────────────────────────────────────
  if (fetchError) return (
    <div className="p-6 max-w-lg mx-auto mt-8">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
        <p className="text-red-700 dark:text-red-400 font-semibold mb-3">{fetchError}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-[#CC0000] text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">Coba Lagi</button>
      </div>
    </div>
  );

  const reg = data?.registration;
  const docs: KpResultsDocuments | null = data?.documents ?? null;

  // ─── Not Eligible (no registration) ──────────────────────────────────────
  if (!data?.registration) return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5">
      <PageHeader subtitle="Daftar KP aktif & upload dokumen" />
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          </div>
          <div>
            <p className="text-white font-bold text-base">Tidak Ada KP Aktif</p>
            <p className="text-amber-100 text-sm mt-0.5">Belum ada pendaftaran KPPM yang disetujui.</p>
          </div>
        </div>
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div className="text-amber-500 mt-0.5 flex-shrink-0"><AlertCircleIcon /></div>
            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
              Anda belum memiliki pendaftaran KPPM yang disetujui. Silakan ajukan pendaftaran terlebih dahulu melalui menu <strong>Isi Data KPPM</strong>.
            </p>
          </div>
          <button onClick={fetchData} className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,4 23,10 17,10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>
            Perbarui Status
          </button>
        </div>
      </div>
    </div>
  );

  // ─── OVERVIEW — KP Aktif ──────────────────────────────────────────────────
  if (view === 'overview') return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5">
      <PageHeader subtitle="Daftar KP aktif & upload dokumen" />

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">

        {/* ── Banner Header ── */}
        <div className="bg-gradient-to-r from-[#CC0000] to-red-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">KP Aktif</p>
              <p className="text-white font-bold text-base sm:text-lg leading-tight break-words">{reg!.company_name}</p>
              <p className="text-red-200 text-xs mt-0.5">{reg!.internship_position}</p>
            </div>
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0">{reg!.semester_code}</span>
          </div>
        </div>

        {/* ── Info Grid ── */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4">
            {[
              { label: 'NIM', value: reg!.student_nim },
              { label: 'Nama Mahasiswa', value: reg!.student_name },
              { label: 'Kelas', value: reg!.student_class },
              { label: 'Pembimbing Lapang', value: reg!.mentor_name },
              { label: 'Jabatan Mentor', value: reg!.mentor_position },
              { label: 'Dosen PA', value: reg!.dosen_name },
            ].map(({ label, value }) => (
              <div key={label} className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-sm text-gray-800 dark:text-gray-100 font-medium break-words">{value || '-'}</p>
              </div>
            ))}
          </div>

          {/* Periode */}
          <div className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-2.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <span>
              Periode: <strong className="text-gray-700 dark:text-gray-200">{fmtDate(reg!.internship_start)} – {fmtDate(reg!.internship_end)}</strong>
              <span className="ml-2 text-gray-400">({calcDuration(reg!.internship_start, reg!.internship_end)})</span>
            </span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-gray-100 dark:border-gray-700" />

        {/* ── Footer: Status kiri, Aksi kanan ── */}
        <div className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">

          {/* Status badges */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <GradeStatusBadge done={data!.grades_status?.mentor ?? false} label="Pembimbing Lapang" />
            <GradeStatusBadge done={data!.grades_status?.lecturer ?? false} label="Pembimbing Akademik" />
          </div>

          {/* Aksi */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            {docs && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 justify-start sm:justify-center mr-0 sm:mr-2">
                <CheckCircleIcon size={14} />
                <span className="whitespace-nowrap font-medium">Diupload {fmtDate(docs.updated_at)}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {docs && (
                <button
                  onClick={() => setView('done')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors whitespace-nowrap shadow-sm"
                >
                  <ExternalLinkIcon /> Lihat
                </button>
              )}
              {data!.eligible ? (
                <button
                  onClick={() => { setSlots(makeSlots()); setSubmitError(''); setUploadProgress(0); setView('form'); }}
                  className="flex-[2] sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-[#CC0000] hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-[0.99] whitespace-nowrap"
                >
                  <UploadCloudIcon /> {docs ? 'Upload Ulang' : 'Upload Dokumen'}
                </button>
              ) : (
                <button onClick={fetchData} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors whitespace-nowrap">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,4 23,10 17,10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>
                  Perbarui Status
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );


  // ─── DONE — Dokumen sudah diupload ───────────────────────────────────────
  if (view === 'done' && docs) return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5">
      {activeDoc && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => { setActiveDoc(null); setFileError(false); }}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ width: '90vw', maxWidth: 900, height: '88vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Viewer Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
                </svg>
                <span className="text-sm font-semibold text-gray-800">{activeDoc.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CC0000] border border-[#CC0000]/30 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Buka di Tab Baru
                </a>
                <button
                  onClick={() => { setActiveDoc(null); setFileError(false); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
            {/* Viewer Content */}
            <div className="flex-1 overflow-hidden bg-gray-100 relative">
              {fileError ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-400">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
                    <line x1="10" y1="13" x2="14" y2="17"/><line x1="14" y1="13" x2="10" y2="17"/>
                  </svg>
                  <p className="text-sm font-medium text-gray-400">File tidak ditemukan</p>
                  <p className="text-xs text-gray-300">Dokumen mungkin sudah dihapus atau tidak tersedia</p>
                </div>
              ) : activeDoc.url.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={activeDoc.url}
                  className="w-full h-full border-0"
                  title={activeDoc.label}
                  onLoad={(e) => {
                    try {
                      const doc = (e.target as HTMLIFrameElement).contentDocument;
                      const body = doc?.body?.innerText?.trim();
                      if (body && (body.startsWith('{') || body.startsWith('Route'))) {
                        setFileError(true);
                      }
                    } catch { /* cross-origin, aman */ }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={activeDoc.url}
                    alt={activeDoc.label}
                    className="max-w-full max-h-full object-contain rounded-lg shadow"
                    onError={() => setFileError(true)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <PageHeader subtitle="Daftar KP aktif & upload dokumen" />
      <div className="mb-5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 text-white">
          <CheckCircleIcon size={24} />
        </div>
        <div>
          <p className="text-white font-bold text-base">Dokumen Berhasil Diupload!</p>
          <p className="text-emerald-100 text-sm mt-0.5">Diunggah pada {fmtDate(docs.updated_at)}.</p>
        </div>
      </div>
      {reg && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full bg-[#CC0000]" />
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Keterangan Magang</h2>
          </div>
          <InfoGrid reg={reg} />
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-[#CC0000]" />
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Dokumen yang Diupload</h2>
        </div>
        <div className="space-y-2.5">
          <UploadedDocCard label="Sertifikat / Surat Selesai Magang"  filePath={docs.certificate_file} onView={(url, lbl) => { setFileError(false); setActiveDoc({ url, label: lbl }); }} />
          <UploadedDocCard label="Scan Penilaian Pembimbing Lapang"   filePath={docs.field_supervisor_score_file} onView={(url, lbl) => { setFileError(false); setActiveDoc({ url, label: lbl }); }} />
          <UploadedDocCard label="Scan Penilaian Pembimbing Akademik" filePath={docs.academic_supervisor_score_file} onView={(url, lbl) => { setFileError(false); setActiveDoc({ url, label: lbl }); }} />
          <UploadedDocCard label="Dokumen IA" filePath={docs.implementation_agreement_file} optional onView={(url, lbl) => { setFileError(false); setActiveDoc({ url, label: lbl }); }} />
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setView('overview')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
            Kembali
          </button>
          <button
            onClick={() => { setSlots(makeSlots()); setSubmitError(''); setUploadProgress(0); setView('form'); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-[#CC0000]/40 hover:text-[#CC0000] transition-all"
          >
            <UploadCloudIcon /> Upload Ulang
          </button>
        </div>
      </div>
    </div>
  );

  // ─── FORM Upload ──────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5">
      <PageHeader subtitle="Daftar KP aktif & upload dokumen" />

      {/* Back button */}
      <button
        onClick={() => setView('overview')}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-[#CC0000] transition-colors mb-4"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
        Kembali ke KP Aktif
      </button>

      <div className="mb-4 flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-400 font-medium">
        <CheckCircleIcon size={16} />
        Kedua pembimbing sudah memberikan nilai — Anda dapat mengupload dokumen hasil KP.
      </div>

      {/* Keterangan Magang */}
      {reg && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full bg-[#CC0000]" />
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Keterangan Magang</h2>
          </div>
          <InfoGrid reg={reg} />
        </div>
      )}

      {/* Form Upload */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-4 rounded-full bg-[#CC0000]" />
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Lampiran Dokumen</h2>
          </div>
          <div className="space-y-6">
            {slots.map((slot, i) => (
              <div key={slot.fieldName}>
                {i > 0 && <div className="border-t border-gray-100 dark:border-gray-700 mb-6" />}
                <FileDropZone
                  file={slot.file}
                  required={slot.required}
                  label={slot.label}
                  description={slot.description}
                  onFileChange={f => setFile(i, f)}
                  error={slot.error}
                />
              </div>
            ))}
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="mt-5 flex items-center gap-2 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="text-red-500 flex-shrink-0"><AlertCircleIcon /></div>
              <p className="text-sm text-red-700 dark:text-red-400">{submitError}</p>
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Mengupload dokumen...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#CC0000] to-red-400 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className={`mt-6 w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${uploading
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-[#CC0000] hover:bg-red-700 active:scale-[0.99] text-white shadow-sm hover:shadow-md'}`}
          >
            {uploading
              ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" /> Mengupload...</>
              : <><UploadCloudIcon /> Upload Dokumen Hasil KP</>
            }
          </button>
          <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
            File bertanda <span className="text-[#CC0000]">*</span> wajib dilampirkan. Maks. 5 MB per file.
          </p>
        </div>
      </form>
    </div>
  );
}
