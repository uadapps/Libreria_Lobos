// pages/Roles/Index.tsx
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

// Importar componentes modulares
import { useRoles } from '@/hooks/useRoles';
import { RoleStatsCards } from '@/components/Roles/RoleStatsCards';
import { RoleFilters } from '@/components/Roles/RoleFilters';
import { RoleTable } from '@/components/Roles/RoleTable';
import { CreateRoleModal } from '@/components/Roles/modals/CreateRoleModal';
import { EditRoleModal } from '@/components/Roles/modals/EditRoleModal';
import { ViewRoleModal } from '@/components/Roles/modals/ViewRoleModal';
import { DeleteRoleDialog } from '@/components/Roles/modals/DeleteRoleDialog';

// Tipos
import { Role, Permission, RolePermissions, FormData } from '@/types/role.types';

interface Props {
    roles: Role[];
    permissions: Permission[];
    can: RolePermissions;
}

export default function RolesIndex({ roles, permissions, can }: Props) {
    const {
        searchTerm,
        setSearchTerm,
        selectedRole,
        isLoading,
        modals,
        formData,
        setFormData,
        filteredRoles,
        stats,
        openModal,
        closeModal,
        makeRequest,
    } = useRoles(roles);

    // Permisos agrupados memoizados
    const groupedPermissions = useMemo(() =>
        permissions.reduce((acc, permission) => {
            const [module] = permission.name.split('.');
            if (!acc[module]) acc[module] = [];
            acc[module].push(permission);
            return acc;
        }, {} as Record<string, Permission[]>),
        [permissions]
    );

    // Manejadores optimizados
    const handleFormDataChange = useCallback((field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, [setFormData]);

    const handlePermissionChange = useCallback((permissionName: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            permissions: checked
                ? [...prev.permissions, permissionName]
                : prev.permissions.filter(p => p !== permissionName),
        }));
    }, [setFormData]);

    const getStatusColor = useCallback((usersCount: number) => {
        if (usersCount === 0) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
        if (usersCount <= 5) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        if (usersCount <= 15) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }, []);

    // Acciones específicas
    const handleCreate = useCallback(() => {
        if (!formData.name.trim()) {
            toast.error('El nombre del rol es requerido', {
                position: 'top-right',
                autoClose: 3000,
            });
            return;
        }
        makeRequest('post', '/roles', formData, '¡Rol creado exitosamente!');
    }, [formData, makeRequest]);

    const handleEdit = useCallback(() => {
        if (!selectedRole || !formData.name.trim()) {
            toast.error('Datos incompletos para actualizar el rol', {
                position: 'top-right',
                autoClose: 3000,
            });
            return;
        }
        makeRequest(
            'put',
            `/roles/${selectedRole.id}`,
            formData,
            `¡Rol "${formData.name}" actualizado exitosamente!`
        );
    }, [selectedRole, formData, makeRequest]);

    const handleDelete = useCallback(() => {
        if (!selectedRole) return;
        makeRequest(
            'delete',
            `/roles/${selectedRole.id}`,
            undefined,
            `¡Rol "${selectedRole.name}" eliminado exitosamente!`
        );
    }, [selectedRole, makeRequest]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(() => [
        { title: 'Usuarios y Roles', href: '/usuarios' },
        { title: 'Roles', href: '/roles/gestion' },
    ], []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Roles" />

            <div className="space-y-6 px-6 py-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Roles y Permisos</h1>
                        <p className="text-muted-foreground">Gestiona los roles y permisos del sistema</p>
                    </div>
                    {can.crear && (
                        <Button
                            onClick={() => openModal('create')}
                            className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Rol
                        </Button>
                    )}
                </div>

                {/* Stats Cards */}
                <RoleStatsCards
                    totalRoles={stats.totalRoles}
                    totalPermisos={permissions.length}
                    usuariosAsignados={stats.usuariosAsignados}
                    rolesActivos={stats.rolesActivos}
                />

                {/* Filters */}
                <RoleFilters
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                />

                {/* Roles Table */}
                <RoleTable
                    roles={filteredRoles}
                    onView={(role) => openModal('view', role)}
                    onEdit={(role) => openModal('edit', role)}
                    onDelete={(role) => openModal('delete', role)}
                    can={can}
                    getStatusColor={getStatusColor}
                />

                {/* Modales */}
                <CreateRoleModal
                    isOpen={modals.create}
                    onClose={() => closeModal('create')}
                    formData={formData}
                    onFormDataChange={handleFormDataChange}
                    onPermissionChange={handlePermissionChange}
                    onSubmit={handleCreate}
                    isLoading={isLoading}
                    groupedPermissions={groupedPermissions}
                />

                <EditRoleModal
                    isOpen={modals.edit}
                    onClose={() => closeModal('edit')}
                    formData={formData}
                    onFormDataChange={handleFormDataChange}
                    onPermissionChange={handlePermissionChange}
                    onSubmit={handleEdit}
                    isLoading={isLoading}
                    groupedPermissions={groupedPermissions}
                />

                <ViewRoleModal
                    isOpen={modals.view}
                    onClose={() => closeModal('view')}
                    selectedRole={selectedRole}
                    groupedPermissions={groupedPermissions}
                />

                <DeleteRoleDialog
                    isOpen={modals.delete}
                    onClose={() => closeModal('delete')}
                    onConfirm={handleDelete}
                    selectedRole={selectedRole}
                />
            </div>

            {/* Toast Container */}
            <ToastContainer
                position="top-center"
                autoClose={3000}
                hideProgressBar={false}
                closeOnClick
                pauseOnHover
                theme="colored"
                style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'auto',
                    right: 'auto',
                }}
            />
        </AppLayout>
    );
}
