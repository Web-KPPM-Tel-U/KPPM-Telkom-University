'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUser, StudentUser, submitKppmRegistration, getKppmRegistrations, KppmRegistration, getLecturersList, Lecturer, getKppmRegistrationDetail, KppmRegistrationDetail, cancelKppmRegistration } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'list' | 'form' | 'success' | 'detail';


// ─── Icons ────────────────────────────────────────────────────────────────────

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M5 21V7l7-4 7 4v14" />
    <path d="M9 21V11h6v10" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const UploadCloudIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16,16 12,12 8,16" /><line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,6 5,6 21,6" /><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6" />
    <path d="M10,11v6M14,11v6M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2" />
  </svg>
);

const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" />
  </svg>
);

const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12,19 5,12 12,5" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

// ─── Loading Spinner ───────────────────────────────────────────────────────────

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full min-h-64">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-[#CC0000] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-gray-500 text-sm font-medium">Memuat data...</p>
    </div>
  </div>
);


// ─── Form Field Components ─────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  readOnly?: boolean;
  hint?: string;
  hasError?: boolean;
  children: React.ReactNode;
}

const FormField = ({ label, required, readOnly, hint, hasError, errorMsg, children }: FieldProps & { errorMsg?: string }) => (
  <div className="flex flex-col gap-1.5">
    <label className={`flex items-center gap-1.5 text-sm font-semibold ${hasError ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
      {label}
      {required && <span className="text-[#CC0000]">*</span>}
      {readOnly && (
        <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full ml-1">
          <LockIcon /> Auto
        </span>
      )}
      {hasError && (!errorMsg || errorMsg === 'required') && (
        <span className="text-[10px] font-medium text-red-500 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full ml-1">Wajib diisi</span>
      )}
    </label>
    {children}
    {hasError && errorMsg && errorMsg !== 'required' && (
      <p className="text-xs font-medium text-red-500 flex items-center gap-1">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {errorMsg}
      </p>
    )}
    {hint && !hasError && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
  </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  hasError?: boolean;
}

const Input = ({ icon, hasError, className = '', ...props }: InputProps) => (
  <div className="relative">
    {icon && (
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
        {icon}
      </span>
    )}
    <input
      className={`w-full h-10 rounded-lg border text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
        focus:outline-none focus:ring-2 transition-all
        disabled:bg-gray-50 dark:disabled:bg-gray-700/50 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed
        read-only:bg-gray-50 dark:read-only:bg-gray-700/50 read-only:text-gray-600 dark:read-only:text-gray-400 read-only:cursor-default
        ${hasError
          ? 'border-red-400 bg-red-50/40 dark:bg-red-900/20 focus:ring-red-200 focus:border-red-500'
          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-[#CC0000]/20 focus:border-[#CC0000]'}
        ${icon ? 'pl-9 pr-3' : 'px-3'}
        ${className}`}
      {...props}
    />
  </div>
);

interface SectionProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  color?: string;
}

const SectionHeader = ({ title, subtitle }: SectionProps) => (
  <div className="mb-5">
    <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</h2>
    {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
);

const DetailField = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div>
    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-0.5">{label}</p>
    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{value || <span className="text-gray-300 dark:text-gray-600 font-normal italic">—</span>}</p>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function IsiDataKppmPage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('list');
  const [registrations, setRegistrations] = useState<KppmRegistration[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── State untuk konfirmasi pembatalan ─────────────────────────────────────
  const [cancelConfirm, setCancelConfirm] = useState<{ id: number } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [isLoadingLecturers, setIsLoadingLecturers] = useState(false);
  const [selectedLecturerId, setSelectedLecturerId] = useState('');

  const [detailData, setDetailData] = useState<KppmRegistrationDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  // Field-level validation errors — string = pesan error, '' = tidak ada error
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    kodeSemester: '',
    whatsapp: '',
    perusahaan: '',
    posisiDivisi: '',
    tanggalMulai: '',
    tanggalAkhir: '',
    mentorName: '',
    mentorPosition: '',
    mentorEmail: '',
    mentorPhone: '',
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [listSearch, setListSearch] = useState('');
  const [listEntries, setListEntries] = useState(10);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }
    try {
      const userData = getUser();
      if (userData && userData.role === 'student') {
        setStudent(userData as StudentUser);
      } else {
        setError('Data mahasiswa tidak ditemukan. Silakan login ulang.');
      }
    } catch {
      setError('Tidak dapat memuat data profil mahasiswa.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Load daftar dosen pembimbing untuk dropdown
  useEffect(() => {
    const fetchLecturers = async () => {
      const token = getToken();
      if (!token) return;
      setIsLoadingLecturers(true);
      try {
        const res = await getLecturersList();
        if (res.success && res.data) setLecturers(res.data);
      } catch {
        // Biarkan kosong jika gagal
      } finally {
        setIsLoadingLecturers(false);
      }
    };
    fetchLecturers();
  }, []);

  // Load riwayat pendaftaran dari API
  useEffect(() => {
    const fetchRegistrations = async () => {
      const token = getToken();
      if (!token) return;
      setIsLoadingList(true);
      try {
        const res = await getKppmRegistrations(listEntries, 0);
        if (res.success && res.data) {
          setRegistrations(res.data ?? []);
          setListTotal(res.meta?.total ?? 0);
        }
      } catch {
        // Gagal load list, biarkan kosong
      } finally {
        setIsLoadingList(false);
      }
    };
    fetchRegistrations();
  }, [listEntries]);



  const handleFile = (file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      alert('Format file tidak didukung. Gunakan PDF, JPG, atau PNG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5 MB.');
      return;
    }
    setUploadedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const resetForm = () => {
    setForm({ kodeSemester: '', whatsapp: '', perusahaan: '', posisiDivisi: '', tanggalMulai: '', tanggalAkhir: '', mentorName: '', mentorPosition: '', mentorEmail: '', mentorPhone: '' });
    setUploadedFile(null);
    setSelectedLecturerId('');
    setSubmitError('');
    setFieldErrors({});
  };

  // Clear error on field when user starts typing
  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Hanya cek field wajib tidak boleh kosong sebelum dikirim ke backend.
  // Semua validasi FORMAT (angka, panjang, email, tanggal, dll) dilakukan oleh backend.
  const validateRequiredFields = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.kodeSemester.trim())   errors['kodeSemester']   = 'required';
    if (!form.whatsapp.trim())       errors['whatsapp']       = 'required';
    if (!form.perusahaan.trim())     errors['perusahaan']     = 'required';
    if (!form.posisiDivisi.trim())   errors['posisiDivisi']   = 'required';
    if (!form.tanggalMulai)          errors['tanggalMulai']   = 'required';
    if (!form.tanggalAkhir)          errors['tanggalAkhir']   = 'required';
    if (!form.mentorName.trim())     errors['mentorName']     = 'required';
    if (!form.mentorPosition.trim()) errors['mentorPosition'] = 'required';
    if (!form.mentorEmail.trim())    errors['mentorEmail']    = 'required';
    if (!form.mentorPhone.trim())    errors['mentorPhone']    = 'required';
    if (!selectedLecturerId)         errors['lecturerId']     = 'required';
    if (!uploadedFile)               errors['suratToss']      = 'required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleViewDetail = async (id: number) => {
    setIsLoadingDetail(true);
    setDetailData(null);
    setShowDocModal(false);
    setView('detail');
    try {
      const res = await getKppmRegistrationDetail(id);
      if (res.success && res.data) setDetailData(res.data);
    } catch {
      setView('list');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // ── Handler pembatalan pendaftaran ────────────────────────────────────────
  const handleCancelRegistration = async () => {
    if (!cancelConfirm) return;
    setIsCancelling(true);
    setCancelError('');
    try {
      const res = await cancelKppmRegistration(cancelConfirm.id);
      if (res.success) {
        // Refresh daftar setelah berhasil dibatalkan
        const listRes = await getKppmRegistrations(listEntries, 0);
        if (listRes.success && listRes.data) {
          setRegistrations(listRes.data ?? []);
          setListTotal(listRes.meta?.total ?? 0);
        }
        setCancelConfirm(null);
      } else {
        setCancelError(res.message || 'Gagal membatalkan pendaftaran.');
      }
    } catch {
      setCancelError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Peta pesan error backend → field yang perlu di-highlight
  const parseBackendError = (message: string): Record<string, string> => {
    const errs: Record<string, string> = {};
    const msg = message.toLowerCase();

    // Nomor WhatsApp
    if (msg.includes('whatsapp')) {
      errs['whatsapp'] = message;
    }
    // Nomor telepon pembimbing
    if (msg.includes('telepon pembimbing') || msg.includes('nomor telepon')) {
      errs['mentorPhone'] = message;
    }
    // Email pembimbing
    if (msg.includes('email pembimbing') || msg.includes('email tidak valid')) {
      errs['mentorEmail'] = message;
    }
    // Tanggal berakhir
    if (msg.includes('tanggal berakhir') || msg.includes('tanggal akhir') || msg.includes('tanggal selesai')) {
      errs['tanggalAkhir'] = message;
    }
    // Format tanggal tidak valid → highlight keduanya
    if (msg.includes('format tanggal')) {
      errs['tanggalMulai'] = message;
      errs['tanggalAkhir'] = message;
    }
    // Surat TOSS
    if (msg.includes('toss') || msg.includes('surat pengantar')) {
      errs['suratToss'] = message;
    }
    // Field wajib diisi → parse nama field dari pesan backend
    if (msg.includes('wajib diisi')) {
      const backendToFrontend: Record<string, string> = {
        kode_semester:   'kodeSemester',
        whatsapp:        'whatsapp',
        perusahaan:      'perusahaan',
        posisi_divisi:   'posisiDivisi',
        tanggal_mulai:   'tanggalMulai',
        tanggal_akhir:   'tanggalAkhir',
        mentor_name:     'mentorName',
        mentor_position: 'mentorPosition',
        mentor_email:    'mentorEmail',
        mentor_phone:    'mentorPhone',
        lecturer_id:     'lecturerId',
      };
      Object.entries(backendToFrontend).forEach(([backKey, frontKey]) => {
        if (msg.includes(backKey)) errs[frontKey] = '';
      });
    }

    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setFieldErrors({});

    // Cek field tidak kosong (hanya empty check, bukan validasi format)
    // Semua validasi format dilakukan oleh backend
    if (!validateRequiredFields()) {
      setSubmitError('Harap lengkapi semua field yang ditandai sebelum mengirim pendaftaran.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('kode_semester',   form.kodeSemester);
      formData.append('whatsapp',        form.whatsapp);
      formData.append('perusahaan',      form.perusahaan);
      formData.append('posisi_divisi',   form.posisiDivisi);
      formData.append('tanggal_mulai',   form.tanggalMulai);
      formData.append('tanggal_akhir',   form.tanggalAkhir);
      formData.append('mentor_name',     form.mentorName);
      formData.append('mentor_position', form.mentorPosition);
      formData.append('mentor_email',    form.mentorEmail);
      formData.append('mentor_phone',    form.mentorPhone);
      formData.append('lecturer_id',     selectedLecturerId);
      if (uploadedFile) formData.append('surat_toss', uploadedFile);

      const res = await submitKppmRegistration(formData);
      if (res.success) {
        const listRes = await getKppmRegistrations(listEntries, 0);
        if (listRes.success && listRes.data) {
          setRegistrations(listRes.data ?? []);
          setListTotal(listRes.meta?.total ?? 0);
        }
        resetForm();
        setView('success');
      } else {
        // Tampilkan pesan error dari backend
        const msg = res.message || 'Terjadi kesalahan. Silakan coba lagi.';
        setSubmitError(msg);
        // Highlight field yang bermasalah berdasarkan pesan backend
        const fieldErrs = parseBackendError(msg);
        if (Object.keys(fieldErrs).length > 0) {
          setFieldErrors(fieldErrs);
        }
      }
    } catch {
      setSubmitError('Terjadi kesalahan jaringan. Periksa koneksi Anda dan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };



  const progress = (() => {
    const fields = [
      form.kodeSemester, form.whatsapp, form.perusahaan, form.posisiDivisi,
      form.tanggalMulai, form.tanggalAkhir, form.mentorName, form.mentorPosition,
      form.mentorEmail, form.mentorPhone, uploadedFile ? 'ok' : '',
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  })();

  // ── States ────────────────────────────────────────────────────────────────────

  const statusConfig: Record<KppmRegistration['status'], { text: string; bg: string; dot: string; text_color: string }> = {
    pending_approval: { text: 'Menunggu Verifikasi', bg: 'bg-amber-50',  dot: 'bg-amber-400', text_color: 'text-amber-700' },
    approved:         { text: 'Disetujui',           bg: 'bg-green-50',  dot: 'bg-green-500', text_color: 'text-green-700' },
    cancelled:        { text: 'Dibatalkan',          bg: 'bg-gray-100',  dot: 'bg-gray-400',  text_color: 'text-gray-500'  },
  };

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

  // ── Success View ───────────────────────────────────────────────────────────

  if (view === 'success') {
    return (
      <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Pendaftaran Berhasil Dikirim</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm">
          Data KP/Magang Anda telah dikirim dan sedang menunggu verifikasi dari pembimbing akademik.
        </p>
        <button
          onClick={() => setView('list')}
          className="px-5 py-2.5 bg-[#CC0000] text-white rounded-lg text-sm font-semibold hover:bg-[#A30000] transition-colors"
        >
          Kembali ke Daftar Pendaftaran
        </button>
      </div>
    );
  }

  // ── Detail View ────────────────────────────────────────────────────────────

  if (view === 'detail') {
    const gw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const fileUrl = detailData?.toss_cover_letter_file
      ? `${gw}${detailData.toss_cover_letter_file}`
      : null;
    const isPdf = fileUrl?.toLowerCase().endsWith('.pdf');
    const s = detailData ? statusConfig[detailData.status] : null;

    return (
      <div className="p-5 md:p-6 max-w-4xl mx-auto">

        {/* Document Modal / Overlay */}
        {showDocModal && fileUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setShowDocModal(false)}
          >
            <div
              className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              style={{ width: '90vw', maxWidth: 900, height: '88vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
                  </svg>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Surat Pengajuan TOSS</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CC0000] border border-[#CC0000]/30 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Buka di Tab Baru
                  </a>
                  <button
                    onClick={() => setShowDocModal(false)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
              {/* Modal Content */}
              <div className="flex-1 overflow-hidden bg-gray-100">
                {isPdf ? (
                  <iframe src={fileUrl} className="w-full h-full border-0" title="Surat TOSS" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <img src={fileUrl} alt="Surat TOSS" className="max-w-full max-h-full object-contain rounded-lg shadow" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setDetailData(null); setView('list'); }}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeftIcon />
              Kembali
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Detail Pendaftaran KP / Magang</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Informasi lengkap pengajuan KPPM</p>
            </div>
          </div>
          {s && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${s.bg} ${s.text_color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.text}
            </span>
          )}
        </div>

        {/* Loading */}
        {isLoadingDetail ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-[3px] border-[#CC0000] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Memuat detail pendaftaran...</p>
          </div>
        ) : !detailData ? (
          <div className="text-center py-16 text-gray-400 text-sm">Gagal memuat data. Silakan kembali dan coba lagi.</div>
        ) : (
          <div className="flex flex-col gap-5">

            {/* TANGGAL PENGAJUAN — inline sebelum cards */}
            <div className="flex flex-wrap items-center gap-3 px-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span className="text-xs text-gray-400 dark:text-gray-500">Tanggal Pengajuan:</span>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {new Date(detailData.submitted_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
              {detailData.approved_at && (
                <>
                  <span className="text-gray-200">·</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  <span className="text-xs text-gray-400">Disetujui:</span>
                  <span className="text-xs font-semibold text-green-600">
                    {new Date(detailData.approved_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </>
              )}
              {detailData.cancelled_at && (
                <>
                  <span className="text-gray-200">·</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  <span className="text-xs text-gray-400">Dibatalkan:</span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {new Date(detailData.cancelled_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </>
              )}
            </div>

            {/* BANNER DIBATALKAN — tampil jika status cancelled */}
            {detailData.status === 'cancelled' && (
              <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-5 py-4">
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Pengajuan Telah Dibatalkan</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Pengajuan ini dibatalkan pada{' '}
                    <span className="font-semibold">
                      {detailData.cancelled_at
                        ? new Date(detailData.cancelled_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </span>.
                    Data tetap disimpan sebagai arsip riwayat pengajuan.
                  </p>
                </div>
              </div>
            )}

            {/* DATA MAHASISWA */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Data Mahasiswa</span>
              </div>
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <DetailField label="NIM" value={detailData.nim} />
                <DetailField label="Nama Mahasiswa" value={detailData.student_name} />
                <DetailField label="Kelas" value={detailData.student_class} />
                <DetailField label="Email" value={detailData.student_email} />
                <DetailField label="Kode Semester" value={detailData.semester_code} />
                <DetailField label="No. WhatsApp" value={detailData.whatsapp_number} />
              </div>
            </div>

            {/* DATA PERUSAHAAN */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/><path d="M8 7V5a2 2 0 0 0-4 0v2"/>
                </svg>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Data Perusahaan</span>
              </div>
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <DetailField label="Nama Perusahaan" value={detailData.company_name} />
                <DetailField label="Posisi / Divisi" value={detailData.internship_position} />
                <DetailField label="Tanggal Mulai" value={new Date(detailData.internship_start).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} />
                <DetailField label="Tanggal Selesai" value={new Date(detailData.internship_end).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} />
                <DetailField
                  label="Durasi KP"
                  value={(() => {
                    const start = new Date(detailData.internship_start);
                    const end   = new Date(detailData.internship_end);
                    const diffMs   = end.getTime() - start.getTime();
                    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
                    const months   = Math.floor(diffDays / 30);
                    const days     = diffDays % 30;
                    if (months > 0 && days > 0) return `${months} bulan ${days} hari (${diffDays} hari)`;
                    if (months > 0) return `${months} bulan (${diffDays} hari)`;
                    return `${diffDays} hari`;
                  })()}
                />
              </div>
            </div>

            {/* DATA MENTOR */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Data Mentor Lapangan</span>
              </div>
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <DetailField label="Nama Mentor" value={detailData.mentor_name} />
                <DetailField label="Jabatan" value={detailData.mentor_position} />
                <DetailField label="Email" value={detailData.mentor_email} />
                <DetailField label="No. Telepon" value={detailData.mentor_phone} />
              </div>
            </div>

            {/* PEMBIMBING AKADEMIK */}
            {detailData.pembimbing_akademik && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Pembimbing Akademik</span>
                </div>
                <div className="px-6 py-5">
                  <DetailField label="Nama Dosen Pembimbing" value={detailData.pembimbing_akademik} />
                </div>
              </div>
            )}

            {/* LAMPIRAN DOKUMEN */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Lampiran Dokumen</span>
              </div>
              <div className="px-6 py-5">
                {fileUrl ? (
                  <button
                    onClick={() => setShowDocModal(true)}
                    className="inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-[#CC0000]/40 transition-all group w-full sm:w-auto text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#CC0000]/10 flex items-center justify-center shrink-0 group-hover:bg-[#CC0000]/20 transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 group-hover:text-[#CC0000] transition-colors">Surat Pengajuan TOSS</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{isPdf ? 'PDF Document' : 'Gambar'} · Klik untuk melihat</p>
                    </div>
                    <svg className="text-gray-300 dark:text-gray-600 group-hover:text-[#CC0000] transition-colors shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">Tidak ada lampiran.</p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    );
  }

  // ── Form View ──────────────────────────────────────────────────────────────

  if (view === 'form') {
    return (
      <div className="p-5 md:p-6 max-w-4xl mx-auto">

        {/* Page Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { resetForm(); setView('list'); }}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeftIcon />
              Kembali
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Formulir Pendaftaran KP / Magang</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Lengkapi semua data sebelum mengirim</p>
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{progress}% lengkap</span>
            <div className="w-28 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#16A34A' : '#CC0000' }}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* SECTION 1: Data Mahasiswa */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <SectionHeader
              icon={<UserIcon />}
              title="Data Mahasiswa"
              subtitle="Terisi otomatis berdasarkan profil akun Anda"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="NIM" readOnly>
                <Input id="field-nim" value={student?.nim ?? ''} readOnly icon={<LockIcon />} />
              </FormField>
              <FormField label="Nama Lengkap" readOnly>
                <Input id="field-nama" value={student?.name ?? ''} readOnly icon={<LockIcon />} />
              </FormField>
              <FormField label="Kelas" readOnly>
                <Input id="field-kelas" value={student?.class ?? ''} readOnly icon={<LockIcon />} />
              </FormField>
              <FormField label="Kode Semester" required hasError={!!fieldErrors['kodeSemester']} hint="Contoh: 20242">
                <Input id="field-kode-semester" placeholder="20242" value={form.kodeSemester} hasError={!!fieldErrors['kodeSemester']} onChange={(e) => handleChange('kodeSemester', e.target.value)} maxLength={5} />
              </FormField>
              <FormField label="Email" readOnly>
                <Input id="field-email" type="email" value={student?.email ?? ''} readOnly icon={<LockIcon />} />
              </FormField>
              <FormField
                label="No. WhatsApp"
                required
                hasError={!!fieldErrors['whatsapp']}
                errorMsg={fieldErrors['whatsapp']}
                hint={!fieldErrors['whatsapp'] ? 'Hanya angka, 9–15 digit. Contoh: 6281234567890' : undefined}
              >
                <Input
                  id="field-whatsapp"
                  placeholder="6281234567890"
                  value={form.whatsapp}
                  hasError={!!fieldErrors['whatsapp']}
                  onChange={(e) => handleChange('whatsapp', e.target.value.replace(/\D/g, ''))}
                  type="tel"
                  inputMode="numeric"
                  maxLength={15}
                />
              </FormField>
            </div>
          </div>

          {/* SECTION 2: Data Perusahaan */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <SectionHeader
              icon={<BuildingIcon />}
              title="Data Tempat KP / Magang"
              subtitle="Informasi perusahaan atau instansi tempat Anda melaksanakan KP"
              color="#2563EB"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Perusahaan / Instansi Tempat KP" required hasError={!!fieldErrors['perusahaan']}>
                <Input id="field-perusahaan" placeholder="Contoh: PT. Telkom Indonesia" value={form.perusahaan} hasError={!!fieldErrors['perusahaan']} onChange={(e) => handleChange('perusahaan', e.target.value)} icon={<BuildingIcon />} />
              </FormField>
              <FormField label="Posisi / Divisi Penempatan KP" required hasError={!!fieldErrors['posisiDivisi']}>
                <Input id="field-posisi" placeholder="Contoh: Software Engineer Intern" value={form.posisiDivisi} hasError={!!fieldErrors['posisiDivisi']} onChange={(e) => handleChange('posisiDivisi', e.target.value)} />
              </FormField>
              <FormField label="Tanggal Mulai KP" required hasError={!!fieldErrors['tanggalMulai']}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><CalendarIcon /></span>
                  <input
                    id="field-tanggal-mulai"
                    type="date"
                    value={form.tanggalMulai}
                    onChange={(e) => { handleChange('tanggalMulai', e.target.value); if(fieldErrors['tanggalAkhir']) setFieldErrors(p=>({...p,tanggalAkhir:''})); }}
                    className={`w-full h-10 pl-9 pr-3 rounded-lg border text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all
                      ${fieldErrors['tanggalMulai'] ? 'border-red-400 bg-red-50/40 dark:bg-red-900/20 focus:ring-red-200 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-[#CC0000]/20 focus:border-[#CC0000]'}`}
                  />
                </div>
              </FormField>
              <FormField
                label="Tanggal Berakhir KP"
                required
                hasError={!!fieldErrors['tanggalAkhir']}
                errorMsg={fieldErrors['tanggalAkhir']}
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><CalendarIcon /></span>
                  <input
                    id="field-tanggal-akhir"
                    type="date"
                    value={form.tanggalAkhir}
                    min={form.tanggalMulai || undefined}
                    onChange={(e) => { handleChange('tanggalAkhir', e.target.value); }}
                    className={`w-full h-10 pl-9 pr-3 rounded-lg border text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all
                      ${fieldErrors['tanggalAkhir'] ? 'border-red-400 bg-red-50/40 dark:bg-red-900/20 focus:ring-red-200 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-[#CC0000]/20 focus:border-[#CC0000]'}`}
                  />
                </div>
              </FormField>
            </div>
            {form.tanggalMulai && form.tanggalAkhir && new Date(form.tanggalAkhir) >= new Date(form.tanggalMulai) && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-xl px-4 py-2.5 border border-blue-100">
                <CalendarIcon />
                <span>Durasi KP: <strong className="text-blue-700">{Math.ceil((new Date(form.tanggalAkhir).getTime() - new Date(form.tanggalMulai).getTime()) / (1000 * 60 * 60 * 24))} hari</strong></span>
              </div>
            )}
          </div>

          {/* SECTION 3: Surat Pengantar TOSS */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <SectionHeader
              icon={<FileIcon />}
              title="Surat Pengantar TOSS"
              subtitle="Upload surat pengantar dari sistem TOSS (PDF / JPG / PNG, maks. 5 MB)"
              color="#D97706"
            />
            {!uploadedFile ? (
              <div
                id="drop-zone-toss"
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200
                  ${isDragging
                    ? 'border-[#CC0000] bg-red-50 dark:bg-red-900/20 scale-[1.01]'
                    : !!fieldErrors['suratToss']
                      ? 'border-red-400 bg-red-50/40 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:border-[#CC0000]/50 hover:bg-red-50/40 dark:hover:bg-red-900/10'}`}
              >
                <div className={`transition-colors ${isDragging ? 'text-[#CC0000]' : !!fieldErrors['suratToss'] ? 'text-red-400' : 'text-gray-300'}`}><UploadCloudIcon /></div>
                <div className="text-center">
                  <p className={`text-sm font-semibold ${!!fieldErrors['suratToss'] ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}`}>
                    {isDragging ? 'Lepaskan file di sini...' : !!fieldErrors['suratToss'] ? 'Surat TOSS wajib diupload' : 'Drag & drop atau klik untuk upload'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF, JPG, PNG — Maksimal 5 MB</p>
                </div>
                <span className={`text-xs font-semibold px-4 py-1.5 rounded-full border ${!!fieldErrors['suratToss'] ? 'text-red-600 bg-red-50 border-red-200' : 'text-[#CC0000] bg-red-50 border-red-100'}`}>Pilih File</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0"><FileIcon /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(uploadedFile.size)}</p>
                </div>
                <button type="button" onClick={() => setUploadedFile(null)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><TrashIcon /></button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          </div>

          {/* SECTION 4: Pembimbing Lapang */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <SectionHeader
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              }
              title="Data Pembimbing Lapang / Mentor"
              subtitle="Pembimbing dari perusahaan atau instansi tempat KP"
              color="#7C3AED"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Nama Pembimbing Lapang / Mentor" required hasError={!!fieldErrors['mentorName']}>
                <Input id="field-mentor-name" placeholder="Nama lengkap pembimbing" value={form.mentorName} hasError={!!fieldErrors['mentorName']} onChange={(e) => handleChange('mentorName', e.target.value)} icon={<UserIcon />} />
              </FormField>
              <FormField label="Posisi / Jabatan Pembimbing" required hasError={!!fieldErrors['mentorPosition']}>
                <Input id="field-mentor-position" placeholder="Contoh: Senior Software Engineer" value={form.mentorPosition} hasError={!!fieldErrors['mentorPosition']} onChange={(e) => handleChange('mentorPosition', e.target.value)} />
              </FormField>
              <FormField
                label="Email Pembimbing"
                required
                hasError={!!fieldErrors['mentorEmail']}
                errorMsg={fieldErrors['mentorEmail']}
                hint={!fieldErrors['mentorEmail'] ? 'Contoh: mentor@perusahaan.com' : undefined}
              >
                <Input
                  id="field-mentor-email"
                  type="text"
                  placeholder="email@perusahaan.com"
                  value={form.mentorEmail}
                  hasError={!!fieldErrors['mentorEmail']}
                  onChange={(e) => handleChange('mentorEmail', e.target.value)}
                />
              </FormField>
              <FormField
                label="No. Telepon Pembimbing"
                required
                hasError={!!fieldErrors['mentorPhone']}
                errorMsg={fieldErrors['mentorPhone']}
                hint={!fieldErrors['mentorPhone'] ? 'Hanya angka, 9–15 digit' : undefined}
              >
                <Input
                  id="field-mentor-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="6281234567890"
                  value={form.mentorPhone}
                  hasError={!!fieldErrors['mentorPhone']}
                  onChange={(e) => handleChange('mentorPhone', e.target.value.replace(/\D/g, ''))}
                  maxLength={15}
                />
              </FormField>
            </div>
          </div>

          {/* SECTION 5: Pembimbing Akademik */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <SectionHeader
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              }
              title="Pembimbing Akademik"
              subtitle="Pilih dosen pembimbing akademik dari Telkom University"
              color="#CC0000"
            />
            <div className="max-w-sm">
              <FormField label="Dosen Pembimbing Akademik" required hasError={!!fieldErrors['lecturerId']}>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                  <select
                    id="field-lecturer"
                    value={selectedLecturerId}
                    onChange={(e) => { setSelectedLecturerId(e.target.value); if(fieldErrors['lecturerId']) setFieldErrors(p=>({...p,lecturerId:''})); }}
                    disabled={isLoadingLecturers}
                    className={`w-full h-10 pl-9 pr-8 rounded-lg border text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all appearance-none disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-400
                      ${fieldErrors['lecturerId'] ? 'border-red-400 bg-red-50/40 dark:bg-red-900/20 focus:ring-red-200 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-[#CC0000]/20 focus:border-[#CC0000]'}`}
                  >
                    <option value="">
                      {isLoadingLecturers ? 'Memuat dosen...' : '— Pilih dosen pembimbing —'}
                    </option>
                    {lecturers.map((l) => (
                      <option key={l.lecturer_id} value={l.lecturer_id}>
                        {l.lecturer_name}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6,9 12,15 18,9" />
                  </svg>
                </div>
              </FormField>
            </div>
          </div>



          {/* Error Submit */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {/* Submit */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="text-[#CC0000]">*</span> Wajib diisi — Pastikan semua data sudah benar sebelum mengirim.
            </p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => { resetForm(); setView('list'); }}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                Batal
              </button>
              <button id="btn-submit-form" type="submit" disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#CC0000] text-white hover:bg-[#A30000] active:scale-95 transition-all shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9" />
                    </svg>
                    Kirim Pendaftaran
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    );
  }

  // ── List View (default) ────────────────────────────────────────────────────

  return (
    <div className="p-6">

      {/* ── Modal Konfirmasi Pembatalan ──────────────────────────────────── */}
      {cancelConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => { if (!isCancelling) { setCancelConfirm(null); setCancelError(''); } }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon warning */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Batalkan Pengajuan?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Tindakan ini tidak dapat dibatalkan. Data pengajuan dan file TOSS akan dihapus permanen.
                </p>
              </div>
            </div>

            {/* Error message */}
            {cancelError && (
              <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-sm text-red-700 dark:text-red-400">{cancelError}</p>
              </div>
            )}

            {/* Tombol aksi */}
            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                onClick={() => { setCancelConfirm(null); setCancelError(''); }}
                disabled={isCancelling}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Tidak, Kembali
              </button>
              <button
                id="btn-konfirmasi-batal"
                onClick={handleCancelRegistration}
                disabled={isCancelling}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#CC0000] text-white hover:bg-[#A30000] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Membatalkan...
                  </>
                ) : (
                  'Ya, Batalkan Pengajuan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">Pendaftaran KP / Magang</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Riwayat pengajuan KPPM Anda</p>
        </div>
        <nav className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
          <span className="text-gray-500 dark:text-gray-400">Pendaftaran KP</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><polyline points="9,18 15,12 9,6" /></svg>
          <span className="text-[#CC0000] font-semibold">Daftar</span>
        </nav>
      </div>

      {/* Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>

        {/* Card Header */}
        <div className="px-6 py-4 flex items-center justify-between bg-[#fafafa] dark:bg-gray-800 border-b-2 border-[#ebebeb] dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-[#CC0000]" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Daftar Pengajuan</span>
            {registrations.length > 0 && (
              <span className="text-xs font-semibold text-[#CC0000] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                {registrations.length}
              </span>
            )}
          </div>
          <button
            id="btn-ajukan-pendaftaran"
            onClick={() => setView('form')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#CC0000] text-white text-sm font-semibold rounded-lg hover:bg-[#A30000] transition-colors"
            style={{ boxShadow: '0 2px 6px rgba(180,0,0,0.2)' }}
          >
            <PlusIcon />
            Ajukan Pendaftaran
          </button>
        </div>

        {/* Show entries — digabung dengan thead agar tidak bikin section sendiri */}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f4f4f6] dark:bg-gray-700/50 border-b-2 border-[#e5e7eb] dark:border-gray-600">
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-r border-[#e5e7eb] dark:border-gray-600">Tanggal Pengajuan</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-r border-[#e5e7eb] dark:border-gray-600">Status</th>
                <th className="text-right px-6 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">Tampilkan</span>
                    <select
                      value={listEntries}
                      onChange={(e) => setListEntries(Number(e.target.value))}
                      className="border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 focus:outline-none"
                    >
                      {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span className="text-xs text-gray-400 font-normal">data</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {isLoadingList ? (
                <tr>
                  <td colSpan={3} className="px-6 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-7 h-7 border-3 border-[#CC0000] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-gray-400">Memuat riwayat...</p>
                    </div>
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      <p className="text-sm font-medium text-gray-400">Belum ada pengajuan</p>
                      <p className="text-xs text-gray-300">Klik tombol &quot;Ajukan Pendaftaran&quot; untuk memulai</p>
                    </div>
                  </td>
                </tr>
              ) : (
                registrations.map((reg, idx) => {
                  const s = statusConfig[reg.status];
                  return (
                    <tr
                      key={reg.registration_id}
                      className={`transition-colors hover:bg-red-50/30 dark:hover:bg-red-900/10 border-b border-[#f0f0f0] dark:border-gray-700 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-[#fafafa] dark:bg-gray-800/60'}`}
                    >
                      <td className="px-6 py-4 border-r border-[#f0f0f0] dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {new Date(reg.submitted_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-r border-[#f0f0f0] dark:border-gray-700">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text_color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetail(reg.registration_id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-[#CC0000]/50 hover:text-[#CC0000] dark:hover:text-[#FF4444] px-3 py-1.5 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <EyeIcon />
                            Detail
                          </button>
                          {reg.status === 'pending_approval' && (
                            <button
                              id={`btn-batal-${reg.registration_id}`}
                              onClick={() => { setCancelError(''); setCancelConfirm({ id: reg.registration_id }); }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-900/40 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
                              title="Batalkan Pengajuan"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                              Batalkan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 flex items-center justify-between gap-3 bg-[#f4f4f6] dark:bg-gray-800 border-t-2 border-[#e5e7eb] dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {listTotal === 0
              ? 'Tidak ada data'
              : `Menampilkan ${Math.min(listEntries, registrations.length)} dari ${listTotal} data`}
          </p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 text-xs text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-30 transition-colors" disabled>
              Sebelumnya
            </button>
            <button className="px-3 py-1 text-xs font-bold bg-[#CC0000] text-white rounded-lg">
              1
            </button>
            <button className="px-3 py-1 text-xs text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-30 transition-colors" disabled>
              Selanjutnya
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

