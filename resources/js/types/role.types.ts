// types/role.types.ts
export interface Role {
    id: number;
    name: string;
    guard_name: string;
    users_count: number;
    permissions: string[];
    created_at: string;
    updated_at: string;
}

export interface Permission {
    id: number;
    name: string;
}

export interface RolePermissions {
    crear: boolean;
    editar: boolean;
    eliminar: boolean;
    ver: boolean;
}

export interface FormData {
    name: string;
    permissions: string[];
}

export type ModalType = 'create' | 'edit' | 'view' | 'delete';

export interface PageProps {
    errors?: Record<string, string>;
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}

export interface RoleStats {
    totalRoles: number;
    totalPermisos: number;
    usuariosAsignados: number;
    rolesActivos: number;
}
