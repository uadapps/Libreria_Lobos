// ============================================
// 📁 components/libros-facturas/LibroManualComponents.tsx - FACTURA FUERA DE PASOS
// ============================================
import { SelectConBusqueda } from '@/components/inventario_libros/SelectConBusqueda';
import { LibroManual } from '@/types/LibroCompleto';
import { AlertTriangle, BookOpen, Building2, Database, DollarSign, FileImage, FileText, Package, Plus, Tag, Users, X, Receipt, CheckCircle, Lock } from 'lucide-react';
import React, { useCallback, useState } from 'react';

interface DatosFactura {
    folio?: string;
    serie?: string;
    fecha?: string;
    uuid?: string;
    editorial?: string;
    rfc?: string;
    regimenFiscal?: string;
}

interface LibroManualFormProps {
    nuevoLibro: LibroManual;
    setNuevoLibro: React.Dispatch<React.SetStateAction<LibroManual>>;
    guardando: boolean;
    onAgregarLibro: () => void;
    onBuscarISBN: (isbn: string) => void;
    buscandoISBNs: boolean;
    datosFactura?: DatosFactura;
}

// =============================================
// 🧩 COMPONENTES DE PASOS - MOVIDOS FUERA
// =============================================

interface PasoProps {
    nuevoLibro: LibroManual;
    setNuevoLibro: React.Dispatch<React.SetStateAction<LibroManual>>;
    guardando: boolean;
    onBuscarISBN?: (isbn: string) => void;
    buscandoISBNs?: boolean;
    datosFactura?: DatosFactura;
}

// =============================================
// 📄 SECCIÓN DE FACTURA (FUERA DE PASOS)
// =============================================
const SeccionFactura: React.FC<{
    nuevoLibro: LibroManual;
    setNuevoLibro: React.Dispatch<React.SetStateAction<LibroManual>>;
    guardando: boolean;
    datosFactura?: DatosFactura;
}> = ({ nuevoLibro, setNuevoLibro, guardando, datosFactura }) => {

    const tieneFacturaCompleta = () => {
        return !!(
            (nuevoLibro.serieFactura || datosFactura?.serie) &&
            (nuevoLibro.folioFactura || datosFactura?.folio) &&
            (nuevoLibro.fechaFactura || datosFactura?.fecha) &&
            (nuevoLibro.editorial_nombre || datosFactura?.editorial)
        );
    };

    return (
        <div className="mb-6 rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tieneFacturaCompleta() ? 'bg-green-600' : 'bg-blue-600'}`}>
                        {tieneFacturaCompleta() ? (
                            <CheckCircle className="h-6 w-6 text-white" />
                        ) : (
                            <Receipt className="h-6 w-6 text-white" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Información de Factura</h3>
                        <p className="text-sm text-gray-600">
                            {tieneFacturaCompleta()
                                ? '✅ Configurada - Todos los libros se vincularán a esta factura'
                                : '🔒 Obligatorio - Los libros siempre deben estar vinculados a una factura'
                            }
                        </p>
                    </div>
                </div>

                {tieneFacturaCompleta() && (
                    <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        Configurada
                    </div>
                )}
            </div>

            {/* Si ya hay factura procesada desde XML */}
            {datosFactura && (
                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
                            <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-green-800">Factura XML procesada automáticamente</p>
                                <Lock className="h-4 w-4 text-green-600" title="Campos bloqueados por factura XML" />
                            </div>
                            <p className="mt-1 text-xs text-green-700">
                                Factura: {datosFactura.serie}{datosFactura.folio} - {datosFactura.editorial}
                            </p>
                            {datosFactura.uuid && (
                                <p className="mt-1 text-xs text-green-600 font-mono">UUID: {datosFactura.uuid}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Serie * <span className="text-red-500">Requerido</span>
                    </label>
                    <input
                        type="text"
                        value={nuevoLibro.serieFactura || datosFactura?.serie || ''}
                        onChange={(e) => setNuevoLibro((prev) => ({ ...prev, serieFactura: e.target.value }))}
                        className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                            !(nuevoLibro.serieFactura || datosFactura?.serie) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        } ${!!datosFactura?.serie ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="BB"
                        disabled={guardando || !!datosFactura?.serie}
                    />
                    {!(nuevoLibro.serieFactura || datosFactura?.serie) && (
                        <p className="mt-1 text-xs text-red-600">La serie es obligatoria</p>
                    )}
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Folio * <span className="text-red-500">Requerido</span>
                    </label>
                    <input
                        type="text"
                        value={nuevoLibro.folioFactura || datosFactura?.folio || ''}
                        onChange={(e) => setNuevoLibro((prev) => ({ ...prev, folioFactura: e.target.value }))}
                        className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                            !(nuevoLibro.folioFactura || datosFactura?.folio) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        } ${!!datosFactura?.folio ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="0910273652"
                        disabled={guardando || !!datosFactura?.folio}
                    />
                    {!(nuevoLibro.folioFactura || datosFactura?.folio) && (
                        <p className="mt-1 text-xs text-red-600">El folio es obligatorio</p>
                    )}
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Fecha * <span className="text-red-500">Requerido</span>
                    </label>
                    <input
                        type="date"
                        value={nuevoLibro.fechaFactura || datosFactura?.fecha || ''}
                        onChange={(e) => setNuevoLibro((prev) => ({ ...prev, fechaFactura: e.target.value }))}
                        className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                            !(nuevoLibro.fechaFactura || datosFactura?.fecha) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        } ${!!datosFactura?.fecha ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={guardando || !!datosFactura?.fecha}
                    />
                    {!(nuevoLibro.fechaFactura || datosFactura?.fecha) && (
                        <p className="mt-1 text-xs text-red-600">La fecha es obligatoria</p>
                    )}
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">RFC Proveedor</label>
                    <input
                        type="text"
                        value={nuevoLibro.rfcProveedor || datosFactura?.rfc || ''}
                        onChange={(e) => setNuevoLibro((prev) => ({ ...prev, rfcProveedor: e.target.value }))}
                        className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${!!datosFactura?.rfc ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="ABC123456789"
                        disabled={guardando || !!datosFactura?.rfc}
                    />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Proveedor/Editorial * <span className="text-red-500">Requerido</span>
                    </label>
                    <input
                        type="text"
                        value={nuevoLibro.editorial_nombre || datosFactura?.editorial || ''}
                        onChange={(e) => setNuevoLibro((prev) => ({
                            ...prev,
                            editorial_nombre: e.target.value,
                        }))}
                        className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                            !(nuevoLibro.editorial_nombre || datosFactura?.editorial) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        } ${!!datosFactura?.editorial ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="Nombre del proveedor/editorial"
                        disabled={guardando || !!datosFactura?.editorial}
                    />
                    {!(nuevoLibro.editorial_nombre || datosFactura?.editorial) && (
                        <p className="mt-1 text-xs text-red-600">El proveedor/editorial es obligatorio</p>
                    )}
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">UUID Fiscal (Opcional)</label>
                    <input
                        type="text"
                        value={nuevoLibro.uuidFactura || datosFactura?.uuid || ''}
                        onChange={(e) => setNuevoLibro((prev) => ({ ...prev, uuidFactura: e.target.value }))}
                        className={`w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${!!datosFactura?.uuid ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="UUID..."
                        disabled={guardando || !!datosFactura?.uuid}
                    />
                </div>
            </div>

            {/* Estado de validación */}
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="mb-2 text-sm font-medium text-blue-800">Estado de configuración:</div>
                <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                    <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${(nuevoLibro.serieFactura || datosFactura?.serie) ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={(nuevoLibro.serieFactura || datosFactura?.serie) ? 'text-green-700' : 'text-red-700'}>
                            Serie {(nuevoLibro.serieFactura || datosFactura?.serie) ? '✓' : '✗'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${(nuevoLibro.folioFactura || datosFactura?.folio) ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={(nuevoLibro.folioFactura || datosFactura?.folio) ? 'text-green-700' : 'text-red-700'}>
                            Folio {(nuevoLibro.folioFactura || datosFactura?.folio) ? '✓' : '✗'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${(nuevoLibro.fechaFactura || datosFactura?.fecha) ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={(nuevoLibro.fechaFactura || datosFactura?.fecha) ? 'text-green-700' : 'text-red-700'}>
                            Fecha {(nuevoLibro.fechaFactura || datosFactura?.fecha) ? '✓' : '✗'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${(nuevoLibro.editorial_nombre || datosFactura?.editorial) ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={(nuevoLibro.editorial_nombre || datosFactura?.editorial) ? 'text-green-700' : 'text-red-700'}>
                            Proveedor {(nuevoLibro.editorial_nombre || datosFactura?.editorial) ? '✓' : '✗'}
                        </span>
                    </div>
                </div>
            </div>

            {!tieneFacturaCompleta() && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />
                        <div>
                            <p className="text-sm font-medium text-red-800">Factura Obligatoria</p>
                            <p className="mt-1 text-xs text-red-700">
                                El sistema requiere que todos los libros estén vinculados a una factura.
                                Complete la información requerida para continuar.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PasoInformacionBasica: React.FC<PasoProps> = ({
    nuevoLibro,
    setNuevoLibro,
    guardando,
    onBuscarISBN,
    buscandoISBNs
}) => (
    <div className="space-y-6">
        <div className="rounded-lg bg-gray-50 p-6">
            <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-800">
                <BookOpen className="h-5 w-5 text-gray-600" />
                Paso 1: Información Básica del Libro
            </h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        ISBN * <span className="text-red-500">Requerido</span>
                    </label>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={nuevoLibro.isbn}
                            onChange={(e) => {
                                const value = e.target.value;
                                setNuevoLibro((prev) => ({ ...prev, isbn: value }));
                            }}
                            className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                !nuevoLibro.isbn ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="9786073838535"
                            disabled={guardando}
                        />
                        <button
                            onClick={() => onBuscarISBN?.(nuevoLibro.isbn || '')}
                            disabled={buscandoISBNs || !nuevoLibro.isbn || guardando}
                            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                            title="Buscar en base de datos"
                        >
                            {buscandoISBNs ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <Database className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    {!nuevoLibro.isbn && <p className="mt-1 text-xs text-red-600">El ISBN es obligatorio para continuar</p>}
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Título * <span className="text-red-500">Requerido</span>
                    </label>
                    <input
                        type="text"
                        value={nuevoLibro.titulo}
                        onChange={(e) => setNuevoLibro((prev) => ({ ...prev, titulo: e.target.value }))}
                        className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                            !nuevoLibro.titulo ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Nombre del libro"
                        disabled={guardando}
                    />
                    {!nuevoLibro.titulo && <p className="mt-1 text-xs text-red-600">El título es obligatorio para continuar</p>}
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Año de Publicación</label>
                    <input
                        type="number"
                        value={nuevoLibro.año_publicacion || ''}
                        onChange={(e) => setNuevoLibro((prev) => ({ ...prev, año_publicacion: parseInt(e.target.value) || null }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        placeholder="2023"
                        min="1800"
                        max={new Date().getFullYear() + 1}
                        disabled={guardando}
                    />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Número de Páginas</label>
                    <input
                        type="number"
                        value={nuevoLibro.paginas || ''}
                        onChange={(e) => setNuevoLibro((prev) => ({ ...prev, paginas: parseInt(e.target.value) || null }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        placeholder="350"
                        min="1"
                        disabled={guardando}
                    />
                </div>
            </div>
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center gap-2 text-sm">
                    <div className={`h-3 w-3 rounded-full ${nuevoLibro.isbn ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={nuevoLibro.isbn ? 'text-green-700' : 'text-red-700'}>
                        ISBN {nuevoLibro.isbn ? 'completado' : 'requerido'}
                    </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm">
                    <div className={`h-3 w-3 rounded-full ${nuevoLibro.titulo ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={nuevoLibro.titulo ? 'text-green-700' : 'text-red-700'}>
                        Título {nuevoLibro.titulo ? 'completado' : 'requerido'}
                    </span>
                </div>
            </div>
        </div>
    </div>
);

const PasoAutorEditorial: React.FC<PasoProps> = ({ nuevoLibro, setNuevoLibro, guardando }) => {
    const [isAutorNuevo, setIsAutorNuevo] = useState(false);
    const [autores] = useState<{ id: number; nombre: string; nombre_completo?: string }[]>([]);

    return (
        <div className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-6">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                    <Users className="h-5 w-5 text-gray-600" />
                    Paso 2: Información del Autor
                </h4>

                <div className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Autor * <span className="text-red-500">Requerido</span>
                        </label>
                        <SelectConBusqueda
                            value={nuevoLibro.autor_nombre}
                            onChange={(value) => {
                                setNuevoLibro((prev) => ({
                                    ...prev,
                                    autor_nombre: value,
                                }));
                            }}
                            options={autores}
                            placeholder="Seleccionar autor"
                            disabled={guardando}
                            displayField="nombre_completo"
                            apiEndpoint="/admin/api/autores"
                            onNewIndicator={setIsAutorNuevo}
                            maxOptions={15}
                            isError={!nuevoLibro.autor_nombre}
                        />

                        {nuevoLibro.autor_nombre && isAutorNuevo && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                                <Plus className="h-3 w-3" />
                                Nuevo: {nuevoLibro.autor_nombre}
                            </div>
                        )}

                        {!nuevoLibro.autor_nombre && <p className="mt-1 text-xs text-red-600">El autor es obligatorio para continuar</p>}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Apellidos/Seudónimo</label>
                        <input
                            type="text"
                            value={nuevoLibro.autor_apellidos}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, autor_apellidos: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            placeholder="Márquez"
                            disabled={guardando}
                        />
                    </div>
                </div>

                {/* Validación visual */}
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center gap-2 text-sm">
                        <div className={`h-3 w-3 rounded-full ${nuevoLibro.autor_nombre ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={nuevoLibro.autor_nombre ? 'text-green-700' : 'text-red-700'}>
                            Autor {nuevoLibro.autor_nombre ? 'completado' : 'requerido'}
                        </span>
                    </div>
                </div>

                {/* Nota sobre editorial */}
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Editorial ya configurada:</span>
                        <span>{nuevoLibro.editorial_nombre || 'Sin definir'}</span>
                    </div>
                    <p className="mt-1 text-xs text-green-600">
                        La editorial se tomó de la información de factura configurada arriba
                    </p>
                </div>
            </div>
        </div>
    );
};

const PasoInformacionComercial: React.FC<PasoProps> = ({ nuevoLibro, setNuevoLibro, guardando }) => {
    const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<string[]>([]);
    const [categorias] = useState<{ id: number; nombre: string; descripción?: string }[]>([]);

    const agregarEtiqueta = useCallback(
        (etiqueta: string) => {
            if (!etiquetasSeleccionadas.includes(etiqueta)) {
                const nuevasEtiquetas = [...etiquetasSeleccionadas, etiqueta];
                setEtiquetasSeleccionadas(nuevasEtiquetas);
                setNuevoLibro((prev) => ({
                    ...prev,
                    genero: nuevasEtiquetas.join(', '),
                    etiquetas: nuevasEtiquetas.join(', '),
                }));
            }
        },
        [etiquetasSeleccionadas, setNuevoLibro],
    );

    const quitarEtiqueta = useCallback(
        (etiqueta: string) => {
            const nuevasEtiquetas = etiquetasSeleccionadas.filter((e) => e !== etiqueta);
            setEtiquetasSeleccionadas(nuevasEtiquetas);
            setNuevoLibro((prev) => ({
                ...prev,
                genero: nuevasEtiquetas.length > 0 ? nuevasEtiquetas.join(', ') : 'General',
                etiquetas: nuevasEtiquetas.join(', '),
            }));
        },
        [etiquetasSeleccionadas, setNuevoLibro],
    );

    return (
        <div className="space-y-6">
            <div className="rounded-lg bg-emerald-50 p-6">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                    <DollarSign className="h-5 w-5 text-gray-600" />
                    Paso 3: Información Comercial
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Cantidad * <span className="text-red-500">Requerido</span>
                        </label>
                        <input
                            type="number"
                            value={nuevoLibro.cantidad}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))}
                            className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                !nuevoLibro.cantidad || nuevoLibro.cantidad <= 0 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            min="1"
                            disabled={guardando}
                        />
                        {(!nuevoLibro.cantidad || nuevoLibro.cantidad <= 0) && (
                            <p className="mt-1 text-xs text-red-600">La cantidad debe ser mayor a 0</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Precio Venta * <span className="text-red-500">Requerido</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={nuevoLibro.valorUnitario}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, valorUnitario: parseFloat(e.target.value) || 0 }))}
                            className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                nuevoLibro.valorUnitario < 0 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="0.00"
                            disabled={guardando}
                        />
                        {nuevoLibro.valorUnitario < 0 && <p className="mt-1 text-xs text-red-600">El precio no puede ser negativo</p>}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Descuento</label>
                        <input
                            type="number"
                            step="0.01"
                            value={nuevoLibro.descuento}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, descuento: parseFloat(e.target.value) || 0 }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                            disabled={guardando}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Total</label>
                        <div className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-semibold text-emerald-700">
                            ${((nuevoLibro.valorUnitario || 0) * (nuevoLibro.cantidad || 1) - (nuevoLibro.descuento || 0)).toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            <EtiquetasSelector
                etiquetasSeleccionadas={etiquetasSeleccionadas}
                categorias={categorias}
                onAgregarEtiqueta={agregarEtiqueta}
                onQuitarEtiqueta={quitarEtiqueta}
                guardando={guardando}
            />

            {/* Validación visual */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center gap-2 text-sm">
                    <div className={`h-3 w-3 rounded-full ${nuevoLibro.cantidad > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={nuevoLibro.cantidad > 0 ? 'text-green-700' : 'text-red-700'}>
                        Cantidad {nuevoLibro.cantidad > 0 ? 'válida' : 'requerida'}
                    </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm">
                    <div className={`h-3 w-3 rounded-full ${nuevoLibro.valorUnitario >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={nuevoLibro.valorUnitario >= 0 ? 'text-green-700' : 'text-red-700'}>
                        Precio {nuevoLibro.valorUnitario >= 0 ? 'válido' : 'inválido'}
                    </span>
                </div>
            </div>
        </div>
    );
};

const PasoDetallesAdicionales: React.FC<PasoProps> = ({ nuevoLibro, setNuevoLibro, guardando }) => (
    <div className="space-y-6">
        {/* Imagen */}
        <div className="rounded-lg bg-indigo-50 p-6">
            <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                <FileImage className="h-5 w-5 text-gray-600" />
                Paso 4: Imagen del Libro (Opcional)
            </h4>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Vista previa</label>
                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
                        {nuevoLibro.imagen_url ? (
                            <div className="relative">
                                <img
                                    src={nuevoLibro.imagen_url}
                                    alt="Preview"
                                    className="h-32 w-full rounded-lg object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder-book.png';
                                    }}
                                />
                                <button
                                    onClick={() => setNuevoLibro((prev: any) => ({ ...prev, imagen_url: '' }))}
                                    className="absolute top-2 right-2 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                                    disabled={guardando}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ) : (
                            <div className="py-4">
                                <FileImage className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                                <p className="text-xs text-gray-500">No hay imagen</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">URL de imagen</label>
                        <input
                            type="url"
                            value={nuevoLibro.imagen_url}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, imagen_url: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            placeholder="https://ejemplo.com/imagen.jpg"
                            disabled={guardando}
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Descripción */}
        <div className="rounded-lg bg-gray-50 p-6">
            <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                <FileText className="h-5 w-5 text-gray-600" />
                Descripción (Opcional)
            </h4>

            <textarea
                value={nuevoLibro.descripcion}
                onChange={(e) => setNuevoLibro((prev) => ({ ...prev, descripcion: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción del libro, sinopsis, reseña..."
                disabled={guardando}
            />
        </div>

        {/* Información adicional */}
        <div className="rounded-lg bg-purple-50 p-6">
            <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                <Package className="h-5 w-5 text-gray-600" />
                Información Adicional (Opcional)
            </h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Peso (gramos)</label>
                    <input
                        type="number"
                        value={nuevoLibro.peso || ''}
                        onChange={(e) => setNuevoLibro((prev) => ({ ...prev, peso: parseFloat(e.target.value) || null }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        placeholder="450"
                        min="1"
                        step="0.1"
                        disabled={guardando}
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Dimensiones</label>
                    <input
                        type="text"
                        value={nuevoLibro.dimensiones}
                        onChange={(e) => setNuevoLibro((prev) => ({ ...prev, dimensiones: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        placeholder="15x23x2 cm"
                        disabled={guardando}
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Ubicación Física</label>
                    <input
                        type="text"
                        value={nuevoLibro.ubicacion_fisica}
                        onChange={(e) => setNuevoLibro((prev) => ({ ...prev, ubicacion_fisica: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        placeholder="Estante A-1, Nivel 2"
                        disabled={guardando}
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Estado Físico</label>
                    <select
                        value={nuevoLibro.estado_fisico}
                        onChange={(e) => setNuevoLibro((prev) => ({ ...prev, estado_fisico: e.target.value as any }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        disabled={guardando}
                    >
                        <option value="nuevo">Nuevo</option>
                        <option value="usado">Usado</option>
                        <option value="renovado">Renovado</option>
                        <option value="dañado">Dañado</option>
                    </select>
                </div>
            </div>

            <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Notas Internas</label>
                <textarea
                    value={nuevoLibro.notas_internas}
                    onChange={(e) => setNuevoLibro((prev) => ({ ...prev, notas_internas: e.target.value }))}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="Ejemplar firmado por el autor, primera edición, etc."
                    disabled={guardando}
                />
            </div>
        </div>

        {/* Resumen final */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
            <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">✓ Resumen del Libro</h4>

            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div>
                    <span className="font-medium text-gray-700">Factura:</span>
                    <span className="ml-2 text-gray-900">{nuevoLibro.serieFactura}{nuevoLibro.folioFactura}</span>
                </div>
                <div>
                    <span className="font-medium text-gray-700">Proveedor:</span>
                    <span className="ml-2 text-gray-900">{nuevoLibro.editorial_nombre}</span>
                </div>
                <div>
                    <span className="font-medium text-gray-700">ISBN:</span>
                    <span className="ml-2 text-gray-900">{nuevoLibro.isbn}</span>
                </div>
                <div>
                    <span className="font-medium text-gray-700">Título:</span>
                    <span className="ml-2 text-gray-900">{nuevoLibro.titulo}</span>
                </div>
                <div>
                    <span className="font-medium text-gray-700">Autor:</span>
                    <span className="ml-2 text-gray-900">{nuevoLibro.autor_nombre}</span>
                </div>
                <div>
                    <span className="font-medium text-gray-700">Cantidad:</span>
                    <span className="ml-2 text-gray-900">{nuevoLibro.cantidad}</span>
                </div>
                <div>
                    <span className="font-medium text-gray-700">Precio:</span>
                    <span className="ml-2 text-gray-900">${nuevoLibro.valorUnitario}</span>
                </div>
                <div>
                    <span className="font-medium text-gray-700">Total:</span>
                    <span className="ml-2 font-semibold text-green-700">
                        ${((nuevoLibro.valorUnitario || 0) * (nuevoLibro.cantidad || 1) - (nuevoLibro.descuento || 0)).toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    </div>
);

// =============================================
// 📝 COMPONENTE PRINCIPAL
// =============================================

export const LibroManualForm: React.FC<LibroManualFormProps> = ({
    nuevoLibro,
    setNuevoLibro,
    guardando,
    onAgregarLibro,
    onBuscarISBN,
    buscandoISBNs,
    datosFactura,
}) => {
        console.log('🔍 LibroManualForm renderizado con:', {
        datosFactura,
        nuevoLibro_factura: {
            serieFactura: nuevoLibro.serieFactura,
            folioFactura: nuevoLibro.folioFactura,
            fechaFactura: nuevoLibro.fechaFactura,
            editorial_nombre: nuevoLibro.editorial_nombre
        }
    });
    const [pasoActual, setPasoActual] = useState(1);
    const [pasoCompletado, setPasoCompletado] = useState<{ [key: number]: boolean }>({});

    // ✅ VERIFICAR SI LA FACTURA ESTÁ CONFIGURADA
    const tieneFacturaCompleta = () => {
        return !!(
            (nuevoLibro.serieFactura || datosFactura?.serie) &&
            (nuevoLibro.folioFactura || datosFactura?.folio) &&
            (nuevoLibro.fechaFactura || datosFactura?.fecha) &&
            (nuevoLibro.editorial_nombre || datosFactura?.editorial)
        );
    };

    const validarPaso = useCallback(
        (paso: number): boolean => {
            switch (paso) {
                case 1:
                    // Validar información básica del libro
                    return !!(nuevoLibro.isbn && nuevoLibro.titulo);
                case 2:
                    // Validar autor
                    return !!nuevoLibro.autor_nombre;
                case 3:
                    // Validar información comercial
                    return !!(nuevoLibro.cantidad > 0 && nuevoLibro.valorUnitario >= 0);
                case 4:
                    // Paso opcional
                    return true;
                default:
                    return false;
            }
        },
        [nuevoLibro],
    );

    const avanzarPaso = useCallback(() => {
        if (validarPaso(pasoActual)) {
            setPasoCompletado((prev) => ({ ...prev, [pasoActual]: true }));
            if (pasoActual < 4) {
                setPasoActual(pasoActual + 1);
            }
        }
    }, [pasoActual, validarPaso]);

    const retrocederPaso = useCallback(() => {
        if (pasoActual > 1) {
            setPasoActual(pasoActual - 1);
        }
    }, [pasoActual]);

    const resetearFormulario = useCallback(() => {
        setNuevoLibro({
            isbn: '',
            titulo: '',
            cantidad: 1,
            valorUnitario: 0,
            descuento: 0,
            autor_nombre: '',
            autor_apellidos: '',
            editorial_nombre: datosFactura?.editorial || '',
            año_publicacion: null,
            paginas: null,
            descripcion: '',
            genero: 'General',
            etiquetas: '',
            imagen_url: '',
            url_compra: '',
            peso: null,
            dimensiones: '',
            estado_fisico: 'nuevo',
            ubicacion_fisica: '',
            notas_internas: '',
            clave_prodserv: '55101500',
            unidad: 'PZA',
            claveUnidad: 'H87',
            objetoImp: '02',
            rfcProveedor: datosFactura?.rfc || '',
            regimenFiscalProveedor: datosFactura?.regimenFiscal || '',
            metodoPago: 'PPD',
            formaPago: '99',
            condicionesPago: '',
            usoCfdi: 'G01',
            baseImpuesto: null,
            tipoImpuesto: '002',
            tasaImpuesto: 0,
            importeImpuesto: 0,
            folioFactura: datosFactura?.folio || '',
            serieFactura: datosFactura?.serie || '',
            fechaFactura: datosFactura?.fecha || '',
            uuidFactura: datosFactura?.uuid || '',
        });
        setPasoActual(1);
        setPasoCompletado({});
    }, [setNuevoLibro, datosFactura]);

    return (
        <div className="space-y-6">
            {/* ✅ SECCIÓN DE FACTURA (FUERA DE PASOS) */}
            <SeccionFactura
                nuevoLibro={nuevoLibro}
                setNuevoLibro={setNuevoLibro}
                guardando={guardando}
                datosFactura={datosFactura}
            />

            {/* ✅ WIZARD DE LIBROS (SOLO SI FACTURA ESTÁ CONFIGURADA) */}
            {tieneFacturaCompleta() ? (
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Agregar Libro Manual</h3>
                        <span className="text-sm text-gray-500">Paso {pasoActual} de 4</span>
                    </div>

                    {/* Barra de progreso */}
                    <ProgressBar pasoActual={pasoActual} pasoCompletado={pasoCompletado} onCambiarPaso={setPasoActual} totalPasos={4} />

                    {/* Títulos de pasos */}
                    <div className="mb-8 grid grid-cols-4 gap-4 text-center text-xs text-gray-600">
                        <div className={pasoActual === 1 ? 'font-semibold text-blue-600' : ''}>Información Básica</div>
                        <div className={pasoActual === 2 ? 'font-semibold text-blue-600' : ''}>Autor</div>
                        <div className={pasoActual === 3 ? 'font-semibold text-blue-600' : ''}>Información Comercial</div>
                        <div className={pasoActual === 4 ? 'font-semibold text-blue-600' : ''}>Detalles Adicionales</div>
                    </div>

                    {/* Contenido de cada paso */}
                    {pasoActual === 1 && <PasoInformacionBasica
                        nuevoLibro={nuevoLibro}
                        setNuevoLibro={setNuevoLibro}
                        guardando={guardando}
                        onBuscarISBN={onBuscarISBN}
                        buscandoISBNs={buscandoISBNs}
                    />}
                    {pasoActual === 2 && <PasoAutorEditorial
                        nuevoLibro={nuevoLibro}
                        setNuevoLibro={setNuevoLibro}
                        guardando={guardando}
                    />}
                    {pasoActual === 3 && <PasoInformacionComercial
                        nuevoLibro={nuevoLibro}
                        setNuevoLibro={setNuevoLibro}
                        guardando={guardando}
                    />}
                    {pasoActual === 4 && <PasoDetallesAdicionales
                        nuevoLibro={nuevoLibro}
                        setNuevoLibro={setNuevoLibro}
                        guardando={guardando}
                    />}

                    {/* Botones de navegación */}
                    <NavigationButtons
                        pasoActual={pasoActual}
                        totalPasos={4}
                        validarPaso={validarPaso}
                        onRetroceder={retrocederPaso}
                        onAvanzar={avanzarPaso}
                        onLimpiar={resetearFormulario}
                        onAgregarLibro={onAgregarLibro}
                        guardando={guardando}
                        tieneFacturaCompleta={tieneFacturaCompleta()}
                    />

                    {/* Indicador de validación */}
                    <ValidationIndicator validarPaso={validarPaso} totalPasos={4} />
                </div>
            ) : (
                /* ✅ MENSAJE CUANDO NO HAY FACTURA CONFIGURADA */
                <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                        <AlertTriangle className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900">Factura Requerida</h3>
                    <p className="text-sm text-gray-600">
                        Todos los libros deben estar vinculados a una factura. Complete la información de factura arriba
                        para poder agregar libros al inventario con la trazabilidad fiscal correcta.
                    </p>
                </div>
            )}
        </div>
    );
};

// =============================================
// 🧩 COMPONENTES AUXILIARES
// =============================================

const ProgressBar: React.FC<{
    pasoActual: number;
    pasoCompletado: { [key: number]: boolean };
    onCambiarPaso: (paso: number) => void;
    totalPasos: number;
}> = ({ pasoActual, pasoCompletado, onCambiarPaso, totalPasos }) => (
    <div className="mb-8 flex items-center space-x-4">
        {Array.from({ length: totalPasos }, (_, i) => i + 1).map((paso) => {
            const completado = pasoCompletado[paso];
            const actual = paso === pasoActual;
            const accesible = paso <= pasoActual || completado;

            return (
                <React.Fragment key={paso}>
                    <button
                        onClick={() => (accesible ? onCambiarPaso(paso) : null)}
                        disabled={!accesible}
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                            completado
                                ? 'bg-green-600 text-white'
                                : actual
                                  ? 'bg-blue-600 text-white'
                                  : accesible
                                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    : 'cursor-not-allowed bg-gray-100 text-gray-400'
                        }`}
                    >
                        {completado ? '✓' : paso}
                    </button>
                    {paso < totalPasos && <div className={`h-1 flex-1 rounded ${pasoCompletado[paso] ? 'bg-green-600' : 'bg-gray-200'}`} />}
                </React.Fragment>
            );
        })}
    </div>
);

const EtiquetasSelector: React.FC<{
    etiquetasSeleccionadas: string[];
    categorias: any[];
    onAgregarEtiqueta: (etiqueta: string) => void;
    onQuitarEtiqueta: (etiqueta: string) => void;
    guardando: boolean;
}> = ({ etiquetasSeleccionadas, categorias, onAgregarEtiqueta, onQuitarEtiqueta, guardando }) => (
    <div className="rounded-lg bg-green-50 p-6">
        <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
            <Tag className="h-5 w-5 text-gray-600" />
            Etiquetas/Categorías
        </h4>

        {/* Selector para agregar etiquetas */}
        <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">Agregar etiqueta</label>
            <SelectConBusqueda
                value=""
                onChange={(value) => {
                    if (value) {
                        onAgregarEtiqueta(value);
                    }
                }}
                options={categorias}
                placeholder="Seleccionar etiqueta"
                disabled={guardando}
                apiEndpoint="/admin/api/etiquetas"
                maxOptions={15}
            />
        </div>

        {/* Lista de etiquetas seleccionadas */}
        <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">Etiquetas seleccionadas</label>
            <div className="flex flex-wrap gap-2">
                {etiquetasSeleccionadas.map((etiqueta, index) => (
                    <span key={index} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                        {etiqueta}
                        {!guardando && (
                            <button
                                onClick={() => onQuitarEtiqueta(etiqueta)}
                                className="ml-1 text-blue-500 hover:text-red-600"
                                title={`Quitar ${etiqueta}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </span>
                ))}
                {etiquetasSeleccionadas.length === 0 && (
                    <span className="text-sm text-gray-500 italic">
                        No hay etiquetas seleccionadas. Agregue al menos una etiqueta para categorizar el libro.
                    </span>
                )}
            </div>
        </div>

        {/* Campo manual para etiquetas adicionales */}
        <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Agregar etiqueta personalizada</label>
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Escribir nueva etiqueta..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    disabled={guardando}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            const valor = input.value.trim();
                            if (valor) {
                                onAgregarEtiqueta(valor);
                                input.value = '';
                            }
                        }
                    }}
                />
                <button
                    onClick={(e) => {
                        const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                        const valor = input.value.trim();
                        if (valor) {
                            onAgregarEtiqueta(valor);
                            input.value = '';
                        }
                    }}
                    className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    disabled={guardando}
                >
                    <Plus className="h-4 w-4" />
                    Agregar
                </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Presiona Enter o el botón para agregar</p>
        </div>
    </div>
);

const NavigationButtons: React.FC<{
    pasoActual: number;
    totalPasos: number;
    validarPaso: (paso: number) => boolean;
    onRetroceder: () => void;
    onAvanzar: () => void;
    onLimpiar: () => void;
    onAgregarLibro: () => void;
    guardando: boolean;
    tieneFacturaCompleta: boolean;
}> = ({ pasoActual, totalPasos, validarPaso, onRetroceder, onAvanzar, onLimpiar, onAgregarLibro, guardando, tieneFacturaCompleta }) => (
    <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <div className="flex gap-3">
            {pasoActual > 1 && (
                <button
                    onClick={onRetroceder}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                    disabled={guardando}
                >
                    ← Anterior
                </button>
            )}

            <button
                onClick={onLimpiar}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                disabled={guardando}
            >
                <X className="h-4 w-4" />
                Limpiar Todo
            </button>
        </div>

        <div className="flex gap-3">
            {pasoActual < totalPasos ? (
                <button
                    onClick={onAvanzar}
                    disabled={!validarPaso(pasoActual) || guardando}
                    className={`flex items-center gap-2 rounded-lg px-6 py-2 text-white transition-colors ${
                        validarPaso(pasoActual) ? 'bg-blue-600 hover:bg-blue-700' : 'cursor-not-allowed bg-gray-400'
                    }`}
                >
                    Siguiente →
                </button>
            ) : (
                <button
                    onClick={onAgregarLibro}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    disabled={guardando || !validarPaso(1) || !validarPaso(2) || !validarPaso(3) || !tieneFacturaCompleta}
                >
                    <Plus className="h-4 w-4" />
                    Agregar Libro
                </button>
            )}
        </div>
    </div>
);

const ValidationIndicator: React.FC<{
    validarPaso: (paso: number) => boolean;
    totalPasos: number;
}> = ({ validarPaso, totalPasos }) => (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
        <div className="mb-2 text-xs text-black">Estado de validación:</div>
        <div className="flex flex-wrap gap-4 text-xs text-black">
            {Array.from({ length: totalPasos }, (_, i) => i + 1).map((paso) => (
                <div key={paso} className="flex items-center gap-1">
                    <div className={`h-2 w-2 rounded-full ${validarPaso(paso) ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>Paso {paso}: {validarPaso(paso) ? 'Completo' : 'Incompleto'}</span>
                </div>
            ))}
        </div>
    </div>
);


