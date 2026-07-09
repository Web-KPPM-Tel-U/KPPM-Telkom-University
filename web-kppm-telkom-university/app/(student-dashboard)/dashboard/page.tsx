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
      <p className="text-gray-500 text-sm font-medium">Memuat dashboard...</p>
    </div>
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const labels: Record<string, { label: string; color: string }> = {
    belum_daftar: { label: 'Belum Mendaftar', color: 'bg-gray-100 text-gray-600' },
    pending_approval: { label: 'Menunggu Verifikasi', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: 'Disetujui', color: 'bg-green-100 text-green-700' },
  };
  const { label, color } = labels[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
};

// ─── Progress Stepper ─────────────────────────────────────────────────────────

const ProgressStepper = ({ steps, currentStep }: { steps: KppmStep[]; currentStep: number }) => (
  <div className="relative">
    <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 mx-8 z-0" />
    <div
      className="absolute top-4 left-0 h-0.5 bg-[#CC0000] z-0 transition-all duration-500 mx-8"
      style={{ width: `${Math.min(currentStep / (steps.length - 1), 1) * 100}%` }}
    />
    <div className="relative z-10 flex justify-between">
      {steps.map((step) => {
        const isDone = step.completed;
        const isCurrent = step.step === currentStep + 1;
        return (
          <div key={step.step} className="flex flex-col items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all text-sm font-bold ${isDone
                ? 'bg-[#CC0000] border-[#CC0000] text-white'
                : isCurrent
                  ? 'bg-white border-[#CC0000] text-[#CC0000]'
                  : 'bg-white border-gray-300 text-gray-400'
                }`}
            >
              {isDone ? <CheckIcon /> : step.step}
            </div>
            <span className={`text-xs text-center font-medium leading-tight ${isDone || isCurrent ? 'text-gray-800' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Status Card ──────────────────────────────────────────────────────────────

const StatusCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }

    const fetchDashboard = async () => {
      try {
        const res = await getStudentDashboard();
        if (res.success && res.data) {
          setData(res.data as DashboardData);
        } else {
          setError('Gagal memuat data dashboard.');
        }
      } catch {
        setError('Tidak dapat terhubung ke server. Pastikan backend (Student Service) berjalan.');
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
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-red-700 font-semibold mb-1">Koneksi Bermasalah</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* ── Page Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat Datang, {profile?.name}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          NIM: {profile?.nim} &middot; Kelas: {profile?.class}
        </p>
      </div>

      {/* ── Status Card ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatusCard label="Status KPPM" value="Belum Mendaftar" color="text-gray-700" />
        <StatusCard label="Program Studi" value={profile?.prodi || '-'} color="text-[#CC0000]" />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Status KPPM Card (2/3) ── */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
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
              className="px-5 py-2.5 bg-[#CC0000] hover:bg-[#A30000] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              Ajukan Pendaftaran
            </button>
            <button
              id="btn-cek-syarat"
              className="px-5 py-2.5 border-2 border-[#CC0000] text-[#CC0000] hover:bg-red-50 text-sm font-semibold rounded-xl transition-all"
            >
              Cek Syarat &amp; Ketentuan
            </button>
          </div>
        </div>

        {/* ── Langkah Selanjutnya (1/3) ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
            Langkah Selanjutnya
          </h2>
          <div className="space-y-3">
            {kppm?.next_steps?.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center ${step.completed ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                >
                  {step.completed && <CheckIcon />}
                </div>
                <p className={`text-sm leading-snug ${step.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
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
