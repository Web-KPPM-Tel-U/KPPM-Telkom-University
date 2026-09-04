'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getAdminRegistrations,
  getAdminRegistrationDetail,
  updateAdminRegistrationSemester,
  getAdminSemesters,
  getStudentsWithoutRegistration,
} from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegistrationRow {
  nim: string;
  student_name: string;
  class: string;
  registration_id: number | null;
  semester_code: string;
  status: string;
  company_name: string | null;
  submitted_at: string | null;
  has_lecturer_score: number;
  has_mentor_score: number;
  pa_total: string | null;
  pl_total: string | null;
}

interface UnregisteredStudent {
  nim: string;
  student_name: string;
  class: string;
  email?: string;
}

interface RegistrationDetail {
  registration_id: number;
  nim: string;
  student_name: string;
  student_class: string;
  student_email: string | null;
  lecturer_nip: string;
  lecturer_name: string | null;
  lecturer_code: string | null;
  lecturer_email: string | null;
  semester_code: string;
  status: string;
  company_name: string;
  internship_position: string;
  internship_start: string;
  internship_end: string;
  mentor_name: string;
  mentor_email: string;
  submitted_at: string;
  lecturer_score_total: string | null;
  mentor_score_total: string | null;
  combined_total: string | null;
  has_lecturer_score: boolean;
  has_mentor_score: boolean;
}

interface Semester {
  semester_id: number;
  code: string;
  label: string;
  is_active: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  belum_daftar:     { label: 'Belum Daftar',     color: '#6B7280', bg: '#F3F4F6' },
  pending_approval: { label: 'Menunggu Review',  color: '#D97706', bg: '#FEF3C7' },
  approved:         { label: 'Disetujui',         color: '#16A34A', bg: '#DCFCE7' },
  cancelled:        { label: 'Dibatalkan',        color: '#6B7280', bg: '#F3F4F6' },
  rejected:         { label: 'Ditolak',           color: '#DC2626', bg: '#FEE2E2' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['belum_daftar'];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

function ScoreBadge({ hasScore, score, small }: { hasScore: boolean; score?: string | null; small?: boolean }) {
  if (hasScore && score) {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-lg ${
        small ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
      } bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-mono`}>
        {score}
      </span>
    );
  }
  return (
    <span className={`text-gray-500 dark:text-slate-400 font-mono font-bold select-none ${small ? 'text-[10px]' : 'text-base'}`}>
      —
    </span>
  );
}

function formatDate(d: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PengajuanKPPMPage() {
  const [semesters, setSemesters]               = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [search, setSearch]                     = useState('');
  const [rows, setRows]                         = useState<RegistrationRow[]>([]);
  const [total, setTotal]                       = useState(0);
  const [page, setPage]                         = useState(0);
  const [filterScore, setFilterScore]           = useState<'all' | 'scored' | 'unscored' | 'unregistered'>('all');
  const [unregisteredRows, setUnregisteredRows] = useState<UnregisteredStudent[]>([]);
  const [unregisteredTotal, setUnregisteredTotal] = useState(0);
  const limit = 20;

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Detail modal
  const [detail, setDetail]           = useState<RegistrationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail]   = useState(false);

  // Edit semester modal
  const [showEdit, setShowEdit]       = useState(false);
  const [newSemester, setNewSemester] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg]         = useState('');
  const [editSuccess, setEditSuccess] = useState(false);

  // Load semesters
  useEffect(() => {
    getAdminSemesters().then(r => {
      if (r.success && Array.isArray(r.data)) {
        setSemesters(r.data as Semester[]);
        const active = (r.data as Semester[]).find(s => s.is_active);
        if (active) setSelectedSemester(active.code);
      }
    });
  }, []);

  // Load registrations
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAdminRegistrations({
        semester_code: selectedSemester,
        search,
        limit,
        offset: page * limit,
      });
      if (res.success && Array.isArray(res.data)) {
        setRows(res.data as RegistrationRow[]);
        setTotal((res as any).meta?.total ?? res.data.length);
      } else {
        setError(res.message || 'Gagal memuat data.');
      }
    } catch {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  }, [selectedSemester, search, page]);

  useEffect(() => { loadData(); }, [loadData]);

  // Load mahasiswa belum mengajukan
  const loadUnregistered = useCallback(async () => {
    if (!selectedSemester) { setUnregisteredRows([]); setUnregisteredTotal(0); return; }
    setLoading(true);
    setError('');
    try {
      const res = await getStudentsWithoutRegistration({
        semester_code: selectedSemester,
        search,
        limit,
        offset: page * limit,
      });
      if (res.success && Array.isArray(res.data)) {
        setUnregisteredRows(res.data as UnregisteredStudent[]);
        setUnregisteredTotal((res as any).meta?.total ?? res.data.length);
      } else {
        setError(res.message || 'Gagal memuat data.');
      }
    } catch {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  }, [selectedSemester, search, page]);

  useEffect(() => {
    if (filterScore === 'unregistered') {
      loadUnregistered();
    } else {
      setUnregisteredRows([]);
      setUnregisteredTotal(0);
    }
  }, [filterScore, loadUnregistered]);

  // Load detail
  const openDetail = async (id: number) => {
    setShowDetail(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await getAdminRegistrationDetail(id);
      if (res.success && res.data) setDetail(res.data as RegistrationDetail);
    } finally {
      setDetailLoading(false);
    }
  };

  // Edit semester submit
  const handleEditSemester = async () => {
    if (!detail || !newSemester) return;
    setEditLoading(true);
    setEditMsg('');
    setEditSuccess(false);
    try {
      const res = await updateAdminRegistrationSemester(detail.registration_id, newSemester);
      if (res.success) {
        setEditSuccess(true);
        setEditMsg(res.message || 'Semester berhasil diubah.');
        // Refresh data
        loadData();
        // Update detail state
        setDetail(prev => prev ? { ...prev, semester_code: newSemester } : prev);
      } else {
        setEditMsg(res.message || 'Gagal mengubah semester.');
      }
    } catch {
      setEditMsg('Terjadi kesalahan koneksi.');
    } finally {
      setEditLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  // Objek semester yang sedang dipilih (untuk indikator status)
  const selectedSemesterObj = semesters.find(s => s.code === selectedSemester) ?? null;

  // ── Filter skor (client-side) ───────────────────────────────────────────────
  const filteredRows = rows.filter(r => {
    if (filterScore === 'scored')   return !!r.has_lecturer_score && !!r.has_mentor_score;
    if (filterScore === 'unscored') return !r.has_lecturer_score || !r.has_mentor_score;
    return true;
  });
  const filteredTotal = filterScore === 'unregistered' ? unregisteredTotal
    : filterScore === 'all' ? total
    : filteredRows.length;

  return (
    <div className="p-4 sm:p-6 space-y-5 min-h-full">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
            Pengajuan KPPM
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Monitor seluruh pengajuan mahasiswa berdasarkan kode semester
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
            Total:
          </span>
          <span className="text-sm font-bold text-[#CC0000]">{filteredTotal} mahasiswa</span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        {/* Semester selector */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Kode Semester
          </label>
          <select
            id="select-semester"
            value={selectedSemester}
            onChange={e => { setSelectedSemester(e.target.value); setPage(0); }}
            className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000]"
          >
            <option value="">-- Semua Pengajuan --</option>
            {semesters.map(s => (
              <option key={s.semester_id} value={s.code}>
                {s.code} {s.label}
              </option>
            ))}
          </select>

          {/* Indikator status semester yang dipilih */}
          {selectedSemesterObj && (
            <div className="mt-2 flex items-center gap-2">
              {selectedSemesterObj.is_active ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Semester Aktif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  Semester Tidak Aktif
                </span>
              )}
              <span className="text-xs text-gray-400 dark:text-slate-500">{selectedSemesterObj.label}</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Cari Mahasiswa
          </label>
          <input
            id="input-search-mahasiswa"
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Nama atau NIM..."
            className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] placeholder-gray-400 dark:placeholder-slate-500"
          />
        </div>

        {/* Status Nilai Filter */}
        <div className="flex-1 sm:max-w-[220px]">
          <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Filter Mahasiswa
          </label>
          <select
            id="select-filter-score"
            value={filterScore}
            onChange={e => { setFilterScore(e.target.value as 'all' | 'scored' | 'unscored' | 'unregistered'); setPage(0); }}
            className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000]"
          >
            <option value="all">Semua Pengajuan</option>
            <option value="scored">Sudah Dinilai</option>
            <option value="unscored">Belum Dinilai</option>
            <option value="unregistered">Belum Pengajuan</option>
          </select>
          {/* Badge jumlah hasil filter */}
          {filterScore !== 'all' && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                filterScore === 'scored'       ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                : filterScore === 'unregistered' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}>
                {filteredTotal} mahasiswa
              </span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500">
                {filterScore === 'scored' ? 'sudah dinilai' : filterScore === 'unregistered' ? 'belum mengajukan' : 'belum dinilai'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {error && (
          <div className="m-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-8 h-8 border-2 border-[#CC0000]/30 border-t-[#CC0000] rounded-full animate-spin" />
            <span className="text-sm text-gray-400 dark:text-slate-500">Memuat data...</span>
          </div>
        ) : filterScore === 'unregistered' ? (
          /* ── Tabel Belum Pengajuan ── */
          unregisteredRows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              <p className="text-sm font-semibold text-gray-400 dark:text-slate-500">Semua mahasiswa sudah mengajukan</p>
              <p className="text-xs text-gray-300 dark:text-slate-600">
                {!selectedSemester ? 'Pilih semester terlebih dahulu' : 'Tidak ada mahasiswa yang belum mengajukan di semester ini'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile card */}
              <div className="lg:hidden divide-y divide-gray-100 dark:divide-slate-800">
                {unregisteredRows.map((row, idx) => (
                  <div key={`unreg-${row.nim}-${idx}`} className="p-4 hover:bg-gray-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-start gap-2.5">
                      <span className="text-xs text-gray-400 dark:text-slate-500 font-mono mt-0.5 flex-shrink-0">{page * limit + idx + 1}.</span>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{row.student_name}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 font-mono mt-0.5">{row.nim}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-gray-400 dark:text-slate-500">{row.class}</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                            Belum Mengajukan
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-800/60">
                    <tr>
                      <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap w-10">No</th>
                      <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Nama Mahasiswa</th>
                      <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">NIM</th>
                      <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Kelas</th>
                      <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800/80">
                    {unregisteredRows.map((row, idx) => (
                      <tr key={`unreg-${row.nim}-${idx}`} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3.5 text-gray-400 dark:text-slate-500 text-xs font-mono">{page * limit + idx + 1}</td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.student_name}</p>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-gray-600 dark:text-slate-300 whitespace-nowrap">{row.nim}</td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">{row.class}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                            Belum Mengajukan
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-semibold text-gray-400 dark:text-slate-500">Tidak ada data</p>
            <p className="text-xs text-gray-300 dark:text-slate-600">
              {filterScore !== 'all'
                ? `Tidak ada mahasiswa yang ${filterScore === 'scored' ? 'sudah dinilai' : 'belum dinilai'} pada semester ini`
                : 'Pilih semester atau ubah kata kunci pencarian'}
            </p>
          </div>
        ) : (
          <>
            {/* ── Mobile & Tablet Card View (hidden on lg+) ── */}
            <div className="lg:hidden divide-y divide-gray-100 dark:divide-slate-800">
              {filteredRows.map((row, idx) => (
                <div key={`${row.nim}-${idx}`} className="p-4 hover:bg-gray-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Top: nomor + nama */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-xs text-gray-400 dark:text-slate-500 font-mono mt-0.5 flex-shrink-0 whitespace-nowrap min-w-[1.5rem] text-right">
                        {page * limit + idx + 1}.
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{row.student_name}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 font-mono mt-0.5">{row.nim}</p>
                      </div>
                    </div>
                    {row.registration_id ? (
                      <button
                        id={`btn-detail-card-${row.registration_id}`}
                        onClick={() => openDetail(row.registration_id!)}
                        className="flex-shrink-0 px-3 py-1.5 text-xs font-bold text-[#CC0000] border border-[#CC0000]/30 hover:bg-[#CC0000] hover:text-white rounded-lg transition-all duration-150"
                      >
                        Detail
                      </button>
                    ) : null}
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-2 ml-7">
                    <span className="text-xs text-gray-400 dark:text-slate-500">{row.class}</span>
                    <span className="text-gray-200 dark:text-slate-700">·</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-mono">
                      {row.semester_code}
                    </span>
                    <span className="text-gray-200 dark:text-slate-700">·</span>
                    <StatusBadge status={row.status} />
                    <span className="text-gray-200 dark:text-slate-700">·</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500">
                      PA: <ScoreBadge hasScore={!!row.has_lecturer_score} score={row.pa_total} small />
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500">
                      PL: <ScoreBadge hasScore={!!row.has_mentor_score} score={row.pl_total} small />
                    </span>
                    {row.submitted_at && (
                      <>
                        <span className="text-gray-200 dark:text-slate-700">·</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500">{formatDate(row.submitted_at)}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Desktop Table View (hidden below lg) ── */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">No</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Nama Mahasiswa</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">NIM</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Kelas</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Kode Semester</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Nilai PA</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Nilai PL</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Tanggal Pengajuan</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/80">
                  {filteredRows.map((row, idx) => (
                    <tr key={`${row.nim}-${idx}`} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5 text-gray-400 dark:text-slate-500 text-xs font-mono whitespace-nowrap">
                        {page * limit + idx + 1}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.student_name}</p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-600 dark:text-slate-300 whitespace-nowrap">{row.nim}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">{row.class}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-mono">
                          {row.semester_code}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <ScoreBadge hasScore={!!row.has_lecturer_score} score={row.pa_total} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <ScoreBadge hasScore={!!row.has_mentor_score} score={row.pl_total} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">
                        {formatDate(row.submitted_at)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {row.registration_id ? (
                          <button
                            id={`btn-detail-${row.registration_id}`}
                            onClick={() => openDetail(row.registration_id!)}
                            className="px-3 py-1.5 text-xs font-bold text-[#CC0000] border border-[#CC0000]/30 hover:bg-[#CC0000] hover:text-white rounded-lg transition-all duration-150"
                          >
                            Detail
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300 dark:text-slate-600 italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3.5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-gray-400 dark:text-slate-500">
              Halaman {page + 1} dari {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-slate-300"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-slate-300"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {showDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowDetail(false); }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-2xl">
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white">Detail Pengajuan KPPM</h2>
                {detail && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">ID: #{detail.registration_id}</p>
                )}
              </div>
              <button
                id="btn-close-detail"
                onClick={() => { setShowDetail(false); setShowEdit(false); setEditMsg(''); }}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {detailLoading ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <div className="w-8 h-8 border-2 border-[#CC0000]/30 border-t-[#CC0000] rounded-full animate-spin" />
                <p className="text-sm text-gray-400 dark:text-slate-500">Memuat detail...</p>
              </div>
            ) : detail ? (
              <div className="px-6 py-5 space-y-5">

                {/* Info Mahasiswa */}
                <Section title="Informasi Mahasiswa">
                  <Row label="Nama"  value={detail.student_name} />
                  <Row label="NIM"   value={detail.nim} mono />
                  <Row label="Kelas" value={detail.student_class} />
                  <Row label="Email" value={detail.student_email || '—'} />
                </Section>

                {/* Info Dosen */}
                <Section title="Dosen Pembimbing Akademik">
                  <Row label="Nama"       value={detail.lecturer_name || '—'} />
                  <Row label="NIP"        value={detail.lecturer_nip} mono />
                  <Row label="Kode Dosen" value={detail.lecturer_code || '—'} mono />
                  <Row label="Email"      value={detail.lecturer_email || '—'} />
                </Section>

                {/* Info Magang */}
                <Section title="Informasi KPPM">
                  <Row label="Perusahaan"    value={detail.company_name} />
                  <Row label="Posisi"        value={detail.internship_position} />
                  <Row label="Mulai"         value={formatDate(detail.internship_start)} />
                  <Row label="Selesai"       value={formatDate(detail.internship_end)} />
                  <Row label="Mentor"        value={detail.mentor_name} />
                  <Row label="Email Mentor"  value={detail.mentor_email} />
                  <Row label="Kode Semester" value={detail.semester_code} mono />
                  <Row label="Status">
                    <StatusBadge status={detail.status} />
                  </Row>
                  <Row label="Tanggal Pengajuan" value={formatDate(detail.submitted_at)} />
                </Section>

                {/* Nilai */}
                <Section title="Nilai">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <ScoreCard
                      label="Nilai Dosen (Rata-rata)"
                      value={detail.lecturer_score_total}
                      hasValue={detail.has_lecturer_score}
                    />
                    <ScoreCard
                      label="Nilai Mentor (Rata-rata)"
                      value={detail.mentor_score_total}
                      hasValue={detail.has_mentor_score}
                    />
                  </div>

                  {/* Akumulasi total — hanya tampil jika keduanya sudah ada nilai */}
                  {detail.has_lecturer_score && detail.has_mentor_score && detail.lecturer_score_total && detail.mentor_score_total && (() => {
                    const pa    = parseFloat(detail.lecturer_score_total);
                    const pl    = parseFloat(detail.mentor_score_total);
                    const total = detail.combined_total ?? (pa + pl).toFixed(2);
                    return (
                      <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-4">
                        <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center">
                          Akumulasi Total Nilai
                        </p>
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* PA */}
                          <div className="flex-1 bg-gray-50 dark:bg-slate-800/60 rounded-xl p-3 text-center">
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 mb-1">Nilai PA</p>
                            <p className="text-xl font-black text-gray-700 dark:text-slate-200">{pa.toFixed(2)}</p>
                            <p className="text-[9px] text-gray-300 dark:text-slate-600 mt-0.5">bobot 55%</p>
                          </div>

                          {/* Plus */}
                          <div className="flex-shrink-0 text-gray-300 dark:text-slate-600">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                          </div>

                          {/* Mentor */}
                          <div className="flex-1 bg-gray-50 dark:bg-slate-800/60 rounded-xl p-3 text-center">
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 mb-1">Nilai Mentor</p>
                            <p className="text-xl font-black text-gray-700 dark:text-slate-200">{pl.toFixed(2)}</p>
                            <p className="text-[9px] text-gray-300 dark:text-slate-600 mt-0.5">bobot 45%</p>
                          </div>

                          {/* Equals */}
                          <div className="flex-shrink-0 text-gray-300 dark:text-slate-600">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="15" x2="19" y2="15"/>
                            </svg>
                          </div>

                          {/* Total */}
                          <div className="flex-1 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl p-3 text-center">
                            <p className="text-[10px] font-bold text-[#CC0000]/70 dark:text-red-400 mb-1">Total Gabungan</p>
                            <p className="text-xl font-black text-[#CC0000]">{total}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </Section>

                {/* Ganti Semester — hanya tampil jika belum dinilai */}
                {(!detail.has_lecturer_score && !detail.has_mentor_score) && (
                  <Section title="Ganti Kode Semester">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-3 flex items-start gap-3">
                      <svg className="flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        Dosen dan mentor belum memberikan nilai. Admin dapat memindahkan mahasiswa ini ke semester lain.
                      </p>
                    </div>

                    {showEdit ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            Pilih Semester Baru
                          </label>
                          <select
                            id="select-new-semester"
                            value={newSemester}
                            onChange={e => setNewSemester(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30"
                          >
                            <option value="">-- Pilih Semester --</option>
                            {semesters
                              .filter(s => s.code !== detail.semester_code && s.is_active === 1)
                              .map(s => (
                                <option key={s.semester_id} value={s.code}>
                                  {s.code} {s.label}
                                </option>
                              ))
                            }
                          </select>
                          {semesters.filter(s => s.code !== detail.semester_code && s.is_active === 1).length === 0 && (
                            <div className="flex items-center gap-2 mt-1.5 px-1">
                              <svg className="flex-shrink-0 text-amber-500" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                              </svg>
                              <p className="text-xs text-amber-600 dark:text-amber-400">
                                Tidak ada semester aktif lain yang tersedia untuk dipindahkan.
                              </p>
                            </div>
                          )}
                        </div>

                        {editMsg && (
                          <div className={`px-3 py-2.5 rounded-xl text-sm ${editSuccess
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                          }`}>
                            {editMsg}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            id="btn-confirm-change-semester"
                            onClick={handleEditSemester}
                            disabled={editLoading || !newSemester}
                            className="flex-1 px-4 py-2.5 bg-[#CC0000] hover:bg-[#A30000] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all"
                          >
                            {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                          </button>
                          <button
                            onClick={() => { setShowEdit(false); setEditMsg(''); setNewSemester(''); }}
                            className="px-4 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        id="btn-open-edit-semester"
                        onClick={() => { setShowEdit(true); setNewSemester(''); setEditMsg(''); }}
                        className="w-full px-4 py-2.5 border-2 border-[#CC0000]/30 hover:border-[#CC0000] text-[#CC0000] text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Ganti Kode Semester
                      </button>
                    )}
                  </Section>
                )}

                {/* Info jika sudah dinilai */}
                {(detail.has_lecturer_score || detail.has_mentor_score) && (
                  <div className="px-4 py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl flex items-start gap-3">
                    <svg className="flex-shrink-0 mt-0.5 text-gray-400 dark:text-slate-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                      Kode semester tidak dapat diubah karena {detail.has_lecturer_score && detail.has_mentor_score
                        ? 'dosen dan mentor sudah memberikan nilai'
                        : detail.has_lecturer_score
                          ? 'dosen sudah memberikan nilai'
                          : 'mentor sudah memberikan nilai'}.
                    </p>
                  </div>
                )}

              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-sm text-gray-400 dark:text-slate-500">Gagal memuat detail pengajuan.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 border-b border-gray-100 dark:border-slate-800 pb-2">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-3 py-1">
      <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 sm:w-36 sm:flex-shrink-0 sm:pt-0.5 uppercase tracking-wide">{label}</span>
      {children ? (
        <div className="flex-1">{children}</div>
      ) : (
        <span className={`text-sm font-semibold text-gray-800 dark:text-slate-200 flex-1 break-all ${mono ? 'font-mono' : ''}`}>
          {value || '—'}
        </span>
      )}
    </div>
  );
}

function ScoreCard({ label, value, hasValue }: { label: string; value: string | null; hasValue: boolean }) {
  return (
    <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-4 text-center">
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-2 leading-tight">{label}</p>
      {hasValue && value ? (
        <p className="text-2xl font-black text-[#CC0000]">{value}</p>
      ) : (
        <p className="text-2xl font-black text-gray-300 dark:text-slate-600">—</p>
      )}
      <p className="text-[10px] text-gray-300 dark:text-slate-600 mt-1">
        {hasValue ? 'Sudah dinilai' : 'Belum dinilai'}
      </p>
    </div>
  );
}
