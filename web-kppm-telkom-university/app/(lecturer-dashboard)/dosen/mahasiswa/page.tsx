'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getLecturerStudents, LecturerStudentEntry, updateLecturerRegistrationStatus } from '@/lib/api';

// â”€â”€â”€ Entries Dropdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function EntriesDropdown({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Tutup saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="
          inline-flex items-center gap-2 px-3 py-2 rounded-xl
          border border-gray-200 dark:border-slate-700
          bg-white dark:bg-slate-900
          text-xs font-medium text-gray-600 dark:text-slate-300
          hover:border-gray-300 dark:hover:border-slate-600
          hover:bg-gray-50 dark:hover:bg-slate-800
          transition-all duration-150 select-none
          shadow-sm whitespace-nowrap
        "
      >
        <span className="text-gray-400 dark:text-slate-500 font-normal">Tampilkan</span>
        <span className="font-bold text-gray-700 dark:text-slate-200 min-w-[1.5rem] text-center">{value}</span>
        <span className="text-gray-400 dark:text-slate-500 font-normal">data</span>
        {/* Chevron */}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
          }}
          className="text-gray-400 dark:text-slate-500 ml-0.5"
        >
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      <div
        style={{
          opacity:    open ? 1 : 0,
          transform:  open ? 'translateY(0)' : 'translateY(-6px)',
          visibility: open ? 'visible' : 'hidden',
          transition: 'opacity 180ms ease, transform 180ms ease, visibility 0s linear ' + (open ? '0s' : '180ms'),
        }}
        className="
          absolute right-0 z-20 mt-1.5
          bg-white dark:bg-slate-900
          border border-gray-200 dark:border-slate-700
          rounded-xl shadow-lg overflow-hidden
          min-w-[100px]
        "
      >
        {[10, 25, 50, 100].map((n) => (
          <button
            key={n}
            onClick={() => { onChange(n); setOpen(false); }}
            className={`
              w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors
              ${
                value === n
                  ? 'bg-[#CC0000]/8 text-[#CC0000] dark:bg-red-950/40 dark:text-red-400'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }
            `}
          >
            <span>{n} data</span>
            {value === n && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// â”€â”€â”€ Status Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusBadge({ status }: { status: LecturerStudentEntry['status'] }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Belum Mengajukan
      </span>
    );
  }

  const map: Record<
    NonNullable<LecturerStudentEntry['status']>,
    { label: string; bg: string; text: string; dot: string }
  > = {
    pending_approval: {
      label: 'Menunggu',
      bg:   'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-400',
      dot:  'bg-amber-500',
    },
    approved: {
      label: 'Disetujui',
      bg:   'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-400',
      dot:  'bg-emerald-500',
    },
    cancelled: {
      label: 'Dibatalkan',
      bg:   'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-500 dark:text-gray-400',
      dot:  'bg-gray-400',
    },
    rejected: {
      label: 'Ditolak',
      bg:   'bg-red-50 dark:bg-red-950/40',
      text: 'text-red-600 dark:text-red-400',
      dot:  'bg-red-500',
    },
  };
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// â”€â”€â”€ Format tanggal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function fmt(dateStr: string | null) {
  if (!dateStr) return 'â€”';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// â”€â”€â”€ Skeleton row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-gray-100 dark:border-gray-800">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

// â”€â”€â”€ Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DetailModal({
  entry,
  onClose,
}: {
  entry: LecturerStudentEntry;
  onClose: () => void;
}) {
  const [showDoc, setShowDoc] = useState(false);
  const [fileError, setFileError] = useState(false);
  const gw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const fileUrl = entry.toss_cover_letter_file ? `${gw}${entry.toss_cover_letter_file}` : null;
  const isPdf = fileUrl?.toLowerCase().endsWith('.pdf');

  // Reset error saat modal dibuka ulang
  const handleOpenDoc = () => { setFileError(false); setShowDoc(true); };

  return (
    <>
      {/* â”€â”€ TOSS Document Overlay â”€â”€ */}
      {showDoc && fileUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setShowDoc(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ width: '90vw', maxWidth: 900, height: '88vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Viewer Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
                </svg>
                <span className="text-sm font-semibold text-gray-800">Surat Pengajuan TOSS</span>
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
                  onClick={() => setShowDoc(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
            {/* Viewer Content */}
            <div className="flex-1 overflow-hidden bg-gray-100 relative">
              {fileError ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-400">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
                    <line x1="10" y1="13" x2="14" y2="17"/><line x1="14" y1="13" x2="10" y2="17"/>
                  </svg>
                  <p className="text-sm font-medium text-gray-400">File tidak ditemukan</p>
                  <p className="text-xs text-gray-300">Dokumen mungkin sudah dihapus atau tidak tersedia</p>
                </div>
              ) : isPdf ? (
                <iframe
                  src={fileUrl!}
                  className="w-full h-full border-0"
                  title="Surat TOSS"
                  onLoad={(e) => {
                    // Jika iframe load JSON error, content-type bukan PDF
                    try {
                      const doc = (e.target as HTMLIFrameElement).contentDocument;
                      const body = doc?.body?.innerText?.trim();
                      if (body && (body.startsWith('{') || body.startsWith('Route'))) {
                        setFileError(true);
                      }
                    } catch { /* cross-origin, aman */ }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={fileUrl!}
                    alt="Surat TOSS"
                    className="max-w-full max-h-full object-contain rounded-lg shadow"
                    onError={() => setFileError(true)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Detail Full Page â”€â”€ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 max-w-4xl mx-auto space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <StatusBadge status={entry.status} />
                <span className="text-xs text-gray-400">Dikirim: {fmt(entry.submitted_at)}</span>
              </div>

              {/* Mahasiswa */}
              <Section title="Data Mahasiswa">
                <Row label="NIM" value={entry.nim} />
                <Row label="Nama" value={entry.student_name} />
                <Row label="Kelas" value={entry.student_class} />
                <Row label="Email" value={entry.student_email} />
                <Row label="WhatsApp" value={entry.whatsapp_number} />
              </Section>

              {/* Pengajuan */}
              <Section title="Data Magang">
                <Row label="Semester" value={entry.semester_code} />
                <Row label="Perusahaan" value={entry.company_name} />
                <Row label="Posisi" value={entry.internship_position} />
                <Row label="Tanggal Mulai" value={fmt(entry.internship_start)} />
                <Row label="Tanggal Selesai" value={fmt(entry.internship_end)} />
              </Section>

              {/* Pembimbing Lapangan */}
              <Section title="Pembimbing Lapangan">
                <Row label="Nama" value={entry.mentor_name} />
                <Row label="Jabatan" value={entry.mentor_position} />
                <Row label="Email" value={entry.mentor_email} />
                <Row label="Telepon" value={entry.mentor_phone} />
              </Section>

              {/* Dokumen TOSS */}
              <Section title="Dokumen TOSS">
                {fileUrl ? (
                  <div className="px-4 py-3">
                    <button
                      onClick={handleOpenDoc}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 hover:border-[#CC0000]/50 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 group-hover:text-[#CC0000] transition-colors">
                          Surat Pengajuan TOSS
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                          Klik untuk melihat dokumen
                        </p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-[#CC0000] transition-colors">
                        <polyline points="9,18 15,12 9,6"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-3 text-xs text-gray-400 dark:text-slate-500 italic">
                    Dokumen tidak tersedia
                  </div>
                )}
              </Section>

              {/* Timeline */}
              {(entry.approved_at || entry.cancelled_at || entry.rejected_at) && (
                <Section title="Timeline">
                  {entry.approved_at && <Row label="Disetujui" value={fmt(entry.approved_at)} />}
                  {entry.cancelled_at && <Row label="Dibatalkan" value={fmt(entry.cancelled_at)} />}
                  {entry.rejected_at && <Row label="Ditolak" value={fmt(entry.rejected_at)} />}
                </Section>
              )}
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">
        {title}
      </p>
      <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl divide-y divide-gray-100 dark:divide-slate-700/50">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between px-4 py-2.5 gap-4">
      <span className="text-xs text-gray-400 dark:text-slate-400 flex-shrink-0 w-24 sm:w-32">{label}</span>
      <span className="flex-1 min-w-0 text-xs font-medium text-gray-800 dark:text-slate-200 text-right break-all sm:break-words">
        {value || '—'}
      </span>
    </div>
  );
}

// â”€â”€â”€ Confirm Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type ConfirmAction = { registrationId: number; action: 'approved' | 'rejected'; studentName: string };

function ConfirmModal({
  confirm,
  loading,
  error,
  onConfirm,
  onCancel,
}: {
  confirm: ConfirmAction;
  loading: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isApprove = confirm.action === 'approved';
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex items-center justify-center pt-7 pb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isApprove ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-50 dark:bg-red-950/40'
          }`}>
            {isApprove ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </div>
        </div>

        {/* Text */}
        <div className="px-6 pb-5 text-center">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            {isApprove ? 'Setujui Pengajuan?' : 'Tolak Pengajuan?'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {isApprove
              ? <><span>Anda akan menyetujui pengajuan KPPM dari </span><span className="font-semibold text-gray-700 dark:text-slate-200">{confirm.studentName}</span><span>. Tindakan ini tidak dapat dibatalkan.</span></>
              : <><span>Anda akan menolak pengajuan KPPM dari </span><span className="font-semibold text-gray-700 dark:text-slate-200">{confirm.studentName}</span><span>. Tindakan ini tidak dapat dibatalkan.</span></>
            }
          </p>
          {error && (
            <p className="mt-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
              isApprove ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-[#CC0000] hover:bg-red-700'
            }`}
          >
            {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Memproses...' : isApprove ? 'Ya, Setujui' : 'Ya, Tolak'}
          </button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Filter Chip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type FilterStatus = 'all' | LecturerStudentEntry['status'];

function FilterChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
        active
          ? 'bg-[#CC0000] text-white shadow-sm'
          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
      }`}
    >
      {label}
      <span
        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
          active ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function DosenMahasiswaPage() {
  const [students, setStudents] = useState<LecturerStudentEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<LecturerStudentEntry | null>(null);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [page, setPage]         = useState(1);
  // State konfirmasi approve/reject
  const [confirm, setConfirm]         = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLecturerStudents(100, 0);
      if (res.success) {
        setStudents(res.data ?? []);
      } else {
        setError(res.message || 'Gagal memuat data.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server. Pastikan service berjalan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Handler approve / reject
  const handleStatusChange = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    setConfirmError(null);
    try {
      const res = await updateLecturerRegistrationStatus(confirm.registrationId, confirm.action);
      if (res.success) {
        setConfirm(null);
        await fetchData(); // refresh tabel
      } else {
        setConfirmError(res.message || 'Gagal mengubah status.');
      }
    } catch {
      setConfirmError('Tidak dapat terhubung ke server.');
    } finally {
      setConfirmLoading(false);
    }
  };

  // Filter & Search
  const filtered = students.filter((s) => {
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.student_name.toLowerCase().includes(q) ||
      s.nim.toLowerCase().includes(q) ||
      (s.company_name?.toLowerCase() || '').includes(q) ||
      (s.student_email?.toLowerCase() || '').includes(q);
    return matchStatus && matchSearch;
  });

  // Reset ke halaman 1 saat filter / search berubah
  useEffect(() => { setPage(1); }, [filterStatus, search, entriesPerPage]);

  // Paginasi client-side
  const totalFiltered = filtered.length;
  const totalPages    = Math.max(1, Math.ceil(totalFiltered / entriesPerPage));
  const safePage      = Math.min(page, totalPages);
  const startIdx      = (safePage - 1) * entriesPerPage;
  const paginated     = filtered.slice(startIdx, startIdx + entriesPerPage);

  const counts = {
    all:              students.length,
    pending_approval: students.filter((s) => s.status === 'pending_approval').length,
    approved:         students.filter((s) => s.status === 'approved').length,
    cancelled:        students.filter((s) => s.status === 'cancelled').length,
    rejected:         students.filter((s) => s.status === 'rejected').length,
  };

  return (
    <>
      {selected && (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5">
          <nav className="flex text-sm font-medium mb-3" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-2">
              <li><span className="text-gray-500 dark:text-slate-400">Dosen PA</span></li>
              <li><span className="text-gray-400 dark:text-slate-500 mx-1">/</span></li>
              <li><span className="text-gray-500 dark:text-slate-400 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => setSelected(null)}>Data Mahasiswa</span></li>
              <li><span className="text-gray-400 dark:text-slate-500 mx-1">/</span></li>
              <li><span className="text-gray-900 dark:text-slate-100 font-semibold">Detail Pengajuan</span></li>
            </ol>
          </nav>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Kembali
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Detail Pengajuan KPPM</h1>
                <p className="text-gray-500 text-sm mt-0.5">ID Pengajuan: #{selected.registration_id || '-'}</p>
              </div>
            </div>
          </div>
          <DetailModal entry={selected} onClose={() => setSelected(null)} />
        </div>
      )}

      <div className={selected ? 'hidden' : 'p-5 md:p-8 max-w-6xl mx-auto space-y-6'}>



        {/* â”€â”€ Header â”€â”€ */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <div>
            <nav className="flex text-sm font-medium mb-3" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-2">
                <li>
                  <span className="text-gray-500 dark:text-slate-400">Dosen PA</span>
                </li>
                <li>
                  <span className="text-gray-400 dark:text-slate-500 mx-1">/</span>
                </li>
                <li>
                  <span className="text-gray-900 dark:text-slate-100 font-semibold">Data Mahasiswa</span>
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">
              Data Mahasiswa Bimbingan
            </h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
              Daftar mahasiswa KPPM yang mengajukan ke Anda
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
              className={loading ? 'animate-spin' : ''}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Muat Ulang
          </button>
        </div>


        {/* ─── Filters & Search ─── */}
        <div className="flex flex-col xl:flex-row gap-3 mb-4">
          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {(
              [
                { key: 'all',              label: 'Semua' },
                { key: 'pending_approval', label: 'Menunggu' },
                { key: 'approved',         label: 'Disetujui' },
                { key: 'cancelled',        label: 'Dibatalkan' },
                { key: 'rejected',         label: 'Ditolak' },
              ] as { key: FilterStatus; label: string }[]
            ).map((f) => (
              <FilterChip
                key={f.key || 'null'}
                label={f.label}
                active={filterStatus === f.key}
                count={counts[f.key as keyof typeof counts]}
                onClick={() => setFilterStatus(f.key)}
              />
            ))}
          </div>

          {/* Search + Tampilkan */}
          <div className="flex items-center gap-2 xl:ml-auto">
            {/* Custom entries dropdown */}
            <EntriesDropdown
              value={entriesPerPage}
              onChange={setEntriesPerPage}
            />

            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-slate-500"
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Cari nama, NIM, atau perusahaan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-700 dark:text-slate-200 placeholder-gray-300 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 w-full sm:w-56 transition"
              />
            </div>
          </div>
        </div>

        {/* â”€â”€ Table â”€â”€ */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm overflow-hidden">

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center py-14 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{error}</p>
              <button
                onClick={fetchData}
                className="mt-1 px-4 py-2 rounded-lg bg-[#CC0000] text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Empty â€” no data at all */}
          {!error && !loading && students.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <p className="font-semibold text-gray-700 dark:text-slate-200">Belum ada mahasiswa bimbingan</p>
              <p className="text-sm text-gray-400 dark:text-slate-500 text-center max-w-xs">
                Mahasiswa yang mengajukan KPPM ke Anda akan muncul di sini.
              </p>
            </div>
          )}

          {/* Empty â€” filtered but no match */}
          {!error && !loading && students.length > 0 && filtered.length === 0 && (
            <div className="flex flex-col items-center py-12 gap-2">
              <p className="text-sm font-medium text-gray-600 dark:text-slate-300">Tidak ada data yang cocok</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">Coba ubah filter atau kata kunci pencarian.</p>
            </div>
          )}

          {/* Table (desktop) / Card list (mobile) */}
          {(loading || filtered.length > 0) && (
            <>
              {/* â”€â”€ Mobile Card List â”€â”€ */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-800">
                {loading
                  ? [...Array(4)].map((_, i) => (
                      <div key={i} className="px-4 py-3.5 animate-pulse flex gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 flex-shrink-0" />
                        <div className="flex-1 space-y-2"><div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-3/4" /><div className="h-2.5 bg-gray-50 dark:bg-slate-800/50 rounded w-1/2" /></div>
                      </div>
                    ))
                  : paginated.map((s) => (
                      <div key={s.nim} className="px-4 py-3.5">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm break-words leading-snug">{s.student_name}</p>
                              <StatusBadge status={s.status} />
                            </div>
                            <p className="text-[11px] font-mono text-gray-400 dark:text-slate-500">{s.nim} &middot; {s.student_class}</p>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 break-words">{s.registration_id ? (s.company_name || '-') : '-'}</p>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{s.registration_id ? `${fmt(s.internship_start)} \u2192 ${fmt(s.internship_end)}` : '-'}</p>
                            {s.registration_id && (
                              <div className="flex gap-2 mt-2.5">
                                {s.status === 'pending_approval' && (
                                  <>
                                    <button
                                      onClick={() => setConfirm({ registrationId: s.registration_id!, action: 'approved', studentName: s.student_name })}
                                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-bold rounded-lg border-2 border-emerald-500 bg-emerald-500/90 text-white hover:bg-emerald-600 transition-all"
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
                                      Setuju
                                    </button>
                                    <button
                                      onClick={() => setConfirm({ registrationId: s.registration_id!, action: 'rejected', studentName: s.student_name })}
                                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-bold rounded-lg border-2 border-red-400/70 bg-red-50/80 text-red-500 hover:bg-red-100 transition-all"
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                      Tolak
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => setSelected(s)}
                                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-bold rounded-lg border-2 border-emerald-400/60 bg-emerald-50/60 text-emerald-600 hover:bg-emerald-100/80 transition-all"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" /></svg>
                                  Detail
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
              </div>

              {/* â”€â”€ Desktop Table â”€â”€ */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f4f4f6] dark:bg-slate-700/50 border-b-2 border-[#e5e7eb] dark:border-slate-600">
                      {['NIM', 'Nama Mahasiswa', 'Kelas', 'Perusahaan', 'Periode', 'Status', 'Aksi'].map((h) => (
                        <th key={h} className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap border-r border-[#e5e7eb] dark:border-slate-600 last:border-r-0">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                      : paginated.map((s, idx) => (
                          <tr key={s.nim} className={`transition-colors hover:bg-red-50/30 dark:hover:bg-red-900/10 border-b border-[#f0f0f0] dark:border-slate-700 group ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-[#fafafa] dark:bg-slate-800/60'}`}>
                            <td className="px-4 py-4 border-r border-[#f0f0f0] dark:border-slate-700 whitespace-nowrap">
                              <span className="font-mono text-xs font-semibold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">{s.nim}</span>
                            </td>
                            <td className="px-4 py-4 border-r border-[#f0f0f0] dark:border-slate-700">
                              <p className="font-semibold text-gray-800 dark:text-slate-100 whitespace-nowrap">{s.student_name}</p>
                            </td>
                            <td className="px-4 py-4 border-r border-[#f0f0f0] dark:border-slate-700 text-gray-600 dark:text-slate-300 whitespace-nowrap">{s.student_class}</td>
                            <td className="px-4 py-4 border-r border-[#f0f0f0] dark:border-slate-700">
                              {s.registration_id ? (
                                <>
                                  <p className="text-gray-800 dark:text-slate-200 font-medium whitespace-nowrap max-w-[160px] truncate">{s.company_name || '-'}</p>
                                </>
                              ) : (
                                <p className="text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">-</p>
                              )}
                            </td>
                            <td className="px-4 py-4 border-r border-[#f0f0f0] dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                              {s.registration_id ? (
                                <>
                                  <span>{fmt(s.internship_start)}</span>
                                  <span className="mx-1 text-gray-300 dark:text-slate-600">&rarr;</span>
                                  <span>{fmt(s.internship_end)}</span>
                                </>
                              ) : (
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-4 border-r border-[#f0f0f0] dark:border-slate-700"><StatusBadge status={s.status} /></td>
                            <td className="px-4 py-3.5">
                              {s.registration_id && (
                                <div className="flex items-center gap-1.5">
                                  {s.status === 'pending_approval' && (
                                    <>
                                      <button title="Setujui Pengajuan" onClick={() => setConfirm({ registrationId: s.registration_id!, action: 'approved', studentName: s.student_name })} className="inline-flex items-center justify-center w-9 h-9 rounded-lg border-2 border-emerald-500 dark:border-emerald-400 bg-emerald-500/90 dark:bg-emerald-500/80 text-white hover:bg-emerald-600 hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-150 shadow-sm">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
                                      </button>
                                      <button title="Tolak Pengajuan" onClick={() => setConfirm({ registrationId: s.registration_id!, action: 'rejected', studentName: s.student_name })} className="inline-flex items-center justify-center w-9 h-9 rounded-lg border-2 border-red-400/70 dark:border-red-500/60 bg-red-50/80 dark:bg-red-950/40 text-red-500 dark:text-red-400 hover:bg-red-100/90 hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-150 shadow-sm">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                      </button>
                                    </>
                                  )}
                                  <button onClick={() => setSelected(s)} title="Lihat Detail" className="inline-flex items-center justify-center w-9 h-9 rounded-lg border-2 border-emerald-400/60 dark:border-emerald-500/50 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/80 hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-150 shadow-sm">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" /></svg>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </>
          )}


          {/* Footer â€” info + pagination */}
          {!loading && totalFiltered > 0 && (
            <div className="px-4 py-3 border-t-2 border-[#e5e7eb] dark:border-slate-700 bg-[#f4f4f6] dark:bg-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Info teks */}
              <p className="text-xs text-gray-400 dark:text-slate-500">
                {totalFiltered === 0
                  ? 'Tidak ada data'
                  : `Menampilkan ${startIdx + 1}-${Math.min(startIdx + entriesPerPage, totalFiltered)} dari ${totalFiltered} pengajuan`}
              </p>

              {/* Navigasi halaman */}
              <div className="flex items-center gap-1">
                {/* Tombol Sebelumnya */}
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="px-3 py-1.5 text-xs text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15,18 9,12 15,6" />
                  </svg>
                  Sebelumnya
                </button>

                {/* Nomor halaman */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                  .reduce<(number | '...')[]>((acc, n, i, arr) => {
                    if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-xs text-gray-400">â€¦</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item as number)}
                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                          safePage === item
                            ? 'bg-[#CC0000] text-white shadow-sm'
                            : 'border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                {/* Tombol Selanjutnya */}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="px-3 py-1.5 text-xs text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  Selanjutnya
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ Detail View Rendered At Top â”€â”€ */}

      {/* â”€â”€ Modal Konfirmasi Approve / Reject â”€â”€ */}
      {confirm && (
        <ConfirmModal
          confirm={confirm}
          loading={confirmLoading}
          error={confirmError}
          onConfirm={handleStatusChange}
          onCancel={() => { if (!confirmLoading) { setConfirm(null); setConfirmError(null); } }}
        />
      )}
    </>
  );
}
