'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminToken, getAdminUser, getAdminStats, AdminUser, AdminStats } from '@/lib/api';

// ─── Icons ────────────────────────────────────────────────────────────────────

const UsersIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const AcademicIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
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
const CalendarIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const ClipboardIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);
const UploadIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16,16 12,12 8,16" /><line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9,18 15,12 9,6" />
  </svg>
);
const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);

// ─── Greeting helpers ─────────────────────────────────────────────────────────

type GreetingPeriod = 'pagi' | 'siang' | 'sore' | 'malam';

function getGreetingInfo(hour: number): { text: string; period: GreetingPeriod } {
  if (hour < 11) return { text: 'Selamat Pagi',  period: 'pagi'  };
  if (hour < 15) return { text: 'Selamat Siang', period: 'siang' };
  if (hour < 18) return { text: 'Selamat Sore',  period: 'sore'  };
  return          { text: 'Selamat Malam', period: 'malam' };
}

function GreetingIcon({ period }: { period: GreetingPeriod }) {
  if (period === 'pagi') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
  if (period === 'siang') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
  if (period === 'sore') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <line x1="2" y1="16" x2="22" y2="16" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 16 A6 6 0 0 1 18 16" fill="rgba(255,255,255,0.7)"/>
      <path d="M6 16 A6 6 0 0 1 18 16" stroke="white" strokeWidth="1.2" fill="none"/>
      <line x1="12" y1="8" x2="12" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="6.5" y1="10.5" x2="7.9" y2="11.9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="17.5" y1="10.5" x2="16.1" y2="11.9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="rgba(255,255,255,0.85)" stroke="white" strokeWidth="0.5"/>
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, iconBg }: {
  label: string; value: string | number;
  icon: React.ReactNode; iconBg: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── Action Card ──────────────────────────────────────────────────────────────

function ActionCard({ href, icon, label, desc, tag, color, iconBg }: {
  href: string; icon: React.ReactNode; label: string; desc: string;
  tag?: string; color: string; iconBg: string;
}) {
  return (
    <Link href={href} className="group bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-5 flex items-center gap-4 transition-all duration-300 hover:border-[#CC0000]/30 dark:hover:border-red-500/30 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
        <span className={color}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-gray-900 dark:text-slate-100 group-hover:text-[#CC0000] dark:group-hover:text-red-400 transition-colors">{label}</p>
          {tag && <span className="text-[10px] font-semibold text-[#CC0000] dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full">{tag}</span>}
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{desc}</p>
      </div>
      <span className="text-gray-300 dark:text-slate-600 group-hover:text-[#CC0000] dark:group-hover:text-red-400 group-hover:translate-x-1 transition-all flex-shrink-0">
        <ArrowRightIcon />
      </span>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin]           = useState<AdminUser | null>(null);
  const [stats, setStats]           = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [greeting, setGreeting]     = useState<{ text: string; period: GreetingPeriod }>({ text: 'Selamat Datang', period: 'pagi' });
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    if (!getAdminToken()) { router.replace('/admin-login'); return; }
    const user = getAdminUser();
    if (!user) { router.replace('/admin-login'); return; }
    setAdmin(user);
    const hour = new Date().getHours();
    setGreeting(getGreetingInfo(hour));
    setCurrentDate(new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, [router]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await getAdminStats();
      if (res.success && res.data) setStats(res.data);
    } catch { /* ignore */ }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { if (admin) fetchStats(); }, [admin, fetchStats]);

  const initials  = admin?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'AD';
  const roleLabel = admin?.role === 'admin' ? 'Administrator' : 'Person In Charge';

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
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow" title="Online" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <GreetingIcon period={greeting.period} />
              <span className="text-red-200 text-xs sm:text-sm font-medium">{greeting.text}</span>
            </div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight break-words leading-tight">
              {admin?.name || 'Administrator KPPM'}
            </h1>
            <p className="text-red-100/80 text-sm mt-1.5 flex items-center gap-2.5 flex-wrap">
              <span className="font-semibold">{admin?.email || `@${admin?.username}`}</span>
              <span className="hidden sm:block w-px h-3.5 bg-red-200/30" />
              <span>{roleLabel} — KPPM Telkom University</span>
            </p>
          </div>

          {/* Date badge */}
          <div className="flex-shrink-0 hidden md:block">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3 text-center">
              <p className="text-red-200 text-[10px] font-semibold uppercase tracking-widest mb-0.5">Hari ini</p>
              <p className="text-white text-xs font-bold leading-snug max-w-[140px]">{currentDate}</p>
            </div>
          </div>
        </div>

        <div className="relative mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-red-100/60 text-xs">Panel Admin — Sistem Manajemen KPPM Telkom University</p>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Ringkasan Sistem</h2>
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors"
          >
            <RefreshIcon /> Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Mahasiswa"   value={statsLoading ? '...' : (stats?.total_students ?? 0)}         icon={<UsersIcon />}       iconBg="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400" />
          <StatCard label="Total Dosen"       value={statsLoading ? '...' : (stats?.total_lecturers ?? 0)}        icon={<AcademicIcon />}    iconBg="bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400" />
          <StatCard label="Menunggu Review"   value={statsLoading ? '...' : (stats?.pending_registrations ?? 0)}  icon={<ClockIcon />}       iconBg="bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400" />
          <StatCard label="Disetujui"         value={statsLoading ? '...' : (stats?.approved_registrations ?? 0)} icon={<CheckCircleIcon />} iconBg="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400" />
          <StatCard label="Total Pendaftaran" value={statsLoading ? '...' : (stats?.total_registrations ?? 0)}    icon={<ClipboardIcon />}   iconBg="bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400" />
          <StatCard label="Semester Aktif"    value={statsLoading ? '...' : (stats?.active_semesters ?? 0)}       icon={<CalendarIcon />}    iconBg="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400" />
        </div>
      </div>



    </div>
  );
}
