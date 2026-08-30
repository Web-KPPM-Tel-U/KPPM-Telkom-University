'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getToken, getUser,
  getMentorDashboard, getMentorGrade, submitMentorGrade,
} from '@/lib/api';
import type { MentorDashboardData, MentorMentee, MentorGradeScores } from '@/lib/api';

// ─── Indikator Penilaian ─────────────────────────────────────────────────────
type RubricOption = { value: number; label: string };

const INDICATORS: {
  field: keyof MentorGradeScores;
  code: string;
  label: string;
  bobot: number;
  options: RubricOption[];
}[] = [
  {
    field: 'attendance',
    code: 'PLO05-CLO01',
    label: 'Kehadiran Tepat Waktu',
    bobot: 5,
    options: [
      { value: 0, label: 'Mahasiswa hadir tepat waktu saat pembekalan KP, dan kehadiran tepat waktu di tempat KP kurang dari 20% kehadiran yang seharusnya.' },
      { value: 55, label: 'Mahasiswa hadir tepat waktu saat pembekalan KP, dan kehadiran tepat waktu di tempat KP mencapai 40% kehadiran yang seharusnya.' },
      { value: 68, label: 'Mahasiswa hadir tepat waktu saat pembekalan KP, dan kehadiran tepat waktu di tempat KP mencapai 60% kehadiran yang seharusnya.' },
      { value: 80, label: 'Mahasiswa hadir tepat waktu saat pembekalan KP, dan kehadiran tepat waktu di tempat KP mencapai 80% kehadiran yang seharusnya.' },
      { value: 90, label: 'Mahasiswa hadir tepat waktu saat pembekalan KP, dan kehadiran tepat waktu di tempat KP lebih dari 80% kehadiran yang seharusnya.' }
    ]
  },
  {
    field: 'discipline',
    code: 'PLO05-CLO01',
    label: 'Kedisiplinan (kesesuaian dengan aturan)',
    bobot: 5,
    options: [
      { value: 0, label: 'Mahasiswa tidak mengetahui prosedur dan peraturan lainnya yang berlaku di tempat KP serta sering tidak disiplin menjalankan penugasan dari pembimbing lapangan atau pun pembimbing akademik KP.' },
      { value: 55, label: 'Mahasiswa tidak mengetahui prosedur dan peraturan lainnya yang berlaku di tempat KP namun disiplin menjalankan penugasan dari pembimbing lapangan atau pun pembimbing akademik KP.' },
      { value: 68, label: 'Mahasiswa mengetahui sebagaian kecil prosedur dan peraturan lainnya yang berlaku di tempat kerja praktek dan mematuhinya, serta disiplin menjalankan penugasan dari pembimbing lapangan atau pun pembimbing akademik KP.' },
      { value: 80, label: 'Mahasiswa mengetahui sebagaian besar prosedur dan peraturan lainnya yang berlaku di tempat KP dan mematuhinya, serta disiplin menjalankan penugasan dari pembimbing lapangan atau pun pembimbing akademik KP.' },
      { value: 90, label: 'Mahasiswa mengetahui sepenuhnya prosedur dan peraturan lainnya yang berlaku di tempat KP dan mematuhinya serta disiplin menjalankan penugasan dari pembimbing lapangan atau pun pembimbing akademik KP.' }
    ]
  },
  {
    field: 'commitment',
    code: 'PLO05-CLO01',
    label: 'Komitmen terhadap tugas / pekerjaan',
    bobot: 5,
    options: [
      { value: 0, label: 'Mahasiswa tidak dapat menyelesaikan sebagian besar tugas/ pekerjaan dan laporan KP yang diberikan oleh pembimbing lapangan atau pun pembimbing akademik KP.' },
      { value: 55, label: 'Mahasiswa menyelesaikan sebagian kecil tugas/pekerjaan dan laporan KP sesuai arahan yang diberikan oleh pembimbing lapangan atau pun pembimbing akademik KP.' },
      { value: 68, label: 'Mahasiswa dapat menyelesaikan sebagain besar tugas/ pekerjaan saat KP dan menyelesaikan sepenuhnya laporan KP sesuai arahan yang diberikan oleh pembimbing lapangan maupun pembimbing akademik KP namun melampaui batas waktu penugasan.' },
      { value: 80, label: 'Mahasiswa dapat menyelesaikan sepenuhnya tugas/ pekerjaan saat KP maupun laporan KP sesuai arahan yang diberikan oleh pembimbing lapangan maupun pembimbing akademik KP namun melampaui batas waktu penugasan.' },
      { value: 90, label: 'Mahasiswa dapat menyelesaikan sepenuhnya tugas/ pekerjaan saat KP maupun laporan KP dengan baik sesuai arahan yang diberikan oleh pembimbing lapangan maupun pembimbing akademik KP sesuai dengan batas waktu penugasan.' }
    ]
  },
  {
    field: 'planning',
    code: 'PLO07-CLO02',
    label: 'Mahasiswa mampu merencanakan penyelesaian tugas atau pekerjaan, bekerja efektif dan mandiri selama KP',
    bobot: 10,
    options: [
      { value: 0, label: 'Mahasiswa membuat laporan rencana kegiatan dan kegiatan harian yang ditandatangi oleh pembimbing lapangan minimum 40%' },
      { value: 55, label: 'Mahasiswa membuat laporan rencana kegiatan dan kegiatan harian yang ditandatangi oleh pembimbing lapangan minimum 60%' },
      { value: 68, label: 'Mahasiswa membuat laporan rencana kegiatan dan kegiatan harian yang ditandatangi oleh pembimbing lapangan minimum 80%' },
      { value: 80, label: 'Mahasiswa membuat laporan rencana kegiatan dan kegiatan harian yang ditandatangi oleh pembimbing lapangan minimum 90%' },
      { value: 90, label: 'Mahasiswa membuat laporan rencana kegiatan dan kegiatan harian yang ditandatangi oleh pembimbing lapangan 100%' }
    ]
  },
  {
    field: 'teamwork',
    code: 'PLO03-CLO03',
    label: 'Mahasiswa mampu bekerjasama di dalam tim organisasi/perusahaan selama KP',
    bobot: 5,
    options: [
      { value: 0, label: 'Mahasiswa tidak mampu mengerjakan penugasan KP serta menolak untuk bekerjasama dengan tim (penempatan KPPM)' },
      { value: 55, label: 'Mahasiswa mengerjakan penugasan KP namun tidak aktif bekerjasama dengan tim (penempatan KPPM)' },
      { value: 68, label: 'Mahasiswa mengerjakan penugasan KP namun kurang aktif bekerjasama dengan tim (penempatan KPPM)' },
      { value: 80, label: 'Mahasiswa mengerjakan penugasan KP dan aktif bekerjasama dengan tim (penempatan KPPM)' },
      { value: 90, label: 'Mahasiswa mengerjakan penugasan KP dengan sangat baik dan memilki inisiatif untuk melakukan kolaborasi dan bekerjasama dengan tim (divisi tempat KP)' }
    ]
  },
  {
    field: 'guidance',
    code: 'PLO05-CLO04',
    label: 'Frekuensi bimbingan dengan pembimbing lapangan / Mentor',
    bobot: 5,
    options: [
      { value: 0, label: 'Frekuensi bimbingan dengan pembimbing lapangan <=1 kali' },
      { value: 55, label: 'Frekuensi bimbingan dengan pembimbing lapangan 2 kali' },
      { value: 68, label: 'Frekuensi bimbingan dengan pembimbing lapangan 3-4 kali' },
      { value: 80, label: 'Frekuensi bimbingan dengan pembimbing lapangan 5-6 kali' },
      { value: 90, label: 'Frekuensi bimbingan dengan pembimbing lapangan > 6 kali' }
    ]
  },
  {
    field: 'report',
    code: 'PLO05-CLO04',
    label: 'Kualitas Laporan',
    bobot: 5,
    options: [
      { value: 0, label: 'Laporan KP tersusun tidak terstruktur (tidak mengikuti kaidah-kaidah penulisan di dalam buku pedoman KP), tidak rapi, dan sulit dimengerti' },
      { value: 55, label: 'Laporan KP tersusun kurang terstruktur, kurang rapi, dan sulit dimengerti' },
      { value: 68, label: 'Laporan KP tersusun cukup terstruktur, kurang dapat mengelaborasi kondisi yang didapat di lapangan dengan materi yang telah didapat diperkuliahan, cukup rapi, dan cukup dapat dimengerti' },
      { value: 80, label: 'Laporan KP tersusun cukup terstruktur, kurang dapat mengelaborasi kondisi yang didapat di lapangan dengan materi yang telah didapat diperkuliahan, sangat rapi, dan cukup dapat dimengerti' },
      { value: 90, label: 'Laporan KP tersusun terstruktur dengan baik, dapat mengelaborasi kondisi yang didapat di lapangan dengan materi yang telah didapat diperkuliahan, sangat rapi, dan mudah dimengerti' }
    ]
  },
  {
    field: 'problem_solving',
    code: 'PLO01-CLO05 PA',
    label: 'Identifikasi dan Formulasi Masalah',
    bobot: 5,
    options: [
      { value: 0, label: 'Mahasiswa tidak mampu menyebutkan masalah yang ada di tempat KP (hanya mengungkapkan kegiatan aatau proses selama KP)' },
      { value: 55, label: 'Mahasiswa dapat menyebutkan masalah yang ada di tempat KP menggunakan perspektif umum' },
      { value: 68, label: 'Mahasiswa dapat mengidentifikasi masalah yang ada di tempat KP menggunakan perspektif ilmu yang dipelajari di program studinya' },
      { value: 80, label: 'Mahasiswa dapat mengidentifikasi faktor-faktor penyebab masalah yang ada di tempat KP menggunakan perspektif ilmu yang dipelajari di program studinya' },
      { value: 90, label: 'Mahasiswa dapat memformulasikan akar masalah di tempat KP dengan baik menggunakan metode analisis yang dipelajari di program studinya' }
    ]
  }
];

const TOTAL_BOBOT = INDICATORS.reduce((s, i) => s + i.bobot, 0);
const UNSET = -1;

const EMPTY_SCORES: MentorGradeScores = {
  attendance: UNSET, discipline: UNSET, commitment: UNSET, planning: UNSET,
  teamwork: UNSET, guidance: UNSET, report: UNSET, problem_solving: UNSET,
};

// ─── Helper ──────────────────────────────────────────────────────────────────
function calcTotal(scores: MentorGradeScores): number {
  return INDICATORS.reduce((sum, ind) => {
    const v = scores[ind.field];
    return sum + (v !== UNSET ? (ind.bobot / 100) * v : 0);
  }, 0);
}

function normalizeStoredScore(value: number, field: keyof MentorGradeScores): number {
  const ind = INDICATORS.find(i => i.field === field);
  if (!ind) return UNSET;
  const found = ind.options.find(o => o.value === value);
  return found ? value : UNSET;
}

function RubricCard({ option, selected, onSelect }: { option: RubricOption; selected: boolean; onSelect: () => void }) {
  const scoreColor =
    option.value >= 85 ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' :
      option.value >= 70 ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' :
        option.value >= 55 ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' :
          'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-150 flex items-start gap-2 sm:gap-3 ${selected
        ? 'border-[#CC0000] bg-red-50/70 dark:bg-red-900/20 shadow-sm'
        : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800'
        }`}
    >
      <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${selected ? 'border-[#CC0000] bg-[#CC0000]' : 'border-gray-300 dark:border-slate-600'
        }`}>
        {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
      </span>
      <span className="flex-1 text-[13px] sm:text-sm text-gray-700 dark:text-slate-300 leading-snug">{option.label}</span>
      <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-lg border ${scoreColor}`}>{option.value}</span>
    </button>
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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto min-w-[180px] flex items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-[#CC0000]/50 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]"
      >
        <div className="flex items-center gap-2">
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

// ─── Grade Form Modal ─────────────────────────────────────────────────────────
function GradeForm({
  mentee,
  onClose,
  onSaved,
}: {
  mentee: MentorMentee;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [scores, setScores] = useState<MentorGradeScores>(EMPTY_SCORES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [alreadyGraded, setAlreadyGraded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMentorGrade(mentee.registration_id);
        if (res.success && res.data) {
          setScores({
            attendance: normalizeStoredScore(res.data.scores.attendance, 'attendance'),
            discipline: normalizeStoredScore(res.data.scores.discipline, 'discipline'),
            commitment: normalizeStoredScore(res.data.scores.commitment, 'commitment'),
            planning: normalizeStoredScore(res.data.scores.planning, 'planning'),
            teamwork: normalizeStoredScore(res.data.scores.teamwork, 'teamwork'),
            guidance: normalizeStoredScore(res.data.scores.guidance, 'guidance'),
            report: normalizeStoredScore(res.data.scores.report, 'report'),
            problem_solving: normalizeStoredScore(res.data.scores.problem_solving, 'problem_solving'),
          });
          setAlreadyGraded(true);
        }
      } catch { /* no existing grade */ }
      finally { setLoading(false); }
    };
    load();
  }, [mentee.registration_id]);

  const handleSelect = (field: keyof MentorGradeScores, value: number) => {
    setScores(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const unset = INDICATORS.filter(ind => scores[ind.field] === UNSET);
    if (unset.length > 0) {
      setError(`Pilih deskripsi untuk: ${unset.map(i => i.label).join(', ')}`);
      return;
    }

    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await submitMentorGrade(mentee.registration_id, scores);
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

  const allSelected = INDICATORS.every(ind => scores[ind.field] !== UNSET);
  const selectedCount = INDICATORS.filter(ind => scores[ind.field] !== UNSET).length;
  const total = calcTotal(scores);
  const initials = mentee.student.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl border dark:border-slate-700">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#CC0000] to-[#990000] rounded-t-3xl px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-red-200 text-xs font-semibold mb-0.5">Form Penilaian Pembimbing Lapang KPPM</p>
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
              <p className="font-bold text-sm truncate">{mentee.student.name}</p>
              <p className="text-red-200 text-xs">NIM: {mentee.student.nim} · {mentee.student.class} · {mentee.company_name}</p>
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
              {/* Progress */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs text-gray-500 dark:text-slate-400">Pilih satu deskripsi untuk setiap kriteria penilaian.</p>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${allSelected ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                  }`}>{selectedCount} / {INDICATORS.length} dipilih</span>
              </div>

              {/* Rubric criteria */}
              <div className="space-y-6">
                {INDICATORS.map((ind, idx) => {
                  const selected = scores[ind.field];
                  const isDone = selected !== UNSET;
                  return (
                    <div key={ind.field} className={`rounded-2xl border p-4 transition-colors ${isDone ? 'border-[#CC0000]/30 bg-red-50/30 dark:bg-red-900/10 dark:border-red-800/40' : 'border-gray-100 dark:border-slate-700'
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
                      <div className="space-y-2 pl-0 sm:pl-7 mt-2 sm:mt-0">
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
                    <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold">Total Nilai Pembimbing Lapang</p>
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

// ─── Mentee Row ────────────────────────────────────────────────────────────────
function MenteeRow({
  mentee,
  idx,
  gradeMap,
  onOpenForm,
}: {
  mentee: MentorMentee;
  idx: number;
  gradeMap: Record<number, number | null>;
  onOpenForm: (m: MentorMentee) => void;
}) {
  const initials = mentee.student.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const total = gradeMap[mentee.registration_id];
  const hasGrade = total !== null && total !== undefined;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-4 sm:p-5">
      {/* Top: avatar + info + nilai */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 bg-[#CC0000] text-white shadow-sm">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-slate-100 text-sm break-words leading-snug">{mentee.student.name}</p>
          <p className="text-gray-400 dark:text-slate-500 text-[11px] mt-0.5">NIM: {mentee.student.nim} · {mentee.student.class}</p>
          <p className="text-gray-400 dark:text-slate-500 text-[11px] break-words">{mentee.company_name}</p>
        </div>
        {hasGrade && (
          <div className="flex-shrink-0 text-right">
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">Nilai</p>
            <span className="text-lg font-extrabold text-gray-800 dark:text-slate-100">{total!.toFixed(2)}</span>
          </div>
        )}
      </div>
      {/* Bottom: status + button */}
      <div className="flex items-center gap-2">
        {hasGrade ? (
          <span className="text-[11px] font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full">Sudah Dinilai</span>
        ) : (
          <span className="text-[11px] text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800 border border-dashed border-gray-200 dark:border-slate-700 px-2 py-0.5 rounded-full">Belum Dinilai</span>
        )}
        <button
          onClick={() => onOpenForm(mentee)}
          className={`ml-auto px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
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
export default function MentorGradesPage() {
  const router = useRouter();
  const [data, setData] = useState<MentorDashboardData | null>(null);
  const [gradeMap, setGradeMap] = useState<Record<number, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeMentee, setActiveMentee] = useState<MentorMentee | null>(null);

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'graded' | 'ungraded'>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'nim-asc' | 'grade-desc' | 'grade-asc'>('name-asc');

  const totalStudents = data?.mentees.length || 0;
  const gradedStudents = data?.mentees.filter(m => gradeMap[m.registration_id] !== null && gradeMap[m.registration_id] !== undefined).length || 0;
  const pendingStudents = totalStudents - gradedStudents;
  
  const gradedValues = data?.mentees
    .map(m => gradeMap[m.registration_id])
    .filter((val): val is number => val !== null && val !== undefined) || [];
  const averageTotalGrade = gradedValues.length > 0 
    ? gradedValues.reduce((a, b) => a + b, 0) / gradedValues.length 
    : 0;

  const processedMentees = useMemo(() => {
    if (!data) return [];
    let result = [...data.mentees];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.student.name.toLowerCase().includes(q) || 
        m.student.nim.toLowerCase().includes(q)
      );
    }

    if (filterStatus !== 'all') {
      result = result.filter(m => {
        const hasGrade = gradeMap[m.registration_id] !== null && gradeMap[m.registration_id] !== undefined;
        return filterStatus === 'graded' ? hasGrade : !hasGrade;
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.student.name.localeCompare(b.student.name);
      if (sortBy === 'name-desc') return b.student.name.localeCompare(a.student.name);
      if (sortBy === 'nim-asc') return a.student.nim.localeCompare(b.student.nim);
      if (sortBy === 'grade-desc' || sortBy === 'grade-asc') {
        const gradeA = gradeMap[a.registration_id] ?? -1;
        const gradeB = gradeMap[b.registration_id] ?? -1;
        return sortBy === 'grade-desc' ? gradeB - gradeA : gradeA - gradeB;
      }
      return 0;
    });

    return result;
  }, [data, gradeMap, searchQuery, filterStatus, sortBy]);

  const loadGrades = async (mentees: MentorMentee[]) => {
    const map: Record<number, number | null> = {};
    await Promise.all(
      mentees.map(async (m) => {
        try {
          const r = await getMentorGrade(m.registration_id);
          map[m.registration_id] = r.success && r.data ? r.data.total_nilai_lapangan : null;
        } catch {
          map[m.registration_id] = null;
        }
      })
    );
    setGradeMap(map);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }
    const user = getUser();
    if (!user || user.role !== 'mentor') { router.replace('/login'); return; }

    const fetchData = async () => {
      try {
        const res = await getMentorDashboard();
        if (res.success && res.data) {
          setData(res.data);
          await loadGrades(res.data.mentees);
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
      <div className="flex items-center justify-center min-h-64 p-8">
        <div className="text-center max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl border border-red-100 dark:border-red-900 shadow-sm">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2.5 bg-[#CC0000] text-white rounded-xl text-sm font-bold hover:bg-[#A30000] transition-colors">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500 py-6">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-br from-[#CC0000] to-[#8B0000] rounded-3xl p-5 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative z-10 flex flex-row gap-4 items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-extrabold mb-1 sm:mb-2 tracking-tight">
              Input Nilai Mahasiswa
            </h1>
            <p className="text-red-100 max-w-xl text-[11px] sm:text-sm md:text-base font-medium leading-relaxed pr-2">
              Berikan penilaian kinerja mahasiswa selama melaksanakan Kerja Praktik di instansi Anda. Penilaian Anda sangat menentukan kelulusan mereka.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl px-4 py-3 sm:p-5 flex flex-col items-center justify-center flex-shrink-0">
            <p className="text-red-200 text-[9px] sm:text-xs font-semibold mb-0.5 sm:mb-1 uppercase tracking-wider text-center">Dinilai</p>
            <div className="flex items-baseline justify-center gap-0.5 sm:gap-1">
              <span className="text-2xl sm:text-2xl md:text-xl lg:text-2xl font-bold">{gradedStudents}</span>
              <span className="text-red-200 text-[10px] sm:text-sm font-semibold">/{totalStudents}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari nama atau NIM mahasiswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000] transition-all"
          />
        </div>

        <div className="grid grid-cols-2 md:flex md:flex-row gap-3 w-full md:w-auto">
          <CustomSelect
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as any)}
            options={[
              { value: 'all', label: 'Semua Status' },
              { value: 'graded', label: 'Sudah Dinilai' },
              { value: 'ungraded', label: 'Belum Dinilai' },
            ]}
            icon={<svg className="w-4 h-4 text-[#CC0000]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>}
          />
          <CustomSelect
            value={sortBy}
            onChange={(val) => setSortBy(val as any)}
            options={[
              { value: 'name-asc', label: 'Nama (A-Z)' },
              { value: 'name-desc', label: 'Nama (Z-A)' },
              { value: 'nim-asc', label: 'NIM' },
              { value: 'grade-desc', label: 'Nilai Tertinggi' },
              { value: 'grade-asc', label: 'Nilai Terendah' },
            ]}
            icon={<svg className="w-4 h-4 text-[#CC0000]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>}
          />
        </div>
      </div>

      {/* LIST MAHASISWA */}
      {processedMentees.length > 0 ? (
        <div className="space-y-3">
          {processedMentees.map((m, i) => (
            <MenteeRow key={m.registration_id} mentee={m} idx={i} gradeMap={gradeMap} onOpenForm={setActiveMentee} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700 py-16 flex flex-col items-center justify-center text-center px-4">
          <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-2">Tidak Ada Mahasiswa Ditemukan</h3>
          <p className="text-gray-500 dark:text-slate-400 max-w-md">
            {searchQuery || filterStatus !== 'all' 
              ? 'Coba ubah kata kunci pencarian atau filter status untuk menemukan mahasiswa yang Anda cari.'
              : 'Belum ada mahasiswa bimbingan yang dialokasikan kepada Anda.'}
          </p>
          {(searchQuery || filterStatus !== 'all') && (
            <button
              onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
              className="mt-6 px-5 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-semibold rounded-xl transition-colors text-sm"
            >
              Reset Filter Pencarian
            </button>
          )}
        </div>
      )}

      {/* FORM MODAL */}
      {activeMentee && (
        <GradeForm
          mentee={activeMentee}
          onClose={() => setActiveMentee(null)}
          onSaved={() => {
            loadGrades(data?.mentees || []);
          }}
        />
      )}
    </div>
  );
}
