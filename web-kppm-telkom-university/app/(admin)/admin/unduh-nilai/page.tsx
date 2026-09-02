'use client';

import { useState, useEffect, useRef } from 'react';
import { getAdminSemesters, exportAdminGrades, getAdminPreviewGrades } from '@/lib/api';

// ─── Icons ────────────────────────────────────────────────────────────────────

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUnduhNilaiPage() {
  const [downloadSemesters, setDownloadSemesters] = useState<any[]>([]);
  const [selectedDownloadSemester, setSelectedDownloadSemester] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await getAdminSemesters();
        if (res.success && res.data) {
          setDownloadSemesters(res.data);
        }
      } catch {
        setError('Gagal memuat daftar semester.');
      } finally {
        setLoading(false);
      }
    };
    fetchSemesters();
  }, []);

  useEffect(() => {
    if (!selectedDownloadSemester) {
      setPreviewData([]);
      return;
    }
    const fetchPreview = async () => {
      setPreviewLoading(true);
      try {
        const res = await getAdminPreviewGrades(selectedDownloadSemester);
        if (res.success && res.data) {
          setPreviewData(res.data);
        } else {
          setPreviewData([]);
        }
      } catch (err) {
        console.error('Error fetching preview data:', err);
        setPreviewData([]);
      } finally {
        setPreviewLoading(false);
      }
    };
    fetchPreview();
  }, [selectedDownloadSemester]);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDownloadSemester) {
      setError('Silakan pilih semester terlebih dahulu.');
      return;
    }
    setIsDownloading(true);
    setError('');
    try {
      await exportAdminGrades(selectedDownloadSemester);
    } catch (err: any) {
      setError(err.message || 'Gagal mengunduh nilai.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-5">

      {/* ── Hero Banner ── */}
      <div className="relative bg-gradient-to-br from-[#CC0000] via-[#B00000] to-[#7A0000] rounded-2xl md:rounded-3xl p-5 md:p-8 text-white overflow-hidden shadow-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute top-8 -right-4 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 right-16 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-lg flex-shrink-0">
            <DownloadIcon />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight break-words leading-tight">Unduh Nilai</h1>
            <p className="text-red-100/80 text-sm mt-1">
              Unduh rekapitulasi nilai mahasiswa berdasarkan semester dari Pembimbing Akademik & Lapangan.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-5">
          Form Unduh Nilai
        </h2>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-start gap-2.5">
            <span className="mt-0.5 flex-shrink-0"><AlertIcon /></span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-[#CC0000]/30 border-t-[#CC0000] rounded-full animate-spin mx-auto mb-3" />
            Memuat data semester...
          </div>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleDownload} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Pilih Semester <span className="text-red-500">*</span>
                </label>
                <div className="relative w-full" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-[#CC0000]/50 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                      </svg>
                      <span className="truncate">
                        {selectedDownloadSemester 
                          ? (() => {
                              const sem = downloadSemesters.find(s => s.code === selectedDownloadSemester);
                              return sem ? `${sem.label} (${sem.code})` : selectedDownloadSemester;
                            })()
                          : '-- Pilih Semester --'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {selectedDownloadSemester && (
                        <div 
                          className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDownloadSemester('');
                            setError('');
                          }}
                          title="Reset Filter"
                        >
                          <svg className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </button>

                  <div className={`absolute z-10 left-0 top-full mt-2 w-full min-w-[200px] bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden transition-all duration-200 origin-top ${isDropdownOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                    <div className="py-1.5 p-1.5 flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDownloadSemester('');
                          setError('');
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${!selectedDownloadSemester ? 'bg-[#CC0000]/10 text-[#CC0000] font-bold dark:bg-red-900/30 dark:text-red-400' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 font-medium'}`}
                      >
                        -- Pilih Semester --
                        {!selectedDownloadSemester && (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </button>
                      <div className="h-px bg-gray-100 dark:bg-slate-700/50 my-0.5" />
                      
                      {downloadSemesters.map((sem) => (
                        <button
                          key={sem.semester_id}
                          type="button"
                          onClick={() => {
                            setSelectedDownloadSemester(sem.code);
                            setError('');
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${selectedDownloadSemester === sem.code ? 'bg-[#CC0000]/10 text-[#CC0000] font-bold dark:bg-red-900/30 dark:text-red-400' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 font-medium'}`}
                        >
                          {sem.label} ({sem.code}) {sem.is_active === 1 && <span className="text-xs font-normal opacity-70">- Aktif</span>}
                          {selectedDownloadSemester === sem.code && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
                  File yang diunduh berbentuk Excel (.xlsx) dengan 2 sheet yang memisahkan nilai dari Pembimbing Akademik dan Pembimbing Lapangan.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isDownloading || !selectedDownloadSemester}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#CC0000] hover:bg-[#A30000] rounded-xl shadow-lg shadow-red-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Mengunduh...
                    </>
                  ) : (
                    <>
                      <DownloadIcon />
                      Unduh File Excel
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* PREVIEW */}
            {selectedDownloadSemester && (
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2">

                {previewLoading ? (
                  <div className="py-8 text-center text-gray-500 text-sm">
                    <div className="w-6 h-6 border-2 border-[#CC0000]/30 border-t-[#CC0000] rounded-full animate-spin mx-auto mb-2" />
                    Memuat preview data...
                  </div>
                ) : previewData.length === 0 ? (
                  <div className="py-8 text-center bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                    <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Belum ada data nilai di semester ini.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-4 bg-[#CC0000] rounded-full"></div>
                      <h3 className="text-xs font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-widest">
                        Preview Format Kolom Sheet Pembimbing Akademik
                      </h3>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50/50 dark:bg-slate-900/50">
                            {['Kelas', 'Nama', 'NIM', 'PLO05-CLO01 - Komitmen terhadap tugas...', 'PLO07-CLO02 - Mahasiswa mampu merencanakan...', 'PLO05-CLO04 - Frekuensi bimbingan...', 'PLO05-CLO04 - Kualitas Presentasi', 'PLO05-CLO04 - Kualitas Laporan', 'PLO01-CLO05 PA - Identifikasi...'].map(h => (
                              <th key={h} className="px-5 py-3 text-left text-[11px] font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-slate-800">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900">
                          {previewData.map((row, idx) => (
                            <tr key={idx} className="border-b border-gray-50 dark:border-slate-800/60 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs font-medium">{row.class || '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs font-medium">{row.student_name || '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs font-medium">{row.nim || '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs text-center font-medium">{row.pa_commitment ?? '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs text-center font-medium">{row.pa_planning ?? '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs text-center font-medium">{row.pa_guidance ?? '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs text-center font-medium">{row.pa_presentation ?? '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs text-center font-medium">{row.pa_report ?? '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs text-center font-medium">{row.pa_identification ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center gap-2 mb-4 mt-8">
                      <div className="w-1.5 h-4 bg-[#CC0000] rounded-full"></div>
                      <h3 className="text-xs font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-widest">
                        Preview Format Kolom Sheet Pembimbing Lapangan
                      </h3>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50/50 dark:bg-slate-900/50">
                            {['Kelas', 'Nama', 'NIM', 'PLO05-CLO01 - Kehadiran Tepat Waktu', 'PLO05-CLO01 - Kedisiplinan', 'PLO05-CLO01 - Komitmen terhadap tugas...', 'PLO07-CLO02 - Perencanaan tugas...', 'PLO03-CLO03 - Kerjasama tim...', 'PLO05-CLO04 - Frekuensi bimbingan...', 'PLO05-CLO04 - Kualitas Laporan', 'PLO01-CLO05 PA - Identifikasi...'].map(h => (
                              <th key={h} className="px-5 py-3 text-left text-[11px] font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-slate-800">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900">
                          {previewData.map((row, idx) => (
                            <tr key={idx} className="border-b border-gray-50 dark:border-slate-800/60 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs font-medium">{row.class || '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs font-medium">{row.student_name || '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs font-medium">{row.nim || '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs text-center font-medium">{row.pl_attendance ?? '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs text-center font-medium">{row.pl_discipline ?? '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs text-center font-medium">{row.pl_commitment ?? '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs text-center font-medium">{row.pl_planning ?? '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs text-center font-medium">{row.pl_teamwork ?? '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs text-center font-medium">{row.pl_guidance ?? '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs text-center font-medium">{row.pl_report ?? '-'}</td>
                              <td className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs text-center font-medium">{row.pl_problem_solving ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
