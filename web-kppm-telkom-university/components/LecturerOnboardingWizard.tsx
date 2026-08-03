'use client';

import { useState, useEffect } from 'react';
import {
  getUser,
  setUser,
  setToken,
  logout,
  sendLecturerVerifyOtp,
  verifyLecturerEmail,
  changeLecturerPassword,
  LecturerUser,
} from '@/lib/api';
import { useRouter } from 'next/navigation';

// ─── Step Indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ current }: { current: 1 | 2 }) => (
  <div className="flex items-center justify-center gap-3 mb-8">
    {[1, 2].map((step) => {
      const isDone   = step < current;
      const isActive = step === current;
      return (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-[#CC0000] text-white shadow-lg shadow-red-200' : 'bg-gray-200 text-gray-400'}`}
          >
            {isDone ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            ) : step}
          </div>
          <span className={`text-xs font-semibold ${isActive ? 'text-gray-800' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
            {step === 1 ? 'Verifikasi Email' : 'Ganti Password'}
          </span>
          {step < 2 && <div className={`w-8 h-0.5 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />}
        </div>
      );
    })}
  </div>
);

// ─── Alert ────────────────────────────────────────────────────────────────────
const Alert = ({ type, msg }: { type: 'error' | 'success'; msg: string }) => (
  <div className={`mb-4 px-4 py-3 rounded-xl text-sm flex items-start gap-2
    ${type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
    <span className="flex-shrink-0 mt-0.5">
      {type === 'error' ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
      )}
    </span>
    <span>{msg}</span>
  </div>
);

// ─── Eye Icons ────────────────────────────────────────────────────────────────
const EyeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LecturerOnboardingWizard() {
  const router = useRouter();
  const [step, setStep]       = useState<1 | 2>(1);
  const [visible, setVisible] = useState(false);

  // Step 1
  const [email, setEmail]           = useState('');
  const [otp, setOtp]               = useState('');
  const [otpSent, setOtpSent]       = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Step 2
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Global
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  // Tampilkan wizard jika dosen belum verifikasi/ganti password
  useEffect(() => {
    const user = getUser();
    if (user && user.role === 'lecturer') {
      const l = user as LecturerUser;
      if (!l.is_verified || !l.password_changed) {
        setVisible(true);
        if (!l.is_verified) setStep(1);
        else setStep(2);
      }
    }
  }, []);

  // Countdown OTP
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  if (!visible) return null;

  const clearMsg = () => { setError(''); setSuccess(''); };

  // ── Handler: Kirim OTP ───────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    clearMsg();
    if (!email.trim()) { setError('Email wajib diisi'); return; }
    setIsLoading(true);
    try {
      const res = await sendLecturerVerifyOtp(email.trim());
      if (res.success) {
        setOtpSent(true);
        setOtpCountdown(60);
        setSuccess(`Kode OTP telah dikirim ke ${email}. Silakan cek inbox email Anda.`);
      } else {
        setError(res.message || 'Gagal mengirim OTP.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handler: Verifikasi OTP ──────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMsg();
    if (!otp || otp.length !== 6) { setError('Masukkan OTP 6 digit yang valid'); return; }
    setIsLoading(true);
    try {
      const res = await verifyLecturerEmail(email.trim(), otp.trim());
      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        setSuccess('Email berhasil diverifikasi! Sekarang buat password baru Anda.');
        setTimeout(() => { setStep(2); setSuccess(''); setError(''); }, 1500);
      } else {
        setError(res.message || 'OTP tidak valid atau sudah kadaluarsa.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handler: Ganti Password ──────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMsg();
    if (!currentPw || !newPw || !confirmPw) { setError('Semua field password wajib diisi'); return; }
    if (newPw.length < 8) { setError('Password baru minimal 8 karakter'); return; }
    if (newPw !== confirmPw) { setError('Konfirmasi password tidak cocok'); return; }
    if (currentPw === newPw) { setError('Password baru tidak boleh sama dengan password lama'); return; }
    setIsLoading(true);
    try {
      const res = await changeLecturerPassword(currentPw, newPw);
      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        setSuccess('Password berhasil diubah! Selamat datang di KPPM.');
        setTimeout(() => setVisible(false), 1800);
      } else {
        setError(res.message || 'Gagal mengubah password.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#CC0000] to-[#990000] px-8 pt-8 pb-6 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {step === 1 ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            )}
          </div>
          <h2 className="text-white font-bold text-lg">
            {step === 1 ? 'Verifikasi Email Dosen' : 'Buat Password Baru'}
          </h2>
          <p className="text-red-200 text-xs mt-1">
            {step === 1 ? 'Langkah 1 dari 2' : 'Langkah 2 dari 2'}
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <StepIndicator current={step} />

          {error   && <Alert type="error"   msg={error}   />}
          {success && <Alert type="success" msg={success} />}

          {/* ── Step 1: Verifikasi Email ── */}
          {step === 1 && (
            <div>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                Untuk keamanan akun, harap verifikasi email Anda.
                Masukkan email aktif yang ingin dikaitkan dengan akun dosen ini.
                Kode OTP akan dikirim ke email tersebut.
              </p>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Alamat Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="lecturer-onboarding-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setOtpSent(false); setOtp(''); }}
                      placeholder="nama@telkomuniversity.ac.id"
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] transition-all bg-gray-50 focus:bg-white disabled:opacity-60"
                    />
                    <button
                      id="lecturer-onboarding-send-otp-btn"
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Kode OTP (6 Digit)
                    </label>
                    <input
                      id="lecturer-onboarding-otp-input"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] transition-all text-center text-2xl font-mono tracking-[0.5em] bg-gray-50 focus:bg-white"
                    />
                    <p className="text-xs text-gray-400 mt-1.5 text-center">OTP berlaku 5 menit</p>
                  </div>
                )}

                {otpSent && (
                  <button
                    id="lecturer-onboarding-verify-btn"
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full bg-[#CC0000] hover:bg-[#A30000] disabled:bg-[#CC0000]/50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-200 text-sm tracking-wide"
                  >
                    {isLoading ? 'Memverifikasi...' : 'Verifikasi Email'}
                  </button>
                )}

                {!otpSent && (
                  <p className="text-center text-xs text-gray-400">
                    Klik &quot;Kirim OTP&quot; untuk menerima kode verifikasi via email
                  </p>
                )}
              </form>
            </div>
          )}

          {/* ── Step 2: Ganti Password ── */}
          {step === 2 && (
            <div>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                Untuk keamanan akun, harap ganti password default Anda (NIP).
                Password baru minimal 8 karakter.
              </p>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Password Lama (NIP Anda)
                  </label>
                  <div className="relative">
                    <input
                      id="lecturer-onboarding-current-pw"
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      placeholder="Masukkan NIP Anda"
                      className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] transition-all bg-gray-50 focus:bg-white"
                    />
                    <button type="button" onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password Baru</label>
                  <div className="relative">
                    <input
                      id="lecturer-onboarding-new-pw"
                      type={showNew ? 'text' : 'password'}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000] transition-all bg-gray-50 focus:bg-white"
                    />
                    <button type="button" onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNew ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {newPw.length > 0 && (
                    <div className="mt-1.5 flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                          newPw.length >= (i + 1) * 2
                            ? newPw.length >= 8 ? 'bg-green-400' : 'bg-yellow-400'
                            : 'bg-gray-200'
                        }`} />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Konfirmasi Password Baru</label>
                  <div className="relative">
                    <input
                      id="lecturer-onboarding-confirm-pw"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="Ulangi password baru"
                      className={`w-full px-4 py-3 pr-12 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all bg-gray-50 focus:bg-white ${
                        confirmPw && confirmPw !== newPw
                          ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                          : 'border-gray-200 focus:ring-[#CC0000]/30 focus:border-[#CC0000]'
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {confirmPw && confirmPw !== newPw && (
                    <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>
                  )}
                </div>

                <button
                  id="lecturer-onboarding-save-pw-btn"
                  type="submit"
                  disabled={isLoading || !currentPw || newPw.length < 8 || newPw !== confirmPw}
                  className="w-full bg-[#CC0000] hover:bg-[#A30000] disabled:bg-[#CC0000]/50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-200 text-sm tracking-wide mt-2"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <p className="text-xs text-gray-400 mb-4">
            Anda harus menyelesaikan kedua langkah ini untuk dapat mengakses semua fitur KPPM.
          </p>
          <button
            id="lecturer-onboarding-back-to-login-btn"
            type="button"
            onClick={async () => { await logout(); router.replace('/login'); }}
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border-2 border-[#CC0000] text-[#CC0000] font-semibold text-sm hover:bg-[#CC0000] hover:text-white transition-all duration-200"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            Kembali ke halaman Login
          </button>
        </div>
      </div>
    </div>
  );
}
