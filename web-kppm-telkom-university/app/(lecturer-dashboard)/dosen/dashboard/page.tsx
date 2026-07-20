'use client';

import { useState, useEffect } from 'react';
import { getUser, getToken } from '@/lib/api';
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

function getGreetingInfo(hour: number): { text: string; emoji: string } {
  if (hour < 11) return { text: 'Selamat Pagi', emoji: '🌤️' };
  if (hour < 15) return { text: 'Selamat Siang', emoji: '☀️' };
  if (hour < 18) return { text: 'Selamat Sore', emoji: '🌇' };
  return { text: 'Selamat Malam', emoji: '🌙' };
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
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default">
      {/* Decorative gradient blob */}
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

// ─── Quick Action Card ──────────────────────────────────────────────────────────

function ActionCard({
  href, icon, label, desc, tag, color, iconBg,
}: {
  href: string; icon: React.ReactNode; label: string; desc: string;
  tag?: string; color: string; iconBg: string;
}) {
  return (
    <a href={href}
      className="group bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:border-[#CC0000]/30 dark:hover:border-red-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
        <span className={color}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-gray-900 dark:text-slate-100 group-hover:text-[#CC0000] dark:group-hover:text-red-400 transition-colors">{label}</p>
          {tag && (
            <span className="text-[10px] font-semibold text-[#CC0000] dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full">{tag}</span>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{desc}</p>
      </div>
      <span className="text-gray-300 dark:text-slate-600 group-hover:text-[#CC0000] dark:group-hover:text-red-400 group-hover:translate-x-1 transition-all flex-shrink-0">
        <ArrowRightIcon />
      </span>
    </a>
  );
}

// ─── Info Banner ────────────────────────────────────────────────────────────────

function InfoBanner() {
  return (
    <div className="relative bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/70 dark:border-amber-800/30 rounded-2xl p-4 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-full opacity-5">
        <svg viewBox="0 0 100 100" className="w-full h-full"><circle cx="80" cy="20" r="40" fill="#D97706"/></svg>
      </div>
      <div className="relative flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <BellIcon />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-800 dark:text-amber-200">Fitur dalam pengembangan</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 leading-relaxed">
            Fitur persetujuan pendaftaran dan input nilai sedang disiapkan. Data ringkasan akan tampil otomatis setelah backend terhubung.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function DosenDashboardPage() {
  const router = useRouter();
  const [lecturer, setLecturer] = useState<LecturerUser | null>(null);
  const [greeting, setGreeting] = useState<{ text: string; emoji: string }>({ text: 'Selamat Datang', emoji: '👋' });
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }
    const userData = getUser();
    if (!userData || userData.role !== 'lecturer') { router.replace('/login'); return; }
    setLecturer(userData as LecturerUser);
    const hour = new Date().getHours();
    setGreeting(getGreetingInfo(hour));
    setCurrentDate(getCurrentDate());
  }, [router]);

  const initials = lecturer?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'DS';

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">

      {/* ── Hero Banner ── */}
      <div className="relative bg-gradient-to-br from-[#CC0000] via-[#B00000] to-[#7A0000] rounded-3xl p-6 md:p-8 text-white overflow-hidden shadow-xl">
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute top-8 -right-4 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 right-16 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-white/10" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-lg">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow" title="Online" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{greeting.emoji}</span>
              <span className="text-red-200 text-sm font-medium">{greeting.text}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight truncate">
              {lecturer?.name || 'Dosen'}
            </h1>
            <p className="text-red-100/70 text-sm mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1"><AcademicIcon /><span>NIP {lecturer?.nip}</span></span>
              <span className="w-px h-3.5 bg-red-200/30" />
              <span>Pembimbing Akademik KPPM</span>
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

        {/* Bottom bar */}
        <div className="relative mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-red-100/60 text-xs">Portal Dosen PA — Sistem Manajemen KPPM Telkom University</p>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/80 bg-white/10 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />Aktif
          </span>
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
            value="—"
            icon={<UsersIcon />}
            gradient="bg-blue-500"
          />
          <StatCard
            label="Menunggu Persetujuan"
            value="—"
            icon={<ClockIcon />}
            gradient="bg-amber-500"
          />
          <StatCard
            label="Sudah Disetujui"
            value="—"
            icon={<CheckCircleIcon />}
            gradient="bg-green-500"
          />
          <StatCard
            label="Nilai Diinput"
            value="—"
            icon={<GradeIcon />}
            gradient="bg-purple-500"
          />
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Aksi Cepat</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionCard
            href="/dosen/mahasiswa"
            icon={<UsersIcon size={22} />}
            label="Data Mahasiswa Bimbingan"
            desc="Lihat, kelola & setujui pendaftaran KPPM mahasiswa"
            tag="Baru"
            color="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-50 dark:bg-blue-950"
          />
          <ActionCard
            href="/dosen/input-nilai"
            icon={<GradeIcon size={22} />}
            label="Input Nilai Mahasiswa"
            desc="Berikan penilaian akhir Kerja Praktik / Magang"
            color="text-purple-600 dark:text-purple-400"
            iconBg="bg-purple-50 dark:bg-purple-950"
          />
        </div>
      </div>

      {/* ── Info Banner ── */}
      <InfoBanner />
    </div>
  );
}
