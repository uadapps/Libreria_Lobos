// components/Roles/modals/DeleteRoleDialog.tsx
import { memo } from 'react';
import { SimpleConfirmDialog } from '@/components/ui/SimpleConfirmDialog';
import { Role } from '@/types/role.types';

interface DeleteRoleDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    selectedRole: Role | null;
}

export const DeleteRoleDialog = memo(({
    isOpen,
    onClose,
    onConfirm,
    selectedRole
}: DeleteRoleDialogProps) => (
    <SimpleConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={onConfirm}
        title="¿Estás absolutamente seguro?"
        type="danger"
        confirmText="Sí, eliminar rol"
        cancelText="Cancelar"
    >
        {selectedRole && (
            <div>
                Esta acción no se puede deshacer. Se eliminará permanentemente el rol
                <strong> "{selectedRole.name}"</strong> del sistema y no podrá ser recuperado.
                {selectedRole.users_count > 0 && (
                    <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-700 dark:bg-yellow-900/20">
                        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                            <span className="text-lg">⚠️</span>
                            <span className="font-semibold">Advertencia:</span>
                        </div>
                        <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                            Este rol tiene{' '}
                            <strong>
                                {selectedRole.users_count} usuario{selectedRole.users_count !== 1 ? 's' : ''}
                            </strong>{' '}
                            asignado{selectedRole.users_count !== 1 ? 's' : ''}. Debes reasignar estos usuarios a otro rol antes de
                            eliminar este.
                        </p>
                    </div>
                )}
            </div>
        )}
    </SimpleConfirmDialog>
));

DeleteRoleDialog.displayName = 'DeleteRoleDialog';
