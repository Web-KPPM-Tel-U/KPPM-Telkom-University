'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9,12 11,14 15,10" />
  </svg>
);
const TrendUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" /><polyline points="17,6 23,6 23,12" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9,18 15,12 9,6" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

type GreetingPeriod = 'pagi' | 'siang' | 'sore' | 'malam';

function getGreetingInfo(hour: number): { text: string; period: GreetingPeriod } {
  if (hour < 11) return { text: 'Selamat Pagi',  period: 'pagi'  };
  if (hour < 15) return { text: 'Selamat Siang', period: 'siang' };
  if (hour < 18) return { text: 'Selamat Sore',  period: 'sore'  };
  return          { text: 'Selamat Malam', period: 'malam' };
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, gradient, badge }: {
  label: string; value: string | number; icon: React.ReactNode;
  gradient: string; badge?: string;
}) {
  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default">
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-15 transition-opacity ${gradient}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-2">{value}</p>
          {badge && (
            <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">
              <TrendUpIcon /> {badge}
            </span>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${gradient} bg-opacity-15`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Action Card ──────────────────────────────────────────────────────────────

function ActionCard({ icon, label, desc, tag, color, iconBg, disabled }: {
  icon: React.ReactNode; label: string; desc: string;
  tag?: string; color: string; iconBg: string; disabled?: boolean;
}) {
  return (
    <div className={`group bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#CC0000]/30 dark:hover:border-red-500/30 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${!disabled ? 'group-hover:scale-110' : ''} transition-transform duration-300`}>
        <span className={color}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-bold text-gray-900 dark:text-slate-100 ${!disabled ? 'group-hover:text-[#CC0000] dark:group-hover:text-red-400' : ''} transition-colors`}>{label}</p>
          {tag && (
            <span className="text-[10px] font-semibold text-[#CC0000] dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full">{tag}</span>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{desc}</p>
      </div>
      {!disabled && (
        <span className="text-gray-300 dark:text-slate-600 group-hover:text-[#CC0000] dark:group-hover:text-red-400 group-hover:translate-x-1 transition-all flex-shrink-0">
          <ArrowRightIcon />
        </span>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [greeting, setGreeting] = useState<{ text: string; period: GreetingPeriod }>({ text: 'Selamat Datang', period: 'pagi' });
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

  useEffect(() => {
    if (admin) fetchStats();
  }, [admin, fetchStats]);

  const initials = admin?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'AD';
  const roleLabel = admin?.role === 'admin' ? 'Administrator' : 'Person In Charge';

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">

      {/* ── Hero Banner — sama persis gaya dosen ── */}
      <div className="relative bg-gradient-to-br from-[#CC0000] via-[#B00000] to-[#7A0000] rounded-3xl p-6 md:p-8 text-white overflow-hidden shadow-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute top-8 -right-4 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 right-16 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-white/10" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
              <ShieldIcon />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow" title="Online" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-red-200 text-sm font-medium">{greeting.text}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight truncate">
              {admin?.name || 'Admin'}
            </h1>
            <p className="text-red-100/70 text-sm mt-1.5 flex items-center gap-2 flex-wrap">
              <span>{admin?.email || `@${admin?.username}`}</span>
              <span className="w-px h-3.5 bg-red-200/30" />
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

        <div className="relative mt-5 pt-4 border-t border-white/10">
          <p className="text-red-100/60 text-xs">Panel Admin — Sistem Manajemen KPPM Telkom University</p>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Ringkasan Sistem</h2>
          <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">Live</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Mahasiswa"  value={statsLoading ? '...' : (stats?.total_students ?? 0)}          icon={<UsersIcon />}       gradient="bg-blue-500"   />
          <StatCard label="Total Dosen"      value={statsLoading ? '...' : (stats?.total_lecturers ?? 0)}         icon={<AcademicIcon />}    gradient="bg-purple-500" />
          <StatCard label="Menunggu Review"  value={statsLoading ? '...' : (stats?.pending_registrations ?? 0)}   icon={<ClockIcon />}       gradient="bg-amber-500"  />
          <StatCard label="Disetujui"        value={statsLoading ? '...' : (stats?.approved_registrations ?? 0)}  icon={<CheckCircleIcon />} gradient="bg-green-500"  />
          <StatCard label="Total Pendaftaran" value={statsLoading ? '...' : (stats?.total_registrations ?? 0)}    icon={<ClipboardIcon />}   gradient="bg-teal-500"   />
          <StatCard label="Semester Aktif"   value={statsLoading ? '...' : (stats?.active_semesters ?? 0)}        icon={<CalendarIcon />}    gradient="bg-red-500"    />
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Aksi Cepat</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionCard
            icon={<AcademicIcon size={22} />}
            label="Kelola Data Dosen"
            desc="Tambah, edit, dan hapus data dosen pembimbing"
            tag="Segera"
            color="text-purple-600 dark:text-purple-400"
            iconBg="bg-purple-50 dark:bg-purple-950"
            disabled
          />
          <ActionCard
            icon={<UsersIcon size={22} />}
            label="Kelola Data Mahasiswa"
            desc="Lihat dan kelola akun mahasiswa KPPM"
            tag="Segera"
            color="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-50 dark:bg-blue-950"
            disabled
          />
          <ActionCard
            icon={<CalendarIcon size={22} />}
            label="Kelola Kode Semester"
            desc="Atur semester aktif dan periode KPPM"
            tag="Segera"
            color="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-50 dark:bg-amber-950"
            disabled
          />
          <ActionCard
            icon={<UploadIcon size={22} />}
            label="Injeksi Data CSV / XLSX"
            desc="Import data mahasiswa dan dosen dari spreadsheet"
            tag="Segera"
            color="text-teal-600 dark:text-teal-400"
            iconBg="bg-teal-50 dark:bg-teal-950"
            disabled
          />
        </div>
      </div>

    </div>
  );
}
