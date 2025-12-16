export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'pharmacist' | 'patient';

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: UserRole;
}

export interface AuthResponse {
  message?: string;
  token: string;
  user: AuthUser;
}

