'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getLecturerProfile,
  changeLecturerPassword,
  getToken,
  type LecturerUser,
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
  <div className="flex items-start py-2.5 border-b border-gray-50 dark:border-slate-800 last:border-0 transition-colors">
    <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider w-36 flex-shrink-0 pt-0.5">{label}</span>
    <span className="text-sm text-gray-800 dark:text-slate-200 font-medium">{value || '-'}</span>
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

export default function DosenPengaturanPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<LecturerUser | null>(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCur, setShowCur]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [showCon, setShowCon]     = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError]     = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const [activeTab, setActiveTab] = useState<'profil' | 'keamanan'>('profil');
  const strength = getPasswordStrength(newPw);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    const cached = getLecturerProfile();
    if (!cached) { router.replace('/login'); return; }
    setProfile(cached);
  }, [router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (newPw !== confirmPw) { setPwError('Konfirmasi password tidak cocok.'); return; }
    if (newPw.length < 8)    { setPwError('Password baru minimal 8 karakter.'); return; }

    setPwLoading(true);
    try {
      const res = await changeLecturerPassword(currentPw, newPw);
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
    <div className="p-5 max-w-5xl mx-auto">

      {/* ── Page title ── */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Pengaturan</h1>
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
            {!profile ? (
              <>
                <div className="h-4 w-28 bg-gray-100 dark:bg-slate-800 rounded animate-pulse mx-auto mb-1.5" />
                <div className="h-3 w-32 bg-gray-100 dark:bg-slate-800 rounded animate-pulse mx-auto" />
              </>
            ) : (
              <>
                <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">{profile?.name}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">NIP {profile?.nip}</p>
              </>
            )}
            <span className="inline-flex items-center mt-2.5 px-2.5 py-0.5 bg-red-50 dark:bg-red-500/10 text-[#CC0000] dark:text-red-400 text-xs font-semibold rounded-full">
              Dosen PA
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
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">

          {/* ── Tab: Profil ── */}
          {activeTab === 'profil' && (
            <div className="p-5">
              <h2 className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-4">Data Dosen</h2>

              {!profile ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-3 w-24 bg-gray-100 dark:bg-slate-800 rounded animate-pulse flex-shrink-0" />
                      <div className="h-3 flex-1 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <ProfileRow label="Nama Lengkap" value={profile?.name || '-'} />
                  <ProfileRow label="NIP"           value={profile?.nip || '-'} />
                  <ProfileRow label="Email"         value={profile?.email || '-'} />
                  <ProfileRow label="Peran"         value="Dosen Pembimbing Akademik" />
                  <ProfileRow label="Institusi"     value="Telkom University" />
                  <ProfileRow label="Fakultas"      value="Fakultas Informatika" />
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

              <form id="form-ganti-password-dosen" onSubmit={handleChangePassword} className="space-y-4">
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
                  id="btn-simpan-password-dosen"
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
                  <li>Hindari informasi pribadi (nama, NIP, tanggal lahir)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
