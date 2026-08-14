'use client';

import { useState, useEffect, useCallback } from 'react';
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

// ─── Document Button ───────────────────────────────────────────────────────────
function DocButton({ label, file }: { label: string; file: string | null }) {
  if (!file) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 text-xs">-</span>
    );
  }
  const url = `${API_BASE_URL}/uploads/${file}`;
  return (
    <div className="flex items-center gap-1">
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800">
        <EyeIcon /> Lihat
      </a>
      <a href={url} download
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
        <DownloadIcon />
      </a>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex py-2.5 border-b border-gray-100 dark:border-slate-800 last:border-0">
      <span className="text-gray-400 dark:text-slate-500 text-sm w-48 flex-shrink-0">{label}</span>
      <span className="text-gray-900 dark:text-slate-100 text-sm font-medium flex-1">{value || '-'}</span>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-800/60 border-y border-gray-100 dark:border-slate-700/60 mb-1">
      <span className="text-[#CC0000] dark:text-red-400">{icon}</span>
      <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">{title}</p>
    </div>
  );
}

function DetailModal({ item, onClose }: { item: LecturerKpResultItem; onClose: () => void }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#CC0000] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">Detail Hasil KP</h2>
            <p className="text-red-200 text-xs mt-0.5">{item.student_name} &mdash; {item.nim}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center">&times;</button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* Data Mahasiswa */}
          <SectionHeader
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
            title="Data Mahasiswa"
          />
          <div className="px-6">
            <InfoRow label="NIM"          value={item.nim} />
            <InfoRow label="Nama Lengkap" value={item.student_name} />
            <InfoRow label="Kelas"        value={item.student_class} />
            <InfoRow label="Email"        value={item.student_email} />
            <InfoRow label="No. WhatsApp" value={item.whatsapp_number} />
          </div>

          {/* Data KP / Magang */}
          <SectionHeader
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>}
            title="Data KP / Magang"
          />
          <div className="px-6">
            <InfoRow label="Perusahaan Tempat KP"  value={item.company_name} />
            <InfoRow label="Posisi / Divisi"       value={item.internship_position} />
            <InfoRow label="Durasi KP"             value={durasiStr} />
            <InfoRow label="Semester"              value={item.semester_code} />
          </div>

          {/* Pembimbing Lapang / Mentor */}
          <SectionHeader
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
            title="Pembimbing Lapang / Mentor"
          />
          <div className="px-6">
            <InfoRow label="Nama Pembimbing Lapang"  value={item.mentor_name} />
            <InfoRow label="Posisi / Jabatan"        value={item.mentor_position} />
            <InfoRow label="Email Pembimbing Lapang" value={item.mentor_email} />
            <InfoRow label="No. Telp Pembimbing"     value={item.mentor_phone} />
          </div>

          {/* Dokumen Hasil KP */}
          <SectionHeader
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><polyline points="9,15 11,17 15,13"/></svg>}
            title="Dokumen Hasil KP"
          />
          <div className="px-6 pb-6">
            {!hasDoc ? (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mt-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                <p className="text-amber-700 dark:text-amber-400 text-sm">Mahasiswa belum mengupload dokumen hasil KP.</p>
              </div>
            ) : (
              <div className="mt-1 space-y-1">
                {docs.map((doc, i) => (
                  <div key={doc.label} className={`flex items-center justify-between py-2.5 ${i < docs.length - 1 ? 'border-b border-gray-100 dark:border-slate-800' : ''}`}>
                    <p className="text-sm text-gray-700 dark:text-slate-300 truncate pr-2">{doc.label}</p>
                    <DocButton label={doc.label} file={doc.file} />
                  </div>
                ))}
                <p className="text-xs text-gray-400 dark:text-slate-500 pt-2">
                  Diupload: {fmtDate(item.uploaded_at)} &nbsp;&middot;&nbsp; Diperbarui: {fmtDate(item.updated_at)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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

  const filtered = data.filter(item => {
    const q = search.toLowerCase();
    const ms = !q || item.student_name.toLowerCase().includes(q) || item.nim.toLowerCase().includes(q) || item.company_name.toLowerCase().includes(q);
    const mf = filter === 'all' ? true : filter === 'uploaded' ? !!item.document_id : !item.document_id;
    return ms && mf;
  });

  const uploadedCount = data.filter(d => !!d.document_id).length;
  const pendingCount  = data.filter(d => !d.document_id).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb + Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1 text-sm">
          <span className="text-gray-400 dark:text-slate-500">Dosen PA</span>
          <span className="text-gray-300 dark:text-slate-600">/</span>
          <span className="text-gray-600 dark:text-slate-400 font-medium">Hasil KP</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Hasil KP Mahasiswa</h1>
        <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Dokumen hasil kerja praktik mahasiswa bimbingan Anda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Mahasiswa', value: data.length,    color: 'text-gray-900 dark:text-slate-100',     bg: 'bg-white dark:bg-slate-900',             border: 'border-gray-100 dark:border-slate-700/60' },
          { label: 'Sudah Upload',   value: uploadedCount,  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20',    border: 'border-emerald-100 dark:border-emerald-800/50' },
          { label: 'Belum Upload',   value: pendingCount,   color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20',        border: 'border-amber-100 dark:border-amber-800/50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border ${s.border}`} style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><SearchIcon /></span>
          <input type="text" placeholder="Cari nama, NIM, atau perusahaan..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 placeholder-gray-400" />
        </div>
        <div className="relative flex rounded-xl border border-gray-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-800 flex-shrink-0">
          <div
            className="absolute top-1 bottom-1 w-[116px] left-1 bg-[#CC0000] rounded-lg transition-transform duration-300 ease-out shadow-sm"
            style={{
              transform: `translateX(${
                filter === 'all' ? '0px' : filter === 'uploaded' ? '116px' : '232px'
              })`
            }}
          />
          {(['all', 'uploaded', 'pending'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`relative z-10 w-[116px] py-1.5 text-sm font-medium transition-colors rounded-lg ${
                filter === f ? 'text-white' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}>
              {f === 'all' ? 'Semua' : f === 'uploaded' ? 'Sudah Upload' : 'Belum Upload'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#CC0000] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500 dark:text-red-400">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-slate-500 text-sm">
          {search || filter !== 'all' ? 'Tidak ada mahasiswa yang sesuai filter.' : 'Belum ada mahasiswa KP yang disetujui.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const hasDoc = !!item.document_id;
            return (
              <div key={item.registration_id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700/60 p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {/* Avatar + Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#CC0000] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
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
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${hasDoc ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasDoc ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {hasDoc ? 'Sudah Upload' : 'Belum Upload'}
                  </span>
                  <button onClick={() => setSelected(item)}
                    className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-sm font-medium transition-colors border border-gray-200 dark:border-slate-700">
                    Detail
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
