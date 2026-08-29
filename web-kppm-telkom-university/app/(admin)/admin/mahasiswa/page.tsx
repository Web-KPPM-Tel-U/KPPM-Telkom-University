'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAdminStudents, toggleAdminStudentStatus, addAdminStudent, updateAdminStudent } from '@/lib/api';

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const UsersIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15,18 9,12 15,6" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9,18 15,12 9,6" />
  </svg>
);
const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);
const PowerOnIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64a9 9 0 11-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  nim: string;
  student_name: string;
  class: string;
  email: string | null;
  is_verified: number;
  password_changed: number;
  is_active: number;
  created_at: string;
}

function getProdi(kelas: string): string {
  const k = kelas?.toUpperCase() || '';
  if (k.startsWith('IF')) return 'S1 Informatika';
  if (k.startsWith('SI')) return 'S1 Sistem Informasi';
  if (k.startsWith('IK')) return 'S1 Ilmu Komputasi';
  if (k.startsWith('TI')) return 'D3 Teknologi Informasi';
  if (k.startsWith('RPL')) return 'D3 Rekayasa Perangkat Lunak';
  return 'Lainnya';
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const PAGE_SIZE = 20;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KelolaMahasiswaPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingNim, setTogglingNim] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ nim: '', student_name: '', class: '', email: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  // ── Edit Mahasiswa
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ nim: '', student_name: '', class: '', email: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchStudents = useCallback(async (q: string, pg: number) => {
    setLoading(true); setError('');
    try {
      const res = await getAdminStudents(PAGE_SIZE, pg * PAGE_SIZE, q);
      if (res.success) {
        setStudents(res.data ?? []);
        setTotal(res.meta?.total ?? 0);
      } else { setError('Gagal memuat data mahasiswa.'); }
    } catch { setError('Tidak dapat terhubung ke server.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStudents(search, page); }, [search, page, fetchStudents]);

  // Debounced real-time search
  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      setSearch(val.trim());
    }, 400);
  };

  const handleReset = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearchInput(''); setSearch(''); setPage(0);
  };

  const handleToggle = async (s: Student) => {
    setTogglingNim(s.nim);
    try {
      const res = await toggleAdminStudentStatus(s.nim);
      if (res.success) {
        setStudents(prev => prev.map(x => x.nim === s.nim ? { ...x, is_active: res.data.is_active } : x));
      }
    } catch { /* silent */ }
    finally { setTogglingNim(null); }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true); setAddError(''); setAddSuccess('');
    try {
      const res = await addAdminStudent(addForm);
      if (res.success) {
        setAddSuccess('Mahasiswa berhasil ditambahkan.');
        setAddForm({ nim: '', student_name: '', class: '', email: '' });
        fetchStudents(search, page);
        setTimeout(() => setShowAddModal(false), 1500);
      } else {
        setAddError(res.message || 'Gagal menambahkan mahasiswa.');
      }
    } catch (err: any) {
      setAddError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true); setEditError(''); setEditSuccess('');
    try {
      const res = await updateAdminStudent(editForm.nim, {
        student_name: editForm.student_name,
        class: editForm.class,
        email: editForm.email
      });
      if (res.success) {
        setEditSuccess(`Data mahasiswa ${editForm.nim} berhasil diperbarui.`);
        fetchStudents(search, page);
        setTimeout(() => setShowEditModal(false), 1500);
      } else {
        setEditError(res.message || 'Gagal memperbarui mahasiswa.');
      }
    } catch (err: any) {
      setEditError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setEditLoading(false);
    }
  };

  const activeCount = students.filter(s => s.is_active === 1).length;
  const verifiedCount = students.filter(s => s.is_verified === 1).length;

  return (
    <>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-5">

        {/* Hero */}
        <div className="relative bg-gradient-to-br from-[#CC0000] via-[#B00000] to-[#7A0000] rounded-2xl md:rounded-3xl p-5 md:p-8 text-white overflow-hidden shadow-xl">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/5 rounded-full" />
          <div className="absolute top-6 -right-4 w-28 h-28 bg-white/5 rounded-full" />
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white flex-shrink-0 shadow-lg"><UsersIcon /></div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight break-words leading-tight">Kelola Mahasiswa</h1>
              <p className="text-red-100/90 text-[11px] sm:text-sm mt-1 line-clamp-2 sm:line-clamp-none">Lihat seluruh data mahasiswa dan kelola status aktif akun mereka dalam sistem KPPM.</p>
            </div>
            <div className="hidden sm:block flex-shrink-0 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold">{loading ? '…' : total.toLocaleString('id-ID')}</p>
              <p className="text-red-200 text-xs font-semibold mt-0.5 uppercase tracking-widest">Total Mahasiswa</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><SearchIcon /></span>
            <input
              id="input-search-mahasiswa"
              type="text"
              value={searchInput}
              onChange={e => handleSearchInput(e.target.value)}
              placeholder="Ketik nama atau NIM untuk mencari..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] transition-all"
            />
            {searchInput && (
              <button onClick={handleReset} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
                <XIcon />
              </button>
            )}
          </div>

          <button onClick={() => { setShowAddModal(true); setAddError(''); setAddSuccess(''); setAddForm({ nim: '', student_name: '', class: '', email: '' }); }} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#CC0000] rounded-xl hover:bg-[#B00000] shadow-md shadow-red-500/20 transition-all flex-shrink-0">
            <PlusIcon /> Tambah Mahasiswa
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">

          {/* Stats bar */}
          {!loading && students.length > 0 && (
            <div className="px-6 py-3 bg-gray-50/60 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800 flex items-center gap-6 flex-wrap text-xs font-semibold text-gray-500 dark:text-slate-400">
              <span>
                Menampilkan <strong className="text-gray-800 dark:text-slate-200">{students.length}</strong> dari <strong className="text-gray-800 dark:text-slate-200">{total}</strong> mahasiswa
                {search && <span className="ml-1">untuk "<em className="text-[#CC0000]">{search}</em>"</span>}
              </span>
              <span className="ml-auto flex items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Aktif: <strong className="text-gray-700 dark:text-slate-300">{activeCount}</strong></span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Verified: <strong className="text-gray-700 dark:text-slate-300">{verifiedCount}</strong></span>
              </span>
            </div>
          )}

          {/* Error */}
          {error && <div className="p-6 text-center text-red-600 dark:text-red-400 text-sm font-medium">{error}</div>}

          {/* Skeleton */}
          {loading && (
            <div className="divide-y divide-gray-50 dark:divide-slate-800/60">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5"><div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-40" /><div className="h-2.5 bg-gray-50 dark:bg-slate-800/50 rounded w-24" /></div>
                  <div className="h-5 bg-gray-100 dark:bg-slate-800 rounded-full w-16 hidden md:block" />
                  <div className="h-8 bg-gray-100 dark:bg-slate-800 rounded-lg w-24 hidden md:block" />
                </div>
              ))}
            </div>
          )}

          {/* Table (desktop) / Card list (mobile) */}
          {!loading && !error && students.length > 0 && (
            <>
              {/* ── Mobile Card List ── */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-800">
                {students.map((s, idx) => {
                  const initials = s.student_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                  const colors = ['bg-red-100 text-red-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700'];
                  const color = colors[idx % colors.length];
                  const isActive = s.is_active === 1;
                  const toggling = togglingNim === s.nim;
                  return (
                    <div key={s.nim} className={`px-4 py-3.5 ${!isActive ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 mt-0.5 ${color}`}>{initials}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm break-words leading-snug">{s.student_name}</p>
                          <p className="text-[11px] text-gray-400 dark:text-slate-500 font-mono mt-0.5">{s.nim}</p>
                          {s.class && <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{s.class} · {getProdi(s.class)}</p>}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${isActive
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                              }`}>
                              {isActive ? '● Aktif' : '○ Nonaktif'}
                            </span>
                            {s.is_verified === 1 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">Verified</span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setEditForm({ nim: s.nim, student_name: s.student_name, class: s.class || '', email: s.email || '' });
                              setEditError(''); setEditSuccess(''); setShowEditModal(true);
                            }}
                            className="mt-2.5 w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-[#CC0000]/50 hover:text-[#CC0000] hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                          >
                            <EditIcon /> Edit
                          </button>
                          <button
                            id={`btn-toggle-mahasiswa-mobile-${s.nim}`}
                            onClick={() => handleToggle(s)}
                            disabled={toggling}
                            className={`mt-2.5 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all disabled:opacity-50 ${isActive
                                ? 'border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : 'border-green-200 dark:border-green-800/50 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                              }`}
                          >
                            {toggling ? <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> : <PowerOnIcon />}
                            {isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Desktop Table ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-slate-800/50">
                      <th className="px-6 py-3.5 text-left text-[11px] font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Mahasiswa</th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-wider">NIM</th>
                      <th className="px-4 py-3.5 text-center text-[11px] font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Kelas</th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden xl:table-cell">Program Studi</th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Email</th>
                      <th className="px-4 py-3.5 text-center text-[11px] font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status Akun</th>
                      <th className="px-4 py-3.5 text-center text-[11px] font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
                    {students.map((s, idx) => {
                      const initials = s.student_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                      const colors = ['bg-red-100 text-red-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700'];
                      const color = colors[idx % colors.length];
                      const isActive = s.is_active === 1;
                      const toggling = togglingNim === s.nim;
                      return (
                        <tr key={s.nim} className={`hover:bg-gray-50/70 dark:hover:bg-slate-800/30 transition-colors ${!isActive ? 'opacity-60' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${color}`}>{initials}</div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-slate-100 truncate max-w-[160px]">{s.student_name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-600 dark:text-slate-300 font-mono text-xs">{s.nim}</td>
                          <td className="px-4 py-4 text-center hidden lg:table-cell">
                            <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-bold">{s.class || '—'}</span>
                          </td>
                          <td className="px-4 py-4 text-xs text-gray-500 dark:text-slate-400 hidden xl:table-cell">{getProdi(s.class)}</td>
                          <td className="px-4 py-4 text-xs text-gray-500 dark:text-slate-400 hidden lg:table-cell truncate max-w-[200px]">
                            {s.email || <span className="text-gray-300 dark:text-slate-600 italic">Belum diisi</span>}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${isActive
                                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                                }`}>{isActive ? '● Aktif' : '○ Nonaktif'}</span>
                              {s.is_verified === 1 && <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">Verified</span>}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditForm({ nim: s.nim, student_name: s.student_name, class: s.class || '', email: s.email || '' });
                                  setEditError(''); setEditSuccess(''); setShowEditModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-[#CC0000]/50 hover:text-[#CC0000] hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                                title="Edit Data"
                              >
                                <EditIcon /> Edit
                              </button>
                              <button
                                id={`btn-toggle-mahasiswa-${s.nim}`}
                                onClick={() => handleToggle(s)}
                                disabled={toggling}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all disabled:opacity-50 ${isActive
                                    ? 'border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    : 'border-green-200 dark:border-green-800/50 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                  }`}
                              >
                                {toggling ? <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> : <PowerOnIcon />}
                                {isActive ? 'Nonaktifkan' : 'Aktifkan'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Empty */}
          {!loading && !error && students.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-slate-600"><UsersIcon /></div>
              <p className="font-bold text-gray-800 dark:text-slate-200 text-base">
                {search ? `Tidak ada mahasiswa dengan kata kunci "${search}"` : 'Belum ada data mahasiswa'}
              </p>
              <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                {search ? 'Coba gunakan kata kunci lain.' : 'Import data mahasiswa terlebih dahulu melalui fitur Injeksi CSV/XLSX.'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                Halaman <strong className="text-gray-700 dark:text-slate-300">{page + 1}</strong> dari <strong className="text-gray-700 dark:text-slate-300">{totalPages}</strong>
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-[#CC0000]/40 hover:text-[#CC0000] transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-slate-900">
                  <ChevronLeftIcon /> Sebelumnya
                </button>
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
                    const p = start + i;
                    if (p >= totalPages) return null;
                    return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${p === page ? 'bg-[#CC0000] text-white shadow-sm' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>{p + 1}</button>;
                  })}
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-[#CC0000]/40 hover:text-[#CC0000] transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-slate-900">
                  Berikutnya <ChevronRightIcon />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/30">
              <h3 className="font-extrabold text-gray-900 dark:text-slate-100 text-lg">Tambah Mahasiswa Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
                <XIcon />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {addError && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 font-medium">{addError}</div>}
              {addSuccess && <div className="p-3 text-sm text-green-600 bg-green-50 rounded-xl border border-green-100 font-medium">{addSuccess}</div>}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">NIM <span className="text-red-500">*</span></label>
                <input required type="text" value={addForm.nim} onChange={e => setAddForm(f => ({ ...f, nim: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000]" placeholder="Contoh: 1301220001" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                <input required type="text" value={addForm.student_name} onChange={e => setAddForm(f => ({ ...f, student_name: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000]" placeholder="Nama Mahasiswa" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">Kelas <span className="text-red-500">*</span></label>
                <input required type="text" value={addForm.class} onChange={e => setAddForm(f => ({ ...f, class: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000]" placeholder="Contoh: IF-46-01" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">Email <span className="font-normal text-gray-400 lowercase tracking-normal">(Opsional)</span></label>
                <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000]" placeholder="email@student.telkomuniversity.ac.id" />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                <button type="submit" disabled={addLoading || !!addSuccess} className="inline-flex items-center justify-center min-w-[120px] px-5 py-2.5 text-sm font-bold text-white bg-[#CC0000] hover:bg-[#B00000] rounded-xl shadow-lg shadow-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {addLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/30">
              <h3 className="font-extrabold text-gray-900 dark:text-slate-100 text-lg">Edit Mahasiswa</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
                <XIcon />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 font-medium">{editError}</div>}
              {editSuccess && <div className="p-3 text-sm text-green-600 bg-green-50 rounded-xl border border-green-100 font-medium">{editSuccess}</div>}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">NIM <span className="font-normal text-gray-400 lowercase tracking-normal">(Tidak dapat diubah)</span></label>
                <input type="text" value={editForm.nim} disabled className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 text-sm cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                <input required type="text" value={editForm.student_name} onChange={e => setEditForm(f => ({ ...f, student_name: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000]" placeholder="Nama Mahasiswa" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">Kelas <span className="text-red-500">*</span></label>
                <input required type="text" value={editForm.class} onChange={e => setEditForm(f => ({ ...f, class: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000]" placeholder="Contoh: IF-46-01" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">Email <span className="font-normal text-gray-400 lowercase tracking-normal">(Opsional)</span></label>
                <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000]" placeholder="email@student.telkomuniversity.ac.id" />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                <button type="submit" disabled={editLoading || !!editSuccess} className="inline-flex items-center justify-center min-w-[120px] px-5 py-2.5 text-sm font-bold text-white bg-[#CC0000] hover:bg-[#B00000] rounded-xl shadow-lg shadow-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
