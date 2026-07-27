'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getToken, getUser, logout, removeToken } from '@/lib/api';
import type { MentorUser } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

// ─── Icons ─────────────────────────────────────────────────────────────────────
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

const HomeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" />
  </svg>
);

const ClipboardIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
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

// ─── Nav Items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/mentor/dashboard', label: 'Dashboard',   icon: <HomeIcon /> },
  { href: '/mentor/nilai',     label: 'Input Nilai', icon: <ClipboardIcon /> },
];

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function MentorDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [mentor, setMentor] = useState<MentorUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }
    const user = getUser();
    if (!user || user.role !== 'mentor') { router.replace('/login'); return; }
    setMentor(user as MentorUser);
  }, [router]);

  // Close dropdown saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    removeToken();
    router.push('/login');
  };

  const getInitials = (email: string) =>
    email?.substring(0, 2).toUpperCase() || 'MT';

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-950 transition-colors duration-300">

      {/* ══════════════════════════════════
          TOPBAR
          ══════════════════════════════════ */}
      <header
        className="bg-[#CC0000] dark:bg-slate-900 h-16 flex items-center px-4 gap-3 z-30 flex-shrink-0 transition-colors duration-300"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.22), 0 1px 0 rgba(0,0,0,0.08)' }}
      >
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

        {/* Theme Toggle */}
        <div className="flex-shrink-0 hidden sm:block mr-2">
          <ThemeToggle />
        </div>

        {/* User Menu */}
        <div className="relative flex-shrink-0" ref={userRef}>
          <button
            id="btn-user-menu"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-white/10 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-[#CC0000] dark:text-red-400 font-bold text-sm"
              style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.15)' }}
            >
              {mentor ? getInitials(mentor.email) : '?'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-white font-semibold text-sm leading-tight truncate max-w-[120px]">
                {mentor?.email || '...'}
              </p>
              <p className="text-red-200 text-[10px] leading-tight uppercase tracking-wide">
                Mentor
              </p>
            </div>
            <span className="text-white/60"><ChevronDownIcon size={13} /></span>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-1.5 z-50 transition-colors duration-300">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">{mentor?.email || 'Mentor'}</p>
                <span className="inline-block text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-semibold px-2 py-0.5 rounded-full mt-1">
                  Portal Mentor
                </span>
              </div>
              <button
                id="btn-logout-dropdown"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-60"
              >
                <LogoutIcon />
                {isLoggingOut ? 'Keluar...' : 'Keluar'}
              </button>
              {/* Theme toggle for mobile */}
              <div className="sm:hidden px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-slate-300">Tema Gelap</span>
                <ThemeToggle />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════
          BODY — Sidebar + Content
          ══════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside
          className={`bg-white dark:bg-slate-900 flex-shrink-0 transition-all duration-300 overflow-hidden z-20 border-r border-[#ebebeb] dark:border-slate-700/60 ${sidebarOpen ? 'w-56' : 'w-0'}`}
          style={{ boxShadow: '2px 0 12px rgba(0,0,0,0.05)' }}
        >
          <div className="w-56 overflow-y-auto h-full flex flex-col">
            {/* Profile Card */}
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full bg-[#CC0000] dark:bg-slate-800 flex items-center justify-center text-white dark:text-red-400 font-bold text-sm flex-shrink-0"
                  style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                >
                  {mentor ? getInitials(mentor.email) : '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">{mentor?.email || '...'}</p>
                  <span className="inline-block text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-semibold px-1.5 py-0.5 rounded-full mt-0.5">
                    Mentor
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-3 flex-1">
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2 mt-1">
                Menu Utama
              </p>
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    id={`nav-${item.href.replace(/\//g, '-')}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-[#CC0000] text-white dark:bg-slate-800 dark:text-white'
                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    style={isActive ? { boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : undefined}
                  >
                    <span className={isActive ? 'text-white' : 'text-gray-400 dark:text-slate-500'}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-gray-100 dark:border-slate-800">
              <button
                id="btn-logout-sidebar"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-60"
              >
                <LogoutIcon />
                {isLoggingOut ? 'Keluar...' : 'Keluar'}
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
