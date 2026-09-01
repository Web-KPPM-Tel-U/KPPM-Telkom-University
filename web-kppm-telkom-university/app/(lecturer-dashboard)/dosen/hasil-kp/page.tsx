'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getLecturerKpResults } from '@/lib/api';
import type { LecturerKpResultItem } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" />
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
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ─── Uploaded Document Card ───────────────────────────────────────────────────
function CheckCircleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function UploadedDocCard({ label, filePath, optional, onView }: { label: string; filePath: string | null; optional?: boolean; onView?: (url: string, label: string) => void }) {
  const exists = !!filePath;
  const url = filePath ? `${API_BASE_URL}/uploads/${filePath}` : '';
  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${exists
      ? 'bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
      : 'bg-gray-50 dark:bg-slate-800/40 border-dashed border-gray-200 dark:border-slate-700'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${exists ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>
        {exists ? <CheckCircleIcon size={16} /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" /></svg>}
      </div>
      <p className={`text-sm font-medium flex-1 ${exists ? 'text-gray-800 dark:text-slate-100' : 'text-gray-400 dark:text-slate-500'}`}>
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

// ─── Custom Select ────────────────────────────────────────────────────────────
function CustomSelect({
  value,
  onChange,
  options,
  icon,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative w-full" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-[#CC0000]/50 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {icon}
          <span className="truncate">{selectedOption.label}</span>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </button>

      <div className={`absolute z-10 right-0 top-full mt-2 w-full min-w-[200px] bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden transition-all duration-200 origin-top-right ${isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
        <div className="py-1.5 p-1.5 flex flex-col gap-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${value === opt.value ? 'bg-[#CC0000]/10 text-[#CC0000] font-bold dark:bg-red-900/30 dark:text-red-400' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 font-medium'}`}
            >
              {opt.label}
              {value === opt.value && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-gray-50 dark:border-slate-700/60 last:border-0">
      <span className="w-44 flex-shrink-0 text-xs text-gray-400 dark:text-slate-500 leading-5">{label}</span>
      <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 dark:text-slate-100 break-words leading-5">{value || '-'}</span>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg mb-1">
      <span className="text-[#CC0000]">{icon}</span>
      <span className="text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-widest">{title}</span>
    </div>
  );
}

function DetailModal({ item, onClose }: { item: LecturerKpResultItem; onClose: () => void }) {
  const [activeDoc, setActiveDoc] = useState<{ url: string; label: string } | null>(null);
  const [fileError, setFileError] = useState(false);
  const isPdf = activeDoc?.url.toLowerCase().endsWith('.pdf');

  const hasDoc = !!item.document_id;
  const docs = [
    { label: 'Sertifikat / Surat Selesai', file: item.certificate_file },
    { label: 'Nilai Pembimbing Lapang', file: item.field_supervisor_score_file },
    { label: 'Nilai Pembimbing Akademik', file: item.academic_supervisor_score_file },
    { label: 'Surat Kesepakatan (Opsional)', file: item.implementation_agreement_file },
  ];

  const startDate = item.internship_start ? new Date(item.internship_start) : null;
  const endDate   = item.internship_end   ? new Date(item.internship_end)   : null;
  let durasiStr = '-';
  if (startDate && endDate) {
    const diffMs   = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months   = Math.floor(diffDays / 30);
    const days     = diffDays % 30;
    durasiStr = `${fmtDate(item.internship_start)} – ${fmtDate(item.internship_end)} (${months > 0 ? `${months} bulan ` : ''}${days} hari)`;
  }

  return (
    <>
      {/* ── Document Overlay ── */}
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
              ) : isPdf ? (
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

      <div className="space-y-6 max-w-4xl mx-auto mt-4 pb-12">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full bg-[#CC0000]" />
            <h2 className="text-sm font-bold text-gray-700 dark:text-slate-200">Keterangan Magang</h2>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {/* ── Data Mahasiswa ── */}
            <div className="pb-4">
              <SectionHeader
                title="Data Mahasiswa"
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
              />
              <InfoRow label="NIM"          value={item.nim} />
              <InfoRow label="Nama Lengkap" value={item.student_name} />
              <InfoRow label="Kelas"        value={item.student_class} />
              <InfoRow label="Email"        value={item.student_email} />
              <InfoRow label="No. WhatsApp" value={item.whatsapp_number} />
            </div>

            {/* ── Data KP / Magang ── */}
            <div className="py-4">
              <SectionHeader
                title="Data KP / Magang"
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>}
              />
              <InfoRow label="Perusahaan Tempat KP"  value={item.company_name} />
              <InfoRow label="Posisi / Divisi Penempatan" value={item.internship_position} />
              <InfoRow label="Durasi KP"             value={durasiStr} />
              <InfoRow label="Semester"              value={item.semester_code} />
            </div>

            {/* ── Pembimbing Lapang ── */}
            <div className="pt-4">
              <SectionHeader
                title="Pembimbing Lapang / Mentor"
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>}
              />
              <InfoRow label="Nama Pembimbing Lapang"  value={item.mentor_name} />
              <InfoRow label="Posisi / Jabatan"        value={item.mentor_position} />
              <InfoRow label="Email Pembimbing Lapang" value={item.mentor_email} />
              <InfoRow label="No. Telp Pembimbing Lapang" value={item.mentor_phone} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full bg-[#CC0000]" />
            <h2 className="text-sm font-bold text-gray-700 dark:text-slate-200">Dokumen yang Diupload</h2>
          </div>
          <div className="space-y-2.5">
            {!hasDoc ? (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mt-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                <p className="text-amber-700 dark:text-amber-400 text-sm">Mahasiswa belum mengupload dokumen hasil KP.</p>
              </div>
            ) : (
              <>
                <UploadedDocCard label="Sertifikat / Surat Selesai Magang"  filePath={item.certificate_file} onView={(url, lbl) => { setFileError(false); setActiveDoc({ url, label: lbl }); }} />
                <UploadedDocCard label="Scan Penilaian Pembimbing Lapang"   filePath={item.field_supervisor_score_file} onView={(url, lbl) => { setFileError(false); setActiveDoc({ url, label: lbl }); }} />
                <UploadedDocCard label="Scan Penilaian Pembimbing Akademik" filePath={item.academic_supervisor_score_file} onView={(url, lbl) => { setFileError(false); setActiveDoc({ url, label: lbl }); }} />
                <UploadedDocCard label="Dokumen IA" filePath={item.implementation_agreement_file} optional onView={(url, lbl) => { setFileError(false); setActiveDoc({ url, label: lbl }); }} />
                <p className="text-xs text-gray-400 dark:text-slate-500 pt-2">
                  Diupload: {fmtDate(item.uploaded_at)} &nbsp;&middot;&nbsp; Diperbarui: {fmtDate(item.updated_at)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HasilKPPage() {
  const router = useRouter();
  const [data, setData]         = useState<LecturerKpResultItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<'all' | 'uploaded' | 'pending'>('all');
  const [sortBy, setSortBy]     = useState<'name-asc' | 'name-desc' | 'nim-asc' | 'date-desc' | 'date-asc'>('name-asc');
  const [selected, setSelected] = useState<LecturerKpResultItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await getLecturerKpResults();
      if (res.success && res.data) setData(res.data);
      else setError(res.message || 'Gagal memuat data.');
    } catch { setError('Tidak dapat terhubung ke server.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    load();
  }, [load, router]);

  const processedData = useMemo(() => {
    let result = [...data];

    // Filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(item => 
        item.student_name.toLowerCase().includes(q) || 
        item.nim.toLowerCase().includes(q) || 
        item.company_name.toLowerCase().includes(q)
      );
    }

    if (filter !== 'all') {
      result = result.filter(item => filter === 'uploaded' ? !!item.document_id : !item.document_id);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.student_name.localeCompare(b.student_name);
      if (sortBy === 'name-desc') return b.student_name.localeCompare(a.student_name);
      if (sortBy === 'nim-asc') return a.nim.localeCompare(b.nim);
      if (sortBy === 'date-desc') {
        const da = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
        const db = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
        return db - da;
      }
      if (sortBy === 'date-asc') {
        const da = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
        const db = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
        return da - db;
      }
      return 0;
    });

    return result;
  }, [data, search, filter, sortBy]);

  const uploadedCount = data.filter(d => !!d.document_id).length;
  const pendingCount  = data.filter(d => !d.document_id).length;

  return (
    <>
      {selected && (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5">
          <nav className="flex text-sm font-medium mb-3" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-2">
              <li><span className="text-gray-500 dark:text-slate-400">Dosen PA</span></li>
              <li><span className="text-gray-400 dark:text-slate-500 mx-1">/</span></li>
              <li><span className="text-gray-500 dark:text-slate-400 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => setSelected(null)}>Hasil KP</span></li>
              <li><span className="text-gray-400 dark:text-slate-500 mx-1">/</span></li>
              <li><span className="text-gray-900 dark:text-slate-100 font-semibold">Detail Dokumen</span></li>
            </ol>
          </nav>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Kembali
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Detail Dokumen & Hasil</h1>
                <p className="text-gray-500 text-sm mt-0.5">{selected.student_name} — {selected.nim}</p>
              </div>
            </div>
          </div>
          <DetailModal item={selected} onClose={() => setSelected(null)} />
        </div>
      )}

      <div className={selected ? 'hidden' : 'p-5 md:p-8 max-w-6xl mx-auto space-y-6'}>
        {/* Breadcrumb + Title */}
      <div>
        <nav className="flex text-sm font-medium mb-3" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li>
              <span className="text-gray-500 dark:text-slate-400">Dosen PA</span>
            </li>
            <li>
              <span className="text-gray-400 dark:text-slate-500 mx-1">/</span>
            </li>
            <li>
              <span className="text-gray-900 dark:text-slate-100 font-semibold">Hasil KP</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">Daftar Hasil KP Mahasiswa</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Pantau dan ulas dokumen laporan, logbook, presentasi, dan penilaian dari mentor.
        </p>
      </div>

      {/* Stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {/* Card Total */}
          <div className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">Total Mahasiswa</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">{data.length}</span>
                  <span className="text-sm font-semibold text-gray-400 dark:text-slate-500">orang</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
            </div>
          </div>

          {/* Card Sudah Upload */}
          <div className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 dark:bg-green-900/20 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">Sudah Upload</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-green-600 dark:text-green-400 tracking-tight">{uploadedCount}</span>
                  <span className="text-sm font-semibold text-gray-400 dark:text-slate-500">orang</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
            </div>
          </div>

          {/* Card Belum Upload */}
          <div className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 dark:bg-amber-900/20 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">Belum Upload</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-amber-600 dark:text-amber-500 tracking-tight">{pendingCount}</span>
                  <span className="text-sm font-semibold text-gray-400 dark:text-slate-500">orang</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      {data.length > 0 && (
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><SearchIcon /></span>
            <input type="text" placeholder="Cari nama, NIM, atau perusahaan..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 transition-all" />
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3">
            <CustomSelect
              value={filter}
              onChange={(v) => setFilter(v as any)}
              icon={<svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>}
              options={[
                { value: 'all', label: 'Semua Status' },
                { value: 'uploaded', label: 'Sudah Upload' },
                { value: 'pending', label: 'Belum Upload' }
              ]}
            />
            <CustomSelect
              value={sortBy}
              onChange={(v) => setSortBy(v as any)}
              icon={<svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/></svg>}
              options={[
                { value: 'name-asc', label: 'Nama (A-Z)' },
                { value: 'name-desc', label: 'Nama (Z-A)' },
                { value: 'nim-asc', label: 'NIM (Kecil-Besar)' },
                { value: 'date-desc', label: 'Terbaru' },
                { value: 'date-asc', label: 'Terlama' }
              ]}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#CC0000] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500 dark:text-red-400">{error}</div>
      ) : processedData.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-6 sm:p-10 text-center">
          <div className="w-14 h-14 bg-purple-50 dark:bg-purple-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-slate-400 font-semibold text-sm">
            {search || filter !== 'all' ? 'Pencarian tidak ditemukan' : 'Belum ada mahasiswa KP yang disetujui'}
          </p>
          <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">
            {search || filter !== 'all' ? 'Coba ubah kata kunci atau filter status.' : 'Mahasiswa akan muncul di sini setelah pengajuan KPPM-nya disetujui.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {processedData.map(item => {
            const hasDoc = !!item.document_id;
            return (
              <div key={item.registration_id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700/60 p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {/* Avatar + Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#CC0000] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                    {getInitials(item.student_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">{item.student_name}</p>
                    <p className="text-gray-400 dark:text-slate-500 text-xs">{item.nim} &middot; {item.student_class}</p>
                  </div>
                </div>
                {/* Company */}
                <div className="flex-1 min-w-0 hidden sm:block">
                  <p className="text-sm text-gray-700 dark:text-slate-300 truncate font-medium">{item.company_name}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{item.internship_position}</p>
                </div>
                {/* Status + Action */}
                <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold ${hasDoc ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasDoc ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {hasDoc ? 'Sudah Upload' : 'Belum Upload'}
                  </span>
                  <button onClick={() => setSelected(item)}
                    className="px-3 py-1 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 text-[11px] sm:text-xs font-semibold shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-slate-700">
                    Detail
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      </div>
    </>
  );
}
