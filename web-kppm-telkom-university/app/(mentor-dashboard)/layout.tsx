'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, getUser, logout, removeToken } from '@/lib/api';
import type { MentorUser } from '@/lib/api';

// ─── Icons ─────────────────────────────────────────────────────────────────────
const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" />
  </svg>
);
const LogOutIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const XIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const NAV_ITEMS = [
  { href: '/mentor/dashboard', label: 'Dashboard', icon: <HomeIcon /> },
];

export default function MentorDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mentor, setMentor] = useState<MentorUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }
    const user = getUser();
    if (!user || user.role !== 'mentor') { router.replace('/login'); return; }
    setMentor(user as MentorUser);
  }, [router]);

  const handleLogout = async () => {
    await logout();
    removeToken();
    router.push('/login');
  };

  const initials = mentor?.email?.substring(0, 2).toUpperCase() || 'MT';

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`${mobile
        ? 'fixed inset-y-0 left-0 z-50 w-64 shadow-2xl'
        : 'hidden lg:flex w-64 flex-col'
      } bg-white border-r border-gray-100 flex flex-col`}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#CC0000] rounded-xl flex items-center justify-center shadow-md">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M7 8h5v16H7V8zm6 0h5l5 8-5 8h-5l5-8-5-8z" fill="white" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">SISTEM KPPM</p>
            <p className="text-gray-400 text-[10px]">Portal Mentor</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                ? 'bg-[#CC0000] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* User area */}
      <div className="px-4 py-5 border-t border-gray-100 pb-16 lg:pb-6 bg-gray-50 mt-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#CC0000]/10 text-[#CC0000] flex items-center justify-center text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate" title={mentor?.email}>{mentor?.email || 'Mentor'}</p>
            <span className="inline-block text-[10px] bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full mt-0.5">
              Mentor
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-600 bg-white border border-red-100 hover:bg-red-50 rounded-xl transition-all font-bold shadow-sm"
        >
          <LogOutIcon />
          Keluar
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile overlay + sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <Sidebar mobile />
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3.5 bg-white border-b border-gray-100 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900">
            <MenuIcon />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#CC0000] rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <path d="M7 8h5v16H7V8zm6 0h5l5 8-5 8h-5l5-8-5-8z" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm">Portal Mentor</span>
          </div>
          {sidebarOpen ? (
            <button onClick={() => setSidebarOpen(false)} className="text-gray-600 hover:text-gray-900">
              <XIcon />
            </button>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-[#CC0000]/10 text-[#CC0000] flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
