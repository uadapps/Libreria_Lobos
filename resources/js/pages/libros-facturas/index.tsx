// ============================================
// 📁 pages/libros-facturas/index.tsx - SOLUCIÓN SIMPLE Y FUNCIONAL
// ============================================
import { Button } from '@headlessui/react';
import { Head } from '@inertiajs/react';
import { File, Loader, Receipt, Save, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

import { useFacturaXMLProcessor } from '@/components/inventario_libros/libros-facturas/FacturaXMLComponents';
import { useEnriquecimientoBD } from '@/hooks/Books/useEnriquecimientoBD';
import { useLibroManual } from '@/hooks/Books/useLibroManual';
import { useLibrosFacturas } from '@/hooks/Books/useLibrosFacturas';

import { FacturaXMLUploader, InfoFacturaProcesada } from '@/components/inventario_libros/libros-facturas/FacturaXMLComponents';
import { LibroManualForm } from '@/components/inventario_libros/libros-facturas/LibroManualComponents';
import {
    EstadisticasBusqueda,
    ProgresoBusqueda,
    ResultadoGuardado,
} from '@/components/inventario_libros/libros-facturas/LibrosFacturasComponents';
import LibroDetallesModal from '@/components/libros/LibroDetailsModal';
import VistaLibros from '@/components/libros/VistaLibros';

export default function LibrosFacturas() {
    // ✅ ESTADOS PRINCIPALES
    const [facturaConfirmada, setFacturaConfirmada] = useState(false);
    const [modoAgregar, setModoAgregar] = useState<'manual' | 'factura'>('factura');

    // ✅ REF PARA FUNCIÓN DE RESETEO (evita problemas de inicialización)
    const resetearCompletoRef = useRef<(() => void) | null>(null);

    // ✅ FUNCIÓN PARA LIMPIEZA COMPLETA Y AUTO-REINICIO
    const ejecutarLimpiezaCompleta = useCallback((mostrarToast: boolean = false) => {
        console.log('🔄 === EJECUTANDO LIMPIEZA COMPLETA ===', { mostrarToast });

        try {
            // 1. Resetear estado de factura confirmada
            setFacturaConfirmada(false);

            // 2. Volver al modo de selección inicial
            setModoAgregar('factura');

            // 3. ✅ LIMPIAR FORMULARIO MANUAL (usando ref)
            if (resetearCompletoRef.current) {
                resetearCompletoRef.current();
                console.log('✅ Formulario manual reseteado');
            }

            console.log('✅ Limpieza completa del componente exitosa');

            // ✅ TOAST SOLO SI SE SOLICITA (para limpieza manual)
            if (mostrarToast) {
                toast.success('🔄 Todo limpiado. Puede empezar de nuevo con una nueva factura.', {
                    position: 'top-center',
                    autoClose: 3000,
                    theme: 'colored',
                    toastId: 'limpiar-todo-completo'
                });
            }

        } catch (error) {
            console.error('💥 Error durante la limpieza:', error);
            if (mostrarToast) {
                toast.error('❌ Error al limpiar. Intente nuevamente.', {
                    position: 'top-center',
                    autoClose: 3000,
                    theme: 'colored',
                });
            }
        }
    }, []);

    // ✅ HOOKS PRINCIPALES
    const {
        libros,
        setLibros,
        editando,
        setEditando,
        archivoXML,
        setArchivoXML,
        datosFactura,
        setDatosFactura,
        progresoBusqueda,
        setProgresoBusqueda,
        buscandoISBNs,
        setBuscandoISBNs,
        guardando,
        libroSeleccionado,
        modalDetallesAbierto,
        resultadoGuardado,
        estadisticasPostGuardado,
        estadisticasBusqueda,
        setEstadisticasBusqueda,
        estadisticas,
        eliminarLibro,
        guardarEdicion,
        abrirModalDetalles,
        cerrarModalDetalles,
        editarLibroDesdeModal,
        eliminarLibroDesdeModal,
        limpiarFactura,
        limpiarTodo,
        cerrarResultadoGuardado,
        guardarLibrosEnInventario,
    } = useLibrosFacturas(ejecutarLimpiezaCompleta); // ✅ PASAR FUNCIÓN DE REINICIO

    // ✅ HOOK MANUAL
    const { nuevoLibro, setNuevoLibro, agregarLibroManual, buscarPorISBNManual, resetearCompleto } = useLibroManual(
        setLibros,
        datosFactura,
        setBuscandoISBNs,
    );

    // ✅ ASIGNAR FUNCIÓN DE RESETEO AL REF
    resetearCompletoRef.current = resetearCompleto;

    const { procesarFacturaXML } = useFacturaXMLProcessor();
    const { enriquecerLibrosConBaseDatos } = useEnriquecimientoBD(setLibros, setProgresoBusqueda, setEstadisticasBusqueda);

    const handleProcesarFactura = useCallback(
        async (archivo: File) => {
            try {
                await procesarFacturaXML(
                    archivo,
                    setBuscandoISBNs,
                    setProgresoBusqueda,
                    setDatosFactura,
                    setEstadisticasBusqueda,
                    enriquecerLibrosConBaseDatos,
                    setArchivoXML,
                );
                // ✅ Auto-confirmar cuando se procesa XML exitosamente
                setFacturaConfirmada(true);
                toast.success('✅ Factura XML procesada y confirmada automáticamente', {
                    position: 'top-center',
                    autoClose: 3000,
                    theme: 'colored',
                });
            } catch (error) {
                const errorMessage =
                    typeof error === 'object' && error !== null && 'message' in error ? (error as { message?: string }).message : undefined;
                toast.error(errorMessage || 'Error al procesar el archivo XML. Verifique que sea una factura CFDI válida.', {
                    position: 'top-center',
                    autoClose: 7000,
                    theme: 'colored',
                    toastId: 'error-procesar-xml',
                });
            }
        },
        [
            procesarFacturaXML,
            setBuscandoISBNs,
            setProgresoBusqueda,
            setDatosFactura,
            setEstadisticasBusqueda,
            enriquecerLibrosConBaseDatos,
            setArchivoXML,
        ],
    );

    const handleBuscarISBN = useCallback(
        async (isbn: string) => {
            try {
                await buscarPorISBNManual(isbn);
            } catch (error) {
                console.error('Error buscando ISBN:', error);
            }
        },
        [buscarPorISBNManual],
    );

    // ✅ FUNCIÓN LIMPIAR TODO MANUAL - UNA SOLA CONFIRMACIÓN
    const handleLimpiarTodo = useCallback(() => {
        console.log('🗑️ === INICIANDO LIMPIAR TODO MANUAL ===');
        console.log('📊 Estado actual:', {
            libros: libros.length,
            facturaConfirmada,
            datosFactura: !!datosFactura,
            archivoXML: !!archivoXML
        });

        // ✅ MOSTRAR CONFIRMACIÓN SOLO SI HAY DATOS QUE PERDER
        if (libros.length > 0 || facturaConfirmada || datosFactura) {
            const confirmar = confirm(
                `¿Está seguro de que desea limpiar todo y empezar de nuevo?\n\n` +
                `Se perderán:\n` +
                `• ${libros.length} libro(s) en la lista\n` +
                `• La configuración de factura actual\n` +
                `• Todas las estadísticas y progreso\n\n` +
                `Esta acción no se puede deshacer.`
            );

            if (!confirmar) {
                console.log('❌ Usuario canceló la operación');
                return;
            }
        }

        console.log('✅ Confirmación recibida - Ejecutando limpieza manual...');

        // ✅ LLAMAR A TODAS LAS FUNCIONES DE LIMPIEZA
        try {
            // 1. Limpiar hook principal (SIN confirmación ni toast adicional)
            limpiarTodo();

            // 2. Ejecutar limpieza completa CON toast (limpieza manual)
            ejecutarLimpiezaCompleta(true);

            console.log('🎉 Limpieza manual completa exitosa');

        } catch (error) {
            console.error('💥 Error durante la limpieza manual:', error);
            toast.error('❌ Error al limpiar. Intente nuevamente.', {
                position: 'top-center',
                autoClose: 3000,
                theme: 'colored',
            });
        }
    }, [libros.length, facturaConfirmada, datosFactura, archivoXML, limpiarTodo, ejecutarLimpiezaCompleta]);

    // =============================================
    // 📊 BREADCRUMBS
    // =============================================
    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Inventarios', href: '/libros-factura' },
            { title: 'Gestión de Facturas', href: '/libros-factura' },
        ],
        [],
    );

    // =============================================
    // 🎨 RENDER
    // =============================================
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Facturas - Sistema Inteligente" />

            <div className="space-y-6 px-6 py-4">
                {/* =============================================
                // 📝 HEADER CON CONTROLES
                // ============================================= */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                            Gestión de Facturas e Inventario
                            {(buscandoISBNs || guardando) && <Loader className="h-6 w-6 animate-spin text-blue-600" />}
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            {!facturaConfirmada
                                ? 'Configure una factura para comenzar a agregar libros al inventario'
                                : 'Agregue libros a la factura configurada'}
                        </p>
                    </div>

                    {/* Controles del header */}
                    <div className="flex items-center gap-3">
                        {/* ✅ Botón limpiar todo - solo si hay algo que limpiar */}
                        {(libros.length > 0 || facturaConfirmada || datosFactura) && (
                            <button
                                onClick={handleLimpiarTodo}
                                className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-white transition-colors hover:bg-red-700"
                                disabled={guardando}
                            >
                                <Trash2 className="h-4 w-4" />
                                Limpiar Todo
                            </button>
                        )}
                    </div>
                </div>

                {/* =============================================
                // 📄 INFORMACIÓN DE FACTURA PROCESADA
                // ============================================= */}
                {datosFactura && <InfoFacturaProcesada datosFactura={datosFactura} onLimpiar={limpiarFactura} />}

                {/* =============================================
                // 🔄 INDICADORES DE PROGRESO
                // ============================================= */}
                {guardando && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-center gap-3">
                            <Loader className="h-5 w-5 animate-spin text-blue-600" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-800">💾 Guardando libros en inventario...</p>
                                <p className="mt-1 text-xs text-blue-600">
                                    🔄 El sistema se reiniciará automáticamente después del guardado
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {estadisticasBusqueda && <EstadisticasBusqueda estadisticas={estadisticasBusqueda} />}
                {progresoBusqueda && <ProgresoBusqueda progreso={progresoBusqueda} />}

                {/* =============================================
                // 📝 CONFIGURACIÓN DE FACTURA - SOLO SI NO ESTÁ CONFIRMADA
                // ============================================= */}
                {!facturaConfirmada && (
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="mb-6 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                                <Receipt className="h-8 w-8 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Configurar Factura</h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Seleccione cómo desea configurar la factura para agregar libros al inventario
                            </p>
                        </div>

                        <div className="mb-6 flex justify-center gap-4">
                            <button
                                onClick={() => setModoAgregar('factura')}
                                className={`flex items-center gap-3 rounded-lg px-6 py-4 transition-colors ${
                                    modoAgregar === 'factura'
                                        ? 'border-2 border-blue-300 bg-blue-100 text-blue-700'
                                        : 'border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                                disabled={guardando}
                            >
                                <File size={24} />
                                <div className="text-left">
                                    <div className="font-medium">Procesar Factura XML</div>
                                    <div className="text-xs opacity-75">Cargar CFDI y extraer libros automáticamente</div>
                                </div>
                            </button>
                            <button
                                onClick={() => setModoAgregar('manual')}
                                className={`flex items-center gap-3 rounded-lg px-6 py-4 transition-colors ${
                                    modoAgregar === 'manual'
                                        ? 'border-2 border-green-300 bg-green-100 text-green-700'
                                        : 'border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                                disabled={guardando}
                            >
                                <Receipt size={24} />
                                <div className="text-left">
                                    <div className="font-medium">Crear Factura Manual</div>
                                    <div className="text-xs opacity-75">Configurar datos de factura manualmente</div>
                                </div>
                            </button>
                        </div>

                        {/* Contenido según el modo */}
                        {modoAgregar === 'factura' && (
                            <FacturaXMLUploader
                                archivoXML={archivoXML}
                                setArchivoXML={setArchivoXML}
                                datosFactura={datosFactura}
                                buscandoISBNs={buscandoISBNs}
                                guardando={guardando}
                                onProcesarFactura={handleProcesarFactura}
                                onLimpiarFactura={limpiarFactura}
                            />
                        )}

                        {modoAgregar === 'manual' && (
                            <LibroManualForm
                                nuevoLibro={nuevoLibro}
                                setNuevoLibro={setNuevoLibro}
                                guardando={guardando}
                                onAgregarLibro={agregarLibroManual}
                                onBuscarISBN={handleBuscarISBN}
                                buscandoISBNs={buscandoISBNs}
                                datosFactura={datosFactura}
                                // ✅ NUEVO: Props para confirmación de factura
                                facturaConfirmada={facturaConfirmada}
                                onConfirmarFactura={() => setFacturaConfirmada(true)}
                            />
                        )}
                    </div>
                )}

                {/* =============================================
                // 📚 FORMULARIO DE AGREGAR LIBROS (SOLO SI FACTURA CONFIRMADA)
                // ============================================= */}
                {facturaConfirmada && (
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        {/* Resumen de factura confirmada */}
                        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-green-800">✅ Factura Confirmada</h3>
                                    <div className="mt-1 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                                        <div>
                                            <span className="font-medium text-green-700">Factura:</span>
                                            <span className="ml-2 text-green-900">
                                                {datosFactura?.serie || nuevoLibro.serieFactura}
                                                {datosFactura?.folio || nuevoLibro.folioFactura}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-green-700">Fecha:</span>
                                            <span className="ml-2 text-green-900">
                                                {datosFactura?.fecha || nuevoLibro.fechaFactura}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-green-700">Proveedor:</span>
                                            <span className="ml-2 text-green-900">
                                                {datosFactura?.editorial || nuevoLibro.editorial_nombre}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Agregar Libros</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Agregue libros individuales a la factura configurada.
                                <span className="font-medium text-blue-600"> El sistema se reiniciará automáticamente después de guardar.</span>
                            </p>
                        </div>

                        <LibroManualForm
                            nuevoLibro={nuevoLibro}
                            setNuevoLibro={setNuevoLibro}
                            guardando={guardando}
                            onAgregarLibro={agregarLibroManual}
                            onBuscarISBN={handleBuscarISBN}
                            buscandoISBNs={buscandoISBNs}
                            datosFactura={datosFactura}
                            // ✅ Props para modo bloqueado
                            facturaConfirmada={facturaConfirmada}
                            onConfirmarFactura={() => {}} // No-op porque ya está confirmada
                        />
                    </div>
                )}

                {/* =============================================
                // 📚 LISTA DE LIBROS Y ACCIONES
                // ============================================= */}
                {libros.length > 0 && (
                    <>
                        <VistaLibros
                            libros={libros}
                            editando={editando}
                            onVerDetalles={abrirModalDetalles}
                            onEditar={(id) => setEditando(editando === id ? null : id)}
                            onEliminar={eliminarLibro}
                            onGuardarEdicion={guardarEdicion}
                        />

                        {/* Total y acciones */}
                        <div className="rounded-lg border bg-white shadow-sm">
                            <div className="border-t bg-gray-50 p-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-lg font-semibold text-gray-900">
                                        Total: {libros.length} libro(s) - ${estadisticas.valorTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </div>
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
                                {libros.length > 0 && !guardando && (
                                    <div className="mt-2 text-xs text-gray-500">
                                        💡 Tip: Después de guardar, el sistema se reiniciará automáticamente para procesar una nueva factura
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* =============================================
                // 📋 MODALES Y RESULTADOS
                // ============================================= */}
                {resultadoGuardado && (
                    <ResultadoGuardado
                        resultado={resultadoGuardado}
                        onCerrar={cerrarResultadoGuardado}
                        estadisticasPost={estadisticasPostGuardado ?? undefined}
                    />
                )}

                <LibroDetallesModal
                    libro={libroSeleccionado}
                    isOpen={modalDetallesAbierto}
                    onClose={cerrarModalDetalles}
                    onEdit={editarLibroDesdeModal}
                    onDelete={eliminarLibroDesdeModal}
                    readonly={false}
                />
            </div>

            <ToastContainer
                position="top-center"
                autoClose={3000}
                theme="colored"
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                limit={3}
            />
        </AppLayout>
    );
}
