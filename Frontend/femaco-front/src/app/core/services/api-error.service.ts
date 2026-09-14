import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { ApiErrorResponse, NormalizedApiError } from '../models/api-error.model';

@Injectable({
  providedIn: 'root'
})
export class ApiErrorService {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  normalizeError(error: unknown): NormalizedApiError {
    const httpError = error as HttpErrorResponse;
    const rawError: Partial<ApiErrorResponse> = (httpError?.error && typeof httpError.error === 'object')
      ? (httpError.error as Partial<ApiErrorResponse>)
      : {};

    const status = httpError?.status ?? rawError.status ?? 500;
    const details: string[] = Array.isArray(rawError.messages)
      ? rawError.messages.filter((message: string): message is string => typeof message === 'string' && message.trim().length > 0)
      : [];

    const primaryMessage = typeof rawError.message === 'string' && rawError.message.trim().length > 0
      ? rawError.message
      : typeof rawError.error === 'string' && rawError.error.trim().length > 0
        ? rawError.error
        : this.getFallbackMessage(status);

    return {
      status,
      error: typeof rawError.error === 'string' ? rawError.error : httpError?.name ?? 'Error',
      message: primaryMessage,
      messages: details,
      timestamp: rawError.timestamp,
      path: rawError.path,
      userMessage: this.getUserMessage(status, primaryMessage),
      details,
      friendlyTitle: this.getFriendlyTitle(status)
    };
  }

  handleHttpError(error: unknown): Observable<never> {
    const normalized = this.normalizeError(error);
    this.showNotification(normalized);
    return throwError(() => normalized);
  }

  getUserMessage(status: number, fallbackMessage?: string): string {
    switch (status) {
      case 400:
        return fallbackMessage ?? 'La solicitud no es válida.';
      case 401:
        return 'Tu sesión expiró.';
      case 404:
        return 'Recurso no encontrado.';
      case 500:
        return 'Ocurrió un error inesperado. Intenta nuevamente.';
      default:
        return fallbackMessage ?? 'Ocurrió un error inesperado. Intenta nuevamente.';
    }
  }

  private showNotification(error: NormalizedApiError): void {
    switch (error.status) {
      case 401:
        this.authService.logout();
        this.toastService.showUnique('Tu sesión expiró.', {
          type: 'warning',
          title: 'Sesión expirada'
        });
        return;

      case 404:
        this.toastService.showUnique(error.userMessage, {
          type: 'warning',
          title: 'No encontrado'
        });
        return;

      case 400:
        this.toastService.showUnique(error.userMessage, {
          type: 'error',
          title: 'Validación',
          details: error.details.length > 0 ? error.details : undefined
        });
        return;

      case 500:
        this.toastService.showUnique(this.getUserMessage(error.status), {
          type: 'error',
          title: 'Error del servidor'
        });
        return;

      default:
        this.toastService.showUnique(error.userMessage, {
          type: 'error',
          title: error.friendlyTitle,
          details: error.details.length > 0 ? error.details : undefined
        });
    }
  }

  private getFallbackMessage(status: number): string {
    switch (status) {
      case 400:
        return 'La solicitud no es válida.';
      case 401:
        return 'Tu sesión expiró.';
      case 404:
        return 'Recurso no encontrado.';
      case 500:
        return 'Ocurrió un error inesperado. Intenta nuevamente.';
      default:
        return 'Ocurrió un error inesperado. Intenta nuevamente.';
    }
  }

  private getFriendlyTitle(status: number): string {
    switch (status) {
      case 400:
        return 'Validación';
      case 401:
        return 'Sesión expirada';
      case 404:
        return 'No encontrado';
      case 500:
        return 'Error del servidor';
      default:
        return 'Error';
    }
  }
}
