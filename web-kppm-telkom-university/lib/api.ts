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
  id: number;
  nim: string;
  name: string;
  class: string;
  email: string;
  role: 'student';
}

export interface LecturerUser {
  id: number;
  nip: string;
  name: string;
  role: 'lecturer';
}

export interface MentorUser {
  email: string;
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

// ─── KPPM Registration API ────────────────────────────────────────────────────

export interface KppmRegistration {
  registration_id: number;
  semester_code: string;
  company_name: string;
  internship_position: string;
  internship_start: string;
  internship_end: string;
  status: 'pending_approval' | 'approved';
  submitted_at: string;
  approved_at: string | null;
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

// ─── Lecturers API ────────────────────────────────────────────────────────────

export interface Lecturer {
  lecturer_id: number;
  lecturer_name: string;
  nip: string;
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

