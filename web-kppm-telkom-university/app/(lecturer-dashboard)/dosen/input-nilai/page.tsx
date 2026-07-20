export default function DosenInputNilaiPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Input Nilai Mahasiswa</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Berikan penilaian KP / Magang untuk mahasiswa bimbingan Anda</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-10 text-center">
        <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Form Input Nilai</h2>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Formulir penilaian mahasiswa akan tersedia setelah data mahasiswa terhubung ke sistem.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium">
          🚧 Dalam Pengembangan
        </div>
      </div>
    </div>
  );
}
