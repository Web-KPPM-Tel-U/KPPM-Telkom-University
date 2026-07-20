export default function DosenMahasiswaPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Data Mahasiswa Bimbingan</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Daftar mahasiswa KPPM yang Anda bimbing</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-10 text-center">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Data Mahasiswa</h2>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Daftar mahasiswa bimbingan akan ditampilkan di sini setelah terhubung ke backend.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium">
          🚧 Dalam Pengembangan
        </div>
      </div>
    </div>
  );
}
