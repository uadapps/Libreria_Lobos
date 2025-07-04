// ============================================
// 📁 src/types/LibroCompleto.ts - CORREGIDO (autor simple)
// ============================================

export interface LibroCompleto {
  // ✅ Identificación básica
  id: string;
  isbn: string;
  titulo: string;

  // ✅ Información comercial
  cantidad: number;
  valorUnitario: number;
  descuento: number;
  total: number;

  // ✅ CORREGIDO: Autor como string simple
  autor: {
    nombre: string;        // Nombre completo: "DRESSER, DENISE"
    apellidos: string;     // Mantener por compatibilidad, pero vacío
  };
  // ✅ ALTERNATIVA: O mejor aún, directamente como string
  // autor: string;  // "DRESSER, DENISE"

  editorial: {
    nombre: string;
  };
  genero: {
    nombre: string;
  };

  // ✅ Detalles del libro (opcionales) - COMPATIBILIDAD MEJORADA
  descripcion?: string;
  imagenUrl?: string;        // Frontend
  imagen_url?: string;       // Backend alias
  añoPublicacion?: number;   // Frontend
  año?: number;              // Backend alias
  paginas?: number;

  // ✅ Metadatos del sistema
  fuente?: string;
  estado: 'procesado' | 'error' | 'pendiente';
  errorMsg?: string;

  // ✅ Información de enriquecimiento
  informacionLimitada?: boolean;
  enriquecidoConAPIs?: boolean;
  calidadDatos?: 'alta' | 'media' | 'baja';
  fechaEnriquecimiento?: string;
  fuentesAPIs?: string[];

  // ✅ Información de factura (opcional)
  folio?: string;
  fechaFactura?: string;
  proveedor?: string;
}

// ✅ NUEVO: Interface para estadísticas de factura
export interface FacturaLibro {
  isbn: string;
  titulo: string;
  autor?: string;           // ✅ CORREGIDO: string simple
  cantidad: number;
  valorUnitario: number;
  descuento: number;
  total: number;
  editorial?: string;
  fechaFactura?: string;
  folio?: string;
}

// ✅ Interface para estadísticas
export interface EstadisticasLibros {
  total: number;
  procesados: number;
  errores: number;
  valorTotal: number;
  cantidadTotal: number;
  fuenteBD: number;
  fuenteAPIs: number;
  fuenteManual: number;
  conImagenes: number;
  informacionCompleta: number;
  informacionLimitada: number;
  porcentajeProcesados: number;
  porcentajeErrores: number;
  porcentajeConImagenes: number;
  porcentajeCompleta: number;
}
