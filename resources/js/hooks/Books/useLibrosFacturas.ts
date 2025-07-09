// ============================================
// 📁 hooks/useLibrosFacturas.ts - HOOK PRINCIPAL
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

export const useLibrosFacturas = () => {
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

  const eliminarLibro = useCallback((id: string) => {
    setLibros((prev) => prev.filter((libro) => libro.id !== id));
    toast.info('Libro eliminado de la lista', {
      position: 'top-center',
      autoClose: 2000,
      theme: 'colored',
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

    toast.success('Libro actualizado', {
      position: 'top-center',
      autoClose: 2000,
      theme: 'colored',
    });
  }, []);

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


  const limpiarFactura = useCallback(() => {
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
  }, []);

  const limpiarTodo = useCallback(() => {
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
  }, []);

  const cerrarResultadoGuardado = useCallback(() => {
    setResultadoGuardado(null);
    setEstadisticasPostGuardado(null);
    if (resultadoGuardado && resultadoGuardado.guardados > 0) {
      const confirmarLimpiar = confirm(
        `Se guardaron ${resultadoGuardado.guardados} libros exitosamente. ¿Desea limpiar la lista actual?`
      );

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
  }, [resultadoGuardado]);

  // =============================================
  // 💾 FUNCIÓN DE GUARDADO
  // =============================================
  const guardarLibrosEnInventario = useCallback(() => {
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
      clave_prodserv: libro.clave_prodserv || '55101500',
      unidad: libro.unidad || 'PZA',
      claveUnidad: libro.claveUnidad || 'H87',
      rfcProveedor: libro.rfcProveedor,
      uuid: libro.uuid,
      metodoPago: libro.metodoPago,
      formaPago: libro.formaPago,
      usoCfdi: libro.usoCfdi,
      impuestos: libro.impuestos || 0,
      tasaImpuesto: libro.tasaImpuesto || 0,
      folio: libro.folio,
      fechaFactura: libro.fechaFactura,
      fuente: libro.fuente,
      peso: libro.peso,
      dimensiones: libro.dimensiones,
      url_compra: libro.url_compra,
      ubicacion_fisica: libro.ubicacion_fisica,
      notas_internas: libro.notas_internas,
    }));

    const tieneFactura = datosFactura && datosFactura.procesado && datosFactura.datosCompletos;

    if (tieneFactura && typeof datosFactura.datosCompletos === 'object' && datosFactura.datosCompletos !== null) {
      const datosCompletos = datosFactura.datosCompletos as {
        fechaTimbrado: string;
        receptor: {
          usoCfdi: string;
          nombre: string;
          rfc: string;
          domicilioFiscal: string;
          regimenFiscal: string;
        };
        lugarExpedicion: string;
        impuestos: {
          totalImpuestosTrasladados: number;
        };
        timbreFiscal?: {
          noCertificadoSat?: string;
          selloCfd?: string;
          selloSat?: string;
        };
        emisor: {
          regimenFiscal: string;
        };
      };
      const datosEnvio = {
        libros: librosParaGuardar,
        factura_info: {
          serie: datosFactura.serie || '',
          folio: datosFactura.folio.replace(datosFactura.serie || '', ''),
          fecha: datosFactura.fecha,
          rfc: datosFactura.rfc,
          subtotal: datosFactura.subtotal,
          descuento: datosFactura.descuento || 0,
          total: datosFactura.total,
          uuid_fiscal: datosFactura.uuid,
          fecha_timbrado: datosCompletos.fechaTimbrado,
          moneda: datosFactura.moneda,
          tipo_cambio: datosFactura.tipoCambio,
          metodo_pago: datosFactura.metodoPago,
          forma_pago: datosFactura.formaPago,
          condiciones_pago: datosFactura.condicionesPago,
          uso_cfdi: datosCompletos.receptor.usoCfdi,
          lugar_expedicion: datosCompletos.lugarExpedicion,
          impuestos: datosCompletos.impuestos.totalImpuestosTrasladados,
          no_certificado: datosCompletos.timbreFiscal?.noCertificadoSat,
          sello_cfd: datosCompletos.timbreFiscal?.selloCfd,
          sello_sat: datosCompletos.timbreFiscal?.selloSat,
        },
        proveedor_info: {
          nombre: datosFactura.editorial,
          rfc: datosFactura.rfc,
          regimen_fiscal: datosCompletos.emisor.regimenFiscal,
        },
        receptor_info: {
          nombre: datosCompletos.receptor.nombre,
          rfc: datosCompletos.receptor.rfc,
          domicilio_fiscal: datosCompletos.receptor.domicilioFiscal,
          regimen_fiscal: datosCompletos.receptor.regimenFiscal,
          uso_cfdi: datosCompletos.receptor.usoCfdi,
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
          toast.info('📋 Procesando factura y libros...', {
            position: 'top-center',
            autoClose: 2000,
            theme: 'colored',
          });
        },
        onSuccess: () => {
          setLibros([]);
          setDatosFactura(null);
          setEstadisticasBusqueda(null);
        },
        onError: (errors) => {
          const errorMessage = errors.message || 'Error al procesar la factura y los libros';
          toast.error(`❌ ${errorMessage}`, {
            position: 'top-center',
            autoClose: 5000,
            theme: 'colored',
          });
        },
        onFinish: () => {
          setGuardando(false);
        },
      });
    } else {
      router.post('/libros/guardar-inventario', {
        libros: librosParaGuardar,
        metadata: {
          timestamp: new Date().toISOString(),
          total_libros: librosParaGuardar.length,
          fuente: 'LibrosFacturas-Component',
          factura_info: null,
        },
      }, {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          setEstadisticasBusqueda(null);
          setLibros([]);
        },
        onError: (errors) => {
          const errorMessage = errors.message || 'Error al guardar los libros en inventario';
          toast.error(`❌ ${errorMessage}`, {
            position: 'top-center',
            autoClose: 5000,
            theme: 'colored',
          });
        },
        onFinish: () => {
          setGuardando(false);
        },
      });
    }
  }, [libros, datosFactura]);
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

  return {
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
    setGuardando,
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
  };
};