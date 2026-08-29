'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminToken, getAdminSemesters, createAdminSemester, toggleAdminSemesterStatus } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Semester {
  semester_id: number;
  code: string;
  label: string;
  is_active: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────



const SEMESTER_TYPES = [
  { value: '1', label: 'Ganjil' },
  { value: '2', label: 'Genap' },
];

function buildCode(year1: string, year2: string, type: string) {
  if (!year1 || !year2 || !type) return '';
  return `${year1.slice(2)}${year2.slice(2)}-${type}`;
}

function buildLabel(year1: string, year2: string, type: string) {
  if (!year1 || !year2 || !type) return '';
  const typeLabel = type === '1' ? 'Ganjil' : 'Genap';
  return `Semester ${typeLabel} ${year1}/${year2}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20,6 9,17 4,12" />
  </svg>
);
const TagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);
const AlertIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ─── Custom Year Picker ───────────────────────────────────────────────────────

function YearPicker({ value, onChange, allowedValues, disabled, placeholder }: { value: string, onChange: (v: string) => void, allowedValues?: string[], disabled?: boolean, placeholder?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  // Ensure the base year snaps to a multiple of 12 for the grid pagination
  const initialBase = value ? parseInt(value) - (parseInt(value) % 12) : currentYear - (currentYear % 12);
  const [baseYear, setBaseYear] = useState(initialBase);

  // Sync baseYear when value changes externally
  useEffect(() => {
    if (value && isOpen) {
      setBaseYear(parseInt(value) - (parseInt(value) % 12));
    }
  }, [value, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const years = Array.from({ length: 12 }, (_, i) => (baseYear + i).toString());

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
        className={`w-full px-4 py-3 border rounded-xl text-sm transition-all flex justify-between items-center ${
          disabled 
            ? 'bg-gray-100 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
            : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 cursor-pointer focus-within:ring-2 focus-within:ring-[#CC0000]/30 focus-within:border-[#CC0000]'
        }`}
      >
        <span>{value || placeholder || 'Pilih Tahun'}</span>
        <CalendarIcon />
      </div>
      {isOpen && !disabled && (
        <div className="absolute top-full mt-2 left-0 min-w-[240px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-2xl rounded-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-3 px-1 border-b border-gray-100 dark:border-slate-700 pb-2">
            <button type="button" onClick={() => setBaseYear(b => b - 12)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 transition-colors">
              <ChevronLeftIcon />
            </button>
            <div className="text-xs font-extrabold text-gray-700 dark:text-slate-300 uppercase tracking-widest">
              {baseYear} - {baseYear + 11}
            </div>
            <button type="button" onClick={() => setBaseYear(b => b + 12)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 transition-colors">
              <ChevronRightIcon />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {years.map(y => {
              const isAllowed = !allowedValues || allowedValues.includes(y);
              return (
                <button
                  key={y}
                  type="button"
                  disabled={!isAllowed}
                  onClick={() => { onChange(y); setIsOpen(false); }}
                  className={`p-2 text-sm rounded-lg font-bold transition-all ${
                    !isAllowed
                      ? 'text-gray-300 dark:text-slate-600 bg-gray-50/50 dark:bg-slate-800/30 cursor-not-allowed'
                      : value === y
                        ? 'bg-[#CC0000] text-white shadow-md shadow-red-500/20'
                        : 'text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-[#CC0000]'
                  }`}
                >
                  {y}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSemesterPage() {
  const router = useRouter();

  // ── List state
  const [semesters, setSemesters]     = useState<Semester[]>([]);
  const [loading, setLoading]         = useState(true);
  const [togglingId, setTogglingId]   = useState<number | null>(null);

  // ── Form state
  const [selectedYear1, setSelectedYear1] = useState('');
  const [selectedYear2, setSelectedYear2] = useState('');
  const [selectedType, setSelectedType]   = useState('');
  const [creating, setCreating]           = useState(false);
  const [formError, setFormError]         = useState('');
  const [formSuccess, setFormSuccess]     = useState('');
  const [toggleError, setToggleError]     = useState('');

  const previewCode       = buildCode(selectedYear1, selectedYear2, selectedType);
  const previewLabel      = buildLabel(selectedYear1, selectedYear2, selectedType);

  useEffect(() => {
    if (!getAdminToken()) { router.replace('/admin-login'); return; }
  }, [router]);

  const fetchSemesters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminSemesters();
      if (res.success && res.data) setSemesters(res.data as Semester[]);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSemesters(); }, [fetchSemesters]);

  // ── Create semester
  const handleCreate = async () => {
    setFormError(''); setFormSuccess('');
    if (!selectedYear1 || !selectedYear2 || !selectedType) {
      setFormError('Silakan lengkapi tahun ajaran dan jenis semester terlebih dahulu.');
      return;
    }
    if (parseInt(selectedYear2) !== parseInt(selectedYear1) + 1) {
      setFormError('Tahun akhir harus tepat 1 tahun setelah tahun awal (contoh: 2024/2025).');
      return;
    }
    // Cegah pembuatan jika masih ada semester aktif
    const activeSem = semesters.find(s => s.is_active === 1);
    if (activeSem) {
      setFormError(`Nonaktifkan semester "${activeSem.code}" terlebih dahulu sebelum membuat semester baru.`);
      return;
    }
    setCreating(true);
    try {
      const res = await createAdminSemester(previewCode, previewLabel);
      if (res.success) {
        setFormSuccess(`Semester "${previewCode}" berhasil dibuat.`);
        setSelectedYear1('');
        setSelectedYear2('');
        setSelectedType('');
        fetchSemesters();
      } else {
        setFormError(res.message || 'Gagal membuat semester.');
      }
    } catch {
      setFormError('Tidak dapat terhubung ke server.');
    } finally {
      setCreating(false);
    }
  };

  // ── Toggle status
  const handleToggle = async (sem: Semester) => {
    setTogglingId(sem.semester_id);
    setToggleError('');
    try {
      const res = await toggleAdminSemesterStatus(sem.semester_id);
      if (res.success) {
        setSemesters(prev =>
          prev.map(s =>
            s.semester_id === sem.semester_id
              ? { ...s, is_active: res.data?.is_active ?? (s.is_active === 1 ? 0 : 1) }
              : s
          )
        );
      } else {
        setToggleError(res.message || 'Gagal mengubah status semester.');
      }
    } catch {
      setToggleError('Tidak dapat terhubung ke server.');
    } finally { setTogglingId(null); }
  };

  const activeSemesters   = semesters.filter(s => s.is_active === 1);
  const inactiveSemesters = semesters.filter(s => s.is_active === 0);
  const hasActiveSemester = activeSemesters.length > 0;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-5">

      {/* ── Hero Banner ── */}
      <div className="relative bg-gradient-to-br from-[#CC0000] via-[#B00000] to-[#7A0000] rounded-2xl md:rounded-3xl p-5 md:p-8 text-white overflow-hidden shadow-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute top-8 -right-4  w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 right-16 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-lg flex-shrink-0">
            <CalendarIcon />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight break-words leading-tight">Kelola Semester</h1>
            <p className="text-red-100/80 text-sm mt-1">
              Atur semester aktif yang eligible untuk program magang mahasiswa KPPM.
            </p>
          </div>
        </div>

        {/* Stat pills */}
        <div className="relative mt-5 pt-4 border-t border-white/10 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50" />
            <span className="text-white/90 font-semibold">{activeSemesters.length} Semester Aktif</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-white/30" />
            <span className="text-red-200/80">{inactiveSemesters.length} Nonaktif</span>
          </div>
          <div className="ml-auto">
            <button
              onClick={fetchSemesters}
              className="flex items-center gap-1.5 text-xs text-red-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
            >
              <RefreshIcon /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Form Buat Semester Baru ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-5">
          Buat Semester Baru
        </h2>

        {/* Warning: ada semester aktif */}
        {hasActiveSemester && (
          <div className="mb-5 px-4 py-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-xl flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 text-amber-500"><AlertIcon /></span>
            <div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Semester aktif terdeteksi</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                Nonaktifkan semester <strong>{activeSemesters[0].code}</strong> di daftar bawah sebelum membuat semester baru.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Dropdown Tahun Ajaran Ganda */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
              Tahun Ajaran
            </label>
            <div className="flex items-center gap-2">
              <YearPicker
                placeholder="Tahun"
                value={selectedYear1}
                onChange={val => {
                  setSelectedYear1(val); 
                  setFormError(''); 
                  setFormSuccess(''); 
                  setSelectedYear2((parseInt(val) + 1).toString());
                }}
              />
              <span className="text-gray-400 font-bold">/</span>
              <div
                className={`w-full px-4 py-3 border rounded-xl text-sm transition-all flex justify-between items-center ${
                  !selectedYear1
                    ? 'bg-gray-100 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                    : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 font-bold cursor-not-allowed'
                }`}
              >
                <span>{selectedYear2 || 'Tahun'}</span>
                <CalendarIcon />
              </div>
            </div>
          </div>

          {/* Dropdown Jenis Semester */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
              Jenis Semester
            </label>
            <select
              id="select-jenis-semester"
              value={selectedType}
              onChange={e => { setSelectedType(e.target.value); setFormError(''); setFormSuccess(''); }}
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] transition-all"
            >
              <option value="">-- Pilih Jenis Semester --</option>
              {SEMESTER_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview Kode */}
        <div className={`rounded-xl border p-4 mb-4 transition-all duration-300 ${
          previewCode
            ? 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50'
            : 'border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20'
        }`}>
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
              Preview Kode Semester
            </p>
            {previewCode ? (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-widest font-mono">
                  {previewCode}
                </span>
                <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">
                  {previewLabel}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-slate-500 italic">
                Pilih tahun ajaran dan jenis semester untuk melihat preview kode
              </p>
            )}
          </div>
        </div>

        {/* Feedback */}
        {formError && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-start gap-2.5">
            <span className="mt-0.5 flex-shrink-0"><AlertIcon /></span>
            <span>{formError}</span>
          </div>
        )}
        {formSuccess && (
          <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm flex items-start gap-2.5">
            <span className="mt-0.5 flex-shrink-0"><CheckIcon /></span>
            <span>{formSuccess}</span>
          </div>
        )}

        <button
          id="btn-create-semester"
          onClick={handleCreate}
          disabled={creating || !previewCode || hasActiveSemester}
          className="flex items-center gap-2 px-6 py-3 bg-[#CC0000] hover:bg-[#A30000] disabled:bg-gray-200 dark:disabled:bg-slate-700 disabled:text-gray-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md"
        >
          <PlusIcon />
          {creating ? 'Membuat...' : 'Buat Semester'}
        </button>
      </div>

      {/* Toggle error banner */}
      {toggleError && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-start gap-2.5">
          <span className="mt-0.5 flex-shrink-0"><AlertIcon /></span>
          <span>{toggleError}</span>
          <button type="button" onClick={() => setToggleError('')} className="ml-auto text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
      )}

      {/* ── Daftar Semester ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
            Daftar Semester
          </h2>
          <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-full font-semibold">
            {semesters.length} total
          </span>
        </div>

        {loading ? (
          <div className="p-6 sm:p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#CC0000]/30 border-t-[#CC0000] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-slate-500">Memuat data semester...</p>
          </div>
        ) : semesters.length === 0 ? (
          <div className="p-6 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-gray-300 dark:text-slate-600">
              <CalendarIcon />
            </div>
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Belum ada data semester</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Buat semester baru menggunakan form di atas</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {semesters.map(sem => {
              const isActive     = sem.is_active === 1;
              const isToggling   = togglingId === sem.semester_id;

              return (
                <div
                  key={sem.semester_id}
                  className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                    isActive ? 'bg-green-50/30 dark:bg-green-950/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Status indicator */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    isActive ? 'bg-green-400 shadow-sm shadow-green-400/50' : 'bg-gray-200 dark:bg-slate-600'
                  }`} />

                  {/* Kode + Label */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-base font-black text-gray-900 dark:text-slate-100 font-mono tracking-wide">
                        {sem.code}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/60 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800">
                          <CheckIcon /> Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{sem.label}</p>
                    <p className="text-[10px] text-gray-300 dark:text-slate-600 mt-0.5">
                      Dibuat {formatDate(sem.created_at)}
                    </p>
                  </div>

                  {/* Toggle Button */}
                  <button
                    id={`btn-toggle-semester-${sem.semester_id}`}
                    onClick={() => handleToggle(sem)}
                    disabled={isToggling}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 disabled:opacity-60 ${
                      isActive
                        ? 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400'
                        : 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/60'
                    }`}
                  >
                    {isToggling ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        Menyimpan...
                      </span>
                    ) : (
                      isActive ? 'Nonaktifkan' : 'Aktifkan'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
