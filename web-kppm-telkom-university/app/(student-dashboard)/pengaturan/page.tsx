'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getStudentProfile,
  changeStudentPassword,
  updateStudentProfile,
  getToken,
  getUser,
  sendStudentVerifyOtp,
  verifyStudentEmail,
  type StudentUser,
} from '@/lib/api';

// ─── Icons ────────────────────────────────────────────────────────────────────

const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const AlertIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProdiFromClass(classCode: string): string {
  const code = classCode?.toUpperCase() || '';
  if (code.startsWith('IF'))  return 'S1 Informatika';
  if (code.startsWith('SI'))  return 'S1 Sistem Informasi';
  if (code.startsWith('IK'))  return 'S1 Ilmu Komputasi';
  if (code.startsWith('TI'))  return 'D3 Teknologi Informasi';
  if (code.startsWith('RPL')) return 'D3 Rekayasa Perangkat Lunak';
  return 'Program Studi Lainnya';
}

function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: 'Lemah',  color: 'bg-red-400' };
  if (score <= 2) return { level: 2, label: 'Cukup',  color: 'bg-yellow-400' };
  if (score <= 3) return { level: 3, label: 'Baik',   color: 'bg-blue-400' };
  return              { level: 4, label: 'Kuat',   color: 'bg-green-500' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ProfileRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start py-2.5 border-b border-gray-50 dark:border-slate-800 last:border-0 transition-colors gap-2">
    <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider w-28 sm:w-36 flex-shrink-0 pt-0.5 leading-tight">{label}</span>
    <span className="text-sm text-gray-800 dark:text-slate-200 font-medium min-w-0 flex-1 break-all">{value || '-'}</span>
  </div>
);

const PasswordInput = ({
  id, label, value, show, onChange, onToggle, placeholder, extra,
}: {
  id: string; label: string; value: string; show: boolean;
  onChange: (v: string) => void; onToggle: () => void;
  placeholder: string; extra?: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">{label}</label>
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/25 focus:border-[#CC0000] transition-all bg-gray-50 dark:bg-slate-900/50 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800"
      />
      <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
    {extra}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PengaturanPage() {
  const router = useRouter();

  const [profile, setProfile]             = useState<StudentUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError]   = useState('');

  const [currentPw, setCurrentPw]         = useState('');
  const [newPw, setNewPw]                 = useState('');
  const [confirmPw, setConfirmPw]         = useState('');
  const [showCur, setShowCur]             = useState(false);
  const [showNew, setShowNew]             = useState(false);
  const [showCon, setShowCon]             = useState(false);
  const [pwLoading, setPwLoading]         = useState(false);
  const [pwError, setPwError]             = useState('');
  const [pwSuccess, setPwSuccess]         = useState('');
  const [emailToast, setEmailToast]       = useState('');  // floating toast untuk sukses ganti email

  const [activeTab, setActiveTab]         = useState<'profil' | 'keamanan'>('profil');
  const strength = getPasswordStrength(newPw);

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editEmailForm, setEditEmailForm] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  // ── OTP email flow ──
  const [otpSent, setOtpSent]           = useState(false);   // apakah OTP sudah dikirim
  const [showOtpModal, setShowOtpModal] = useState(false);   // tampilkan popup OTP
  const [otpValues, setOtpValues]       = useState(['','','','','','']); // 6 kotak OTP
  const [otpError, setOtpError]         = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handleEditEmail = () => {
    setEditEmailForm(profile?.email || '');
    setIsEditingEmail(true);
    setOtpSent(false);
    setOtpValues(['','','','','','']);
    setOtpError('');
  };

  const handleCancelEmail = () => {
    setIsEditingEmail(false);
    setOtpSent(false);
    setShowOtpModal(false);
    setOtpValues(['','','','','','']);
    setOtpError('');
  };

  // Kirim OTP ke email baru
  const handleSendOtp = async () => {
    if (!editEmailForm) return;
    setEmailSaving(true);
    setOtpError('');
    try {
      const res = await sendStudentVerifyOtp(editEmailForm);
      if (res.success) {
        setOtpSent(true);
        setShowOtpModal(true);
        setOtpValues(['','','','','','']);
        // cooldown 60 detik
        setResendCooldown(60);
        const t = setInterval(() => setResendCooldown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
        setTimeout(() => otpRefs[0].current?.focus(), 100);
      } else {
        setProfileError(res.message || 'Gagal mengirim OTP.');
        setTimeout(() => setProfileError(''), 4000);
      }
    } catch {
      setProfileError('Terjadi kesalahan server.');
      setTimeout(() => setProfileError(''), 4000);
    }
    setEmailSaving(false);
  };

  // Verifikasi OTP & simpan email
  const handleVerifyOtp = async () => {
    const otp = otpValues.join('');
    if (otp.length < 6) { setOtpError('Masukkan 6 digit OTP.'); return; }
    setOtpVerifying(true);
    setOtpError('');
    try {
      const res = await verifyStudentEmail(editEmailForm, otp);
      if (res.success) {
        // Update token & user di localStorage
        if (res.data?.token) {
          localStorage.setItem('kppm_token', res.data.token);
        }
        if (res.data?.user) {
          localStorage.setItem('kppm_user', JSON.stringify(res.data.user));
        }
        setProfile(prev => prev ? { ...prev, email: editEmailForm } : null);
        setShowOtpModal(false);
        setIsEditingEmail(false);
        setOtpValues(['','','','','','']);
        setEmailToast('Email berhasil diperbarui dan diverifikasi! ✓');
        setTimeout(() => setEmailToast(''), 4000);
      } else {
        setOtpError(res.message || 'OTP salah. Coba lagi.');
      }
    } catch {
      setOtpError('Terjadi kesalahan server.');
    }
    setOtpVerifying(false);
  };

  // Handle input per kotak OTP
  const handleOtpInput = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpValues];
    next[idx] = val;
    setOtpValues(next);
    setOtpError('');
    if (val && idx < 5) otpRefs[idx + 1].current?.focus();
  };
  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[idx] && idx > 0) otpRefs[idx - 1].current?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = ['','','','','',''];
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setOtpValues(next);
    otpRefs[Math.min(pasted.length, 5)].current?.focus();
  };

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }

    (async () => {
      // Tampilkan data cache localStorage dulu
      const cached = getUser();
      if (cached && 'nim' in cached) setProfile(cached as StudentUser);

      try {
        const res = await getStudentProfile();
        if (res.success && res.data) setProfile(res.data as StudentUser);
        else setProfileError(res.message || 'Gagal memuat profil.');
      } catch {
        setProfileError('Tidak dapat terhubung ke server.');
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (newPw !== confirmPw) { setPwError('Konfirmasi password tidak cocok.'); return; }
    if (newPw.length < 8)    { setPwError('Password baru minimal 8 karakter.'); return; }

    setPwLoading(true);
    try {
      const res = await changeStudentPassword(currentPw, newPw);
      if (res.success) {
        setPwSuccess('Password berhasil diubah!');
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
      } else {
        setPwError(res.message || 'Gagal mengubah password.');
      }
    } catch {
      setPwError('Tidak dapat terhubung ke server.');
    } finally {
      setPwLoading(false);
    }
  };

  // Initials avatar
  const initials = profile?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="p-4 md:p-5 max-w-5xl mx-auto">

      {/* ── Floating Email Toast ── */}
      <div
        className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border border-green-200 dark:border-green-500/30 bg-white dark:bg-slate-900 text-green-700 dark:text-green-400 text-sm font-semibold transition-all duration-500 ${
          emailToast
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-500/15 flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <span>{emailToast}</span>
        <button
          onClick={() => setEmailToast('')}
          className="ml-1 text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors"
          aria-label="Tutup"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* ── Page title ── */}
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">Pengaturan</h1>
        <p className="text-gray-400 dark:text-slate-500 text-sm mt-0.5">Kelola profil dan keamanan akun Anda</p>
      </div>

      {/* ── 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">

        {/* ── LEFT: Profile Card + Nav ── */}
        <div className="space-y-4">

          {/* Avatar card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 text-center transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-[#CC0000] dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 shadow">
              <span className="text-white dark:text-red-400 text-xl font-bold">{initials}</span>
            </div>
            {profileLoading && !profile ? (
              <>
                <div className="h-4 w-28 bg-gray-100 dark:bg-slate-800 rounded animate-pulse mx-auto mb-1.5" />
                <div className="h-3 w-20 bg-gray-100 dark:bg-slate-800 rounded animate-pulse mx-auto" />
              </>
            ) : (
              <>
                <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">{profile?.name}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{profile?.nim}</p>
              </>
            )}
            <span className="inline-flex items-center mt-2.5 px-2.5 py-0.5 bg-red-50 dark:bg-red-500/10 text-[#CC0000] dark:text-red-400 text-xs font-semibold rounded-full">
              Mahasiswa
            </span>
          </div>



          {/* Tab nav */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            {([
              { key: 'profil',   label: 'Informasi Profil' },
              { key: 'keamanan', label: 'Ganti Password'   },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                id={`tab-${key}`}
                onClick={() => setActiveTab(key)}
                className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors border-l-2 ${
                  activeTab === key
                    ? 'border-[#CC0000] dark:border-red-500 text-[#CC0000] dark:text-red-400 bg-red-50/60 dark:bg-slate-800/50'
                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Content panel ── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors overflow-hidden min-w-0">

          {/* ── Tab: Profil ── */}
          {activeTab === 'profil' && (
            <div className="p-5">
              <h2 className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-4">Data Akademik</h2>

              {profileError && (
                <div className="mb-4 px-3 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertIcon /> {profileError}
                </div>
              )}

              {profileLoading && !profile ? (
                <div className="space-y-3">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-3 w-24 bg-gray-100 dark:bg-slate-800 rounded animate-pulse flex-shrink-0" />
                      <div className="h-3 flex-1 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <ProfileRow label="Nama Lengkap"  value={profile?.name || '-'} />
                  <ProfileRow label="NIM"            value={profile?.nim || '-'} />
                  <div className="flex items-start py-2.5 border-b border-gray-50 dark:border-slate-800 last:border-0 transition-colors gap-2">
                    <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider w-28 sm:w-36 flex-shrink-0 pt-0.5 leading-tight">Email</span>
                    {isEditingEmail ? (
                      <div className="flex-1 flex gap-2 items-center">
                        <input
                          type="email"
                          value={editEmailForm}
                          onChange={e => { setEditEmailForm(e.target.value); setOtpSent(false); }}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded focus:outline-none focus:border-[#CC0000]"
                          placeholder="Email aktif"
                        />
                        <button
                          onClick={handleSendOtp}
                          disabled={emailSaving || !editEmailForm || editEmailForm === profile?.email}
                          className="text-xs font-semibold bg-[#CC0000] text-white px-3 py-1.5 rounded hover:bg-[#a00000] disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1.5"
                        >
                          {emailSaving ? (
                            <><svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" /></svg>Mengirim...</>
                          ) : otpSent ? 'Kirim Ulang OTP' : 'Verifikasi'}
                        </button>
                        <button
                          onClick={handleCancelEmail}
                          disabled={emailSaving}
                          className="text-xs font-semibold bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-3 py-1.5 rounded hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors whitespace-nowrap flex-shrink-0"
                        >Batal</button>
                      </div>
                    ) : (
                      <div className="flex-1 flex justify-between items-start group gap-3">
                        <span className="text-sm text-gray-800 dark:text-slate-200 font-medium break-all mt-0.5">{profile?.email || '-'}</span>
                        <button onClick={handleEditEmail} className="text-[#CC0000] transition-colors hover:bg-red-100 text-xs font-semibold px-3 py-1 bg-red-50 dark:bg-red-500/10 rounded whitespace-nowrap flex-shrink-0">
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                  <ProfileRow label="Kelas"          value={profile?.class || '-'} />
                  <ProfileRow label="Program Studi"  value={profile ? getProdiFromClass(profile.class) : '-'} />
                </>
              )}

              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-4 pt-3 border-t border-gray-50 dark:border-slate-800">
                * Data dikelola oleh administrasi. Hubungi KPPM jika ada kesalahan.
              </p>
            </div>
          )}

          {/* ── Tab: Ganti Password ── */}
          {activeTab === 'keamanan' && (
            <div className="p-5">
              <h2 className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-4">Ganti Password</h2>

              {pwSuccess && (
                <div className="mb-4 px-3 py-2.5 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg text-green-700 dark:text-green-400 text-xs flex items-center gap-2">
                  <CheckCircleIcon /> {pwSuccess}
                </div>
              )}
              {pwError && (
                <div className="mb-4 px-3 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertIcon /> {pwError}
                </div>
              )}

              <form id="form-ganti-password" onSubmit={handleChangePassword} className="space-y-4">
                <PasswordInput
                  id="input-current-password"
                  label="Password Saat Ini"
                  value={currentPw}
                  show={showCur}
                  onChange={setCurrentPw}
                  onToggle={() => setShowCur(v => !v)}
                  placeholder="Masukkan password saat ini"
                />

                <PasswordInput
                  id="input-new-password"
                  label="Password Baru"
                  value={newPw}
                  show={showNew}
                  onChange={setNewPw}
                  onToggle={() => setShowNew(v => !v)}
                  placeholder="Minimal 8 karakter"
                  extra={newPw && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.level ? strength.color : 'bg-gray-200 dark:bg-slate-700'}`} />
                        ))}
                      </div>
                      <p className={`text-[11px] font-medium ${
                        strength.level <= 1 ? 'text-red-500' :
                        strength.level === 2 ? 'text-yellow-600' :
                        strength.level === 3 ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        Kekuatan: {strength.label}
                      </p>
                    </div>
                  )}
                />

                <PasswordInput
                  id="input-confirm-password"
                  label="Konfirmasi Password Baru"
                  value={confirmPw}
                  show={showCon}
                  onChange={setConfirmPw}
                  onToggle={() => setShowCon(v => !v)}
                  placeholder="Ulangi password baru"
                  extra={confirmPw && (
                    <p className={`text-[11px] mt-1 flex items-center gap-1 ${confirmPw === newPw ? 'text-green-600' : 'text-red-500'}`}>
                      {confirmPw === newPw ? <><CheckCircleIcon /> Password cocok</> : <><AlertIcon /> Password tidak cocok</>}
                    </p>
                  )}
                />

                <button
                  id="btn-simpan-password"
                  type="submit"
                  disabled={pwLoading || (!!confirmPw && confirmPw !== newPw)}
                  className="w-full mt-1 bg-[#CC0000] hover:bg-[#A30000] dark:bg-red-600 dark:hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all text-sm"
                >
                  {pwLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                </button>
              </form>

              <div className="mt-5 p-3.5 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-transparent dark:border-slate-800">
                <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1.5">Tips Password Aman</p>
                <ul className="text-[11px] text-gray-400 dark:text-slate-500 space-y-0.5 list-disc list-inside">
                  <li>Minimal 8 karakter</li>
                  <li>Kombinasikan huruf besar, kecil, angka &amp; simbol</li>
                  <li>Hindari informasi pribadi (nama, NIM, tanggal lahir)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── OTP Modal ── */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !otpVerifying && setShowOtpModal(false)} />

          {/* Card */}
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-sm p-6 flex flex-col items-center gap-4 animate-[fadeInUp_0.25s_ease]">
            {/* Header */}
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-1">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3h-8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/><path d="M12 14v.01"/>
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Verifikasi Email</h3>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                Kode OTP telah dikirim ke<br />
                <span className="font-semibold text-gray-700 dark:text-slate-300">{editEmailForm}</span>
              </p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Berlaku selama 5 menit</p>
            </div>

            {/* OTP inputs */}
            <div className="flex gap-2.5 justify-center" onPaste={handleOtpPaste}>
              {otpValues.map((v, i) => (
                <input
                  key={i}
                  ref={otpRefs[i]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={v}
                  onChange={e => handleOtpInput(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className={`w-10 h-12 text-center text-lg font-bold rounded-xl border-2 transition-all outline-none
                    ${v ? 'border-[#CC0000] bg-red-50 dark:bg-red-500/10 text-[#CC0000]' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100'}
                    ${otpError ? 'border-red-400 animate-[shake_0.3s_ease]' : ''}
                    focus:border-[#CC0000] focus:ring-2 focus:ring-[#CC0000]/20`}
                />
              ))}
            </div>

            {/* Error */}
            {otpError && (
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-medium">
                <AlertIcon /> {otpError}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleVerifyOtp}
              disabled={otpVerifying || otpValues.join('').length < 6}
              className="w-full bg-[#CC0000] hover:bg-[#a00000] disabled:bg-gray-200 dark:disabled:bg-slate-800 disabled:text-gray-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              {otpVerifying ? (
                <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" /></svg>Memverifikasi...</>
              ) : 'Konfirmasi & Simpan Email'}
            </button>

            {/* Resend */}
            <p className="text-[11px] text-gray-400 dark:text-slate-500">
              Tidak menerima OTP?{' '}
              {resendCooldown > 0 ? (
                <span className="text-gray-400">Kirim ulang dalam {resendCooldown}d</span>
              ) : (
                <button
                  onClick={handleSendOtp}
                  disabled={emailSaving}
                  className="text-[#CC0000] font-semibold hover:underline disabled:opacity-50"
                >
                  Kirim Ulang
                </button>
              )}
            </p>

            {/* Close */}
            <button
              onClick={() => !otpVerifying && setShowOtpModal(false)}
              className="absolute top-3.5 right-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Tutup"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
