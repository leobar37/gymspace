import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestHeaders,
} from 'axios';
import { GymSpaceConfig, RequestOptions } from './types';
import {
  GymSpaceError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  NetworkError,
} from './errors';

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private config: GymSpaceConfig;
  private refreshToken: string | null = null;

  public getAccessToken(): string | null {
    return this.config.apiKey || null;
  }

  constructor(config: GymSpaceConfig) {
    this.config = config;

    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add Authorization header if auth token is configured
        if (this.config.apiKey && config.headers) {
          config.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }

        // Add refresh token header for current-session endpoint
        if (this.refreshToken && config.url?.includes('current-session') && config.headers) {
          config.headers['X-Refresh-Token'] = this.refreshToken;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor - simplified without automatic token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        // Simply throw the error - no automatic refresh attempts
        throw this.handleError(error);
      },
    );
  }

  private handleError(error: AxiosError): GymSpaceError {
    const requestPath = error.config?.url || 'unknown';
    const method = error.config?.method?.toUpperCase() || 'unknown';

    if (!error.response) {
      console.error('Network Error:', {
        method,
        path: requestPath,
        error: error.message,
      });
      return new NetworkError(error.message);
    }

    const { status, data } = error.response;
    const errorData = data as any;
    const resource = errorData?.resource || 'unknown';

    console.error('HTTP Error:', {
      method,
      path: requestPath,
      status,
      resource,
      message: errorData?.message || error.message,
      errorCode: errorData?.code,
      details: errorData,
    });

    switch (status) {
      case 401:
        return new AuthenticationError(errorData?.message || 'Authentication failed');
      case 403:
        return new AuthorizationError(errorData?.message || 'Access denied');
      case 404:
        return new NotFoundError(errorData?.resource || 'Resource', errorData?.id);
      case 400:
        return new ValidationError(errorData?.message || 'Validation failed', errorData?.errors);
      default:
        return new GymSpaceError(
          errorData?.message || error.message,
          status,
          errorData?.code,
          errorData,
        );
    }
  }

  private mergeOptions(options?: RequestOptions): AxiosRequestConfig {
    const headers: Record<string, string> = { ...options?.headers };

    if (options?.gymId) {
      headers['X-Gym-Id'] = options.gymId;
    }

    return { headers };
  }

  async request<T>(
    method: string,
    path: string,
    data?: any,
    options?: RequestOptions & AxiosRequestConfig,
  ): Promise<T> {
    const { headers, ...axiosConfig } = options || {};

    const config: AxiosRequestConfig = {
      method,
      url: path,
      ...this.mergeOptions({ headers }),
      ...axiosConfig,
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      config.data = data;
    } else if (data && method.toUpperCase() === 'GET') {
      config.params = data;
    }

    const response = await this.axiosInstance.request<T>(config);
    return response.data;
  }

  get<T>(path: string, params?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, params, options);
  }

  post<T>(path: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, data, options);
  }

  put<T>(path: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, data, options);
  }

  patch<T>(path: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, data, options);
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  setAuthToken(token: string): void {
    this.config.apiKey = token;
  }

  setRefreshToken(token: string | null): void {
    this.refreshToken = token;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setGymId(gymId: string): void {
    this.axiosInstance.defaults.headers.common['X-Gym-Id'] = gymId;
  }

  clearAuth(): void {
    delete this.config.apiKey;
    this.refreshToken = null;
    delete this.axiosInstance.defaults.headers.common['Authorization'];
    delete this.axiosInstance.defaults.headers.common['X-Gym-Id'];
  }

  getBaseUrl(): string {
    return this.config.baseURL;
  }
}
