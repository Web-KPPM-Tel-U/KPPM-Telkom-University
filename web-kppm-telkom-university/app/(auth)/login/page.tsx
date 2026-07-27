'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  loginMahasiswa,
  loginDosen,
  sendMentorOtp,
  verifyMentorOtp,
  setToken,
  setUser,
  getToken,
} from '@/lib/api';

// ─── Icons ────────────────────────────────────────────────────────────────────

const EyeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
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
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const SuccessIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

// ─── KPPM Logo ────────────────────────────────────────────────────────────────

const KPPMLogo = () => (
  <div className="flex flex-col items-center gap-3 mb-6">
    <div className="w-14 h-14 bg-[#CC0000] rounded-2xl flex items-center justify-center shadow-md">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M7 8h5v16H7V8zm6 0h5l5 8-5 8h-5l5-8-5-8z" fill="white" />
      </svg>
    </div>
    <div className="text-center">
      <p className="font-bold text-gray-900 text-base leading-tight">SISTEM MANAJEMEN KPPM</p>
      <p className="text-gray-400 text-xs mt-0.5">Telkom University</p>
    </div>
  </div>
);

type TabRole = 'mahasiswa' | 'dosen' | 'mentor';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabRole>('mahasiswa');

  // ── Mahasiswa state
  const [mahasiswaEmail, setMahasiswaEmail] = useState('');
  const [mahasiswaPassword, setMahasiswaPassword] = useState('');
  const [showMahasiswaPassword, setShowMahasiswaPassword] = useState(false);

  // ── Dosen state
  const [dosenEmail, setDosenEmail] = useState('');
  const [dosenPassword, setDosenPassword] = useState('');
  const [showDosenPassword, setShowDosenPassword] = useState(false);

  // ── Mentor state
  const [mentorEmail, setMentorEmail] = useState('');
  const [mentorOtp, setMentorOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // ── Global state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect jika sudah login
  useEffect(() => {
    if (getToken()) router.replace('/dashboard');
  }, [router]);

  // Countdown OTP
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const clearMessages = () => { setError(''); setSuccess(''); };

  // ── Handler: Login Mahasiswa ─────────────────────────────────────────────────
  const handleMahasiswaLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!mahasiswaEmail.trim() || !mahasiswaPassword.trim()) { setError('Email dan password wajib diisi'); return; }
    setIsLoading(true);
    try {
      const res = await loginMahasiswa(mahasiswaEmail.trim(), mahasiswaPassword);
      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        setSuccess('Login berhasil. Mengalihkan...');
        setTimeout(() => router.push('/dashboard'), 700);
      } else {
        setError(res.message || 'Email atau password salah.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server. Pastikan backend berjalan.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handler: Login Dosen ─────────────────────────────────────────────────────
  const handleDosenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!dosenEmail.trim() || !dosenPassword.trim()) { setError('Email dan password wajib diisi'); return; }
    setIsLoading(true);
    try {
      const res = await loginDosen(dosenEmail.trim(), dosenPassword);
      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        setSuccess('Login berhasil. Mengalihkan...');
        setTimeout(() => router.push('/dosen/dashboard'), 700);
      } else {
        setError(res.message || 'Email atau password salah.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server. Pastikan backend berjalan.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handler: Kirim OTP ───────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    clearMessages();
    if (!mentorEmail.trim()) { setError('Email wajib diisi'); return; }
    setIsLoading(true);
    try {
      const res = await sendMentorOtp(mentorEmail.trim());
      if (res.success) {
        setOtpSent(true);
        setOtpCountdown(60);
        setSuccess(`Kode OTP telah dikirim ke ${mentorEmail}. Silakan cek inbox email Anda.`);
      } else {
        setError(res.message || 'Gagal mengirim OTP.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handler: Verify OTP ──────────────────────────────────────────────────────
  const handleMentorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!mentorOtp.trim() || mentorOtp.length !== 6) { setError('Masukkan OTP 6 digit yang valid'); return; }
    setIsLoading(true);
    try {
      const res = await verifyMentorOtp(mentorEmail.trim(), mentorOtp.trim());
      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        setSuccess('Verifikasi berhasil. Mengalihkan...');
        setTimeout(() => router.push('/mentor/dashboard'), 700);
      } else {
        setError(res.message || 'OTP tidak valid atau sudah kadaluarsa.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { key: TabRole; label: string }[] = [
    { key: 'mahasiswa', label: 'Mahasiswa' },
    { key: 'dosen', label: 'Dosen / Staf' },
    { key: 'mentor', label: 'Mentor' },
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-white">
      {/* HD Background Image (Perfect Red & White Pattern Mapping) */}
      <div className="absolute inset-0 z-0 bg-[#CC0000] overflow-hidden">
        {/* mix-blend-screen maps the grayscale image perfectly to Red (shadows) and White (highlights).
            We rotate the image 180deg to move its natural dark shadow to the bottom, where it is completely hidden by the white fade overlay. */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=100&w=3000&auto=format&fit=crop')] bg-cover bg-center grayscale contrast-150 mix-blend-screen rotate-180"></div>
        
        {/* Uniform white overlay to soften the entire image */}
        <div className="absolute inset-0 bg-white/30"></div>
        {/* Smooth white fade covering the bottom half so the form remains clean and highly readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent"></div>
      </div>
      <div className="w-full max-w-md z-10">
        {/* ── Card ── */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

          {/* ── Card Header — Logo + Nama ── */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            <KPPMLogo />
            <h1 className="text-xl font-bold text-gray-900 text-center">Masuk ke KPPM</h1>
            <p className="text-gray-400 text-sm text-center mt-1">Pilih role Anda untuk melanjutkan</p>
          </div>

          {/* ── Tab Switcher ── */}
          <div className="flex border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                id={`tab-${tab.key}`}
                onClick={() => { setActiveTab(tab.key); clearMessages(); }}
                className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === tab.key
                    ? 'border-[#CC0000] text-[#CC0000] bg-red-50/60'
                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Form Area ── */}
          <div className="px-8 py-7">
            {/* Pesan Error / Sukses */}
            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2.5">
                <span className="mt-0.5 flex-shrink-0 text-red-500"><AlertIcon /></span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-5 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-start gap-2.5">
                <span className="mt-0.5 flex-shrink-0 text-green-500"><SuccessIcon /></span>
                <span>{success}</span>
              </div>
            )}

            {/* ── Tab: Mahasiswa ── */}
            {activeTab === 'mahasiswa' && (
              <form id="form-mahasiswa" onSubmit={handleMahasiswaLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Mahasiswa</label>
                  <input
                    id="input-mahasiswa-email"
                    type="email"
                    value={mahasiswaEmail}
                    onChange={(e) => setMahasiswaEmail(e.target.value)}
                    placeholder="email@student.telkomuniversity.ac.id"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] transition-all bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      id="input-mahasiswa-password"
                      type={showMahasiswaPassword ? 'text' : 'password'}
                      value={mahasiswaPassword}
                      onChange={(e) => setMahasiswaPassword(e.target.value)}
                      placeholder="Masukkan password"
                      className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] transition-all bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMahasiswaPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showMahasiswaPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <div className="text-right mt-1.5">
                    <a href="#" className="text-[#CC0000] text-xs hover:underline font-medium">
                      Lupa Password?
                    </a>
                  </div>
                </div>
                <button
                  id="btn-login-mahasiswa"
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#CC0000] hover:bg-[#A30000] disabled:bg-[#CC0000]/50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 text-sm tracking-wide"
                >
                  {isLoading ? 'Memproses...' : 'Masuk'}
                </button>
                <p className="text-center text-sm text-gray-500">
                  Belum punya akun?{' '}
                  <a href="/register" className="text-[#CC0000] font-semibold hover:underline">
                    Registrasi Mahasiswa
                  </a>
                </p>
              </form>
            )}

            {/* ── Tab: Dosen ── */}
            {activeTab === 'dosen' && (
              <form id="form-dosen" onSubmit={handleDosenLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Dosen</label>
                  <input
                    id="input-dosen-email"
                    type="email"
                    value={dosenEmail}
                    onChange={(e) => setDosenEmail(e.target.value)}
                    placeholder="nama@telkomuniversity.ac.id"
                    autoComplete="email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] transition-all bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      id="input-dosen-password"
                      type={showDosenPassword ? 'text' : 'password'}
                      value={dosenPassword}
                      onChange={(e) => setDosenPassword(e.target.value)}
                      placeholder="Masukkan password"
                      className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] transition-all bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDosenPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showDosenPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Password default: NIP Anda</p>
                </div>
                <button
                  id="btn-login-dosen"
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#CC0000] hover:bg-[#A30000] disabled:bg-[#CC0000]/50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 text-sm tracking-wide"
                >
                  {isLoading ? 'Memproses...' : 'Masuk sebagai Dosen'}
                </button>
              </form>
            )}

            {/* ── Tab: Mentor ── */}
            {activeTab === 'mentor' && (
              <form id="form-mentor" onSubmit={handleMentorLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Mentor</label>
                  <div className="flex gap-2">
                    <input
                      id="input-mentor-email"
                      type="email"
                      value={mentorEmail}
                      onChange={(e) => { setMentorEmail(e.target.value); setOtpSent(false); }}
                      placeholder="email@perusahaan.com"
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] transition-all bg-gray-50 focus:bg-white disabled:opacity-60"
                    />
                    <button
                      id="btn-send-otp"
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading || otpCountdown > 0}
                      className="px-4 py-3 bg-[#CC0000] hover:bg-[#A30000] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all whitespace-nowrap"
                    >
                      {isLoading ? '...' : otpCountdown > 0 ? `${otpCountdown}s` : 'Kirim OTP'}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kode OTP (6 Digit)</label>
                      <input
                        id="input-mentor-otp"
                        type="text"
                        value={mentorOtp}
                        onChange={(e) => setMentorOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] transition-all text-center text-xl font-mono tracking-[0.5em] bg-gray-50 focus:bg-white"
                      />
                      <p className="text-xs text-gray-400 mt-1.5 text-center">OTP berlaku 5 menit</p>
                    </div>
                    <button
                      id="btn-verify-otp"
                      type="submit"
                      disabled={isLoading || mentorOtp.length !== 6}
                      className="w-full bg-[#CC0000] hover:bg-[#A30000] disabled:bg-[#CC0000]/50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-200 text-sm tracking-wide"
                    >
                      {isLoading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
                    </button>
                  </>
                )}

                {!otpSent && (
                  <p className="text-center text-xs text-gray-400">
                    Klik &quot;Kirim OTP&quot; untuk menerima kode verifikasi via email
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-5">
          &copy; {new Date().getFullYear()} Telkom University &mdash; Sistem Manajemen KPPM
        </p>
      </div>
    </div>
  );
}
