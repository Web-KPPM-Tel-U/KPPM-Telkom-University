'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getAdminToken, getAdminUser, logoutAdmin } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

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
const AcademicIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);
const CalendarIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const UploadIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16,16 12,12 8,16" /><line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
  </svg>
);
const KPPMLogoMark = () => (
  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 5h3v10H4V5zm4 0h3l3 5-3 5h-3l3-5-3-5z" fill="#CC0000" />
    </svg>
  </div>
);

// ─── Nav items ────────────────────────────────────────────────────────────────

const navItems = [
  { href: '/admin/dashboard',  label: 'Dashboard',        icon: <DashboardIcon />, enabled: true  },
  { href: '/admin/dosen',      label: 'Kelola Dosen',     icon: <AcademicIcon />,  enabled: true  },
  { href: '/admin/mahasiswa',  label: 'Kelola Mahasiswa', icon: <UsersIcon />,     enabled: true  },
  { href: '/admin/semester',   label: 'Kelola Semester',  icon: <CalendarIcon />,  enabled: false },
  { href: '/admin/injeksi',    label: 'Injeksi CSV/XLSX', icon: <UploadIcon />,    enabled: true  },
];

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminPagesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; username: string; email: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) { router.replace('/admin-login'); return; }
    const adminUser = getAdminUser();
    if (!adminUser) { router.replace('/admin-login'); return; }
    setUser({ name: adminUser.name, username: adminUser.username, email: adminUser.email, role: adminUser.role });
  }, [router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-950 transition-colors duration-300">

      {/* ── Topbar ── */}
      <header
        className="bg-[#CC0000] dark:bg-slate-900 h-16 flex items-center px-4 gap-3 z-30 flex-shrink-0 transition-colors duration-300"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.22)' }}
      >
        <button
          id="btn-toggle-sidebar"
          onClick={() => setSidebarOpen(v => !v)}
          className="text-white/80 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 flex-shrink-0"
        >
          <MenuIcon />
        </button>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <KPPMLogoMark />
          <div className="hidden sm:block">
            <p className="text-white font-bold text-sm leading-tight">SISTEM MANAJEMEN KPPM</p>
            <p className="text-red-200 text-[10px] leading-tight">Telkom University — Admin / PIC</p>
          </div>
        </div>

        <div className="flex-1" />
        <div className="flex-shrink-0 hidden sm:block mr-2"><ThemeToggle /></div>

        {/* User dropdown */}
        <div className="relative flex-shrink-0" ref={userRef}>
          <button
            id="btn-user-menu"
            onClick={() => setUserMenuOpen(v => !v)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-[#CC0000] font-bold text-sm"
              style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.15)' }}
            >
              {user ? getInitials(user.name) : '?'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-white font-semibold text-sm leading-tight truncate max-w-[120px]">{user?.name || '...'}</p>
              <p className="text-red-200 text-[10px] leading-tight uppercase tracking-wide">{roleLabel}</p>
            </div>
            <span className="text-white/60"><ChevronDownIcon size={13} /></span>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-1.5 z-50">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">{user?.name}</p>
                <p className="text-gray-400 dark:text-slate-400 text-xs mt-0.5">{user?.email}</p>
                <p className="text-[#CC0000] dark:text-red-400 text-[10px] font-semibold mt-0.5">{roleLabel}</p>
              </div>
              <button
                id="btn-logout-dropdown"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-60"
              >
                <LogoutIcon />{isLoggingOut ? 'Keluar...' : 'Keluar'}
              </button>
              <div className="sm:hidden px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-slate-300">Tema Gelap</span>
                <ThemeToggle />
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside
          className={`bg-white dark:bg-slate-900 flex-shrink-0 transition-all duration-300 overflow-hidden z-20 border-r border-[#ebebeb] dark:border-slate-700/60 ${sidebarOpen ? 'w-56' : 'w-0'}`}
          style={{ boxShadow: '2px 0 12px rgba(0,0,0,0.05)' }}
        >
          <div className="w-56 overflow-y-auto h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full bg-[#CC0000] dark:bg-slate-800 flex items-center justify-center text-white dark:text-red-400 font-bold text-sm flex-shrink-0"
                  style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                >
                  {user ? getInitials(user.name) : '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">{user?.name || '...'}</p>
                  <p className="text-gray-400 dark:text-slate-500 text-xs truncate">{user?.email}</p>
                  <p className="text-[#CC0000] dark:text-red-400 text-[10px] font-semibold truncate mt-0.5">{roleLabel}</p>
                </div>
              </div>
            </div>

            <nav className="p-3 flex-1">
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2 mt-1">Menu Admin</p>
              {navItems.map(item => {
                const isActive = pathname === item.href;
                if (!item.enabled) {
                  return (
                    <div
                      key={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium text-gray-300 dark:text-slate-600 cursor-not-allowed select-none"
                    >
                      <span className="text-gray-300 dark:text-slate-600">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      <span className="text-[9px] font-semibold text-gray-300 dark:text-slate-600 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">Segera</span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    id={`nav-${item.href.split('/').pop()}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all duration-150 ${isActive ? 'bg-[#CC0000] text-white dark:bg-slate-800 dark:text-white' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white'}`}
                    style={isActive ? { boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : undefined}
                  >
                    <span className={isActive ? 'text-white' : 'text-gray-400 dark:text-slate-500'}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-3 border-t border-gray-100 dark:border-slate-800">
              <button
                id="btn-logout-sidebar"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-60"
              >
                <LogoutIcon />{isLoggingOut ? 'Keluar...' : 'Keluar'}
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
