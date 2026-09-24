export interface Sucursal {
  idSucursal?: number;
  nombre: string;
  direccion: string;
  telefono?: string;
  felNitEmisor?: string;
  felNombreEmisor?: string;
  felNombreComercial?: string;
  felCorreoEmisor?: string;
  felCodigoEstablecimiento?: string;
  felAfiliacionIva?: string;
  felDireccion?: string;
  felCodigoPostal?: string;
  felMunicipio?: string;
  felDepartamento?: string;
  felPais?: string;
  felTipoFrase?: string;
  felCodigoEscenario?: string;
  usuarioCreacion?: number;
  usuarioModif?: number;
  fechaCreacion?: string | Date;
  fechaModif?: string | Date;
}