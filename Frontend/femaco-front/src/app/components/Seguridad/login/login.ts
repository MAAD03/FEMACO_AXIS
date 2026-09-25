import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { CambioPasswordRequest, LoginApiError, LoginRequest } from '../../../core/models/auth.model';
import { ConjuntoMenuService } from '../../../core/services/conjunto-menu.service';
import { CacheLoaderService } from '../../../core/services/cache-loader.service';

function passwordsMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const nuevaPassword = control.get('nuevaPassword')?.value;
    const confirmarPassword = control.get('confirmarPassword')?.value;
    return nuevaPassword && confirmarPassword && nuevaPassword !== confirmarPassword
      ? { passwordsMismatch: true }
      : null;
  };
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private conjuntoMenuService = inject(ConjuntoMenuService);
  private cacheLoaderService = inject(CacheLoaderService);
  private cdr = inject(ChangeDetectorRef);

  loginForm: FormGroup = this.fb.group({
    correoElectronico: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  cambioPasswordForm: FormGroup = this.fb.group({
    nuevaPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmarPassword: ['', [Validators.required]]
  }, { validators: passwordsMatchValidator() });

  mostrarCambioPassword = false;
  correoCambioPassword = '';
  mostrarPassword = false;
  mostrarNuevaPassword = false;
  mostrarConfirmarPassword = false;

  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const credentials: LoginRequest = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: () => this.cargarMenuYRedirigir(),
      error: (err: LoginApiError) => {
        this.isLoading = false;
        this.mostrarErrorLogin(err, credentials.correoElectronico);
        this.cdr.markForCheck();
      }
    });
  }

  private cargarMenuYRedirigir(): void {
    this.conjuntoMenuService.cargarMenu().subscribe({
      next: () => {
        this.cacheLoaderService.loadAll().subscribe({
          next: () => {
            this.isLoading = false;
            this.router.navigate(['/dashboard']);
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoading = false;
            this.router.navigate(['/dashboard']);
            this.cdr.markForCheck();
          }
        });
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Error al cargar el menú. Intenta de nuevo.';
        this.authService.logout();
        this.cdr.markForCheck();
      }
    });
  }

  private mostrarErrorLogin(err: LoginApiError, correoElectronico: string): void {
    if (err?.requiereCambioPassword) {
      this.correoCambioPassword = correoElectronico;
      this.mostrarCambioPassword = true;
      this.errorMessage = err.motivo || 'Debes cambiar tu contraseña para continuar.';
      return;
    }

    const intentos = typeof err?.intentosFallidos === 'number' && err.intentosFallidos > 0
      ? ` Intentos fallidos: ${err.intentosFallidos}.`
      : '';
    const mensaje = err?.mensaje || err?.motivo || 'Error al iniciar sesión. Intenta de nuevo.';
    this.errorMessage = `${mensaje}${intentos}`;
  }

  onSubmitCambioPassword(): void {
    if (this.cambioPasswordForm.invalid) {
      this.cambioPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const request: CambioPasswordRequest = {
      correoElectronico: this.correoCambioPassword,
      nuevaPassword: this.cambioPasswordForm.value.nuevaPassword
    };

    this.authService.cambiarPassword(request).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.volverALogin(res?.mensaje || 'Contraseña actualizada correctamente');
        this.cdr.markForCheck();
      },
      error: (err: LoginApiError) => {
        this.isLoading = false;
        this.errorMessage = err?.mensaje || err?.motivo || 'No se pudo actualizar la contraseña. Intenta de nuevo.';
        this.cdr.markForCheck();
      }
    });
  }

  cancelarCambioPassword(): void {
    this.volverALogin();
  }

  private volverALogin(mensaje?: string): void {
    this.mostrarCambioPassword = false;
    this.correoCambioPassword = '';
    this.cambioPasswordForm.reset();
    this.loginForm.reset();
    this.errorMessage = null;
    this.successMessage = mensaje ?? null;
  }
}