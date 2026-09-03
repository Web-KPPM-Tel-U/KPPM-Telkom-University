'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  loginMahasiswa,
  loginDosen,
  sendMentorOtp,
  verifyMentorOtp,
  setToken,
  setUser,
  getToken,
  forgotPasswordSendOtp,
  forgotPasswordVerifyReset,
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

// ─── Left Panel Illustration ───────────────────────────────────────────────────

const LeftIllustration = () => (
  <div className="relative w-full h-full flex flex-col items-center justify-center px-4 py-10 overflow-hidden backdrop-blur-sm"
    style={{ background: 'linear-gradient(135deg, rgba(180,0,0,0.82) 0%, rgba(100,0,0,0.88) 60%, rgba(50,0,0,0.92) 100%)' }}>

    {/* Decorative circles */}
    <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
    <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5" />
    <div className="absolute top-1/3 -right-10 w-40 h-40 rounded-full bg-red-400/20" />

    {/* Grid lines decoration */}
    <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
      {[...Array(8)].map((_, i) => (
        <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60} y2="600" stroke="white" strokeWidth="0.5" />
      ))}
      {[...Array(12)].map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 55} x2="400" y2={i * 55} stroke="white" strokeWidth="0.5" />
      ))}
    </svg>

    {/* Main SVG Illustration */}
    <svg viewBox="0 0 320 275" fill="none" className="w-full max-w-[420px] relative z-10 drop-shadow-2xl transition-transform duration-500 hover:scale-[1.03]">
      {/* Laptop base */}
      <rect x="60" y="200" width="200" height="12" rx="6" fill="#fff" fillOpacity="0.15" />
      <rect x="75" y="115" width="170" height="90" rx="8" fill="#fff" fillOpacity="0.18" />
      <rect x="80" y="119" width="160" height="82" rx="6" fill="#fff" fillOpacity="0.10" />
      {/* Screen content lines */}
      <rect x="90" y="128" width="80" height="5" rx="2.5" fill="white" fillOpacity="0.5" />
      <rect x="90" y="138" width="55" height="4" rx="2" fill="white" fillOpacity="0.3" />
      <rect x="90" y="148" width="100" height="3" rx="1.5" fill="white" fillOpacity="0.25" />
      <rect x="90" y="155" width="70" height="3" rx="1.5" fill="white" fillOpacity="0.25" />
      <rect x="90" y="165" width="120" height="20" rx="4" fill="#fff" fillOpacity="0.15" />
      <rect x="95" y="170" width="40" height="5" rx="2.5" fill="white" fillOpacity="0.5" />
      {/* Laptop keyboard */}
      <rect x="75" y="206" width="170" height="6" rx="3" fill="#fff" fillOpacity="0.08" />

      {/* Floating document card top-right */}
      <rect x="215" y="80" width="80" height="60" rx="8" fill="white" fillOpacity="0.15" />
      <rect x="222" y="90" width="45" height="4" rx="2" fill="white" fillOpacity="0.6" />
      <rect x="222" y="99" width="55" height="3" rx="1.5" fill="white" fillOpacity="0.35" />
      <rect x="222" y="107" width="38" height="3" rx="1.5" fill="white" fillOpacity="0.35" />
      <rect x="222" y="118" width="60" height="12" rx="4" fill="#fff" fillOpacity="0.2" />
      <rect x="228" y="121" width="25" height="4" rx="2" fill="white" fillOpacity="0.7" />

      {/* Floating badge — "Approved" */}
      <rect x="22" y="150" width="75" height="34" rx="10" fill="white" fillOpacity="0.15" />
      <circle cx="38" cy="167" r="7" fill="#4ade80" fillOpacity="0.9" />
      <polyline points="34,167 37,171 43,163" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="49" y="162" width="38" height="4" rx="2" fill="white" fillOpacity="0.7" />
      <rect x="49" y="169" width="25" height="3" rx="1.5" fill="white" fillOpacity="0.4" />

      {/* Person silhouette */}
      {/* Head */}
      <circle cx="160" cy="75" r="28" fill="#fff" fillOpacity="0.15" />
      <circle cx="160" cy="72" r="16" fill="#fff" fillOpacity="0.25" />
      {/* Graduation cap */}
      <rect x="145" y="54" width="30" height="4" rx="2" fill="white" fillOpacity="0.8" />
      <polygon points="160,46 178,56 160,60 142,56" fill="white" fillOpacity="0.9" />
      <line x1="178" y1="56" x2="182" y2="64" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="182" cy="65" r="2.5" fill="white" fillOpacity="0.8" />
      {/* Body */}
      <path d="M136 103 Q160 96 184 103 L190 200 H130 Z" fill="#fff" fillOpacity="0.13" />
      {/* Arms */}
      <path d="M136 115 Q110 130 105 155" stroke="white" strokeWidth="8" strokeLinecap="round" fillOpacity="0" fill="none" opacity="0.2" />
      <path d="M184 115 Q205 135 200 160" stroke="white" strokeWidth="8" strokeLinecap="round" fillOpacity="0" fill="none" opacity="0.2" />

      {/* Floating stat pill */}
      <rect x="195" y="175" width="90" height="32" rx="10" fill="white" fillOpacity="0.15" />
      <rect x="203" y="183" width="30" height="4" rx="2" fill="white" fillOpacity="0.5" />
      <rect x="203" y="190" width="50" height="5" rx="2.5" fill="white" fillOpacity="0.8" />
      <rect x="255" y="182" width="22" height="18" rx="5" fill="#fff" fillOpacity="0.2" />

      {/* Small floating icons */}
      <rect x="28" y="90" width="36" height="36" rx="10" fill="white" fillOpacity="0.12" />
      <path d="M38 108 h16 M38 102 h10 M38 114 h14" stroke="white" strokeWidth="1.8" strokeLinecap="round" />

      <rect x="255" y="140" width="36" height="36" rx="10" fill="white" fillOpacity="0.12" />
      <circle cx="273" cy="155" r="6" stroke="white" strokeWidth="1.8" />
      <path d="M273 149 V146 M273 164 V161 M267 155 H264 M282 155 H279" stroke="white" strokeWidth="1.5" strokeLinecap="round" />

      {/* Bottom decoration dots */}
      <circle cx="80" cy="265" r="5" fill="white" fillOpacity="0.3" />
      <circle cx="100" cy="270" r="3" fill="white" fillOpacity="0.2" />
      <circle cx="220" cy="260" r="4" fill="white" fillOpacity="0.25" />
      <circle cx="240" cy="272" r="6" fill="white" fillOpacity="0.15" />
    </svg>

    {/* Text */}
    <div className="relative z-10 text-center mt-4">
      <p className="text-white font-bold text-[26px] leading-tight">
        Kelola Kerja Praktek<br />
        <span className="text-red-200">lebih mudah</span> dan terstruktur
      </p>
      <p className="text-red-200/80 text-[15px] mt-3.5 leading-relaxed max-w-[340px] mx-auto">
        Sistem informasi terpadu untuk pengelolaan program Kerja Praktik dan Pengabdian Masyarakat secara profesional.
      </p>
    </div>

    {/* Feature pills */}
    <div className="relative z-10 flex flex-wrap justify-center gap-2.5 mt-6">
      {['Pendaftaran KP', 'Monitoring', 'Penilaian'].map((f) => (
        <span key={f} className="px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-[13px] font-semibold border border-white/20 shadow-sm">
          {f}
        </span>
      ))}
    </div>
  </div>
);

type TabRole = 'mahasiswa' | 'dosen' | 'mentor';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabRole>('mahasiswa');
  const slideDirectionRef = useRef<1 | -1>(1);

  // ── Mahasiswa state
  const [mahasiswaNim, setMahasiswaNim] = useState('');
  const [mahasiswaPassword, setMahasiswaPassword] = useState('');
  const [showMahasiswaPassword, setShowMahasiswaPassword] = useState(false);

  // ── Dosen state
  const [dosenNip, setDosenNip] = useState('');
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

  // ── Forgot Password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Toggle Forgot Password modal
  const openForgotPassword = () => {
    setShowForgotPassword(true);
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp('');
    setForgotError('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Forgot Password handlers (connected to API)
  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    // Validasi domain — hanya email Telkom University yang diperbolehkan
    if (!forgotEmail.toLowerCase().endsWith('telkomuniversity.ac.id')) {
      setForgotError('Email harus menggunakan domain telkomuniversity.ac.id');
      return;
    }

    setIsForgotLoading(true);
    setForgotError('');
    try {
      const res = await forgotPasswordSendOtp(forgotEmail);
      if (res.success) {
        setForgotStep(2);
      } else {
        setForgotError(res.message || 'Gagal mengirim OTP.');
      }
    } catch (err) {
      setForgotError('Terjadi kesalahan koneksi.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setForgotError('Password baru dan konfirmasi tidak cocok.');
      return;
    }

    setIsForgotLoading(true);
    setForgotError('');
    try {
      const res = await forgotPasswordVerifyReset(forgotEmail, forgotOtp, newPassword);
      if (res.success) {
        setShowForgotPassword(false);
        setSuccess('Password berhasil direset. Silakan login menggunakan password baru.');
      } else {
        setForgotError(res.message || 'Gagal mereset password.');
      }
    } catch (err) {
      setForgotError('Terjadi kesalahan koneksi.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  useEffect(() => {
    if (getToken()) router.replace('/dashboard');
  }, [router]);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const clearMessages = () => { setError(''); setSuccess(''); };

  // ── Vanta.js TOPOLOGY background
  const vantaRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vantaEffect = useRef<any>(null);

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


  const handleTabChange = (key: TabRole) => {
    if (key === activeTab) return;
    const oldIdx = tabs.findIndex(t => t.key === activeTab);
    const newIdx = tabs.findIndex(t => t.key === key);
    slideDirectionRef.current = newIdx > oldIdx ? 1 : -1;
    setActiveTab(key);
    clearMessages();
  };

  const handleMahasiswaLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!mahasiswaNim.trim() || !mahasiswaPassword.trim()) { setError('NIM dan password wajib diisi'); return; }
    setIsLoading(true);
    try {
      const res = await loginMahasiswa(mahasiswaNim.trim(), mahasiswaPassword);
      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        setSuccess('Login berhasil. Mengalihkan...');
        setTimeout(() => router.push('/dashboard'), 700);
      } else {
        setError(res.message || 'NIM atau password salah.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server. Pastikan backend berjalan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDosenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!dosenNip.trim() || !dosenPassword.trim()) { setError('NIP dan password wajib diisi'); return; }
    setIsLoading(true);
    try {
      const res = await loginDosen(dosenNip.trim(), dosenPassword);
      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        setSuccess('Login berhasil. Mengalihkan...');
        setTimeout(() => router.push('/dosen/dashboard'), 700);
      } else {
        setError(res.message || 'NIP atau password salah.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server. Pastikan backend berjalan.');
    } finally {
      setIsLoading(false);
    }
  };

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
    { key: 'dosen', label: 'Pembimbing Akademik' },
    { key: 'mentor', label: 'Mentor' },
  ];
  const tabIndex = tabs.findIndex(t => t.key === activeTab);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-white">
      {/* Vanta.js FOG animated background */}
      <div ref={vantaRef} className="absolute inset-0 z-0" />

      {/* Outer card — split layout */}
      <div className="relative z-10 w-full max-w-5xl flex rounded-2xl sm:rounded-3xl overflow-hidden" style={{ minHeight: '580px', boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.35)' }}>

        {/* ── LEFT PANEL — Illustration ── */}
        <div className="hidden lg:flex lg:w-5/12 flex-shrink-0">
          <LeftIllustration />
        </div>

        {/* ── RIGHT PANEL — Form ── */}
        <div className="flex-1 bg-white flex flex-col justify-start px-5 sm:px-10 pt-8 sm:pt-12 pb-6 sm:pb-8 min-w-0">

          {/* Logo + title */}
          <div className="mb-5 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-5 mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[16px] sm:rounded-[20px] bg-gradient-to-tr from-[#CC0000] to-[#E60000] flex items-center justify-center flex-shrink-0 relative overflow-hidden group shadow-[0_8px_24px_-6px_rgba(204,0,0,0.5)] border border-[#ff3333]/30">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-[20px]"></div>
                <div className="relative z-10 drop-shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="26" height="26" className="sm:w-8 sm:h-8">
                    <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3ZM5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h2 className="font-black text-gray-900 text-[16px] sm:text-[22px] leading-tight tracking-tight uppercase break-words" style={{ letterSpacing: '0.01em' }}>Sistem Manajemen KPPM</h2>
                <p className="text-[#CC0000] text-[11px] sm:text-[14px] font-extrabold tracking-widest mt-0.5 uppercase" style={{ letterSpacing: '0.08em' }}>Telkom University</p>
              </div>
            </div>

            <h1 className="text-[24px] sm:text-[32px] font-extrabold text-gray-900 tracking-tight leading-tight">Selamat Datang</h1>
            <p className="text-gray-500 text-[13px] sm:text-[15px] mt-2 font-medium leading-relaxed">
              Silakan pilih peran dan masuk menggunakan kredensial Anda untuk mengakses sistem.
            </p>
          </div>

          {/* Tab switcher — sliding indicator */}
          <div className="relative flex bg-gray-100 rounded-[14px] p-1.5 mb-6">
            {/* Sliding white pill */}
            <div
              className="absolute rounded-[10px] bg-white shadow transition-all duration-300 ease-in-out"
              style={{
                top: '6px',
                bottom: '6px',
                width: 'calc((100% - 12px) / 3)',
                left: `calc(6px + ${tabIndex} * (100% - 12px) / 3)`,
              }}
            />
            {tabs.map((tab) => (
              <button
                key={tab.key}
                id={`tab-${tab.key}`}
                onClick={() => handleTabChange(tab.key)}
                className={`relative z-10 flex-1 py-2 sm:py-2.5 px-1 text-[12px] sm:text-[14px] font-bold rounded-[10px] transition-colors duration-200 text-center leading-snug ${activeTab === tab.key
                  ? 'text-[#CC0000]'
                  : 'text-gray-500 hover:text-gray-800'
                  }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.key === 'mahasiswa' ? 'Mahasiswa' : tab.key === 'dosen' ? 'PA' : 'Mentor'}</span>
              </button>
            ))}
          </div>

          {/* ── Animated form container ── */}
          <style>{`
            @keyframes kppmFadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to   { opacity: 1; transform: translateY(0);    }
            }
          `}</style>
          <div
            key={activeTab}
            style={{ animation: 'kppmFadeIn 0.22s cubic-bezier(0.25,0.46,0.45,0.94) both', minHeight: '280px' }}
          >

            {/* ── Tab: Mahasiswa ── */}
            {activeTab === 'mahasiswa' && (
              <form id="form-mahasiswa" onSubmit={handleMahasiswaLogin} className="flex flex-col h-full">
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">NIM</label>
                    <input
                      id="input-mahasiswa-nim"
                      type="text"
                      value={mahasiswaNim}
                      onChange={(e) => setMahasiswaNim(e.target.value.replace(/\D/g, ''))}
                      placeholder="Contoh: 1301213001"
                      maxLength={20}
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
                        placeholder="Masukkan password Anda"
                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] transition-all bg-gray-50 focus:bg-white"
                      />
                      <button type="button" onClick={() => setShowMahasiswaPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showMahasiswaPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                {(error || success) && (
                  <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
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

                <button id="btn-login-mahasiswa" type="submit" disabled={isLoading}
                  className="w-full bg-[#CC0000] hover:bg-[#A30000] disabled:bg-[#CC0000]/50 text-white font-bold py-3.5 rounded-xl transition-all text-sm tracking-wide shadow-sm hover:shadow-md">
                  {isLoading ? 'Memproses...' : 'Masuk'}
                </button>

                <div className="text-center mt-3">
                  <button type="button" onClick={openForgotPassword} className="text-[#CC0000] text-sm hover:underline font-semibold">Lupa Password?</button>
                </div>
              </form>
            )}

            {/* ── Tab: Dosen ── */}
            {activeTab === 'dosen' && (
              <form id="form-dosen" onSubmit={handleDosenLogin} className="flex flex-col h-full">
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">NIP</label>
                    <input
                      id="input-dosen-nip"
                      type="text"
                      value={dosenNip}
                      onChange={(e) => setDosenNip(e.target.value.replace(/\D/g, ''))}
                      placeholder="Masukkan NIP Anda"
                      maxLength={30}
                      autoComplete="username"
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
                      <button type="button" onClick={() => setShowDosenPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showDosenPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                {(error || success) && (
                  <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
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

                <button id="btn-login-dosen" type="submit" disabled={isLoading}
                  className="w-full bg-[#CC0000] hover:bg-[#A30000] disabled:bg-[#CC0000]/50 text-white font-bold py-3.5 rounded-xl transition-all text-sm tracking-wide shadow-sm hover:shadow-md">
                  {isLoading ? 'Memproses...' : 'Masuk sebagai Pembimbing Akademik'}
                </button>

                <div className="text-center mt-3">
                  <button type="button" onClick={openForgotPassword} className="text-[#CC0000] text-sm hover:underline font-semibold">Lupa Password?</button>
                </div>
              </form>
            )}

            {/* ── Tab: Mentor ── */}
            {activeTab === 'mentor' && (
              <form id="form-mentor" onSubmit={handleMentorLogin} className="flex flex-col h-full">
                <div className="space-y-4 mb-4">
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
                      <button id="btn-send-otp" type="button" onClick={handleSendOtp}
                        disabled={isLoading || otpCountdown > 0}
                        className="px-4 py-3 bg-[#CC0000] hover:bg-[#A30000] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all whitespace-nowrap">
                        {isLoading ? '...' : otpCountdown > 0 ? `${otpCountdown}s` : 'Kirim OTP'}
                      </button>
                    </div>
                  </div>
                  {otpSent && (
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
                  )}
                  {!otpSent && (
                    <p className="text-center text-xs text-gray-400 mt-2">
                      Klik &quot;Kirim OTP&quot; untuk menerima kode verifikasi via email
                    </p>
                  )}
                </div>

                {/* Messages */}
                {(error || success) && (
                  <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
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

                {otpSent && (
                  <button id="btn-verify-otp" type="submit"
                    disabled={isLoading || mentorOtp.length !== 6}
                    className="w-full bg-[#CC0000] hover:bg-[#A30000] disabled:bg-[#CC0000]/50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all text-sm tracking-wide">
                    {isLoading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
                  </button>
                )}
              </form>
            )}

          </div>{/* end animated form wrapper */}

          {/* Footer */}
          <p className="text-center text-xs text-gray-300 mt-auto pt-6">
            &copy; {new Date().getFullYear()} Telkom University &mdash; Sistem Manajemen KPPM
          </p>
        </div>
      </div>

      {/* ── Forgot Password Modal ── */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-[500px] bg-white rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Red Header Background */}
            <div className="bg-[#CC0000] pt-6 pb-8 px-8 text-center text-white relative">
              <div className="w-12 h-12 bg-white/20 border border-white/30 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm backdrop-blur-md">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-1">{forgotStep === 1 ? 'Verifikasi Email' : 'Ganti Password'}</h2>
              <p className="text-red-100 text-sm font-medium">Langkah {forgotStep} dari 2</p>
            </div>

            {/* Content Area */}
            <div className="px-8 pt-0 pb-8 bg-white relative">
              {/* Stepper */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-5 sm:px-6 py-3 rounded-full shadow-md border border-gray-100 flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">
                <div className={`flex items-center gap-1.5 sm:gap-2 ${forgotStep === 1 ? 'text-[#CC0000]' : 'text-gray-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0 ${forgotStep === 1 ? 'bg-[#CC0000]' : 'bg-gray-300'}`}>1</span>
                  <span>Verifikasi Email</span>
                </div>
                <div className="w-4 sm:w-8 h-px bg-gray-200"></div>
                <div className={`flex items-center gap-1.5 sm:gap-2 ${forgotStep === 2 ? 'text-[#CC0000]' : 'text-gray-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0 ${forgotStep === 2 ? 'bg-[#CC0000]' : 'bg-gray-300'}`}>2</span>
                  <span>Ganti Password</span>
                </div>
              </div>

              <div className="pt-10 sm:pt-12">
                {forgotStep === 1 ? (
                  <form onSubmit={handleSendForgotOtp}>
                    <p className="text-sm text-gray-600 text-center leading-relaxed mb-6">
                      Untuk keamanan akun, harap verifikasi email Telkom University Anda. Kode OTP akan dikirim ke email yang Anda masukkan.
                    </p>
                    <div className="mb-6">
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Email Telkom University</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="nama@telkomuniversity.ac.id"
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] bg-gray-50 focus:bg-white transition-all"
                          required
                        />
                        <button
                          type="submit"
                          disabled={isForgotLoading || !forgotEmail}
                          className="px-5 py-3 bg-[#CC0000] hover:bg-[#A30000] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all whitespace-nowrap"
                        >
                          {isForgotLoading ? 'Memproses...' : 'Kirim OTP'}
                        </button>
                      </div>
                      <p className="text-center text-xs text-gray-400 mt-3">Klik &quot;Kirim OTP&quot; untuk menerima kode verifikasi via email</p>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4 mb-6">
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Kode OTP (6 Digit)</label>
                      <input
                        type="text"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] text-center text-xl font-mono tracking-[0.5em] bg-gray-50 focus:bg-white transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Password Baru</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Masukkan password baru"
                          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] bg-gray-50 focus:bg-white transition-all"
                          required
                        />
                        <button type="button" onClick={() => setShowNewPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Konfirmasi Password Baru</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ketik ulang password baru"
                          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] bg-gray-50 focus:bg-white transition-all"
                          required
                        />
                        <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isForgotLoading || !forgotOtp || !newPassword || !confirmPassword || (newPassword !== confirmPassword)}
                      className="w-full mt-2 bg-[#CC0000] hover:bg-[#A30000] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all text-sm tracking-wide"
                    >
                      {isForgotLoading ? 'Memproses...' : 'Simpan Password Baru'}
                    </button>
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-red-500 text-xs text-center">Password tidak cocok</p>
                    )}
                  </form>
                )}

                {/* Error message untuk forgot password */}
                {forgotError && (
                  <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700 text-sm text-center leading-snug">{forgotError}</p>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-5">
                  <p className="text-center text-[11px] text-gray-400 mb-4 max-w-[320px] mx-auto">
                    Anda harus menyelesaikan kedua langkah ini untuk dapat mengakses semua fitur KPPM.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-[#CC0000] text-[#CC0000] hover:bg-red-50 rounded-xl text-sm font-bold transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"></line>
                      <polyline points="12,19 5,12 12,5"></polyline>
                    </svg>
                    Kembali ke halaman Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
