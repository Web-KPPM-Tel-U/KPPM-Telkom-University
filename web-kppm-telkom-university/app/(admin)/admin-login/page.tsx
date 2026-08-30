'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin, setAdminToken, setAdminUser, getAdminToken } from '@/lib/api';

// ─── Icons ────────────────────────────────────────────────────────────────────

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
const SuccessIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

// ─── Left Panel ───────────────────────────────────────────────────────────────

const LeftIllustration = () => (
  <div
    className="relative w-full h-full flex flex-col items-center justify-center px-4 py-10 overflow-hidden backdrop-blur-sm"
    style={{ background: 'linear-gradient(135deg, rgba(180,0,0,0.82) 0%, rgba(100,0,0,0.88) 60%, rgba(50,0,0,0.92) 100%)' }}
  >
    {/* Decorative circles */}
    <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
    <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5" />
    <div className="absolute top-1/3 -right-10 w-40 h-40 rounded-full bg-red-400/20" />

    {/* Grid lines */}
    <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
      {[...Array(8)].map((_, i) => <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60} y2="600" stroke="white" strokeWidth="0.5" />)}
      {[...Array(12)].map((_, i) => <line key={`h${i}`} x1="0" y1={i * 55} x2="400" y2={i * 55} stroke="white" strokeWidth="0.5" />)}
    </svg>

    {/* Admin/Shield Illustration */}
    <svg viewBox="0 0 320 275" fill="none" className="w-full max-w-[380px] relative z-10 drop-shadow-2xl transition-transform duration-500 hover:scale-[1.03]">
      {/* Server/panel base */}
      <rect x="80" y="160" width="160" height="80" rx="10" fill="#fff" fillOpacity="0.15" />
      <rect x="90" y="170" width="140" height="10" rx="5" fill="#fff" fillOpacity="0.2" />
      <rect x="90" y="185" width="140" height="10" rx="5" fill="#fff" fillOpacity="0.15" />
      <rect x="90" y="200" width="140" height="10" rx="5" fill="#fff" fillOpacity="0.1" />
      {/* Status dots */}
      <circle cx="102" cy="175" r="3" fill="#4ade80" fillOpacity="0.9" />
      <circle cx="112" cy="175" r="3" fill="#facc15" fillOpacity="0.9" />
      <circle cx="122" cy="175" r="3" fill="#ff6b6b" fillOpacity="0.9" />

      {/* Main shield */}
      <path d="M160 50 L200 68 L200 112 C200 138 183 156 160 165 C137 156 120 138 120 112 L120 68 Z" fill="#fff" fillOpacity="0.18" />
      <path d="M160 58 L194 73 L194 112 C194 134 179 149 160 157 C141 149 126 134 126 112 L126 73 Z" fill="#fff" fillOpacity="0.1" />
      {/* Checkmark in shield */}
      <polyline points="148,107 157,116 174,99" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fillOpacity="0" />

      {/* Floating card top-left */}
      <rect x="22" y="80" width="80" height="55" rx="10" fill="white" fillOpacity="0.13" />
      <rect x="32" y="92" width="40" height="4" rx="2" fill="white" fillOpacity="0.6" />
      <rect x="32" y="101" width="55" height="3" rx="1.5" fill="white" fillOpacity="0.35" />
      <rect x="32" y="109" width="45" height="3" rx="1.5" fill="white" fillOpacity="0.25" />
      <rect x="32" y="120" width="50" height="9" rx="4" fill="#fff" fillOpacity="0.18" />
      <rect x="38" y="123" width="22" height="4" rx="2" fill="white" fillOpacity="0.7" />

      {/* Floating card top-right */}
      <rect x="218" y="72" width="80" height="55" rx="10" fill="white" fillOpacity="0.13" />
      <rect x="228" y="84" width="45" height="4" rx="2" fill="white" fillOpacity="0.6" />
      <rect x="228" y="93" width="55" height="3" rx="1.5" fill="white" fillOpacity="0.35" />
      <rect x="228" y="101" width="38" height="3" rx="1.5" fill="white" fillOpacity="0.25" />
      <circle cx="248" cy="116" r="8" fill="#4ade80" fillOpacity="0.8" />
      <polyline points="244,116 247,119 253,112" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Lock icon floating bottom-left */}
      <rect x="25" y="165" width="72" height="40" rx="10" fill="white" fillOpacity="0.13" />
      <rect x="46" y="170" width="28" height="20" rx="6" fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="2.5" />
      <path d="M52 170 Q61 163 70 170" stroke="white" strokeOpacity="0.6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="61" cy="181" r="3" fill="white" fillOpacity="0.8" />

      {/* Person silhouette */}
      <circle cx="160" cy="220" r="14" fill="#fff" fillOpacity="0.15" />
      <path d="M140 248 Q160 238 180 248 L183 260 H137 Z" fill="#fff" fillOpacity="0.12" />

      {/* Bottom decoration dots */}
      <circle cx="80" cy="265" r="5" fill="white" fillOpacity="0.3" />
      <circle cx="100" cy="270" r="3" fill="white" fillOpacity="0.2" />
      <circle cx="220" cy="260" r="4" fill="white" fillOpacity="0.25" />
      <circle cx="240" cy="272" r="6" fill="white" fillOpacity="0.15" />
    </svg>

    {/* Text */}
    <div className="relative z-10 text-center mt-4">
      <p className="text-white font-bold text-[26px] leading-tight">
        Kelola Sistem KPPM<br />
        <span className="text-red-200">lebih efisien</span> dan aman
      </p>
      <p className="text-red-200/80 text-[15px] mt-3.5 leading-relaxed max-w-[320px] mx-auto">
        Panel administrasi untuk mengelola data dosen, mahasiswa, dan konfigurasi sistem KPPM Telkom University.
      </p>
    </div>

    {/* Feature pills */}
    <div className="relative z-10 flex flex-wrap justify-center gap-2.5 mt-6">
      {['Kelola Dosen', 'Kelola Mahasiswa', 'Injeksi Data'].map((f) => (
        <span key={f} className="px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-[13px] font-semibold border border-white/20 shadow-sm">
          {f}
        </span>
      ))}
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');

  // Vanta.js background
  const vantaRef    = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    if (getAdminToken()) router.replace('/admin/dashboard');
  }, [router]);

  useEffect(() => {
    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = reject;
        document.head.appendChild(s);
      });

    (async () => {
      try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.1.9/p5.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.topology.min.js');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const W = window as any;
        if (vantaRef.current && W.VANTA && !vantaEffect.current) {
          vantaEffect.current = W.VANTA.TOPOLOGY({
            el: vantaRef.current,
            p5: W.p5,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200,
            minWidth: 200,
            scale: 1.0,
            scaleMobile: 1.0,
            color: 0xcd4b4b,
            backgroundColor: 0xffffff,
          });
        }
      } catch (e) {
        console.warn('Vanta.js failed to load', e);
      }
    })();

    return () => {
      if (vantaEffect.current) { vantaEffect.current.destroy(); vantaEffect.current = null; }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError('Email dan password wajib diisi.'); return; }
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await loginAdmin(email.trim(), password);
      if (res.success && res.data) {
        setAdminToken(res.data.token);
        setAdminUser(res.data.user);
        setSuccess('Login berhasil. Mengalihkan...');
        setTimeout(() => router.replace('/admin/dashboard'), 700);
      } else {
        setError(res.message || 'Email atau password salah.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-white">
      {/* Vanta.js animated background */}
      <div ref={vantaRef} className="absolute inset-0 z-0" />

      {/* Outer card — split layout */}
      <div
        className="relative z-10 w-full max-w-5xl flex rounded-2xl sm:rounded-3xl overflow-hidden"
        style={{
          minHeight: '580px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.35)',
        }}
      >
        {/* ── LEFT PANEL ── */}
        <div className="hidden lg:flex lg:w-5/12 flex-shrink-0">
          <LeftIllustration />
        </div>

        {/* ── RIGHT PANEL — Form ── */}
        <div className="flex-1 bg-white flex flex-col justify-start px-5 sm:px-10 pt-8 sm:pt-12 pb-6 sm:pb-8 min-w-0">

          {/* Logo + Title */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-5 mb-4 sm:mb-6">
              {/* Logo icon */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[16px] sm:rounded-[20px] bg-gradient-to-tr from-[#CC0000] to-[#E60000] flex items-center justify-center flex-shrink-0 relative overflow-hidden group shadow-[0_8px_24px_-6px_rgba(204,0,0,0.5)] border border-[#ff3333]/30">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-[20px]" />
                <div className="relative z-10 drop-shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="26" height="26" className="sm:w-8 sm:h-8">
                    <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3ZM5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h2 className="font-black text-gray-900 text-[16px] sm:text-[22px] leading-tight tracking-tight uppercase break-words" style={{ letterSpacing: '0.01em' }}>
                  Sistem Manajemen KPPM
                </h2>
                <p className="text-[#CC0000] text-[11px] sm:text-[14px] font-extrabold tracking-widest mt-0.5 uppercase" style={{ letterSpacing: '0.08em' }}>
                  Telkom University
                </p>
              </div>
            </div>

            <h1 className="text-[24px] sm:text-[32px] font-extrabold text-gray-900 tracking-tight leading-tight">Portal Admin</h1>
            <p className="text-gray-500 text-[13px] sm:text-[15px] mt-2 font-medium leading-relaxed">
              Masuk menggunakan kredensial resmi untuk mengakses panel administrasi sistem KPPM.
            </p>
          </div>

          {/* Form */}
          <form id="form-admin" onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label htmlFor="input-admin-email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
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

            {/* Password */}
            <div>
              <label htmlFor="input-admin-password" className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="input-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] transition-all bg-gray-50 focus:bg-white disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Error / Success messages */}
            {(error || success) && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                {error && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2.5 shadow-sm">
                    <span className="mt-0.5 flex-shrink-0 text-red-500"><AlertIcon /></span>
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-start gap-2.5 shadow-sm">
                    <span className="mt-0.5 flex-shrink-0 text-green-500"><SuccessIcon /></span>
                    <span>{success}</span>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              id="btn-login-admin"
              type="submit"
              disabled={loading}
              className="w-full bg-[#CC0000] hover:bg-[#A30000] disabled:bg-[#CC0000]/50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 text-sm tracking-wide shadow-sm hover:shadow-md"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-300 mt-auto pt-8">
            &copy; {new Date().getFullYear()} Telkom University &mdash; Sistem Manajemen KPPM
          </p>
        </div>
      </div>
    </div>
  );
}
