// ============================================
// 📁 src/components/libros/VistaLibros.tsx - CON DESCUENTO Y TOTAL MEJORADOS
// ============================================

import { AlertCircle, CheckCircle, Edit3, Eye, Grid3X3, Loader, Percent, Search, SortAsc, SortDesc, Table, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { DatabaseSearchService } from '../../services/ISBN/DatabaseSearchService';
import { LibroCompleto } from '../../types/LibroCompleto';
import { LibrosGrid } from './LibroCardComponent';
import LibroEditModal from './LibroEditModal';

interface VistaLibrosProps {
    libros: LibroCompleto[];
    editando: string | null;
    onVerDetalles: (libro: LibroCompleto) => void;
    onEditar: (id: string) => void;
    onEliminar: (id: string) => void;
    onGuardarEdicion: (id: string, libroEditado: Partial<LibroCompleto>) => void;
    // Props adicionales para el modal - adaptadas a tu BD
    editoriales?: any[];
    categorias?: any[];
}

type TipoVista = 'tabla' | 'tarjetas';
type OrdenPor = 'titulo' | 'autor' | 'editorial' | 'total' | 'cantidad' | 'descuento';
type DireccionOrden = 'asc' | 'desc';

const VistaLibros: React.FC<VistaLibrosProps> = ({
    libros,
    editando,
    onVerDetalles,
    onEditar,
    onEliminar,
    onGuardarEdicion,
    editoriales = [],
    categorias = [],
}) => {
    const [vista, setVista] = useState<TipoVista>('tabla');
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<'todos' | 'procesado' | 'error'>('todos');
    const [ordenPor, setOrdenPor] = useState<OrdenPor>('titulo');
    const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>('asc');

    // Estados para el modal de edición
    const [libroEditando, setLibroEditando] = useState<LibroCompleto | null>(null);
    const [modalEditAbierto, setModalEditAbierto] = useState(false);

    // ✅ FUNCIÓN HELPER PARA OBTENER TEXTO SEGURO
    const obtenerTextoSeguro = (texto: string | undefined | null, valorPorDefecto = ''): string => {
        return (texto || valorPorDefecto).toString();
    };

    // ✅ FUNCIÓN HELPER PARA OBTENER AUTOR COMPLETO
    const obtenerAutorCompleto = (libro: LibroCompleto): string => {
        const nombre = obtenerTextoSeguro(libro.autor?.nombre, 'Autor');
        const apellidos = obtenerTextoSeguro(libro.autor?.apellidos, '');
        return `${nombre} ${apellidos}`.trim();
    };

    // ✅ FUNCIÓN HELPER PARA CALCULAR SUBTOTAL Y TOTALES
    const calcularMontos = (libro: LibroCompleto) => {
        const cantidad = libro.cantidad || 0;
        const valorUnitario = libro.valorUnitario || 0;
        const descuento = libro.descuento || 0;

        const subtotal = cantidad * valorUnitario;
        const total = subtotal - descuento;

        return {
            subtotal,
            descuento,
            total,
            tieneDescuento: descuento > 0,
        };
    };

    // ✅ FUNCIONES DEL MODAL DE EDICIÓN
    const abrirModalEdicion = (libro: LibroCompleto) => {
        setLibroEditando(libro);
        setModalEditAbierto(true);
    };

    const cerrarModalEdicion = () => {
        setModalEditAbierto(false);
        setLibroEditando(null);
    };

    const guardarCambiosModal = (id: string, libroEditado: Partial<LibroCompleto>) => {
        onGuardarEdicion(id, libroEditado);
        cerrarModalEdicion();

        toast.success('Libro actualizado correctamente', {
            position: 'top-center',
            autoClose: 3000,
            theme: 'colored',
        });
    };

    const handleEditar = (id: string) => {
        const libro = libros.find((l) => l.id === id);
        if (libro) {
            abrirModalEdicion(libro);
        }
    };

    const buscarPorISBN = async (isbn: string): Promise<LibroCompleto | null> => {
        try {
            const resultado = await DatabaseSearchService.buscarPorISBN(isbn, { debug: true });
            if (resultado) {
                toast.success(`Información encontrada para ISBN: ${isbn}`, {
                    position: 'top-center',
                    autoClose: 3000,
                    theme: 'colored',
                });
                return resultado;
            } else {
                toast.warning(`No se encontró información para ISBN: ${isbn}`, {
                    position: 'top-center',
                    autoClose: 3000,
                    theme: 'colored',
                });
                return null;
            }
        } catch (error) {
            toast.error('Error buscando información del ISBN', {
                position: 'top-center',
                autoClose: 3000,
                theme: 'colored',
            });
            return null;
        }
    };

    // Filtrar libros con validaciones mejoradas
    const librosFiltrados = React.useMemo(() => {
        let resultado = libros.filter((libro) => {
            // ✅ VALIDACIONES SEGURAS PARA EVITAR ERRORES
            const textoBusqueda = busqueda.toLowerCase();

            const titulo = obtenerTextoSeguro(libro.titulo, 'Título no disponible').toLowerCase();
            const isbn = obtenerTextoSeguro(libro.isbn, '').toLowerCase();
            const autor = obtenerAutorCompleto(libro).toLowerCase();
            const editorial = obtenerTextoSeguro(libro.editorial?.nombre, 'Editorial desconocida').toLowerCase();

            // Filtro por búsqueda
            const coincideBusqueda =
                titulo.includes(textoBusqueda) || isbn.includes(textoBusqueda) || autor.includes(textoBusqueda) || editorial.includes(textoBusqueda);

            // Filtro por estado
            const coincideEstado = filtroEstado === 'todos' || libro.estado === filtroEstado;

            return coincideBusqueda && coincideEstado;
        });

        // ✅ ORDENAR CON VALIDACIONES SEGURAS
        resultado.sort((a, b) => {
            let valorA: any, valorB: any;

            switch (ordenPor) {
                case 'titulo':
                    valorA = obtenerTextoSeguro(a.titulo, 'Título no disponible').toLowerCase();
                    valorB = obtenerTextoSeguro(b.titulo, 'Título no disponible').toLowerCase();
                    break;
                case 'autor':
                    valorA = obtenerAutorCompleto(a).toLowerCase();
                    valorB = obtenerAutorCompleto(b).toLowerCase();
                    break;
                case 'editorial':
                    valorA = obtenerTextoSeguro(a.editorial?.nombre, 'Editorial desconocida').toLowerCase();
                    valorB = obtenerTextoSeguro(b.editorial?.nombre, 'Editorial desconocida').toLowerCase();
                    break;
                case 'total':
                    valorA = a.total || 0;
                    valorB = b.total || 0;
                    break;
                case 'cantidad':
                    valorA = a.cantidad || 0;
                    valorB = b.cantidad || 0;
                    break;
                case 'descuento':
                    valorA = a.descuento || 0;
                    valorB = b.descuento || 0;
                    break;
                default:
                    return 0;
            }

            if (direccionOrden === 'asc') {
                return valorA < valorB ? -1 : valorA > valorB ? 1 : 0;
            } else {
                return valorA > valorB ? -1 : valorA < valorB ? 1 : 0;
            }
        });

        return resultado;
    }, [libros, busqueda, obtenerAutorCompleto, filtroEstado, ordenPor, direccionOrden]);

    const cambiarOrden = (nuevoOrden: OrdenPor) => {
        if (ordenPor === nuevoOrden) {
            setDireccionOrden(direccionOrden === 'asc' ? 'desc' : 'asc');
        } else {
            setOrdenPor(nuevoOrden);
            setDireccionOrden('asc');
        }
    };

    // ✅ ESTADÍSTICAS CON VALIDACIONES SEGURAS Y DESCUENTOS
    const estadisticas = React.useMemo(() => {
        const descuentoTotal = libros.reduce((sum, l) => sum + (l.descuento || 0), 0);
        const subtotalGeneral = libros.reduce((sum, l) => {
            const cantidad = l.cantidad || 0;
            const valorUnitario = l.valorUnitario || 0;
            return sum + cantidad * valorUnitario;
        }, 0);

        return {
            total: libros.length,
            procesados: libros.filter((l) => l.estado === 'procesado').length,
            errores: libros.filter((l) => l.estado === 'error').length,
            valorTotal: libros.reduce((sum, l) => sum + (l.total || 0), 0),
            cantidadTotal: libros.reduce((sum, l) => sum + (l.cantidad || 0), 0),
            descuentoTotal,
            subtotalGeneral,
            librosConDescuento: libros.filter((l) => (l.descuento || 0) > 0).length,
        };
    }, [libros]);

    if (libros.length === 0) return null;

    return (
        <>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {/* Header con controles */}
                <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Libros Agregados ({librosFiltrados.length})</h2>
                            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                                    {estadisticas.procesados} procesados
                                </span>
                                {estadisticas.errores > 0 && (
                                    <span className="flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                                        {estadisticas.errores} errores
                                    </span>
                                )}
                                <span>{estadisticas.cantidadTotal} unidades</span>
                                {estadisticas.descuentoTotal > 0 && (
                                    <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                        <Percent className="h-4 w-4" />${estadisticas.descuentoTotal.toFixed(2)} desc.
                                    </span>
                                )}
                                <span className="font-medium text-green-600 dark:text-green-400">${estadisticas.valorTotal.toFixed(2)} total</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Búsqueda */}
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400 dark:text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar libros..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                                />
                            </div>

                            {/* Filtro por estado */}
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value as any)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                            >
                                <option value="todos">Todos</option>
                                <option value="procesado">Procesados</option>
                                <option value="error">Con errores</option>
                            </select>

                            {/* Selector de vista */}
                            <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
                                <button
                                    onClick={() => setVista('tabla')}
                                    className={`rounded-md p-2 transition-colors ${
                                        vista === 'tabla'
                                            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-gray-100'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600/50 dark:hover:text-gray-200'
                                    }`}
                                    title="Vista de tabla"
                                >
                                    <Table className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setVista('tarjetas')}
                                    className={`rounded-md p-2 transition-colors ${
                                        vista === 'tarjetas'
                                            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-gray-100'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600/50 dark:hover:text-gray-200'
                                    }`}
                                    title="Vista de tarjetas"
                                >
                                    <Grid3X3 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                    {vista === 'tabla' ? (
                        /* Vista de Tabla MEJORADA CON DESCUENTO */
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left">
                                            <button
                                                onClick={() => cambiarOrden('titulo')}
                                                className="flex items-center gap-2 text-xs font-medium tracking-wider text-gray-500 uppercase hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                            >
                                                Libro
                                                {ordenPor === 'titulo' &&
                                                    (direccionOrden === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />)}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            <button
                                                onClick={() => cambiarOrden('autor')}
                                                className="flex items-center gap-2 text-xs font-medium tracking-wider text-gray-500 uppercase hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                            >
                                                Autor / Editorial
                                                {ordenPor === 'autor' &&
                                                    (direccionOrden === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />)}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            <button
                                                onClick={() => cambiarOrden('cantidad')}
                                                className="flex items-center gap-2 text-xs font-medium tracking-wider text-gray-500 uppercase hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                            >
                                                Cantidad
                                                {ordenPor === 'cantidad' &&
                                                    (direccionOrden === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />)}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Precio Unit.
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            <button
                                                onClick={() => cambiarOrden('descuento')}
                                                className="flex items-center gap-2 text-xs font-medium tracking-wider text-gray-500 uppercase hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                            >
                                                Descuento
                                                {ordenPor === 'descuento' &&
                                                    (direccionOrden === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />)}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            <button
                                                onClick={() => cambiarOrden('total')}
                                                className="flex items-center gap-2 text-xs font-medium tracking-wider text-gray-500 uppercase hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                            >
                                                Total
                                                {ordenPor === 'total' &&
                                                    (direccionOrden === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />)}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                    {librosFiltrados.map((libro) => {
                                        const montos = calcularMontos(libro);

                                        return (
                                            <tr key={libro.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            <button
                                                                onClick={() => onVerDetalles(libro)}
                                                                className="text-left text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                                            >
                                                                {obtenerTextoSeguro(libro.titulo, 'Título no disponible')}
                                                            </button>
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            ISBN: {obtenerTextoSeguro(libro.isbn, 'Sin ISBN')}
                                                        </div>
                                                        <div className="text-xs text-blue-600 dark:text-blue-400">
                                                            {obtenerTextoSeguro(libro.genero?.nombre, 'General')} •{' '}
                                                            {libro.año || libro.añoPublicacion || 'Año no disponible'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 dark:text-white">{obtenerAutorCompleto(libro)}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {obtenerTextoSeguro(libro.editorial?.nombre, 'Editorial desconocida')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{libro.cantidad || 0}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                    ${(libro.valorUnitario || 0).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {montos.tieneDescuento ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                                                -${montos.descuento.toFixed(2)}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                de ${montos.subtotal.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                            ${montos.total.toFixed(2)}
                                                        </span>
                                                        {montos.tieneDescuento && (
                                                            <span className="text-xs text-green-600 dark:text-green-400">
                                                                ¡Ahorro: ${montos.descuento.toFixed(2)}!
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {libro.estado === 'procesado' ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Procesado
                                                        </span>
                                                    ) : libro.estado === 'error' ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                            <AlertCircle className="h-3 w-3" />
                                                            Error
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                            <Loader className="h-3 w-3 animate-spin" />
                                                            Buscando
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => onVerDetalles(libro)}
                                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                            title="Ver detalles"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditar(libro.id)}
                                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                            title="Editar"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => onEliminar(libro.id)}
                                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* Vista de Tarjetas */
                        <LibrosGrid
                            libros={librosFiltrados}
                            onVerDetalles={onVerDetalles}
                            onEditar={handleEditar}
                            onEliminar={onEliminar}
                            editando={editando}
                        />
                    )}

                    {librosFiltrados.length === 0 && libros.length > 0 && (
                        <div className="py-12 text-center">
                            <Search className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
                            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">No se encontraron libros</h3>
                            <p className="text-gray-500 dark:text-gray-400">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                    )}

                    {/* NUEVO: Resumen de totales con descuentos */}
                    {librosFiltrados.length > 0 && (
                        <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
                            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                                <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                                    <div className="font-medium text-blue-600 dark:text-blue-400">Subtotal</div>
                                    <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                                        ${estadisticas.subtotalGeneral.toFixed(2)}
                                    </div>
                                </div>
                                {estadisticas.descuentoTotal > 0 && (
                                    <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
                                        <div className="font-medium text-orange-600 dark:text-orange-400">Descuentos</div>
                                        <div className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                                            -${estadisticas.descuentoTotal.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-orange-500 dark:text-orange-400">{estadisticas.librosConDescuento} libros</div>
                                    </div>
                                )}
                                <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                                    <div className="font-medium text-green-600 dark:text-green-400">Total Final</div>
                                    <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                                        ${estadisticas.valorTotal.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-green-500 dark:text-green-400">{estadisticas.cantidadTotal} unidades</div>
                                </div>
                                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                                    <div className="font-medium text-gray-600 dark:text-gray-400">Ahorro Total</div>
                                    <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                        {estadisticas.descuentoTotal > 0 ? (
                                            <span className="text-green-600 dark:text-green-400">${estadisticas.descuentoTotal.toFixed(2)}</span>
                                        ) : (
                                            <span className="text-gray-400">$0.00</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {estadisticas.descuentoTotal > 0
                                            ? `${((estadisticas.descuentoTotal / estadisticas.subtotalGeneral) * 100).toFixed(1)}% desc.`
                                            : 'Sin descuentos'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Edición */}
            <LibroEditModal
                libro={libroEditando}
                isOpen={modalEditAbierto}
                onClose={cerrarModalEdicion}
                onSave={guardarCambiosModal}
                onBuscarISBN={buscarPorISBN}
                readonly={false}
                editoriales={editoriales}
                categorias={categorias}
            />
        </>
    );
};

export default VistaLibros;
