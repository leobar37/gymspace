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
  private refreshPromise: Promise<any> | null = null; // To prevent concurrent refresh attempts
  
  // Callbacks for token updates and auth errors
  public onTokensUpdated?: (accessToken: string, refreshToken: string) => void;
  public onAuthError?: (error: any) => void;

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

        // Add refresh token header if available
        if (this.config.refreshToken && config.headers) {
          config.headers['X-Refresh-Token'] = this.config.refreshToken;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor with automatic token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Check for new tokens in response headers
        const newAccessToken = response.headers['x-new-access-token'];
        const newRefreshToken = response.headers['x-new-refresh-token'];
        
        if (newAccessToken && newRefreshToken) {
          this.setTokens(newAccessToken, newRefreshToken);
          // Emit token update event if needed
          this.onTokensUpdated?.(newAccessToken, newRefreshToken);
        }
        
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        
        // If it's a 401 error and we haven't retried yet, try to refresh the token
        if (error.response?.status === 401 && !originalRequest._retry && this.config.refreshToken) {
          originalRequest._retry = true;
          
          try {
            // Prevent concurrent refresh attempts
            if (!this.refreshPromise) {
              this.refreshPromise = this.refreshAccessToken();
            }
            
            const newTokens = await this.refreshPromise;
            this.refreshPromise = null;
            
            if (newTokens) {
              // Update the original request with new token
              if (!originalRequest.headers) {
                originalRequest.headers = {} as AxiosRequestHeaders;
              }
              originalRequest.headers['Authorization'] = `Bearer ${newTokens.access_token}`;

              // Retry the original request
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            this.refreshPromise = null;
            // If refresh fails, clear tokens and emit error
            this.clearAuth();
            this.onAuthError?.(refreshError);
          }
        }
        
        throw this.handleError(error);
      },
    );
  }

  /**
   * Refresh the access token using the stored refresh token
   */
  private async refreshAccessToken(): Promise<any> {
    if (!this.config.refreshToken) {
      throw new AuthenticationError('No refresh token available');
    }

    try {
      const response = await axios.post(
        `${this.config.baseURL}/auth/refresh`,
        { refresh_token: this.config.refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: this.config.timeout || 30000,
        }
      );

      const newTokens = response.data;
      this.setTokens(newTokens.access_token, newTokens.refresh_token);
      
      return newTokens;
    } catch (error) {
      throw new AuthenticationError('Failed to refresh token');
    }
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

  setTokens(accessToken: string, refreshToken: string): void {
    this.config.apiKey = accessToken;
    // Store refresh token if needed for token refresh logic
    this.config.refreshToken = refreshToken;
  }

  setGymId(gymId: string): void {
    this.axiosInstance.defaults.headers.common['X-Gym-Id'] = gymId;
  }

  clearAuth(): void {
    delete this.config.apiKey;
    delete this.config.refreshToken;
    delete this.axiosInstance.defaults.headers.common['Authorization'];
    delete this.axiosInstance.defaults.headers.common['X-Gym-Id'];
  }

  getBaseUrl(): string {
    return this.config.baseURL;
  }
}
