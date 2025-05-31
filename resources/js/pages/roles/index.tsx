import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FormActions, FormField, FormModal, FormSection } from '@/components/ui/FormModal';
import { Input } from '@/components/ui/input';
import { SimpleConfirmDialog } from '@/components/ui/SimpleConfirmDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Edit, Eye, MoreHorizontal, Plus, Search, Shield, Trash2, UserCheck, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Role {
    id: number;
    name: string;
    guard_name: string;
    users_count: number;
    permissions: string[];
    created_at: string;
    updated_at: string;
}

interface Permission {
    id: number;
    name: string;
}

interface Props {
    roles: Role[];
    permissions: Permission[];
    can: {
        crear: boolean;
        editar: boolean;
        eliminar: boolean;
        ver: boolean;
    };
}

interface PageProps {
    errors?: Record<string, string>;
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown; // Add index signature to satisfy Inertia's PageProps constraint
}

export default function Roles({ roles, permissions, can }: Props) {
    const { props } = usePage<PageProps>();
    const [searchTerm, setSearchTerm] = useState('');
    const [modals, setModals] = useState({
        create: false,
        edit: false,
        view: false,
        delete: false,
    });
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Estados del formulario
    const [formData, setFormData] = useState({
        name: '',
        permissions: [] as string[],
    });

    // Manejar mensajes flash
    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success, {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        }

        if (props.flash?.error) {
            toast.error(props.flash.error, {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        }

        // Manejar errores de validación
        if (props.errors && Object.keys(props.errors).length > 0) {
            Object.entries(props.errors).forEach(([field, message]) => {
                toast.error(`${field}: ${message}`, {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
            });
        }
    }, [props.flash, props.errors]);

    // Limpiar estados cuando se cierre cualquier modal
    useEffect(() => {
        if (!Object.values(modals).some(Boolean)) {
            setTimeout(() => {
                setSelectedRole(null);
                setFormData({ name: '', permissions: [] });
                setIsLoading(false);
            }, 150);
        }
    }, [modals]);

    const filteredRoles = roles.filter((role) => role.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const closeModal = useCallback((modalName: keyof typeof modals) => {
        setModals((prev) => ({ ...prev, [modalName]: false }));
    }, []);

    const openModal = useCallback((modalName: keyof typeof modals, role?: Role) => {
        if (role) {
            setSelectedRole(role);
            if (modalName === 'edit') {
                setFormData({
                    name: role.name,
                    permissions: role.permissions,
                });
            }
        } else if (modalName === 'create') {
            setFormData({ name: '', permissions: [] });
            setSelectedRole(null);
        }

        setModals({
            create: modalName === 'create',
            edit: modalName === 'edit',
            view: modalName === 'view',
            delete: modalName === 'delete',
        });
    }, []);

    const handleCreate = useCallback(() => {
        if (!formData.name.trim()) {
            toast.error('El nombre del rol es requerido', {
                position: 'top-right',
                autoClose: 3000,
            });
            return;
        }

        setIsLoading(true);

        // Mostrar toast de carga
        const loadingToast = toast.loading('Creando rol...', {
            position: 'top-right',
        });

        router.post('/roles', formData, {
            onSuccess: () => {
                toast.dismiss(loadingToast);
                toast.success('¡Rol creado exitosamente!', {
                    position: 'top-right',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                closeModal('create');
            },
            onError: () => {
                toast.dismiss(loadingToast);
                // Los errores se manejan en el useEffect de arriba
                setIsLoading(false);
            },
            onFinish: () => {
                toast.dismiss(loadingToast);
                setIsLoading(false);
            },
        });
    }, [formData, closeModal]);

    const handleEdit = useCallback(() => {
        if (!selectedRole || !formData.name.trim()) {
            toast.error('Datos incompletos para actualizar el rol', {
                position: 'top-right',
                autoClose: 3000,
            });
            return;
        }

        setIsLoading(true);

        // Mostrar toast de carga
        const loadingToast = toast.loading('Actualizando rol...', {
            position: 'top-right',
        });

        router.put(`/roles/${selectedRole.id}`, formData, {
            onSuccess: () => {
                toast.dismiss(loadingToast);
                toast.success(`¡Rol "${formData.name}" actualizado exitosamente!`, {
                    position: 'top-right',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                closeModal('edit');
            },
            onError: () => {
                toast.dismiss(loadingToast);
                // Los errores se manejan en el useEffect de arriba
                setIsLoading(false);
            },
            onFinish: () => {
                toast.dismiss(loadingToast);
                setIsLoading(false);
            },
        });
    }, [selectedRole, formData, closeModal]);

    const handleDelete = useCallback(() => {
        if (!selectedRole) return;

        // Mostrar toast de carga
        const loadingToast = toast.loading('Eliminando rol...', {
            position: 'top-right',
        });

        router.delete(`/roles/${selectedRole.id}`, {
            onSuccess: () => {
                toast.dismiss(loadingToast);
                toast.success(`¡Rol "${selectedRole.name}" eliminado exitosamente!`, {
                    position: 'top-right',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                closeModal('delete');
            },
            onError: () => {
                toast.dismiss(loadingToast);
                // Los errores se manejan en el useEffect de arriba
            },
            onFinish: () => {
                toast.dismiss(loadingToast);
            },
        });
    }, [selectedRole, closeModal]);

    const handlePermissionChange = useCallback((permissionName: string, checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            permissions: checked ? [...prev.permissions, permissionName] : prev.permissions.filter((p) => p !== permissionName),
        }));
    }, []);

    const groupedPermissions = permissions.reduce(
        (acc, permission) => {
            const [module] = permission.name.split('.');
            if (!acc[module]) acc[module] = [];
            acc[module].push(permission);
            return acc;
        },
        {} as Record<string, Permission[]>,
    );

    const getStatusColor = (usersCount: number) => {
        if (usersCount === 0) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
        if (usersCount <= 5) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        if (usersCount <= 15) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Usuarios y Roles',
            href: '/usuarios',
        },
        {
            title: 'Roles',
            href: '/roles/gestion',
        },
    ];

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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
                            <Shield className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{roles.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Permisos</CardTitle>
                            <Shield className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{permissions.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Usuarios Asignados</CardTitle>
                            <Users className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{roles.reduce((sum, role) => sum + Number(role.users_count), 0)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Roles Activos</CardTitle>
                            <UserCheck className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{roles.filter((role) => role.users_count > 0).length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filtros</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <Search className="text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Buscar roles..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Roles Table */}
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
                                {filteredRoles.map((role) => (
                                    <TableRow key={role.id}>
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
                                                        <DropdownMenuItem onClick={() => openModal('view', role)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Ver detalles
                                                        </DropdownMenuItem>
                                                    )}
                                                    {can.editar && (
                                                        <DropdownMenuItem onClick={() => openModal('edit', role)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                    )}
                                                    {can.eliminar && role.users_count === 0 && (
                                                        <DropdownMenuItem
                                                            onClick={() => openModal('delete', role)}
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
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Create Modal */}
                <FormModal
                    isOpen={modals.create}
                    onClose={() => closeModal('create')}
                    title="Crear Nuevo Rol"
                    subtitle="Define un nuevo rol y asigna los permisos correspondientes"
                    maxWidth="2xl"
                    actions={
                        <FormActions
                            onCancel={() => closeModal('create')}
                            onSubmit={handleCreate}
                            submitText="Crear Rol"
                            isLoading={isLoading}
                            submitVariant="success"
                        />
                    }
                >
                    <FormSection>
                        <FormField label="Nombre del Rol" required description="Ingresa un nombre descriptivo para el rol">
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="Ej: Administrador, Editor, Moderador..."
                                className="w-full"
                            />
                        </FormField>
                    </FormSection>

                    <FormSection title="Permisos del Sistema" description="Selecciona los permisos que tendrá este rol">
                        <div className="grid gap-6 md:grid-cols-2">
                            {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                                <div key={module} className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-blue-600" />
                                        <h4 className="font-semibold text-gray-900 capitalize dark:text-white">{module}</h4>
                                        <Badge variant="outline" className="text-xs">
                                            {modulePermissions.length} permisos
                                        </Badge>
                                    </div>
                                    <div className="space-y-2 pl-6">
                                        {modulePermissions.map((permission) => (
                                            <div key={permission.id} className="flex items-center space-x-3">
                                                <Checkbox
                                                    id={`create-${permission.id}`}
                                                    checked={formData.permissions.includes(permission.name)}
                                                    onCheckedChange={(checked) => handlePermissionChange(permission.name, checked as boolean)}
                                                />
                                                <label
                                                    htmlFor={`create-${permission.id}`}
                                                    className="flex-1 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
                                                >
                                                    {permission.name.split('.')[1] || permission.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                💡 <strong>Tip:</strong> Puedes modificar los permisos más tarde editando el rol.
                            </p>
                        </div>
                    </FormSection>
                </FormModal>

                {/* Edit Modal */}
                <FormModal
                    isOpen={modals.edit}
                    onClose={() => closeModal('edit')}
                    title="Editar Rol"
                    subtitle="Modifica el rol y sus permisos asignados"
                    maxWidth="2xl"
                    actions={
                        <FormActions
                            onCancel={() => closeModal('edit')}
                            onSubmit={handleEdit}
                            submitText="Actualizar Rol"
                            isLoading={isLoading}
                            submitVariant="default"
                        />
                    }
                >
                    <FormSection>
                        <FormField label="Nombre del Rol" required description="Modifica el nombre del rol si es necesario">
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="Ej: Administrador, Editor, Moderador..."
                                className="w-full"
                            />
                        </FormField>
                    </FormSection>

                    <FormSection title="Permisos del Sistema" description="Ajusta los permisos asignados a este rol">
                        <div className="grid gap-6 md:grid-cols-2">
                            {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                                <div key={module} className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-blue-600" />
                                        <h4 className="font-semibold text-gray-900 capitalize dark:text-white">{module}</h4>
                                        <Badge variant="outline" className="text-xs">
                                            {modulePermissions.filter((p) => formData.permissions.includes(p.name)).length}/{modulePermissions.length}
                                        </Badge>
                                    </div>
                                    <div className="space-y-2 pl-6">
                                        {modulePermissions.map((permission) => (
                                            <div key={permission.id} className="flex items-center space-x-3">
                                                <Checkbox
                                                    id={`edit-${permission.id}`}
                                                    checked={formData.permissions.includes(permission.name)}
                                                    onCheckedChange={(checked) => handlePermissionChange(permission.name, checked as boolean)}
                                                />
                                                <label
                                                    htmlFor={`edit-${permission.id}`}
                                                    className="flex-1 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
                                                >
                                                    {permission.name.split('.')[1] || permission.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </FormSection>
                </FormModal>

                {/* View Modal */}
                <FormModal
                    isOpen={modals.view}
                    onClose={() => closeModal('view')}
                    title="Detalles del Rol"
                    subtitle="Información completa del rol seleccionado"
                    maxWidth="xl"
                    enableScroll={true}
                    actions={
                        <Button variant="outline" onClick={() => closeModal('view')}>
                            Cerrar
                        </Button>
                    }
                >
                    {selectedRole && (
                        <>
                            <FormSection title="Información General" description="Detalles básicos del rol">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre</label>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedRole.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Guard</label>
                                            <p className="text-gray-900 dark:text-white">{selectedRole.guard_name}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Usuarios Asignados</label>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={selectedRole.users_count === 0 ? 'secondary' : 'default'} className="text-xs">
                                                    {selectedRole.users_count} usuario{selectedRole.users_count !== 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Permisos</label>
                                            <p className="font-semibold text-gray-900 dark:text-white">{selectedRole.permissions.length} permisos</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4 border-t border-gray-200 pt-4 md:grid-cols-2 dark:border-zinc-700">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha de Creación</label>
                                        <p className="text-gray-900 dark:text-white">{new Date(selectedRole.created_at).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Última Actualización</label>
                                        <p className="text-gray-900 dark:text-white">{new Date(selectedRole.updated_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </FormSection>

                            <FormSection
                                title="Permisos Asignados"
                                description={`Este rol tiene ${selectedRole.permissions.length} permisos activos`}
                            >
                                {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
                                    const roleModulePermissions = modulePermissions.filter((p) => selectedRole.permissions.includes(p.name));

                                    if (roleModulePermissions.length === 0) return null;

                                    return (
                                        <div key={module} className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-green-600" />
                                                <h4 className="font-semibold text-gray-900 capitalize dark:text-white">{module}</h4>
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
                                        <p className="text-gray-500 dark:text-gray-400">Este rol no tiene permisos asignados</p>
                                    </div>
                                )}
                            </FormSection>
                        </>
                    )}
                </FormModal>

                {/* Delete Confirmation Dialog */}
                <SimpleConfirmDialog
                    isOpen={modals.delete}
                    onClose={() => closeModal('delete')}
                    onConfirm={handleDelete}
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
            </div>
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
