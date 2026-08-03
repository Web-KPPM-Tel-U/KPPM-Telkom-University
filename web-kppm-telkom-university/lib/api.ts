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
  rejected_at: string | null;
  whatsapp_number: string;
  mentor_name: string;
  mentor_position: string;
  mentor_email: string;
  mentor_phone: string;
  toss_cover_letter_file: string | null;
  is_graded: number;
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
export const getMentorDashboard = async (): Promise<ApiResponse<MentorDashboardData>> => {
  const res = await fetch(`${API_BASE_URL}/student/mentor/dashboard`, {
    headers: authHeaders(),
  });
  return res.json();
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
    mentor_position: string;
    dosen_name: string;
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
