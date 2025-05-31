import PasswordField_view from '@/components/ui/passwordfield';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Phone, Search, User } from 'lucide-react';
import { ChangeEvent, FormEvent, JSX, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { buscarEmpleados } from '../../../services/Empleados';
import type { Empleado } from '../../../types/Empleado';
import type { UsuarioFormData, UsuarioFormErrors } from '../../../types/Usuario';

import { usePage } from '@inertiajs/react';

interface FormProps {
    user?: Partial<UsuarioFormData>;
    onSuccess?: () => void;
    onError?: (error: unknown) => void;
}

interface Rol {
    id: number;
    name: string;
}

export default function Form({ user, onSuccess = () => {}, onError = () => {} }: FormProps) {
    const isEditing = !!(user && Object.keys(user).length > 0 && user.id);

    const { props } = usePage();
    const currentUser = props.auth.user;
    
    // Verificar permisos específicos
    const hasSistemasRole = currentUser?.roles?.some((role: any) => role.name === 'Sistemas') || false;
    const canChangePassword = currentUser?.permissions?.includes('usuarios.cambiar_password') || hasSistemasRole;
    const canAssignRole = currentUser?.permissions?.includes('usuarios.asignar_rol') || hasSistemasRole;

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors: rawErrors,
        reset,
    } = useForm<UsuarioFormData>({
        id: '',
        id_empleado: '',
        nombres: '',
        apellidos: '',
        username: '',
        email: '',
        mobile: '',
        password: '',
        password_confirmation: '',
        id_fotografia: '',
        puesto: '',
        role_id: 0,
    });

    const errors = rawErrors as UsuarioFormErrors;
    type UsuarioFormDataKey = keyof UsuarioFormData;
    const typedSetData: (field: UsuarioFormDataKey, value: any) => void = setData;

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Empleado[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(false);
    const [initialDataSet, setInitialDataSet] = useState(false);

    // Inicializar datos del usuario solo una vez
    useEffect(() => {
        if (isEditing && user && !initialDataSet) {
            setData({
                id: user.id || '',
                id_empleado: user.id_empleado || '',
                nombres: user.nombres || '',
                apellidos: user.apellidos || '',
                username: user.username || '',
                email: user.email || '',
                mobile: user.mobile || '',
                password: '',
                password_confirmation: '',
                id_fotografia: user.id_fotografia || '',
                puesto: user.puesto || '',
                role_id: user.role_id || 0,
            });
            setEmpleadoSeleccionado(true);
            setInitialDataSet(true);
        } else if (!isEditing && !initialDataSet) {
            // Reset para nuevo usuario
            setData({
                id: '',
                id_empleado: '',
                nombres: '',
                apellidos: '',
                username: '',
                email: '',
                mobile: '',
                password: '',
                password_confirmation: '',
                id_fotografia: '',
                puesto: '',
                role_id: 0,
            });
            setEmpleadoSeleccionado(false);
            setInitialDataSet(true);
        }
    }, [isEditing, user, initialDataSet, setData]);

    // Búsqueda de empleados con debounce
    useEffect(() => {
        if (query.length < 2 || isEditing || empleadoSeleccionado) {
            setResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            try {
                const empleados = await buscarEmpleados(query);
                setResults(empleados);
            } catch (error) {
                console.error('Error al buscar empleados:', error);
                toast.error('Error al buscar empleados');
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, empleadoSeleccionado, isEditing]);

    // Obtener roles solo si el usuario tiene permisos de Sistemas
    useEffect(() => {
        if (hasSistemasRole && roles.length === 0) {
            axios.get('/roles')
                .then((response) => {
                    setRoles(response.data);
                })
                .catch((error) => {
                    console.error('Error al obtener roles:', error);
                    toast.error('Error al cargar los roles');
                });
        }
    }, [hasSistemasRole, roles.length]);

    const generarUsername = (nombres: string, paterno: string) => {
        const clean = (str: string) =>
            str
                .toLowerCase()
                .normalize('NFD')
                .replace(/\p{Diacritic}/gu, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `${clean(nombres.split(' ')[0])}.${clean(paterno)}.${random}`;
    };

    const generarPassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    const handleSelect = (emp: Empleado) => {
        const usuario = generarUsername(emp.nombres, emp.paterno);
        const contrasena = generarPassword();

        setData({
            ...data,
            id_empleado: emp.id_empleado,
            nombres: emp.nombres,
            apellidos: `${emp.paterno} ${emp.materno}`,
            email: emp.correo || emp.correo_institucional || '',
            mobile: emp.celular || emp.telefono || '',
            username: usuario,
            password: contrasena,
            password_confirmation: contrasena,
            id_fotografia: emp.id_fotografia,
            puesto: emp.puesto,
            role_id: 0,
        });

        setEmpleadoSeleccionado(true);
        setQuery('');
        setResults([]);
    };

    const handleCancelSelection = () => {
        setEmpleadoSeleccionado(false);
        setData({
            id: '',
            id_empleado: '',
            nombres: '',
            apellidos: '',
            username: '',
            email: '',
            mobile: '',
            password: '',
            password_confirmation: '',
            id_fotografia: '',
            puesto: '',
            role_id: 0,
        });
        setQuery('');
        setResults([]);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!isEditing && (!empleadoSeleccionado || !data.id_empleado)) {
            toast.warning('Debes seleccionar un empleado antes de continuar.');
            return;
        }

        const options = {
            onSuccess: () => {
                if (onSuccess) onSuccess();
                if (!isEditing) {
                    reset();
                    setEmpleadoSeleccionado(false);
                    setInitialDataSet(false);
                }
            },
            onError: (errors: Record<string, string>) => {
                if (errors.general) {
                    toast.error(errors.general);
                } else {
                    Object.values(errors).forEach((msg) => toast.error(msg));
                }
                if (onError) onError(errors);
            },
        };

        try {
            if (isEditing) {
                put(route('usuarios.update', user?.id as string), options);
            } else {
                post(route('usuarios.store'), options);
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Error inesperado');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border p-6 shadow-xl dark:bg-zinc-900">
            {/* Buscador de empleados */}
            {!isEditing && !empleadoSeleccionado && (
                <div className="relative">
                    <label className="mb-1 block text-sm font-medium">Buscar empleado</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Ej. Juan Pérez"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full rounded-lg border px-10 py-2 focus:ring-2 focus:ring-[#c10230]"
                        />
                        <Search className="text-muted-foreground absolute top-2.5 left-3 h-5 w-5" />
                    </div>
                    {isSearching && <p className="text-muted-foreground mt-1 text-xs">Buscando...</p>}
                    {results.length > 0 && (
                        <ul className="absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-lg border bg-white shadow-lg dark:bg-zinc-800">
                            {results
                                .filter((emp) => emp.id_empleado !== data.id_empleado)
                                .map((emp) => (
                                    <li
                                        key={emp.id_empleado}
                                        onClick={() => handleSelect(emp)}
                                        className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700"
                                    >
                                        <img
                                            src={`data:image/jpeg;base64,${emp.id_fotografia}`}
                                            className="h-10 w-10 rounded-full object-cover"
                                            alt={emp.nombre_completo}
                                        />
                                        <div>
                                            <p className="text-sm font-medium">{emp.nombre_completo}</p>
                                            <p className="text-muted-foreground text-xs">{emp.puesto}</p>
                                        </div>
                                    </li>
                                ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Datos del empleado */}
            <AnimatePresence>
                {!isEditing && empleadoSeleccionado && data.id_empleado && (
                    <motion.div
                        key={data.id_empleado}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-4 rounded-lg border p-3 shadow-sm dark:bg-zinc-800"
                    >
                        <img
                            src={`data:image/jpeg;base64,${data.id_fotografia}`}
                            className="h-12 w-12 rounded-full border object-cover"
                            alt={data.nombres}
                        />
                        <div className="flex-1">
                            <p className="text-sm font-medium">
                                {data.nombres} {data.apellidos}
                            </p>
                            <p className="text-muted-foreground text-xs">{data.puesto}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleCancelSelection}
                            className="rounded-md px-3 py-1 text-sm font-medium text-[#c10230] hover:bg-[#c10230] hover:text-white"
                        >
                            Cancelar
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Campos del formulario */}
            {canChangePassword ? (
                <>
                    <Field
                        label="Nombre(s)"
                        icon={<User />}
                        value={data.nombres}
                        onChange={(e) => typedSetData('nombres', e.target.value)}
                        error={errors.nombres}
                    />
                    <Field
                        label="Apellidos"
                        icon={<User />}
                        value={data.apellidos}
                        onChange={(e) => typedSetData('apellidos', e.target.value)}
                        error={errors.apellidos}
                    />
                </>
            ) : (
                <>
                    <div className="space-y-1">
                        <label className="mb-1 block text-sm font-medium">Nombre(s)</label>
                        <div className="flex items-center rounded-lg border bg-gray-50 px-4 py-2 dark:bg-zinc-700">
                            <User className="mr-2 h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">{data.nombres}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="mb-1 block text-sm font-medium">Apellidos</label>
                        <div className="flex items-center rounded-lg border bg-gray-50 px-4 py-2 dark:bg-zinc-700">
                            <User className="mr-2 h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">{data.apellidos}</span>
                        </div>
                    </div>
                </>
            )}

            <Field
                label="Nombre de usuario"
                icon={<User />}
                value={data.username}
                onChange={(e) => typedSetData('username', e.target.value)}
                error={errors.username}
            />
            <Field
                label="Correo"
                type="email"
                icon={<Mail />}
                value={data.email}
                onChange={(e) => typedSetData('email', e.target.value)}
                error={errors.email}
            />
            <Field
                label="Teléfono"
                icon={<Phone />}
                value={data.mobile}
                onChange={(e) => typedSetData('mobile', e.target.value)}
                error={errors.mobile}
            />

            {/* Campo de rol - Solo visible para usuarios con permisos de asignar roles */}
            {canAssignRole && (
                <div className="relative">
                    <label className="mb-1 block text-sm font-medium">Rol</label>
                    <div className="relative">
                        <select
                            value={data.role_id}
                            onChange={(e) => typedSetData('role_id', parseInt(e.target.value))}
                            className="w-full appearance-none rounded-lg border bg-white px-4 py-2 pr-10 shadow-sm focus:ring-2 focus:ring-[#c10230] focus:outline-none dark:bg-zinc-800 dark:text-white"
                        >
                            <option value={0}>Seleccione un rol</option>
                            {roles.map((rol) => (
                                <option key={rol.id} value={rol.id}>
                                    {rol.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {errors.role_id && <p className="mt-1 text-sm text-red-500">{errors.role_id}</p>}
                </div>
            )}

            {/* Campos de contraseña - Solo visible para usuarios con permisos de cambiar contraseña */}
            {canChangePassword && (
                <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2">
                    <PasswordField_view
                        label="Contraseña"
                        value={data.password}
                        onChange={(e) => typedSetData('password', e.target.value)}
                        error={errors.password}
                    />
                    <PasswordField_view
                        label="Confirmar contraseña"
                        value={data.password_confirmation}
                        onChange={(e) => typedSetData('password_confirmation', e.target.value)}
                    />
                </div>
            )}

            {/* Mensaje de contraseña generada */}
            {canChangePassword && data.password && !isEditing && (
                <p className="text-muted-foreground -mt-2 text-xs">
                    Contraseña generada.
                    <button
                        type="button"
                        className="ml-2 text-xs font-semibold text-blue-500 underline"
                        onClick={() => {
                            navigator.clipboard.writeText(data.password);
                            toast.success('Contraseña copiada al portapapeles');
                        }}
                    >
                        Copiar
                    </button>
                </p>
            )}

            <div className="text-right">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-[#c10230] px-6 py-2 font-semibold text-white transition hover:bg-[#a1001f] disabled:opacity-50"
                >
                    {processing ? 'Guardando...' : isEditing ? 'Actualizar' : 'Registrar'}
                </button>
            </div>
        </form>
    );
}

interface FieldProps {
    label: string;
    icon: JSX.Element;
    type?: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    error?: string;
}

function Field({ label, icon, type = 'text', value, onChange, error }: FieldProps) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium">{label}</label>
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    className="mt-1 w-full rounded-lg border px-10 py-2 shadow-sm focus:ring-2 focus:ring-[#c10230]"
                    placeholder={`Ej. ${label}`}
                />
                <span className="text-muted-foreground absolute top-2.5 left-3">{icon}</span>
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}