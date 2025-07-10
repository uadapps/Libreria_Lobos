import { useState, useCallback, useEffect } from 'react';
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
    editorial_nombre: datosFactura?.editorial || '',
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
    rfcProveedor: datosFactura?.rfc || '',
    regimenFiscalProveedor: datosFactura?.regimenFiscal || '',
    metodoPago: 'PPD',
    formaPago: '99',
    condicionesPago: '',
    usoCfdi: 'G01',
    baseImpuesto: null,
    tipoImpuesto: '002',
    tasaImpuesto: 0,
    importeImpuesto: 0,
    folioFactura: datosFactura?.folio || '',
    serieFactura: datosFactura?.serie || '',
    fechaFactura: datosFactura?.fecha || '',
    uuidFactura: datosFactura?.uuid || '',
  });

  //  EFECTO PARA PRELLENAR DATOS DE FACTURA CUANDO CAMBIE
  useEffect(() => {
    if (datosFactura) {
      setNuevoLibro(prev => ({
        ...prev,
        editorial_nombre: prev.editorial_nombre || datosFactura.editorial || '',
        rfcProveedor: prev.rfcProveedor || datosFactura.rfc || '',
        regimenFiscalProveedor: prev.regimenFiscalProveedor || datosFactura.regimenFiscal || '',
        folioFactura: prev.folioFactura || datosFactura.folio || '',
        serieFactura: prev.serieFactura || datosFactura.serie || '',
        fechaFactura: prev.fechaFactura || datosFactura.fecha || '',
        uuidFactura: prev.uuidFactura || datosFactura.uuid || '',
      }));
    }
  }, [datosFactura]);

  // ✅ FUNCIÓN PARA ACTUALIZAR CAMPOS ESPECÍFICOS
  const actualizarCampo = useCallback((campo: keyof LibroManual, valor: any) => {
    setNuevoLibro(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);

  //  FUNCIÓN PARA ACTUALIZAR MÚLTIPLES CAMPOS
  const actualizarCampos = useCallback((campos: Partial<LibroManual>) => {
    setNuevoLibro(prev => ({
      ...prev,
      ...campos
    }));
  }, []);

  //  RESETEAR SOLO LOS CAMPOS DEL LIBRO, MANTENER FACTURA
  const resetearSoloLibro = useCallback(() => {
    setNuevoLibro(prev => ({
      ...prev,
      // Limpiar campos del libro
      isbn: '',
      titulo: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      autor_nombre: '',
      autor_apellidos: '',
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
      // MANTENER campos de factura
      editorial_nombre: prev.editorial_nombre,
      folioFactura: prev.folioFactura,
      serieFactura: prev.serieFactura,
      fechaFactura: prev.fechaFactura,
      uuidFactura: prev.uuidFactura,
      rfcProveedor: prev.rfcProveedor,
      regimenFiscalProveedor: prev.regimenFiscalProveedor,
      // MANTENER campos SAT
      clave_prodserv: prev.clave_prodserv,
      unidad: prev.unidad,
      claveUnidad: prev.claveUnidad,
      objetoImp: prev.objetoImp,
      metodoPago: prev.metodoPago,
      formaPago: prev.formaPago,
      condicionesPago: prev.condicionesPago,
      usoCfdi: prev.usoCfdi,
      baseImpuesto: null,
      tipoImpuesto: prev.tipoImpuesto,
      tasaImpuesto: 0,
      importeImpuesto: 0,
    }));
  }, []);

  const buscarPorISBNManual = useCallback(async (isbn: string) => {
    if (!isbn) return;

    // ✅ VERIFICAR QUE HAYA FACTURA ANTES DE BUSCAR
    const tieneFactura = (nuevoLibro.serieFactura || datosFactura?.serie) && 
                        (nuevoLibro.folioFactura || datosFactura?.folio) && 
                        (nuevoLibro.fechaFactura || datosFactura?.fecha) &&
                        (nuevoLibro.editorial_nombre || datosFactura?.editorial);

    if (!tieneFactura) {
      toast.error('⚠️ Configure la información de factura antes de buscar libros por ISBN', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'colored',
      });
      return;
    }

    if (setBuscandoISBNs) setBuscandoISBNs(true);
    try {
      const libroInfo = await DatabaseSearchService.buscarPorISBN(isbn, {});
      if (libroInfo) {
      
        let fuente: string;
        if (datosFactura) {
          fuente = 'BD + Manual + Factura XML'; 
        } else {
          fuente = 'BD + Manual + Factura Manual'; 
        }

        const total = (nuevoLibro.valorUnitario || libroInfo.valorUnitario || 0) * (nuevoLibro.cantidad || 1) - (nuevoLibro.descuento || 0);

        const libroCompleto: LibroCompleto = {
          ...libroInfo,
          id: `manual-${Date.now()}`,
          cantidad: nuevoLibro.cantidad || 1,
          valorUnitario: nuevoLibro.valorUnitario || libroInfo.valorUnitario || 0,
          descuento: nuevoLibro.descuento || 0,
          total,
          estado: 'procesado',
          fuente, 
          folio: nuevoLibro.folioFactura || datosFactura?.folio || '',
          serieFactura: nuevoLibro.serieFactura || datosFactura?.serie || '',
          fechaFactura: nuevoLibro.fechaFactura || datosFactura?.fecha || '',
          uuidFactura: nuevoLibro.uuidFactura || datosFactura?.uuid || '',
          uuid: nuevoLibro.uuidFactura || datosFactura?.uuid || '',
          rfcProveedor: nuevoLibro.rfcProveedor || datosFactura?.rfc || '',
          regimenFiscalProveedor: nuevoLibro.regimenFiscalProveedor || datosFactura?.regimenFiscal || '',
          editorial: libroInfo.editorial || { nombre: nuevoLibro.editorial_nombre || datosFactura?.editorial || 'Editorial Desconocida' },
          metodoPago: nuevoLibro.metodoPago || 'PPD',
          formaPago: nuevoLibro.formaPago || '99',
          usoCfdi: nuevoLibro.usoCfdi || 'G01',
          tipoImpuesto: nuevoLibro.tipoImpuesto || '002',
          tasaImpuesto: nuevoLibro.tasaImpuesto || 0,
          importeImpuesto: nuevoLibro.importeImpuesto || 0,
          baseImpuesto: nuevoLibro.baseImpuesto || total,
        };
        
        setLibros((prev) => [...prev, libroCompleto]);
        resetearSoloLibro();

        const facturaRef = `${nuevoLibro.serieFactura || datosFactura?.serie}${nuevoLibro.folioFactura || datosFactura?.folio}`;
        toast.success(` Libro encontrado y agregado a factura ${facturaRef}: ${libroInfo.titulo}`, {
          position: 'top-center',
          autoClose: 4000,
          theme: 'colored',
        });
        
        console.log(`Libro encontrado: ${libroInfo.titulo} (agregado con factura ${facturaRef})`);
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
  }, [nuevoLibro, datosFactura, setLibros, setBuscandoISBNs, resetearSoloLibro]);

  const agregarLibroManual = useCallback(() => {
    console.log('🔍 DEBUG - agregarLibroManual ejecutándose con:', {
      tieneFactura: !!(
        (nuevoLibro.serieFactura || datosFactura?.serie) && 
        (nuevoLibro.folioFactura || datosFactura?.folio) && 
        (nuevoLibro.fechaFactura || datosFactura?.fecha) &&
        (nuevoLibro.editorial_nombre || datosFactura?.editorial)
      ),
      datosFactura,
      nuevoLibro: {
        serieFactura: nuevoLibro.serieFactura,
        folioFactura: nuevoLibro.folioFactura,
        fechaFactura: nuevoLibro.fechaFactura,
        editorial_nombre: nuevoLibro.editorial_nombre
      }
    });

    // SIEMPRE DEBE HABER FACTURA (XML O MANUAL)
    const tieneFactura = (nuevoLibro.serieFactura || datosFactura?.serie) && 
                        (nuevoLibro.folioFactura || datosFactura?.folio) && 
                        (nuevoLibro.fechaFactura || datosFactura?.fecha) &&
                        (nuevoLibro.editorial_nombre || datosFactura?.editorial);

    if (!tieneFactura) {
      toast.error(' La información de factura es obligatoria. Complete todos los campos requeridos.', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'colored',
      });
      return;
    }

    if (!nuevoLibro.titulo || !nuevoLibro.isbn) {
      toast.warning('Título e ISBN son requeridos', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'colored',
      });
      return;
    }

    if (!nuevoLibro.autor_nombre) {
      toast.warning('El autor es requerido', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'colored',
      });
      return;
    }
    
    const total = (nuevoLibro.valorUnitario || 0) * (nuevoLibro.cantidad || 1) - (nuevoLibro.descuento || 0);
    
    //  DETERMINAR LA FUENTE SEGÚN EL ORIGEN DE LA FACTURA
    let fuente: string;
    if (datosFactura) {
      fuente = 'Manual + Factura XML'; // Libro manual + factura XML procesada
    } else {
      fuente = 'Manual + Factura Manual'; // Libro manual + factura capturada manualmente
    }

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
      editorial: { nombre: nuevoLibro.editorial_nombre || datosFactura?.editorial || 'Editorial Desconocida' },
      genero: { nombre: nuevoLibro.genero || 'General' },
      estado: 'procesado',
      fuente, //  FUENTE INDICA SIEMPRE QUE HAY FACTURA

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
      
      // CAMPOS DE FACTURA OBLIGATORIOS (SIEMPRE PRESENTES)
      folio: nuevoLibro.folioFactura || datosFactura?.folio || '',
      serieFactura: nuevoLibro.serieFactura || datosFactura?.serie || '',
      fechaFactura: nuevoLibro.fechaFactura || datosFactura?.fecha || '',
      uuidFactura: nuevoLibro.uuidFactura || datosFactura?.uuid || '',
      uuid: nuevoLibro.uuidFactura || datosFactura?.uuid || '',
      rfcProveedor: nuevoLibro.rfcProveedor || datosFactura?.rfc || '',
      regimenFiscalProveedor: nuevoLibro.regimenFiscalProveedor || datosFactura?.regimenFiscal || '',
      
      //  INFORMACIÓN FISCAL COMPLETA
      metodoPago: nuevoLibro.metodoPago || 'PPD',
      formaPago: nuevoLibro.formaPago || '99',
      usoCfdi: nuevoLibro.usoCfdi || 'G01',
      tipoImpuesto: nuevoLibro.tipoImpuesto || '002',
      tasaImpuesto: nuevoLibro.tasaImpuesto || 0,
      importeImpuesto: nuevoLibro.importeImpuesto || 0,
      baseImpuesto: nuevoLibro.baseImpuesto || total,
    };

    //  DEBUG - VERIFICAR EL LIBRO QUE SE VA A AGREGAR
    console.log('📚 DEBUG - Libro que se va a agregar:', {
      fuente: libro.fuente,
      folio: libro.folio,
      serieFactura: libro.serieFactura,
      fechaFactura: libro.fechaFactura,
      editorial: libro.editorial,
      titulo: libro.titulo
    });

    setLibros((prev) => [...prev, libro]);
    resetearSoloLibro();

    const facturaRef = `${nuevoLibro.serieFactura || datosFactura?.serie}${nuevoLibro.folioFactura || datosFactura?.folio}`;
    toast.success(`✅ Libro agregado a factura ${facturaRef}`, {
      position: 'top-center',
      autoClose: 3000,
      theme: 'colored',
    });
  }, [nuevoLibro, datosFactura, setLibros, resetearSoloLibro]);

  //  RESETEAR FORMULARIO COMPLETO (INCLUYENDO FACTURA)
  const resetearFormulario = useCallback(() => {
    const formVacio: LibroManual = {
      isbn: '',
      titulo: '',
      cantidad: 1,
      valorUnitario: 0,
      descuento: 0,
      autor_nombre: '',
      autor_apellidos: '',
      editorial_nombre: datosFactura?.editorial || '',
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
      rfcProveedor: datosFactura?.rfc || '',
      regimenFiscalProveedor: datosFactura?.regimenFiscal || '',
      metodoPago: 'PPD',
      formaPago: '99',
      condicionesPago: '',
      usoCfdi: 'G01',
      baseImpuesto: null,
      tipoImpuesto: '002',
      tasaImpuesto: 0,
      importeImpuesto: 0,
      folioFactura: datosFactura?.folio || '',
      serieFactura: datosFactura?.serie || '',
      fechaFactura: datosFactura?.fecha || '',
      uuidFactura: datosFactura?.uuid || '',
    };

    setNuevoLibro(formVacio);
  }, [datosFactura]);

  const prellenarDatosDesdeFactura = useCallback(() => {
    if (datosFactura) {
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
    actualizarCampo,
    actualizarCampos,
    buscarPorISBNManual,
    agregarLibroManual,
    resetearFormulario,
    resetearSoloLibro,       //  NUEVA FUNCIÓN
    prellenarDatosDesdeFactura,
  };
};