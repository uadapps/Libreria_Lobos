// components/Roles/modals/EditRoleModal.tsx
import { memo } from 'react';
import { FormActions, FormField, FormModal, FormSection } from '@/components/ui/FormModal';
import { Input } from '@/components/ui/input';
import { PermissionGroup } from '../forms/PermissionGroup';
import { FormData, Permission } from '@/types/role.types';

interface EditRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: FormData;
    onFormDataChange: (field: keyof FormData, value: any) => void;
    onPermissionChange: (permissionName: string, checked: boolean) => void;
    onSubmit: () => void;
    isLoading: boolean;
    groupedPermissions: Record<string, Permission[]>;
}

export const EditRoleModal = memo(({
    isOpen,
    onClose,
    formData,
    onFormDataChange,
    onPermissionChange,
    onSubmit,
    isLoading,
    groupedPermissions
}: EditRoleModalProps) => (
    <FormModal
        isOpen={isOpen}
        onClose={onClose}
        title="Editar Rol"
        subtitle="Modifica el rol y sus permisos asignados"
        maxWidth="2xl"
        actions={
            <FormActions
                onCancel={onClose}
                onSubmit={onSubmit}
                submitText="Actualizar Rol"
                isLoading={isLoading}
                submitVariant="default"
            />
        }
    >
        <FormSection>
            <FormField
                label="Nombre del Rol"
                required
                description="Modifica el nombre del rol si es necesario"
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
            description="Ajusta los permisos asignados a este rol"
        >
            <div className="grid gap-6 md:grid-cols-2">
                {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                    <PermissionGroup
                        key={module}
                        module={module}
                        permissions={modulePermissions}
                        selectedPermissions={formData.permissions}
                        onPermissionChange={onPermissionChange}
                        mode="edit"
                    />
                ))}
            </div>
        </FormSection>
    </FormModal>
));

EditRoleModal.displayName = 'EditRoleModal';
