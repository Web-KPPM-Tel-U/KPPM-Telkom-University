'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getUser, logout, getToken } from '@/lib/api';

// ─── Language Config ──────────────────────────────────────────────────────────

type Lang = 'id' | 'en';

const LANG_LABELS: Record<Lang, { label: string; flag: React.ReactNode }> = {
  id: {
    label: 'Indonesia',
    flag: (
      // Bendera Indonesia
      <svg width="20" height="14" viewBox="0 0 20 14" className="rounded-sm shadow-sm">
        <rect width="20" height="7" fill="#CC0000" />
        <rect y="7" width="20" height="7" fill="#FFFFFF" />
      </svg>
    ),
  },
  en: {
    label: 'English',
    flag: (
      // Bendera UK
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

// ─── Translation Map ──────────────────────────────────────────────────────────

const T: Record<Lang, Record<string, string>> = {
  id: {
    dashboard: 'Dashboard',
    isiData: 'Isi Data KPPM',
    upload: 'Upload Hasil KP',
    nilai: 'Lihat Nilai',
    pengaturan: 'Pengaturan',
    keluar: 'Keluar',
    menuUtama: 'Menu Utama',
    loggingOut: 'Keluar...',
    nim: 'NIM',
  },
  en: {
    dashboard: 'Dashboard',
    isiData: 'Fill KPPM Data',
    upload: 'Upload KP Results',
    nilai: 'View Grades',
    pengaturan: 'Settings',
    keluar: 'Sign Out',
    menuUtama: 'Main Menu',
    loggingOut: 'Signing out...',
    nim: 'SID',
  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

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
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
  </svg>
);

// ─── Nav Icons ────────────────────────────────────────────────────────────────

const DashboardIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const EditIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const UploadIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17,8 12,3 7,8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const GradeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const SettingsIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

// ─── KPPM Logo Mark ───────────────────────────────────────────────────────────

const KPPMLogoMark = () => (
  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 5h3v10H4V5zm4 0h3l3 5-3 5h-3l3-5-3-5z" fill="#CC0000" />
    </svg>
  </div>
);

// ─── Main Layout ──────────────────────────────────────────────────────────────

export default function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUserState] = useState<{ name: string; nim?: string; role: string; prodi?: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Language state — default Indonesia
  const [lang, setLang] = useState<Lang>('id');

  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }
    const userData = getUser();
    if (userData) {
      setUserState({
        name: (userData as { name: string }).name || 'User',
        nim: (userData as { nim?: string }).nim,
        role: userData.role,
        prodi: (userData as { class?: string }).class, // fallback to class for prodi if not found, usually it's tied
      });
    }
  }, [router]);

  // Tutup semua dropdown saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangMenuOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
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

  const t = T[lang];

  const navItems = [
    { href: '/dashboard',       label: t.dashboard, icon: <DashboardIcon /> },
    { href: '/isi-data-kppm',   label: t.isiData,   icon: <EditIcon /> },
    { href: '/upload-hasil-kp', label: t.upload,    icon: <UploadIcon /> },
    { href: '/lihat-nilai',     label: t.nilai,     icon: <GradeIcon /> },
    { href: '/pengaturan',      label: t.pengaturan,icon: <SettingsIcon /> },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">

      {/* ══════════════════════════════════
          TOPBAR — Merah Solid
          ══════════════════════════════════ */}
      <header className="bg-[#CC0000] h-16 flex items-center px-4 gap-3 z-30 flex-shrink-0" style={{ boxShadow: '0 2px 16px rgba(180,0,0,0.22), 0 1px 0 rgba(0,0,0,0.08)' }}>

        {/* Toggle Sidebar */}
        <button
          id="btn-toggle-sidebar"
          onClick={() => setSidebarOpen((v) => !v)}
          className="text-white/80 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 flex-shrink-0"
        >
          <MenuIcon />
        </button>

        {/* Logo + Name */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <KPPMLogoMark />
          <div className="hidden sm:block">
            <p className="text-white font-bold text-sm leading-tight">SISTEM MANAJEMEN KPPM</p>
            <p className="text-red-200 text-[10px] leading-tight">Telkom University</p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Language Selector ── */}
        <div className="relative flex-shrink-0" ref={langRef}>
          <button
            id="btn-lang-selector"
            onClick={() => { setLangMenuOpen((v) => !v); setUserMenuOpen(false); }}
            className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-white/10 transition-colors"
            title={lang === 'id' ? 'Bahasa Indonesia' : 'English'}
          >
            <span className="text-white/70"><GlobeIcon /></span>
            <span className="hidden sm:flex items-center">{LANG_LABELS[lang].flag}</span>
            <span className="text-white text-xs font-bold uppercase hidden sm:block">{lang}</span>
            <span className="text-white/60"><ChevronDownIcon size={12} /></span>
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
              <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 mb-1">
                Bahasa / Language
              </p>
              {(['id', 'en'] as Lang[]).map((l) => (
                <button
                  key={l}
                  id={`lang-${l}`}
                  onClick={() => { setLang(l); setLangMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                    lang === l ? 'text-[#CC0000] font-semibold' : 'text-gray-700'
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

        {/* ── User Menu ── */}
        <div className="relative flex-shrink-0" ref={userRef}>
          <button
            id="btn-user-menu"
            onClick={() => { setUserMenuOpen((v) => !v); setLangMenuOpen(false); }}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#CC0000] font-bold text-sm" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.15)' }}>
              {user ? getInitials(user.name) : '?'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-white font-semibold text-sm leading-tight truncate max-w-[120px]">
                {user?.name || '...'}
              </p>
              <p className="text-red-200 text-[10px] leading-tight uppercase tracking-wide">
                {lang === 'id' ? 'Mahasiswa' : 'Student'}
              </p>
            </div>
            <span className="text-white/60"><ChevronDownIcon size={13} /></span>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-900 text-sm truncate">{user?.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {t.nim}: {user?.nim}
                </p>
                {user?.prodi && <p className="text-gray-400 text-xs mt-0.5">Kelas: {user.prodi}</p>}
              </div>
              <button
                id="btn-logout-dropdown"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                <LogoutIcon />
                {isLoggingOut ? t.loggingOut : t.keluar}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════
          BODY — Sidebar + Content
          ══════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className={`bg-white flex-shrink-0 transition-all duration-300 overflow-hidden z-20 ${sidebarOpen ? 'w-56' : 'w-0'}`} style={{ borderRight: '1px solid #ebebeb', boxShadow: '2px 0 12px rgba(0,0,0,0.05)' }}>
          <div className="w-56 overflow-y-auto h-full flex flex-col">
            {/* Profile Card */}
            <div className="p-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#CC0000] flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ boxShadow: '0 2px 6px rgba(180,0,0,0.3)' }}>
                  {user ? getInitials(user.name) : '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{user?.name || '...'}</p>
                  <p className="text-gray-400 text-xs truncate">{user?.nim}</p>
                  {user?.prodi && <p className="text-[#CC0000] text-[10px] font-semibold truncate mt-0.5">Kelas: {user.prodi}</p>}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-3 flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2 mt-1">
                {t.menuUtama}
              </p>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    id={`nav-${item.href.replace('/', '')}`}
                     className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all duration-150 ${
                      isActive ? 'bg-[#CC0000] text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    style={isActive ? { boxShadow: '0 2px 8px rgba(180,0,0,0.2)' } : undefined}
                  >
                    <span className={isActive ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-gray-100">
              <button
                id="btn-logout-sidebar"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                <LogoutIcon />
                {isLoggingOut ? t.loggingOut : t.keluar}
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
