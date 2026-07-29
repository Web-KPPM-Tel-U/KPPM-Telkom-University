'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getToken, getUser,
  getLecturerStudents, getLecturerGrade, submitLecturerGrade,
} from '@/lib/api';
import type { LecturerStudentEntry, LecturerGradeScores } from '@/lib/api';

// ─── Indikator Penilaian Pembimbing Akademik ─────────────────────────────────
const INDICATORS: {
  field: keyof LecturerGradeScores;
  label: string;
  bobot: number;
}[] = [
  { field: 'commitment',     label: 'Komitmen terhadap tugas / pekerjaan',                                                                              bobot: 10 },
  { field: 'planning',       label: 'Mahasiswa mampu merencanakan penyelesaian tugas atau pekerjaan, bekerja efektif, dan mandiri selama KP',            bobot:  5 },
  { field: 'guidance',       label: 'Frekuensi bimbingan dengan pembimbing akademik',                                                                   bobot:  5 },
  { field: 'presentation',   label: 'Kualitas Presentasi',                                                                                              bobot: 15 },
  { field: 'report',         label: 'Kualitas Laporan KP',                                                                                             bobot: 10 },
  { field: 'identification', label: 'Identifikasi dan Formulasi Masalah',                                                                               bobot: 10 },
];

const TOTAL_BOBOT = INDICATORS.reduce((s, i) => s + i.bobot, 0);

const EMPTY_SCORES: LecturerGradeScores = {
  commitment: 0, planning: 0, guidance: 0,
  presentation: 0, report: 0, identification: 0,
};

// ─── Helper ──────────────────────────────────────────────────────────────────
function calcTotal(scores: LecturerGradeScores): number {
  return INDICATORS.reduce((sum, ind) => {
    return sum + (ind.bobot / 100) * (scores[ind.field] || 0);
  }, 0);
}

function getGrade(total: number): { label: string; color: string } {
  if (total >= 85) return { label: 'A', color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30' };
  if (total >= 70) return { label: 'B', color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30' };
  if (total >= 55) return { label: 'C', color: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30' };
  if (total >= 40) return { label: 'D', color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30' };
  return { label: 'E', color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30' };
}

// ─── Grade Form Modal ─────────────────────────────────────────────────────────
function GradeForm({
  student,
  onClose,
  onSaved,
}: {
  student: LecturerStudentEntry;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [scores, setScores] = useState<LecturerGradeScores>(EMPTY_SCORES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [alreadyGraded, setAlreadyGraded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getLecturerGrade(student.registration_id);
        if (res.success && res.data) {
          setScores(res.data.scores);
          setAlreadyGraded(true);
        }
      } catch { /* no existing grade */ }
      finally { setLoading(false); }
    };
    load();
  }, [student.registration_id]);

  const handleChange = (field: keyof LecturerGradeScores, raw: string) => {
    const val = raw === '' ? 0 : Math.min(100, Math.max(0, Number(raw)));
    setScores(prev => ({ ...prev, [field]: isNaN(val) ? 0 : val }));
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await submitLecturerGrade(student.registration_id, scores);
      if (res.success) {
        setSuccess('Nilai berhasil disimpan!');
        setAlreadyGraded(true);
        setTimeout(() => { onSaved(); onClose(); }, 1200);
      } else {
        setError(res.message || 'Gagal menyimpan nilai.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setSaving(false);
    }
  };

  const total = calcTotal(scores);
  const grade = getGrade(total);
  const initials = student.student_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl border dark:border-slate-700 mb-8">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#CC0000] to-[#990000] rounded-t-3xl px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-red-200 text-xs font-semibold mb-0.5">Form Penilaian Pembimbing Akademik KPPM</p>
              <h2 className="text-xl font-extrabold">Input Nilai Mahasiswa</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-2xl leading-none mt-1"
            >&times;</button>
          </div>

          {/* Student info strip */}
          <div className="mt-4 bg-white/10 border border-white/15 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-sm font-extrabold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{student.student_name}</p>
              <p className="text-red-200 text-xs">NIM: {student.nim} · {student.student_class} · {student.company_name}</p>
            </div>
            {alreadyGraded && (
              <span className="ml-auto flex-shrink-0 text-[11px] bg-yellow-400/20 text-yellow-200 border border-yellow-300/30 px-2.5 py-1 rounded-full font-semibold">
                Edit Nilai
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#CC0000] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Rubrik note */}
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl px-3 py-2">
                Nilai Angka diisi sesuai <strong>rubrik penilaian KPPM</strong> (skala 0–100 untuk setiap indikator).
              </p>

              {/* Tabel indikator */}
              <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-[11px] uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
                      <th className="px-3 py-2.5 text-center w-8">No</th>
                      <th className="px-3 py-2.5 text-left">Indikator Penilaian</th>
                      <th className="px-3 py-2.5 text-center w-16">Bobot (%)</th>
                      <th className="px-3 py-2.5 text-center w-28">Nilai *</th>
                      <th className="px-3 py-2.5 text-center w-28">Nilai × Bobot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                    {INDICATORS.map((ind, idx) => {
                      const contrib = (ind.bobot / 100) * (scores[ind.field] || 0);
                      return (
                        <tr key={ind.field} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-3 py-3 text-center text-gray-400 dark:text-slate-500 text-xs">{idx + 1}</td>
                          <td className="px-3 py-3 text-gray-700 dark:text-slate-300 leading-tight text-xs">{ind.label}</td>
                          <td className="px-3 py-3 text-center">
                            <span className="inline-block bg-[#CC0000]/10 dark:bg-red-900/30 text-[#CC0000] dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-lg">
                              {ind.bobot}%
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={scores[ind.field] === 0 ? '' : scores[ind.field]}
                              placeholder="0"
                              onChange={e => handleChange(ind.field, e.target.value)}
                              className="w-20 text-center border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl px-2 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] transition-all"
                            />
                          </td>
                          <td className="px-3 py-3 text-center text-gray-700 dark:text-slate-200 font-semibold text-sm">
                            {contrib > 0 ? contrib.toFixed(2) : <span className="text-gray-300 dark:text-slate-600">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-slate-800 border-t-2 border-gray-200 dark:border-slate-700">
                      <td colSpan={3} className="px-3 py-3 text-right font-bold text-gray-700 dark:text-slate-300 text-sm">
                        Total Nilai Pembimbing Akademik
                        <span className="ml-2 text-xs text-gray-400 dark:text-slate-500 font-normal">(Bobot total: {TOTAL_BOBOT}%)</span>
                      </td>
                      <td className="px-3 py-3 text-center" />
                      <td className="px-3 py-3 text-center">
                        <span className="text-lg font-extrabold text-[#CC0000]">{total.toFixed(2)}</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Feedback */}
              {error && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="mt-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-xl px-3 py-2">
                  {success}
                </p>
              )}

              {/* Action buttons */}
              <div className="mt-5 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-2xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-[#CC0000] text-white rounded-2xl text-sm font-bold hover:bg-[#A30000] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menyimpan...</>
                  ) : (
                    alreadyGraded ? 'Perbarui Nilai' : 'Simpan Nilai'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Student Row ──────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
];

function StudentRow({
  student,
  idx,
  gradeMap,
  onOpenForm,
}: {
  student: LecturerStudentEntry;
  idx: number;
  gradeMap: Record<number, number | null>;
  onOpenForm: (s: LecturerStudentEntry) => void;
}) {
  const initials = student.student_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const total = gradeMap[student.registration_id];
  const hasGrade = total !== null && total !== undefined;
  const grade = hasGrade ? getGrade(total!) : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 dark:text-slate-100 text-sm truncate">{student.student_name}</p>
        <p className="text-gray-400 dark:text-slate-500 text-xs mt-0.5">NIM: {student.nim} · {student.student_class}</p>
        <p className="text-gray-400 dark:text-slate-500 text-xs truncate">{student.company_name} — {student.internship_position}</p>
      </div>

      <div className="flex-shrink-0 flex items-center gap-3">
        {hasGrade ? (
          <div className="text-center">
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold mb-0.5">Nilai PA</p>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold text-gray-800 dark:text-slate-100">{total!.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800 border border-dashed border-gray-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
            Belum dinilai
          </span>
        )}

        <button
          onClick={() => onOpenForm(student)}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            hasGrade
              ? 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              : 'bg-[#CC0000] text-white hover:bg-[#A30000] shadow-sm'
          }`}
        >
          {hasGrade ? 'Edit' : 'Input Nilai'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DosenInputNilaiPage() {
  const router = useRouter();
  const [students, setStudents] = useState<LecturerStudentEntry[]>([]);
  const [gradeMap, setGradeMap] = useState<Record<number, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStudent, setActiveStudent] = useState<LecturerStudentEntry | null>(null);

  // Hanya tampilkan mahasiswa yang sudah disetujui (approved)
  const approvedStudents = students.filter(s => s.status === 'approved');

  const loadGrades = async (list: LecturerStudentEntry[]) => {
    const map: Record<number, number | null> = {};
    await Promise.all(
      list.map(async (s) => {
        try {
          const r = await getLecturerGrade(s.registration_id);
          map[s.registration_id] = r.success && r.data ? r.data.total_nilai_pa : null;
        } catch {
          map[s.registration_id] = null;
        }
      })
    );
    setGradeMap(map);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }
    const user = getUser();
    if (!user || user.role !== 'lecturer') { router.replace('/login'); return; }

    const fetchData = async () => {
      try {
        const res = await getLecturerStudents(200, 0);
        if (res.success && res.data) {
          setStudents(res.data);
          const approved = res.data.filter(s => s.status === 'approved');
          await loadGrades(approved);
        } else {
          setError(res.message || 'Gagal memuat data.');
        }
      } catch {
        setError('Tidak dapat terhubung ke server backend.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 p-8">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#CC0000] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400 text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <p className="text-red-700 dark:text-red-400 font-semibold mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#CC0000] text-white rounded-xl text-sm font-bold"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const gradedCount = Object.values(gradeMap).filter(v => v !== null).length;

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">Input Nilai Mahasiswa</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Form Penilaian Pembimbing Akademik (PA) — KPPM Telkom University</p>
      </div>

      {/* Info: hanya yg approved */}
      {students.length > 0 && approvedStudents.length < students.length && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl px-4 py-3 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <span>i</span>
          <span>
            Hanya mahasiswa dengan status <strong>Disetujui</strong> yang dapat dinilai.{' '}
            {students.length - approvedStudents.length} mahasiswa lainnya masih menunggu persetujuan.
          </span>
        </div>
      )}

      {/* Daftar mahasiswa */}
      {approvedStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-10 text-center">
          <div className="w-14 h-14 bg-purple-50 dark:bg-purple-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-slate-400 font-semibold text-sm">Belum ada mahasiswa yang bisa dinilai</p>
          <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">
            Mahasiswa akan muncul di sini setelah pengajuan KPPM-nya disetujui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvedStudents.map((student, idx) => (
            <StudentRow
              key={student.registration_id}
              student={student}
              idx={idx}
              gradeMap={gradeMap}
              onOpenForm={(s) => setActiveStudent(s)}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      {activeStudent && (
        <GradeForm
          student={activeStudent}
          onClose={() => setActiveStudent(null)}
          onSaved={() => {
            loadGrades(approvedStudents);
          }}
        />
      )}
    </div>
  );
}

