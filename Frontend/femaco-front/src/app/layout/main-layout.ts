import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../shared/sidebar/sidebar';
import { ConjuntoMenuService } from '../core/services/conjunto-menu.service';
import { AuthService } from '../core/services/auth.service';
import { CacheLoaderService } from '../core/services/cache-loader.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
    }

    .main-content {
      margin-left: 280px;
      flex: 1;
      background: linear-gradient(180deg, var(--crud-bg-light) 0%, #f4f7ea 100%);
      min-height: 100vh;
      transition: margin-left 0.3s ease;
    }

  `]
})
export class MainLayout implements OnInit {
  private conjuntoMenuService = inject(ConjuntoMenuService);
  private authService = inject(AuthService);
  private cacheLoaderService = inject(CacheLoaderService);

  ngOnInit(): void {
    if (this.authService.isAuthenticated() && this.conjuntoMenuService.getMenuActual().length === 0) {
      this.conjuntoMenuService.cargarMenu().subscribe({
        error: () => {
          this.authService.logout();
        }
      });
    }

    if (this.authService.isAuthenticated()) {
      this.cacheLoaderService.loadAll().subscribe();
    }
  }
}