'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUser, getMentorDashboard } from '@/lib/api';
import type { MentorDashboardData, MentorMentee } from '@/lib/api';

// ─── Icons ────────────────────────────────────────────────────────────────────
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/>
  </svg>
);
const BriefcaseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
  </svg>
);
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(d: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat Pagi';
  if (h < 15) return 'Selamat Siang';
  if (h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

// ─── Mentee Card ─────────────────────────────────────────────────────────────
function MenteeCard({ mentee, idx }: { mentee: MentorMentee; idx: number }) {
  const [open, setOpen] = useState(false);
  const avatarColors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-green-100 text-green-700',
    'bg-amber-100 text-amber-700',
    'bg-cyan-100 text-cyan-700',
  ];
  const colorClass = avatarColors[idx % avatarColors.length];
  const initials = mentee.student.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Card Header */}
      <div className="p-5 flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold flex-shrink-0 ${colorClass}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-gray-900 text-sm">{mentee.student.name}</p>
              <p className="text-gray-400 text-xs mt-0.5">NIM: {mentee.student.nim} · {mentee.student.class}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-2.5">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <BriefcaseIcon /> {mentee.internship_position}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <CalendarIcon /> {formatDate(mentee.internship_start)} – {formatDate(mentee.internship_end)}
            </span>
          </div>
        </div>
      </div>

      {/* Toggle detail */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-2.5 text-xs font-semibold text-[#CC0000] hover:bg-red-50 border-t border-gray-100 transition-colors flex items-center justify-center gap-1.5"
      >
        {open ? '▲ Sembunyikan Detail' : '▼ Lihat Detail'}
      </button>

      {open && (
        <div className="px-5 pb-5 pt-3 border-t border-gray-50 bg-gray-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email Mahasiswa</p>
              <p className="flex items-center gap-1.5 text-xs text-gray-700 truncate" title={mentee.student.email}>
                <span className="flex-shrink-0"><MailIcon /></span>
                <span className="truncate">{mentee.student.email}</span>
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">WhatsApp</p>
              <p className="flex items-center gap-1.5 text-xs text-gray-700 truncate">
                <span className="flex-shrink-0"><PhoneIcon /></span>
                <span className="truncate">+{mentee.student.whatsapp}</span>
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Semester</p>
              <p className="text-xs text-gray-700 truncate">{mentee.semester_code}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Dosen Pembimbing</p>
              <p className="text-xs text-gray-700 truncate" title={mentee.pembimbing_akademik || '-'}>{mentee.pembimbing_akademik || '-'}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Disetujui Pada</p>
              <p className="text-xs text-gray-700 truncate">{formatDate(mentee.approved_at)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Perusahaan</p>
              <p className="text-xs text-gray-700 truncate" title={mentee.company_name}>{mentee.company_name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MentorDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<MentorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          <p className="text-gray-500 text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="text-red-700 font-semibold mb-1">Koneksi Bermasalah</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#CC0000] text-white rounded-xl text-sm font-medium hover:bg-[#A30000] transition-colors"
          >
            <RefreshIcon /> Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const mentor = data?.mentor;
  const mentees = data?.mentees || [];
  const initials = mentor?.email?.substring(0, 2).toUpperCase() || 'MT';

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-6">

      {/* ── Hero Banner ── */}
      <div className="relative bg-gradient-to-br from-[#CC0000] via-[#B00000] to-[#7A0000] rounded-3xl p-6 md:p-8 text-white overflow-hidden shadow-xl">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/5 rounded-full" />
        <div className="absolute top-6 -right-4 w-28 h-28 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 right-16 w-20 h-20 bg-white/5 rounded-full" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-red-200 text-sm font-medium mb-0.5">{getGreeting()},</p>
            <h1 className="text-2xl md:text-3xl font-extrabold">{mentor?.name || mentor?.email}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-red-100/80 text-xs">
              <span className="flex items-center gap-1"><BriefcaseIcon /> {mentor?.position || 'Mentor'} · {mentor?.company_name}</span>
              {mentor?.phone && (
                <span className="flex items-center gap-1"><PhoneIcon /> {mentor?.phone}</span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 hidden md:block">
            <div className="bg-white/10 border border-white/15 rounded-2xl px-5 py-3 text-center">
              <p className="text-red-200 text-[10px] font-semibold uppercase tracking-wider mb-1">Mahasiswa Dibimbing</p>
              <p className="text-white text-3xl font-extrabold">{data?.total_mentees ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="relative mt-5 pt-4 border-t border-white/10">
          <p className="text-red-100/60 text-xs">Portal Mentor — Sistem Manajemen KPPM Telkom University</p>
        </div>
      </div>

      {/* ── Mentee Count (mobile) ── */}
      <div className="md:hidden">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Mahasiswa Dibimbing</p>
          <p className="text-4xl font-extrabold text-[#CC0000]">{data?.total_mentees ?? 0}</p>
        </div>
      </div>

      {/* ── Info Mentor ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Informasi Anda</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
            <p className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
              <MailIcon /> {mentor?.email}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Jabatan</p>
            <p className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
              <UserIcon /> {mentor?.position || '-'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Perusahaan</p>
            <p className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
              <BriefcaseIcon /> {mentor?.company_name || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Daftar Mahasiswa ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Mahasiswa yang Anda Bimbing ({mentees.length})
          </h2>
        </div>

        {mentees.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <UserIcon />
            </div>
            <p className="text-gray-500 font-semibold text-sm">Belum ada mahasiswa yang disetujui</p>
            <p className="text-gray-400 text-xs mt-1">
              Mahasiswa akan muncul di sini setelah pendaftaran KPPM mereka disetujui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
            {mentees.map((mentee, idx) => (
              <MenteeCard key={mentee.registration_id} mentee={mentee} idx={idx} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
