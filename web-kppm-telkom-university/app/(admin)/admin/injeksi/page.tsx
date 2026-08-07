'use client';

import { useState, useRef, useCallback } from 'react';
import { injectStudents, injectLecturers, InjectResult } from '@/lib/api';
import * as XLSX from 'xlsx';

// ─── Icons ────────────────────────────────────────────────────────────────────

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16,16 12,12 8,16" /><line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
  </svg>
);
const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14,2 14,8 20,8" />
  </svg>
);
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20,6 9,17 4,12" />
  </svg>
);
const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="8,17 12,21 16,17" /><line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.11" />
  </svg>
);
const AlertTriangleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = 'mahasiswa' | 'dosen';

interface PreviewRow {
  [key: string]: string;
}

interface UploadState {
  file: File | null;
  preview: PreviewRow[];
  headers: string[];
  error: string;
}

const DEFAULT_UPLOAD: UploadState = { file: null, preview: [], headers: [], error: '' };

// ─── Template download ────────────────────────────────────────────────────────

function downloadTemplate(type: TabType) {
  const wb = XLSX.utils.book_new();
  let data: object[];
  let sheetName: string;

  if (type === 'mahasiswa') {
    sheetName = 'Data Mahasiswa';
    data = [
      { nim: '1234567890', student_name: 'Budi Santoso', class: 'IF-46-01', email: 'budi@student.telkomuniversity.ac.id' },
      { nim: '0987654321', student_name: 'Siti Rahayu', class: 'IF-46-02', email: '' },
    ];
  } else {
    sheetName = 'Data Dosen';
    data = [
      { nip: '19800101200501001', lecturer_name: 'Dr. Ahmad Fauzi', email: 'ahmad@telkomuniversity.ac.id' },
      { nip: '19750215200312002', lecturer_name: 'Prof. Dewi Lestari', email: '' },
    ];
  }

  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `template_${type}.xlsx`);
}

// ─── Parse file for local preview ─────────────────────────────────────────────

async function parseForPreview(file: File): Promise<{ headers: string[]; rows: PreviewRow[] }> {
  const buffer = await file.arrayBuffer();
  const ext = file.name.toLowerCase().split('.').pop();
  const isExcel = ext === 'xlsx' || ext === 'xls' || file.type.includes('spreadsheet');

  if (isExcel) {
    const wb = XLSX.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<PreviewRow>(ws, { defval: '' });
    const headers = json.length > 0 ? Object.keys(json[0]) : [];
    return { headers, rows: json.slice(0, 10) };
  }

  // CSV — manual parse
  const text = new TextDecoder().decode(buffer);
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1, 11).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
  });
  return { headers, rows };
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

function DropZone({
  uploadState, onChange, accept,
}: {
  uploadState: UploadState;
  onChange: (state: Partial<UploadState>) => void;
  accept: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['csv', 'xlsx', 'xls'].includes(ext ?? '')) {
      onChange({ file: null, preview: [], headers: [], error: 'Hanya file CSV atau XLSX yang diizinkan.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onChange({ file: null, preview: [], headers: [], error: 'Ukuran file tidak boleh lebih dari 5 MB.' });
      return;
    }
    try {
      const { headers, rows } = await parseForPreview(file);
      onChange({ file, headers, preview: rows, error: '' });
    } catch {
      onChange({ file, headers: [], preview: [], error: 'File tidak dapat dibaca. Pastikan formatnya benar.' });
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploadState.file && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${uploadState.file
            ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/10'
            : dragging
              ? 'border-[#CC0000] bg-red-50 dark:bg-red-900/10 scale-[1.01]'
              : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:border-[#CC0000]/50 hover:bg-red-50/50 dark:hover:bg-red-900/5 cursor-pointer'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {uploadState.file ? (
          <div className="flex items-center justify-center gap-4 bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-green-100 dark:border-green-900/30">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0 shadow-inner">
              <FileIcon />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-bold text-gray-900 dark:text-slate-100 text-sm truncate">{uploadState.file.name}</p>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 mt-0.5 uppercase tracking-wide">
                {(uploadState.file.size / 1024).toFixed(1)} KB &bull; {uploadState.preview.length} BARIS PREVIEW
              </p>
            </div>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(DEFAULT_UPLOAD); if (inputRef.current) inputRef.current.value = ''; }}
              className="ml-auto w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all duration-200"
            >
              <XIcon />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700/50 rounded-2xl flex items-center justify-center mb-4 text-gray-400 dark:text-slate-500 shadow-inner group-hover:scale-110 group-hover:text-[#CC0000] dark:group-hover:text-red-400 transition-all duration-300">
              <UploadIcon />
            </div>
            <p className="font-extrabold text-gray-800 dark:text-slate-200 text-base">Tarik & Lepas file di sini</p>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">atau klik untuk menelusuri komputer Anda</p>
            <div className="mt-5 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-slate-800 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">CSV</span>
              <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-slate-800 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">XLSX</span>
              <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-slate-800 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Maks 5 MB</span>
            </div>
          </div>
        )}
      </div>

      {uploadState.error && (
        <div className="mt-3 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
          <AlertTriangleIcon />{uploadState.error}
        </div>
      )}
    </div>
  );
}

// ─── Preview Table ────────────────────────────────────────────────────────────

function PreviewTable({ headers, rows }: { headers: string[]; rows: PreviewRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-4 bg-[#CC0000] rounded-full"></div>
        <p className="text-xs font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-widest">
          Preview File ({rows.length} Baris Pertama)
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-slate-900/50">
              {headers.map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-[11px] font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 dark:border-slate-800">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900">
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 dark:border-slate-800/60 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                {headers.map(h => (
                  <td key={h} className="px-5 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap text-xs font-medium">
                    {row[h] || <span className="text-gray-300 dark:text-slate-600 italic">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({ result }: { result: InjectResult }) {
  return (
    <div className="mt-6 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-md bg-white dark:bg-slate-900">
      <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-slate-800">
        <div className="p-5 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-green-50/50 to-transparent dark:from-green-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="relative text-3xl font-extrabold text-green-600 dark:text-green-400">{result.inserted}</p>
          <p className="relative text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1.5">Ditambahkan</p>
        </div>
        <div className="p-5 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="relative text-3xl font-extrabold text-amber-600 dark:text-amber-400">{result.skipped}</p>
          <p className="relative text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1.5">Dilewati</p>
        </div>
        <div className="p-5 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-red-50/50 to-transparent dark:from-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="relative text-3xl font-extrabold text-red-600 dark:text-red-400">{result.errors.length}</p>
          <p className="relative text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1.5">Error</p>
        </div>
      </div>
      {result.errors.length > 0 && (
        <div className="border-t border-gray-100 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
          <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
            <AlertTriangleIcon />Detail Error
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {result.errors.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-slate-400">
                <span className="font-mono text-gray-400 dark:text-slate-500 flex-shrink-0">Baris {e.row}</span>
                <span className="text-red-500 dark:text-red-400">→</span>
                <span>{e.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab Panel ────────────────────────────────────────────────────────────────

function TabPanel({
  type, columns, uploadFn,
}: {
  type: TabType;
  columns: { key: string; label: string; required: boolean; desc: string }[];
  uploadFn: (file: File) => Promise<{ success: boolean; message?: string; data?: InjectResult }>;
}) {
  const [uploadState, setUploadState] = useState<UploadState>(DEFAULT_UPLOAD);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InjectResult | null>(null);
  const [serverMsg, setServerMsg] = useState('');

  const handleChange = useCallback((patch: Partial<UploadState>) => {
    setUploadState(s => ({ ...s, ...patch }));
    setResult(null);
    setServerMsg('');
  }, []);

  const handleInject = async () => {
    if (!uploadState.file) return;
    setLoading(true);
    setResult(null);
    setServerMsg('');
    try {
      const res = await uploadFn(uploadState.file);
      if (res.success && res.data) {
        setResult(res.data);
        setServerMsg(res.message || 'Selesai.');
      } else {
        setServerMsg(res.message || 'Terjadi kesalahan server.');
      }
    } catch {
      setServerMsg('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Format panduan */}
      <div className="bg-gradient-to-br from-[#CC0000]/5 to-transparent dark:from-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-[#CC0000] dark:text-red-400 flex-shrink-0">
              <InfoIcon />
            </div>
            <p className="text-base font-extrabold text-gray-900 dark:text-slate-100">Struktur Kolom Data</p>
          </div>
          <button
            onClick={() => downloadTemplate(type)}
            className="flex items-center gap-2 text-xs font-bold text-[#CC0000] dark:text-red-400 hover:text-white bg-white hover:bg-[#CC0000] dark:bg-slate-800 dark:hover:bg-red-500 border border-red-200 dark:border-red-800/50 px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <DownloadIcon />
            Download Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {columns.map(col => (
            <div key={col.key} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 flex items-start gap-3 shadow-sm hover:border-red-200 dark:hover:border-red-800/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-extrabold text-gray-900 dark:text-slate-100 text-sm">{col.key}</p>
                  {col.required ? (
                    <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-[9px] font-extrabold text-[#CC0000] dark:text-red-400 uppercase tracking-widest">Wajib</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-[9px] font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Opsional</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed">{col.desc}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex items-center gap-2">
          <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 italic">
            * Header kolom bersifat fleksibel — &quot;Nama&quot;, &quot;Nama Mahasiswa&quot;, &quot;Nama Lengkap&quot; semuanya dapat diterima.
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-4 bg-[#CC0000] rounded-full"></div>
          <p className="text-xs font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-widest">Upload File</p>
        </div>
        <DropZone
          uploadState={uploadState}
          onChange={handleChange}
          accept=".csv,.xlsx,.xls"
        />
      </div>

      {/* Preview */}
      {uploadState.preview.length > 0 && (
        <PreviewTable headers={uploadState.headers} rows={uploadState.preview} />
      )}

      {/* Server message */}
      {serverMsg && !result && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertTriangleIcon />{serverMsg}
        </div>
      )}

      {/* Result */}
      {result && (
        <>
          <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${result.errors.length === 0 && result.inserted > 0
              ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            }`}>
            {result.errors.length === 0 ? <CheckIcon /> : <AlertTriangleIcon />}
            {serverMsg}
          </div>
          <ResultCard result={result} />
        </>
      )}

      {/* Submit button */}
      {uploadState.file && !uploadState.error && (
        <button
          onClick={handleInject}
          disabled={loading}
          className="w-full bg-[#CC0000] hover:bg-[#A30000] disabled:bg-[#CC0000]/50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 text-sm tracking-wide flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Memproses...
            </>
          ) : (
            <>
              <UploadIcon />
              Injeksi Data {type === 'mahasiswa' ? 'Mahasiswa' : 'Dosen'}
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const STUDENT_COLUMNS = [
  { key: 'nim', label: 'NIM', required: true, desc: 'Nomor Induk Mahasiswa — dijadikan password default' },
  { key: 'student_name', label: 'Nama', required: true, desc: 'Nama lengkap mahasiswa' },
  { key: 'class', label: 'Kelas', required: true, desc: 'Kode kelas, misal: IF-46-01' },
  { key: 'email', label: 'Email', required: false, desc: 'Email mahasiswa (opsional)' },
];

const LECTURER_COLUMNS = [
  { key: 'nip', label: 'NIP', required: true, desc: 'Nomor Induk Pegawai — dijadikan password default' },
  { key: 'lecturer_name', label: 'Nama', required: true, desc: 'Nama lengkap dosen' },
  { key: 'email', label: 'Email', required: false, desc: 'Email dosen (opsional)' },
];

export default function InjeksiPage() {
  const [activeTab, setActiveTab] = useState<TabType>('mahasiswa');

  const tabs: { key: TabType; label: string }[] = [
    { key: 'mahasiswa', label: 'Injeksi Mahasiswa' },
    { key: 'dosen', label: 'Injeksi Dosen' },
  ];

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-8">

      {/* ── Hero Header ── */}
      <div className="relative bg-gradient-to-br from-[#CC0000] via-[#B00000] to-[#7A0000] rounded-3xl p-6 md:p-8 text-white overflow-hidden shadow-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute top-8 -right-4 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 right-16 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-white/10" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Injeksi Data Massal
            </h1>
            <p className="text-red-100/90 text-sm mt-2 max-w-2xl leading-relaxed">
              Import data mahasiswa atau dosen secara kolektif menggunakan file spreadsheet CSV atau XLSX. Sistem otomatis memproses baris demi baris, dan melewati data yang sudah terdaftar tanpa menimpanya.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Card ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Modern Tab Header */}
        <div className="flex p-2 bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800">
          {tabs.map(tab => (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-extrabold transition-all duration-300 rounded-xl ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-slate-800 text-[#CC0000] dark:text-red-400 shadow-sm border border-gray-100 dark:border-slate-700'
                  : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100/50 dark:hover:bg-slate-800/30'
              }`}
            >
              {tab.key === 'mahasiswa' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-8">
          {activeTab === 'mahasiswa' && (
            <TabPanel
              key="mahasiswa"
              type="mahasiswa"
              columns={STUDENT_COLUMNS}
              uploadFn={injectStudents}
            />
          )}
          {activeTab === 'dosen' && (
            <TabPanel
              key="dosen"
              type="dosen"
              columns={LECTURER_COLUMNS}
              uploadFn={injectLecturers}
            />
          )}
        </div>
      </div>

      {/* ── Info Footer ── */}
      <div className="bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/10 dark:to-slate-900 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
          <AlertTriangleIcon />
        </div>
        <div className="text-sm text-gray-700 dark:text-slate-300">
          <p className="font-extrabold text-amber-800 dark:text-amber-400 mb-1.5 text-base">Catatan Penting Injeksi</p>
          <ul className="space-y-1.5 font-medium">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-1">&bull;</span>
              <span>Password default mahasiswa adalah <strong>NIM</strong> masing-masing. Password default dosen adalah <strong>NIP</strong> masing-masing.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-1">&bull;</span>
              <span>Data yang NIM/NIP-nya sudah terdaftar di database akan <strong>dilewati secara aman</strong> (tidak ditimpa), dan akan dihitung pada metrik &quot;Dilewati&quot;.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-1">&bull;</span>
              <span>Pengguna sangat dianjurkan untuk segera mengganti password setelah berhasil melakukan login pertama kali.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
