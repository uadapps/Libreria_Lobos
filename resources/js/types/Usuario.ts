// types/Usuario.ts

export interface UsuarioFormData {
    id: string;
    id_empleado: string;
    nombres: string;
    apellidos: string;
    username: string;
    email: string;
    mobile: string;
    password: string;
    password_confirmation: string;
    id_fotografia: string;
    puesto: string;
    role_id: number;
    [key: string]: string | number; // Index signature added
}
export type UsuarioFormErrors = Partial<Record<keyof UsuarioFormData, string>>;

export interface Usuario {
  role_name: string;
  id: number;
  id_empleado: string;
  nombres: string;
  apellidos: string;
  username: string;
  email: string;
  mobile?: string;
  role_id: number;
  visible: boolean;
  status: boolean;
  created_at?: string;
  updated_at?: string;
}
