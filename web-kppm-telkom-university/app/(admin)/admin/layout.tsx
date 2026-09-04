'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getAdminToken, getAdminUser, logoutAdmin } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

// ─── Language Config ────────────────────────────────────────────────────────────────────

type Lang = 'id' | 'en';

const LANG_LABELS: Record<Lang, { label: string; flag: React.ReactNode }> = {
  id: {
    label: 'Indonesia',
    flag: (
      <svg width="20" height="14" viewBox="0 0 20 14" className="rounded-sm shadow-sm">
        <rect width="20" height="7" fill="#CC0000" />
        <rect y="7" width="20" height="7" fill="#FFFFFF" />
      </svg>
    ),
  },
  en: {
    label: 'English',
    flag: (
      <svg width="20" height="14" viewBox="0 0 60 40" className="rounded-sm shadow-sm">
        <rect width="60" height="40" fill="#012169" />
        <path d="M0,0 L60,40 M60,0 L0,40" stroke="white" strokeWidth="8" />
        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="5" />
        <path d="M30,0 V40 M0,20 H60" stroke="white" strokeWidth="13" />
        <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="8" />
      </svg>
    ),
  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const LogoutIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const DashboardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const UsersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const AcademicIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);
const CalendarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const DownloadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const UploadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16,16 12,12 8,16" /><line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
  </svg>
);
const SidebarToggleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);
const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
  </svg>
);
const ChevronDownIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6,9 12,15 18,9" />
  </svg>
);
const KPPMLogoMark = () => (
  <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#CC0000" width="20" height="20">
      <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3ZM5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/>
    </svg>
  </div>
);

const FileTextIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" />
  </svg>
);
const KeyIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

// ─── Nav items ────────────────────────────────────────────────────────────────

const navItems = [
  { href: '/admin/dashboard',      label: 'Dashboard',         icon: <DashboardIcon />, enabled: true },
  { href: '/admin/pengajuan',      label: 'Kelola Pengajuan',  icon: <FileTextIcon />,  enabled: true },
  { href: '/admin/dosen',          label: 'Kelola Dosen',      icon: <AcademicIcon />,  enabled: true },
  { href: '/admin/mahasiswa',      label: 'Kelola Mahasiswa',  icon: <UsersIcon />,     enabled: true },
  { href: '/admin/semester',       label: 'Kelola Semester',   icon: <CalendarIcon />,  enabled: true },
  { href: '/admin/unduh-nilai',    label: 'Unduh Nilai',       icon: <DownloadIcon />,  enabled: true },
  { href: '/admin/injeksi',        label: 'Injeksi CSV/XLSX',  icon: <UploadIcon />,    enabled: true },
  { href: '/admin/ubah-password',  label: 'Ubah Password',     icon: <KeyIcon />,       enabled: true },
];

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminPagesLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]               = useState<{ name: string; username: string; email: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen]  = useState(true);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [lang, setLang]                = useState<Lang>('id');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) { router.replace('/admin-login'); return; }
    const adminUser = getAdminUser();
    if (!adminUser) { router.replace('/admin-login'); return; }
    setUser({ name: adminUser.name, username: adminUser.username, email: adminUser.email, role: adminUser.role });
  }, [router]);

  // Close lang dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Tutup mobile drawer saat pindah halaman
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Auto-detect screen size untuk initial sidebar state
  useEffect(() => {
    const update = () => setSidebarOpen(window.innerWidth >= 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutAdmin();
    router.replace('/admin-login');
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const roleLabel = user?.role === 'admin' ? 'Administrator' : 'Person In Charge';

  return (
    <div className="h-full flex bg-gray-50 dark:bg-slate-950 transition-colors duration-300">

      {/* ── Sidebar ── */}
      <aside
        className={`hidden md:flex relative bg-white dark:bg-slate-900 flex-shrink-0 transition-all duration-300 overflow-hidden z-20 border-r border-[#ebebeb] dark:border-slate-700/60 flex-col ${sidebarOpen ? 'w-64' : 'w-[84px]'}`}
        style={{ boxShadow: '2px 0 12px rgba(0,0,0,0.05)' }}
      >
        {/* User card */}
        <div className="p-3 border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
          <div className="relative flex items-center p-2 rounded-2xl border border-gray-200/60 dark:border-slate-700/60 bg-gray-50 dark:bg-slate-800/40 transition-all duration-300 overflow-hidden">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl bg-[#CC0000] text-white flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)' }}
              >
                {user ? getInitials(user.name) : '?'}
              </div>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-[150px] opacity-100' : 'w-0 opacity-0'}`}>
                <div className="w-[150px] flex flex-col justify-center">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate whitespace-nowrap">{user?.name || '...'}</p>
                  <p className="text-[10px] text-[#CC0000] dark:text-red-400 font-semibold truncate whitespace-nowrap mt-0.5">{roleLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden mt-1">
          <p className={`text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-2 transition-all duration-300 ease-in-out ${sidebarOpen ? 'opacity-100 max-h-8 mb-2' : 'opacity-0 max-h-0 mb-0 overflow-hidden'}`}>
            Menu Admin
          </p>

          {navItems.map(item => {
            const isActive = pathname === item.href;
            if (!item.enabled) {
              return (
                <div
                  key={item.href}
                  title={!sidebarOpen ? item.label : undefined}
                  className="relative flex items-center px-4 py-3 rounded-xl text-gray-300 dark:text-slate-600 cursor-not-allowed select-none"
                >
                  <span className="flex-shrink-0 flex items-center justify-center w-[28px] [&>svg]:w-[22px] [&>svg]:h-[22px] text-gray-300 dark:text-slate-600">
                    {item.icon}
                  </span>
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-[150px] opacity-100 ml-4' : 'w-0 opacity-0 ml-0'}`}>
                    <span className="text-[15px] whitespace-nowrap block w-[150px] flex items-center gap-2">
                      {item.label}
                      <span className="text-[9px] font-semibold bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">Segera</span>
                    </span>
                  </div>
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`nav-${item.href.split('/').pop()}`}
                title={!sidebarOpen ? item.label : undefined}
                className={`relative flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800/80'
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/40 hover:text-gray-700 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#CC0000] rounded-r-md" />
                )}
                <span className={`flex-shrink-0 flex items-center justify-center w-[28px] [&>svg]:w-[22px] [&>svg]:h-[22px] ${isActive ? 'text-[#CC0000]' : 'text-gray-400 dark:text-slate-500'}`}>
                  {item.icon}
                </span>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-[150px] opacity-100 ml-4' : 'w-0 opacity-0 ml-0'}`}>
                  <span className="text-[15px] whitespace-nowrap block w-[150px]">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 flex flex-col gap-1 border-t border-gray-100 dark:border-slate-800 transition-colors duration-300">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle Sidebar"
            className="relative flex items-center px-4 py-3 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/40 hover:text-gray-700 dark:hover:text-slate-200 font-medium transition-all duration-150"
          >
            <span className="flex-shrink-0 flex items-center justify-center w-[28px] [&>svg]:w-[22px] [&>svg]:h-[22px]">
              <SidebarToggleIcon />
            </span>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-[150px] opacity-100 ml-4' : 'w-0 opacity-0 ml-0'}`}>
              <span className="text-[15px] whitespace-nowrap block w-[150px]">Toggle Sidebar</span>
            </div>
          </button>
          <button
            id="btn-logout-sidebar"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={!sidebarOpen ? 'Keluar' : undefined}
            className="relative flex items-center px-4 py-3 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium transition-all duration-150 disabled:opacity-60"
          >
            <span className="flex-shrink-0 flex items-center justify-center w-[28px] [&>svg]:w-[22px] [&>svg]:h-[22px]">
              <LogoutIcon />
            </span>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-[150px] opacity-100 ml-4' : 'w-0 opacity-0 ml-0'}`}>
              <span className="text-[15px] whitespace-nowrap block w-[150px]">
                {isLoggingOut ? 'Keluar...' : 'Keluar'}
              </span>
            </div>
          </button>
        </div>
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 z-50 flex flex-col md:hidden transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.15)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#CC0000] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="17" height="17">
                <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3ZM5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/>
              </svg>
            </div>
            <div>
              <p className="font-black text-[13px] text-gray-900 dark:text-white leading-tight tracking-wide">SISTEM MANAJEMEN KPPM</p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold uppercase leading-tight mt-0.5">Telkom University</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" aria-label="Tutup">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="p-3 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center p-2 rounded-2xl border border-gray-200/60 dark:border-slate-700/60 bg-gray-50 dark:bg-slate-800/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#CC0000] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">{user ? getInitials(user.name) : '?'}</div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name || '...'}</p>
                <p className="text-xs text-[#CC0000] font-semibold truncate mt-0.5">{roleLabel}</p>
              </div>
            </div>
          </div>
        </div>
        <nav className="p-3 flex-1 flex flex-col gap-1 overflow-y-auto mt-1">

          {navItems.filter(i => i.enabled).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`relative flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-150 ${isActive ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800/80' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/40'}`}>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#CC0000] rounded-r-md" />}
                <span className={`flex-shrink-0 flex items-center justify-center w-[28px] ${isActive ? 'text-[#CC0000]' : 'text-gray-400'} [&>svg]:w-[22px] [&>svg]:h-[22px]`}>{item.icon}</span>
                <span className="ml-4 text-[15px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100 dark:border-slate-800">
          <button onClick={handleLogout} disabled={isLoggingOut} className="w-full flex items-center px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-all duration-150 disabled:opacity-60">
            <span className="flex-shrink-0 flex items-center justify-center w-[28px] [&>svg]:w-[22px] [&>svg]:h-[22px]"><LogoutIcon /></span>
            <span className="ml-4 text-[15px]">{isLoggingOut ? 'Keluar...' : 'Keluar'}</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Floating Header */}
        <div className="px-4 pt-4 pb-2 shrink-0 z-40">
          <header className="bg-gradient-to-r from-[#CC0000] to-[#E60000] dark:from-slate-900 dark:to-slate-800 h-14 rounded-[2rem] flex items-center px-4 gap-3 transition-all duration-300 shadow-lg shadow-red-900/15 dark:shadow-black/40 border border-white/20 dark:border-slate-700 relative">
            {/* Hamburger — hanya mobile */}
            <button className="md:hidden flex-shrink-0 p-1.5 rounded-xl text-white/80 hover:bg-white/10 active:bg-white/20 transition-colors" onClick={() => setMobileOpen(true)} aria-label="Buka menu">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            {/* Logo + Name */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              <KPPMLogoMark />
              <div className="hidden sm:block">
                <p className="text-white font-black text-[17px] leading-tight tracking-wide">SISTEM MANAJEMEN KPPM</p>
                <p className="text-red-200 text-[12px] font-bold leading-tight tracking-wider uppercase mt-0.5">Telkom University</p>
              </div>
            </div>

            <div className="flex-1" />

            {/* Theme Toggle */}
            <div className="flex-shrink-0 mr-1">
              <ThemeToggle />
            </div>

            {/* Language Selector */}
            <div className="relative flex-shrink-0" ref={langRef}>
              <button
                id="btn-lang-selector"
                onClick={() => setLangMenuOpen(v => !v)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-white/10 transition-colors"
                title={lang === 'id' ? 'Bahasa Indonesia' : 'English'}
              >
                <span className="text-white/70"><GlobeIcon /></span>
                <span className="hidden sm:flex items-center">{LANG_LABELS[lang].flag}</span>
                <span className="text-white text-xs font-bold uppercase hidden sm:block">{lang}</span>
                <span className="text-white/60"><ChevronDownIcon size={12} /></span>
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-1.5 z-50 transition-colors duration-300">
                  <p className="px-4 py-2 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest border-b border-gray-100 dark:border-slate-700 mb-1">
                    Bahasa / Language
                  </p>
                  {(['id', 'en'] as Lang[]).map((l) => (
                    <button
                      key={l}
                      id={`lang-${l}`}
                      onClick={() => { setLang(l); setLangMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                        lang === l ? 'text-[#CC0000] dark:text-red-400 font-semibold' : 'text-gray-700 dark:text-slate-300'
                      }`}
                    >
                      {LANG_LABELS[l].flag}
                      <span>{LANG_LABELS[l].label}</span>
                      {lang === l && (
                        <svg className="ml-auto" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="3">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </header>
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300">{children}</main>
      </div>
    </div>
  );
}
