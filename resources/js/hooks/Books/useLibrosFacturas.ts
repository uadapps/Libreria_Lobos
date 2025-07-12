// ============================================
// 📁 hooks/useLibrosFacturas.ts - HOOK PRINCIPAL COMPLETO FINAL
// ============================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { toast } from 'react-toastify';
import {
  LibroCompleto,
  DatosFactura,
  ResultadoGuardado,
  EstadisticasPostGuardado,
} from '@/types/LibroCompleto';

export interface EstadisticasBusqueda {
  total: number;
  encontrados: number;
  noEncontrados: number;
  tablasNuevas: number;
  tablasViejas: number;
  apisExternas: number;
  isbnsOriginales: string[];
  ultimaActualizacion: Date;
}

// ✅ MODIFICAR: Agregar callback de reinicio como parámetro opcional
export const useLibrosFacturas = (onReinicioCompleto?: (mostrarToast?: boolean) => void) => {
  const [libros, setLibros] = useState<LibroCompleto[]>([]);
  const [modoAgregar, setModoAgregar] = useState<'manual' | 'factura'>('factura');
  const [editando, setEditando] = useState<string | null>(null);
  const [archivoXML, setArchivoXML] = useState<File | null>(null);
  const [datosFactura, setDatosFactura] = useState<DatosFactura | null>(null);

  const [progresoBusqueda, setProgresoBusqueda] = useState<{ actual: number; total: number } | null>(null);
  const [buscandoISBNs, setBuscandoISBNs] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarEstadisticasAvanzadas, setMostrarEstadisticasAvanzadas] = useState(false);

  const [libroSeleccionado, setLibroSeleccionado] = useState<LibroCompleto | null>(null);
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false);
  const [resultadoGuardado, setResultadoGuardado] = useState<ResultadoGuardado | null>(null);
  const [estadisticasPostGuardado, setEstadisticasPostGuardado] = useState<EstadisticasPostGuardado | null>(null);

  const [estadisticasBusqueda, setEstadisticasBusqueda] = useState<EstadisticasBusqueda | null>(null);

  const { flash, resultado, estadisticasPost } = usePage().props as {
    flash?: { success?: string; error?: string };
    resultado?: ResultadoGuardado;
    estadisticasPost?: EstadisticasPostGuardado;
  };

  // ============================================
  // 🔄 EFECTO PARA MANEJAR FLASH MESSAGES Y RESULTADOS
  // ============================================
  useEffect(() => {
    if (flash?.error) {
      toast.error(flash.error, {
        position: 'top-center',
        autoClose: 5000,
        theme: 'colored',
        toastId: 'flash-error', // Evita duplicados
      });
    }

    if (flash?.success) {
      toast.success(flash.success, {
        position: 'top-center',
        autoClose: 5000,
        theme: 'colored',
        toastId: 'flash-success', // Evita duplicados
      });
    }

    if (resultado) {
      setResultadoGuardado(resultado);
    }

    if (estadisticasPost) {
      setEstadisticasPostGuardado(estadisticasPost);
    }
  }, [flash, resultado, estadisticasPost]);

  // ============================================
  // 📚 FUNCIONES DE MANEJO DE LIBROS
  // ============================================
  const eliminarLibro = useCallback((id: string) => {
    setLibros((prev) => prev.filter((libro) => libro.id !== id));
    toast.info('📚 Libro eliminado de la lista', {
      position: 'top-center',
      autoClose: 2000,
      theme: 'colored',
      toastId: `eliminar-${id}`,
    });
  }, []);

  const guardarEdicion = useCallback((id: string, libroEditado: Partial<LibroCompleto>) => {
    setLibros((prev) =>
      prev.map((libro) =>
        libro.id === id
          ? {
              ...libro,
              ...libroEditado,
              total:
                (libroEditado.valorUnitario || libro.valorUnitario) *
                (libroEditado.cantidad || libro.cantidad) -
                (libroEditado.descuento || libro.descuento),
            }
          : libro,
      ),
    );
    setEditando(null);

    toast.success('✅ Libro actualizado correctamente', {
      position: 'top-center',
      autoClose: 2000,
      theme: 'colored',
      toastId: `editar-${id}`,
    });
  }, []);

  // ============================================
  // 🔍 FUNCIONES DE MODAL DE DETALLES
  // ============================================
  const abrirModalDetalles = useCallback((libro: LibroCompleto) => {
    setLibroSeleccionado(libro);
    setModalDetallesAbierto(true);
  }, []);

  const cerrarModalDetalles = useCallback(() => {
    setModalDetallesAbierto(false);
    setLibroSeleccionado(null);
  }, []);

  const editarLibroDesdeModal = useCallback((libro: LibroCompleto) => {
    setEditando(libro.id);
    cerrarModalDetalles();
  }, [cerrarModalDetalles]);

  const eliminarLibroDesdeModal = useCallback((id: string) => {
    eliminarLibro(id);
    cerrarModalDetalles();
  }, [eliminarLibro, cerrarModalDetalles]);

  // ============================================
  // 🧹 FUNCIONES DE LIMPIEZA
  // ============================================
  const limpiarFactura = useCallback(() => {
      setDatosFactura(null);
      setArchivoXML(null);
      setEstadisticasBusqueda(null);

      toast.success('Factura limpiada. Configure una nueva factura.', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'colored',
        toastId: 'limpiar-factura',
      });
  }, []);

  // ✅ FUNCIÓN LIMPIAR TODO CORREGIDA - SIN TOAST NI CONFIRMACIÓN (para uso interno)
  const limpiarTodo = useCallback(() => {
    console.log('🧹 Ejecutando limpiarTodo desde hook (sin toast)...');

    setLibros([]);
    setEstadisticasBusqueda(null);
    setDatosFactura(null);
    setArchivoXML(null);

    // ❌ SIN TOAST - será manejado por el componente padre
  }, []);

  // ============================================
  // 📋 FUNCIONES DE RESULTADOS
  // ============================================
  const cerrarResultadoGuardado = useCallback(() => {
    const resultadoActual = resultadoGuardado;
    setResultadoGuardado(null);
    setEstadisticasPostGuardado(null);

    if (resultadoActual && resultadoActual.guardados > 0) {
      const confirmarLimpiar = confirm(
        `Se guardaron ${resultadoActual.guardados} libros exitosamente. ¿Desea limpiar la lista actual?`
      );

      if (confirmarLimpiar) {
        setLibros([]);
        setEstadisticasBusqueda(null);
        setDatosFactura(null);
        setArchivoXML(null);

        toast.success('✨ Lista limpiada después del guardado exitoso', {
          position: 'top-center',
          autoClose: 2000,
          theme: 'colored',
          toastId: 'limpiar-post-guardado',
        });
      }
    }
  }, [resultadoGuardado]);

  // =============================================
  // 💾 FUNCIÓN DE GUARDADO PRINCIPAL CON AUTO-REINICIO
  // =============================================
  const guardarLibrosEnInventario = useCallback(() => {
    if (libros.length === 0) {
      toast.warning('⚠️ No hay libros para guardar', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'colored',
        toastId: 'no-libros',
      });
      return;
    }

    // ✅ VALIDACIÓN: SIEMPRE debe haber datos de factura completos
    const tieneFacturaCompleta = libros.some(libro => {
      const serie = libro.serieFactura || datosFactura?.serie;
      const folio = libro.folioFactura || datosFactura?.folio;
      const fecha = libro.fechaFactura || datosFactura?.fecha;
      const editorial = libro.editorial?.nombre || libro.editorial_nombre;

      return serie && folio && fecha && editorial;
    });

    if (!tieneFacturaCompleta) {
      toast.error('❌ Faltan datos de factura. Todos los libros deben tener serie, folio, fecha y proveedor completos', {
        position: 'top-center',
        autoClose: 6000,
        theme: 'colored',
        toastId: 'validacion-factura',
      });
      return;
    }

    setGuardando(true);

    // 🔧 FUNCIÓN AUXILIAR para dividir etiquetas
    const procesarEtiquetas = (generoTexto: string): string[] => {
      if (!generoTexto) return ['General'];

      const etiquetas = generoTexto
        .split(',')
        .map((etiqueta) => etiqueta.trim())
        .filter((etiqueta) => etiqueta.length > 0);

      return etiquetas.length > 0 ? etiquetas : ['General'];
    };

    // ✅ PREPARAR DATOS PARA ENVIAR
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

      // ✅ CAMPOS ADICIONALES
      peso: libro.peso,
      dimensiones: libro.dimensiones,
      url_compra: libro.url_compra,
      ubicacion_fisica: libro.ubicacion_fisica,
      notas_internas: libro.notas_internas,

      // ✅ CAMPOS FISCALES
      clave_prodserv: libro.clave_prodserv || '55101500',
      unidad: libro.unidad || 'PZA',
      claveUnidad: libro.claveUnidad || 'H87',
      objetoImp: libro.objetoImp || '02',
      rfcProveedor: libro.rfcProveedor,
      regimenFiscalProveedor: libro.regimenFiscalProveedor,
      metodoPago: libro.metodoPago,
      formaPago: libro.formaPago,
      usoCfdi: libro.usoCfdi,
      impuestos: libro.impuestos || 0,
      tasaImpuesto: libro.tasaImpuesto || 0,
      uuid: libro.uuid,
    }));

    console.log('💾 === GUARDADO CON FACTURA OBLIGATORIA ===');
    console.log('📦 Datos preparados para guardar:', librosParaGuardar);

    // ✅ CONSTRUIR DATOS DE FACTURA desde el primer libro
    const primerLibro = libros[0];

    // ✅ CONSTRUIR FOLIO COMPLETO
    const serie = primerLibro.serieFactura || datosFactura?.serie || '';
    const folioNumero = primerLibro.folioFactura || datosFactura?.folio || '';
    const folioCompleto = folioNumero.startsWith(serie) ? folioNumero : `${serie}${folioNumero}`;

    const facturaInfo = {
      // Datos básicos
      serie: serie,
      folio: folioCompleto,
      fecha: primerLibro.fechaFactura || datosFactura?.fecha || '',
      rfc: primerLibro.rfcProveedor || datosFactura?.rfc || '',

      // Montos calculados
      subtotal: librosParaGuardar.reduce((sum, libro) => sum + (libro.valorUnitario * libro.cantidad), 0),
      descuento: librosParaGuardar.reduce((sum, libro) => sum + (libro.descuento || 0), 0),
      total: librosParaGuardar.reduce((sum, libro) => sum + ((libro.valorUnitario * libro.cantidad) - (libro.descuento || 0)), 0),

      // Datos fiscales
      uuid_fiscal: primerLibro.uuidFactura || datosFactura?.uuid || '',
      fecha_timbrado: datosFactura?.datosCompletos?.fechaTimbrado || primerLibro.fechaFactura,
      moneda: 'MXN',
      tipo_cambio: 1,
      metodo_pago: primerLibro.metodoPago || 'PPD',
      forma_pago: primerLibro.formaPago || '99',
      condiciones_pago: primerLibro.condicionesPago || '',
      uso_cfdi: primerLibro.usoCfdi || 'G01',
      lugar_expedicion: '',

      // Impuestos calculados
      impuestos: librosParaGuardar.reduce((sum, libro) => sum + (libro.impuestos || 0), 0),
    };

    console.log('📄 Información de factura construida:', facturaInfo);

    // ✅ DATOS DE ENVÍO COMPLETOS
    const datosEnvio = {
      libros: librosParaGuardar,
      factura_info: facturaInfo,
      proveedor_info: {
        nombre: primerLibro.editorial?.nombre || primerLibro.editorial_nombre || 'Editorial Desconocida',
        rfc: facturaInfo.rfc,
        regimen_fiscal: primerLibro.regimenFiscalProveedor || '',
      },
      receptor_info: {
        nombre: datosFactura?.datosCompletos?.receptor?.nombre || '',
        rfc: datosFactura?.datosCompletos?.receptor?.rfc || '',
        domicilio_fiscal: datosFactura?.datosCompletos?.receptor?.domicilioFiscal || '',
        regimen_fiscal: datosFactura?.datosCompletos?.receptor?.regimenFiscal || '',
        uso_cfdi: facturaInfo.uso_cfdi,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        total_libros: librosParaGuardar.length,
        fuente: 'LibrosFacturas-Component',
        tiene_xml: !!(datosFactura && datosFactura.conceptosOriginales),
        conceptos_originales: datosFactura?.conceptosOriginales?.length || 0,
        origen: datosFactura && datosFactura.conceptosOriginales
          ? 'xml_procesado'
          : 'captura_manual_con_factura'
      },
    };

    // ✅ TOAST DE INICIO
    toast.info('⏳ Procesando factura y libros...', {
      position: 'top-center',
      autoClose: 2000,
      theme: 'colored',
      toastId: 'procesando-inicio',
    });

    // ✅ ENVÍO A BACKEND CON AUTO-REINICIO
    router.post('/facturas-libros/procesar', datosEnvio, {
      preserveState: true,
      preserveScroll: true,
      onStart: () => {
        console.log('🚀 Iniciando procesamiento completo de factura y libros...');
      },
      onSuccess: (response) => {
        console.log('✅ Procesamiento completo exitoso:', response);

        // ✅ TOAST DE ÉXITO CON INDICACIÓN DE REINICIO
        const { libros_procesados, etiquetas_creadas, autores_creados, editoriales_creadas, factura_id } = response.props || {};

        let mensaje = `🎉 ¡Guardado exitoso!\n`;
        mensaje += `📚 ${libros_procesados || librosParaGuardar.length} libros guardados\n`;
        mensaje += `📄 Factura ${facturaInfo.folio} registrada`;

        if (factura_id) {
          mensaje += ` (ID: ${factura_id})`;
        }

        if (autores_creados > 0) {
          mensaje += `\n👤 ${autores_creados} autores nuevos`;
        }

        if (editoriales_creadas > 0) {
          mensaje += `\n🏢 ${editoriales_creadas} editoriales nuevas`;
        }

        if (etiquetas_creadas > 0) {
          mensaje += `\n🏷️ ${etiquetas_creadas} etiquetas nuevas`;
        }

        mensaje += `\n🔄 Reiniciando para nueva factura...`;

        toast.success(mensaje, {
          position: 'top-center',
          autoClose: 4000,
          theme: 'colored',
          toastId: 'guardado-exitoso-reinicio',
        });

        // ✅ LIMPIAR DATOS DEL HOOK INMEDIATAMENTE
        setLibros([]);
        setDatosFactura(null);
        setEstadisticasBusqueda(null);
        setArchivoXML(null);

        // ✅ REINICIAR COMPONENTE DESPUÉS DE 1.5 SEGUNDOS
        setTimeout(() => {
          if (onReinicioCompleto) {
            console.log('🔄 Ejecutando reinicio completo post-guardado...');
            onReinicioCompleto(false); // false = no mostrar toast adicional
          }
        }, 1500);
      },
      onError: (errors) => {
        console.error('💥 Error procesando factura y libros:', errors);
        const errorMessage = errors.message || 'Error al procesar la factura y los libros';

        toast.error(`💥 ${errorMessage}`, {
          position: 'top-center',
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'colored',
          toastId: 'error-guardado',
        });
      },
      onFinish: () => {
        setGuardando(false);
        console.log('🏁 Procesamiento finalizado');
      },
    });
  }, [libros, datosFactura, onReinicioCompleto]); // ✅ Incluir onReinicioCompleto en dependencias

  // =============================================
  // 📊 ESTADÍSTICAS CALCULADAS
  // =============================================
  const estadisticas = useMemo(() => {
    const stats = {
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
      if (libro.estado === 'procesado') stats.procesados++;
      if (libro.estado === 'error') stats.errores++;
      stats.valorTotal += libro.total;
      stats.cantidadTotal += libro.cantidad;
      if (libro.fuente?.includes('Manual')) stats.fuenteManual++;
      else if (libro.fuente?.includes('APIs externas')) stats.fuenteAPIs++;
      else stats.fuenteBD++;
      if (libro.imagenUrl || libro.imagen_url) stats.conImagenes++;
      if (libro.informacionLimitada) stats.informacionLimitada++;
      else stats.informacionCompleta++;
    });

    if (stats.total > 0) {
      stats.porcentajeProcesados = Math.round((stats.procesados / stats.total) * 100);
      stats.porcentajeErrores = Math.round((stats.errores / stats.total) * 100);
      stats.porcentajeConImagenes = Math.round((stats.conImagenes / stats.total) * 100);
      stats.porcentajeCompleta = Math.round((stats.informacionCompleta / stats.total) * 100);
    }

    return stats;
  }, [libros]);

  // =============================================
  // 📤 RETURN DEL HOOK COMPLETO
  // =============================================
  return {
    // ✅ ESTADOS PRINCIPALES
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

    // ✅ ESTADOS DE PROGRESO Y CARGA
    progresoBusqueda,
    setProgresoBusqueda,
    buscandoISBNs,
    setBuscandoISBNs,
    guardando,
    setGuardando,

    // ✅ ESTADOS DE UI
    mostrarEstadisticasAvanzadas,
    setMostrarEstadisticasAvanzadas,
    libroSeleccionado,
    modalDetallesAbierto,

    // ✅ ESTADOS DE RESULTADOS
    resultadoGuardado,
    estadisticasPostGuardado,
    estadisticasBusqueda,
    setEstadisticasBusqueda,
    estadisticas,

    // ✅ FUNCIONES DE MANEJO DE LIBROS
    eliminarLibro,
    guardarEdicion,

    // ✅ FUNCIONES DE MODAL
    abrirModalDetalles,
    cerrarModalDetalles,
    editarLibroDesdeModal,
    eliminarLibroDesdeModal,

    // ✅ FUNCIONES DE LIMPIEZA
    limpiarFactura,
    limpiarTodo, // ✅ Sin toast ni confirmación interna

    // ✅ FUNCIONES PRINCIPALES
    cerrarResultadoGuardado,
    guardarLibrosEnInventario, // ✅ Con auto-reinicio incluido
  };
};
