// components/Roles/forms/PermissionGroup.tsx
import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield } from 'lucide-react';
import { Permission } from '@/types/role.types';

interface PermissionGroupProps {
    module: string;
    permissions: Permission[];
    selectedPermissions: string[];
    onPermissionChange: (permissionName: string, checked: boolean) => void;
    mode: 'create' | 'edit';
}

export const PermissionGroup = memo(({
    module,
    permissions,
    selectedPermissions,
    onPermissionChange,
    mode
}: PermissionGroupProps) => (
    <div className="space-y-3">
        <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <h4 className="font-semibold text-gray-900 capitalize dark:text-white">{module}</h4>
            <Badge variant="outline" className="text-xs">
                {mode === 'edit'
                    ? `${permissions.filter(p => selectedPermissions.includes(p.name)).length}/${permissions.length}`
                    : `${permissions.length} permisos`
                }
            </Badge>
        </div>
        <div className="space-y-2 pl-6">
            {permissions.map((permission) => (
                <div key={permission.id} className="flex items-center space-x-3">
                    <Checkbox
                        id={`${mode}-${permission.id}`}
                        checked={selectedPermissions.includes(permission.name)}
                        onCheckedChange={(checked) => onPermissionChange(permission.name, checked as boolean)}
                    />
                    <label
                        htmlFor={`${mode}-${permission.id}`}
                        className="flex-1 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
                    >
                        {permission.name.split('.')[1] || permission.name}
                    </label>
                </div>
            ))}
        </div>
    </div>
));

PermissionGroup.displayName = 'PermissionGroup';
