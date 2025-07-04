// ============================================
// 📁 src/components/libros/LibroCardComponent.tsx - TAMAÑO UNIFORME Y MODO OSCURO
// ============================================

import React from 'react';
import {
  Book,
  User,
  Building,
  Calendar,
  DollarSign,
  Package,
  Edit3,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { LibroCompleto } from '../../types/LibroCompleto';

interface LibroCardProps {
  libro: LibroCompleto;
  onVerDetalles: (libro: LibroCompleto) => void;
  onEditar: (id: string) => void;
  onEliminar: (id: string) => void;
  editando: boolean;
}

const LibroCard: React.FC<LibroCardProps> = ({
  libro,
  onVerDetalles,
  onEditar,
  onEliminar,
  editando
}) => {
  // Compatibilidad de propiedades
  const imagenUrl = libro.imagenUrl || libro.imagen_url;
  const añoPublicacion = libro.añoPublicacion || libro.año;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col">
      
      {/* Header con imagen y información principal - altura fija */}
      <div className="p-4 flex-1">
        <div className="flex gap-3 h-full">
          
          {/* Imagen del libro - tamaño fijo */}
          <div className="w-16 h-20 flex-shrink-0">
            {imagenUrl ? (
              <img
                src={imagenUrl}
                alt={libro.titulo}
                className="w-full h-full object-cover rounded shadow-sm"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA2NCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2IiBzdHJva2U9IiNFNUU3RUIiLz4KPHA+dGggZD0iTTI0IDM2SDQwVjQwSDI0VjM2WiIgZmlsbD0iI0QxRDVEQiIvPgo8cGF0aCBkPSJNMjQgNDRIMzZWNDhIMjRWNDRaIiBmaWxsPSIjRDFENURCIi8+Cjwvc3ZnPgo=';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                <Book className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>

          {/* Información principal */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                {/* Título como botón clicable - altura limitada */}
                <button
                  onClick={() => onVerDetalles(libro)}
                  className="text-left w-full group"
                >
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                    {libro.titulo}
                  </h3>
                </button>
              </div>

              {/* Estado - tamaño fijo */}
              <div className="ml-2 flex-shrink-0">
                {libro.estado === 'procesado' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    OK
                  </span>
                ) : libro.estado === 'error' ? (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full cursor-help"
                    title={libro.errorMsg || 'Error no especificado'}
                  >
                    <AlertCircle className="h-3 w-3" />
                    Error
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                    <Loader className="h-3 w-3 animate-spin" />
                    Procesando...
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
                <User className="h-3 w-3 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                <span className="truncate font-medium">{libro.autor.nombre} {libro.autor.apellidos}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
                <Building className="h-3 w-3 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                <span className="truncate font-medium">{libro.editorial.nombre}</span>
              </div>

              {añoPublicacion && (
                <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
                  <Calendar className="h-3 w-3 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium">{añoPublicacion}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600 flex items-center justify-between text-sm">
          <div className="min-w-0 flex-1 mr-2">
            <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">ISBN:</span>
            <span className="ml-1 font-mono text-gray-900 dark:text-gray-100 text-xs truncate block font-medium">{libro.isbn}</span>
          </div>
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200 rounded text-xs font-medium flex-shrink-0">
            {libro.genero.nombre}
          </span>
        </div>
      </div>
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <span className="font-bold text-gray-900 dark:text-white">{libro.cantidad}</span>
              <span className="text-gray-600 dark:text-gray-300 font-medium">unidades</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-gray-900 dark:text-white">${libro.valorUnitario.toFixed(2)} c/u</span>
            </div>
            <div className="text-sm font-bold text-green-700 dark:text-green-400 truncate">
              ${libro.total.toFixed(2)} Total
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onVerDetalles(libro)}
              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded transition-colors"
              title="Ver detalles"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEditar(libro.id)}
              className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 rounded transition-colors"
              title="Editar"
              disabled={editando}
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (confirm('¿Está seguro de eliminar este libro?')) {
                  onEliminar(libro.id);
                }
              }}
              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/50 rounded transition-colors"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {(libro.fechaFactura || libro.folio || libro.proveedor) && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border-t border-blue-100 dark:border-blue-700">
          <div className="flex items-center justify-between text-xs">
            <div className="text-blue-800 dark:text-blue-200 min-w-0 flex-1 mr-2 font-medium">
              {libro.folio && (
                <span className="font-semibold">Folio: {libro.folio}</span>
              )}
              {libro.folio && libro.fechaFactura && (
                <span className="mx-2 text-blue-600 dark:text-blue-300">•</span>
              )}
              {libro.fechaFactura && (
                <span className="truncate">Fecha: {new Date(libro.fechaFactura).toLocaleDateString('es-ES')}</span>
              )}
            </div>
            {libro.proveedor && (
              <span className="text-blue-900 dark:text-blue-100 font-bold bg-blue-200 dark:bg-blue-700 px-2 py-1 rounded text-xs flex-shrink-0">
                {libro.proveedor}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
interface LibrosGridProps {
  libros: LibroCompleto[];
  onVerDetalles: (libro: LibroCompleto) => void;
  onEditar: (id: string) => void;
  onEliminar: (id: string) => void;
  editando: string | null;
}
const LibrosGrid: React.FC<LibrosGridProps> = ({
  libros,
  onVerDetalles,
  onEditar,
  onEliminar,
  editando
}) => {
  if (libros.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-gray-100 dark:bg-gray-600 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <Book className="h-12 w-12 text-gray-400 dark:text-gray-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-700 mb-3">
          No hay libros para mostrar
        </h3>
        <p className="text-gray-600 dark:text-gray-500 max-w-sm mx-auto">
          Agrega libros desde una factura XML o manualmente para comenzar tu biblioteca
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {libros.map((libro) => (
        <LibroCard
          key={libro.id}
          libro={libro}
          onVerDetalles={onVerDetalles}
          onEditar={onEditar}
          onEliminar={onEliminar}
          editando={editando === libro.id}
        />
      ))}
    </div>
  );
};

export { LibroCard, LibrosGrid };