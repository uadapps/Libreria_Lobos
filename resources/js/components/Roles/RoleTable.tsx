// components/Roles/RoleTable.tsx
import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RoleTableRow } from './RoleTableRow';
import { Role, RolePermissions } from '../../types/role.types';

interface RoleTableProps {
    roles: Role[];
    onView: (role: Role) => void;
    onEdit: (role: Role) => void;
    onDelete: (role: Role) => void;
    can: RolePermissions;
    getStatusColor: (count: number) => string;
}

export const RoleTable = memo(({
    roles,
    onView,
    onEdit,
    onDelete,
    can,
    getStatusColor
}: RoleTableProps) => (
    <Card>
        <CardHeader>
            <CardTitle>Roles del Sistema</CardTitle>
            <CardDescription>Lista de todos los roles disponibles en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Rol</TableHead>
                        <TableHead>Usuarios</TableHead>
                        <TableHead>Permisos</TableHead>
                        <TableHead>Creado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {roles.map((role) => (
                        <RoleTableRow
                            key={role.id}
                            role={role}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            can={can}
                            getStatusColor={getStatusColor}
                        />
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
));

RoleTable.displayName = 'RoleTable';
