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

export const changeStudentPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<null>> => {
  const res = await fetch(`${API_BASE_URL}/student/change-password`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return res.json();
};

