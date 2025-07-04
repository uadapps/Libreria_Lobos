// ============================================
// 📁 src/components/libros/LibrosFacturasComponents.tsx - COMPONENTES AUXILIARES
// ============================================
import { Button } from '@/components/ui/button';
import React, { useEffect } from 'react';
import {
  Save,
  Download,
  X,
  CheckCircle,
  AlertTriangle,
  Database,
  Users,
  Building2,
  Tag
} from 'lucide-react';
import { LibroCompleto, EstadisticasLibros } from '../../types/LibroCompleto';

// ✅ TIPOS para el guardado
export interface ResultadoGuardado {
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

export interface EstadisticasPostGuardado {
  libros_total: number;
  autores_total: number;
  editoriales_total: number;
  etiquetas_total: number;
  ultima_actualizacion: string;
}

// ✅ Componente de Flash Messages
export const FlashMessage: React.FC<{
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
}> = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <AlertTriangle className="h-5 w-5 text-red-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    info: <Database className="h-5 w-5 text-blue-600" />
  };

  return (
    <div className={`border rounded-lg p-4 ${styles[type]} animate-in slide-in-from-top-2 duration-300`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icons[type]}
          <span className="font-medium">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ✅ Componente de resultado de guardado
export const ResultadoGuardado: React.FC<{
  resultado: ResultadoGuardado;
  onCerrar: () => void;
  estadisticasPost?: EstadisticasPostGuardado;
}> = ({ resultado, onCerrar, estadisticasPost }) => {
  const porcentajeExito = Math.round((resultado.guardados / (resultado.guardados + resultado.errores)) * 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Save className="h-6 w-6 text-green-600" />
              Guardado Completado
            </h3>
            <Button
              onClick={onCerrar}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Resumen principal */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-800">{resultado.guardados}</div>
              <div className="text-sm text-green-600">Guardados</div>
            </div>
            {resultado.errores > 0 && (
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-800">{resultado.errores}</div>
                <div className="text-sm text-red-600">Errores</div>
              </div>
            )}
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-800">{porcentajeExito}%</div>
              <div className="text-sm text-blue-600">Éxito</div>
            </div>
          </div>

          {/* Estadísticas de creación */}
          {(resultado.autores_creados > 0 || resultado.editoriales_creadas > 0 || resultado.etiquetas_creadas > 0) && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Nuevos registros creados:</h4>
              <div className="grid grid-cols-3 gap-3">
                {resultado.autores_creados > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-purple-700">{resultado.autores_creados} autores</span>
                  </div>
                )}
                {resultado.editoriales_creadas > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                    <Building2 className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-orange-700">{resultado.editoriales_creadas} editoriales</span>
                  </div>
                )}
                {resultado.etiquetas_creadas > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded">
                    <Tag className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm text-indigo-700">{resultado.etiquetas_creadas} etiquetas</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estadísticas de la base de datos */}
          {estadisticasPost && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Estado actual de la base de datos:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded p-2 text-center">
                  <div className="font-bold text-gray-800">{estadisticasPost.libros_total}</div>
                  <div className="text-xs text-gray-600">Libros</div>
                </div>
                <div className="bg-gray-50 rounded p-2 text-center">
                  <div className="font-bold text-gray-800">{estadisticasPost.autores_total}</div>
                  <div className="text-xs text-gray-600">Autores</div>
                </div>
                <div className="bg-gray-50 rounded p-2 text-center">
                  <div className="font-bold text-gray-800">{estadisticasPost.editoriales_total}</div>
                  <div className="text-xs text-gray-600">Editoriales</div>
                </div>
                <div className="bg-gray-50 rounded p-2 text-center">
                  <div className="font-bold text-gray-800">{estadisticasPost.etiquetas_total}</div>
                  <div className="text-xs text-gray-600">Etiquetas</div>
                </div>
              </div>
            </div>
          )}

          {/* Detalles de libros con errores */}
          {resultado.detalles.some(d => d.status === 'error') && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-red-700 mb-2">Libros con errores:</h4>
              <div className="max-h-32 overflow-y-auto bg-red-50 rounded p-3">
                {resultado.detalles
                  .filter(d => d.status === 'error')
                  .map((detalle, index) => (
                    <div key={index} className="text-xs text-red-600 mb-1">
                      <strong>{detalle.isbn}</strong> - {detalle.titulo}: {detalle.error}
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onCerrar}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ COMPONENTE de exportación
export const ExportadorLibros: React.FC<{
  libros: LibroCompleto[];
  estadisticas: EstadisticasLibros;
}> = ({ libros, estadisticas }) => {
  const exportarCSV = () => {
    const headers = [
      'ISBN', 'Título', 'Autor', 'Editorial', 'Género', 'Año',
      'Cantidad', 'Precio_Unit', 'Descuento', 'Total', 'Estado',
      'Fuente', 'Folio', 'Fecha_Factura'
    ];

    const rows = libros.map(libro => [
      libro.isbn,
      libro.titulo,
      `${libro.autor.nombre} ${libro.autor.apellidos || ''}`.trim(),
      libro.editorial.nombre,
      libro.genero.nombre,
      libro.añoPublicacion || libro.año || '',
      libro.cantidad.toString(),
      libro.valorUnitario.toFixed(2),
      libro.descuento.toFixed(2),
      libro.total.toFixed(2),
      libro.estado,
      libro.fuente || 'N/A',
      libro.folio || '',
      libro.fechaFactura || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `libros_factura_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportarJSON = () => {
    const data = {
      metadata: {
        fecha_exportacion: new Date().toISOString(),
        version: '1.0',
        sistema: 'Gestión de Libros - Facturas'
      },
      resumen: {
        total_libros: libros.length,
        valor_total: estadisticas.valorTotal,
        cantidad_total: estadisticas.cantidadTotal
      },
      estadisticas: estadisticas,
      libros: libros.map(libro => ({
        ...libro,
        imagen_url: libro.imagenUrl || libro.imagen_url,
        año: libro.añoPublicacion || libro.año,
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `libros_completo_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportarCSV}
        disabled={libros.length === 0}
        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 flex items-center gap-1"
        title="Exportar como CSV para Excel"
      >
        <Download className="h-4 w-4" />
        CSV
      </button>
      <button
        onClick={exportarJSON}
        disabled={libros.length === 0}
        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 flex items-center gap-1"
        title="Exportar como JSON completo"
      >
        <Download className="h-4 w-4" />
        JSON
      </button>
    </div>
  );
};

// ✅ Hook para estadísticas
export const useEstadisticasLibros = (libros: LibroCompleto[]): EstadisticasLibros => {
  return React.useMemo(() => {
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
      porcentajeCompleta: 0
    };

    libros.forEach(libro => {
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

// ✅ Utilidades para procesamiento de XML
export const extraerTituloYAutor = (descripcion: string): { titulo: string; autor?: string } => {
  const patrones = [
    /^LIBRO:\s*(.+?)\s*-\s*(.+)$/i,
    /^(.+?)\s+por\s+(.+)$/i,
    /^(.+?)\s*\/\s*(.+)$/i,
    /^(.+?),\s*(.+)$/i,
    /^(.+?)\s*-\s*(.+)$/i
  ];

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

export const pareceNombrePersona = (texto: string): boolean => {
  const palabras = texto.split(' ');
  return palabras.length >= 2 && palabras.length <= 4 &&
         palabras.every(palabra => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/.test(palabra));
};
