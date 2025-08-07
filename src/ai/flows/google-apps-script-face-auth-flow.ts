// Mock implementation for Google Apps Script Face Auth Flow
// This is a compatibility layer for Cloudflare migration

export interface RegisterData {
  nome: string;
  email: string;
  telefone: string;
  image: string;
}

export interface LoginData {
  image: string;
  email?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  isVip?: boolean;
  redirectUrl?: string;
  userEmail?: string;
}

export async function registerWithFaceID(data: RegisterData): Promise<AuthResponse> {
  console.log('[Mock] Register with Face ID:', data.nome, data.email);
  return {
    success: true,
    message: 'Mock registration successful',
    userEmail: data.email
  };
}

export async function loginWithFaceID(data: LoginData): Promise<AuthResponse> {
  console.log('[Mock] Login with Face ID:', data.email);
  return {
    success: true,
    message: 'Mock login successful',
    userEmail: data.email || 'test@example.com',
    isVip: false
  };
}

export async function checkUserPaymentStatus(email: string): Promise<AuthResponse> {
  console.log('[Mock] Check payment status for:', email);
  return {
    success: true,
    message: 'Mock payment check successful',
    userEmail: email,
    isVip: false
  };
}