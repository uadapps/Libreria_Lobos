// components/Roles/modals/CreateRoleModal.tsx
import { memo } from 'react';
import { FormActions, FormField, FormModal, FormSection } from '@/components/ui/FormModal';
import { Input } from '@/components/ui/input';
import { PermissionGroup } from '../forms/PermissionGroup';
import { FormData, Permission } from '@/types/role.types';

interface CreateRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: FormData;
    onFormDataChange: (field: keyof FormData, value: any) => void;
    onPermissionChange: (permissionName: string, checked: boolean) => void;
    onSubmit: () => void;
    isLoading: boolean;
    groupedPermissions: Record<string, Permission[]>;
}

export const CreateRoleModal = memo(({
    isOpen,
    onClose,
    formData,
    onFormDataChange,
    onPermissionChange,
    onSubmit,
    isLoading,
    groupedPermissions
}: CreateRoleModalProps) => (
    <FormModal
        isOpen={isOpen}
        onClose={onClose}
        title="Crear Nuevo Rol"
        subtitle="Define un nuevo rol y asigna los permisos correspondientes"
        maxWidth="2xl"
        actions={
            <FormActions
                onCancel={onClose}
                onSubmit={onSubmit}
                submitText="Crear Rol"
                isLoading={isLoading}
                submitVariant="success"
            />
        }
    >
        <FormSection>
            <FormField
                label="Nombre del Rol"
                required
                description="Ingresa un nombre descriptivo para el rol"
            >
                <Input
                    value={formData.name}
                    onChange={(e) => onFormDataChange('name', e.target.value)}
                    placeholder="Ej: Administrador, Editor, Moderador..."
                    className="w-full"
                />
            </FormField>
        </FormSection>

        <FormSection
            title="Permisos del Sistema"
            description="Selecciona los permisos que tendrá este rol"
        >
            <div className="grid gap-6 md:grid-cols-2">
                {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                    <PermissionGroup
                        key={module}
                        module={module}
                        permissions={modulePermissions}
                        selectedPermissions={formData.permissions}
                        onPermissionChange={onPermissionChange}
                        mode="create"
                    />
                ))}
            </div>

            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>Tip:</strong> Puedes modificar los permisos más tarde editando el rol.
                </p>
            </div>
        </FormSection>
    </FormModal>
));

CreateRoleModal.displayName = 'CreateRoleModal';
