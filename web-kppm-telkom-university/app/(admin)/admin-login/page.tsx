'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin, setAdminToken, setAdminUser, getAdminToken } from '@/lib/api';

const EyeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const AlertIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const KPPMLogo = () => (
  <div className="flex flex-col items-center gap-3 mb-6">
    <div className="w-14 h-14 bg-[#CC0000] rounded-2xl flex items-center justify-center shadow-md">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M7 8h5v16H7V8zm6 0h5l5 8-5 8h-5l5-8-5-8z" fill="white" />
      </svg>
    </div>
    <div className="text-center">
      <p className="font-bold text-gray-900 text-base leading-tight">SISTEM MANAJEMEN KPPM</p>
      <p className="text-gray-400 text-xs mt-0.5">Telkom University — Admin / PIC</p>
    </div>
  </div>
);

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (getAdminToken()) router.replace('/admin/dashboard');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email dan password wajib diisi.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await loginAdmin(email.trim(), password);
      if (res.success && res.data) {
        setAdminToken(res.data.token);
        setAdminUser(res.data.user);
        router.replace('/admin/dashboard');
      } else {
        setError(res.message || 'Username atau password salah.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-white">
      {/* Background — sama persis dengan halaman login utama */}
      <div className="absolute inset-0 z-0 bg-[#CC0000] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=100&w=3000&auto=format&fit=crop')] bg-cover bg-center grayscale contrast-150 mix-blend-screen rotate-180" />
        <div className="absolute inset-0 bg-white/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent" />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            <KPPMLogo />
            <h1 className="text-xl font-bold text-gray-900 text-center">Portal Admin / PIC</h1>
            <p className="text-gray-400 text-sm text-center mt-1">Akses terbatas — gunakan kredensial resmi</p>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2.5">
                <span className="mt-0.5 flex-shrink-0 text-red-500"><AlertIcon /></span>
                <span>{error}</span>
              </div>
            )}

            <form id="form-admin" onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input
                  id="input-admin-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@telkomuniversity.ac.id"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] transition-all bg-gray-50 focus:bg-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    id="input-admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] transition-all bg-gray-50 focus:bg-white disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <button
                id="btn-login-admin"
                type="submit"
                disabled={loading}
                className="w-full bg-[#CC0000] hover:bg-[#A30000] disabled:bg-[#CC0000]/50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 text-sm tracking-wide"
              >
                {loading ? 'Memproses...' : 'Masuk sebagai Admin / PIC'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          &copy; {new Date().getFullYear()} Telkom University &mdash; Sistem Manajemen KPPM
        </p>
      </div>
    </div>
  );
}
