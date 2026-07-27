'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getMyGrades } from '@/lib/api';
import type { MyGradesData, MyMentorGrades, MyLecturerGrades } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type View = 'list' | 'detail';

// ─── Icons ────────────────────────────────────────────────────────────────────
const ArrowLeftIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12,19 5,12 12,5" />
  </svg>
);

// ─── Konfigurasi indikator Mentor ────────────────────────────────────────────
const MENTOR_INDICATORS: { key: keyof Omit<MyMentorGrades, 'total' | 'updated_at'>; label: string; bobot: number }[] = [
  { key: 'attendance',      label: 'Kehadiran tepat waktu',                                                              bobot: 5  },
  { key: 'discipline',      label: 'Kedisiplinan (kesesuaian dengan aturan)',                                            bobot: 5  },
  { key: 'commitment',      label: 'Komitmen terhadap tugas / pekerjaan',                                               bobot: 5  },
  { key: 'planning',        label: 'Merencanakan penyelesaian tugas, bekerja efektif dan mandiri selama KP',            bobot: 5  },
  { key: 'teamwork',        label: 'Bekerja sama dalam tim organisasi / perusahaan selama KP',                          bobot: 10 },
  { key: 'guidance',        label: 'Frekuensi bimbingan dengan pembimbing lapang',                                      bobot: 5  },
  { key: 'report',          label: 'Kualitas laporan',                                                                  bobot: 5  },
  { key: 'problem_solving', label: 'Identifikasi dan Formulasi Masalah',                                                bobot: 5  },
];

// ─── Konfigurasi indikator Dosen PA ──────────────────────────────────────────
const LECTURER_INDICATORS: { key: keyof Omit<MyLecturerGrades, 'total' | 'updated_at'>; label: string; bobot: number }[] = [
  { key: 'commitment',     label: 'Komitmen terhadap tugas / pekerjaan',                                                                        bobot: 10 },
  { key: 'planning',       label: 'Mahasiswa mampu merencanakan penyelesaian tugas atau pekerjaan, bekerja efektif, dan mandiri selama KP',     bobot:  5 },
  { key: 'guidance',       label: 'Frekuensi bimbingan dengan pembimbing akademik',                                                             bobot:  5 },
  { key: 'presentation',   label: 'Kualitas Presentasi',                                                                                        bobot: 15 },
  { key: 'report',         label: 'Kualitas Laporan KP',                                                                                       bobot: 10 },
  { key: 'identification', label: 'Identifikasi dan Formulasi Masalah',                                                                         bobot: 10 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ScoreBadge({ value }: { value: number }) {
  const color =
    value >= 85 ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' :
    value >= 70 ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' :
    value >= 55 ? 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800' :
    value >= 40 ? 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800' :
                  'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-sm font-bold border ${color}`}>
      {value.toFixed(1)}
    </span>
  );
}

// ─── Status Section (nilai belum ada) ────────────────────────────────────────
function PendingSection({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-4 py-4 px-5 bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Tabel Nilai Mentor ───────────────────────────────────────────────────────
function MentorGradeTable({ grades }: { grades: MyMentorGrades }) {
  const TOTAL_BOBOT = MENTOR_INDICATORS.reduce((s, i) => s + i.bobot, 0);
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
              <th className="px-4 py-2.5 text-center w-8">No</th>
              <th className="px-4 py-2.5 text-left">Indikator Penilaian</th>
              <th className="px-4 py-2.5 text-center w-20">Bobot (%)</th>
              <th className="px-4 py-2.5 text-center w-24">Nilai</th>
              <th className="px-4 py-2.5 text-center w-28">Bobot × Nilai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {MENTOR_INDICATORS.map((ind, i) => {
              const val = grades[ind.key];
              const contrib = (ind.bobot / 100) * val;
              return (
                <tr key={ind.key} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-center text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs leading-snug">{ind.label}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-bold text-[#CC0000] bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-lg">{ind.bobot}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ScoreBadge value={val} />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-200 font-semibold">{contrib.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-slate-800 border-t-2 border-gray-200 dark:border-gray-700">
              <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-700 dark:text-gray-300 text-sm">
                Total Nilai Pembimbing Lapangan
                <span className="ml-2 text-xs text-gray-400 font-normal">(Bobot total: {TOTAL_BOBOT}%)</span>
              </td>
              <td className="px-4 py-3 text-center" />
              <td className="px-4 py-3 text-center">
                <span className="text-xl font-extrabold text-[#CC0000]">{grades.total.toFixed(2)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-[11px] text-gray-400 mt-2 px-1">
        Diperbarui: {fmtDate(grades.updated_at)}
      </p>
    </div>
  );
}

// ─── Tabel Nilai Dosen PA ─────────────────────────────────────────────────────
function LecturerGradeTable({ grades }: { grades: MyLecturerGrades }) {
  const TOTAL_BOBOT = LECTURER_INDICATORS.reduce((s, i) => s + i.bobot, 0);
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
              <th className="px-4 py-2.5 text-center w-8">No</th>
              <th className="px-4 py-2.5 text-left">Indikator Penilaian</th>
              <th className="px-4 py-2.5 text-center w-20">Bobot (%)</th>
              <th className="px-4 py-2.5 text-center w-24">Nilai</th>
              <th className="px-4 py-2.5 text-center w-28">Bobot × Nilai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {LECTURER_INDICATORS.map((ind, i) => {
              const val = grades[ind.key];
              const contrib = (ind.bobot / 100) * val;
              return (
                <tr key={ind.key} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-center text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs leading-snug">{ind.label}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-bold text-[#CC0000] bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-lg">{ind.bobot}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ScoreBadge value={val} />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-200 font-semibold">{contrib.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-slate-800 border-t-2 border-gray-200 dark:border-gray-700">
              <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-700 dark:text-gray-300 text-sm">
                Total Nilai Pembimbing Akademik
                <span className="ml-2 text-xs text-gray-400 font-normal">(Bobot total: {TOTAL_BOBOT}%)</span>
              </td>
              <td className="px-4 py-3 text-center" />
              <td className="px-4 py-3 text-center">
                <span className="text-xl font-extrabold text-[#CC0000]">{grades.total.toFixed(2)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-[11px] text-gray-400 mt-2 px-1">
        Diperbarui: {fmtDate(grades.updated_at)}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LihatNilaiPage() {
  const router = useRouter();
  const [data, setData] = useState<MyGradesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('list');

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }

    const fetchGrades = async () => {
      try {
        const res = await getMyGrades();
        if (res.success) {
          setData(res.data ?? null);
        } else {
          setError(res.message || 'Gagal memuat nilai.');
        }
      } catch {
        setError('Tidak dapat terhubung ke server.');
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, [router]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#CC0000] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-semibold mb-3">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#CC0000] text-white rounded-xl text-sm font-bold">Coba Lagi</button>
        </div>
      </div>
    );
  }

  // ─── List View ────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">Rekap Nilai KPPM</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Nilai dari pembimbing akademik dan mentor perusahaan</p>
          </div>
          <nav className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
            <span className="text-gray-500 dark:text-gray-400">Pendaftaran KP</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><polyline points="9,18 15,12 9,6" /></svg>
            <span className="text-[#CC0000] font-semibold">Lihat Nilai</span>
          </nav>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>

          {/* Card Header */}
          <div className="px-6 py-4 flex items-center justify-between bg-[#fafafa] dark:bg-gray-800 border-b-2 border-[#ebebeb] dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 rounded-full bg-[#CC0000]" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Daftar Nilai</span>
              {data && (
                <span className="text-xs font-semibold text-[#CC0000] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                  1
                </span>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f4f4f6] dark:bg-gray-700/50 border-b-2 border-[#e5e7eb] dark:border-gray-600">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-r border-[#e5e7eb] dark:border-gray-600">Tanggal Pengajuan</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-r border-[#e5e7eb] dark:border-gray-600">Nama Perusahaan</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-r border-[#e5e7eb] dark:border-gray-600">Posisi Jabatan</th>
                  <th className="text-right px-6 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">Tampilkan</span>
                      <select disabled className="border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 focus:outline-none cursor-not-allowed">
                        <option>10</option>
                      </select>
                      <span className="text-xs text-gray-400 font-normal">data</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {!data ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" />
                          <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <p className="text-sm font-medium text-gray-400">Belum ada data nilai</p>
                        <p className="text-xs text-gray-300">Nilai akan tampil di sini setelah pengajuan disetujui.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr className="transition-colors hover:bg-red-50/30 dark:hover:bg-red-900/10 border-b border-[#f0f0f0] dark:border-gray-700 bg-white dark:bg-gray-800">
                    <td className="px-6 py-4 border-r border-[#f0f0f0] dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {fmtDate(data.registration.submitted_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-r border-[#f0f0f0] dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {data.registration.company_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-r border-[#f0f0f0] dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {data.registration.internship_position}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setView('detail')}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-[#CC0000]/50 hover:text-[#CC0000] dark:hover:text-[#FF4444] px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                          </svg>
                          Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 flex items-center justify-between gap-3 bg-[#f4f4f6] dark:bg-gray-800 border-t-2 border-[#e5e7eb] dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {!data ? 'Tidak ada data' : 'Menampilkan 1–1 dari 1 data'}
            </p>
            <div className="flex items-center gap-1">
              <button disabled className="px-3 py-1 text-xs text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-not-allowed">
                Sebelumnya
              </button>
              {data && (
                <button className="px-3 py-1 text-xs font-bold bg-[#CC0000] text-white rounded-lg">1</button>
              )}
              <button disabled className="px-3 py-1 text-xs text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-not-allowed">
                Selanjutnya
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ─── Detail View ───────────────────────────────────────────────────────────
  const reg = data!.registration;
  const mentorGrades = data!.mentor_grades;
  const lecturerGrades = data!.lecturer_grades;

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('list')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeftIcon />
            Kembali
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Detail Rekap Nilai</h1>
            <p className="text-gray-500 text-sm mt-0.5">Nilai dari pembimbing lapangan dan pembimbing akademik</p>
          </div>
        </div>
      </div>

      {/* Info KP */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Informasi KPPM</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {[
            { label: 'Perusahaan', value: reg.company_name },
            { label: 'Posisi / Jabatan', value: reg.internship_position },
            { label: 'Pembimbing Lapang', value: `${reg.mentor_name} (${reg.mentor_position})` },
            { label: 'Dosen Pembimbing', value: reg.dosen_name },
            { label: 'Semester', value: reg.semester_code },
            { label: 'Periode KP', value: `${fmtDate(reg.internship_start)} – ${fmtDate(reg.internship_end)}` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-sm text-gray-800 dark:text-slate-200 font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Nilai Pembimbing Lapangan */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Nilai Pembimbing Lapangan</h2>
          <p className="text-xs text-gray-400 mt-0.5">Dinilai oleh: {reg.mentor_name} · {reg.mentor_position}</p>
        </div>
        {mentorGrades ? (
          <MentorGradeTable grades={mentorGrades} />
        ) : (
          <PendingSection
            title="Nilai belum diinput"
            subtitle="Pembimbing lapangan belum menginputkan nilai untuk Anda."
          />
        )}
      </div>

      {/* Nilai Pembimbing Akademik */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Nilai Pembimbing Akademik</h2>
          <p className="text-xs text-gray-400 mt-0.5">Dinilai oleh: {reg.dosen_name}</p>
        </div>
        {lecturerGrades ? (
          <LecturerGradeTable grades={lecturerGrades} />
        ) : (
          <PendingSection
            title="Nilai belum diinput"
            subtitle="Dosen pembimbing akademik belum menginputkan nilai untuk Anda."
          />
        )}
      </div>

    </div>
  );
}
