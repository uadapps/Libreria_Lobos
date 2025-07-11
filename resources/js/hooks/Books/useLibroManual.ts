// ============================================
// 📁 hooks/Books/useLibroManual.ts - HOOK COMPLETO CON PASOS
// ============================================
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { LibroCompleto, DatosFactura } from '@/types/LibroCompleto';

export interface LibroManual {
  // Campos básicos
  isbn: string;
  titulo: string;
  cantidad: number;
  valorUnitario: number;
  descuento: number;
  
  // Información del libro
  autor_nombre: string;
  autor_apellidos: string;
  editorial_nombre: string;
  año_publicacion: number | null;
  paginas: number | null;
  descripcion: string;
  
  // Categorización
  genero: string;
  etiquetas: string;
  
  // Imágenes y URLs
  imagen_url: string;
  url_compra: string;
  
  // Físicos
  peso: number | null;
  dimensiones: string;
  estado_fisico: string;
  ubicacion_fisica: string;
  notas_internas: string;
  
  // Campos fiscales
  clave_prodserv: string;
  unidad: string;
  claveUnidad: string;
  objetoImp: string;
  rfcProveedor: string;
  regimenFiscalProveedor: string;
  metodoPago: string;
  formaPago: string;
  condicionesPago: string;
  usoCfdi: string;
  baseImpuesto: number | null;
  tipoImpuesto: string;
  tasaImpuesto: number;
  importeImpuesto: number;
  folioFactura: string;
  serieFactura: string;
  fechaFactura: string;
  uuidFactura: string;
}

const LIBRO_MANUAL_INICIAL: LibroManual = {
  // Campos básicos
  isbn: '',
  titulo: '',
  cantidad: 1,
  valorUnitario: 0,
  descuento: 0,
  
  // Información del libro
  autor_nombre: '',
  autor_apellidos: '',
  editorial_nombre: '',
  año_publicacion: null,
  paginas: null,
  descripcion: '',
  
  // Categorización
  genero: 'General',
  etiquetas: '',
  
  // Imágenes y URLs
  imagen_url: '',
  url_compra: '',
  
  // Físicos
  peso: null,
  dimensiones: '',
  estado_fisico: 'nuevo',
  ubicacion_fisica: '',
  notas_internas: '',
  
  // Campos fiscales
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

export const useLibroManual = (
  setLibros: React.Dispatch<React.SetStateAction<LibroCompleto[]>>,
  datosFactura: DatosFactura | null,
  setBuscandoISBNs: React.Dispatch<React.SetStateAction<boolean>>
) => {
  // ✅ ESTADOS DEL FORMULARIO
  const [nuevoLibro, setNuevoLibro] = useState<LibroManual>(LIBRO_MANUAL_INICIAL);
  
  // ✅ ESTADOS DEL WIZARD/PASOS
  const [pasoActual, setPasoActual] = useState(1);
  const [pasoCompletado, setPasoCompletado] = useState<{ [key: number]: boolean }>({});
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<string[]>([]);
  
  // ✅ ESTADOS ADICIONALES
  const [isEditorialNueva, setIsEditorialNueva] = useState(false);
  const [isAutorNuevo, setIsAutorNuevo] = useState(false);
  const [isGeneroNuevo, setIsGeneroNuevo] = useState(false);

  // ✅ FUNCIÓN PARA PRELLENAR DATOS DESDE FACTURA
  const prellenarDatosDesdeFactura = useCallback(() => {
    if (datosFactura && datosFactura.procesado) {
      setNuevoLibro((prev) => ({
        ...prev,
        // Datos de la factura
        serieFactura: datosFactura.serie || '',
        folioFactura: datosFactura.folio || '',
        fechaFactura: datosFactura.fecha || '',
        uuidFactura: datosFactura.uuid || '',
        
        // Datos del proveedor
        editorial_nombre: datosFactura.editorial || prev.editorial_nombre,
        rfcProveedor: datosFactura.rfc || '',
        regimenFiscalProveedor: datosFactura.regimenFiscal || '',
      }));
    }
  }, [datosFactura]);

  // ✅ EFECTO PARA PRELLENAR CUANDO HAY FACTURA
  useEffect(() => {
    if (datosFactura) {
      prellenarDatosDesdeFactura();
    }
  }, [datosFactura, prellenarDatosDesdeFactura]);

  // ✅ FUNCIÓN PARA VALIDAR PASO
  const validarPaso = useCallback((paso: number): boolean => {
    switch (paso) {
      case 1: // Información Básica
        return !!(nuevoLibro.isbn && nuevoLibro.titulo);
      case 2: // Autor y Editorial
        return !!(nuevoLibro.autor_nombre && nuevoLibro.editorial_nombre);
      case 3: // Información Comercial
        return !!(nuevoLibro.cantidad > 0 && nuevoLibro.valorUnitario >= 0);
      case 4: // Información Adicional (opcional)
        return true;
      case 5: // Información Fiscal (opcional)
        return true;
      default:
        return false;
    }
  }, [nuevoLibro]);

  // ✅ FUNCIÓN PARA AVANZAR PASO
  const avanzarPaso = useCallback(() => {
    if (validarPaso(pasoActual)) {
      setPasoCompletado((prev) => ({ ...prev, [pasoActual]: true }));
      if (pasoActual < 5) {
        setPasoActual(pasoActual + 1);
      }
    } else {
      toast.warning('Complete los campos requeridos antes de continuar', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'colored',
        toastId: 'validacion-paso',
      });
    }
  }, [pasoActual, validarPaso]);

  // ✅ FUNCIÓN PARA RETROCEDER PASO
  const retrocederPaso = useCallback(() => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  }, [pasoActual]);

  // ✅ FUNCIÓN PARA IR A PASO ESPECÍFICO
  const irAPaso = useCallback((paso: number) => {
    const accesible = paso <= pasoActual || pasoCompletado[paso];
    if (accesible && paso >= 1 && paso <= 5) {
      setPasoActual(paso);
    }
  }, [pasoActual, pasoCompletado]);

  // ✅ FUNCIÓN PARA BUSCAR ISBN
  const buscarPorISBNManual = useCallback(async (isbn: string) => {
    if (!isbn || isbn.length < 10) {
      toast.warning('Ingrese un ISBN válido (10 o 13 dígitos)', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'colored',
        toastId: 'isbn-invalido',
      });
      return;
    }

    setBuscandoISBNs(true);
    
    try {
      const response = await fetch(`/api/libros/buscar-isbn/${isbn}`);
      const data = await response.json();

      if (data.encontrado) {
        // Prellenar datos encontrados
        setNuevoLibro((prev) => ({
          ...prev,
          isbn: data.libro.isbn || isbn,
          titulo: data.libro.titulo || prev.titulo,
          autor_nombre: data.libro.autor?.nombre || prev.autor_nombre,
          autor_apellidos: data.libro.autor?.apellidos || prev.autor_apellidos,
          editorial_nombre: data.libro.editorial?.nombre || prev.editorial_nombre,
          año_publicacion: data.libro.año_publicacion || prev.año_publicacion,
          paginas: data.libro.paginas || prev.paginas,
          descripcion: data.libro.descripcion || prev.descripcion,
          imagen_url: data.libro.imagen_url || prev.imagen_url,
          peso: data.libro.peso || prev.peso,
          dimensiones: data.libro.dimensiones || prev.dimensiones,
        }));

        toast.success(`📚 Libro encontrado: ${data.libro.titulo}`, {
          position: 'top-center',
          autoClose: 3000,
          theme: 'colored',
          toastId: 'isbn-encontrado',
        });
      } else {
        toast.info('📖 ISBN no encontrado en la base de datos. Complete manualmente.', {
          position: 'top-center',
          autoClose: 4000,
          theme: 'colored',
          toastId: 'isbn-no-encontrado',
        });
      }
    } catch (error) {
      console.error('Error buscando ISBN:', error);
      toast.error('Error al buscar ISBN. Verifique la conexión.', {
        position: 'top-center',
        autoClose: 5000,
        theme: 'colored',
        toastId: 'error-buscar-isbn',
      });
    } finally {
      setBuscandoISBNs(false);
    }
  }, [setBuscandoISBNs]);

  // ✅ FUNCIÓN PARA AGREGAR LIBRO
  const agregarLibroManual = useCallback(() => {
    if (!nuevoLibro.titulo || !nuevoLibro.isbn) {
      toast.warning('Título e ISBN son requeridos', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'colored',
        toastId: 'campos-requeridos',
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
      genero: { nombre: etiquetasSeleccionadas.join(', ') || nuevoLibro.genero || 'General' },
      estado: 'procesado',
      fuente: datosFactura ? 'Manual (con factura)' : 'Manual',

      // Campos adicionales
      año_publicacion: nuevoLibro.año_publicacion,
      añoPublicacion: nuevoLibro.año_publicacion,
      paginas: nuevoLibro.paginas,
      descripcion: nuevoLibro.descripcion,
      imagen_url: nuevoLibro.imagen_url,
      imagenUrl: nuevoLibro.imagen_url,
      peso: nuevoLibro.peso,
      dimensiones: nuevoLibro.dimensiones,
      url_compra: nuevoLibro.url_compra,
      ubicacion_fisica: nuevoLibro.ubicacion_fisica,
      notas_internas: nuevoLibro.notas_internas,

      // Datos fiscales si existen
      clave_prodserv: nuevoLibro.clave_prodserv,
      folio: nuevoLibro.folioFactura || datosFactura?.folio || '',
      fechaFactura: nuevoLibro.fechaFactura || datosFactura?.fecha || '',
      uuid: nuevoLibro.uuidFactura || datosFactura?.uuid || '',
      rfcProveedor: nuevoLibro.rfcProveedor || datosFactura?.rfc || '',
      
      // Campos adicionales del formulario fiscal
      serieFactura: nuevoLibro.serieFactura || datosFactura?.serie || '',
      folioFactura: nuevoLibro.folioFactura || datosFactura?.folio || '',
      uuidFactura: nuevoLibro.uuidFactura || datosFactura?.uuid || '',
      regimenFiscalProveedor: nuevoLibro.regimenFiscalProveedor || '',
      metodoPago: nuevoLibro.metodoPago || 'PPD',
      formaPago: nuevoLibro.formaPago || '99',
      usoCfdi: nuevoLibro.usoCfdi || 'G01',
      unidad: nuevoLibro.unidad || 'PZA',
      claveUnidad: nuevoLibro.claveUnidad || 'H87',
      objetoImp: nuevoLibro.objetoImp || '02',
      tasaImpuesto: nuevoLibro.tasaImpuesto || 0,
      impuestos: nuevoLibro.importeImpuesto || 0,
    };

    setLibros((prev) => [...prev, libro]);

    // ✅ RESETEAR FORMULARIO COMPLETO (incluyendo pasos)
    resetearFormulario();

    toast.success('✅ Libro agregado exitosamente', {
      position: 'top-center',
      autoClose: 2000,
      theme: 'colored',
      toastId: 'libro-agregado',
    });
  }, [nuevoLibro, etiquetasSeleccionadas, datosFactura, setLibros]);

  // ✅ FUNCIÓN PARA RESETEAR FORMULARIO COMPLETO
  const resetearFormulario = useCallback(() => {
    setNuevoLibro(LIBRO_MANUAL_INICIAL);
    setPasoActual(1);
    setPasoCompletado({});
    setEtiquetasSeleccionadas([]);
    setIsEditorialNueva(false);
    setIsAutorNuevo(false);
    setIsGeneroNuevo(false);

    // Si hay factura activa, prellenar sus datos
    if (datosFactura) {
      setTimeout(() => {
        prellenarDatosDesdeFactura();
      }, 100); // Pequeño delay para asegurar que el reset se complete
    }
  }, [datosFactura, prellenarDatosDesdeFactura]);

  // ✅ FUNCIÓN PARA RESETEAR SOLO LIBRO (mantener pasos)
  const resetearSoloLibro = useCallback(() => {
    setNuevoLibro(LIBRO_MANUAL_INICIAL);
    
    // Si hay factura activa, prellenar sus datos
    if (datosFactura) {
      setTimeout(() => {
        prellenarDatosDesdeFactura();
      }, 100);
    }
  }, [datosFactura, prellenarDatosDesdeFactura]);

  // ✅ FUNCIÓN PARA RESETEAR COMPLETO (para cambio de factura)
  const resetearCompleto = useCallback(() => {
    setNuevoLibro(LIBRO_MANUAL_INICIAL);
    setPasoActual(1);
    setPasoCompletado({});
    setEtiquetasSeleccionadas([]);
    setIsEditorialNueva(false);
    setIsAutorNuevo(false);
    setIsGeneroNuevo(false);
  }, []);

  return {
    // Estados del formulario
    nuevoLibro,
    setNuevoLibro,
    
    // Estados del wizard
    pasoActual,
    setPasoActual,
    pasoCompletado,
    setPasoCompletado,
    etiquetasSeleccionadas,
    setEtiquetasSeleccionadas,
    
    // Estados adicionales
    isEditorialNueva,
    setIsEditorialNueva,
    isAutorNuevo,
    setIsAutorNuevo,
    isGeneroNuevo,
    setIsGeneroNuevo,
    
    // Funciones de validación y navegación
    validarPaso,
    avanzarPaso,
    retrocederPaso,
    irAPaso,
    
    // Funciones principales
    buscarPorISBNManual,
    agregarLibroManual,
    resetearFormulario,
    resetearSoloLibro,
    resetearCompleto, // ✅ NUEVA para cambio de factura
    prellenarDatosDesdeFactura,
  };
};