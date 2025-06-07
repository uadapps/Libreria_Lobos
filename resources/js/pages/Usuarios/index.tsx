import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SimpleModal } from '@/components/ui/SimpleModal'; // Tu modal personalizado
import Form from '@/components/usuarios/Form';
import ConfirmDialog from '@/components/usuarios/Form/ConfirmDialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import type { Usuario } from '@/types/Usuario';
import { closestCenter, DndContext, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Head, router, usePage } from '@inertiajs/react';
import { Copy, GripVertical, MoreVertical, Pencil, Plus, ToggleLeft, ToggleRight, Trash } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type PageProps = {
    auth?: {
        permissions?: string[];
    };
    [key: string]: any;
};

interface UsuariosIndexProps {
    usuarios: {
        data: Usuario[];
        current_page: number;
        last_page: number;
        prev_page_url?: string;
        next_page_url?: string;
    };
    links?: unknown;
}

function SortableRow({ usuario, children }: { usuario: Usuario; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: usuario.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    return (
        <tr ref={setNodeRef} style={style} {...attributes}>
            <td {...listeners} className="cursor-grab">
                <GripVertical className="h-4 w-4" />
            </td>
            {children}
        </tr>
    );
}

export default function UsuariosIndex({ usuarios }: UsuariosIndexProps) {
    const { props } = usePage<PageProps>();
    const permisos: string[] = props.auth?.permissions || [];
    const puedeCrearUsuarios = permisos.includes('usuarios.crear');
    const permiso_editar = permisos.includes('usuarios.editar');
    const permiso_borrar = permisos.includes('usuarios.eliminar');
    const cambiar_status = permisos.includes('usuarios.cambiar-status');

    const [isOpen, setIsOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Usuario | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [orderedUsers, setOrderedUsers] = useState<Usuario[]>(usuarios.data);

    useEffect(() => {
        setOrderedUsers(usuarios.data);
    }, [usuarios.data]);

    const handleOpen = useCallback((user?: Usuario) => {
        setEditingUser(user || null);
        setIsOpen(true);
    }, []);

    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title?: string;
        message?: string;
        onConfirm: () => void;
    } | null>(null);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        // Pequeño delay para limpiar el estado después del cierre
        setTimeout(() => {
            setEditingUser(null);
        }, 150);
    }, []);

    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        router.get('/usuarios', { search: e.target.value }, { preserveState: true });
    }, []);

    const handleToggleStatus = useCallback((usuario: Usuario) => {
        const nuevoStatus = usuario.status ? 0 : 1;

        router.post(
            route('usuarios.status', usuario.id),
            { status: nuevoStatus },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.info(`Usuario ${nuevoStatus ? 'activado' : 'desactivado'}`);
                },
                onError: () => {
                    toast.error('No se pudo actualizar el estado del usuario.');
                },
            },
        );
    }, []);

    const handleCopyData = useCallback((usuario: Usuario) => {
        const text = `Nombre: ${usuario.nombres} ${usuario.apellidos}\nUsuario: ${usuario.username}\nEmail: ${usuario.email}`;
        navigator.clipboard.writeText(text).then(() => {
            toast.success('Datos copiados al portapapeles');
        });
    }, []);

    const handleCopySelected = useCallback(() => {
        const text = orderedUsers
            .filter((u) => selectedUsers.includes(u.id))
            .map((u) => `Nombre: ${u.nombres} ${u.apellidos}, Usuario: ${u.username}, Email: ${u.email}`)
            .join('\n');
        navigator.clipboard.writeText(text).then(() => {
            toast.success('Datos seleccionados copiados');
        });
    }, [orderedUsers, selectedUsers]);

    const handleDeleteSelectedVisual = useCallback(() => {
        if (selectedUsers.length === 0) return;
        setConfirmDialog({
            open: true,
            title: 'Eliminar usuarios',
            message: `¿Estás seguro que deseas eliminar a ${selectedUsers.length} usuario(s)?`,
            onConfirm: () => {
                router.delete(route('usuarios.eliminar-multiples'), {
                    data: { ids: selectedUsers },
                    preserveScroll: true,
                    onSuccess: () => {
                        setOrderedUsers((prev) => prev.filter((u) => !selectedUsers.includes(u.id)));
                        setSelectedUsers([]);
                        toast.warn(`${selectedUsers.length} usuario(s) eliminados.`);
                        setConfirmDialog(null);
                    },
                    onError: () => {
                        toast.error('No se pudieron eliminar los usuarios.');
                        setConfirmDialog(null);
                    },
                });
            },
        });
    }, [selectedUsers]);

    const handleSelectUser = useCallback((id: number) => {
        setSelectedUsers((prev) => (prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]));
    }, []);

    const handleSelectAll = useCallback(() => {
        if (selectedUsers.length === orderedUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(orderedUsers.map((u) => u.id));
        }
    }, [selectedUsers.length, orderedUsers]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = orderedUsers.findIndex((u) => u.id === active.id);
            const newIndex = orderedUsers.findIndex((u) => u.id === over?.id);
            setOrderedUsers(arrayMove(orderedUsers, oldIndex, newIndex));
        }
    }, [orderedUsers]);

    const handleDelete = useCallback((usuario: Usuario) => {
        setConfirmDialog({
            open: true,
            title: 'Eliminar usuario',
            message: `¿Estás seguro de eliminar a ${usuario.username}?`,
            onConfirm: () => {
                router.delete(route('usuarios.destroy', usuario.id), {
                    onSuccess: () => {
                        toast.warn(`Usuario ${usuario.username} eliminado.`);
                        setOrderedUsers((prev) => prev.filter((u) => u.id !== usuario.id));
                    },
                    onError: () => {
                        toast.error('No se pudo eliminar al usuario.');
                    },
                });
                setConfirmDialog(null);
            },
        });
    }, []);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Usuarios y Roles',
            href: '/usuarios',
        },
        {
            title: 'Usuarios',
            href: '/usuarios',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuarios" />
            <div className="flex items-center justify-between px-6 py-4">
                <h1 className="text-foreground text-3xl font-bold">Gestión de Usuarios</h1>
                <div className="flex gap-2">
                    <Input placeholder="Buscar usuario..." onChange={handleSearch} className="w-64" />
                    {puedeCrearUsuarios && (
                        <Button
                            onClick={() => handleOpen()}
                            className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="text-sm font-medium">Crear usuario</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Modal usando SimpleModal en lugar de Radix Dialog */}
            <SimpleModal
                isOpen={isOpen}
                onClose={handleClose}
                title={editingUser ? 'Editar Usuario' : 'Crear Usuario'}
                maxWidth="md"
            >
                {isOpen && (
                    <Form
                        user={editingUser ? {
                            id: editingUser.id?.toString(),
                            id_empleado: editingUser.id_empleado,
                            nombres: editingUser.nombres,
                            apellidos: editingUser.apellidos,
                            username: editingUser.username,
                            email: editingUser.email,
                            mobile: editingUser.mobile,
                            id_fotografia: editingUser.id_fotografia,
                            puesto: editingUser.puesto,
                            role_id: editingUser.role_id || 0,
                            password: '',
                            password_confirmation: ''
                        } : undefined}
                        onSuccess={() => {
                            handleClose();
                            toast[editingUser ? 'info' : 'success'](
                                editingUser ? 'Usuario actualizado correctamente' : 'Usuario creado exitosamente',
                                {
                                    position: 'top-center',
                                    autoClose: 3000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    theme: 'colored',
                                },
                            );
                        }}
                        onError={(error) => {
                            toast.error('Error al procesar la solicitud. Revisa los datos o intenta de nuevo.', {
                                position: 'top-center',
                                autoClose: 4000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                theme: 'colored',
                            });
                            console.error('Error capturado desde Form:', error);
                        }}
                    />
                )}
            </SimpleModal>

            {selectedUsers.length > 0 && (
                <div className="flex items-center justify-between border-t border-b bg-zinc-100 px-6 py-3 text-sm dark:bg-zinc-800">
                    <span>{selectedUsers.length} usuarios seleccionados</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleCopySelected}>
                            Copiar datos
                        </Button>
                        {cambiar_status && (
                            <>
                                <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() =>
                                        setConfirmDialog({
                                            open: true,
                                            title: 'Activar usuarios',
                                            message: `¿Estás seguro de que quieres activar a los ${selectedUsers.length} usuarios seleccionados?`,
                                            onConfirm: () => {
                                                router.post(
                                                    route('usuarios.status-multiple'),
                                                    { ids: selectedUsers, status: 1 },
                                                    {
                                                        preserveScroll: true,
                                                        onSuccess: () => {
                                                            toast.success('Usuarios activados correctamente.');
                                                            setOrderedUsers((prev) =>
                                                                prev.map((u) => (selectedUsers.includes(u.id) ? { ...u, status: true } : u)),
                                                            );
                                                            setSelectedUsers([]);
                                                            setConfirmDialog(null);
                                                        },
                                                        onError: () => {
                                                            toast.error('Error al activar usuarios.');
                                                            setConfirmDialog(null);
                                                        },
                                                    },
                                                );
                                            },
                                        })
                                    }
                                >
                                    Activar seleccionados
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                        setConfirmDialog({
                                            open: true,
                                            title: 'Desactivar usuarios',
                                            message: `¿Estás seguro de que quieres desactivar a los ${selectedUsers.length} usuarios seleccionados?`,
                                            onConfirm: () => {
                                                router.post(
                                                    route('usuarios.status-multiple'),
                                                    { ids: selectedUsers, status: 0 },
                                                    {
                                                        preserveScroll: true,
                                                        onSuccess: () => {
                                                            toast.success('Usuarios desactivados correctamente.');
                                                            setOrderedUsers((prev) =>
                                                                prev.map((u) => (selectedUsers.includes(u.id) ? { ...u, status: false } : u)),
                                                            );
                                                            setSelectedUsers([]);
                                                            setConfirmDialog(null);
                                                        },
                                                        onError: () => {
                                                            toast.error('Error al desactivar usuarios.');
                                                            setConfirmDialog(null);
                                                        },
                                                    },
                                                );
                                            },
                                        })
                                    }
                                >
                                    Desactivar seleccionados
                                </Button>
                            </>
                        )}
                        {permiso_borrar && (
                            <Button size="sm" variant="destructive" onClick={handleDeleteSelectedVisual}>
                                Eliminar
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <div className="border-border bg-card mx-6 overflow-x-auto rounded-lg border shadow-sm">
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={orderedUsers.map((u) => u.id)} strategy={verticalListSortingStrategy}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead></TableHead>
                                    <TableHead>
                                        <input type="checkbox" onChange={handleSelectAll} checked={selectedUsers.length === orderedUsers.length} />
                                    </TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Teléfono</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Empleado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orderedUsers.length > 0 ? (
                                    orderedUsers.map((usuario) => (
                                        <SortableRow key={usuario.id} usuario={usuario}>
                                            <TableCell>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(usuario.id)}
                                                    onChange={() => handleSelectUser(usuario.id)}
                                                />
                                            </TableCell>
                                            <TableCell>{`${usuario.nombres} ${usuario.apellidos}`}</TableCell>
                                            <TableCell>{usuario.username}</TableCell>
                                            <TableCell>{usuario.email}</TableCell>
                                            <TableCell>{usuario.mobile ?? '—'}</TableCell>
                                            <TableCell>{usuario.role_name ?? '—'}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${usuario.status ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}
                                                >
                                                    {usuario.status ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </TableCell>
                                            <TableCell>{usuario.id_empleado ?? '—'}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {permiso_editar && (
                                                            <DropdownMenuItem onClick={() => handleOpen(usuario)}>
                                                                <Pencil className="mr-2 h-4 w-4" /> Editar
                                                            </DropdownMenuItem>
                                                        )}
                                                        {cambiar_status && (
                                                            <DropdownMenuItem onClick={() => handleToggleStatus(usuario)}>
                                                                {usuario.status ? (
                                                                    <>
                                                                        <ToggleLeft className="mr-2 h-4 w-4" /> Desactivar
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <ToggleRight className="mr-2 h-4 w-4" /> Activar
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                        )}
                                                        {permiso_borrar && (
                                                            <DropdownMenuItem onClick={() => handleDelete(usuario)}>
                                                                <Trash className="mr-2 h-4 w-4" /> Eliminar
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => handleCopyData(usuario)}>
                                                            <Copy className="mr-2 h-4 w-4" /> Copiar datos
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </SortableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center">
                                            No hay usuarios registrados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </SortableContext>
                </DndContext>
            </div>

            <div className="mt-4 flex items-center justify-between px-6">
                <span className="text-muted-foreground text-sm">
                    Página {usuarios.current_page} de {usuarios.last_page}
                </span>
                <div className="space-x-2">
                    {usuarios.prev_page_url && (
                        <Button variant="ghost" onClick={() => router.get(usuarios.prev_page_url!)}>
                            Anterior
                        </Button>
                    )}
                    {usuarios.next_page_url && (
                        <Button variant="ghost" onClick={() => router.get(usuarios.next_page_url!)}>
                            Siguiente
                        </Button>
                    )}
                </div>
            </div>

            {confirmDialog && (
                <ConfirmDialog
                    open={confirmDialog.open}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(null)}
                />
            )}

            <ToastContainer
                position="top-center"
                autoClose={1000}
                hideProgressBar
                closeOnClick
                pauseOnHover
                theme="colored"
            />
        </AppLayout>
    );
}
