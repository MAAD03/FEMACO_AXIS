import { HttpParams } from '@angular/common/http';

export function fechaIsoLocal(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseFechaLocal(iso: string): Date {
  const [y, m, d] = iso.substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function construirParams(
  valores: Record<string, string | number | null | undefined>
): HttpParams {
  let params = new HttpParams();
  Object.entries(valores).forEach(([clave, valor]) => {
    if (valor !== null && valor !== undefined && valor !== '') {
      params = params.set(clave, String(valor));
    }
  });
  return params;
}

export function etiquetaPeriodo(
  periodo: string,
  agrupacion: 'DIA' | 'SEMANA' | 'MES'
): string {
  const f = parseFechaLocal(periodo);
  const dd = String(f.getDate()).padStart(2, '0');
  const mm = String(f.getMonth() + 1).padStart(2, '0');
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  switch (agrupacion) {
    case 'MES':
      return `${meses[f.getMonth()]} ${f.getFullYear()}`;
    case 'SEMANA':
      return `Sem. ${dd}/${mm}`;
    default:
      return `${dd}/${mm}`;
  }
}
