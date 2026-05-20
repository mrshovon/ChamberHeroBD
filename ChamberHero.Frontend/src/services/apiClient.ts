'use client';

import type {
  ApiResponse,
  AuthResponseDto,
  DoctorLoginDto,
  DoctorRegisterDto
} from '@/types/api';

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

const TOKEN_COOKIE_NAME = 'chamberhero_auth_token';
const TOKEN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax; Secure`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
}

function createErrorResponse<T>(message: string, statusCode: number): ApiResponse<T> {
  return {
    success: false,
    message,
    statusCode,
  };
}

class ApiClient {
  private readonly baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
  }

  private getAuthToken(): string | null {
    if (this.token) {
      return this.token;
    }

    const savedToken = getCookie(TOKEN_COOKIE_NAME);
    if (savedToken) {
      this.token = savedToken;
    }

    return this.token;
  }

  private setAuthToken(token: string | null): void {
    this.token = token;
    if (token) {
      setCookie(TOKEN_COOKIE_NAME, token, TOKEN_COOKIE_MAX_AGE_SECONDS);
    } else {
      deleteCookie(TOKEN_COOKIE_NAME);
    }
  }

  private handleUnauthorized(): void {
    this.setAuthToken(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('unauthorized', { detail: { timestamp: Date.now() } }));
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }

  private async request<T = unknown>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: config.method ?? 'GET',
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: config.signal,
      });

      const responseData = await response.json();
      const data: ApiResponse<T> = responseData;

      if (response.status === 401) {
        this.handleUnauthorized();
        return createErrorResponse('Unauthorized. Please login again.', 401);
      }

      if (response.status === 403) {
        return createErrorResponse('Forbidden. Subscription or account status does not permit this action.', 403);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return createErrorResponse('Network error. Please check your connection.', 0);
      }

      return createErrorResponse('An unexpected error occurred while sending the request.', 0);
    }
  }

  async get<T = unknown>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T = unknown>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async patch<T = unknown>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  async delete<T = unknown>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  async login(request: DoctorLoginDto): Promise<ApiResponse<AuthResponseDto>> {
    const response = await this.post<AuthResponseDto>('/auth/login', request);
    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token);
    }
    return response;
  }

  async register(request: DoctorRegisterDto): Promise<ApiResponse<AuthResponseDto>> {
    const response = await this.post<AuthResponseDto>('/auth/register', request);
    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token);
    }
    return response;
  }
}

const apiClient = new ApiClient();

export { apiClient, ApiClient, type RequestConfig };
