export default function UploadHasilKpPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Upload Hasil KP</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Unggah dokumen dan laporan hasil kerja praktik Anda</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-10 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Upload Dokumen KP</h2>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Halaman upload dokumen hasil kerja praktik (laporan, sertifikat, nilai pembimbing lapangan) akan segera tersedia.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-[#CC0000] rounded-lg text-sm font-medium">
          🚧 Dalam Pengembangan
        </div>
      </div>
    </div>
  );
}
