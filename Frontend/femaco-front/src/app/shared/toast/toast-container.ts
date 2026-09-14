import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      @for (toast of toasts(); track toast.id) {
        <div class="toast toast-{{ toast.type }}" role="alert">
          <div class="toast-header">
            <span class="toast-dot"></span>
            <strong>{{ toast.title }}</strong>
            <button type="button" class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Cerrar notificación">
              ×
            </button>
          </div>
          <div class="toast-body">
            <p>{{ toast.message }}</p>
            @if (toast.details.length > 0) {
              <ul class="toast-details">
                @for (detail of toast.details; track detail) {
                  <li>{{ detail }}</li>
                }
              </ul>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./toast-container.css']
})
export class ToastContainer {
  protected readonly toastService = inject(ToastService);
  protected readonly toasts = computed(() => this.toastService.toasts());
}
