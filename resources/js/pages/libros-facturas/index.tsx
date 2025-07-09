// ============================================
// 📁 pages/libros-facturas/index.tsx - ÍNDICE PRINCIPAL REFACTORIZADO
// ============================================
import { Button } from '@headlessui/react';
import { Head } from '@inertiajs/react';
import { BarChart3, File, Loader, Plus, Save, Trash2 } from 'lucide-react';
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

       const stableSetLibros = useCallback((libros) => setLibros(libros), []);
    const stableSetBuscandoISBNs = useCallback((value) => setBuscandoISBNs(value), []);

    // 🔧 CAMBIAR ESTA LÍNEA:
    const { nuevoLibro, setNuevoLibro, agregarLibroManual, buscarPorISBNManual } = useLibroManual(
        stableSetLibros, 
        datosFactura, 
        stableSetBuscandoISBNs
    );
 /*    // 🔧 AGREGAR:
    const stableSetLibros = useCallback((libros) => setLibros(libros), []);
    const stableSetBuscandoISBNs = useCallback((value) => setBuscandoISBNs(value), []);
 */
    // 🔧 CAMBIAR:
   /*  const { nuevoLibro, setNuevoLibro, agregarLibroManual, buscarPorISBNManual } = useLibroManual(
        stableSetLibros,
        datosFactura,
        stableSetBuscandoISBNs,
    ); */
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

    // =============================================
    // 📊 BREADCRUMBS
    // =============================================
    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Inventarios', href: '/libros-factura' },
            { title: 'Agregar Libros', href: '/libros-factura' },
        ],
        [],
    );

    // =============================================
    // 🎨 RENDER
    // =============================================
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Agregar Libros - Sistema Inteligente" />

            <div className="space-y-6 px-6 py-4">
                {/* =============================================
        // 📝 HEADER CON CONTROLES
        // ============================================= */}
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
                                    onClick={limpiarTodo}
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
        // 📝 SELECTOR DE MODO Y FORMULARIOS
        // ============================================= */}
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
                            <File size={18} />
                            Desde Factura XML
                        </button>
                        <button
                            onClick={() => setModoAgregar('manual')}
                            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                                modoAgregar === 'manual'
                                    ? 'border-2 border-green-300 bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            disabled={guardando}
                        >
                            <Plus size={18} />
                            Manual
                        </button>
                    </div>

                    {/* Modo Manual */}
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
                </div>

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
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />
        </AppLayout>
    );
}
