export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'pharmacist' | 'patient';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  message?: string;
  token: string;
  user: AuthUser;
}

