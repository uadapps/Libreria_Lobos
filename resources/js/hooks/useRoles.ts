// hooks/useRoles.ts
import { useState, useCallback, useMemo, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { toast } from 'react-toastify';
import { Role, FormData, ModalType, PageProps } from '../types/role.types';

export const useRoles = (roles: Role[]) => {
    const { props } = usePage<PageProps>();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [modals, setModals] = useState({
        create: false,
        edit: false,
        view: false,
        delete: false,
    });

    const [formData, setFormData] = useState<FormData>({
        name: '',
        permissions: [],
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

        // Manejar errores de validación sin mostrar el nombre del campo
        if (props.errors && Object.keys(props.errors).length > 0) {
            Object.values(props.errors).forEach((message) => {
                toast.error(message, {
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

    // Filtros y estadísticas memoizadas
    const filteredRoles = useMemo(() =>
        roles.filter(role =>
            role.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [roles, searchTerm]
    );

    const stats = useMemo(() => ({
        totalRoles: roles.length,
        usuariosAsignados: roles.reduce((sum, role) => sum + Number(role.users_count), 0),
        rolesActivos: roles.filter(role => role.users_count > 0).length,
    }), [roles]);

    // Manejadores de modales
    const closeModal = useCallback((modalName: ModalType) => {
        setModals(prev => ({ ...prev, [modalName]: false }));
    }, []);

    const openModal = useCallback((modalName: ModalType, role?: Role) => {
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

    // Limpiar estados cuando se cierren los modales
    useEffect(() => {
        if (!Object.values(modals).some(Boolean)) {
            const timer = setTimeout(() => {
                setSelectedRole(null);
                setIsLoading(false);
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [modals]);

    // Manejador de requests unificado
    const makeRequest = useCallback((
        method: 'post' | 'put' | 'delete',
        url: string,
        data?: any,
        successMessage?: string
    ) => {
        setIsLoading(true);
        const loadingMessages = {
            post: 'Creando rol...',
            put: 'Actualizando rol...',
            delete: 'Eliminando rol...'
        };

        const loadingToast = toast.loading(loadingMessages[method], {
            position: 'top-right'
        });

        router[method](url, data, {
            onSuccess: () => {
                toast.dismiss(loadingToast);
                if (successMessage) {
                    toast.success(successMessage, {
                        position: 'top-right',
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                    });
                }

                // Cerrar modal correspondiente
                const modalMap = { post: 'create', put: 'edit', delete: 'delete' };
                closeModal(modalMap[method] as ModalType);
            },
            onError: () => {
                toast.dismiss(loadingToast);
                setIsLoading(false);
            },
            onFinish: () => {
                toast.dismiss(loadingToast);
                setIsLoading(false);
            },
        });
    }, [closeModal]);

    return {
        // Estado
        searchTerm,
        setSearchTerm,
        selectedRole,
        isLoading,
        modals,
        formData,
        setFormData,

        // Datos computados
        filteredRoles,
        stats,

        // Acciones
        openModal,
        closeModal,
        makeRequest,
    };
};
