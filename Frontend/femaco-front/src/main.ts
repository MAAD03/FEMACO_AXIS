import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { API_BASE_URL } from './app/core/config/api.config';

interface RuntimeConfig {
  apiBaseUrl: string;
}

const defaultConfig: RuntimeConfig = {
  apiBaseUrl: 'http://localhost:8080',
};

fetch('/config.json', { cache: 'no-store' })
  .then(async (response): Promise<RuntimeConfig> => {
    if (!response.ok) {
      throw new Error(`No se pudo cargar /config.json: HTTP ${response.status}`);
    }

    const config: unknown = await response.json();
    if (
      typeof config !== 'object' ||
      config === null ||
      !('apiBaseUrl' in config) ||
      typeof config.apiBaseUrl !== 'string' ||
      config.apiBaseUrl.trim() === ''
    ) {
      throw new Error('El archivo /config.json debe definir una apiBaseUrl válida');
    }

    return { apiBaseUrl: config.apiBaseUrl };
  })
  .catch((error: unknown) => {
    console.warn('Se usará la URL de API predeterminada.', error);
    return defaultConfig;
  })
  .then((config) =>
    bootstrapApplication(App, {
      ...appConfig,
      providers: [
        ...(appConfig.providers ?? []),
        { provide: API_BASE_URL, useValue: config.apiBaseUrl },
      ],
    }),
  )
  .catch((error: unknown) => console.error(error));
