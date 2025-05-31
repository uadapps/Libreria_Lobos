// types/Empleado.ts

export interface Empleado {
  id_empleado: string;
  nombres: string;
  apellidos: string;
  correo: string;
  celular: string;
  id_fotografia: string;
  puesto: string;
  nombre_completo: string;
  paterno: string;
  materno: string;
  correo_institucional?: string;
  telefono?: string;
}
