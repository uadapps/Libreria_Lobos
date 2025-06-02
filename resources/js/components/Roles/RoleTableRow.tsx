// components/Roles/RoleTableRow.tsx
import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import { Edit, Eye, MoreHorizontal, Shield, Trash2 } from 'lucide-react';
import { Role, RolePermissions } from '../../types/role.types';

interface RoleTableRowProps {
    role: Role;
    onView: (role: Role) => void;
    onEdit: (role: Role) => void;
    onDelete: (role: Role) => void;
    can: RolePermissions;
    getStatusColor: (count: number) => string;
}

export const RoleTableRow = memo(({
    role,
    onView,
    onEdit,
    onDelete,
    can,
    getStatusColor
}: RoleTableRowProps) => (
    <TableRow>
        <TableCell>
            <div className="flex items-center space-x-3">
                <div className="bg-primary/10 rounded-lg p-2">
                    <Shield className="text-primary h-4 w-4" />
                </div>
                <div>
                    <div className="font-medium">{role.name}</div>
                    <div className="text-muted-foreground text-sm">{role.guard_name}</div>
                </div>
            </div>
        </TableCell>
        <TableCell>
            <Badge variant="secondary" className={getStatusColor(role.users_count)}>
                {role.users_count} usuario{role.users_count !== 1 ? 's' : ''}
            </Badge>
        </TableCell>
        <TableCell>
            <Badge variant="outline" className="border-border text-foreground">
                {role.permissions.length} permiso{role.permissions.length !== 1 ? 's' : ''}
            </Badge>
        </TableCell>
        <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
        <TableCell className="text-right">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {can.ver && (
                        <DropdownMenuItem onClick={() => onView(role)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                        </DropdownMenuItem>
                    )}
                    {can.editar && (
                        <DropdownMenuItem onClick={() => onEdit(role)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                    )}
                    {can.eliminar && role.users_count === 0 && (
                        <DropdownMenuItem
                            onClick={() => onDelete(role)}
                            className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 dark:text-red-400"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </TableCell>
    </TableRow>
));

RoleTableRow.displayName = 'RoleTableRow';
