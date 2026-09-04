'use client';

import { useState } from 'react';
import { changeAdminPassword } from '@/lib/api';

// ─── Icons ────────────────────────────────────────────────────────────────────
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

// ─── Password Strength Meter ──────────────────────────────────────────────────
function getStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: 'Sangat Lemah', color: '#ef4444' };
  if (score <= 2) return { level: 2, label: 'Lemah',        color: '#f97316' };
  if (score <= 3) return { level: 3, label: 'Sedang',       color: '#eab308' };
  if (score <= 4) return { level: 4, label: 'Kuat',         color: '#22c55e' };
  return           { level: 5, label: 'Sangat Kuat',    color: '#16a34a' };
}

// ─── Input Field ──────────────────────────────────────────────────────────────
function PasswordField({
  id, label, value, onChange, placeholder, show, onToggle, error,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  placeholder: string; show: boolean; onToggle: () => void; error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
          <LockIcon />
        </div>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100
            focus:outline-none focus:ring-2 focus:ring-[#CC0000]/40 focus:border-[#CC0000] transition-colors
            ${error ? 'border-red-400' : 'border-gray-200 dark:border-slate-700'}`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function UbahPasswordAdminPage() {
  const [oldPw,  setOldPw]  = useState('');
  const [newPw,  setNewPw]  = useState('');
  const [confPw, setConfPw] = useState('');

  const [showOld,  setShowOld]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showConf, setShowConf] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const strength = getStrength(newPw);

  const validate = (): string => {
    if (!oldPw) return 'Password lama wajib diisi.';
    if (!newPw) return 'Password baru wajib diisi.';
    if (newPw.length < 8) return 'Password baru minimal 8 karakter.';
    if (newPw === oldPw)  return 'Password baru tidak boleh sama dengan password lama.';
    if (newPw !== confPw) return 'Konfirmasi password tidak cocok.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    try {
      const res = await changeAdminPassword(oldPw, newPw);
      if (res.success) {
        setSuccess(true);
        setOldPw(''); setNewPw(''); setConfPw('');
      } else {
        setError(res.message || 'Gagal mengubah password.');
      }
    } catch {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <nav className="flex text-sm font-medium mb-3" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          <li><span className="text-gray-500 dark:text-slate-400">Admin</span></li>
          <li><span className="text-gray-400 dark:text-slate-500 mx-1">/</span></li>
          <li><span className="text-gray-900 dark:text-slate-100 font-semibold">Ubah Password</span></li>
        </ol>
      </nav>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Ubah Password</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Perbarui password akun admin Anda</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#CC0000]/10 flex items-center justify-center text-[#CC0000]">
            <LockIcon />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Keamanan Akun</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">Gunakan password yang kuat dan unik</p>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                <CheckIcon />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">Password Berhasil Diubah</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Gunakan password baru Anda untuk login berikutnya.</p>
              <button
                onClick={() => setSuccess(false)}
                className="px-5 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors"
              >
                Ubah Password Lagi
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <PasswordField
                id="old-password"
                label="Password Saat Ini"
                value={oldPw}
                onChange={v => { setOldPw(v); setError(''); }}
                placeholder="Masukkan password saat ini"
                show={showOld}
                onToggle={() => setShowOld(p => !p)}
              />

              <PasswordField
                id="new-password"
                label="Password Baru"
                value={newPw}
                onChange={v => { setNewPw(v); setError(''); }}
                placeholder="Minimal 8 karakter"
                show={showNew}
                onToggle={() => setShowNew(p => !p)}
              />

              {/* Strength Meter */}
              {newPw && (
                <div className="mt-1 space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i <= strength.level ? strength.color : '#e5e7eb' }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: strength.color }}>
                    {strength.label}
                  </p>
                </div>
              )}

              <PasswordField
                id="confirm-password"
                label="Konfirmasi Password Baru"
                value={confPw}
                onChange={v => { setConfPw(v); setError(''); }}
                placeholder="Ulangi password baru"
                show={showConf}
                onToggle={() => setShowConf(p => !p)}
                error={confPw && confPw !== newPw ? 'Password tidak cocok' : undefined}
              />

              {/* Tips */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-xl px-4 py-3 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p className="font-semibold mb-1">Tips password kuat:</p>
                <p>• Minimal 8 karakter (lebih panjang lebih baik)</p>
                <p>• Gabungkan huruf besar, huruf kecil, angka, dan simbol</p>
                <p>• Hindari informasi pribadi (nama, tanggal lahir, dll.)</p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-600 dark:text-red-400">
                  <svg className="flex-shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#CC0000] text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
