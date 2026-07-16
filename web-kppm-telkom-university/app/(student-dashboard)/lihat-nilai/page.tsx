export default function LihatNilaiPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lihat Nilai</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Nilai KPPM dari pembimbing akademik dan mentor perusahaan</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-10 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Rekap Nilai KPPM</h2>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Nilai dari pembimbing akademik (dosen) dan pembimbing lapangan (mentor) akan ditampilkan di sini setelah diinputkan.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-[#CC0000] rounded-lg text-sm font-medium">
          🚧 Dalam Pengembangan
        </div>
      </div>
    </div>
  );
}
