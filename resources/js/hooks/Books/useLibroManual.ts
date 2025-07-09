import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { DatabaseSearchService } from '@/services/ISBN/DatabaseSearchService';
import { LibroCompleto, LibroManual, DatosFactura } from '@/types/LibroCompleto';

export const useLibroManual = (
  setLibros: React.Dispatch<React.SetStateAction<LibroCompleto[]>>,
  datosFactura?: DatosFactura | null,
  setBuscandoISBNs?: (value: boolean) => void
) => {
  const [nuevoLibro, setNuevoLibro] = useState<LibroManual>({
    isbn: '',
    titulo: '',
    cantidad: 1,
    valorUnitario: 0,
    descuento: 0,
    autor_nombre: '',
    autor_apellidos: '',
    editorial_nombre: '',
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
    clave_prodserv: '55101500',
    unidad: 'PZA',
    claveUnidad: 'H87',
    objetoImp: '02',
    rfcProveedor: '',
    regimenFiscalProveedor: '',
    metodoPago: 'PPD',
    formaPago: '99',
    condicionesPago: '',
    usoCfdi: 'G01',
    baseImpuesto: null,
    tipoImpuesto: '002',
    tasaImpuesto: 0,
    importeImpuesto: 0,
    folioFactura: '',
    serieFactura: '',
    fechaFactura: '',
    uuidFactura: '',
  });

  // ✅ FUNCIÓN PARA ACTUALIZAR CAMPOS ESPECÍFICOS
  const actualizarCampo = useCallback((campo: keyof LibroManual, valor: any) => {
    setNuevoLibro(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);

  // ✅ FUNCIÓN PARA ACTUALIZAR MÚLTIPLES CAMPOS
  const actualizarCampos = useCallback((campos: Partial<LibroManual>) => {
    setNuevoLibro(prev => ({
      ...prev,
      ...campos
    }));
  }, []);

  const buscarPorISBNManual = useCallback(async (isbn: string) => {
    if (!isbn) return;

    if (setBuscandoISBNs) setBuscandoISBNs(true);
    
    try {
      const libroInfo = await DatabaseSearchService.buscarPorISBN(isbn, {});
      if (libroInfo) {
        const libroCompleto: LibroCompleto = {
          ...libroInfo,
          id: `manual-${Date.now()}`,
          cantidad: nuevoLibro.cantidad || 1,
          valorUnitario: nuevoLibro.valorUnitario || libroInfo.valorUnitario || 0,
          descuento: nuevoLibro.descuento || 0,
          total: (nuevoLibro.valorUnitario || libroInfo.valorUnitario || 0) * (nuevoLibro.cantidad || 1) - (nuevoLibro.descuento || 0),
          estado: 'procesado',
          folio: datosFactura?.folio || '',
          fechaFactura: datosFactura?.fecha || '',
        };
        setLibros((prev) => [...prev, libroCompleto]);
        
        // ✅ USAR LA FUNCIÓN DE RESETEO
        resetearFormulario();

        toast.success(`✅ Libro encontrado: ${libroInfo.titulo}`, {
          position: 'top-center',
          autoClose: 3000,
          theme: 'colored',
        });
        
        console.log(`✅ Libro encontrado: ${libroInfo.titulo} (${libroInfo.fuente})`);
      } else {
        toast.warning('No se encontró información para este ISBN en la base de datos', {
          position: 'top-center',
          autoClose: 5000,
          theme: 'colored',
        });
      }
    } catch (error) {
      console.error('💥 Error buscando ISBN:', error);
      toast.error('Error al buscar información del libro. Verifique la conexión a la base de datos.', {
        position: 'top-center',
        autoClose: 7000,
        theme: 'colored',
      });
    } finally {
      if (setBuscandoISBNs) setBuscandoISBNs(false);
    }
  }, [nuevoLibro.cantidad, nuevoLibro.valorUnitario, nuevoLibro.descuento, datosFactura, setLibros, setBuscandoISBNs]);

  const agregarLibroManual = useCallback(() => {
    if (!nuevoLibro.titulo || !nuevoLibro.isbn) {
      toast.warning('Título e ISBN son requeridos', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'colored',
      });
      return;
    }
    
    const total = (nuevoLibro.valorUnitario || 0) * (nuevoLibro.cantidad || 1) - (nuevoLibro.descuento || 0);
    const libro: LibroCompleto = {
      id: `manual-${Date.now()}`,
      cantidad: nuevoLibro.cantidad || 1,
      isbn: nuevoLibro.isbn || '',
      titulo: nuevoLibro.titulo || '',
      valorUnitario: nuevoLibro.valorUnitario || 0,
      descuento: nuevoLibro.descuento || 0,
      total,
      autor: {
        nombre: nuevoLibro.autor_nombre || 'Autor Desconocido',
        apellidos: nuevoLibro.autor_apellidos || '',
      },
      editorial: { nombre: nuevoLibro.editorial_nombre || 'Editorial Desconocida' },
      genero: { nombre: nuevoLibro.genero || 'General' },
      estado: 'procesado',
      fuente: datosFactura ? 'Manual (con factura)' : 'Manual',

      año_publicacion: nuevoLibro.año_publicacion ?? undefined,
      añoPublicacion: nuevoLibro.año_publicacion ?? undefined,
      paginas: nuevoLibro.paginas ?? undefined,
      descripcion: nuevoLibro.descripcion ?? undefined,
      imagen_url: nuevoLibro.imagen_url ?? undefined,
      imagenUrl: nuevoLibro.imagen_url ?? undefined,
      peso: nuevoLibro.peso ?? undefined,
      dimensiones: nuevoLibro.dimensiones ?? undefined,
      url_compra: nuevoLibro.url_compra ?? undefined,
      ubicacion_fisica: nuevoLibro.ubicacion_fisica ?? undefined,
      notas_internas: nuevoLibro.notas_internas ?? undefined,

      clave_prodserv: nuevoLibro.clave_prodserv,
      folio: nuevoLibro.folioFactura || datosFactura?.folio || '',
      fechaFactura: nuevoLibro.fechaFactura || datosFactura?.fecha || '',
      uuid: nuevoLibro.uuidFactura || datosFactura?.uuid || '',
      rfcProveedor: nuevoLibro.rfcProveedor || datosFactura?.rfc || '',
    };

    setLibros((prev) => [...prev, libro]);
    resetearFormulario();

    toast.success('Libro agregado exitosamente', {
      position: 'top-center',
      autoClose: 2000,
      theme: 'colored',
    });
  }, [nuevoLibro, datosFactura, setLibros]);

  // ✅ RESETEAR FORMULARIO ESTABLE
  const resetearFormulario = useCallback(() => {
    const formVacio: LibroManual = {
      isbn: '',
      titulo: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      autor_nombre: '',
      autor_apellidos: '',
      editorial_nombre: '',
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
      clave_prodserv: '55101500',
      unidad: 'PZA',
      claveUnidad: 'H87',
      objetoImp: '02',
      rfcProveedor: '',
      regimenFiscalProveedor: '',
      metodoPago: 'PPD',
      formaPago: '99',
      condicionesPago: '',
      usoCfdi: 'G01',
      baseImpuesto: null,
      tipoImpuesto: '002',
      tasaImpuesto: 0,
      importeImpuesto: 0,
      folioFactura: '',
      serieFactura: '',
      fechaFactura: '',
      uuidFactura: '',
    };

    setNuevoLibro(formVacio);

    // Prellenar datos de factura si existe
    if (datosFactura?.procesado) {
      setTimeout(() => {
        prellenarDatosDesdeFactura();
      }, 0);
    }
  }, [datosFactura]);

  const prellenarDatosDesdeFactura = useCallback(() => {
    if (datosFactura?.procesado) {
      actualizarCampos({
        serieFactura: datosFactura.serie || '',
        folioFactura: datosFactura.folio || '',
        fechaFactura: datosFactura.fecha || '',
        uuidFactura: datosFactura.uuid || '',
        editorial_nombre: datosFactura.editorial || '',
        rfcProveedor: datosFactura.rfc || '',
        regimenFiscalProveedor: datosFactura.regimenFiscal || '',
      });
    }
  }, [datosFactura, actualizarCampos]);

  return {
    nuevoLibro,
    setNuevoLibro,
    actualizarCampo,        // ✅ NUEVA FUNCIÓN
    actualizarCampos,       // ✅ NUEVA FUNCIÓN
    buscarPorISBNManual,
    agregarLibroManual,
    resetearFormulario,
    prellenarDatosDesdeFactura,
  };
};