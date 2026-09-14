import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  details: string[];
  duration: number;
  key: string;
}

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  details?: string[];
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastsSignal = signal<Toast[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  private nextId = 1;

  show(message: string, options: ToastOptions = {}): void {
    const type = options.type ?? 'info';
    const toast: Toast = {
      id: this.nextId++,
      type,
      title: options.title ?? this.getDefaultTitle(type),
      message,
      details: options.details ?? [],
      duration: options.duration ?? 5000,
      key: this.buildKey(message, options.details ?? [], type)
    };

    this.toastsSignal.update((current) => [...current, toast]);

    if (toast.duration > 0) {
      window.setTimeout(() => this.dismiss(toast.id), toast.duration);
    }
  }

  showUnique(message: string, options: ToastOptions = {}): void {
    const key = this.buildKey(message, options.details ?? [], options.type ?? 'info');

    if (this.toastsSignal().some((toast) => toast.key === key)) {
      return;
    }

    this.show(message, options);
  }

  dismiss(id: number): void {
    this.toastsSignal.update((current) => current.filter((toast) => toast.id !== id));
  }

  private buildKey(message: string, details: string[], type: ToastType): string {
    return `${type}:${message}:${details.join('|')}`;
  }

  private getDefaultTitle(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'Éxito';
      case 'warning':
        return 'Advertencia';
      case 'error':
        return 'Error';
      default:
        return 'Información';
    }
  }
}
