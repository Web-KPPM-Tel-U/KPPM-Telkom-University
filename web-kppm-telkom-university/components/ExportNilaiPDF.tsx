'use client';

/**
 * ExportNilaiPDF — Komponen untuk export Form Penilaian KPPM ke PDF A4
 * Menggunakan window.print() dengan CSS @media print untuk format A4
 * mode: 'pa' → hanya form Pembimbing Akademik
 *       'mentor' → hanya form Pembimbing Lapang
 *       'both' → dua form sekaligus (default)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PAGradeScores {
  commitment: number;
  planning: number;
  guidance: number;
  presentation: number;
  report: number;
  identification: number;
  total: number;
}

export interface MentorGradeScores {
  attendance: number;
  discipline: number;
  commitment: number;
  planning: number;
  teamwork: number;
  guidance: number;
  report: number;
  problem_solving: number;
  total: number;
}

export interface ExportNilaiPDFProps {
  /** Data mahasiswa */
  studentName: string;
  nim: string;
  /** Nama perusahaan / lokasi KPPM */
  companyName: string;
  internshipPosition: string;
  /** Semester KP */
  semesterCode: string;
  internshipStart: string;
  internshipEnd: string;
  /** Data dosen pembimbing */
  lecturerName: string;
  lecturerNip: string;
  /** Data pembimbing lapang */
  mentorName: string;
  mentorNip: string;
  mentorPosition: string;
  /** Nilai PA (bisa null jika belum diinput) */
  paGrades: PAGradeScores | null;
  /** Nilai Mentor (bisa null jika belum diinput) */
  mentorGrades: MentorGradeScores | null;
  /**
   * Mode export:
   * 'pa'     → hanya Form Pembimbing Akademik
   * 'mentor' → hanya Form Pembimbing Lapang
   * 'both'   → kedua form (default)
   */
  mode?: 'pa' | 'mentor' | 'both';
  /** Label teks pada tombol (override default) */
  label?: string;
  /** Trigger element style */
  className?: string;
}

// ─── Indikator PA ─────────────────────────────────────────────────────────────

const PA_INDICATORS: { field: keyof Omit<PAGradeScores, 'total'>; label: string; bobot: number }[] = [
  { field: 'commitment',     label: 'Komitmen terhadap tugas / pekerjaan',                                                          bobot: 10 },
  { field: 'planning',       label: 'Mahasiswa mampu merencanakan penyelesaian tugas atau pekerjaan, bekerja efektif dan mandiri selama KP', bobot: 5  },
  { field: 'guidance',       label: 'Frekuensi bimbingan dengan pembimbing akademik',                                               bobot: 5  },
  { field: 'presentation',   label: 'Kualitas Presentasi',                                                                          bobot: 15 },
  { field: 'report',         label: 'Kualitas Laporan KP',                                                                          bobot: 10 },
  { field: 'identification', label: 'Identifikasi dan Formulasi Masalah',                                                           bobot: 10 },
];

// ─── Indikator Mentor ─────────────────────────────────────────────────────────

const MENTOR_INDICATORS: { field: keyof Omit<MentorGradeScores, 'total'>; label: string; bobot: number }[] = [
  { field: 'attendance',      label: 'Kehadiran tepat waktu',                                                                        bobot: 5  },
  { field: 'discipline',      label: 'Kedisiplinan (kesesuaian dengan aturan)',                                                      bobot: 5  },
  { field: 'commitment',      label: 'Komitmen terhadap tugas / pekerjaan',                                                          bobot: 5  },
  { field: 'planning',        label: 'Mahasiswa mampu merencanakan penyelesaian tugas atau pekerjaan, bekerja efektif dan mandiri selama KP', bobot: 5  },
  { field: 'teamwork',        label: 'Mahasiswa mampu bekerja sama dalam tim organisasi/ perusahaan selama KP',                      bobot: 10 },
  { field: 'guidance',        label: 'Frekuensi bimbingan dengan pembimbing lapang',                                                 bobot: 5  },
  { field: 'report',          label: 'Kualitas laporan',                                                                             bobot: 5  },
  { field: 'problem_solving', label: 'Identifikasi dan Formulasi Masalah',                                                           bobot: 5  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPeriode(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${fmt(start)} s.d. ${fmt(end)}`;
}

function todayFormatted(): string {
  return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── CSS for Print ─────────────────────────────────────────────────────────────

const PRINT_STYLES = `
  @page {
    size: A4 portrait;
    margin: 0;
  }
  html, body {
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    padding: 18mm;
    box-sizing: border-box;
  }
  .print-page {
    width: 100%;
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    color: #000;
  }
  .print-page-break {
    page-break-after: always;
    break-after: page;
  }
  .print-title {
    text-align: center;
    font-weight: bold;
    font-size: 13pt;
    line-height: 1.5;
    margin-bottom: 18pt;
  }
  .print-info-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14pt;
    font-size: 11pt;
  }
  .print-info-table td {
    padding: 3pt 4pt;
    vertical-align: top;
  }
  .print-info-table td:first-child {
    width: 130pt;
    white-space: nowrap;
  }
  .print-info-table td:nth-child(2) {
    width: 14pt;
    text-align: center;
  }
  .grade-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5pt;
    margin-bottom: 8pt;
  }
  .grade-table th, .grade-table td {
    border: 1px solid #000;
    padding: 5pt 6pt;
    vertical-align: middle;
  }
  .grade-table th {
    background-color: #f0f0f0;
    font-weight: bold;
    text-align: center;
  }
  .grade-table .no-col { width: 28pt; text-align: center; }
  .grade-table .bobot-col { width: 48pt; text-align: center; }
  .grade-table .nilai-col { width: 52pt; text-align: center; }
  .grade-table .nilai-x-bobot-col { width: 64pt; text-align: center; }
  .grade-table .label-col { text-align: left; }
  .grade-table .total-row td {
    font-weight: bold;
    background-color: #f7f7f7;
  }
  .footer-note {
    font-size: 9pt;
    margin-top: 6pt;
    font-style: italic;
  }
  .signature-section {
    margin-top: 28pt;
    display: flex;
    justify-content: flex-end;
  }
  .signature-box {
    text-align: center;
    width: 200pt;
  }
  .signature-place-date {
    margin-bottom: 4pt;
    font-size: 11pt;
  }
  .signature-title {
    margin-bottom: 48pt;
    font-size: 11pt;
  }
  .signature-name {
    font-size: 11pt;
    border-bottom: 1px solid #000;
    padding-bottom: 2pt;
    display: inline-block;
    min-width: 160pt;
  }
  .signature-nip {
    font-size: 11pt;
    margin-top: 4pt;
  }
`;

// ─── Form PA HTML ─────────────────────────────────────────────────────────────

function buildPAFormHTML(props: ExportNilaiPDFProps, pageBreak = false): string {
  const { studentName, nim, companyName, semesterCode, internshipStart, internshipEnd, lecturerName, lecturerNip, paGrades } = props;
  const today = todayFormatted();
  const periode = fmtPeriode(internshipStart, internshipEnd);

  const rows = PA_INDICATORS.map((ind, i) => {
    const nilai = paGrades ? paGrades[ind.field] : '';
    const nilaiXBobot = paGrades ? ((ind.bobot / 100) * paGrades[ind.field]).toFixed(2) : '';
    return `
      <tr>
        <td class="no-col">${i + 1}</td>
        <td class="label-col">${ind.label}</td>
        <td class="bobot-col">${ind.bobot}%</td>
        <td class="nilai-col">${nilai}</td>
        <td class="nilai-x-bobot-col">${nilaiXBobot}</td>
      </tr>
    `;
  }).join('');

  const totalNilai = paGrades ? paGrades.total.toFixed(2) : '';

  return `
    <div class="print-page${pageBreak ? ' print-page-break' : ''}">
      <div class="print-title">
        Form Penilaian Pembimbing Akademik KPPM<br>
        Direktorat Kampus Jakarta Universitas Telkom
      </div>

      <table class="print-info-table">
        <tr>
          <td>Nama / NIM</td>
          <td>:</td>
          <td>${studentName} / ${nim}</td>
        </tr>
        <tr>
          <td>Lokasi KPPM</td>
          <td>:</td>
          <td>${companyName}</td>
        </tr>
        <tr>
          <td>Periode KPPM</td>
          <td>:</td>
          <td>${periode} (${semesterCode})</td>
        </tr>
      </table>

      <table class="grade-table">
        <thead>
          <tr>
            <th class="no-col">No.</th>
            <th class="label-col">Indikator Penilaian</th>
            <th class="bobot-col">Bobot</th>
            <th class="nilai-col">Nilai *</th>
            <th class="nilai-x-bobot-col">Nilai x Bobot</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="3" style="text-align:right; padding-right: 8pt;">Total Nilai Pembimbing Akademik</td>
            <td class="nilai-col"></td>
            <td class="nilai-x-bobot-col">${totalNilai}</td>
          </tr>
        </tbody>
      </table>

      <p class="footer-note">*Nilai Angka diisi dengan mengacu pada rubrikasi penilaian pada Panduan KPPM Direktorat Kampus Jakarta Universitas Telkom</p>

      <div class="signature-section">
        <div class="signature-box">
          <p class="signature-place-date">Jakarta, ${today}</p>
          <p class="signature-title">Dosen Pembimbing Akademik</p>
          <p class="signature-name">${lecturerName}</p>
          <p class="signature-nip">NIP. ${lecturerNip}</p>
        </div>
      </div>
    </div>
  `;
}

// ─── Form Mentor HTML ─────────────────────────────────────────────────────────

function buildMentorFormHTML(props: ExportNilaiPDFProps, pageBreak = false): string {
  const { studentName, nim, companyName, semesterCode, internshipStart, internshipEnd, mentorName, mentorNip, mentorPosition, mentorGrades } = props;
  const today = todayFormatted();
  const periode = fmtPeriode(internshipStart, internshipEnd);

  const rows = MENTOR_INDICATORS.map((ind, i) => {
    const nilai = mentorGrades ? mentorGrades[ind.field] : '';
    const nilaiXBobot = mentorGrades ? ((ind.bobot / 100) * mentorGrades[ind.field]).toFixed(2) : '';
    return `
      <tr>
        <td class="no-col">${i + 1}</td>
        <td class="label-col">${ind.label}</td>
        <td class="bobot-col">${ind.bobot}</td>
        <td class="nilai-col">${nilai}</td>
        <td class="nilai-x-bobot-col">${nilaiXBobot}</td>
      </tr>
    `;
  }).join('');

  const totalNilai = mentorGrades ? mentorGrades.total.toFixed(2) : '';

  return `
    <div class="print-page${pageBreak ? ' print-page-break' : ''}">
      <div class="print-title">
        Form Penilaian Pembimbing Lapang KPPM<br>
        Direktorat Kampus Jakarta Universitas Telkom
      </div>

      <table class="print-info-table">
        <tr>
          <td>Nama / NIM</td>
          <td>:</td>
          <td>${studentName} / ${nim}</td>
        </tr>
        <tr>
          <td>Lokasi Kerja/Unit</td>
          <td>:</td>
          <td>${companyName}</td>
        </tr>
        <tr>
          <td>Periode KPPM</td>
          <td>:</td>
          <td>${periode} (${semesterCode})</td>
        </tr>
      </table>

      <table class="grade-table">
        <thead>
          <tr>
            <th class="no-col">No.</th>
            <th class="label-col">Indikator Penilaian</th>
            <th class="bobot-col">Bobot (%)</th>
            <th class="nilai-col">Nilai Angka*</th>
            <th class="nilai-x-bobot-col">Bobot x Nilai Angka</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="3" style="text-align:center; font-weight:bold;">Total Nilai Pembimbing Lapangan</td>
            <td class="nilai-col"></td>
            <td class="nilai-x-bobot-col">${totalNilai}</td>
          </tr>
        </tbody>
      </table>

      <p class="footer-note">*Nilai Pembimbing Lapangan diisi sesuai dengan rubrikasi Penilaian KPPM</p>

      <div class="signature-section">
        <div class="signature-box">
          <p class="signature-place-date">Jakarta, ${today}</p>
          <p class="signature-title">${mentorPosition}</p>
          <p class="signature-name">${mentorName}</p>
          <p class="signature-nip">NIP. ${mentorNip || '...................'}</p>
        </div>
      </div>
    </div>
  `;
}

// ─── Shared open-print helper ─────────────────────────────────────────────────

function openPrintWindow(bodyHTML: string, title: string) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Popup diblokir browser. Izinkan popup untuk situs ini dan coba lagi.');
    return;
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <style>${PRINT_STYLES}</style>
    </head>
    <body>
      ${bodyHTML}
      <script>
        window.onload = function() { window.print(); };
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function PdfIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="12" y1="12" x2="12" y2="18"/>
      <polyline points="9,15 12,18 15,15"/>
    </svg>
  );
}

// ─── Main Export Component ────────────────────────────────────────────────────

export default function ExportNilaiPDF(props: ExportNilaiPDFProps) {
  const { mode = 'both', label, className = '' } = props;

  const handleExport = () => {
    if (mode === 'pa') {
      openPrintWindow(
        buildPAFormHTML(props, false),
        `Form Penilaian PA KPPM — ${props.studentName}`
      );
    } else if (mode === 'mentor') {
      openPrintWindow(
        buildMentorFormHTML(props, false),
        `Form Penilaian Pembimbing Lapang KPPM — ${props.studentName}`
      );
    } else {
      // mode 'both': first page gets break-after so second starts on a new page
      openPrintWindow(
        buildPAFormHTML(props, true) + buildMentorFormHTML(props, false),
        `Form Penilaian KPPM — ${props.studentName}`
      );
    }
  };

  const defaultLabel =
    mode === 'pa'     ? 'Export PDF PA' :
    mode === 'mentor' ? 'Export PDF Mentor' :
                        'Export PDF';

  return (
    <button
      onClick={handleExport}
      className={className}
      title={`Export ${mode === 'pa' ? 'Form PA' : mode === 'mentor' ? 'Form Pembimbing Lapang' : 'Semua Form'} ke PDF`}
    >
      <PdfIcon />
      {label ?? defaultLabel}
    </button>
  );
}
