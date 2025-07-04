// ============================================
// 📁 src/components/libros/LibroDetallesModal.tsx - MEJORADO CON HEADLESS UI
// Modal mejorado basado en el código original con mejor diseño y organización
// ============================================

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import {
    AlertCircle,
    Award,
    Book,
    Building,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    FileText,
    Globe,
    Hash,
    Info,
    Package,
    Star,
    User,
    X,
} from 'lucide-react';
import React, { Fragment } from 'react';
import { LibroCompleto } from '../../types/LibroCompleto';

interface LibroDetallesModalProps {
    libro: LibroCompleto | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (libro: LibroCompleto) => void;
    onDelete?: (id: string) => void;
    readonly?: boolean;
}

const LibroDetallesModal: React.FC<LibroDetallesModalProps> = ({ libro, isOpen, onClose, onEdit, onDelete, readonly = false }) => {
    if (!libro) return null;

    const imagenUrl = libro.imagenUrl || libro.imagen_url;
    const añoPublicacion = libro.añoPublicacion || libro.año;

    const handleEdit = () => {
        if (onEdit) {
            onEdit(libro);
            onClose();
        }
    };

    const handleDelete = () => {
        if (onDelete && confirm('¿Está seguro de eliminar este libro?')) {
            onDelete(libro.id);
            onClose();
        }
    };

    const copiarISBN = () => {
        navigator.clipboard.writeText(libro.isbn);
    };

    const copiarInformacion = () => {
        const info = `${libro.titulo}\nAutor: ${libro.autor.nombre} ${libro.autor.apellidos}\nISBN: ${libro.isbn}\nEditorial: ${libro.editorial.nombre}`;
        navigator.clipboard.writeText(info);
    };

    const compartirLibro = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: libro.titulo,
                    text: `${libro.titulo} por ${libro.autor.nombre} ${libro.autor.apellidos}`,
                    url: imagenUrl || undefined,
                });
            } catch (error) {
                copiarInformacion();
            }
        } else {
            copiarInformacion();
        }
    };

    const getCalidadBadge = (calidad: string | undefined) => {
        switch (calidad) {
            case 'alta':
                return { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: Award };
            case 'media':
                return { bg: 'bg-amber-100', text: 'text-amber-800', icon: Star };
            case 'baja':
                return { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-800', icon: Info };
        }
    };

    const calidadBadge = getCalidadBadge(libro.calidadDatos);

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all">
                                {/* Header con gradiente atractivo */}
                                <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white">
                                    <div className="flex items-center justify-between p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                                                <Book className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-2xl font-bold">Detalles del Libro</Dialog.Title>
                                                <p className="font-mono text-sm text-slate-300">ISBN: {libro.isbn}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={onClose}
                                                className="ml-2 rounded-lg p-2 text-white/80 transition-all hover:bg-white/20 hover:text-white"
                                            >
                                                <X className="h-6 w-6" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Contenido principal */}
                                <div className="max-h-[80vh] overflow-y-auto p-8">
                                    <div className="grid grid-cols-1 gap-8 xl:grid-cols-4">
                                        {/* Columna Izquierda - Imagen y Estado */}
                                        <div className="space-y-6 xl:col-span-1">
                                            {/* Imagen del libro más grande */}
                                            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
                                                <h3 className="mb-4 text-center font-bold text-gray-900">Portada</h3>
                                                {imagenUrl ? (
                                                    <div className="space-y-4">
                                                        <div className="flex justify-center">
                                                            <img
                                                                src={imagenUrl}
                                                                alt={libro.titulo}
                                                                className="h-64 w-48 rounded-xl border-2 border-white object-cover shadow-lg"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src =
                                                                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDE5MiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02NCA5NkgxMjhWMTA0SDY0Vjk2WiIgZmlsbD0iI0QxRDVEQiIvPgo8cGF0aCBkPSJNNjQgMTEySDk2VjEyMEg2NFYxMTJaIiBmaWxsPSIjRDFENURCIi8+Cjwvc3ZnPgo=';
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                                        <Book className="mb-4 h-20 w-20" />
                                                        <p className="text-sm font-medium">Sin imagen disponible</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Estado del procesamiento */}
                                            <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-slate-100 p-6">
                                                <h4 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
                                                    <Info className="h-5 w-5 text-gray-600" />
                                                    Estado y Calidad
                                                </h4>

                                                <div className="space-y-3">
                                                    {/* Estado */}
                                                    {libro.estado === 'procesado' ? (
                                                        <div className="flex items-center gap-3 rounded-lg bg-green-100 p-3">
                                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                                            <div>
                                                                <p className="font-medium text-green-800">Procesado</p>
                                                                <p className="text-xs text-green-600">Información completa</p>
                                                            </div>
                                                        </div>
                                                    ) : libro.estado === 'error' ? (
                                                        <div className="rounded-lg bg-red-100 p-3">
                                                            <div className="mb-2 flex items-center gap-3">
                                                                <AlertCircle className="h-5 w-5 text-red-600" />
                                                                <p className="font-medium text-red-800">Error</p>
                                                            </div>
                                                            {libro.errorMsg && <p className="text-xs text-red-600">{libro.errorMsg}</p>}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3 rounded-lg bg-yellow-100 p-3">
                                                            <Clock className="h-5 w-5 text-yellow-600" />
                                                            <div>
                                                                <p className="font-medium text-yellow-800">Procesando</p>
                                                                <p className="text-xs text-yellow-600">En progreso...</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Calidad de datos */}
                                                    {libro.calidadDatos && (
                                                        <div className={`flex items-center gap-3 p-3 ${calidadBadge.bg} rounded-lg`}>
                                                            <calidadBadge.icon
                                                                className={`h-5 w-5 ${calidadBadge.text.replace('text-', 'text-').replace('-800', '-600')}`}
                                                            />
                                                            <div>
                                                                <p className={`font-medium ${calidadBadge.text}`}>Calidad {libro.calidadDatos}</p>
                                                                <p className={`text-xs ${calidadBadge.text.replace('-800', '-600')}`}>
                                                                    Datos verificados
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Información de Factura */}
                                            {(libro.fechaFactura || libro.folio || libro.proveedor) && (
                                                <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-100 p-6">
                                                    <h4 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
                                                        <FileText className="h-5 w-5 text-amber-600" />
                                                        Datos de Factura
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {libro.folio && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-medium text-amber-700">Folio:</span>
                                                                <span className="font-semibold text-amber-900">{libro.folio}</span>
                                                            </div>
                                                        )}
                                                        {libro.fechaFactura && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-medium text-amber-700">Fecha:</span>
                                                                <span className="font-semibold text-amber-900">
                                                                    {new Date(libro.fechaFactura).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {libro.proveedor && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-medium text-amber-700">Proveedor:</span>
                                                                <span className="font-semibold text-amber-900">{libro.proveedor}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Columnas Central y Derecha - Información Principal */}
                                        <div className="space-y-8 xl:col-span-3">
                                            {/* Título y información básica */}
                                            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-100 p-6">
                                                <h2 className="mb-6 text-3xl leading-tight font-bold text-gray-900">{libro.titulo}</h2>

                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                    {/* Autor */}
                                                    <div className="rounded-xl bg-white p-3 shadow-sm">
                                                        <div className="mb-1 flex items-center gap-2">
                                                            <User className="h-4 w-4 text-purple-600" />
                                                            <span className="text-sm font-medium text-purple-800">Autor</span>
                                                        </div>
                                                        <p className="text-base font-semibold text-gray-900">
                                                            {libro.autor.nombre} {libro.autor.apellidos}
                                                        </p>
                                                        {libro.autor.nacionalidad && (
                                                            <p className="mt-0.5 text-xs text-gray-600">{libro.autor.nacionalidad}</p>
                                                        )}
                                                    </div>

                                                    {/* Editorial */}
                                                    <div className="rounded-xl bg-white p-3 shadow-sm">
                                                        <div className="mb-1 flex items-center gap-2">
                                                            <Building className="h-4 w-4 text-purple-600" />
                                                            <span className="text-sm font-medium text-purple-800">Editorial</span>
                                                        </div>
                                                        <p className="text-base font-semibold text-gray-900">{libro.editorial.nombre}</p>
                                                        {libro.editorial.contacto && (
                                                            <p className="mt-0.5 text-xs text-gray-600">{libro.editorial.contacto}</p>
                                                        )}
                                                    </div>

                                                    {/* Género */}
                                                    <div className="rounded-xl bg-white p-3 shadow-sm">
                                                        <div className="mb-1 flex items-center gap-2">
                                                            <Hash className="h-4 w-4 text-purple-600" />
                                                            <span className="text-sm font-medium text-purple-800">Género</span>
                                                        </div>
                                                        <p className="text-base font-semibold text-gray-900">{libro.genero.nombre}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Descripción */}
                                            {libro.descripcion && (
                                                <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-100 p-6">
                                                    <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                                                        <FileText className="h-6 w-6 text-cyan-600" />
                                                        Descripción
                                                    </h3>
                                                    <div className="rounded-xl bg-white p-6 shadow-sm">
                                                        <p className="leading-relaxed text-gray-700">{libro.descripcion}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Biografía del Autor */}
                                            {libro.autor.biografia && (
                                                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100 p-6">
                                                    <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                                                        <User className="h-6 w-6 text-emerald-600" />
                                                        Sobre el Autor
                                                    </h3>
                                                    <div className="rounded-xl bg-white p-6 shadow-sm">
                                                        <p className="leading-relaxed text-gray-700">{libro.autor.biografia}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Información Técnica */}
                                            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-gray-100 p-6">
                                                <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
                                                    <Info className="h-6 w-6 text-slate-600" />
                                                    Información Técnica
                                                </h3>

                                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                                    {/* Páginas */}
                                                    {libro.paginas && (
                                                        <div className="rounded-xl border-2 border-blue-100 bg-white p-4 text-center shadow-sm">
                                                            <FileText className="mx-auto mb-2 h-8 w-8 text-blue-600" />
                                                            <p className="text-xl font-bold text-blue-900">{libro.paginas}</p>
                                                            <p className="text-xs font-medium text-blue-700">Páginas</p>
                                                        </div>
                                                    )}

                                                    {/* Idioma */}
                                                    {libro.idioma && (
                                                        <div className="rounded-xl border-2 border-green-100 bg-white p-4 text-center shadow-sm">
                                                            <Globe className="mx-auto mb-2 h-8 w-8 text-green-600" />
                                                            <p className="text-lg font-bold text-green-900">{libro.idioma.toUpperCase()}</p>
                                                            <p className="text-xs font-medium text-green-700">Idioma</p>
                                                        </div>
                                                    )}

                                                    {/* Año */}
                                                    {añoPublicacion && (
                                                        <div className="rounded-xl border-2 border-purple-100 bg-white p-4 text-center shadow-sm">
                                                            <Calendar className="mx-auto mb-2 h-8 w-8 text-purple-600" />
                                                            <p className="text-xl font-bold text-purple-900">{añoPublicacion}</p>
                                                            <p className="text-xs font-medium text-purple-700">Año</p>
                                                        </div>
                                                    )}

                                                    {/* Edición */}
                                                    {libro.edicion && (
                                                        <div className="rounded-xl border-2 border-orange-100 bg-white p-4 text-center shadow-sm">
                                                            <Book className="mx-auto mb-2 h-8 w-8 text-orange-600" />
                                                            <p className="text-lg font-bold text-orange-900">{libro.edicion}</p>
                                                            <p className="text-xs font-medium text-orange-700">Edición</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Información Comercial */}
                                            <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 p-6">
                                                <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
                                                    <DollarSign className="h-6 w-6 text-green-600" />
                                                    Información Comercial
                                                </h3>

                                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                                    {/* Cantidad */}
                                                    <div className="rounded-xl border-2 border-green-200 bg-white p-6 text-center shadow-sm">
                                                        <Package className="mx-auto mb-3 h-10 w-10 text-green-600" />
                                                        <p className="text-2xl font-bold text-green-900">{libro.cantidad}</p>
                                                        <p className="text-sm font-medium text-green-700">Cantidad</p>
                                                    </div>

                                                    {/* Precio Unitario */}
                                                    <div className="rounded-xl border-2 border-blue-200 bg-white p-6 text-center shadow-sm">
                                                        <DollarSign className="mx-auto mb-3 h-10 w-10 text-blue-600" />
                                                        <p className="text-2xl font-bold text-blue-900">${libro.valorUnitario.toFixed(2)}</p>
                                                        <p className="text-sm font-medium text-blue-700">Precio Unit.</p>
                                                    </div>

                                                    {/* Descuento */}
                                                    {libro.descuento > 0 && (
                                                        <div className="rounded-xl border-2 border-orange-200 bg-white p-6 text-center shadow-sm">
                                                            <DollarSign className="mx-auto mb-3 h-10 w-10 text-orange-600" />
                                                            <p className="text-2xl font-bold text-orange-900">-${libro.descuento.toFixed(2)}</p>
                                                            <p className="text-sm font-medium text-orange-700">Descuento</p>
                                                        </div>
                                                    )}

                                                    {/* Total */}
                                                    <div className="rounded-xl bg-gradient-to-br from-gray-800 to-slate-900 p-6 text-center shadow-lg">
                                                        <DollarSign className="mx-auto mb-3 h-10 w-10 text-white" />
                                                        <p className="text-2xl font-bold text-white">${libro.total.toFixed(2)}</p>
                                                        <p className="text-sm font-medium text-gray-300">Total</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-slate-100 px-8 py-6">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            {libro.estado === 'procesado' && libro.enriquecidoConAPIs ? (
                                                <span className="flex items-center gap-2 text-blue-600">
                                                    <Globe className="h-4 w-4" />
                                                    Información enriquecida con APIs externas
                                                </span>
                                            ) : libro.estado === 'procesado' ? (
                                                <span className="flex items-center gap-2 text-green-600">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Información procesada automáticamente
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">Datos de base de datos local</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default LibroDetallesModal;
