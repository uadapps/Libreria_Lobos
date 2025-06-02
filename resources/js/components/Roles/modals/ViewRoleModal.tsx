// components/Roles/modals/ViewRoleModal.tsx
import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormModal, FormSection } from '@/components/ui/FormModal';
import { Shield } from 'lucide-react';
import { Role, Permission } from '@/types/role.types';

interface ViewRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedRole: Role | null;
    groupedPermissions: Record<string, Permission[]>;
}

export const ViewRoleModal = memo(({
    isOpen,
    onClose,
    selectedRole,
    groupedPermissions
}: ViewRoleModalProps) => (
    <FormModal
        isOpen={isOpen}
        onClose={onClose}
        title="Detalles del Rol"
        subtitle="Información completa del rol seleccionado"
        maxWidth="xl"
        enableScroll={true}
        actions={
            <Button variant="outline" onClick={onClose}>
                Cerrar
            </Button>
        }
    >
        {selectedRole && (
            <>
                <FormSection
                    title="Información General"
                    description="Detalles básicos del rol"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Nombre
                                </label>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {selectedRole.name}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Guard
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {selectedRole.guard_name}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Usuarios Asignados
                                </label>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={selectedRole.users_count === 0 ? 'secondary' : 'default'}
                                        className="text-xs"
                                    >
                                        {selectedRole.users_count} usuario{selectedRole.users_count !== 1 ? 's' : ''}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Permisos
                                </label>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {selectedRole.permissions.length} permisos
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 border-t border-gray-200 pt-4 md:grid-cols-2 dark:border-zinc-700">
                        <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Fecha de Creación
                            </label>
                            <p className="text-gray-900 dark:text-white">
                                {new Date(selectedRole.created_at).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Última Actualización
                            </label>
                            <p className="text-gray-900 dark:text-white">
                                {new Date(selectedRole.updated_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </FormSection>

                <FormSection
                    title="Permisos Asignados"
                    description={`Este rol tiene ${selectedRole.permissions.length} permisos activos`}
                >
                    {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
                        const roleModulePermissions = modulePermissions.filter(p =>
                            selectedRole.permissions.includes(p.name)
                        );

                        if (roleModulePermissions.length === 0) return null;

                        return (
                            <div key={module} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-green-600" />
                                    <h4 className="font-semibold text-gray-900 capitalize dark:text-white">
                                        {module}
                                    </h4>
                                    <Badge variant="secondary" className="bg-green-100 text-xs text-green-800">
                                        {roleModulePermissions.length} de {modulePermissions.length}
                                    </Badge>
                                </div>
                                <div className="grid gap-2 pl-6 md:grid-cols-2">
                                    {roleModulePermissions.map((permission) => (
                                        <Badge key={permission.id} variant="outline" className="justify-start">
                                            ✓ {permission.name.split('.')[1] || permission.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {selectedRole.permissions.length === 0 && (
                        <div className="py-8 text-center">
                            <Shield className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                            <p className="text-gray-500 dark:text-gray-400">
                                Este rol no tiene permisos asignados
                            </p>
                        </div>
                    )}
                </FormSection>
            </>
        )}
    </FormModal>
));

ViewRoleModal.displayName = 'ViewRoleModal';
