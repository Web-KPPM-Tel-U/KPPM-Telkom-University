'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getUser, logout, getToken } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import LecturerOnboardingWizard from '@/components/LecturerOnboardingWizard';

const MenuIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const ChevronDownIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6,9 12,15 18,9" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const DashboardIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const UsersIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const GradeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const SettingsIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);
const FileResultIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <polyline points="9,15 11,17 15,13" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
  </svg>
);

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

const KPPMLogoMark = () => (
  <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#CC0000" width="20" height="20">
      <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3ZM5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/>
    </svg>
  </div>
);

export default function LecturerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUserState] = useState<{ name: string; nip?: string; email?: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [lang, setLang] = useState<Lang>('id');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }
    const userData = getUser();
    if (!userData || userData.role !== 'lecturer') { router.replace('/login'); return; }
    setUserState({
      name: (userData as { name: string }).name || 'Dosen',
      nip: (userData as { nip?: string }).nip,
      email: (userData as { email?: string }).email,
      role: userData.role,
    });
  }, [router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.replace('/login');
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  const navItems = [
    { href: '/dosen/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { href: '/dosen/mahasiswa', label: 'Data Mahasiswa', icon: <UsersIcon /> },
    { href: '/dosen/input-nilai', label: 'Input Nilai', icon: <GradeIcon /> },
    { href: '/dosen/hasil-kp', label: 'Hasil KP', icon: <FileResultIcon /> },
  ];

  return (
    <div className="h-full flex bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <aside className={`bg-white dark:bg-slate-900 flex-shrink-0 transition-all duration-300 z-20 border-r border-[#ebebeb] dark:border-slate-700/60 flex flex-col overflow-hidden ${sidebarOpen ? 'w-64' : 'w-[84px]'}`} style={{ boxShadow: '2px 0 12px rgba(0,0,0,0.05)' }}>
          <div className="p-3 border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <div className="relative flex items-center p-2 rounded-2xl border border-gray-200/60 dark:border-slate-700/60 bg-gray-50 dark:bg-slate-800/40 transition-all duration-300 overflow-hidden justify-start">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#CC0000]/10 dark:bg-red-500/20 text-[#CC0000] dark:text-red-400 flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ boxShadow: 'inset 0 0 0 1px rgba(204,0,0,0.1)' }}>
                  {user ? getInitials(user.name) : '?'}
                </div>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-[150px] opacity-100' : 'w-0 opacity-0'}`}>
                  <div className="w-[150px] flex flex-col justify-center">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate whitespace-nowrap">{user?.name || '...'}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate whitespace-nowrap mt-0.5">{user?.nip ? `NIP: ${user.nip}` : 'Dosen PA'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <nav className="p-3 flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden mt-1">
            <p className={`text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-2 transition-all duration-300 ease-in-out ${sidebarOpen ? 'opacity-100 max-h-8 mb-2' : 'opacity-0 max-h-0 mb-0 overflow-hidden'}`}>
              Menu Dosen
            </p>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} id={`nav-${item.href.split('/').pop()}`}
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
                  <span className={`flex-shrink-0 flex items-center justify-center w-[28px] ${isActive ? 'text-[#CC0000]' : 'text-gray-400 dark:text-slate-500'} [&>svg]:w-[22px] [&>svg]:h-[22px]`}>
                    {item.icon}
                  </span>
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-[150px] opacity-100 ml-4' : 'w-0 opacity-0 ml-0'}`}>
                    <span className="text-[15px] whitespace-nowrap block w-[150px]">
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
            
            <div className="mt-4 flex flex-col gap-1">
              <p className={`text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-2 transition-all duration-300 ease-in-out ${sidebarOpen ? 'opacity-100 max-h-8 mb-2' : 'opacity-0 max-h-0 mb-0 overflow-hidden'}`}>
                Lainnya
              </p>
              <Link
                href="/dosen/pengaturan"
                id="nav-pengaturan"
                title={!sidebarOpen ? 'Pengaturan' : undefined}
                className={`relative flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-150 ${
                  pathname === '/dosen/pengaturan' 
                    ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800/80' 
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/40 hover:text-gray-700 dark:hover:text-slate-200'
                }`}
              >
                {pathname === '/dosen/pengaturan' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#CC0000] rounded-r-md" />
                )}
                <span className={`flex-shrink-0 flex items-center justify-center w-[28px] ${pathname === '/dosen/pengaturan' ? 'text-[#CC0000]' : 'text-gray-400 dark:text-slate-500'} [&>svg]:w-[22px] [&>svg]:h-[22px]`}>
                  <SettingsIcon />
                </span>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-[150px] opacity-100 ml-4' : 'w-0 opacity-0 ml-0'}`}>
                  <span className="text-[15px] whitespace-nowrap block w-[150px]">
                    Pengaturan
                  </span>
                </div>
              </Link>
            </div>
          </nav>
          
          <div className="p-3 flex flex-col gap-1 border-t border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle Sidebar" className="relative flex items-center px-4 py-3 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/40 hover:text-gray-700 dark:hover:text-slate-200 font-medium transition-all duration-150">
              <span className="flex-shrink-0 flex items-center justify-center w-[28px] [&>svg]:w-[22px] [&>svg]:h-[22px]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                </svg>
              </span>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-[150px] opacity-100 ml-4' : 'w-0 opacity-0 ml-0'}`}>
                <span className="text-[15px] whitespace-nowrap block w-[150px]">
                  Toggle Sidebar
                </span>
              </div>
            </button>
            <button id="btn-logout-sidebar" onClick={handleLogout} disabled={isLoggingOut} title={!sidebarOpen ? 'Keluar' : undefined} className="relative flex items-center px-4 py-3 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium transition-all duration-150 disabled:opacity-60">
              <span className="flex-shrink-0 flex items-center justify-center w-[28px] [&>svg]:w-[22px] [&>svg]:h-[22px]">
                <LogoutIcon />
              </span>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-[150px] opacity-100 ml-4' : 'w-0 opacity-0 ml-0'}`}>
                <span className="text-[15px] whitespace-nowrap block w-[150px]">
                  {isLoggingOut ? 'Keluar...' : 'Sign out'}
                </span>
              </div>
            </button>
          </div>
        </aside>
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <div className="px-4 pt-4 pb-2 shrink-0 z-40">
            <header className="bg-gradient-to-r from-[#CC0000] to-[#E60000] dark:from-slate-900 dark:to-slate-800 h-14 rounded-[2rem] flex items-center px-4 gap-3 transition-all duration-300 shadow-lg shadow-red-900/15 dark:shadow-black/40 border border-white/20 dark:border-slate-700 relative">
              <div className="flex items-center gap-3 flex-shrink-0">
                <KPPMLogoMark />
                <div className="hidden sm:block">
                  <p className="text-white font-black text-[17px] leading-tight tracking-wide">SISTEM MANAJEMEN KPPM</p>
                  <p className="text-red-200 text-[12px] font-bold leading-tight tracking-wider uppercase mt-0.5">Telkom University</p>
                </div>
              </div>
              <div className="flex-1" />
              {/* ── Theme Toggle ── */}
              <div className="flex-shrink-0 mr-2">
                <ThemeToggle />
              </div>

              {/* ── Language Selector ── */}
              <div className="relative flex-shrink-0" ref={langRef}>
                <button
                  id="btn-lang-selector"
                  onClick={() => setLangMenuOpen((v) => !v)}
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
          <main className="flex-1 overflow-y-auto transition-all duration-300">{children}</main>
        </div>

      {/* ── Onboarding Wizard (tampil otomatis jika belum verifikasi/ganti password) ── */}
      <LecturerOnboardingWizard />
    </div>
  );
}
