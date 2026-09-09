export interface Sucursal {
  idSucursal?: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  usuarioCreacion?: number;
  usuarioModif?: number;
  fechaCreacion?: string | Date;
  fechaModif?: string | Date;
}