'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentDashboard, getToken } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KppmStep {
  step: number;
  label: string;
  completed: boolean;
  date: string | null;
}

interface NextStep {
  label: string;
  completed: boolean;
}

interface KppmStatus {
  status: string;
  current_step: number;
  steps: KppmStep[];
  next_steps: NextStep[];
}

interface StudentProfile {
  name: string;
  nim: string;
  class: string;
  prodi: string;
  semester: number;
  ipk: number;
}

interface DashboardData {
  profile: StudentProfile;
  kppm_status: KppmStatus;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full min-h-64">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-[#CC0000] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Memuat dashboard...</p>
    </div>
  </div>
);

const AcademicIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

// ─── Helpers ────────────────────────────────────────────────────────────────────

type GreetingPeriod = 'pagi' | 'siang' | 'sore' | 'malam';

function getGreetingInfo(hour: number): { text: string; period: GreetingPeriod } {
  if (hour < 11) return { text: 'Selamat Pagi',  period: 'pagi'  };
  if (hour < 15) return { text: 'Selamat Siang', period: 'siang' };
  if (hour < 18) return { text: 'Selamat Sore',  period: 'sore'  };
  return          { text: 'Selamat Malam', period: 'malam' };
}

function GreetingIcon({ period }: { period: GreetingPeriod }) {
  if (period === 'pagi') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="4.5" fill="rgba(255,255,255,0.92)" stroke="white" strokeWidth="0.5"/>
        <line x1="12" y1="2"    x2="12" y2="4.5"   stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="19.5" x2="12" y2="22"    stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <line x1="2"  y1="12"   x2="4.5"  y2="12"  stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <line x1="19.5" y1="12" x2="22"   y2="12"  stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <line x1="4.93" y1="4.93"  x2="6.7"   y2="6.7"   stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="17.3" y1="17.3"  x2="19.07" y2="19.07" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="19.07" y1="4.93" x2="17.3"  y2="6.7"   stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="6.7"   y1="17.3" x2="4.93"  y2="19.07" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
  if (period === 'siang') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="5.5" fill="rgba(255,255,255,0.95)" stroke="white" strokeWidth="0.5"/>
        <line x1="12" y1="1.5" x2="12" y2="4"     stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="12" y1="20"  x2="12" y2="22.5"  stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="1.5" y1="12" x2="4"   y2="12"   stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="20"  y1="12" x2="22.5" y2="12"  stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="4.22" y1="4.22" x2="6"    y2="6"     stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="18"   y1="18"   x2="19.78" y2="19.78" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="19.78" y1="4.22" x2="18"  y2="6"     stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="6"     y1="18"   x2="4.22" y2="19.78" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
  if (period === 'sore') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="2" y1="16" x2="22" y2="16" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 16 A6 6 0 0 1 18 16" fill="rgba(255,255,255,0.7)"/>
        <path d="M6 16 A6 6 0 0 1 18 16" stroke="white" strokeWidth="1.2" fill="none"/>
        <line x1="12"   y1="4"   x2="12"  y2="7"   stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="4.93" y1="7.5" x2="6.7" y2="9.2" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="19.07" y1="7.5" x2="17.3" y2="9.2" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="2"    y1="12" x2="4.5" y2="12" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="19.5" y1="12" x2="22"  y2="12" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="rgba(255,255,255,0.85)"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getCurrentDate(): string {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const labels: Record<string, { label: string; color: string }> = {
    belum_daftar:    { label: 'Belum Mendaftar',     color: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400' },
    pending_approval:{ label: 'Menunggu Verifikasi', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500' },
    approved:        { label: 'Disetujui',           color: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500' },
    cancelled:       { label: 'Dibatalkan',          color: 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-500' },
    rejected:        { label: 'Ditolak',             color: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' },
  };
  const { label, color } = labels[status] || { label: status, color: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400' };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
};

// ─── Progress Stepper ─────────────────────────────────────────────────────────

const ProgressStepper = ({ steps, currentStep }: { steps: KppmStep[]; currentStep: number }) => {
  const totalSteps = steps.length;
  // Progress bar width berdasarkan berapa step yang completed
  const completedCount = steps.filter(s => s.completed).length;
  const progressPct = totalSteps > 1 ? (completedCount / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="relative">
      {/* Track wrapper — starts & ends at the center of first/last circles (w-8/2 = 1rem) */}
      <div className="absolute top-4 left-0 right-0 mx-[1rem] h-0.5 z-0 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
        <div
          className="h-full bg-[#CC0000] transition-all duration-500"
          style={{ width: `${Math.min(progressPct, 100)}%` }}
        />
      </div>
      <div className="relative z-10 flex justify-between">
        {steps.map((step) => {
          const isDone    = step.completed;
          const isCurrent = step.step === currentStep + 1;
          return (
            <div key={step.step} className="flex flex-col items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all text-sm font-bold ${
                  isDone
                    ? 'bg-[#CC0000] border-[#CC0000] text-white'
                    : isCurrent
                      ? 'bg-white dark:bg-slate-900 border-[#CC0000] text-[#CC0000]'
                      : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500'
                }`}
              >
                {isDone ? <CheckIcon /> : step.step}
              </div>
              <span className={`text-xs text-center font-medium leading-tight ${
                isDone || isCurrent ? 'text-gray-800 dark:text-slate-200' : 'text-gray-400 dark:text-slate-500'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [greeting, setGreeting] = useState<{ text: string; period: GreetingPeriod }>({ text: 'Selamat Datang', period: 'pagi' });
  const [currentDate, setCurrentDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{title: string; message: string} | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }
    const hour = new Date().getHours();
    setGreeting(getGreetingInfo(hour));
    setCurrentDate(getCurrentDate());

    const fetchDashboard = async () => {
      try {
        const res = await getStudentDashboard();
        if (res.success && res.data) {
          setData(res.data as DashboardData);
        } else {
          let title = 'Gagal Memuat Data';
          if (res.message?.toLowerCase().includes('database') || res.message?.toLowerCase().includes('koneksi')) {
            title = 'Koneksi Database Bermasalah';
          } else if (res.message?.toLowerCase().includes('tidak ditemukan')) {
            title = 'Data Tidak Ditemukan';
          }
          setError({ title, message: res.message || 'Terjadi kesalahan saat memuat data dashboard.' });
        }
      } catch {
        setError({ title: 'Koneksi Server Bermasalah', message: 'Tidak dapat terhubung ke server API. Pastikan backend berjalan.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, [router]);

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-6 text-center transition-colors">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-red-700 dark:text-red-400 font-semibold mb-1">{error.title}</p>
          <p className="text-red-500 dark:text-red-300 text-sm mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#CC0000] text-white rounded-lg text-sm font-medium hover:bg-[#A30000] transition-colors"
          >
            <RefreshIcon />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const profile = data?.profile;
  const kppm = data?.kppm_status;
  const initials = profile?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'MH';

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5">
      {/* ── Hero Banner ── */}
      <div className="relative bg-gradient-to-br from-[#CC0000] via-[#B00000] to-[#7A0000] rounded-2xl md:rounded-3xl p-5 md:p-8 text-white overflow-hidden shadow-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute top-8 -right-4 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 right-16 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-white/10" />

        <div className="relative flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-xl md:text-3xl font-bold shadow-lg">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-green-400 rounded-full border-2 border-white shadow" title="Online" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <GreetingIcon period={greeting.period} />
              <span className="text-red-200 text-xs sm:text-sm font-medium">{greeting.text}</span>
            </div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight break-words leading-tight">
              {profile?.name || 'Mahasiswa'}
            </h1>
            <div className="text-red-100/80 text-xs mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="flex items-center gap-1 font-semibold"><AcademicIcon /><span>NIM {profile?.nim || '-'}</span></span>
              <span className="hidden sm:inline w-px h-3 bg-red-200/30" />
              <span>Kelas: <strong className="text-white font-semibold">{profile?.class || '-'}</strong></span>
              <span className="hidden sm:inline w-px h-3 bg-red-200/30" />
              <span className="text-white font-medium">{profile?.prodi || 'Program Studi'}</span>
            </div>
            {currentDate && (
              <p className="text-red-100/50 text-[11px] mt-2 md:hidden">{currentDate}</p>
            )}
          </div>

          {/* Date badge — hanya desktop */}
          <div className="flex-shrink-0 hidden md:block">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3 text-center">
              <p className="text-red-200 text-[10px] font-semibold uppercase tracking-widest mb-0.5">Hari ini</p>
              <p className="text-white text-xs font-bold leading-snug max-w-[140px]">{currentDate}</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative mt-4 pt-3 border-t border-white/10">
          <p className="text-red-100/60 text-[11px] leading-relaxed">Portal Mahasiswa — Sistem Manajemen KPPM Telkom University</p>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Status KPPM Card (2/3) ── */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">
              Status Pendaftaran KPPM
            </h2>
            <StatusBadge status={kppm?.status || 'belum_daftar'} />
          </div>

          {kppm?.steps && (
            <ProgressStepper steps={kppm.steps} currentStep={kppm.current_step} />
          )}

          <div className="flex gap-3 mt-8">
            <button
              id="btn-ajukan-pendaftaran"
              onClick={() => router.push('/isi-data-kppm')}
              className="px-5 py-2.5 bg-[#CC0000] hover:bg-[#A30000] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              Ajukan Pendaftaran
            </button>
            <button
              id="btn-cek-syarat"
              className="px-5 py-2.5 border-2 border-[#CC0000] dark:border-red-500 text-[#CC0000] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-semibold rounded-xl transition-all"
            >
              Cek Syarat &amp; Ketentuan
            </button>
          </div>
        </div>

        {/* ── Langkah Selanjutnya (1/3) ── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 transition-colors">
          <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-4 uppercase tracking-wider">
            Langkah Selanjutnya
          </h2>
          <div className="space-y-3">
            {kppm?.next_steps?.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center ${step.completed ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-700'
                    }`}
                >
                  {step.completed && <CheckIcon />}
                </div>
                <p className={`text-sm leading-snug ${step.completed ? 'text-gray-400 dark:text-slate-500 line-through' : 'text-gray-700 dark:text-slate-300'}`}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
