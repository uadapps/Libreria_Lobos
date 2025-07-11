// ============================================
// 📁 pages/libros-facturas/index.tsx - SIN DUPLICADOS
// ============================================
import { Button } from '@headlessui/react';
import { Head } from '@inertiajs/react';
import { BarChart3, Loader, Plus, Save, Trash2, File, Receipt } from 'lucide-react';
import { useCallback, useMemo } from 'react';
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
    EstadisticasAvanzadas,
    EstadisticasBusqueda,
    ProgresoBusqueda,
    ResultadoGuardado,
} from '@/components/inventario_libros/libros-facturas/LibrosFacturasComponents';
import LibroDetallesModal from '@/components/libros/LibroDetailsModal';
import VistaLibros from '@/components/libros/VistaLibros';

export default function LibrosFacturas() {
    const {
        libros,
        setLibros,
        modoAgregar,
        setModoAgregar,
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
        mostrarEstadisticasAvanzadas,
        setMostrarEstadisticasAvanzadas,
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
    } = useLibrosFacturas();
    
    // ✅ HOOK COMPLETO PARA MANEJAR FORMULARIO MANUAL
    const { 
        nuevoLibro, 
        setNuevoLibro, 
        pasoActual,
        setPasoActual,
        pasoCompletado,
        setPasoCompletado,
        etiquetasSeleccionadas,
        setEtiquetasSeleccionadas,
        isEditorialNueva,
        setIsEditorialNueva,
        isAutorNuevo,
        setIsAutorNuevo,
        isGeneroNuevo,
        setIsGeneroNuevo,
        validarPaso,
        avanzarPaso,
        retrocederPaso,
        irAPaso,
        agregarLibroManual, 
        buscarPorISBNManual,
        resetearFormulario,
        resetearSoloLibro,
        resetearCompleto, // ✅ NUEVA función para cambio de factura
        prellenarDatosDesdeFactura,
    } = useLibroManual(setLibros, datosFactura, setBuscandoISBNs);

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

    // ✅ FUNCIÓN PARA CAMBIAR FACTURA CON RESETEO COMPLETO
    const handleCambiarFactura = useCallback(() => {
        // Si hay libros, pedir confirmación
        if (libros.length > 0) {
            if (!confirm(`¿Está seguro de que desea cambiar la factura? Se perderán ${libros.length} libro(s) en la lista actual.`)) {
                return;
            }
        }
        
        // ✅ LLAMAR AL HOOK para limpiar factura (ya maneja el toast)
        limpiarFactura();
        
        // ✅ LIMPIAR ESTADOS ADICIONALES SIN TOAST
        setDatosFactura(null);
        setArchivoXML(null);
        setLibros([]);
        setModoAgregar('factura');
        
        // ✅ RESETEAR FORMULARIO MANUAL COMPLETAMENTE
        resetearCompleto();
        
        // ❌ NO agregar toast aquí - ya lo maneja limpiarFactura()
    }, [libros.length, limpiarFactura, setDatosFactura, setArchivoXML, setLibros, setModoAgregar, resetearCompleto]);

    // ✅ FUNCIÓN LIMPIAR TODO SIN DUPLICADO  
    const handleLimpiarTodo = useCallback(() => {
        if (confirm('¿Está seguro de que desea limpiar todo? Se perderán todos los libros y la configuración de factura.')) {
            // ✅ USAR LA FUNCIÓN DEL HOOK que ya maneja el toast
            limpiarTodo();
        }
    }, [limpiarTodo]);

    // ✅ VERIFICAR SI HAY FACTURA CONFIGURADA
    const tieneFacturaConfigurada = () => {
        return !!(datosFactura || (
            nuevoLibro.serieFactura && 
            nuevoLibro.folioFactura && 
            nuevoLibro.fechaFactura && 
            nuevoLibro.editorial_nombre
        ));
    };

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
                            {!tieneFacturaConfigurada() 
                                ? 'Procese una factura para comenzar a agregar libros al inventario'
                                : 'Agregue libros a la factura configurada'
                            }
                        </p>
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
                                    onClick={handleLimpiarTodo}
                                    className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-white transition-colors hover:bg-red-700"
                                    disabled={guardando}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Limpiar Todo
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* =============================================
        // 📄 INFORMACIÓN DE FACTURA PROCESADA
        // ============================================= */}
                {datosFactura && <InfoFacturaProcesada datosFactura={datosFactura} onLimpiar={limpiarFactura} />}

                {/* =============================================
        // 📊 ESTADÍSTICAS AVANZADAS
        // ============================================= */}
                {mostrarEstadisticasAvanzadas && libros.length > 0 && <EstadisticasAvanzadas estadisticas={estadisticas} />}

                {/* =============================================
        // 🔄 INDICADORES DE PROGRESO
        // ============================================= */}
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

                {estadisticasBusqueda && <EstadisticasBusqueda estadisticas={estadisticasBusqueda} />}

                {progresoBusqueda && <ProgresoBusqueda progreso={progresoBusqueda} />}

                {/* =============================================
        // 📝 FLUJO PRINCIPAL - FACTURA PRIMERO
        // ============================================= */}
                
                {!tieneFacturaConfigurada() ? (
                    /* ✅ FASE 1: CONFIGURAR FACTURA */
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

                        {/* Modo Factura XML */}
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

                        {/* Modo Factura Manual */}
                        {modoAgregar === 'manual' && (
                            <LibroManualForm
                                nuevoLibro={nuevoLibro}
                                setNuevoLibro={setNuevoLibro}
                                guardando={guardando}
                                onAgregarLibro={agregarLibroManual}
                                onBuscarISBN={handleBuscarISBN}
                                buscandoISBNs={buscandoISBNs}
                                datosFactura={datosFactura}
                            />
                        )}
                    </div>
                ) : (
                    /* ✅ FASE 2: AGREGAR LIBROS A FACTURA EXISTENTE */
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Agregar Libros a la Factura</h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Agregue libros individuales a la factura configurada
                                </p>
                            </div>
                            <button
                                onClick={handleCambiarFactura}
                                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                                disabled={guardando}
                            >
                                <Receipt className="h-4 w-4" />
                                Cambiar Factura
                            </button>
                        </div>

                        <LibroManualForm
                            nuevoLibro={nuevoLibro}
                            setNuevoLibro={setNuevoLibro}
                            guardando={guardando}
                            onAgregarLibro={agregarLibroManual}
                            onBuscarISBN={handleBuscarISBN}
                            buscandoISBNs={buscandoISBNs}
                            datosFactura={datosFactura}
                        />
                    </div>
                )}

                {/* =============================================
        // 📚 VISTA DE LIBROS
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
            
            {/* ✅ UN SOLO TOAST CONTAINER */}
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
                limit={3} // ✅ Limitar a máximo 3 toasts
            />
        </AppLayout>
    );
}