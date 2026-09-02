/**
 * API Client — Memanggil backend melalui API Gateway (port 4000)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface StudentUser {
  nim: string;
  name: string;
  class: string;
  email: string | null;
  role: 'student';
  is_verified: boolean;
  password_changed: boolean;
  assigned_lecturer_code: string | null;
  assigned_lecturer_nip:  string | null;
  assigned_lecturer_name: string | null;
}

export interface LecturerUser {
  id: string;
  nip: string;
  name: string;
  email: string | null;
  role: 'lecturer';
  is_verified: boolean;
  password_changed: boolean;
}

export interface MentorUser {
  email: string;
  name?: string;
  company?: string;
  role: 'mentor';
}

export interface LoginResponse {
  token: string;
  user: StudentUser | LecturerUser | MentorUser;
}

// ─── Token Management ─────────────────────────────────────────────────────────

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('kppm_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('kppm_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('kppm_token');
  localStorage.removeItem('kppm_user');
};

export const setUser = (user: StudentUser | LecturerUser | MentorUser): void => {
  localStorage.setItem('kppm_user', JSON.stringify(user));
};

export const getUser = (): StudentUser | LecturerUser | MentorUser | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('kppm_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

const authHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ─── Auth API ─────────────────────────────────────────────────────────────────

/**
 * Login Mahasiswa dengan NIM dan Password
 */
export const loginMahasiswa = async (
  nim: string,
  password: string
): Promise<ApiResponse<LoginResponse>> => {
  const res = await fetch(`${API_BASE_URL}/auth/student/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nim, password }),
  });
  return res.json();
};

/**
 * Login Dosen dengan NIP dan Password
 */
export const loginDosen = async (
  nip: string,
  password: string
): Promise<ApiResponse<LoginResponse>> => {
  const res = await fetch(`${API_BASE_URL}/auth/lecturer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nip, password }),
  });
  return res.json();
};

/**
 * Kirim OTP ke email Mentor
 */
export const sendMentorOtp = async (
  email: string
): Promise<ApiResponse<{ dev_otp?: string }>> => {
  const res = await fetch(`${API_BASE_URL}/auth/mentor/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
};

/**
 * Verifikasi OTP Mentor
 */
export const verifyMentorOtp = async (
  email: string,
  otp: string
): Promise<ApiResponse<LoginResponse>> => {
  const res = await fetch(`${API_BASE_URL}/auth/mentor/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  return res.json();
};

/**
 * Lupa Password: Kirim OTP
 */
export const forgotPasswordSendOtp = async (
  email: string
): Promise<ApiResponse<void>> => {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
};

/**
 * Lupa Password: Verifikasi OTP & Reset
 */
export const forgotPasswordVerifyReset = async (
  email: string,
  otp: string,
  newPassword: string
): Promise<ApiResponse<void>> => {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password/verify-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, newPassword }),
  });
  return res.json();
};

/**
 * Logout — hapus token lokal dan notify backend
 */
export const logout = async (): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: authHeaders(),
    });
  } catch {
    // Tetap hapus token meskipun request gagal
  } finally {
    removeToken();
  }
};

// ─── Student API ──────────────────────────────────────────────────────────────

export const getStudentProfile = async (): Promise<ApiResponse<StudentUser>> => {
  const res = await fetch(`${API_BASE_URL}/student/profile`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const updateStudentProfile = async (data: { email: string }): Promise<ApiResponse<null>> => {
  const res = await fetch(`${API_BASE_URL}/student/profile`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getStudentDashboard = async (): Promise<ApiResponse<unknown>> => {
  const res = await fetch(`${API_BASE_URL}/student/dashboard`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const changeStudentPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<{ token: string; user: StudentUser }>> => {
  const res = await fetch(`${API_BASE_URL}/auth/student/change-password`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return res.json();
};

/**
 * Kirim OTP ke email @student.telkomuniversity.ac.id untuk verifikasi akun mahasiswa
 */
export const sendStudentVerifyOtp = async (
  email: string
): Promise<ApiResponse<null>> => {
  const res = await fetch(`${API_BASE_URL}/auth/student/send-verify-otp`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
  return res.json();
};

/**
 * Verifikasi OTP email mahasiswa, simpan email ke database
 */
export const verifyStudentEmail = async (
  email: string,
  otp: string
): Promise<ApiResponse<{ token: string; user: StudentUser }>> => {
  const res = await fetch(`${API_BASE_URL}/auth/student/verify-email`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, otp }),
  });
  return res.json();
};

/**
 * Kirim OTP ke email dosen untuk verifikasi akun
 */
export const sendLecturerVerifyOtp = async (
  email: string
): Promise<ApiResponse<null>> => {
  const res = await fetch(`${API_BASE_URL}/auth/lecturer/send-verify-otp`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
  return res.json();
};

/**
 * Verifikasi OTP email dosen, simpan email ke database
 */
export const verifyLecturerEmail = async (
  email: string,
  otp: string
): Promise<ApiResponse<{ token: string; user: LecturerUser }>> => {
  const res = await fetch(`${API_BASE_URL}/auth/lecturer/verify-email`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, otp }),
  });
  return res.json();
};

/**
 * Ganti password dosen
 */
export const changeLecturerPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<{ token: string; user: LecturerUser }>> => {
  const res = await fetch(`${API_BASE_URL}/auth/lecturer/change-password`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return res.json();
};

// ─── KPPM Registration API ────────────────────────────────────────────────────

export interface KppmRegistration {
  registration_id: number;
  semester_code: string;
  company_name: string;
  internship_position: string;
  internship_start: string;
  internship_end: string;
  status: 'pending_approval' | 'approved' | 'cancelled' | 'rejected';
  submitted_at: string;
  approved_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface KppmRegistrationDetail extends KppmRegistration {
  whatsapp_number: string;
  toss_cover_letter_file: string;
  mentor_name: string;
  mentor_position: string;
  mentor_email: string;
  mentor_phone: string;
  pembimbing_akademik: string | null;
  cancelled_at: string | null;
  // Data mahasiswa
  nim: string | null;
  student_name: string | null;
  student_class: string | null;
  student_email: string | null;
}

// Backend mengembalikan: { success, data: KppmRegistration[], meta: {...} }
// (data dan meta sebagai sibling, bukan nested)
export interface KppmListApiResponse {
  success: boolean;
  message?: string;
  data: KppmRegistration[];
  meta: { total: number; limit: number; offset: number };
}

/**
 * Submit form pendaftaran KPPM (multipart/form-data)
 */
export const submitKppmRegistration = async (
  formData: FormData
): Promise<ApiResponse<{ registration_id: number; status: string; submitted_at: string }>> => {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/student/kppm/register`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  return res.json();
};

/**
 * Ambil riwayat pendaftaran KPPM milik mahasiswa yang login
 */
export const getKppmRegistrations = async (
  limit = 10,
  offset = 0
): Promise<KppmListApiResponse> => {
  const res = await fetch(
    `${API_BASE_URL}/student/kppm/registrations?limit=${limit}&offset=${offset}`,
    { headers: authHeaders() }
  );
  return res.json();
};

/**
 * Ambil detail satu pendaftaran KPPM berdasarkan ID
 */
export const getKppmRegistrationDetail = async (
  id: number
): Promise<ApiResponse<KppmRegistrationDetail>> => {
  const res = await fetch(`${API_BASE_URL}/student/kppm/registrations/${id}`, {
    headers: authHeaders(),
  });
  return res.json();
};

/**
 * Batalkan pendaftaran KPPM berdasarkan ID.
 * Hanya bisa dilakukan jika status masih 'pending_approval'.
 */
export const cancelKppmRegistration = async (
  id: number
): Promise<ApiResponse<null>> => {
  const res = await fetch(`${API_BASE_URL}/student/kppm/registrations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.json();
};

// ─── Lecturers API ────────────────────────────────────────────────────────────

export interface Lecturer {
  nip: string;
  lecturer_name: string;
}

/**
 * Ambil daftar dosen pembimbing untuk opsi dropdown
 */
export const getLecturersList = async (): Promise<ApiResponse<Lecturer[]>> => {
  const res = await fetch(`${API_BASE_URL}/student/lecturers`, {
    headers: authHeaders(),
  });
  return res.json();
};

/**
 * Ambil daftar semester yang sedang aktif
 * (untuk dropdown di form pendaftaran KPPM mahasiswa)
 */
export interface ActiveSemester {
  semester_id: number;
  code: string;
  label: string;
}



export const addAdminStudent = async (data: { nim: string; student_name: string; class: string; email?: string }): Promise<ApiResponse<any>> => {
  const res = await fetch(`${API_BASE_URL}/admin/students/add`, {
    method: 'POST',
    headers: { ...adminAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const addAdminLecturer = async (data: { nip: string; lecturer_name: string; lecturer_code?: string; email?: string }): Promise<ApiResponse<any>> => {
  const res = await fetch(`${API_BASE_URL}/admin/lecturers/add`, {
    method: 'POST',
    headers: { ...adminAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

/**
 * Assign atau lepas dosen pembimbing ke mahasiswa (admin only)
 */
export const assignLecturerToStudent = async (
  nim: string,
  lecturer_code: string | null
): Promise<ApiResponse<{ nim: string; assigned_lecturer_code: string | null; assigned_lecturer_name: string | null }>> => {
  const res = await fetch(`${API_BASE_URL}/admin/students/${nim}/assign-lecturer`, {
    method: 'PATCH',
    headers: { ...adminAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ lecturer_code }),
  });
  return res.json();
};

export const getActiveSemesters = async (): Promise<ApiResponse<ActiveSemester[]>> => {
  const res = await fetch(`${API_BASE_URL}/student/semesters/active`, {
    headers: authHeaders(),
  });
  return res.json();
};

// ─── Lecturer Profile & Auth API ──────────────────────────────────────────────

/**
 * Ambil profil dosen dari localStorage cache
 */
export const getLecturerProfile = (): LecturerUser | null => {
  const user = getUser();
  if (user && user.role === 'lecturer') return user as LecturerUser;
  return null;
};

// ─── Lecturer Students API ────────────────────────────────────────────────────

export interface LecturerStudentEntry {
  // Data mahasiswa
  nim: string;
  student_name: string;
  student_class: string;
  student_email: string;
  // Data pengajuan
  registration_id: number | null;
  semester_code: string | null;
  company_name: string | null;
  internship_position: string | null;
  internship_start: string | null;
  internship_end: string | null;
  status: 'pending_approval' | 'approved' | 'cancelled' | 'rejected' | null;
  submitted_at: string | null;
  approved_at: string | null;
  cancelled_at: string | null;
  rejected_at: string | null;
  whatsapp_number: string | null;
  mentor_name: string | null;
  mentor_nip: string | null;
  mentor_position: string | null;
  mentor_email: string | null;
  mentor_phone: string | null;
  toss_cover_letter_file: string | null;
  is_graded: number | null;
}

export interface LecturerStudentsApiResponse {
  success: boolean;
  message?: string;
  data: LecturerStudentEntry[];
  meta: { total: number; limit: number; offset: number };
}

/**
 * Ambil daftar mahasiswa bimbingan dosen beserta status pengajuan KPPM.
 * Hanya bisa dipanggil saat login sebagai dosen (role: lecturer).
 */
export const getLecturerStudents = async (
  limit = 50,
  offset = 0
): Promise<LecturerStudentsApiResponse> => {
  const res = await fetch(
    `${API_BASE_URL}/student/lecturer/students?limit=${limit}&offset=${offset}`,
    { headers: authHeaders() }
  );
  return res.json();
};

/**
 * Dosen menyetujui atau menolak pengajuan KPPM mahasiswa.
 * action: 'approved' | 'cancelled' | 'rejected'
 */
export const updateLecturerRegistrationStatus = async (
  registrationId: number,
  action: 'approved' | 'cancelled' | 'rejected'
): Promise<{ success: boolean; message?: string }> => {
  const res = await fetch(
    `${API_BASE_URL}/student/lecturer/registrations/${registrationId}/status`,
    {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    }
  );
  return res.json();
};

// ─── Mentor API ───────────────────────────────────────────────────────────────────────

export interface MentorMentee {
  registration_id: number;
  status: string;
  semester_code: string;
  company_name: string;
  internship_position: string;
  internship_start: string;
  internship_end: string;
  submitted_at: string;
  approved_at: string | null;
  pembimbing_akademik: string | null;
  student: {
    nim: string;
    name: string;
    class: string;
    email: string;
    whatsapp: string;
  };
}

export interface MentorDashboardData {
  mentor: {
    name: string;
    position: string;
    email: string;
    phone: string;
    company_name: string;
  };
  total_mentees: number;
  mentees: MentorMentee[];
}

/**
 * Ambil dashboard mentor (data mahasiswa yang dibimbing)
 */
export const getMentorDashboard = async (): Promise<ApiResponse<MentorDashboardData> & { httpStatus?: number }> => {
  const res = await fetch(`${API_BASE_URL}/student/mentor/dashboard`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  return { ...data, httpStatus: res.status };
};

/**
 * Ambil profil mentor dari localStorage cache
 */
export const getMentorProfile = (): MentorUser | null => {
  const user = getUser();
  if (user && user.role === 'mentor') return user as MentorUser;
  return null;
};

// ─── Mentor Grades API ────────────────────────────────────────────────────────

export interface MentorGradeScores {
  attendance: number;
  discipline: number;
  commitment: number;
  planning: number;
  teamwork: number;
  guidance: number;
  report: number;
  problem_solving: number;
}

export interface MentorGradeData {
  mentor_score_id?: number;
  registration_id: number;
  scores: MentorGradeScores;
  total_nilai_lapangan: number;
  updated_at?: string;
}

/**
 * Submit / update nilai mentor untuk satu mahasiswa
 */
export const submitMentorGrade = async (
  registrationId: number,
  scores: MentorGradeScores
): Promise<ApiResponse<MentorGradeData>> => {
  const res = await fetch(`${API_BASE_URL}/student/mentor/grades/${registrationId}`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(scores),
  });
  return res.json();
};

/**
 * Ambil nilai satu mahasiswa berdasarkan registration_id
 */
export const getMentorGrade = async (
  registrationId: number
): Promise<ApiResponse<MentorGradeData | null>> => {
  const res = await fetch(`${API_BASE_URL}/student/mentor/grades/${registrationId}`, {
    headers: authHeaders(),
  });
  return res.json();
};

/**
 * Ambil semua nilai yang sudah diinput oleh mentor ini
 */
export const getAllMentorGrades = async (): Promise<ApiResponse<any[]>> => {
  const res = await fetch(`${API_BASE_URL}/student/mentor/grades`, {
    headers: authHeaders(),
  });
  return res.json();
};

// ─── Student Grades API ───────────────────────────────────────────────────────

export interface MyMentorGrades {
  attendance: number;
  discipline: number;
  commitment: number;
  planning: number;
  teamwork: number;
  guidance: number;
  report: number;
  problem_solving: number;
  total: number;
  updated_at: string;
}

export interface MyLecturerGrades {
  commitment: number;
  planning: number;
  guidance: number;
  presentation: number;
  report: number;
  identification: number;
  total: number;
  updated_at: string;
}

export interface MyGradesData {
  registration: {
    registration_id: number;
    company_name: string;
    internship_position: string;
    internship_start: string;
    internship_end: string;
    semester_code: string;
    mentor_name: string;
    mentor_nip: string;
    mentor_position: string;
    dosen_name: string;
    dosen_nip: string;
    submitted_at: string;
    approved_at: string;
  };
  mentor_grades: MyMentorGrades | null;
  lecturer_grades: MyLecturerGrades | null;
}

/**
 * Ambil nilai KPPM milik mahasiswa yang sedang login
 */
export const getMyGrades = async (): Promise<ApiResponse<MyGradesData | null>> => {
  const res = await fetch(`${API_BASE_URL}/student/grades`, {
    headers: authHeaders(),
  });
  return res.json();
};

// ─── Lecturer Grades API ────────────────────────────────────────────────────

export interface LecturerGradeScores {
  commitment: number;
  planning: number;
  guidance: number;
  presentation: number;
  report: number;
  identification: number;
}

export interface LecturerGradeData {
  lecturer_score_id?: number;
  registration_id: number;
  scores: LecturerGradeScores;
  total_nilai_pa: number;
  updated_at?: string;
}

/**
 * Submit / update nilai PA dosen untuk satu mahasiswa
 */
export const submitLecturerGrade = async (
  registrationId: number,
  scores: LecturerGradeScores
): Promise<ApiResponse<LecturerGradeData>> => {
  const res = await fetch(`${API_BASE_URL}/student/lecturer/grades/${registrationId}`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(scores),
  });
  return res.json();
};

/**
 * Ambil nilai PA satu mahasiswa berdasarkan registration_id
 */
export const getLecturerGrade = async (
  registrationId: number
): Promise<ApiResponse<LecturerGradeData | null>> => {
  const res = await fetch(`${API_BASE_URL}/student/lecturer/grades/${registrationId}`, {
    headers: authHeaders(),
  });
  return res.json();
};

// ─── Lecturer: Full Student Grades (PA + Mentor) ──────────────────────────────

export interface StudentFullGradesData {
  registration_id: number;
  student_name: string;
  nim: string;
  company_name: string;
  semester_code: string;
  lecturer_grades: (MyLecturerGrades & { updated_at: string }) | null;
  mentor_grades: (MyMentorGrades & { updated_at: string }) | null;
}

/**
 * Ambil nilai lengkap (PA + Mentor) mahasiswa bimbingan — hanya untuk dosen
 */
export const getLecturerStudentFullGrades = async (
  registrationId: number
): Promise<ApiResponse<StudentFullGradesData | null>> => {
  const res = await fetch(`${API_BASE_URL}/student/lecturer/student-grades/${registrationId}`, {
    headers: authHeaders(),
  });
  return res.json();
};

// ─── Admin / PIC API ──────────────────────────────────────────────────────────

export interface AdminUser {
  admin_id: number;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'pic';
}

export const getAdminToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('kppm_admin_token');
};

export const setAdminToken = (token: string): void => {
  localStorage.setItem('kppm_admin_token', token);
};

export const removeAdminToken = (): void => {
  localStorage.removeItem('kppm_admin_token');
  localStorage.removeItem('kppm_admin_user');
};

export const setAdminUser = (user: AdminUser): void => {
  localStorage.setItem('kppm_admin_user', JSON.stringify(user));
};

export const getAdminUser = (): AdminUser | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('kppm_admin_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

const adminAuthHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  ...(getAdminToken() ? { Authorization: `Bearer ${getAdminToken()}` } : {}),
});

/**
 * Login Admin/PIC dengan email dan password
 */
export const loginAdmin = async (
  email: string,
  password: string
): Promise<ApiResponse<{ token: string; user: AdminUser }>> => {
  const res = await fetch(`${API_BASE_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

/**
 * Logout Admin — hapus token admin dari localStorage
 */
export const logoutAdmin = async (): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: adminAuthHeaders(),
    });
  } catch {
    // tetap hapus token
  } finally {
    removeAdminToken();
  }
};

export interface AdminStats {
  total_students: number;
  total_lecturers: number;
  pending_registrations: number;
  approved_registrations: number;
  active_semesters: number;
  total_registrations: number;
}

/**
 * Ambil statistik ringkasan untuk dashboard admin
 */
export const getAdminStats = async (): Promise<ApiResponse<AdminStats>> => {
  const res = await fetch(`${API_BASE_URL}/admin/stats`, {
    headers: adminAuthHeaders(),
  });
  return res.json();
};

/**
 * Ambil daftar semua dosen (untuk admin)
 */
export const getAdminLecturers = async (
  limit = 50,
  offset = 0,
  search = ''
): Promise<ApiResponse<any[]> & { meta?: { total: number; limit: number; offset: number } }> => {
  const res = await fetch(
    `${API_BASE_URL}/admin/lecturers?limit=${limit}&offset=${offset}&search=${encodeURIComponent(search)}`,
    { headers: adminAuthHeaders() }
  );
  return res.json();
};

/**
 * Ambil daftar semua mahasiswa (untuk admin)
 */
export const getAdminStudents = async (
  limit = 50,
  offset = 0,
  search = ''
): Promise<ApiResponse<any[]> & { meta?: { total: number; limit: number; offset: number } }> => {
  const res = await fetch(
    `${API_BASE_URL}/admin/students?limit=${limit}&offset=${offset}&search=${encodeURIComponent(search)}`,
    { headers: adminAuthHeaders() }
  );
  return res.json();
};

/**
 * Ambil daftar kode semester (untuk admin)
 */
export const getAdminSemesters = async (): Promise<ApiResponse<any[]>> => {
  const res = await fetch(`${API_BASE_URL}/admin/semesters`, {
    headers: adminAuthHeaders(),
  });
  return res.json();
};

/**
 * Buat kode semester baru
 */
export const createAdminSemester = async (
  code: string,
  label: string
): Promise<ApiResponse<any>> => {
  const res = await fetch(`${API_BASE_URL}/admin/semesters`, {
    method: 'POST',
    headers: adminAuthHeaders(),
    body: JSON.stringify({ code, label }),
  });
  return res.json();
};

/**
 * Toggle status aktif/nonaktif semester
 */
export const toggleAdminSemesterStatus = async (id: number): Promise<ApiResponse<any>> => {
  const res = await fetch(`${API_BASE_URL}/admin/semesters/${id}/toggle-status`, {
    method: 'PATCH',
    headers: adminAuthHeaders(),
  });
  return res.json();
};

/**
 * Update data dosen (nama, email) — hanya PIC
 */
export const updateAdminLecturer = async (
  nip: string,
  data: { lecturer_name?: string; lecturer_code?: string; email?: string }
): Promise<ApiResponse<any>> => {
  const res = await fetch(`${API_BASE_URL}/admin/lecturers/${nip}`, {
    method: 'PATCH',
    headers: adminAuthHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

/**
 * Update data mahasiswa (nama, kelas, email) — hanya PIC
 */
export const updateAdminStudent = async (
  nim: string,
  data: { student_name?: string; class?: string; email?: string }
): Promise<ApiResponse<any>> => {
  const res = await fetch(`${API_BASE_URL}/admin/students/${nim}`, {
    method: 'PATCH',
    headers: { ...adminAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const toggleAdminLecturerStatus = async (nip: string): Promise<ApiResponse<any>> => {
  const res = await fetch(`${API_BASE_URL}/admin/lecturers/${nip}/toggle-status`, {
    method: 'PATCH',
    headers: adminAuthHeaders(),
  });
  return res.json();
};

export const toggleAdminStudentStatus = async (nim: string): Promise<ApiResponse<any>> => {
  const res = await fetch(`${API_BASE_URL}/admin/students/${nim}/toggle-status`, {
    method: 'PATCH',
    headers: adminAuthHeaders(),
  });
  return res.json();
};

// ─── Admin: Inject Data ───────────────────────────────────────────────────────

export interface InjectResult {
  inserted: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

/**
 * Import data mahasiswa dari file CSV/XLSX
 */
export const injectStudents = async (
  file: File
): Promise<ApiResponse<InjectResult>> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE_URL}/admin/inject/students`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAdminToken()}` },
    body: formData,
  });
  return res.json();
};

// ─── KP Results Upload API ────────────────────────────────────────────────────

export interface KpResultsRegistration {
  registration_id: number;
  // Data mahasiswa
  student_nim: string;
  student_name: string;
  student_class: string;
  student_email: string | null;
  whatsapp_number: string;
  // Data KP
  company_name: string;
  internship_position: string;
  internship_start: string;
  internship_end: string;
  semester_code: string;
  // Pembimbing lapang / mentor
  mentor_name: string;
  mentor_position: string;
  mentor_email: string;
  mentor_phone: string;
  // Dosen PA
  dosen_name: string;
}

export interface KpResultsDocuments {
  document_id: number;
  certificate_file: string;
  field_supervisor_score_file: string;
  academic_supervisor_score_file: string;
  implementation_agreement_file: string | null;
  created_at: string;
  updated_at: string;
}

export interface KpResultsData {
  eligible: boolean;
  reason: string;
  registration: KpResultsRegistration | null;
  documents: KpResultsDocuments | null;
  grades_status: {
    mentor: boolean;
    lecturer: boolean;
  };
}

/**
 * Cek status eligibility upload hasil KP dan ambil dokumen yang sudah diupload
 */
export const getKpResults = async (): Promise<ApiResponse<KpResultsData>> => {
  const res = await fetch(`${API_BASE_URL}/student/kppm/results`, {
    headers: authHeaders(),
  });
  return res.json();
};

/**
 * Upload dokumen hasil KP (multipart/form-data)
 * - certificate_file              : Wajib
 * - field_supervisor_score_file   : Wajib
 * - academic_supervisor_score_file: Wajib
 * - implementation_agreement_file : Opsional
 */
export const uploadKpResults = async (
  formData: FormData
): Promise<ApiResponse<null>> => {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/student/kppm/results`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  return res.json();
};

/**
 * Import data dosen dari file CSV/XLSX
 */
export const injectLecturers = async (
  file: File
): Promise<ApiResponse<InjectResult>> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE_URL}/admin/inject/lecturers`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAdminToken()}` },
    body: formData,
  });
  return res.json();
};

// ─── Lecturer: KP Results Mahasiswa Bimbingan ────────────────────────────────

export interface LecturerKpResultItem {
  registration_id: number;
  nim: string;
  student_name: string;
  student_class: string;
  student_email: string | null;
  whatsapp_number: string | null;
  company_name: string;
  internship_position: string;
  internship_start: string;
  internship_end: string;
  semester_code: string;
  approved_at: string;
  mentor_name: string | null;
  mentor_position: string | null;
  mentor_email: string | null;
  mentor_phone: string | null;
  // null jika mahasiswa belum upload
  document_id: number | null;
  certificate_file: string | null;
  field_supervisor_score_file: string | null;
  academic_supervisor_score_file: string | null;
  implementation_agreement_file: string | null;
  uploaded_at: string | null;
  updated_at: string | null;
}

/**
 * Ambil daftar mahasiswa bimbingan beserta status dokumen hasil KP mereka — hanya untuk dosen
 */
export const getLecturerKpResults = async (): Promise<ApiResponse<LecturerKpResultItem[]>> => {
  const res = await fetch(`${API_BASE_URL}/student/lecturer/kp-results`, {
    headers: authHeaders(),
  });
  return res.json();
};

/**
 * Unduh Nilai Mahasiswa berdasarkan semester (XLSX)
 */
export const exportAdminGrades = async (semesterCode: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/admin/export/grades?semester_code=${encodeURIComponent(semesterCode)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || 'Gagal mengunduh nilai');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Nilai_Mahasiswa_Semester_${semesterCode}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Preview Nilai Mahasiswa berdasarkan semester
 */
export const getAdminPreviewGrades = async (semesterCode: string): Promise<ApiResponse<any[]>> => {
  const res = await fetch(`${API_BASE_URL}/admin/export/preview?semester_code=${encodeURIComponent(semesterCode)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  return res.json();
};
