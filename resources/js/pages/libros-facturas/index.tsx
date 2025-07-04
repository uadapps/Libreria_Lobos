import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Button } from '@headlessui/react';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertTriangle,
    BarChart3,
    BookOpen,
    Building2,
    Database,
    DollarSign,
    FileImage,
    FileText,
    Loader,
    Package,
    Plus,
    Save,
    Tag,
    Trash2,
    Upload,
    Users,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LibroDetallesModal from '../../components/libros/LibroDetailsModal';
import VistaLibros from '../../components/libros/VistaLibros';
import { DatabaseSearchService } from '../../services/ISBN/DatabaseSearchService';
import { EstadisticasLibros, FacturaLibro, LibroCompleto } from '../../types/LibroCompleto';
interface ResultadoGuardado {
    guardados: number;
    errores: number;
    detalles: Array<{
        isbn: string;
        titulo: string;
        id_generado?: number;
        status: 'success' | 'error';
        error?: string;
    }>;
    autores_creados: number;
    editoriales_creadas: number;
    etiquetas_creadas: number;
}

interface EstadisticasPostGuardado {
    libros_total: number;
    autores_total: number;
    editoriales_total: number;
    etiquetas_total: number;
    ultima_actualizacion: string;
}
interface DatosFactura {
    folio: string;
    fecha: string;
    editorial: string;
    numeroConceptos: number;
    procesado: boolean;
    serie: string;
    fechaTimbrado?: string;
    subtotal: number;
    descuento: number;
    total: number;
    moneda: string;
    tipoCambio: number;
    tipoComprobante: string;
    metodoPago: string;
    formaPago: string;
    condicionesPago: string;
    lugarExpedicion: string;

    // Datos del emisor (proveedor)
    emisor: {
        rfc: string;
        nombre: string;
        regimenFiscal: string;
    };

    // Datos del receptor (tu empresa)
    receptor: {
        rfc: string;
        nombre: string;
        usoCfdi: string;
        domicilioFiscal: string;
        regimenFiscal: string;
    };

    // Timbre fiscal
    timbreFiscal?: {
        uuid: string;
        fechaTimbrado: string;
        selloCfd: string;
        noCertificadoSat: string;
        selloSat: string;
        rfcProvCertif: string;
    };

    // Impuestos
    impuestos: {
        totalImpuestosTrasladados: number;
        traslados: Array<{
            base: number;
            impuesto: string;
            tipoFactor: string;
            tasaOCuota: number;
            importe: number;
        }>;
    };
}

interface ConceptoFactura {
    cantidad: number;
    claveProdServ: string;
    claveUnidad: string;
    descripcion: string;
    noIdentificacion: string; // ISBN
    objetoImp: string;
    unidad: string;
    valorUnitario: number;
    importe: number;
    descuento?: number;
    impuestos?: {
        traslados?: Array<{
            base: number;
            impuesto: string;
            tipoFactor: string;
            tasaOCuota: number;
            importe: number;
        }>;
    };
}

/* interface LibroManual {
    // Básicos
    isbn: string;
    titulo: string;
    cantidad: number;
    valorUnitario: number;
    descuento: number;

    // Información del libro
    autor_nombre: string;
    autor_apellidos: string;
    editorial_nombre: string;
    año_publicacion: number | null;
    paginas: number | null;
    descripcion: string;

    // Categorización
    genero: string;
    etiquetas: string; // separadas por comas

    // Imágenes y URLs
    imagen_url: string;
    url_compra: string;

    // Físicos
    peso: number | null;
    dimensiones: string;

    // Estado
    estado_fisico: 'nuevo' | 'usado' | 'renovado' | 'dañado';
    ubicacion_fisica: string;
    notas_internas: string;
} */

interface LibroManual {
    // Campos existentes...
    isbn: string;
    titulo: string;
    cantidad: number;
    valorUnitario: number;
    descuento: number;
    autor_nombre: string;
    autor_apellidos: string;
    editorial_nombre: string;
    año_publicacion: number | null;
    paginas: number | null;
    descripcion: string;
    genero: string;
    etiquetas: string;
    imagen_url: string;
    url_compra: string;
    peso: number | null;
    dimensiones: string;
    estado_fisico: 'nuevo' | 'usado' | 'renovado' | 'dañado';
    ubicacion_fisica: string;
    notas_internas: string;

    // NUEVOS CAMPOS DEL CFDI
    clave_prodserv: string;
    unidad: string;
    claveUnidad: string;
    objetoImp: string;

    // Datos fiscales
    rfcProveedor: string;
    regimenFiscalProveedor: string;
    metodoPago: string;
    formaPago: string;
    condicionesPago: string;
    usoCfdi: string;

    // Impuestos
    baseImpuesto: number | null;
    tipoImpuesto: string;
    tasaImpuesto: number | null;
    importeImpuesto: number | null;

    // Datos de factura
    folioFactura: string;
    serieFactura: string;
    fechaFactura: string;
    uuidFactura: string;
}

const ResultadoGuardado: React.FC<{
    resultado: ResultadoGuardado;
    onCerrar: () => void;
    estadisticasPost?: EstadisticasPostGuardado;
}> = ({ resultado, onCerrar, estadisticasPost }) => {
    const porcentajeExito = Math.round((resultado.guardados / (resultado.guardados + resultado.errores)) * 100);
    return (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
            <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
                <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                            <Save className="h-6 w-6 text-green-600" />
                            Guardado Completado
                        </h3>
                        <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600">
                            ✕
                        </button>
                    </div>
                    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-lg bg-green-50 p-4 text-center">
                            <div className="text-2xl font-bold text-green-800">{resultado.guardados}</div>
                            <div className="text-sm text-green-600">Guardados</div>
                        </div>
                        {resultado.errores > 0 && (
                            <div className="rounded-lg bg-red-50 p-4 text-center">
                                <div className="text-2xl font-bold text-red-800">{resultado.errores}</div>
                                <div className="text-sm text-red-600">Errores</div>
                            </div>
                        )}
                        <div className="rounded-lg bg-blue-50 p-4 text-center">
                            <div className="text-2xl font-bold text-blue-800">{porcentajeExito}%</div>
                            <div className="text-sm text-blue-600">Éxito</div>
                        </div>
                    </div>
                    {(resultado.autores_creados > 0 || resultado.editoriales_creadas > 0 || resultado.etiquetas_creadas > 0) && (
                        <div className="mb-6">
                            <h4 className="mb-3 text-sm font-medium text-gray-700">Nuevos registros creados:</h4>
                            <div className="grid grid-cols-3 gap-3">
                                {resultado.autores_creados > 0 && (
                                    <div className="flex items-center gap-2 rounded bg-purple-50 p-2">
                                        <Users className="h-4 w-4 text-purple-600" />
                                        <span className="text-sm text-purple-700">{resultado.autores_creados} autores</span>
                                    </div>
                                )}
                                {resultado.editoriales_creadas > 0 && (
                                    <div className="flex items-center gap-2 rounded bg-orange-50 p-2">
                                        <Building2 className="h-4 w-4 text-orange-600" />
                                        <span className="text-sm text-orange-700">{resultado.editoriales_creadas} editoriales</span>
                                    </div>
                                )}
                                {resultado.etiquetas_creadas > 0 && (
                                    <div className="flex items-center gap-2 rounded bg-indigo-50 p-2">
                                        <Tag className="h-4 w-4 text-indigo-600" />
                                        <span className="text-sm text-indigo-700">{resultado.etiquetas_creadas} etiquetas</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {estadisticasPost && (
                        <div className="mb-6">
                            <h4 className="mb-3 text-sm font-medium text-gray-700">Estado actual de la base de datos:</h4>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                <div className="rounded bg-gray-50 p-2 text-center">
                                    <div className="font-bold text-gray-800">{estadisticasPost.libros_total}</div>
                                    <div className="text-xs text-gray-600">Libros</div>
                                </div>
                                <div className="rounded bg-gray-50 p-2 text-center">
                                    <div className="font-bold text-gray-800">{estadisticasPost.autores_total}</div>
                                    <div className="text-xs text-gray-600">Autores</div>
                                </div>
                                <div className="rounded bg-gray-50 p-2 text-center">
                                    <div className="font-bold text-gray-800">{estadisticasPost.editoriales_total}</div>
                                    <div className="text-xs text-gray-600">Editoriales</div>
                                </div>
                                <div className="rounded bg-gray-50 p-2 text-center">
                                    <div className="font-bold text-gray-800">{estadisticasPost.etiquetas_total}</div>
                                    <div className="text-xs text-gray-600">Etiquetas</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {resultado.detalles.some((d) => d.status === 'error') && (
                        <div className="mb-4">
                            <h4 className="mb-2 text-sm font-medium text-red-700">Libros con errores:</h4>
                            <div className="max-h-32 overflow-y-auto rounded bg-red-50 p-3">
                                {resultado.detalles
                                    .filter((d) => d.status === 'error')
                                    .map((detalle, index) => (
                                        <div key={index} className="mb-1 text-xs text-red-600">
                                            <strong>{detalle.isbn}</strong> - {detalle.titulo}: {detalle.error}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button onClick={onCerrar} className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
                            Continuar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
const InfoFacturaProcesada: React.FC<{
    datosFactura: DatosFactura;
    onLimpiar: () => void;
}> = ({ datosFactura, onLimpiar }) => {
    return (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                        <p className="text-sm font-medium text-blue-800">Factura Procesada: {datosFactura.folio}</p>
                        <p className="text-xs text-blue-600">
                            {datosFactura.fecha} • {datosFactura.editorial} • {datosFactura.numeroConceptos} conceptos
                        </p>
                    </div>
                </div>
                <button
                    onClick={onLimpiar}
                    className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                    title="Procesar nueva factura"
                >
                    Nueva Factura
                </button>
            </div>
        </div>
    );
};

const useEstadisticasLibros = (libros: LibroCompleto[]): EstadisticasLibros => {
    return useMemo(() => {
        const stats: EstadisticasLibros = {
            total: libros.length,
            procesados: 0,
            errores: 0,
            valorTotal: 0,
            cantidadTotal: 0,
            fuenteBD: 0,
            fuenteAPIs: 0,
            fuenteManual: 0,
            conImagenes: 0,
            informacionCompleta: 0,
            informacionLimitada: 0,
            porcentajeProcesados: 0,
            porcentajeErrores: 0,
            porcentajeConImagenes: 0,
            porcentajeCompleta: 0,
        };

        libros.forEach((libro) => {
            // Estados
            if (libro.estado === 'procesado') stats.procesados++;
            if (libro.estado === 'error') stats.errores++;

            // Valores
            stats.valorTotal += libro.total;
            stats.cantidadTotal += libro.cantidad;

            // Fuentes
            if (libro.fuente?.includes('Manual')) stats.fuenteManual++;
            else if (libro.fuente?.includes('APIs externas')) stats.fuenteAPIs++;
            else stats.fuenteBD++;

            // Calidad de datos
            if (libro.imagenUrl || libro.imagen_url) stats.conImagenes++;
            if (libro.informacionLimitada) stats.informacionLimitada++;
            else stats.informacionCompleta++;
        });

        // Calcular porcentajes
        if (stats.total > 0) {
            stats.porcentajeProcesados = Math.round((stats.procesados / stats.total) * 100);
            stats.porcentajeErrores = Math.round((stats.errores / stats.total) * 100);
            stats.porcentajeConImagenes = Math.round((stats.conImagenes / stats.total) * 100);
            stats.porcentajeCompleta = Math.round((stats.informacionCompleta / stats.total) * 100);
        }

        return stats;
    }, [libros]);
};

export default function LibrosFacturas() {
    const { flash, resultado, estadisticasPost } = usePage().props as {
        flash?: { success?: string; error?: string };
        resultado?: ResultadoGuardado;
        estadisticasPost?: EstadisticasPostGuardado;
    };
    const [libros, setLibros] = useState<LibroCompleto[]>([]);
    const [modoAgregar, setModoAgregar] = useState<'manual' | 'factura'>('factura');
    const [editando, setEditando] = useState<string | null>(null);
    const [archivoXML, setArchivoXML] = useState<File | null>(null);
    const [progresoBusqueda, setProgresoBusqueda] = useState<{ actual: number; total: number } | null>(null);
    const [buscandoISBNs, setBuscandoISBNs] = useState(false);
    const [libroSeleccionado, setLibroSeleccionado] = useState<LibroCompleto | null>(null);
    const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false);

    // ✅ AGREGAR estos estados nuevos
    const [isEditorialNueva, setIsEditorialNueva] = useState(false);
    const [isAutorNuevo, setIsAutorNuevo] = useState(false);
    const [isGeneroNuevo, setIsGeneroNuevo] = useState(false);

    const [guardando, setGuardando] = useState(false);
    const [resultadoGuardado, setResultadoGuardado] = useState<ResultadoGuardado | null>(null);
    const [estadisticasPostGuardado, setEstadisticasPostGuardado] = useState<EstadisticasPostGuardado | null>(null);
    const [mostrarEstadisticasAvanzadas, setMostrarEstadisticasAvanzadas] = useState(false);
    const [datosFactura, setDatosFactura] = useState<DatosFactura | null>(null);
    const [estadisticasBusqueda, setEstadisticasBusqueda] = useState<{
        total: number;
        encontrados: number;
        noEncontrados: number;
        tablasNuevas: number;
        tablasViejas: number;
        apisExternas: number;
        isbnsOriginales: string[];
        ultimaActualizacion: Date;
    } | null>(null);
    /*    const [nuevoLibro, setNuevoLibro] = useState<LibroManual>({
        // Básicos
        isbn: '',
        titulo: '',
        cantidad: 1,
        valorUnitario: 0,
        descuento: 0,

        // Información del libro
        autor_nombre: '',
        autor_apellidos: '',
        editorial_nombre: '',
        año_publicacion: null,
        paginas: null,
        descripcion: '',

        // Categorización
        genero: 'General',
        etiquetas: '',

        // Imágenes y URLs
        imagen_url: '',
        url_compra: '',

        // Físicos
        peso: null,
        dimensiones: '',

        // Estado
        estado_fisico: 'nuevo',
        ubicacion_fisica: '',
        notas_internas: '',
    });
 */

    const [nuevoLibro, setNuevoLibro] = useState<LibroManual>({
        // Campos existentes...
        isbn: '',
        titulo: '',
        cantidad: 1,
        valorUnitario: 0,
        descuento: 0,
        autor_nombre: '',
        autor_apellidos: '',
        editorial_nombre: '',
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

        // NUEVOS CAMPOS
        clave_prodserv: '55101500', // Valor por defecto para libros
        unidad: 'PZA',
        claveUnidad: 'H87',
        objetoImp: '02',
        rfcProveedor: '',
        regimenFiscalProveedor: '',
        metodoPago: 'PPD',
        formaPago: '99',
        condicionesPago: '',
        usoCfdi: 'G01',
        baseImpuesto: null,
        tipoImpuesto: '002', // IVA
        tasaImpuesto: 0,
        importeImpuesto: 0,
        folioFactura: '',
        serieFactura: '',
        fechaFactura: '',
        uuidFactura: '',
    });
    const [pasoActual, setPasoActual] = useState(1);
    const [pasoCompletado, setPasoCompletado] = useState<{ [key: number]: boolean }>({});

    // Función para prellenar datos desde la factura cuando existe
    const prellenarDatosDesdeFactura = useCallback(() => {
        if (datosFactura && datosFactura.procesado) {
            setNuevoLibro((prev) => ({
                ...prev,
                // Datos de la factura
                serieFactura: datosFactura.serie || '',
                folioFactura: datosFactura.folio || '',
                fechaFactura: datosFactura.fecha || '',
                uuidFactura: datosFactura.uuid || '',

                // Datos del proveedor
                editorial_nombre: datosFactura.editorial || prev.editorial_nombre,
                rfcProveedor: datosFactura.rfc || '',

                // Si hay régimen fiscal en los datos
                regimenFiscalProveedor: datosFactura.regimenFiscal || '',
            }));
        }
    }, [datosFactura]);

    // Llamar esta función cuando se procese una factura
    useEffect(() => {
        if (datosFactura) {
            prellenarDatosDesdeFactura();
        }
    }, [datosFactura, prellenarDatosDesdeFactura]);

    const validarPaso = (paso: number): boolean => {
        switch (paso) {
            case 1: // Información Básica
                return !!(nuevoLibro.isbn && nuevoLibro.titulo);
            case 2: // Autor y Editorial
                return !!(nuevoLibro.autor_nombre && nuevoLibro.editorial_nombre);
            case 3: // Información Comercial
                return !!(nuevoLibro.cantidad > 0 && nuevoLibro.valorUnitario >= 0);
            case 4: // Información Adicional (opcional)
                return true; // Siempre válido porque es opcional
            case 5: // Información Fiscal (opcional)
                return true; // Siempre válido porque es opcional
            default:
                return false;
        }
    };

    const PasoInformacionFiscal = () => (
        <div className="space-y-6">
            {/* Información de Factura */}
            <div className="rounded-lg bg-yellow-50 p-6">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                    <FileText className="h-5 w-5 text-gray-600" />
                    Información de Factura (Opcional)
                </h4>

                {/* Si hay factura procesada, mostrar info */}
                {datosFactura && (
                    <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-100 p-3">
                        <p className="text-sm text-yellow-800">
                            📄 Vinculado a factura: {datosFactura.serie}
                            {datosFactura.folio} - {datosFactura.editorial}
                        </p>
                        {datosFactura.uuid && <p className="mt-1 text-xs text-yellow-700">UUID: {datosFactura.uuid}</p>}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Serie</label>
                        <input
                            type="text"
                            value={nuevoLibro.serieFactura || datosFactura?.serie || ''}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, serieFactura: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="BB"
                            disabled={guardando || !!datosFactura?.serie}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Folio</label>
                        <input
                            type="text"
                            value={nuevoLibro.folioFactura || datosFactura?.folio || ''}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, folioFactura: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="0910273652"
                            disabled={guardando || !!datosFactura?.folio}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Fecha Factura</label>
                        <input
                            type="date"
                            value={nuevoLibro.fechaFactura || datosFactura?.fecha || ''}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, fechaFactura: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            disabled={guardando || !!datosFactura?.fecha}
                        />
                    </div>

                    <div className="md:col-span-3">
                        <label className="mb-2 block text-sm font-medium text-gray-700">UUID Fiscal</label>
                        <input
                            type="text"
                            value={nuevoLibro.uuidFactura || datosFactura?.uuid || ''}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, uuidFactura: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
                            placeholder="2BC66E61-A6C4-11EF-A62F-D1CE08E131B4"
                            disabled={guardando || !!datosFactura?.uuid}
                        />
                    </div>
                </div>
            </div>

            {/* Información SAT */}
            <div className="rounded-lg bg-blue-50 p-6">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                    <Database className="h-5 w-5 text-gray-600" />
                    Información SAT/CFDI (Opcional)
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Clave Producto/Servicio
                            <span className="ml-1 text-xs text-gray-500">(SAT)</span>
                        </label>
                        <input
                            type="text"
                            value={nuevoLibro.clave_prodserv}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, clave_prodserv: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="55101500"
                            disabled={guardando}
                        />
                        <p className="mt-1 text-xs text-gray-500">55101500 = Libros impresos</p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Unidad</label>
                        <input
                            type="text"
                            value={nuevoLibro.unidad}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, unidad: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Pieza"
                            disabled={guardando}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Clave Unidad
                            <span className="ml-1 text-xs text-gray-500">(SAT)</span>
                        </label>
                        <input
                            type="text"
                            value={nuevoLibro.claveUnidad}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, claveUnidad: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="H87"
                            disabled={guardando}
                        />
                        <p className="mt-1 text-xs text-gray-500">H87 = Pieza</p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Método de Pago</label>
                        <select
                            value={nuevoLibro.metodoPago}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, metodoPago: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            disabled={guardando}
                        >
                            <option value="PUE">PUE - Pago en una sola exhibición</option>
                            <option value="PPD">PPD - Pago en parcialidades o diferido</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Forma de Pago</label>
                        <select
                            value={nuevoLibro.formaPago}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, formaPago: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            disabled={guardando}
                        >
                            <option value="01">01 - Efectivo</option>
                            <option value="02">02 - Cheque nominativo</option>
                            <option value="03">03 - Transferencia electrónica</option>
                            <option value="04">04 - Tarjeta de crédito</option>
                            <option value="28">28 - Tarjeta de débito</option>
                            <option value="99">99 - Por definir</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Uso CFDI</label>
                        <select
                            value={nuevoLibro.usoCfdi}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, usoCfdi: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            disabled={guardando}
                        >
                            <option value="G01">G01 - Adquisición de mercancías</option>
                            <option value="G03">G03 - Gastos en general</option>
                            <option value="P01">P01 - Por definir</option>
                        </select>
                    </div>

                    <div className="md:col-span-3">
                        <label className="mb-2 block text-sm font-medium text-gray-700">Condiciones de Pago</label>
                        <input
                            type="text"
                            value={nuevoLibro.condicionesPago}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, condicionesPago: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Contado, Crédito 30 días, etc."
                            disabled={guardando}
                        />
                    </div>
                </div>
            </div>

            {/* Información del Proveedor */}
            <div className="rounded-lg bg-green-50 p-6">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                    <Building2 className="h-5 w-5 text-gray-600" />
                    Información del Proveedor (Opcional)
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">RFC Proveedor</label>
                        <input
                            type="text"
                            value={nuevoLibro.rfcProveedor || datosFactura?.rfc || ''}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, rfcProveedor: e.target.value.toUpperCase() }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
                            placeholder="RHM540924EFA"
                            maxLength={13}
                            disabled={guardando || !!datosFactura?.rfc}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Régimen Fiscal</label>
                        <select
                            value={nuevoLibro.regimenFiscalProveedor}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, regimenFiscalProveedor: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            disabled={guardando}
                        >
                            <option value="">Seleccionar...</option>
                            <option value="601">601 - General de Ley Personas Morales</option>
                            <option value="603">603 - Personas Morales con Fines no Lucrativos</option>
                            <option value="605">605 - Sueldos y Salarios</option>
                            <option value="606">606 - Arrendamiento</option>
                            <option value="612">612 - Personas Físicas con Actividades Empresariales</option>
                            <option value="621">621 - Incorporación Fiscal</option>
                            <option value="626">626 - Régimen Simplificado de Confianza</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Información de Impuestos */}
            <div className="rounded-lg bg-purple-50 p-6">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                    <DollarSign className="h-5 w-5 text-gray-600" />
                    Información de Impuestos (Opcional)
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Tipo de Impuesto</label>
                        <select
                            value={nuevoLibro.tipoImpuesto}
                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, tipoImpuesto: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            disabled={guardando}
                        >
                            <option value="002">002 - IVA</option>
                            <option value="003">003 - IEPS</option>
                            <option value="001">001 - ISR</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Tasa %</label>
                        <input
                            type="number"
                            step="0.01"
                            value={nuevoLibro.tasaImpuesto || 0}
                            onChange={(e) => {
                                const tasa = parseFloat(e.target.value) || 0;
                                const base = nuevoLibro.valorUnitario * nuevoLibro.cantidad - nuevoLibro.descuento;
                                const importe = base * (tasa / 100);
                                setNuevoLibro((prev) => ({
                                    ...prev,
                                    tasaImpuesto: tasa,
                                    baseImpuesto: base,
                                    importeImpuesto: importe,
                                }));
                            }}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="0.00"
                            min="0"
                            max="100"
                            disabled={guardando}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Base</label>
                        <div className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm">
                            ${(nuevoLibro.valorUnitario * nuevoLibro.cantidad - nuevoLibro.descuento).toFixed(2)}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Importe Impuesto</label>
                        <div className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm">
                            ${(nuevoLibro.importeImpuesto || 0).toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="mt-4 rounded-lg border border-purple-200 bg-purple-100 p-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-purple-700">Subtotal:</span>
                        <span className="font-medium">${(nuevoLibro.valorUnitario * nuevoLibro.cantidad).toFixed(2)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm">
                        <span className="text-purple-700">Descuento:</span>
                        <span className="font-medium">-${nuevoLibro.descuento.toFixed(2)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm">
                        <span className="text-purple-700">Impuestos:</span>
                        <span className="font-medium">+${(nuevoLibro.importeImpuesto || 0).toFixed(2)}</span>
                    </div>
                    <div className="mt-2 border-t border-purple-300 pt-2">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-purple-800">Total con impuestos:</span>
                            <span className="text-lg font-bold text-purple-900">
                                $
                                {(nuevoLibro.valorUnitario * nuevoLibro.cantidad - nuevoLibro.descuento + (nuevoLibro.importeImpuesto || 0)).toFixed(
                                    2,
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nota informativa */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-gray-600" />
                    <div>
                        <p className="text-sm font-medium text-gray-800">Información Fiscal Opcional</p>
                        <p className="mt-1 text-xs text-gray-600">
                            Estos campos son opcionales y se utilizan para mantener trazabilidad con facturas CFDI. Si el libro fue agregado desde una
                            factura XML, algunos campos ya estarán prellenados.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
    // ✅ FUNCIÓN para avanzar al siguiente paso
    const avanzarPaso = () => {
        if (validarPaso(pasoActual)) {
            setPasoCompletado((prev) => ({ ...prev, [pasoActual]: true }));
            if (pasoActual < 5) {
                setPasoActual(pasoActual + 1);
            }
        }
    };

    // ✅ FUNCIÓN para retroceder
    const retrocederPaso = () => {
        if (pasoActual > 1) {
            setPasoActual(pasoActual - 1);
        }
    };

    useEffect(() => {
        if (flash?.error) {
            toast.warning(flash.error, {
                position: 'top-center',
                autoClose: 5000,
                theme: 'colored',
            });
        }

        if (flash?.success) {
            toast.success(flash.success, {
                position: 'top-center',
                autoClose: 5000,
                theme: 'colored',
            });
        }

        if (resultado) {
            setResultadoGuardado(resultado);
        }

        if (estadisticasPost) {
            setEstadisticasPostGuardado(estadisticasPost);
        }
    }, [flash, resultado, estadisticasPost]);

    const extraerDatosFactura = (xmlDoc: Document): { datosFactura: DatosFactura; librosExtraidos: FacturaLibro[] } => {
        // Namespaces del CFDI
        const ns = {
            cfdi: 'http://www.sat.gob.mx/cfd/4',
            tfd: 'http://www.sat.gob.mx/TimbreFiscalDigital',
        };

        // Obtener nodos principales
        const comprobante = xmlDoc.querySelector('Comprobante');
        const emisor = xmlDoc.querySelector('Emisor');
        const receptor = xmlDoc.querySelector('Receptor');
        const timbre = xmlDoc.querySelector('TimbreFiscalDigital');
        const impuestosNodo = xmlDoc.querySelector('Impuestos');

        // Extraer datos del comprobante
        const datosFactura: DatosFactura = {
            // Comprobante
            serie: comprobante?.getAttribute('Serie') || '',
            folio: comprobante?.getAttribute('Folio') || '',
            fecha: comprobante?.getAttribute('Fecha') || '',
            subtotal: parseFloat(comprobante?.getAttribute('SubTotal') || '0'),
            descuento: parseFloat(comprobante?.getAttribute('Descuento') || '0'),
            total: parseFloat(comprobante?.getAttribute('Total') || '0'),
            moneda: comprobante?.getAttribute('Moneda') || 'MXN',
            tipoCambio: parseFloat(comprobante?.getAttribute('TipoCambio') || '1'),
            tipoComprobante: comprobante?.getAttribute('TipoDeComprobante') || 'I',
            metodoPago: comprobante?.getAttribute('MetodoPago') || 'PPD',
            formaPago: comprobante?.getAttribute('FormaPago') || '99',
            condicionesPago: comprobante?.getAttribute('CondicionesDePago') || '',
            lugarExpedicion: comprobante?.getAttribute('LugarExpedicion') || '',

            // Emisor
            emisor: {
                rfc: emisor?.getAttribute('Rfc') || '',
                nombre: emisor?.getAttribute('Nombre') || '',
                regimenFiscal: emisor?.getAttribute('RegimenFiscal') || '',
            },

            // Receptor
            receptor: {
                rfc: receptor?.getAttribute('Rfc') || '',
                nombre: receptor?.getAttribute('Nombre') || '',
                usoCfdi: receptor?.getAttribute('UsoCFDI') || '',
                domicilioFiscal: receptor?.getAttribute('DomicilioFiscalReceptor') || '',
                regimenFiscal: receptor?.getAttribute('RegimenFiscalReceptor') || '',
            },

            // Impuestos
            impuestos: {
                totalImpuestosTrasladados: parseFloat(impuestosNodo?.getAttribute('TotalImpuestosTrasladados') || '0'),
                traslados: [],
            },
            editorial: '',
            numeroConceptos: 0,
            procesado: false,
        };

        // Timbre fiscal (si existe)
        if (timbre) {
            datosFactura.timbreFiscal = {
                uuid: timbre.getAttribute('UUID') || '',
                fechaTimbrado: timbre.getAttribute('FechaTimbrado') || '',
                selloCfd: timbre.getAttribute('SelloCFD') || '',
                noCertificadoSat: timbre.getAttribute('NoCertificadoSAT') || '',
                selloSat: timbre.getAttribute('SelloSAT') || '',
                rfcProvCertif: timbre.getAttribute('RfcProvCertif') || '',
            };
            datosFactura.fechaTimbrado = timbre.getAttribute('FechaTimbrado') || '';
        }

        // Extraer impuestos globales
        const trasladosGlobales = xmlDoc.querySelectorAll('Impuestos > Traslados > Traslado');
        trasladosGlobales.forEach((traslado) => {
            datosFactura.impuestos.traslados.push({
                base: parseFloat(traslado.getAttribute('Base') || '0'),
                impuesto: traslado.getAttribute('Impuesto') || '',
                tipoFactor: traslado.getAttribute('TipoFactor') || '',
                tasaOCuota: parseFloat(traslado.getAttribute('TasaOCuota') || '0'),
                importe: parseFloat(traslado.getAttribute('Importe') || '0'),
            });
        });

        // Extraer conceptos
        const conceptosNodos = xmlDoc.querySelectorAll('Concepto');
        const conceptos: ConceptoFactura[] = [];
        const librosExtraidos: FacturaLibro[] = [];

        conceptosNodos.forEach((concepto, index) => {
            // Datos completos del concepto
            const conceptoData: ConceptoFactura = {
                cantidad: parseInt(concepto.getAttribute('Cantidad') || '0'),
                claveProdServ: concepto.getAttribute('ClaveProdServ') || '',
                claveUnidad: concepto.getAttribute('ClaveUnidad') || '',
                descripcion: concepto.getAttribute('Descripcion') || '',
                noIdentificacion: concepto.getAttribute('NoIdentificacion') || '',
                objetoImp: concepto.getAttribute('ObjetoImp') || '',
                unidad: concepto.getAttribute('Unidad') || '',
                valorUnitario: parseFloat(concepto.getAttribute('ValorUnitario') || '0'),
                importe: parseFloat(concepto.getAttribute('Importe') || '0'),
                descuento: parseFloat(concepto.getAttribute('Descuento') || '0'),
            };

            // Impuestos del concepto
            const impuestosConcepto = concepto.querySelectorAll('Impuestos > Traslados > Traslado');
            if (impuestosConcepto.length > 0) {
                conceptoData.impuestos = { traslados: [] };
                impuestosConcepto.forEach((imp) => {
                    conceptoData.impuestos!.traslados!.push({
                        base: parseFloat(imp.getAttribute('Base') || '0'),
                        impuesto: imp.getAttribute('Impuesto') || '',
                        tipoFactor: imp.getAttribute('TipoFactor') || '',
                        tasaOCuota: parseFloat(imp.getAttribute('TasaOCuota') || '0'),
                        importe: parseFloat(imp.getAttribute('Importe') || '0'),
                    });
                });
            }

            conceptos.push(conceptoData);

            // Procesar como libro si es relevante
            const { titulo, autor } = extraerTituloYAutor(conceptoData.descripcion);

            // Verificar si es un libro por clave de producto o descripción
            const esLibro =
                conceptoData.claveProdServ.startsWith('5510') || // Códigos de libros
                conceptoData.descripcion.toLowerCase().includes('libro') ||
                conceptoData.noIdentificacion.match(/^97[89]\d{10}$/); // ISBN

            if (esLibro || conceptoData.noIdentificacion || titulo) {
                librosExtraidos.push({
                    // Datos básicos
                    isbn: conceptoData.noIdentificacion || `SIN-ISBN-${index}`,
                    titulo: titulo || conceptoData.descripcion,
                    autor: autor,
                    cantidad: conceptoData.cantidad,
                    valorUnitario: conceptoData.valorUnitario,
                    descuento: conceptoData.descuento || 0,
                    total: conceptoData.importe,

                    // Datos de la factura
                    editorial: datosFactura.emisor.nombre,
                    fechaFactura: datosFactura.fecha,
                    folio: `${datosFactura.serie}${datosFactura.folio}`,

                    // Datos SAT
                    clave_prodserv: conceptoData.claveProdServ,
                    unidad: conceptoData.unidad,
                    claveUnidad: conceptoData.claveUnidad,

                    // Datos del proveedor
                    rfcProveedor: datosFactura.emisor.rfc,
                    regimenFiscalProveedor: datosFactura.emisor.regimenFiscal,

                    // Datos fiscales
                    uuid: datosFactura.timbreFiscal?.uuid,
                    metodoPago: datosFactura.metodoPago,
                    formaPago: datosFactura.formaPago,
                    usoCfdi: datosFactura.receptor.usoCfdi,

                    // Impuestos del concepto
                    impuestos: conceptoData.impuestos?.traslados?.[0]?.importe || 0,
                    tasaImpuesto: conceptoData.impuestos?.traslados?.[0]?.tasaOCuota || 0,
                });
            }
        });

        return { datosFactura, librosExtraidos };
    };

    const extraerTituloYAutor = (descripcion: string): { titulo: string; autor?: string } => {
        const patrones = [/^LIBRO:\s*(.+?)\s*-\s*(.+)$/i, /^(.+?)\s+por\s+(.+)$/i, /^(.+?)\s*\/\s*(.+)$/i, /^(.+?),\s*(.+)$/i, /^(.+?)\s*-\s*(.+)$/i];

        for (const patron of patrones) {
            const match = descripcion.match(patron);
            if (match) {
                const parte1 = match[1].trim();
                const parte2 = match[2].trim();

                if (pareceNombrePersona(parte1) && !pareceNombrePersona(parte2)) {
                    return { titulo: parte2, autor: parte1 };
                } else {
                    return { titulo: parte1, autor: parte2 };
                }
            }
        }

        return { titulo: descripcion.trim() };
    };

    const pareceNombrePersona = (texto: string): boolean => {
        const palabras = texto.split(' ');
        return palabras.length >= 2 && palabras.length <= 4 && palabras.every((palabra) => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/.test(palabra));
    };

    /*  const procesarFacturaXML = async (file: File) => {
        try {
            setBuscandoISBNs(true);
            setProgresoBusqueda(null);

            const texto = await file.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(texto, 'text/xml');

            const { datosFactura: datosFacturaProcesada, librosExtraidos } = extraerDatosFactura(xmlDoc);

            if (librosExtraidos.length === 0) {
                toast.warning('No se encontraron libros en esta factura', {
                    position: 'top-center',
                    autoClose: 5000,
                    theme: 'colored',
                });
                setBuscandoISBNs(false);
                return;
            }

            // ✅ NUEVO: Guardar datos de factura procesada
            setDatosFactura(datosFacturaProcesada);

            console.log(`📦 === PROCESANDO FACTURA ===`);
            console.log(`📚 Extraídos ${librosExtraidos.length} libros de la factura`);

            setEstadisticasBusqueda({
                total: librosExtraidos.length,
                encontrados: 0,
                noEncontrados: 0,
                tablasNuevas: 0,
                tablasViejas: 0,
                apisExternas: 0,
                isbnsOriginales: librosExtraidos.map((l) => l.isbn),
                ultimaActualizacion: new Date(),
            });

            await enriquecerLibrosConBaseDatos(librosExtraidos, datosFacturaProcesada);
            setArchivoXML(null);
        } catch (error) {
            console.error('💥 Error procesando factura:', error);
            toast.error('Error al procesar el archivo XML. Verifique que sea una factura válida.', {
                position: 'top-center',
                autoClose: 7000,
                theme: 'colored',
            });
        } finally {
            setBuscandoISBNs(false);
            setProgresoBusqueda(null);
        }
    };
 */
    const procesarFacturaXML = async (file: File) => {
        try {
            setBuscandoISBNs(true);
            setProgresoBusqueda(null);

            const texto = await file.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(texto, 'text/xml');

            // Verificar errores de parseo
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error('El archivo XML no es válido');
            }

            // Extraer TODOS los datos
            const { datosFactura, conceptos, librosExtraidos } = extraerDatosFactura(xmlDoc);

            if (librosExtraidos.length === 0) {
                toast.warning('No se encontraron libros en esta factura', {
                    position: 'top-center',
                    autoClose: 5000,
                    theme: 'colored',
                });
                setBuscandoISBNs(false);
                return;
            }

            // Guardar datos completos de la factura
            setDatosFactura({
                folio: `${datosFactura.serie}${datosFactura.folio}`,
                fecha: datosFactura.fecha,
                editorial: datosFactura.emisor.nombre,
                rfc: datosFactura.emisor.rfc,
                numeroConceptos: librosExtraidos.length,
                procesado: true,
                // Datos adicionales
                uuid: datosFactura.timbreFiscal?.uuid,
                serie: datosFactura.serie,
                subtotal: datosFactura.subtotal,
                descuento: datosFactura.descuento,
                total: datosFactura.total,
                metodoPago: datosFactura.metodoPago,
                formaPago: datosFactura.formaPago,
                condicionesPago: datosFactura.condicionesPago,
                moneda: datosFactura.moneda,
                tipoCambio: datosFactura.tipoCambio,
                // Guardar datos completos para usar después
                datosCompletos: datosFactura,
                conceptosOriginales: conceptos,
            });

            console.log(`📦 === FACTURA PROCESADA ===`);
            console.log(`📄 Folio: ${datosFactura.serie}${datosFactura.folio}`);
            console.log(`🏢 Proveedor: ${datosFactura.emisor.nombre} (${datosFactura.emisor.rfc})`);
            console.log(`💰 Total: $${datosFactura.total} ${datosFactura.moneda}`);
            console.log(`📚 Libros encontrados: ${librosExtraidos.length}`);
            console.log(`🔍 UUID: ${datosFactura.timbreFiscal?.uuid}`);

            // Mostrar información adicional extraída
            if (datosFactura.condicionesPago) {
                console.log(`💳 Condiciones de pago: ${datosFactura.condicionesPago}`);
            }

            setEstadisticasBusqueda({
                total: librosExtraidos.length,
                encontrados: 0,
                noEncontrados: 0,
                tablasNuevas: 0,
                tablasViejas: 0,
                apisExternas: 0,
                isbnsOriginales: librosExtraidos.map((l) => l.isbn),
                ultimaActualizacion: new Date(),
            });

            await enriquecerLibrosConBaseDatos(librosExtraidos, datosFactura);
            setArchivoXML(null);
        } catch (error) {
            console.error('💥 Error procesando factura:', error);
            toast.error(error.message || 'Error al procesar el archivo XML. Verifique que sea una factura CFDI válida.', {
                position: 'top-center',
                autoClose: 7000,
                theme: 'colored',
            });
        } finally {
            setBuscandoISBNs(false);
            setProgresoBusqueda(null);
        }
    };

    const enriquecerLibrosConBaseDatos = async (librosBasicos: FacturaLibro[], datosFactura: DatosFactura) => {
        const isbns = librosBasicos.map((libro) => libro.isbn);
        const titulos = librosBasicos.map((libro) => libro.titulo);

        console.log(`🔍 === BÚSQUEDA EN BASE DE DATOS ===`);
        console.log(`📋 ISBNs extraídos de factura: ${isbns.length}`);

        try {
            const librosEnriquecidos = await DatabaseSearchService.procesarLoteISBNs(
                isbns,
                (actual, total) => {
                    setProgresoBusqueda({ actual, total });
                    console.log(`📈 Progreso: ${actual}/${total}`);
                },
                titulos,
                { debug: true },
            );

            console.log(`📦 === RESPUESTA DE BASE DE DATOS ===`);
            console.log(`📚 ISBNs enviados: ${isbns.length}`);
            console.log(`📚 Resultados recibidos: ${librosEnriquecidos.length}`);

            if (librosEnriquecidos.length !== librosBasicos.length) {
                console.error(`🚨 MISMATCH: ISBNs=${librosBasicos.length}, Resultados=${librosEnriquecidos.length}`);
                throw new Error(`Mismatch en número de resultados: enviados ${librosBasicos.length}, recibidos ${librosEnriquecidos.length}`);
            }

            const librosCompletos: LibroCompleto[] = [];
            const stats = {
                encontrados: 0,
                noEncontrados: 0,
                tablasNuevas: 0,
                tablasViejas: 0,
                apisExternas: 0,
            };

            for (let index = 0; index < librosBasicos.length; index++) {
                const libroBasico = librosBasicos[index];
                const libroEnriquecido = librosEnriquecidos[index];
                console.log(`📖 [${index}] Procesando: ${libroBasico.isbn}`);

                if (libroEnriquecido) {
                    stats.encontrados++;

                    // Determinar fuente para estadísticas
                    if (libroEnriquecido.fuente?.includes('LB_') || libroEnriquecido.fuente?.includes('TABLAS_NUEVAS')) {
                        stats.tablasNuevas++;
                    } else if (libroEnriquecido.fuente?.includes('legacy') || libroEnriquecido.fuente?.includes('TABLAS_VIEJAS')) {
                        stats.tablasViejas++;
                    } else if (libroEnriquecido.fuente?.includes('APIS_EXTERNAS')) {
                        stats.apisExternas++;
                    }

                    const libroCompleto: LibroCompleto = {
                        ...libroEnriquecido,
                        id: `factura-${index}`,
                        cantidad: libroBasico.cantidad,
                        valorUnitario: libroBasico.valorUnitario,
                        descuento: libroBasico.descuento,
                        total: libroBasico.total,
                        fechaFactura: datosFactura.fecha,
                        folio: datosFactura.folio,
                        estado: 'procesado',
                    };

                    librosCompletos.push(libroCompleto);
                    console.log(`  ✅ Enriquecido: ${libroCompleto.titulo} (${libroCompleto.fuente})`);
                } else {
                    stats.noEncontrados++;
                    const libroCompleto: LibroCompleto = {
                        id: `factura-${index}`,
                        isbn: libroBasico.isbn,
                        titulo: libroBasico.titulo,
                        cantidad: libroBasico.cantidad,
                        valorUnitario: libroBasico.valorUnitario,
                        descuento: libroBasico.descuento,
                        total: libroBasico.total,
                        autor: {
                            nombre: libroBasico.autor || 'Autor Desconocido',
                            apellidos: '',
                        },
                        editorial: { nombre: datosFactura.editorial || 'Editorial Desconocida' },
                        genero: { nombre: 'General' },
                        fechaFactura: datosFactura.fecha,
                        folio: datosFactura.folio,
                        estado: 'error',
                        errorMsg: 'No se encontró en base de datos',
                        fuente: 'Factura únicamente',
                    };

                    librosCompletos.push(libroCompleto);
                    console.log(`  ❌ No encontrado: ${libroBasico.isbn}`);
                }
            }

            setEstadisticasBusqueda((prev) =>
                prev
                    ? {
                          ...prev,
                          encontrados: stats.encontrados,
                          noEncontrados: stats.noEncontrados,
                          tablasNuevas: stats.tablasNuevas,
                          tablasViejas: stats.tablasViejas,
                          apisExternas: stats.apisExternas,
                          ultimaActualizacion: new Date(),
                      }
                    : null,
            );

            setLibros((prev) => [...prev, ...librosCompletos]);

            console.log(`📊 === ESTADÍSTICAS FINALES ===`);
            console.log(`📈 Total procesados: ${librosCompletos.length}`);
            console.log(`✅ Encontrados: ${stats.encontrados}`);
            console.log(`❌ No encontrados: ${stats.noEncontrados}`);
        } catch (error) {
            console.error('💥 Error enriqueciendo libros:', error);
            toast.error('Error conectando con la base de datos. Verifique la conexión.', {
                position: 'top-center',
                autoClose: 7000,
                theme: 'colored',
            });
        }
    };

    const buscarPorISBNManual = async (isbn: string) => {
        if (!isbn) return;

        setBuscandoISBNs(true);
        try {
            console.log(`🔍 Búsqueda manual para ISBN: ${isbn}`);

            const libroInfo = await DatabaseSearchService.buscarPorISBN(isbn, { debug: true });

            if (libroInfo) {
                const libroCompleto: LibroCompleto = {
                    ...libroInfo,
                    id: `manual-${Date.now()}`,
                    cantidad: nuevoLibro.cantidad || 1,
                    valorUnitario: nuevoLibro.valorUnitario || libroInfo.valorUnitario || 0,
                    descuento: nuevoLibro.descuento || 0,
                    total: (nuevoLibro.valorUnitario || libroInfo.valorUnitario || 0) * (nuevoLibro.cantidad || 1) - (nuevoLibro.descuento || 0),
                    estado: 'procesado',
                    // ✅ NUEVO: Si hay factura procesada, heredar sus datos
                    folio: datosFactura?.folio || '',
                    fechaFactura: datosFactura?.fecha || '',
                };

                setLibros((prev) => [...prev, libroCompleto]);

                // ✅ NUEVO: Resetear todos los campos
                setNuevoLibro({
                    isbn: '',
                    titulo: '',
                    cantidad: 1,
                    valorUnitario: 0,
                    descuento: 0,
                    autor_nombre: '',
                    autor_apellidos: '',
                    editorial_nombre: '',
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
                });

                toast.success(`✅ Libro encontrado: ${libroInfo.titulo}`, {
                    position: 'top-center',
                    autoClose: 3000,
                    theme: 'colored',
                });
                console.log(`✅ Libro encontrado: ${libroInfo.titulo} (${libroInfo.fuente})`);
            } else {
                toast.warning('No se encontró información para este ISBN en la base de datos', {
                    position: 'top-center',
                    autoClose: 5000,
                    theme: 'colored',
                });
            }
        } catch (error) {
            console.error('💥 Error buscando ISBN:', error);
            toast.error('Error al buscar información del libro. Verifique la conexión a la base de datos.', {
                position: 'top-center',
                autoClose: 7000,
                theme: 'colored',
            });
        } finally {
            setBuscandoISBNs(false);
        }
    };

    /*   const agregarLibroManual = () => {
        if (!nuevoLibro.titulo || !nuevoLibro.isbn) {
            toast.warning('Título e ISBN son requeridos', {
                position: 'top-center',
                autoClose: 3000,
                theme: 'colored',
            });
            return;
        }

        const total = (nuevoLibro.valorUnitario || 0) * (nuevoLibro.cantidad || 1) - (nuevoLibro.descuento || 0);

        const libro: LibroCompleto = {
            id: `manual-${Date.now()}`,
            cantidad: nuevoLibro.cantidad || 1,
            isbn: nuevoLibro.isbn || '',
            titulo: nuevoLibro.titulo || '',
            valorUnitario: nuevoLibro.valorUnitario || 0,
            descuento: nuevoLibro.descuento || 0,
            total,
            autor: {
                nombre: nuevoLibro.autor_nombre || 'Autor Desconocido',
                apellidos: nuevoLibro.autor_apellidos || '',
            },
            editorial: { nombre: nuevoLibro.editorial_nombre || 'Editorial Desconocida' },
            genero: { nombre: nuevoLibro.genero || 'General' },
            estado: 'procesado',
            fuente: 'Manual',

            // ✅ NUEVO: Campos adicionales
            año_publicacion: nuevoLibro.año_publicacion,
            añoPublicacion: nuevoLibro.año_publicacion,
            paginas: nuevoLibro.paginas,
            descripcion: nuevoLibro.descripcion,
            imagen_url: nuevoLibro.imagen_url,
            imagenUrl: nuevoLibro.imagen_url,
            peso: nuevoLibro.peso,
            dimensiones: nuevoLibro.dimensiones,
            url_compra: nuevoLibro.url_compra,
            ubicacion_fisica: nuevoLibro.ubicacion_fisica,
            notas_internas: nuevoLibro.notas_internas,

            // ✅ NUEVO: Si hay factura procesada, heredar sus datos
            folio: datosFactura?.folio || '',
            fechaFactura: datosFactura?.fecha || '',
        };

        setLibros((prev) => [...prev, libro]);

        // ✅ NUEVO: Resetear todos los campos Y EL WIZARD
        setNuevoLibro({
            isbn: '',
            titulo: '',
            cantidad: 1,
            valorUnitario: 0,
            descuento: 0,
            autor_nombre: '',
            autor_apellidos: '',
            editorial_nombre: '',
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
            idioma: '',
            edicion: '',
            nacionalidad: '',
            biografia: '',
            proveedor: '',
            codigo_interno: '',
            contacto_editorial: '',
        });

        // ✅ AGREGAR: Reiniciar el wizard
        setPasoActual(1);
        setPasoCompletado({});

        toast.success('Libro agregado exitosamente. Listo para agregar otro.', {
            position: 'top-center',
            autoClose: 2000,
            theme: 'colored',
        });
    }; */

    const agregarLibroManual = () => {
        if (!nuevoLibro.titulo || !nuevoLibro.isbn) {
            toast.warning('Título e ISBN son requeridos', {
                position: 'top-center',
                autoClose: 3000,
                theme: 'colored',
            });
            return;
        }

        const total = (nuevoLibro.valorUnitario || 0) * (nuevoLibro.cantidad || 1) - (nuevoLibro.descuento || 0);

        const libro: LibroCompleto = {
            id: `manual-${Date.now()}`,
            cantidad: nuevoLibro.cantidad || 1,
            isbn: nuevoLibro.isbn || '',
            titulo: nuevoLibro.titulo || '',
            valorUnitario: nuevoLibro.valorUnitario || 0,
            descuento: nuevoLibro.descuento || 0,
            total,
            autor: {
                nombre: nuevoLibro.autor_nombre || 'Autor Desconocido',
                apellidos: nuevoLibro.autor_apellidos || '',
            },
            editorial: { nombre: nuevoLibro.editorial_nombre || 'Editorial Desconocida' },
            genero: { nombre: etiquetasSeleccionadas.join(', ') || 'General' },
            estado: 'procesado',
            fuente: datosFactura ? 'Manual (con factura)' : 'Manual',

            // Campos adicionales
            año_publicacion: nuevoLibro.año_publicacion,
            añoPublicacion: nuevoLibro.año_publicacion,
            paginas: nuevoLibro.paginas,
            descripcion: nuevoLibro.descripcion,
            imagen_url: nuevoLibro.imagen_url,
            imagenUrl: nuevoLibro.imagen_url,
            peso: nuevoLibro.peso,
            dimensiones: nuevoLibro.dimensiones,
            url_compra: nuevoLibro.url_compra,
            ubicacion_fisica: nuevoLibro.ubicacion_fisica,
            notas_internas: nuevoLibro.notas_internas,

            // Datos fiscales si existen
            clave_prodserv: nuevoLibro.clave_prodserv,
            folio: nuevoLibro.folioFactura || datosFactura?.folio || '',
            fechaFactura: nuevoLibro.fechaFactura || datosFactura?.fecha || '',
            uuid: nuevoLibro.uuidFactura || datosFactura?.uuid || '',
            rfcProveedor: nuevoLibro.rfcProveedor || datosFactura?.rfc || '',
        };

        setLibros((prev) => [...prev, libro]);

        // Resetear formulario
        resetearFormulario();

        toast.success('Libro agregado exitosamente', {
            position: 'top-center',
            autoClose: 2000,
            theme: 'colored',
        });
    };

    const resetearFormulario = () => {
        setNuevoLibro({
            isbn: '',
            titulo: '',
            cantidad: 1,
            valorUnitario: 0,
            descuento: 0,
            autor_nombre: '',
            autor_apellidos: '',
            editorial_nombre: '',
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
            rfcProveedor: '',
            regimenFiscalProveedor: '',
            metodoPago: 'PPD',
            formaPago: '99',
            condicionesPago: '',
            usoCfdi: 'G01',
            baseImpuesto: null,
            tipoImpuesto: '002',
            tasaImpuesto: 0,
            importeImpuesto: 0,
            folioFactura: '',
            serieFactura: '',
            fechaFactura: '',
            uuidFactura: '',
        });
        setPasoActual(1);
        setPasoCompletado({});
        setEtiquetasSeleccionadas([]);

        // Si hay factura activa, prellenar sus datos
        if (datosFactura) {
            prellenarDatosDesdeFactura();
        }
    };

    const eliminarLibro = (id: string) => {
        setLibros((prev) => prev.filter((libro) => libro.id !== id));
        toast.info('Libro eliminado de la lista', {
            position: 'top-center',
            autoClose: 2000,
            theme: 'colored',
        });
    };

    const abrirModalDetalles = React.useCallback((libro: LibroCompleto) => {
        setLibroSeleccionado(libro);
        setModalDetallesAbierto(true);
    }, []);

    const cerrarModalDetalles = () => {
        setModalDetallesAbierto(false);
        setLibroSeleccionado(null);
    };

    const editarLibroDesdeModal = (libro: LibroCompleto) => {
        setEditando(libro.id);
        cerrarModalDetalles();
    };

    const eliminarLibroDesdeModal = (id: string) => {
        eliminarLibro(id);
        cerrarModalDetalles();
    };

    const guardarEdicion = (id: string, libroEditado: Partial<LibroCompleto>) => {
        setLibros((prev) =>
            prev.map((libro) =>
                libro.id === id
                    ? {
                          ...libro,
                          ...libroEditado,
                          total:
                              (libroEditado.valorUnitario || libro.valorUnitario) * (libroEditado.cantidad || libro.cantidad) -
                              (libroEditado.descuento || libro.descuento),
                      }
                    : libro,
            ),
        );
        setEditando(null);

        toast.success('Libro actualizado', {
            position: 'top-center',
            autoClose: 2000,
            theme: 'colored',
        });
    };

    const limpiarFactura = () => {
        const confirmar = confirm('¿Está seguro de limpiar la factura actual? Se mantendrán los libros ya agregados.');

        if (confirmar) {
            setDatosFactura(null);
            setArchivoXML(null);
            setEstadisticasBusqueda(null);

            toast.info('Factura limpiada. Puede procesar una nueva factura.', {
                position: 'top-center',
                autoClose: 3000,
                theme: 'colored',
            });
        }
    };

    /* const guardarLibrosEnInventario = () => {
        if (libros.length === 0) {
            toast.warning('No hay libros para guardar', {
                position: 'top-center',
                autoClose: 3000,
                theme: 'colored',
            });
            return;
        }

        // 🔧 FUNCIÓN AUXILIAR para dividir etiquetas
        const procesarEtiquetas = (generoTexto: string): string[] => {
            if (!generoTexto) return ['General'];

            // Dividir por comas y limpiar espacios
            const etiquetas = generoTexto
                .split(',')
                .map((etiqueta) => etiqueta.trim())
                .filter((etiqueta) => etiqueta.length > 0);

            // Si no hay etiquetas válidas, devolver 'General'
            return etiquetas.length > 0 ? etiquetas : ['General'];
        };

        // Preparar datos para enviar
        const librosParaGuardar = libros.map((libro) => ({
            isbn: libro.isbn,
            titulo: libro.titulo,
            cantidad: libro.cantidad,
            valorUnitario: libro.valorUnitario,
            descuento: libro.descuento || 0,
            autor: {
                nombre: libro.autor?.nombre || 'Autor Desconocido',
            },
            editorial: {
                nombre: libro.editorial?.nombre || 'Editorial Desconocida',
            },
            etiquetas: procesarEtiquetas(libro.genero?.nombre || 'General'),
            año_publicacion: libro.año_publicacion || libro.añoPublicacion || libro.año,
            descripcion: libro.descripcion,
            imagen_url: libro.imagen_url || libro.imagenUrl,
            paginas: libro.paginas || null,
            folio: libro.folio,
            fechaFactura: libro.fechaFactura,
            fuente: libro.fuente,
            // ✅ NUEVO: Campos adicionales
            peso: libro.peso,
            dimensiones: libro.dimensiones,
            url_compra: libro.url_compra,
            ubicacion_fisica: libro.ubicacion_fisica,
            notas_internas: libro.notas_internas,
        }));

        console.log('💾 === INICIANDO GUARDADO SIMPLE ===');
        console.log('📦 Datos preparados para guardar:', librosParaGuardar);

        // ✅ CORREGIDO: Router simple como en inventory
        router.post(
            '/libros/guardar-inventario',
            {
                libros: librosParaGuardar,
                metadata: {
                    timestamp: new Date().toISOString(),
                    total_libros: librosParaGuardar.length,
                    fuente: 'LibrosFacturas-Component',
                    factura_info: datosFactura
                        ? {
                              folio: datosFactura.folio,
                              fecha: datosFactura.fecha,
                              editorial: datosFactura.editorial,
                          }
                        : null,
                },
            },
            {
                preserveState: false,
                preserveScroll: false,

                onStart: () => {
                    setGuardando(true);
                    console.log('🚀 Iniciando guardado...');
                },

                onFinish: () => {
                    setGuardando(false);
                    console.log('🏁 Guardado finalizado');
                },

                onError: (errors) => {
                    console.error('💥 Error en guardado:', errors);
                    // Los errores se manejarán automáticamente por el useEffect
                },
            },
        );
    }; */

    const guardarLibrosEnInventario = () => {
        if (libros.length === 0) {
            toast.warning('No hay libros para guardar', {
                position: 'top-center',
                autoClose: 3000,
                theme: 'colored',
            });
            return;
        }
        const procesarEtiquetas = (generoTexto: string): string[] => {
            if (!generoTexto) return ['General'];

            const etiquetas = generoTexto
                .split(',')
                .map((etiqueta) => etiqueta.trim())
                .filter((etiqueta) => etiqueta.length > 0);

            return etiquetas.length > 0 ? etiquetas : ['General'];
        };

        // Preparar datos para enviar con información adicional del XML
        const librosParaGuardar = libros.map((libro) => ({
            // Datos básicos del libro
            isbn: libro.isbn,
            titulo: libro.titulo,
            cantidad: libro.cantidad,
            valorUnitario: libro.valorUnitario,
            descuento: libro.descuento || 0,
            autor: {
                nombre: libro.autor?.nombre || 'Autor Desconocido',
            },
            editorial: {
                nombre: libro.editorial?.nombre || 'Editorial Desconocida',
            },
            etiquetas: procesarEtiquetas(libro.genero?.nombre || 'General'),
            año_publicacion: libro.año_publicacion || libro.añoPublicacion || libro.año,
            descripcion: libro.descripcion,
            imagen_url: libro.imagen_url || libro.imagenUrl,
            paginas: libro.paginas || null,

            // Datos del CFDI si existen
            clave_prodserv: libro.clave_prodserv || '55101500',
            unidad: libro.unidad || 'PZA',
            claveUnidad: libro.claveUnidad || 'H87',

            // Datos fiscales
            rfcProveedor: libro.rfcProveedor,
            uuid: libro.uuid,
            metodoPago: libro.metodoPago,
            formaPago: libro.formaPago,
            usoCfdi: libro.usoCfdi,

            // Impuestos
            impuestos: libro.impuestos || 0,
            tasaImpuesto: libro.tasaImpuesto || 0,

            // Datos adicionales
            folio: libro.folio,
            fechaFactura: libro.fechaFactura,
            fuente: libro.fuente,
            peso: libro.peso,
            dimensiones: libro.dimensiones,
            url_compra: libro.url_compra,
            ubicacion_fisica: libro.ubicacion_fisica,
            notas_internas: libro.notas_internas,
        }));

        // Determinar si hay factura procesada con datos completos
        const tieneFactura = datosFactura && datosFactura.procesado && datosFactura.datosCompletos;

        if (tieneFactura) {
            // Enviar con todos los datos de la factura
            const datosEnvio = {
                libros: librosParaGuardar,
                factura_info: {
                    // Datos básicos
                    serie: datosFactura.serie || '',
                    folio: datosFactura.folio.replace(datosFactura.serie || '', ''),
                    fecha: datosFactura.fecha,
                    rfc: datosFactura.rfc,

                    // Montos
                    subtotal: datosFactura.subtotal,
                    descuento: datosFactura.descuento || 0,
                    total: datosFactura.total,

                    // Datos fiscales
                    uuid_fiscal: datosFactura.uuid,
                    fecha_timbrado: datosFactura.datosCompletos.fechaTimbrado,
                    moneda: datosFactura.moneda,
                    tipo_cambio: datosFactura.tipoCambio,
                    metodo_pago: datosFactura.metodoPago,
                    forma_pago: datosFactura.formaPago,
                    condiciones_pago: datosFactura.condicionesPago,
                    uso_cfdi: datosFactura.datosCompletos.receptor.usoCfdi,
                    lugar_expedicion: datosFactura.datosCompletos.lugarExpedicion,

                    // Impuestos
                    impuestos: datosFactura.datosCompletos.impuestos.totalImpuestosTrasladados,

                    // Certificados
                    no_certificado: datosFactura.datosCompletos.timbreFiscal?.noCertificadoSat,
                    sello_cfd: datosFactura.datosCompletos.timbreFiscal?.selloCfd,
                    sello_sat: datosFactura.datosCompletos.timbreFiscal?.selloSat,
                },
                proveedor_info: {
                    nombre: datosFactura.editorial,
                    rfc: datosFactura.rfc,
                    regimen_fiscal: datosFactura.datosCompletos.emisor.regimenFiscal,
                },
                receptor_info: {
                    nombre: datosFactura.datosCompletos.receptor.nombre,
                    rfc: datosFactura.datosCompletos.receptor.rfc,
                    domicilio_fiscal: datosFactura.datosCompletos.receptor.domicilioFiscal,
                    regimen_fiscal: datosFactura.datosCompletos.receptor.regimenFiscal,
                    uso_cfdi: datosFactura.datosCompletos.receptor.usoCfdi,
                },
                metadata: {
                    timestamp: new Date().toISOString(),
                    total_libros: librosParaGuardar.length,
                    fuente: 'LibrosFacturas-Component',
                    tiene_xml: true,
                    conceptos_originales: datosFactura.conceptosOriginales?.length || 0,
                },
            };
            router.post('/facturas-libros/procesar', datosEnvio, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => {
                    setGuardando(true);
                    console.log('🚀 Iniciando procesamiento de factura completa...');
                    toast.info('📋 Procesando factura y libros...', {
                        position: 'top-center',
                        autoClose: 2000,
                        theme: 'colored',
                    });
                },
                onSuccess: (response) => {
                    // Mostrar mensaje de éxito detallado
                    const { libros_procesados, etiquetas_creadas, autores_creados, editoriales_creadas } = response.props || {};
                    setLibros([]);
                    setDatosFactura(null);
                     setEstadisticasBusqueda(null);
                },
                onError: (errors) => {
                    console.error('💥 Error procesando factura:', errors);
                    const errorMessage = errors.message || 'Error al procesar la factura y los libros';
                    toast.error(`❌ ${errorMessage}`, {
                        position: 'top-center',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        theme: 'colored',
                    });
                },
                onFinish: () => {
                    setGuardando(false);
                    console.log('🏁 Procesamiento finalizado');
                },
            });
        } else {
            router.post(
                '/libros/guardar-inventario',
                {
                    libros: librosParaGuardar,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        total_libros: librosParaGuardar.length,
                        fuente: 'LibrosFacturas-Component',
                        factura_info: null,
                    },
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: (response) => {
                        const { libros_guardados } = response.props || {};
                        toast.success(
                            `¡${libros_guardados || librosParaGuardar.length} libros guardados exitosamente!\n` +
                                {
                                    position: 'top-center',
                                    autoClose: 5000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    theme: 'colored',
                                },
                        );
                           setEstadisticasBusqueda(null);
                        setLibros([]);
                    },
                    onError: (errors) => {
                        const errorMessage = errors.message || 'Error al guardar los libros en inventario';
                        toast.error(`❌ ${errorMessage}`, {
                            position: 'top-center',
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            theme: 'colored',
                        });
                    },
                    onFinish: () => {
                        setGuardando(false);
                    },
                },
            );
        }
    };
    const cerrarResultadoGuardado = () => {
        setResultadoGuardado(null);
        setEstadisticasPostGuardado(null);
        if (resultadoGuardado && resultadoGuardado.guardados > 0) {
            const confirmarLimpiar = confirm(`Se guardaron ${resultadoGuardado.guardados} libros exitosamente. ¿Desea limpiar la lista actual?`);

            if (confirmarLimpiar) {
                setLibros([]);
                setEstadisticasBusqueda(null);
                setDatosFactura(null);
                setArchivoXML(null);
                toast.success('Lista limpiada', {
                    position: 'top-center',
                    autoClose: 2000,
                    theme: 'colored',
                });
            }
        }
    };

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Inventarios', href: '/libros-factura' },
            { title: 'Agregar Libros', href: '/libros-factura' },
        ],
        [],
    );

    const SelectConBusqueda = React.memo<{
        value: string;
        onChange: (value: string) => void;
        options: { id: number; nombre: string; nombre_completo?: string }[];
        placeholder: string;
        className?: string;
        disabled?: boolean;
        isError?: boolean;
        allowNew?: boolean;
        displayField?: string;
        apiEndpoint?: string;
        onNewIndicator?: (isNew: boolean) => void;
        maxOptions?: number; // ✅ AGREGAR esta línea
    }>(
        ({
            value,
            onChange,
            options,
            placeholder,
            className = '',
            disabled = false,
            isError = false,
            allowNew = true,
            displayField = 'nombre',
            apiEndpoint = '',
            onNewIndicator,
            maxOptions = 20, // ✅ AGREGAR este parámetro con valor por defecto
        }) => {
            const [isOpen, setIsOpen] = useState(false);
            const [searchTerm, setSearchTerm] = useState('');
            const [filteredOptions, setFilteredOptions] = useState(options);
            const [isSearching, setIsSearching] = useState(false);
            const [allKnownOptions, setAllKnownOptions] = useState(options); // ✅ NUEVO
            const localDropdownRef = useRef<HTMLDivElement>(null);

            // ✅ MODIFICADO: Asegurar que options siempre sea un array y actualizar opciones conocidas
            useEffect(() => {
                const validOptions = Array.isArray(options) ? options : [];
                setFilteredOptions(validOptions);

                // ✅ NUEVO: Actualizar opciones conocidas
                setAllKnownOptions((prev) => {
                    const combined = [...prev];
                    validOptions.forEach((newOption) => {
                        if (!combined.find((existing) => existing.id === newOption.id)) {
                            combined.push(newOption);
                        }
                    });
                    return combined;
                });
            }, [options]);
            const memoizedFilteredOptions = useMemo(() => {
                const validOptions = Array.isArray(allKnownOptions) ? allKnownOptions : [];

                // ✅ Diferentes límites según el tipo de endpoint
                let limit = 20;
                if (apiEndpoint.includes('autores')) limit = 15;
                if (apiEndpoint.includes('editoriales')) limit = 10;
                if (apiEndpoint.includes('etiquetas')) limit = 25;

                if (!searchTerm.trim()) {
                    return validOptions.slice(0, limit);
                }

                const filtered = validOptions.filter(
                    (option) =>
                        option.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (option.nombre_completo && option.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())),
                );

                return filtered.slice(0, limit);
            }, [searchTerm, allKnownOptions, apiEndpoint]);

            // ✅ MODIFICADO: Usar allKnownOptions en lugar de options
            useEffect(() => {
                if (onNewIndicator && value) {
                    const isNewValue = !allKnownOptions.find((option) => option.nombre === value);
                    onNewIndicator(isNewValue);
                }
            }, [value, allKnownOptions, onNewIndicator]);

            useEffect(() => {
                if (!searchTerm.trim() || !apiEndpoint) {
                    if (!apiEndpoint) {
                        setFilteredOptions(memoizedFilteredOptions);
                    }
                    return;
                }

                const timeoutId = setTimeout(async () => {
                    setIsSearching(true);
                    try {
                        const response = await fetch(`${apiEndpoint}?search=${encodeURIComponent(searchTerm)}`);
                        const data = await response.json();

                        // ✅ CORREGIDO: Validar que la respuesta sea un array
                        let results = data.autores || data.editoriales || data.etiquetas || data.categorias || data || [];

                        // Asegurar que results sea un array
                        if (!Array.isArray(results)) {
                            console.warn('API response is not an array:', results);
                            results = [];
                        }

                        setFilteredOptions(results);

                        // ✅ NUEVO: Actualizar opciones conocidas con resultados de API
                        setAllKnownOptions((prev) => {
                            const combined = [...prev];
                            results.forEach((newOption) => {
                                if (newOption && typeof newOption === 'object' && newOption.nombre) {
                                    if (!combined.find((existing) => existing.id === newOption.id || existing.nombre === newOption.nombre)) {
                                        combined.push(newOption);
                                    }
                                }
                            });
                            return combined;
                        });
                    } catch (error) {
                        console.error('Error en búsqueda:', error);
                        setFilteredOptions(memoizedFilteredOptions);
                    } finally {
                        setIsSearching(false);
                    }
                }, 300);

                return () => clearTimeout(timeoutId);
            }, [searchTerm, apiEndpoint, memoizedFilteredOptions]);

            const shouldShowCreateNew = useMemo(() => {
                if (!allowNew || !searchTerm.trim()) return false;

                // ✅ CORREGIDO: Validar que filteredOptions sea un array antes de usar .some()
                const validFilteredOptions = Array.isArray(filteredOptions) ? filteredOptions : [];

                const exactMatch = validFilteredOptions.some((option) => option.nombre?.toLowerCase() === searchTerm.toLowerCase());
                return !exactMatch;
            }, [allowNew, searchTerm, filteredOptions]);

            useEffect(() => {
                const handleClickOutside = (event: MouseEvent) => {
                    if (localDropdownRef.current && !localDropdownRef.current.contains(event.target as Node)) {
                        setIsOpen(false);
                        setSearchTerm('');
                    }
                };

                if (isOpen) {
                    document.addEventListener('mousedown', handleClickOutside);
                    return () => document.removeEventListener('mousedown', handleClickOutside);
                }
            }, [isOpen]);

            const displayValue = useMemo(() => {
                const validOptions = Array.isArray(options) ? options : [];
                const selectedOption = validOptions.find((opt) => opt.nombre === value);
                return selectedOption
                    ? displayField === 'nombre_completo' && selectedOption.nombre_completo
                        ? selectedOption.nombre_completo
                        : selectedOption.nombre
                    : value;
            }, [value, options, displayField]);

            const handleInputChange = useCallback(
                (e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchTerm(e.target.value);
                    if (!isOpen) setIsOpen(true);
                },
                [isOpen],
            );

            const handleInputFocus = useCallback(() => {
                setIsOpen(true);
                setSearchTerm('');
            }, []);

            const handleOptionClick = useCallback(
                (optionNombre: string) => {
                    onChange(optionNombre);
                    setIsOpen(false);
                    setSearchTerm('');
                },
                [onChange],
            );

            const handleClearClick = useCallback(() => {
                onChange('');
                setSearchTerm('');
                setIsOpen(false);
            }, [onChange]);

            const handleToggleDropdown = useCallback(() => {
                setIsOpen(!isOpen);
            }, [isOpen]);

            const handleCreateNew = useCallback(() => {
                onChange(searchTerm);
                setIsOpen(false);
                setSearchTerm('');
            }, [onChange, searchTerm]);

            if (disabled) {
                return (
                    <input
                        type="text"
                        value={displayValue}
                        className={`w-full rounded-lg border bg-gray-100 px-3 py-2 text-sm dark:border-gray-500 dark:bg-gray-600 dark:text-white ${
                            isError ? 'border-red-500' : 'border-gray-300 dark:border-gray-500'
                        } ${className}`}
                        disabled
                    />
                );
            }

            // ✅ CORREGIDO: Validar que filteredOptions sea un array antes de renderizar
            const validFilteredOptions = Array.isArray(filteredOptions) ? filteredOptions : [];

            return (
                <div className="relative" ref={localDropdownRef}>
                    <div className="relative">
                        <input
                            type="text"
                            value={isOpen ? searchTerm : displayValue}
                            onChange={handleInputChange}
                            onFocus={handleInputFocus}
                            className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white ${
                                isError ? 'border-red-500' : 'border-gray-300 dark:border-gray-500'
                            } ${className}`}
                            placeholder={isOpen ? 'Buscar...' : placeholder}
                        />

                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {isSearching ? (
                                <Loader className="h-4 w-4 animate-spin text-gray-400" />
                            ) : (
                                <button type="button" onClick={handleToggleDropdown} className="text-gray-400 hover:text-gray-600">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {value && (
                            <button
                                type="button"
                                onClick={handleClearClick}
                                className="absolute inset-y-0 right-8 flex items-center pr-1 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {isOpen && (
                        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
                            {validFilteredOptions.length > 0 &&
                                validFilteredOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => handleOptionClick(option.nombre)}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:text-white dark:hover:bg-gray-600"
                                    >
                                        {displayField === 'nombre_completo' && option.nombre_completo ? option.nombre_completo : option.nombre}
                                    </button>
                                ))}

                            {validFilteredOptions.length === 0 && !shouldShowCreateNew && (
                                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                    {searchTerm ? 'No se encontraron resultados' : 'Escribe para buscar...'}
                                </div>
                            )}

                            {shouldShowCreateNew && (
                                <>
                                    {validFilteredOptions.length > 0 && <div className="border-t border-gray-200 dark:border-gray-600"></div>}
                                    <button
                                        type="button"
                                        onClick={handleCreateNew}
                                        className="w-full px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                    >
                                        ➕ Crear "{searchTerm}"
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            );
        },
    );

    SelectConBusqueda.displayName = 'SelectConBusqueda';
    const [editoriales, setEditoriales] = useState<{ id: number; nombre: string; contacto?: string }[]>([]);
    const [categorias, setCategorias] = useState<{ id: number; nombre: string; descripción?: string }[]>([]);
    const [autores, setAutores] = useState<
        { id: number; nombre: string; seudónimo?: string; nacionalidad?: string; biografía?: string; nombre_completo?: string }[]
    >([]);
    const cargarDatosBDManual = React.useCallback(async () => {
        try {
            if (editoriales.length === 0) {
                try {
                    const response = await axios.get('/admin/api/editoriales');
                    const editorialesData = response.data.editoriales || response.data || [];
                    if (Array.isArray(editorialesData)) {
                        setEditoriales(editorialesData);
                    } else {
                        setEditoriales([]);
                    }
                } catch (error) {}
            }

            if (categorias.length === 0) {
                try {
                    const response = await axios.get('/admin/api/etiquetas');
                    const categoriasData = response.data.categorias || response.data.etiquetas || response.data || [];
                    if (Array.isArray(categoriasData)) {
                        setCategorias(categoriasData);
                    } else {
                        setCategorias([]);
                    }
                } catch (error) {
                    console.error('Error cargando categorías:', error);
                    setCategorias([
                        { id: 1, nombre: 'Ficción' },
                        { id: 2, nombre: 'No Ficción' },
                        { id: 3, nombre: 'Académico' },
                    ]);
                }
            }

            if (autores.length === 0) {
                try {
                    const response = await axios.get('/admin/api/autores');
                    const autoresData = response.data.autores || response.data || [];
                    if (Array.isArray(autoresData)) {
                        setAutores(autoresData);
                    } else {
                        setAutores([]);
                    }
                } catch (error) {
                    console.error('Error cargando autores:', error);
                    setAutores([
                        { id: 1, nombre: 'Gabriel García Márquez', nombre_completo: 'Gabriel García Márquez (Gabo)' },
                        { id: 2, nombre: 'Isabel Allende', nombre_completo: 'Isabel Allende' },
                    ]);
                }
            }
        } catch (error) {
            console.error('Error cargando datos de BD:', error);
        }
    }, [editoriales.length, categorias.length, autores.length]);

    const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<string[]>([]);

    const agregarEtiqueta = useCallback(
        (etiqueta: string) => {
            if (!etiquetasSeleccionadas.includes(etiqueta)) {
                const nuevasEtiquetas = [...etiquetasSeleccionadas, etiqueta];
                setEtiquetasSeleccionadas(nuevasEtiquetas);
                // Actualizar también el campo genero para compatibilidad
                setNuevoLibro((prev) => ({
                    ...prev,
                    genero: nuevasEtiquetas.join(', '),
                    etiquetas: nuevasEtiquetas.join(', '),
                }));
            }
        },
        [etiquetasSeleccionadas],
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
        [etiquetasSeleccionadas],
    );
    useEffect(() => {
        setEtiquetasSeleccionadas([]);
    }, []);

    useEffect(() => {
        if (modoAgregar === 'manual' && (editoriales.length === 0 || categorias.length === 0 || autores.length === 0)) {
            cargarDatosBDManual();
        }
    }, [autores.length, cargarDatosBDManual, categorias.length, editoriales.length, modoAgregar]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Agregar Libros - Sistema Inteligente" />

            <div className="space-y-6 px-6 py-4">
                {/* Header con más opciones */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                            Gestión de Libros
                            {(buscandoISBNs || guardando) && <Loader className="h-6 w-6 animate-spin text-blue-600" />}
                        </h1>
                    </div>

                    {/* Controles del header */}
                    <div className="flex items-center gap-3">
                        {libros.length > 0 && (
                            <>
                                <button
                                    onClick={() => setMostrarEstadisticasAvanzadas(!mostrarEstadisticasAvanzadas)}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                                        mostrarEstadisticasAvanzadas ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <BarChart3 className="h-4 w-4" />
                                    Estadísticas
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('¿Está seguro de limpiar toda la lista?')) {
                                            setLibros([]);
                                            setEstadisticasBusqueda(null);
                                            setDatosFactura(null);
                                            setArchivoXML(null);
                                            toast.success('Lista limpiada', {
                                                position: 'top-center',
                                                autoClose: 2000,
                                                theme: 'colored',
                                            });
                                        }
                                    }}
                                    className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-white transition-colors hover:bg-red-700"
                                    disabled={guardando}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Limpiar
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* ✅ NUEVO: Panel de información de factura procesada */}
                {datosFactura && <InfoFacturaProcesada datosFactura={datosFactura} onLimpiar={limpiarFactura} />}

                {/* Panel de estadísticas avanzadas */}
                <div className="sticky top-0 z-10 bg-white">
                    {mostrarEstadisticasAvanzadas && libros.length > 0 && (
                        <div className="rounded-lg border bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <BarChart3 className="h-5 w-5" />
                                Estadísticas Detalladas
                            </h3>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                                <div className="rounded-lg bg-blue-50 p-3">
                                    <div className="text-2xl font-bold text-blue-800">{estadisticas.total}</div>
                                    <div className="text-sm text-blue-600">Total libros</div>
                                </div>
                                <div className="rounded-lg bg-green-50 p-3">
                                    <div className="text-2xl font-bold text-green-800">
                                        {estadisticas.procesados}
                                        <span className="ml-1 text-sm">({estadisticas.porcentajeProcesados}%)</span>
                                    </div>
                                    <div className="text-sm text-green-600">Procesados</div>
                                </div>
                                {estadisticas.errores > 0 && (
                                    <div className="rounded-lg bg-red-50 p-3">
                                        <div className="text-2xl font-bold text-red-800">
                                            {estadisticas.errores}
                                            <span className="ml-1 text-sm">({estadisticas.porcentajeErrores}%)</span>
                                        </div>
                                        <div className="text-sm text-red-600">Con errores</div>
                                    </div>
                                )}
                                <div className="rounded-lg bg-emerald-50 p-3">
                                    <div className="text-xl font-bold text-emerald-800">${estadisticas.valorTotal.toFixed(2)}</div>
                                    <div className="text-sm text-emerald-600">Valor total</div>
                                </div>
                                <div className="rounded-lg bg-orange-50 p-3">
                                    <div className="text-2xl font-bold text-orange-800">{estadisticas.cantidadTotal}</div>
                                    <div className="text-sm text-orange-600">Unidades</div>
                                </div>
                                <div className="rounded-lg bg-purple-50 p-3">
                                    <div className="text-2xl font-bold text-purple-800">
                                        {estadisticas.conImagenes}
                                        <span className="ml-1 text-sm">({estadisticas.porcentajeConImagenes}%)</span>
                                    </div>
                                    <div className="text-sm text-purple-600">Con imagen</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {guardando && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-center gap-3">
                            <Loader className="h-5 w-5 animate-spin text-blue-600" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-800">💾 Guardando libros en inventario...</p>
                                <p className="mt-1 text-xs text-blue-600">Creando relaciones inteligentes con autores, editoriales y etiquetas</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Estadísticas de búsqueda mejoradas */}
                {estadisticasBusqueda && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center gap-3">
                            <Database className="h-5 w-5 text-green-600" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-green-800">
                                    Procesamiento completado: {estadisticasBusqueda.encontrados}/{estadisticasBusqueda.total} libros encontrados (
                                    {Math.round((estadisticasBusqueda.encontrados / estadisticasBusqueda.total) * 100)}% éxito)
                                </p>

                                {estadisticasBusqueda.isbnsOriginales.length > 0 && (
                                    <details className="mt-2">
                                        <summary className="cursor-pointer text-xs text-green-600 hover:text-green-800">
                                            Ver ISBNs procesados ({estadisticasBusqueda.isbnsOriginales.length})
                                        </summary>
                                        <p className="mt-1 font-mono text-xs text-green-600">{estadisticasBusqueda.isbnsOriginales.join(', ')}</p>
                                    </details>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Progreso de búsqueda */}
                {progresoBusqueda && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-center gap-3">
                            <Loader className="h-5 w-5 animate-spin text-blue-600" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-800">
                                    Consultando base de datos... {progresoBusqueda.actual}/{progresoBusqueda.total}
                                </p>
                                <div className="mt-2 h-2 w-full rounded-full bg-blue-200">
                                    <div
                                        className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                                        style={{ width: `${(progresoBusqueda.actual / progresoBusqueda.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Selector de modo */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="mb-6 flex gap-4">
                        <button
                            onClick={() => setModoAgregar('factura')}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                                modoAgregar === 'factura'
                                    ? 'border-2 border-blue-300 bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            disabled={guardando}
                        >
                            <FileText className="h-4 w-4" />
                            Desde Factura XML
                        </button>
                        <button
                            onClick={() => setModoAgregar('manual')}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                                modoAgregar === 'manual'
                                    ? 'border-2 border-green-300 bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            disabled={guardando}
                        >
                            <Plus className="h-4 w-4" />
                            Manual
                        </button>
                    </div>

                    {/* Modo Manual */}

                    {/* Modo Manual MEJORADO - CON APIS */}
                    {modoAgregar === 'manual' && (
                        <div className="space-y-6">
                            {/* Mensaje cuando ya hay factura procesada */}
                            {datosFactura && (
                                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-orange-800">Ya hay una factura procesada</p>
                                            <p className="mt-1 text-xs text-orange-700">
                                                Los libros manuales se vincularán a la factura {datosFactura.folio}.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 🔢 INDICADOR DE PASOS */}
                            <div className="rounded-lg border bg-white p-6 shadow-sm">
                                <div className="mb-6 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">Agregar Libro Manual</h3>
                                    <span className="text-sm text-gray-500">Paso {pasoActual} de 4</span>
                                </div>
                                {/* Barra de progreso */}
                                <div className="mb-8 flex items-center space-x-4">
                                    {[1, 2, 3, 4, 5].map((paso) => {
                                        const completado = pasoCompletado[paso];
                                        const actual = paso === pasoActual;
                                        const accesible = paso <= pasoActual || completado;

                                        return (
                                            <React.Fragment key={paso}>
                                                <button
                                                    onClick={() => (accesible ? setPasoActual(paso) : null)}
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
                                                {paso < 5 && (
                                                    <div className={`h-1 flex-1 rounded ${pasoCompletado[paso] ? 'bg-green-600' : 'bg-gray-200'}`} />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                                {/* Títulos de pasos */}
                                <div className="mb-8 grid grid-cols-5 gap-4 text-center text-xs text-gray-600">
                                    <div className={pasoActual === 1 ? 'font-semibold text-blue-600' : ''}>Información Básica</div>
                                    <div className={pasoActual === 2 ? 'font-semibold text-blue-600' : ''}>Autor y Editorial</div>
                                    <div className={pasoActual === 3 ? 'font-semibold text-blue-600' : ''}>Información Comercial</div>
                                    <div className={pasoActual === 4 ? 'font-semibold text-blue-600' : ''}>Detalles Adicionales</div>
                                    <div className={pasoActual === 5 ? 'font-semibold text-blue-600' : ' '}>Información Fiscal</div>
                                </div>
                                {/* ✅ PASO 1: INFORMACIÓN BÁSICA */}
                                {pasoActual === 1 && (
                                    <div className="space-y-6">
                                        <div className="rounded-lg bg-gray-50 p-6">
                                            <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-800">
                                                <BookOpen className="h-5 w-5 text-gray-600" />
                                                Paso 1: Información Básica
                                            </h4>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                {/* ISBN con búsqueda */}
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                                        ISBN * <span className="text-red-500">Requerido</span>
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={nuevoLibro.isbn}
                                                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, isbn: e.target.value }))}
                                                            className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                                                !nuevoLibro.isbn ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                            }`}
                                                            placeholder="9786073838535"
                                                            disabled={guardando}
                                                        />
                                                        <button
                                                            onClick={() => buscarPorISBNManual(nuevoLibro.isbn || '')}
                                                            disabled={buscandoISBNs || !nuevoLibro.isbn || guardando}
                                                            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                                                            title="Buscar en base de datos"
                                                        >
                                                            {buscandoISBNs ? (
                                                                <Loader className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Database className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    {!nuevoLibro.isbn && (
                                                        <p className="mt-1 text-xs text-red-600">El ISBN es obligatorio para continuar</p>
                                                    )}
                                                </div>

                                                {/* Título */}
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
                                                    {!nuevoLibro.titulo && (
                                                        <p className="mt-1 text-xs text-red-600">El título es obligatorio para continuar</p>
                                                    )}
                                                </div>

                                                {/* Año de Publicación */}
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">Año de Publicación</label>
                                                    <input
                                                        type="number"
                                                        value={nuevoLibro.año_publicacion || ''}
                                                        onChange={(e) =>
                                                            setNuevoLibro((prev) => ({ ...prev, año_publicacion: parseInt(e.target.value) || null }))
                                                        }
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                                        placeholder="2023"
                                                        min="1800"
                                                        max={new Date().getFullYear() + 1}
                                                        disabled={guardando}
                                                    />
                                                </div>

                                                {/* Páginas */}
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">Número de Páginas</label>
                                                    <input
                                                        type="number"
                                                        value={nuevoLibro.paginas || ''}
                                                        onChange={(e) =>
                                                            setNuevoLibro((prev) => ({ ...prev, paginas: parseInt(e.target.value) || null }))
                                                        }
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                                        placeholder="350"
                                                        min="1"
                                                        disabled={guardando}
                                                    />
                                                </div>
                                            </div>

                                            {/* Validación visual */}
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
                                )}
                                {pasoActual === 2 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            {/* Editorial */}
                                            <div className="rounded-lg bg-amber-50 p-6">
                                                <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                                                    <Building2 className="h-5 w-5 text-gray-600" />
                                                    Editorial *
                                                </h4>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                                            Editorial * <span className="text-red-500">Requerido</span>
                                                        </label>
                                                        <SelectConBusqueda
                                                            value={nuevoLibro.editorial_nombre}
                                                            onChange={(value) => {
                                                                const editorial = editoriales.find((ed) => ed.nombre === value);
                                                                setNuevoLibro((prev) => ({
                                                                    ...prev,
                                                                    editorial_nombre: value,
                                                                    contacto_editorial: editorial?.contacto || prev.contacto_editorial || '',
                                                                }));
                                                            }}
                                                            options={editoriales}
                                                            placeholder="Seleccionar editorial"
                                                            disabled={guardando}
                                                            apiEndpoint="/admin/api/editoriales"
                                                            onNewIndicator={setIsEditorialNueva}
                                                            maxOptions={15}
                                                            isError={!nuevoLibro.editorial_nombre}
                                                        />

                                                        {nuevoLibro.editorial_nombre && isEditorialNueva && (
                                                            <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                                                                <Plus className="h-3 w-3" />
                                                                Nuevo: {nuevoLibro.editorial_nombre}
                                                            </div>
                                                        )}

                                                        {!nuevoLibro.editorial_nombre && (
                                                            <p className="mt-1 text-xs text-red-600">La editorial es obligatoria para continuar</p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">Contacto</label>
                                                        <input
                                                            type="text"
                                                            value={nuevoLibro.contacto_editorial || ''}
                                                            onChange={(e) =>
                                                                setNuevoLibro((prev) => ({ ...prev, contacto_editorial: e.target.value }))
                                                            }
                                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                                            placeholder="contacto@editorial.com"
                                                            disabled={guardando}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Autor */}
                                            <div className="rounded-lg bg-blue-50 p-6">
                                                <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                                                    <Users className="h-5 w-5 text-gray-600" />
                                                    Autor *
                                                </h4>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                                            Autor * <span className="text-red-500">Requerido</span>
                                                        </label>
                                                        <SelectConBusqueda
                                                            value={nuevoLibro.autor_nombre}
                                                            onChange={(value) => {
                                                                const autor = autores.find((a) => a.nombre === value);
                                                                setNuevoLibro((prev) => ({
                                                                    ...prev,
                                                                    autor_nombre: value,
                                                                    nacionalidad: autor?.nacionalidad || prev.nacionalidad || '',
                                                                    biografia: autor?.biografía || prev.biografia || '',
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

                                                        {!nuevoLibro.autor_nombre && (
                                                            <p className="mt-1 text-xs text-red-600">El autor es obligatorio para continuar</p>
                                                        )}
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

                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">Nacionalidad</label>
                                                        <input
                                                            type="text"
                                                            value={nuevoLibro.nacionalidad || ''}
                                                            onChange={(e) => setNuevoLibro((prev) => ({ ...prev, nacionalidad: e.target.value }))}
                                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                                            placeholder="Colombiano"
                                                            disabled={guardando}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Validación visual */}
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <div
                                                    className={`h-3 w-3 rounded-full ${nuevoLibro.editorial_nombre ? 'bg-green-500' : 'bg-red-500'}`}
                                                />
                                                <span className={nuevoLibro.editorial_nombre ? 'text-green-700' : 'text-red-700'}>
                                                    Editorial {nuevoLibro.editorial_nombre ? 'completada' : 'requerida'}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-sm">
                                                <div className={`h-3 w-3 rounded-full ${nuevoLibro.autor_nombre ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className={nuevoLibro.autor_nombre ? 'text-green-700' : 'text-red-700'}>
                                                    Autor {nuevoLibro.autor_nombre ? 'completado' : 'requerido'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {pasoActual === 3 && (
                                    <div className="space-y-6">
                                        {/* Información Comercial */}
                                        <div className="rounded-lg bg-emerald-50 p-6">
                                            <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                                                <DollarSign className="h-5 w-5 text-gray-600" />
                                                Información Comercial
                                            </h4>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                                        Cantidad * <span className="text-red-500">Requerido</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={nuevoLibro.cantidad}
                                                        onChange={(e) =>
                                                            setNuevoLibro((prev) => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))
                                                        }
                                                        className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                                            !nuevoLibro.cantidad || nuevoLibro.cantidad <= 0
                                                                ? 'border-red-300 bg-red-50'
                                                                : 'border-gray-300'
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
                                                        onChange={(e) =>
                                                            setNuevoLibro((prev) => ({ ...prev, valorUnitario: parseFloat(e.target.value) || 0 }))
                                                        }
                                                        className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                                            nuevoLibro.valorUnitario < 0 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                        }`}
                                                        placeholder="0.00"
                                                        disabled={guardando}
                                                    />
                                                    {nuevoLibro.valorUnitario < 0 && (
                                                        <p className="mt-1 text-xs text-red-600">El precio no puede ser negativo</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">Descuento</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={nuevoLibro.descuento}
                                                        onChange={(e) =>
                                                            setNuevoLibro((prev) => ({ ...prev, descuento: parseFloat(e.target.value) || 0 }))
                                                        }
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                                        placeholder="0.00"
                                                        disabled={guardando}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">Total</label>
                                                    <div className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-semibold text-emerald-700">
                                                        $
                                                        {(
                                                            (nuevoLibro.valorUnitario || 0) * (nuevoLibro.cantidad || 1) -
                                                            (nuevoLibro.descuento || 0)
                                                        ).toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 🏷️ SISTEMA DE ETIQUETAS MÚLTIPLES */}
                                        <div className="rounded-lg bg-green-50 p-6 dark:bg-green-900/10">
                                            <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                                                <Tag className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                                Etiquetas/Categorías
                                            </h4>

                                            {/* Selector para agregar etiquetas */}
                                            <div className="mb-4">
                                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Agregar etiqueta
                                                </label>
                                                <SelectConBusqueda
                                                    value=""
                                                    onChange={(value) => {
                                                        if (value) {
                                                            agregarEtiqueta(value);
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
                                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Etiquetas seleccionadas
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {etiquetasSeleccionadas.map((etiqueta, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-700 dark:text-blue-300"
                                                        >
                                                            {etiqueta}
                                                            {!guardando && (
                                                                <button
                                                                    onClick={() => quitarEtiqueta(etiqueta)}
                                                                    className="ml-1 text-blue-500 hover:text-red-600 dark:text-blue-400 dark:hover:text-red-400"
                                                                    title={`Quitar ${etiqueta}`}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </span>
                                                    ))}
                                                    {etiquetasSeleccionadas.length === 0 && (
                                                        <span className="text-sm text-gray-500 italic dark:text-gray-400">
                                                            No hay etiquetas seleccionadas. Agregue al menos una etiqueta para categorizar el libro.
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Campo manual para etiquetas adicionales */}
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Agregar etiqueta personalizada
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Escribir nueva etiqueta..."
                                                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                                                        disabled={guardando}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const input = e.target as HTMLInputElement;
                                                                const valor = input.value.trim();
                                                                if (valor) {
                                                                    agregarEtiqueta(valor);
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
                                                                agregarEtiqueta(valor);
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

                                            {/* Contador de etiquetas */}
                                            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-blue-700">
                                                        Total de etiquetas: <strong>{etiquetasSeleccionadas.length}</strong>
                                                    </span>
                                                    {etiquetasSeleccionadas.length > 0 && (
                                                        <button
                                                            onClick={() => {
                                                                setEtiquetasSeleccionadas([]);
                                                                setNuevoLibro((prev) => ({
                                                                    ...prev,
                                                                    genero: 'General',
                                                                    etiquetas: '',
                                                                }));
                                                            }}
                                                            className="text-xs text-red-600 underline hover:text-red-800"
                                                            disabled={guardando}
                                                        >
                                                            Limpiar todas
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Validación visual */}
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <div className={`h-3 w-3 rounded-full ${nuevoLibro.cantidad > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className={nuevoLibro.cantidad > 0 ? 'text-green-700' : 'text-red-700'}>
                                                    Cantidad {nuevoLibro.cantidad > 0 ? 'válida' : 'requerida'}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-sm">
                                                <div
                                                    className={`h-3 w-3 rounded-full ${nuevoLibro.valorUnitario >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                                />
                                                <span className={nuevoLibro.valorUnitario >= 0 ? 'text-green-700' : 'text-red-700'}>
                                                    Precio {nuevoLibro.valorUnitario >= 0 ? 'válido' : 'inválido'}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-sm">
                                                <div
                                                    className={`h-3 w-3 rounded-full ${etiquetasSeleccionadas.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                />
                                                <span className={etiquetasSeleccionadas.length > 0 ? 'text-green-700' : 'text-yellow-700'}>
                                                    Etiquetas{' '}
                                                    {etiquetasSeleccionadas.length > 0
                                                        ? `(${etiquetasSeleccionadas.length})`
                                                        : '(recomendado agregar al menos una)'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {pasoActual === 4 && (
                                    <div className="space-y-6">
                                        {/* Imagen */}
                                        <div className="rounded-lg bg-indigo-50 p-6">
                                            <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                                                <FileImage className="h-5 w-5 text-gray-600" />
                                                Imagen del Libro (Opcional)
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
                                                                    onClick={() => setNuevoLibro((prev) => ({ ...prev, imagen_url: '' }))}
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
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">Edición</label>
                                                    <input
                                                        type="text"
                                                        value={nuevoLibro.edicion || ''}
                                                        onChange={(e) => setNuevoLibro((prev) => ({ ...prev, edicion: e.target.value }))}
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Primera, Segunda, etc."
                                                        disabled={guardando}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">Idioma</label>
                                                    <select
                                                        value={nuevoLibro.idioma || ''}
                                                        onChange={(e) => setNuevoLibro((prev) => ({ ...prev, idioma: e.target.value }))}
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                                        disabled={guardando}
                                                    >
                                                        <option value="">Seleccionar idioma</option>
                                                        <option value="Español">Español</option>
                                                        <option value="Inglés">Inglés</option>
                                                        <option value="Francés">Francés</option>
                                                        <option value="Alemán">Alemán</option>
                                                        <option value="Italiano">Italiano</option>
                                                        <option value="Portugués">Portugués</option>
                                                        <option value="Japonés">Japonés</option>
                                                        <option value="Chino">Chino</option>
                                                        <option value="Árabe">Árabe</option>
                                                        <option value="Ruso">Ruso</option>
                                                        <option value="Otros">Otros</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">Peso (gramos)</label>
                                                    <input
                                                        type="number"
                                                        value={nuevoLibro.peso || ''}
                                                        onChange={(e) =>
                                                            setNuevoLibro((prev) => ({ ...prev, peso: parseFloat(e.target.value) || null }))
                                                        }
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
                                                    <span className="font-medium text-gray-700">Editorial:</span>
                                                    <span className="ml-2 text-gray-900">{nuevoLibro.editorial_nombre}</span>
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
                                                        $
                                                        {(
                                                            (nuevoLibro.valorUnitario || 0) * (nuevoLibro.cantidad || 1) -
                                                            (nuevoLibro.descuento || 0)
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {pasoActual === 5 && <PasoInformacionFiscal />} {}
                                {/* 🔄 BOTONES DE NAVEGACIÓN */}
                                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                                    <div className="flex gap-3">
                                        {pasoActual > 1 && (
                                            <button
                                                onClick={retrocederPaso}
                                                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                                                disabled={guardando}
                                            >
                                                ← Anterior
                                            </button>
                                        )}

                                        <button
                                            onClick={() => {
                                                // Reset completo del formulario
                                                setNuevoLibro({
                                                    isbn: '',
                                                    titulo: '',
                                                    cantidad: 1,
                                                    valorUnitario: 0,
                                                    descuento: 0,
                                                    autor_nombre: '',
                                                    autor_apellidos: '',
                                                    editorial_nombre: '',
                                                    contacto_editorial: '',
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
                                                    idioma: '',
                                                    edicion: '',
                                                    nacionalidad: '',
                                                    biografia: '',
                                                    proveedor: '',
                                                    codigo_interno: '',
                                                });
                                                setPasoActual(1);
                                                setPasoCompletado({});
                                            }}
                                            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                                            disabled={guardando}
                                        >
                                            <X className="h-4 w-4" />
                                            Limpiar Todo
                                        </button>
                                    </div>

                                    <div className="flex gap-3">
                                        {pasoActual < 5 ? (
                                            <button
                                                onClick={avanzarPaso}
                                                disabled={!validarPaso(pasoActual) || guardando}
                                                className={`flex items-center gap-2 rounded-lg px-6 py-2 text-white transition-colors ${
                                                    validarPaso(pasoActual) ? 'bg-blue-600 hover:bg-blue-700' : 'cursor-not-allowed bg-gray-400'
                                                }`}
                                            >
                                                Siguiente →
                                            </button>
                                        ) : (
                                            <button
                                                onClick={agregarLibroManual}
                                                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                                                disabled={guardando || !validarPaso(1) || !validarPaso(2) || !validarPaso(3)}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Agregar Libro
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {/* 📊 Indicador de validación en tiempo real */}
                                <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
                                    <div className="mb-2 text-xs text-black">Estado de validación:</div>
                                    <div className="flex flex-wrap gap-4 text-xs text-black">
                                        <div className="flex items-center gap-1">
                                            <div className={`h-2 w-2 rounded-full ${validarPaso(1) ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span>Paso 1: {validarPaso(1) ? 'Completo' : 'Incompleto'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className={`h-2 w-2 rounded-full ${validarPaso(2) ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span>Paso 2: {validarPaso(2) ? 'Completo' : 'Incompleto'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className={`h-2 w-2 rounded-full ${validarPaso(3) ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span>Paso 3: {validarPaso(3) ? 'Completo' : 'Incompleto'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            <span>Paso 4: Opcional</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className={`h-2 w-2 rounded-full ${validarPaso(5) ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span>Paso 5: {validarPaso(5) ? 'Completo' : 'Incompleto'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Modo Factura XML */}
                    {modoAgregar === 'factura' && (
                        <div className="space-y-4">
                            {/* ✅ NUEVO: Solo mostrar upload si no hay factura procesada */}
                            {!datosFactura && (
                                <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                                    <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                    <input
                                        type="file"
                                        accept=".xml"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setArchivoXML(file);
                                            }
                                        }}
                                        className="hidden"
                                        id="xml-upload"
                                        disabled={buscandoISBNs || guardando}
                                    />
                                    <label htmlFor="xml-upload" className="cursor-pointer">
                                        <span className="text-lg font-medium text-gray-700">Subir Factura XML (CFDI)</span>
                                        <p className="mt-2 text-gray-500">Se enriquecerá automáticamente la información</p>
                                    </label>
                                </div>
                            )}
                            {/* Mostrar advertencia cuando hay factura vinculada */}
                            {datosFactura && pasoActual === 1 && (
                                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <FileText className="mt-0.5 h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="text-sm font-medium text-blue-800">
                                                Libros vinculados a factura {datosFactura.serie}
                                                {datosFactura.folio}
                                            </p>
                                            <p className="mt-1 text-xs text-blue-700">
                                                Los datos del proveedor y fiscales se prellenarán automáticamente desde la factura XML.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {archivoXML && !datosFactura && (
                                <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        <div className="flex flex-col justify-center">
                                            <span className="font-medium text-blue-800">{archivoXML.name}</span>
                                            <p className="text-xs leading-none text-blue-600">Listo para procesar...</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => procesarFacturaXML(archivoXML)}
                                        disabled={buscandoISBNs || guardando}
                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {buscandoISBNs ? <Loader className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                                        Procesar Factura
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Vista de libros mejorada */}
                {libros.length > 0 && (
                    <>
                        <VistaLibros
                            libros={libros}
                            editando={editando}
                            onVerDetalles={abrirModalDetalles}
                            onEditar={(id) => setEditando(editando === id ? null : id)}
                            onEliminar={eliminarLibro}
                            onGuardarEdicion={guardarEdicion}
                            mostrarFiltroFuente={true}
                            mostrarEstadisticasDetalladas={false}
                        />

                        {/* Total y acciones */}
                        <div className="rounded-lg border bg-white shadow-sm">
                            <div className="border-t bg-gray-50 p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={guardarLibrosEnInventario}
                                            disabled={buscandoISBNs || libros.length === 0 || guardando}
                                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {guardando ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            {guardando ? 'Guardando...' : `Guardar al Inventario (${libros.length})`}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Modal de resultado de guardado */}
                {resultadoGuardado && (
                    <ResultadoGuardado resultado={resultadoGuardado} onCerrar={cerrarResultadoGuardado} estadisticasPost={estadisticasPostGuardado} />
                )}

                {/* Modal de Detalles */}
                <LibroDetallesModal
                    libro={libroSeleccionado}
                    isOpen={modalDetallesAbierto}
                    onClose={cerrarModalDetalles}
                    onEdit={editarLibroDesdeModal}
                    onDelete={eliminarLibroDesdeModal}
                    readonly={false}
                />
            </div>

            {/* ✅ TOAST CONTAINER EXACTAMENTE COMO INVENTORY */}
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />
        </AppLayout>
    );
}
