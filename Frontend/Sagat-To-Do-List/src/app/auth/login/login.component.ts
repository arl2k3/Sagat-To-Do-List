import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { LoginRequest, RegisterRequest } from '../models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  isLoginMode = true;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  loginData: LoginRequest = {
    email: '',
    password: ''
  };

  registerData: RegisterRequest = {
    email: '',
    password: '',
    confirmPassword: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.clearMessages();
    this.clearForms();
  }

  onLogin() {
    if (!this.validateLoginForm()) return;

    this.isLoading = true;
    this.clearMessages();

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.router.navigate(['/tasks']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(error);
      }
    });
  }

  onRegister() {
    if (!this.validateRegisterForm()) return;

    this.isLoading = true;
    this.clearMessages();

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Usuario registrado exitosamente. Ahora puedes iniciar sesión.';
        this.isLoginMode = true;
        this.clearForms();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(error);
      }
    });
  }

  private validateLoginForm(): boolean {
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Por favor completa todos los campos.';
      return false;
    }

    if (!this.isValidEmail(this.loginData.email)) {
      this.errorMessage = 'Por favor ingresa un email válido.';
      return false;
    }

    return true;
  }

  private validateRegisterForm(): boolean {
    if (!this.registerData.email || !this.registerData.password || !this.registerData.confirmPassword) {
      this.errorMessage = 'Por favor completa todos los campos.';
      return false;
    }

    if (!this.isValidEmail(this.registerData.email)) {
      this.errorMessage = 'Por favor ingresa un email válido.';
      return false;
    }

    if (this.registerData.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      return false;
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return false;
    }

    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private getErrorMessage(error: any): string {
    if (error.error) {
      if (typeof error.error === 'string') {
        return error.error;
      } else if (error.error.message) {
        return error.error.message;
      } else if (Array.isArray(error.error)) {
        return error.error.join(', ');
      }
    }
    
    if (error.status === 401) {
      return 'Credenciales incorrectas.';
    } else if (error.status === 400) {
      return 'Datos inválidos. Verifica la información ingresada.';
    } else if (error.status === 500) {
      return 'Error del servidor. Inténtalo de nuevo más tarde.';
    }
    
    return 'Ha ocurrido un error. Inténtalo de nuevo.';
  }

  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private clearForms() {
    this.loginData = { email: '', password: '' };
    this.registerData = { email: '', password: '', confirmPassword: '' };
  }
}
