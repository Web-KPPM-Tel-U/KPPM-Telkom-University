'use client';

import { useState, useEffect } from 'react';
import { getUser, getToken, getLecturerStudents } from '@/lib/api';
import { useRouter } from 'next/navigation';
import type { LecturerUser } from '@/lib/api';

// ─── Icons ─────────────────────────────────────────────────────────────────────

const UsersIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const ClockIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
  </svg>
);
const CheckCircleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" />
  </svg>
);
const GradeIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9,18 15,12 9,6" />
  </svg>
);
const TrendUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" /><polyline points="17,6 23,6 23,12" />
  </svg>
);
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);
const AcademicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

// ─── Helpers ────────────────────────────────────────────────────────────────────

type GreetingPeriod = 'pagi' | 'siang' | 'sore' | 'malam';

function getGreetingInfo(hour: number): { text: string; period: GreetingPeriod } {
  if (hour < 11) return { text: 'Selamat Pagi',  period: 'pagi'  };
  if (hour < 15) return { text: 'Selamat Siang', period: 'siang' };
  if (hour < 18) return { text: 'Selamat Sore',  period: 'sore'  };
  return          { text: 'Selamat Malam', period: 'malam' };
}

// ─── Greeting Icon SVG ───────────────────────────────────────────────────────

function GreetingIcon({ period }: { period: GreetingPeriod }) {
  if (period === 'pagi') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="4.5" fill="rgba(255,255,255,0.92)" stroke="white" strokeWidth="0.5"/>
        <line x1="12" y1="2"    x2="12" y2="4.5"   stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="19.5" x2="12" y2="22"    stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <line x1="2"  y1="12"   x2="4.5"  y2="12"  stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <line x1="19.5" y1="12" x2="22"   y2="12"  stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <line x1="4.93" y1="4.93"  x2="6.7"   y2="6.7"   stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="17.3" y1="17.3"  x2="19.07" y2="19.07" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="19.07" y1="4.93" x2="17.3"  y2="6.7"   stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="6.7"   y1="17.3" x2="4.93"  y2="19.07" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
  if (period === 'siang') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="5.5" fill="rgba(255,255,255,0.95)" stroke="white" strokeWidth="0.5"/>
        <line x1="12" y1="1.5" x2="12" y2="4"     stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="12" y1="20"  x2="12" y2="22.5"  stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="1.5" y1="12" x2="4"   y2="12"   stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="20"  y1="12" x2="22.5" y2="12"  stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="4.22" y1="4.22" x2="6"    y2="6"     stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="18"   y1="18"   x2="19.78" y2="19.78" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="19.78" y1="4.22" x2="18"  y2="6"     stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="6"     y1="18"   x2="4.22" y2="19.78" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
  if (period === 'sore') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="2" y1="16" x2="22" y2="16" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 16 A6 6 0 0 1 18 16" fill="rgba(255,255,255,0.7)"/>
        <path d="M6 16 A6 6 0 0 1 18 16" stroke="white" strokeWidth="1.2" fill="none"/>
        <line x1="12"   y1="4"   x2="12"  y2="7"   stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="4.93" y1="7.5" x2="6.7" y2="9.2" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="19.07" y1="7.5" x2="17.3" y2="9.2" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="2"    y1="12" x2="4.5" y2="12" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="19.5" y1="12" x2="22"  y2="12" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
  // Malam — bulan sabit
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="rgba(255,255,255,0.85)"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getCurrentDate(): string {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ─── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, gradient, badge
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  badge?: string;
}) {
  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default">
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-15 transition-opacity ${gradient}`} />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider leading-tight">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mt-1.5">{value}</p>
          {badge && (
            <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">
              <TrendUpIcon /> {badge}
            </span>
          )}
        </div>
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${gradient} bg-opacity-15`}>
          {icon}
        </div>
      </div>
    </div>
  );
}


// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function DosenDashboardPage() {
  const router = useRouter();
  const [lecturer, setLecturer] = useState<LecturerUser | null>(null);
  const [greeting, setGreeting] = useState<{ text: string; period: GreetingPeriod }>({ text: 'Selamat Datang', period: 'pagi' });
  const [currentDate, setCurrentDate] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    graded: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }
    const userData = getUser();
    if (!userData || userData.role !== 'lecturer') { router.replace('/login'); return; }
    setLecturer(userData as LecturerUser);
    const hour = new Date().getHours();
    setGreeting(getGreetingInfo(hour));
    setCurrentDate(getCurrentDate());

    const fetchStats = async () => {
      try {
        const res = await getLecturerStudents(1000, 0);
        if (res.success && res.data) {
          const students = res.data;
          const uniqueStudents = new Set(students.map((s: any) => s.nim));
          setStats({
            total: uniqueStudents.size,
            pending: students.filter((s: any) => s.status === 'pending_approval').length,
            approved: students.filter((s: any) => s.status === 'approved').length,
            graded: students.filter((s: any) => s.is_graded === 1).length,
          });
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [router]);

  const initials = lecturer?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'DS';

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5">

      {/* ── Hero Banner ── */}
      <div className="relative bg-gradient-to-br from-[#CC0000] via-[#B00000] to-[#7A0000] rounded-2xl md:rounded-3xl p-5 md:p-8 text-white overflow-hidden shadow-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute top-8 -right-4 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 right-16 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-white/10" />

        <div className="relative flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-xl md:text-3xl font-bold shadow-lg">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-green-400 rounded-full border-2 border-white shadow" title="Online" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <GreetingIcon period={greeting.period} />
              <span className="text-red-200 text-xs sm:text-sm font-medium">{greeting.text}</span>
            </div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight break-words leading-tight">
              {lecturer?.name || 'Dosen'}
            </h1>
            <div className="text-red-100/70 text-xs mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="flex items-center gap-1"><AcademicIcon /><span>NIP {lecturer?.nip}</span></span>
              <span className="hidden sm:inline w-px h-3 bg-red-200/30" />
              <span>Pembimbing Akademik KPPM</span>
            </div>

            {/* Date — tampil di bawah info pada mobile */}
            {currentDate && (
              <p className="text-red-100/50 text-[11px] mt-2 md:hidden">{currentDate}</p>
            )}
          </div>

          {/* Date badge — hanya desktop */}
          <div className="flex-shrink-0 hidden md:block">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3 text-center">
              <p className="text-red-200 text-[10px] font-semibold uppercase tracking-widest mb-0.5">Hari ini</p>
              <p className="text-white text-xs font-bold leading-snug max-w-[140px]">{currentDate}</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative mt-4 pt-3 border-t border-white/10">
          <p className="text-red-100/60 text-[11px] leading-relaxed">Portal Dosen PA — Sistem Manajemen KPPM Telkom University</p>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Ringkasan Bimbingan</h2>
          <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">Semester Aktif</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Mahasiswa"
            value={isLoading ? "..." : stats.total}
            icon={<UsersIcon />}
            gradient="bg-blue-500"
          />
          <StatCard
            label="Menunggu Persetujuan"
            value={isLoading ? "..." : stats.pending}
            icon={<ClockIcon />}
            gradient="bg-amber-500"
          />
          <StatCard
            label="Sudah Disetujui"
            value={isLoading ? "..." : stats.approved}
            icon={<CheckCircleIcon />}
            gradient="bg-green-500"
          />
          <StatCard
            label="Nilai Diinput"
            value={isLoading ? "..." : stats.graded}
            icon={<GradeIcon />}
            gradient="bg-purple-500"
          />
        </div>
      </div>




    </div>
  );
}
