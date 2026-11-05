export interface AreaArticulo {
  idAreaArticulo?: number;
  nombre: string;
  descripcion?: string;
  usuarioCreacion?: number;
  usuarioModif?: number;
  fechaCreacion?: string | Date;
  fechaModif?: string | Date;
}

export interface PageAreaArticulo {
  content: AreaArticulo[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}