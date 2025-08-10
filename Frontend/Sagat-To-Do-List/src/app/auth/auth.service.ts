import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthState, LoginRequest, LoginResponse, RegisterRequest, User } from './models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:5125/api/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly ROLE_KEY = 'auth_role';

  private authStateSubject = new BehaviorSubject<AuthState>(this.getInitialAuthState());
  public authState$ = this.authStateSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkTokenExpiration();
  }

  private getInitialAuthState(): AuthState {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);
    const role = localStorage.getItem(this.ROLE_KEY);
    
    if (token && userStr && role) {
      try {
        const user = JSON.parse(userStr);
        return {
          isAuthenticated: true,
          user,
          token,
          role
        };
      } catch {
        this.clearAuthData();
      }
    }
    
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      role: null
    };
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, {
      email: credentials.email,
      password: credentials.password
    }).pipe(
      tap(response => {
        this.saveAuthData(response);
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, {
      email: data.email,
      password: data.password
    }).pipe(
      catchError(error => {
        console.error('Register error:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.clearAuthData();
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return false;
    
    // Verificar si el token ha expirado
    if (this.isTokenExpired()) {
      this.logout();
      return false;
    }
    
    return true;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  getUserInfoFromToken(): any {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        email: payload.email || payload.sub,
        role: payload.role || 'user',
        exp: payload.exp
      };
    } catch {
      return null;
    }
  }

  private saveAuthData(response: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    localStorage.setItem(this.ROLE_KEY, response.role);
    
    this.authStateSubject.next({
      isAuthenticated: true,
      user: response.user,
      token: response.token,
      role: response.role
    });
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    
    this.authStateSubject.next({
      isAuthenticated: false,
      user: null,
      token: null,
      role: null
    });
  }

  private isTokenExpired(): boolean {
    const tokenInfo = this.getUserInfoFromToken();
    if (!tokenInfo || !tokenInfo.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return tokenInfo.exp < currentTime;
  }

  private checkTokenExpiration(): void {
    // Verificar expiración del token cada 60 segundos
    setInterval(() => {
      if (this.isAuthenticated() && this.isTokenExpired()) {
        this.logout();
        window.location.href = '/';
      }
    }, 60000);
  }
}