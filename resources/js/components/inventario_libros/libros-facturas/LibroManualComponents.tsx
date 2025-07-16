// ============================================
// 📁 components/libros-facturas/LibroManualComponents.tsx - PARTE 1 CON AUTO-COMPLETADO
// ============================================
import { SelectConBusqueda } from '@/components/inventario_libros/SelectConBusqueda';
import { LibroManual } from '@/types/LibroCompleto';
import {
    AlertTriangle,
    BookOpen,
    Building2,
    Check,
    CheckCircle,
    CreditCard,
    Database,
    DollarSign,
    FileImage,
    Lock,
    Package,
    Plus,
    Receipt,
    Tag,
    Users,
    X,
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

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
    facturaConfirmada?: boolean;
    onConfirmarFactura?: () => void;
}

// =============================================
// 📄 SECCIÓN DE FACTURA CON AUTO-COMPLETADO
// =============================================
const SeccionFactura: React.FC<{
    nuevoLibro: LibroManual;
    setNuevoLibro: React.Dispatch<React.SetStateAction<LibroManual>>;
    guardando: boolean;
    datosFactura?: DatosFactura;
    facturaConfirmada: boolean;
    onConfirmarFactura: () => void;
}> = ({ nuevoLibro, setNuevoLibro, guardando, datosFactura, facturaConfirmada, onConfirmarFactura }) => {
  
    // ✅ ESTADOS OPTIMIZADOS
    const [isEditorialNueva, setIsEditorialNueva] = useState(false);
    const [isRFCNuevo, setIsRFCNuevo] = useState(false);
    const [proveedorAutoCompletado, setProveedorAutoCompletado] = useState<any>(null);

    const [proveedorBloqueado, setProveedorBloqueado] = useState(false);

    // ✅ MEMOIZAR OPCIONES PARA EVITAR RE-RENDERS
    const editoriales = useMemo(() => [], []);
    const proveedores = useMemo(() => [], []);

    // ✅ CALLBACK PARA EDITORIAL (sin cambios)
    const handleEditorialChange = useCallback(
        (value: string) => {
            if (proveedorBloqueado) {
                setProveedorBloqueado(false); // ✅ DESBLOQUEA SI SE EDITA
            }
            if (proveedorAutoCompletado) {
                setProveedorAutoCompletado(null);
            }

            setNuevoLibro((prev) => ({
                ...prev,
                editorial_nombre: value,
            }));
        },
        [proveedorBloqueado, proveedorAutoCompletado, setNuevoLibro],
    );

    // ✅ CALLBACK MEJORADO PARA RFC CON AUTO-COMPLETADO
    const handleRFCChange = useCallback(
        async (rfc: string) => {
            setNuevoLibro((prev) => ({
                ...prev,
                rfcProveedor: rfc,
            }));
            if (proveedorAutoCompletado) {
                setProveedorAutoCompletado(null);
            }

            if (rfc.length === 0) {
                setProveedorBloqueado(false);
                setNuevoLibro((prev) => ({
                    ...prev,
                    rfcProveedor: '',
                    editorial_nombre: '', //  LIMPIAR EDITORIAL
                }));

                toast.info('🔄 RFC borrado - Campo proveedor limpiado');
                return;
            }

            if (rfc.length < 3) {
                setProveedorBloqueado(false);
                return;
            }

            // ✅ SI EL RFC TIENE SUFICIENTES CARACTERES, BUSCAR AUTO-COMPLETADO
            if (rfc && rfc.length >= 4 && rfc.trim() !== '') {
                try {
                    const response = await fetch(`/admin/api/proveedores?search=${encodeURIComponent(rfc.trim())}`);
                    console.log(response);
                    if (response.ok) {
                        const data = await response.json();

                        // ✅ BUSCAR COINCIDENCIA EXACTA DE RFC
                        const proveedorEncontrado = data.find((p: any) => p.rfc && p.rfc.toLowerCase() === rfc.toLowerCase());

                        if (proveedorEncontrado && proveedorEncontrado.nombre) {
                            const nombreLimpio = proveedorEncontrado.nombre.replace(' - ', '').trim();

                            // ✅ AUTO-COMPLETAR EL CAMPO EDITORIAL
                            setNuevoLibro((prev) => ({
                                ...prev,
                                rfcProveedor: rfc,
                                editorial_nombre: nombreLimpio,
                            }));

                            // ✅ MARCAR COMO AUTO-COMPLETADO
                            setProveedorAutoCompletado(proveedorEncontrado);
                            setProveedorBloqueado(true);
                            setIsEditorialNueva(false);

                            // ✅ MOSTRAR TOAST DE CONFIRMACIÓN
                            toast.success(`Proveedor auto-completado: ${nombreLimpio}`, {
                                position: 'top-right',
                                autoClose: 3000,
                                theme: 'colored',
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error buscando proveedor para auto-completado:', error);
                }
            }
        },
        [proveedorAutoCompletado, setNuevoLibro],
    );

    // ✅ VERIFICAR SI LOS CAMPOS ESTÁN COMPLETOS PARA HABILITAR EL BOTÓN
    const puedeConfirmarFactura = useMemo(() => {
        if (datosFactura?.folio && datosFactura?.fecha) {
            return true;
        }

        const camposRequeridos = [
            nuevoLibro.serieFactura?.trim(),
            nuevoLibro.folioFactura?.trim(),
            nuevoLibro.fechaFactura?.trim(),
            nuevoLibro.editorial_nombre?.trim(),
            nuevoLibro.rfcProveedor?.trim(),
            nuevoLibro.uuidFactura?.trim(),
        ];

        return camposRequeridos.every((campo) => campo && campo.length > 0);
    }, [
        datosFactura,
        nuevoLibro.serieFactura,
        nuevoLibro.folioFactura,
        nuevoLibro.fechaFactura,
        nuevoLibro.editorial_nombre,
        nuevoLibro.rfcProveedor,
        nuevoLibro.uuidFactura,
    ]);

    const confirmarFactura = useCallback(() => {
        if (!puedeConfirmarFactura) {
            toast.warning('Complete todos los campos obligatorios de la factura', {
                position: 'top-center',
                autoClose: 3000,
                theme: 'colored',
            });
            return;
        }

        onConfirmarFactura();

        toast.success('Factura confirmada y bloqueada. Ya puede agregar libros.', {
            position: 'top-center',
            autoClose: 3000,
            theme: 'colored',
        });
    }, [puedeConfirmarFactura, onConfirmarFactura]);

    return (
        <div className="mb-6 rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${facturaConfirmada ? 'bg-green-600' : 'bg-blue-600'}`}>
                        {facturaConfirmada ? <Lock className="h-6 w-6 text-white" /> : <Receipt className="h-6 w-6 text-white" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{facturaConfirmada ? 'Factura Confirmada' : 'Información de Factura'}</h3>
                        <p className="text-sm text-gray-600">
                            {facturaConfirmada
                                ? 'Datos bloqueados - Todos los libros se vincularán a esta factura'
                                : 'Complete los datos y confirme para continuar'}
                        </p>
                    </div>
                </div>

                {!facturaConfirmada && (
                    <button
                        onClick={confirmarFactura}
                        disabled={!puedeConfirmarFactura || guardando}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors ${
                            puedeConfirmarFactura ? 'bg-green-600 hover:bg-green-700' : 'cursor-not-allowed bg-gray-400'
                        }`}
                    >
                        <Check className="h-4 w-4" />
                        Confirmar Factura
                    </button>
                )}

                {facturaConfirmada && (
                    <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        <Lock className="h-4 w-4" />
                        Confirmada
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
                                <Lock className="h-4 w-4 text-green-600" />
                                <span className="sr-only">Campos bloqueados por factura XML</span>
                            </div>
                            <p className="mt-1 text-xs text-green-700">
                                Factura: {datosFactura.serie}
                                {datosFactura.folio} - {datosFactura.editorial}
                            </p>
                            {datosFactura.uuid && <p className="mt-1 font-mono text-xs text-green-600">UUID: {datosFactura.uuid}</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ CAMPOS SOLO SI NO ESTÁ CONFIRMADA */}
            {!facturaConfirmada ? (
                <>
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
                                } ${datosFactura?.serie ? 'cursor-not-allowed bg-gray-100' : ''}`}
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
                                } ${datosFactura?.folio ? 'cursor-not-allowed bg-gray-100' : ''}`}
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
                                } ${datosFactura?.fecha ? 'cursor-not-allowed bg-gray-100' : ''}`}
                                disabled={guardando || !!datosFactura?.fecha}
                            />
                            {!(nuevoLibro.fechaFactura || datosFactura?.fecha) && (
                                <p className="mt-1 text-xs text-red-600">La fecha es obligatoria</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                UUID Fiscal *<span className="text-red-500">Requerido</span>
                            </label>
                            <input
                                type="text"
                                value={nuevoLibro.uuidFactura || datosFactura?.uuid || ''}
                                onChange={(e) => setNuevoLibro((prev) => ({ ...prev, uuidFactura: e.target.value }))}
                                className={`w-full rounded-lg border px-3 py-2 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                    !(nuevoLibro.uuidFactura || datosFactura?.uuid) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                } ${datosFactura?.uuid ? 'cursor-not-allowed bg-gray-100' : ''}`}
                                placeholder="UUID..."
                                disabled={guardando || !!datosFactura?.uuid}
                            />
                            {!(nuevoLibro.uuidFactura || datosFactura?.uuid) && <p className="mt-1 text-xs text-red-600">El UUID es obligatorio</p>}
                        </div>
                    </div>

                    {/* ✅ SEGUNDA FILA CON SELECTS Y AUTO-COMPLETADO */}
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* ✅ RFC CON AUTO-COMPLETADO */}
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                                <CreditCard className="h-4 w-4" />
                                RFC Proveedor * <span className="text-red-500">Requerido</span>
                                <span className="text-xs font-medium text-blue-600">(Auto-completa proveedor)</span>
                            </label>
                            <SelectConBusqueda
                                value={nuevoLibro.rfcProveedor || datosFactura?.rfc || ''}
                                onChange={handleRFCChange}
                                options={proveedores}
                                placeholder="Buscar RFC - auto-completa proveedor"
                                disabled={guardando || !!datosFactura?.rfc}
                                displayField="rfc"
                                apiEndpoint="/admin/api/proveedores"
                                onNewIndicator={setIsRFCNuevo}
                                maxOptions={15}
                                isError={!(nuevoLibro.rfcProveedor || datosFactura?.rfc)}
                                className={`${
                                    !(nuevoLibro.rfcProveedor || datosFactura?.rfc) ? 'border-red-300 bg-red-50' : ''
                                } ${datosFactura?.rfc ? 'cursor-not-allowed bg-gray-100' : ''}`}
                            />

                            {nuevoLibro.rfcProveedor && isRFCNuevo && (
                                <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                                    <Plus className="h-3 w-3" />
                                    Nuevo: {nuevoLibro.rfcProveedor}
                                </div>
                            )}

                            {!(nuevoLibro.rfcProveedor || datosFactura?.rfc) && <p className="mt-1 text-xs text-red-600">El RFC es obligatorio</p>}
                        </div>
                        {/* ✅ EDITORIAL CON INDICADOR DE AUTO-COMPLETADO */}
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Building2 className="h-4 w-4" />
                                Proveedor/Editorial * <span className="text-red-500">Requerido</span>
                                {proveedorAutoCompletado ? (
                                    <span className="flex items-center gap-1 text-xs text-green-600">
                                        <Check className="h-3 w-3" />
                                        Auto-completado: {proveedorAutoCompletado.rfc}
                                    </span>
                                ) : null}
                            </label>
                            <SelectConBusqueda
                                value={nuevoLibro.editorial_nombre || datosFactura?.editorial || ''}
                                onChange={handleEditorialChange}
                                options={editoriales}
                                placeholder="Seleccionar o escribir proveedor"
                                disabled={guardando || !!datosFactura?.editorial || proveedorBloqueado}
                                displayField="nombre_completo"
                                apiEndpoint="/admin/api/editoriales"
                                onNewIndicator={setIsEditorialNueva}
                                maxOptions={15}
                                isError={!(nuevoLibro.editorial_nombre || datosFactura?.editorial)}
                                className={`${
                                    !(nuevoLibro.editorial_nombre || datosFactura?.editorial) ? 'border-red-300 bg-red-50' : ''
                                } ${datosFactura?.editorial ? 'cursor-not-allowed bg-gray-100' : ''} ${
                                    proveedorBloqueado ? 'border-green-300 bg-green-50' : ''
                                }`}
                            />

                            {nuevoLibro.editorial_nombre && isEditorialNueva && !proveedorAutoCompletado && (
                                <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                                    <Plus className="h-3 w-3" />
                                    Nuevo: {nuevoLibro.editorial_nombre}
                                </div>
                            )}

                            {proveedorAutoCompletado && (
                                <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                                    <Check className="h-3 w-3" />
                                    Auto-completado desde RFC: {proveedorAutoCompletado.rfc}
                                </div>
                            )}

                            {!(nuevoLibro.editorial_nombre || datosFactura?.editorial) && (
                                <p className="mt-1 text-xs text-red-600">Nombre Proveedor</p>
                            )}
                        </div>
                    </div>

                    {/* ✅ INSTRUCCIÓN DE USO */}
                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <div className="flex items-start gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                                <Check className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-800">💡 Tip de eficiencia</p>
                                <p className="mt-1 text-xs text-blue-700">
                                    Busque y seleccione el RFC del proveedor - el campo "Proveedor/Editorial" se completará automáticamente.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Estado de validación */}
                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <div className="mb-2 text-sm font-medium text-blue-800">Estado de configuración:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-6">
                            <div className="flex items-center gap-2">
                                <div
                                    className={`h-3 w-3 rounded-full ${nuevoLibro.serieFactura || datosFactura?.serie ? 'bg-green-500' : 'bg-red-500'}`}
                                />
                                <span className={nuevoLibro.serieFactura || datosFactura?.serie ? 'text-green-700' : 'text-red-700'}>
                                    Serie {nuevoLibro.serieFactura || datosFactura?.serie ? '✓' : '✗'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div
                                    className={`h-3 w-3 rounded-full ${nuevoLibro.folioFactura || datosFactura?.folio ? 'bg-green-500' : 'bg-red-500'}`}
                                />
                                <span className={nuevoLibro.folioFactura || datosFactura?.folio ? 'text-green-700' : 'text-red-700'}>
                                    Folio {nuevoLibro.folioFactura || datosFactura?.folio ? '✓' : '✗'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div
                                    className={`h-3 w-3 rounded-full ${nuevoLibro.fechaFactura || datosFactura?.fecha ? 'bg-green-500' : 'bg-red-500'}`}
                                />
                                <span className={nuevoLibro.fechaFactura || datosFactura?.fecha ? 'text-green-700' : 'text-red-700'}>
                                    Fecha {nuevoLibro.fechaFactura || datosFactura?.fecha ? '✓' : '✗'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div
                                    className={`h-3 w-3 rounded-full ${nuevoLibro.editorial_nombre || datosFactura?.editorial ? 'bg-green-500' : 'bg-red-500'}`}
                                />
                                <span className={nuevoLibro.editorial_nombre || datosFactura?.editorial ? 'text-green-700' : 'text-red-700'}>
                                    Proveedor {nuevoLibro.editorial_nombre || datosFactura?.editorial ? '✓' : '✗'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div
                                    className={`h-3 w-3 rounded-full ${nuevoLibro.rfcProveedor || datosFactura?.rfc ? 'bg-green-500' : 'bg-red-500'}`}
                                />
                                <span className={nuevoLibro.rfcProveedor || datosFactura?.rfc ? 'text-green-700' : 'text-red-700'}>
                                    RFC {nuevoLibro.rfcProveedor || datosFactura?.rfc ? '✓' : '✗'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div
                                    className={`h-3 w-3 rounded-full ${nuevoLibro.uuidFactura || datosFactura?.uuid ? 'bg-green-500' : 'bg-red-500'}`}
                                />
                                <span className={nuevoLibro.uuidFactura || datosFactura?.uuid ? 'text-green-700' : 'text-red-700'}>
                                    UUID {nuevoLibro.uuidFactura || datosFactura?.uuid ? '✓' : '✗'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {!puedeConfirmarFactura && (
                        <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="mt-0.5 h-4 w-4 text-orange-600" />
                                <div>
                                    <p className="text-sm font-medium text-orange-800">Complete todos los campos</p>
                                    <p className="mt-1 text-xs text-orange-700">
                                        Complete toda la información requerida y haga clic en "Confirmar Factura" para continuar agregando libros.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* ✅ RESUMEN CUANDO ESTÁ CONFIRMADA */
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                        <div>
                            <span className="font-medium text-green-800">Factura:</span>
                            <span className="ml-2 text-green-900">
                                {datosFactura?.serie || nuevoLibro.serieFactura}
                                {datosFactura?.folio || nuevoLibro.folioFactura}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium text-green-800">Fecha:</span>
                            <span className="ml-2 text-green-900">{datosFactura?.fecha || nuevoLibro.fechaFactura}</span>
                        </div>
                        <div>
                            <span className="font-medium text-green-800">Proveedor:</span>
                            <span className="ml-2 text-green-900">{datosFactura?.editorial || nuevoLibro.editorial_nombre}</span>
                        </div>
                        <div>
                            <span className="font-medium text-green-800">RFC:</span>
                            <span className="ml-2 font-mono text-green-900">{datosFactura?.rfc || nuevoLibro.rfcProveedor}</span>
                        </div>
                        <div className="md:col-span-2">
                            <span className="font-medium text-green-800">UUID:</span>
                            <span className="ml-2 font-mono text-xs text-green-900">{datosFactura?.uuid || nuevoLibro.uuidFactura}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// =============================================
// 📝 COMPONENTE PRINCIPAL CON AUTO-COMPLETADO
// =============================================

export const LibroManualForm: React.FC<LibroManualFormProps> = ({
    nuevoLibro,
    setNuevoLibro,
    guardando,
    onAgregarLibro,
    onBuscarISBN,
    buscandoISBNs,
    datosFactura,
    facturaConfirmada = false,
    onConfirmarFactura = () => {},
}) => {
    const [pasoActual, setPasoActual] = useState(1);
    const [pasoCompletado, setPasoCompletado] = useState<{ [key: number]: boolean }>({});

    const validarPaso = useCallback(
        (paso: number): boolean => {
            switch (paso) {
                case 1:
                    return !!(nuevoLibro.isbn && nuevoLibro.titulo);
                case 2:
                    return !!nuevoLibro.autor_nombre;
                case 3:
                    return !!(nuevoLibro.cantidad > 0 && nuevoLibro.valorUnitario >= 0);
                case 4:
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
        setNuevoLibro((prev) => ({
            ...prev,
            isbn: '',
            titulo: '',
            cantidad: 1,
            valorUnitario: 0,
            descuento: 0,
            autor_nombre: '',
            autor_apellidos: '',
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
        }));
        setPasoActual(1);
        setPasoCompletado({});
    }, [setNuevoLibro]);

    return (
        <div className="space-y-6">
            <SeccionFactura
                nuevoLibro={nuevoLibro}
                setNuevoLibro={setNuevoLibro}
                guardando={guardando}
                datosFactura={datosFactura}
                facturaConfirmada={facturaConfirmada}
                onConfirmarFactura={onConfirmarFactura}
            />

            {facturaConfirmada && (
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Agregar Libro</h3>
                        <span className="text-sm text-gray-500">Paso {pasoActual} de 4</span>
                    </div>

                    <div className="mb-8 flex items-center space-x-4">
                        {Array.from({ length: 4 }, (_, i) => i + 1).map((paso) => {
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
                                    {paso < 4 && <div className={`h-1 flex-1 rounded ${pasoCompletado[paso] ? 'bg-green-600' : 'bg-gray-200'}`} />}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    <div className="mb-8 grid grid-cols-4 gap-4 text-center text-xs text-gray-600">
                        <div className={pasoActual === 1 ? 'font-semibold text-blue-600' : ''}>Información Básica</div>
                        <div className={pasoActual === 2 ? 'font-semibold text-blue-600' : ''}>Autor</div>
                        <div className={pasoActual === 3 ? 'font-semibold text-blue-600' : ''}>Información Comercial</div>
                        <div className={pasoActual === 4 ? 'font-semibold text-blue-600' : ''}>Detalles Adicionales</div>
                    </div>
                  
                    {/* 📝 RENDERIZAR COMPONENTES DE PASOS */}
                    {pasoActual === 1 && (
                        <>
                            <p className="text-red-500">Paso 1 visible</p>
                            <PasoInformacionBasica
                                nuevoLibro={nuevoLibro}
                                setNuevoLibro={setNuevoLibro}
                                guardando={guardando}
                                onBuscarISBN={onBuscarISBN}
                                buscandoISBNs={buscandoISBNs}
                            />
                        </>
                    )}
                    {pasoActual === 2 && <PasoAutorEditorial nuevoLibro={nuevoLibro} setNuevoLibro={setNuevoLibro} guardando={guardando} />}
                    {pasoActual === 3 && <PasoInformacionComercial nuevoLibro={nuevoLibro} setNuevoLibro={setNuevoLibro} guardando={guardando} />}
                    {pasoActual === 4 && <PasoDetallesAdicionales nuevoLibro={nuevoLibro} setNuevoLibro={setNuevoLibro} guardando={guardando} />}

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
                                onClick={resetearFormulario}
                                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                                disabled={guardando}
                            >
                                <X className="h-4 w-4" />
                                Limpiar Libro
                            </button>
                        </div>

                        <div className="flex gap-3">
                            {pasoActual < 4 ? (
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
                                    onClick={onAgregarLibro}
                                    className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                                    disabled={guardando || !validarPaso(1) || !validarPaso(2) || !validarPaso(3)}
                                >
                                    <Plus className="h-4 w-4" />
                                    Agregar Libro
                                </button>
                            )}
                        </div>
                    </div>
                    
                </div>
                
            )}

            {!facturaConfirmada && (
                <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                        <AlertTriangle className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900">Confirme la Factura</h3>
                    <p className="text-sm text-gray-600">
                        Complete los datos de factura arriba y haga clic en "Confirmar Factura" para poder agregar libros.
                    </p>
                </div>
            )}
        </div>
    );
};

// =============================================
// 🧩 COMPONENTES DE PASOS OPTIMIZADOS
// =============================================

interface PasoProps {
    nuevoLibro: LibroManual;
    setNuevoLibro: React.Dispatch<React.SetStateAction<LibroManual>>;
    guardando: boolean;
    onBuscarISBN?: (isbn: string) => void;
    buscandoISBNs?: boolean;
}

const PasoInformacionBasica: React.FC<PasoProps> = ({ nuevoLibro, setNuevoLibro, guardando, onBuscarISBN, buscandoISBNs }) => (
    <div className="space-y-6">
        <div className="rounded-lg bg-gray-50 p-6">
            <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-800">
                <BookOpen className="h-5 w-5 text-gray-600" />
                Información Básica del Libro
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
                    {!nuevoLibro.isbn && <p className="mt-1 text-xs text-red-600">El ISBN es obligatorio</p>}
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
                    {!nuevoLibro.titulo && <p className="mt-1 text-xs text-red-600">El título es obligatorio</p>}
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
        </div>
    </div>
);

const PasoAutorEditorial: React.FC<PasoProps> = ({ nuevoLibro, setNuevoLibro, guardando }) => {
    const [isAutorNuevo, setIsAutorNuevo] = useState(false);

    // ✅ MEMOIZAR OPCIONES
    const autores = useMemo(() => [], []);

    // ✅ CALLBACK MEMOIZADO
    const handleAutorChange = useCallback(
        (value: string) => {
            setNuevoLibro((prev) => ({
                ...prev,
                autor_nombre: value,
            }));
        },
        [setNuevoLibro],
    );

    return (
        <div className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-6">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                    <Users className="h-5 w-5 text-gray-600" />
                    Información del Autor
                </h4>

                <div className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Autor * <span className="text-red-500">Requerido</span>
                        </label>
                        <SelectConBusqueda
                            value={nuevoLibro.autor_nombre}
                            onChange={handleAutorChange}
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

                        {!nuevoLibro.autor_nombre && <p className="mt-1 text-xs text-red-600">El autor es obligatorio</p>}
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
            </div>
        </div>
    );
};

const PasoInformacionComercial: React.FC<PasoProps> = ({ nuevoLibro, setNuevoLibro, guardando }) => {
    const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<string[]>([]);

    // ✅ MEMOIZAR OPCIONES
    const categorias = useMemo(() => [], []);

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

    // ✅ CALLBACK MEMOIZADO PARA ETIQUETAS
    const handleEtiquetaChange = useCallback(
        (value: string) => {
            if (value) {
                agregarEtiqueta(value);
            }
        },
        [agregarEtiqueta],
    );

    return (
        <div className="space-y-6">
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

                <div className="mt-6 rounded-lg bg-green-50 p-4">
                    <h5 className="text-md mb-3 flex items-center gap-2 font-medium text-gray-900">
                        <Tag className="h-4 w-4 text-gray-600" />
                        Etiquetas/Categorías
                    </h5>

                    <div className="mb-3">
                        <SelectConBusqueda
                            value=""
                            onChange={handleEtiquetaChange}
                            options={categorias}
                            placeholder="Seleccionar etiqueta"
                            disabled={guardando}
                            apiEndpoint="/admin/api/etiquetas"
                            maxOptions={15}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {etiquetasSeleccionadas.map((etiqueta, index) => (
                            <span key={index} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                                {etiqueta}
                                {!guardando && (
                                    <button
                                        onClick={() => quitarEtiqueta(etiqueta)}
                                        className="ml-1 text-blue-500 hover:text-red-600"
                                        title={`Quitar ${etiqueta}`}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </span>
                        ))}
                        {etiquetasSeleccionadas.length === 0 && (
                            <span className="text-sm text-gray-500 italic">Sin etiquetas. Agregue al menos una para categorizar el libro.</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PasoDetallesAdicionales: React.FC<PasoProps> = ({ nuevoLibro, setNuevoLibro, guardando }) => (
    <div className="space-y-6">
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
                                    onClick={() => setNuevoLibro((prev: LibroManual) => ({ ...prev, imagen_url: '' }))}
                                    className="absolute top-2 right-2 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                                    disabled={guardando}
                                    title="Quitar imagen"
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

        <div className="rounded-lg bg-purple-50 p-6">
            <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                <Package className="h-5 w-5 text-gray-600" />
                Información Adicional (Opcional)
            </h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Descripción</label>
                    <textarea
                        value={nuevoLibro.descripcion}
                        onChange={(e) => setNuevoLibro((prev) => ({ ...prev, descripcion: e.target.value }))}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        placeholder="Descripción del libro, sinopsis..."
                        disabled={guardando}
                    />
                </div>

                <div className="space-y-4">
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
                            onChange={(e) =>
                                setNuevoLibro((prev) => ({ ...prev, estado_fisico: e.target.value as 'nuevo' | 'usado' | 'renovado' | 'dañado' }))
                            }
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
            </div>
        </div>
    </div>
);
