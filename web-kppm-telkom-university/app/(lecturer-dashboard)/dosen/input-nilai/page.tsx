'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getToken, getUser,
  getLecturerStudents, getLecturerGrade, submitLecturerGrade, getLecturerStudentFullGrades,
} from '@/lib/api';
import type { LecturerStudentEntry, LecturerGradeScores, StudentFullGradesData } from '@/lib/api';

// ─── Rubrik Penilaian Pembimbing Akademik ─────────────────────────────────────
type RubricOption = { value: number; label: string };

const INDICATORS: {
  field: keyof LecturerGradeScores;
  code: string;
  label: string;
  bobot: number;
  options: RubricOption[];
}[] = [
  {
    field: 'commitment',
    code: 'PLO05-CLO01',
    label: 'Komitmen terhadap tugas / pekerjaan',
    bobot: 10,
    options: [
      { value: 0,  label: 'Mahasiswa tidak dapat menyelesaikan sebagian besar tugas/pekerjaan dan laporan KP yang diberikan oleh pembimbing lapangan atau pun pembimbing akademik KP.' },
      { value: 55, label: 'Mahasiswa menyelesaikan sebagian kecil tugas/pekerjaan dan laporan KP sesuai arahan yang diberikan oleh pembimbing lapangan atau pun pembimbing akademik KP.' },
      { value: 68, label: 'Mahasiswa dapat menyelesaikan sebagain besar tugas/pekerjaan saat KP dan menyelesaikan sepenuhnya laporan KP sesuai arahan yang diberikan oleh pembimbing lapangan maupun pembimbing akademik KP namun melampaui batas waktu penugasan.' },
      { value: 80, label: 'Mahasiswa dapat menyelesaikan sepenuhnya tugas/pekerjaan saat KP maupun laporan KP sesuai arahan yang diberikan oleh pembimbing lapangan maupun pembimbing akademik KP namun melampaui batas waktu penugasan.' },
      { value: 90, label: 'Mahasiswa dapat menyelesaikan sepenuhnya tugas/pekerjaan saat KP maupun laporan KP dengan baik sesuai arahan yang diberikan oleh pembimbing lapangan maupun pembimbing akademik KP sesuai dengan batas waktu penugasan.' },
    ],
  },
  {
    field: 'planning',
    code: 'PLO07-CLO02',
    label: 'Mahasiswa mampu merencanakan penyelesaian tugas atau pekerjaan, bekerja efektif dan mandiri selama KP',
    bobot: 5,
    options: [
      { value: 0,  label: 'Mahasiswa membuat laporan rencana kegiatan dan kegiatan harian yang ditandatangani oleh pembimbing lapangan minimum 40%' },
      { value: 55, label: 'Mahasiswa membuat laporan rencana kegiatan dan kegiatan harian yang ditandatangani oleh pembimbing lapangan minimum 60%' },
      { value: 68, label: 'Mahasiswa membuat laporan rencana kegiatan dan kegiatan harian yang ditandatangani oleh pembimbing lapangan minimum 80%' },
      { value: 80, label: 'Mahasiswa membuat laporan rencana kegiatan dan kegiatan harian yang ditandatangani oleh pembimbing lapangan minimum 90%' },
      { value: 90, label: 'Mahasiswa membuat laporan rencana kegiatan dan kegiatan harian yang ditandatangani oleh pembimbing lapangan minimum 100%' },
    ],
  },
  {
    field: 'guidance',
    code: 'PLO05-CLO04a',
    label: 'Frekuensi bimbingan dengan pembimbing akademik',
    bobot: 5,
    options: [
      { value: 68, label: 'Frekuensi bimbingan dengan pembimbing Akademik 1 kali' },
      { value: 80, label: 'Frekuensi bimbingan dengan pembimbing Akademik 2 kali' },
      { value: 90, label: 'Frekuensi bimbingan dengan pembimbing Akademik lebih dari 2 kali' },
    ],
  },
  {
    field: 'presentation',
    code: 'PLO05-CLO04b',
    label: 'Kualitas Presentasi',
    bobot: 15,
    options: [
      { value: 0,  label: 'File presentasi tidak menarik (plain slide, full tulisan), tidak menguasai materi presentasi (hanya membaca), tidak mengerti ketika diajukan pertanyaan.' },
      { value: 55, label: 'File presentasi kurang menarik, menguasai materi presentasi (tenang dan percaya diri), tidak mengerti ketika diajukan pertanyaan.' },
      { value: 68, label: 'File presentasi cukup menarik (animasi, gambar), menguasai materi presentasi (tenang dan percaya diri), tidak mengerti ketika diajukan pertanyaan.' },
      { value: 80, label: 'File presentasi cukup menarik (animasi, gambar), menguasai materi presentasi (tenang dan percaya diri), dapat mengerti pertanyaan namun kurang menjawab pertanyaan dengan baik.' },
      { value: 90, label: 'File presentasi sangat menarik (animasi, gambar), menguasai materi presentasi (tenang dan percaya diri), dapat mengerti pertanyaan dan menjawab pertanyaan dengan baik.' },
    ],
  },
  {
    field: 'report',
    code: 'PLO05-CLO04c',
    label: 'Kualitas Laporan KP',
    bobot: 10,
    options: [
      { value: 0,  label: 'Laporan KP tersusun tidak terstruktur (tidak mengikuti kaidah-kaidah penulisan di dalam buku pedoman KP), tidak rapi, dan sulit dimengerti.' },
      { value: 55, label: 'Laporan KP tersusun kurang terstruktur, kurang rapi, dan sulit dimengerti.' },
      { value: 68, label: 'Laporan KP tersusun cukup terstruktur, kurang dapat mengelaborasi kondisi yang didapat di lapangan dengan materi yang telah didapat diperkuliahan, cukup rapi, dan cukup dapat dimengerti.' },
      { value: 80, label: 'Laporan KP tersusun cukup terstruktur, kurang dapat mengelaborasi kondisi yang didapat di lapangan dengan materi yang telah didapat diperkuliahan, sangat rapi, dan cukup dapat dimengerti.' },
      { value: 90, label: 'Laporan KP tersusun terstruktur dengan baik, dapat mengelaborasi kondisi yang didapat di lapangan dengan materi yang telah didapat diperkuliahan, sangat rapi, dan mudah dimengerti.' },
    ],
  },
  {
    field: 'identification',
    code: 'PLO01-CLO05 PA',
    label: 'Identifikasi dan Formulasi Masalah',
    bobot: 10,
    options: [
      { value: 0,  label: 'Mahasiswa tidak mampu menyebutkan masalah yang ada di tempat KP (hanya mengungkapkan kegiatan atau proses selama KP).' },
      { value: 55, label: 'Mahasiswa dapat menyebutkan masalah yang ada di tempat KP menggunakan perspektif umum.' },
      { value: 68, label: 'Mahasiswa dapat mengidentifikasi masalah yang ada di tempat KP menggunakan perspektif ilmu yang dipelajari di program studinya.' },
      { value: 80, label: 'Mahasiswa dapat mengidentifikasi faktor-faktor penyebab masalah yang ada di tempat KP menggunakan perspektif ilmu yang dipelajari di program studinya.' },
      { value: 90, label: 'Mahasiswa dapat memformulasikan akar masalah di tempat KP dengan baik menggunakan metode analisis yang dipelajari di program studinya.' },
    ],
  },
];

const TOTAL_BOBOT = INDICATORS.reduce((s, i) => s + i.bobot, 0);
const UNSET = -1;

const EMPTY_SCORES: LecturerGradeScores = {
  commitment: UNSET, planning: UNSET, guidance: UNSET,
  presentation: UNSET, report: UNSET, identification: UNSET,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcTotal(scores: LecturerGradeScores): number {
  return INDICATORS.reduce((sum, ind) => {
    const v = scores[ind.field];
    return sum + (v !== UNSET ? (ind.bobot / 100) * v : 0);
  }, 0);
}

function getGrade(total: number): { label: string; color: string } {
  if (total >= 85) return { label: 'A', color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30' };
  if (total >= 70) return { label: 'B', color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30' };
  if (total >= 55) return { label: 'C', color: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30' };
  if (total >= 40) return { label: 'D', color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30' };
  return { label: 'E', color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30' };
}

function normalizeStoredScore(value: number, field: keyof LecturerGradeScores): number {
  const ind = INDICATORS.find(i => i.field === field);
  if (!ind) return UNSET;
  const found = ind.options.find(o => o.value === value);
  return found ? value : UNSET;
}

// ─── Rubric Card ──────────────────────────────────────────────────────────────
function RubricCard({ option, selected, onSelect }: {
  option: RubricOption; selected: boolean; onSelect: () => void;
}) {
  const scoreColor =
    option.value >= 80 ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' :
    option.value >= 68 ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' :
    option.value >= 55 ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' :
                         'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all duration-150 flex items-start gap-3 ${
        selected
          ? 'border-[#CC0000] bg-red-50/70 dark:bg-red-900/20 shadow-sm'
          : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800'
      }`}
    >
      <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
        selected ? 'border-[#CC0000] bg-[#CC0000]' : 'border-gray-300 dark:border-slate-600'
      }`}>
        {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
      </span>
      <span className="flex-1 text-sm text-gray-700 dark:text-slate-300 leading-snug">{option.label}</span>
      <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-lg border ${scoreColor}`}>{option.value}</span>
    </button>
  );
}

// ─── Grade Form Modal ─────────────────────────────────────────────────────────
function GradeForm({ student, onClose, onSaved }: {
  student: LecturerStudentEntry; onClose: () => void; onSaved: () => void;
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
          setScores({
            commitment:     normalizeStoredScore(res.data.scores.commitment,     'commitment'),
            planning:       normalizeStoredScore(res.data.scores.planning,       'planning'),
            guidance:       normalizeStoredScore(res.data.scores.guidance,       'guidance'),
            presentation:   normalizeStoredScore(res.data.scores.presentation,   'presentation'),
            report:         normalizeStoredScore(res.data.scores.report,         'report'),
            identification: normalizeStoredScore(res.data.scores.identification, 'identification'),
          });
          setAlreadyGraded(true);
        }
      } catch { /* no existing grade */ }
      finally { setLoading(false); }
    };
    load();
  }, [student.registration_id]);

  const handleSelect = (field: keyof LecturerGradeScores, value: number) =>
    setScores(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    const unset = INDICATORS.filter(ind => scores[ind.field] === UNSET);
    if (unset.length > 0) {
      setError(`Pilih deskripsi untuk: ${unset.map(i => i.code).join(', ')}`);
      return;
    }
    setError(''); setSuccess(''); setSaving(true);
    try {
      const res = await submitLecturerGrade(student.registration_id, scores);
      if (res.success) {
        setSuccess('Nilai berhasil disimpan!');
        setAlreadyGraded(true);
        setTimeout(() => { onSaved(); onClose(); }, 1200);
      } else { setError(res.message || 'Gagal menyimpan nilai.'); }
    } catch { setError('Tidak dapat terhubung ke server.'); }
    finally { setSaving(false); }
  };

  const allSelected = INDICATORS.every(ind => scores[ind.field] !== UNSET);
  const total = calcTotal(scores);
  const grade = getGrade(total);
  const selectedCount = INDICATORS.filter(ind => scores[ind.field] !== UNSET).length;
  const initials = student.student_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl border dark:border-slate-700 mb-8">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#CC0000] to-[#990000] rounded-t-3xl px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-red-200 text-xs font-semibold mb-0.5">Form Penilaian Pembimbing Akademik KPPM</p>
              <h2 className="text-xl font-extrabold">Input Nilai Mahasiswa</h2>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none mt-1">&times;</button>
          </div>
          <div className="mt-4 bg-white/10 border border-white/15 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-sm font-extrabold flex-shrink-0">{initials}</div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{student.student_name}</p>
              <p className="text-red-200 text-xs">NIM: {student.nim} · {student.student_class} · {student.company_name}</p>
            </div>
            {alreadyGraded && (
              <span className="ml-auto flex-shrink-0 text-[11px] bg-yellow-400/20 text-yellow-200 border border-yellow-300/30 px-2.5 py-1 rounded-full font-semibold">Edit Nilai</span>
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
              {/* Progress */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs text-gray-500 dark:text-slate-400">Pilih satu deskripsi untuk setiap kriteria penilaian.</p>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  allSelected ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                }`}>{selectedCount} / {INDICATORS.length} dipilih</span>
              </div>

              {/* Rubric criteria */}
              <div className="space-y-6">
                {INDICATORS.map((ind, idx) => {
                  const selected = scores[ind.field];
                  const isDone = selected !== UNSET;
                  return (
                    <div key={ind.field} className={`rounded-2xl border p-4 transition-colors ${
                      isDone ? 'border-[#CC0000]/30 bg-red-50/30 dark:bg-red-900/10 dark:border-red-800/40' : 'border-gray-100 dark:border-slate-700'
                    }`}>
                      <div className="flex items-start gap-2 mb-3">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#CC0000]/10 dark:bg-red-900/40 text-[#CC0000] dark:text-red-400 text-[11px] font-extrabold flex items-center justify-center mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{ind.code} &nbsp;·&nbsp; Bobot {ind.bobot}%</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-slate-100 leading-snug">{ind.label}</p>
                        </div>
                        {isDone && (
                          <span className="flex-shrink-0 text-xs font-bold text-[#CC0000] bg-red-50 dark:bg-red-900/30 border border-[#CC0000]/20 px-2 py-0.5 rounded-lg">Nilai: {selected}</span>
                        )}
                      </div>
                      <div className="space-y-2 pl-7">
                        {ind.options.map(opt => (
                          <RubricCard
                            key={opt.value}
                            option={opt}
                            selected={selected === opt.value}
                            onSelect={() => handleSelect(ind.field, opt.value)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              {allSelected && (
                <div className="mt-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl px-5 py-4 flex items-center justify-between border border-gray-200 dark:border-slate-600">
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold">Total Nilai PA</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">Bobot total: {TOTAL_BOBOT}%</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-extrabold text-gray-900 dark:text-slate-100">{total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-xl px-3 py-2">{error}</p>}
              {success && <p className="mt-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-xl px-3 py-2">{success}</p>}

              <div className="mt-5 flex gap-3">
                <button onClick={onClose} className="flex-1 px-4 py-3 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-2xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Batal</button>
                <button
                  onClick={handleSubmit}
                  disabled={saving || !allSelected}
                  className="flex-1 px-4 py-3 bg-[#CC0000] text-white rounded-2xl text-sm font-bold hover:bg-[#A30000] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menyimpan...</> : alreadyGraded ? 'Perbarui Nilai' : 'Simpan Nilai'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Grade Detail Modal ───────────────────────────────────────────────────────
function ScoreBadge({ value }: { value: number }) {
  const color =
    value >= 85 ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' :
    value >= 70 ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' :
    value >= 55 ? 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800' :
    value >= 40 ? 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800' :
                  'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-sm font-bold border ${color}`}>
      {value}
    </span>
  );
}

const MENTOR_INDICATORS: { key: string; label: string; bobot: number }[] = [
  { key: 'attendance',      label: 'Kehadiran tepat waktu',                                                           bobot: 5  },
  { key: 'discipline',      label: 'Kedisiplinan (kesesuaian dengan aturan)',                                         bobot: 5  },
  { key: 'commitment',      label: 'Komitmen terhadap tugas / pekerjaan',                                            bobot: 5  },
  { key: 'planning',        label: 'Merencanakan penyelesaian tugas, bekerja efektif dan mandiri selama KP',         bobot: 5  },
  { key: 'teamwork',        label: 'Bekerja sama dalam tim organisasi / perusahaan selama KP',                       bobot: 10 },
  { key: 'guidance',        label: 'Frekuensi bimbingan dengan pembimbing lapang',                                   bobot: 5  },
  { key: 'report',          label: 'Kualitas laporan',                                                               bobot: 5  },
  { key: 'problem_solving', label: 'Identifikasi dan Formulasi Masalah',                                             bobot: 5  },
];

function fmtDate(d: string | null | undefined): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function GradeTable({
  title,
  rows,
  totalBobot,
  total,
  updatedAt,
}: {
  title: string;
  rows: { no: number; code?: string; label: string; bobot: number; value: number }[];
  totalBobot: number;
  total: number;
  updatedAt?: string | null;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-3">{title}</h3>
      <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-[11px] uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
              <th className="px-4 py-2.5 text-center w-8">No</th>
              <th className="px-4 py-2.5 text-left">Indikator Penilaian</th>
              <th className="px-4 py-2.5 text-center w-20">Bobot (%)</th>
              <th className="px-4 py-2.5 text-center w-24">Nilai</th>
              <th className="px-4 py-2.5 text-center w-28">Bobot × Nilai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
            {rows.map((row) => {
              const contrib = (row.bobot / 100) * row.value;
              return (
                <tr key={row.no} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-center text-gray-400 dark:text-slate-500 text-xs">{row.no}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-slate-300 text-xs leading-snug">
                    {row.code && <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase block mb-0.5">{row.code}</span>}
                    {row.label}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-bold text-[#CC0000] bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-lg">{row.bobot}</span>
                  </td>
                  <td className="px-4 py-3 text-center"><ScoreBadge value={row.value} /></td>
                  <td className="px-4 py-3 text-center text-gray-700 dark:text-slate-200 font-semibold">{contrib.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-slate-800 border-t-2 border-gray-200 dark:border-slate-700">
              <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-700 dark:text-slate-300 text-sm">
                Total Nilai
                <span className="ml-2 text-xs text-gray-400 font-normal">(Bobot total: {totalBobot}%)</span>
              </td>
              <td className="px-4 py-3 text-center" />
              <td className="px-4 py-3 text-center">
                <span className="text-xl font-extrabold text-[#CC0000]">{total.toFixed(2)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {updatedAt && (
        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1.5 px-1">Diperbarui: {fmtDate(updatedAt)}</p>
      )}
    </div>
  );
}

function PendingSection({ title }: { title: string }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-3">{title}</h3>
      <div className="flex items-center gap-4 py-4 px-5 bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-200 dark:border-slate-700 rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400">Nilai dari {title} belum diinput.</p>
      </div>
    </div>
  );
}

function GradeDetailModal({
  student,
  onClose,
}: {
  student: LecturerStudentEntry;
  onClose: () => void;
}) {
  const [data, setData] = useState<StudentFullGradesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getLecturerStudentFullGrades(student.registration_id);
        if (res.success && res.data) setData(res.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [student.registration_id]);

  const initials = student.student_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  // Build PA rows
  const paRows = data?.lecturer_grades
    ? INDICATORS.map((ind, i) => ({
        no: i + 1, code: ind.code, label: ind.label, bobot: ind.bobot,
        value: (data.lecturer_grades as any)[ind.field] as number,
      }))
    : null;
  const paTotalBobot = INDICATORS.reduce((s, i) => s + i.bobot, 0);

  // Build Mentor rows
  const mentorRows = data?.mentor_grades
    ? MENTOR_INDICATORS.map((ind, i) => ({
        no: i + 1, label: ind.label, bobot: ind.bobot,
        value: (data.mentor_grades as any)[ind.key] as number,
      }))
    : null;
  const mentorTotalBobot = MENTOR_INDICATORS.reduce((s, i) => s + i.bobot, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl border dark:border-slate-700 mb-8">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#CC0000] to-[#990000] rounded-t-3xl px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-red-200 text-xs font-semibold mb-0.5">Rekap Nilai Lengkap — KPPM</p>
              <h2 className="text-xl font-extrabold">Detail Nilai Mahasiswa</h2>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none mt-1">&times;</button>
          </div>
          <div className="mt-4 bg-white/10 border border-white/15 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-sm font-extrabold flex-shrink-0">{initials}</div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{student.student_name}</p>
              <p className="text-red-200 text-xs">NIM: {student.nim} · {student.student_class} · {student.company_name}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#CC0000] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* PA Table */}
              {paRows && data?.lecturer_grades ? (
                <GradeTable
                  title="Nilai Pembimbing Akademik (PA)"
                  rows={paRows}
                  totalBobot={paTotalBobot}
                  total={data.lecturer_grades.total}
                  updatedAt={data.lecturer_grades.updated_at}
                />
              ) : (
                <PendingSection title="Pembimbing Akademik" />
              )}

              {/* Divider */}
              <div className="border-t border-gray-100 dark:border-slate-700" />

              {/* Mentor Table */}
              {mentorRows && data?.mentor_grades ? (
                <GradeTable
                  title="Nilai Pembimbing Lapang / Mentor"
                  rows={mentorRows}
                  totalBobot={mentorTotalBobot}
                  total={data.mentor_grades.total}
                  updatedAt={data.mentor_grades.updated_at}
                />
              ) : (
                <PendingSection title="Pembimbing Lapang / Mentor" />
              )}

              {/* Akumulasi Total */}
              {(data?.lecturer_grades || data?.mentor_grades) && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-gray-200 dark:border-slate-600 px-5 py-4">
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Akumulasi Total Nilai</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 text-center bg-white dark:bg-slate-900 rounded-xl py-3 border border-gray-100 dark:border-slate-700">
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold mb-1">Nilai PA</p>
                      <p className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">
                        {data.lecturer_grades ? data.lecturer_grades.total.toFixed(2) : <span className="text-gray-300 dark:text-slate-600 text-base">—</span>}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-gray-300 dark:text-slate-600">+</span>
                    <div className="flex-1 text-center bg-white dark:bg-slate-900 rounded-xl py-3 border border-gray-100 dark:border-slate-700">
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold mb-1">Nilai Mentor</p>
                      <p className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">
                        {data.mentor_grades ? data.mentor_grades.total.toFixed(2) : <span className="text-gray-300 dark:text-slate-600 text-base">—</span>}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-gray-300 dark:text-slate-600">=</span>
                    <div className="flex-1 text-center bg-[#CC0000]/5 dark:bg-red-900/20 rounded-xl py-3 border border-[#CC0000]/20 dark:border-red-800/40">
                      <p className="text-[10px] text-[#CC0000] dark:text-red-400 font-semibold mb-1">Total Gabungan</p>
                      <p className="text-2xl font-extrabold text-[#CC0000]">
                        {((data.lecturer_grades?.total ?? 0) + (data.mentor_grades?.total ?? 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Close */}
              <button
                onClick={onClose}
                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-2xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >Tutup</button>
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

function StudentRow({ student, idx, gradeMap, onOpenForm, onOpenDetail }: {
  student: LecturerStudentEntry; idx: number;
  gradeMap: Record<number, { total: number; avg: number } | null>;
  onOpenForm: (s: LecturerStudentEntry) => void;
  onOpenDetail: (s: LecturerStudentEntry) => void;
}) {
  const initials = student.student_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const entry = gradeMap[student.registration_id];
  const hasGrade = entry !== null && entry !== undefined;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>{initials}</div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 dark:text-slate-100 text-sm truncate">{student.student_name}</p>
        <p className="text-gray-400 dark:text-slate-500 text-xs mt-0.5">NIM: {student.nim} · {student.student_class}</p>
        <p className="text-gray-400 dark:text-slate-500 text-xs truncate">{student.company_name} — {student.internship_position}</p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-3">
        {hasGrade ? (
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold mb-0.5">Nilai PA</p>
              <span className="text-lg font-extrabold text-gray-800 dark:text-slate-100">{entry!.total.toFixed(2)}</span>
            </div>
            <div className="w-px bg-gray-100 dark:bg-slate-700" />
            <div>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold mb-0.5">Rata-rata</p>
              <span className="text-lg font-extrabold text-gray-800 dark:text-slate-100">{entry!.avg.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800 border border-dashed border-gray-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">Belum dinilai</span>
        )}
        <button
          onClick={() => onOpenForm(student)}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            hasGrade ? 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700' : 'bg-[#CC0000] text-white hover:bg-[#A30000] shadow-sm'
          }`}
        >{hasGrade ? 'Edit' : 'Input Nilai'}</button>
        {hasGrade && (
          <button
            onClick={() => onOpenDetail(student)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-100 dark:border-blue-800/50"
          >Detail Nilai</button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DosenInputNilaiPage() {
  const router = useRouter();
  const [students, setStudents] = useState<LecturerStudentEntry[]>([]);
  const [gradeMap, setGradeMap] = useState<Record<number, { total: number; avg: number } | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStudent, setActiveStudent] = useState<LecturerStudentEntry | null>(null);
  const [detailStudent, setDetailStudent] = useState<LecturerStudentEntry | null>(null);

  const approvedStudents = students.filter(s => s.status === 'approved');

  const loadGrades = async (list: LecturerStudentEntry[]) => {
    const map: Record<number, { total: number; avg: number } | null> = {};
    await Promise.all(list.map(async (s) => {
      try {
        const r = await getLecturerGrade(s.registration_id);
        if (r.success && r.data) {
          const sc = r.data.scores;
          const vals = Object.values(sc) as number[];
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
          map[s.registration_id] = { total: r.data.total_nilai_pa, avg };
        } else {
          map[s.registration_id] = null;
        }
      } catch { map[s.registration_id] = null; }
    }));
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
        } else { setError(res.message || 'Gagal memuat data.'); }
      } catch { setError('Tidak dapat terhubung ke server backend.'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [router]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-64 p-8">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#CC0000] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 dark:text-slate-400 text-sm">Memuat data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-6 max-w-lg mx-auto mt-8">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
        <p className="text-red-700 dark:text-red-400 font-semibold mb-3">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#CC0000] text-white rounded-xl text-sm font-bold">Coba Lagi</button>
      </div>
    </div>
  );

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">Input Nilai Mahasiswa</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Form Penilaian Pembimbing Akademik (PA) — KPPM Telkom University</p>
      </div>

      {students.length > 0 && approvedStudents.length < students.length && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl px-4 py-3 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <span>i</span>
          <span>Hanya mahasiswa dengan status <strong>Disetujui</strong> yang dapat dinilai. {students.length - approvedStudents.length} mahasiswa lainnya masih menunggu persetujuan.</span>
        </div>
      )}

      {approvedStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-10 text-center">
          <div className="w-14 h-14 bg-purple-50 dark:bg-purple-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-slate-400 font-semibold text-sm">Belum ada mahasiswa yang bisa dinilai</p>
          <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">Mahasiswa akan muncul di sini setelah pengajuan KPPM-nya disetujui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvedStudents.map((student, idx) => (
            <StudentRow
              key={student.registration_id}
              student={student} idx={idx} gradeMap={gradeMap}
              onOpenForm={(s) => setActiveStudent(s)}
              onOpenDetail={(s) => setDetailStudent(s)}
            />
          ))}
        </div>
      )}

      {activeStudent && (
        <GradeForm student={activeStudent} onClose={() => setActiveStudent(null)} onSaved={() => loadGrades(approvedStudents)} />
      )}
      {detailStudent && (
        <GradeDetailModal student={detailStudent} onClose={() => setDetailStudent(null)} />
      )}
    </div>
  );
}
