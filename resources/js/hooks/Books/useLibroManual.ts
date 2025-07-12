// ============================================
// 📁 hooks/Books/useLibroManual.ts - CÓDIGO COMPLETO FINAL CON BLOQUEO MANUAL
// ============================================
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { DatabaseSearchService } from '@/services/ISBN/DatabaseSearchService';
import { LibroCompleto, DatosFactura } from '@/types/LibroCompleto';

// ============================================
// 📋 INTERFACE LibroManual
// ============================================
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

// ============================================
// 📊 ESTADO INICIAL
// ============================================
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

// ============================================
// 🎯 HOOK PRINCIPAL
// ============================================
export const useLibroManual = (
  setLibros: React.Dispatch<React.SetStateAction<LibroCompleto[]>>,
  datosFactura: DatosFactura | null,
  setBuscandoISBNs: React.Dispatch<React.SetStateAction<boolean>>
) => {

  // ============================================
  // 📊 ESTADOS DEL FORMULARIO
  // ============================================
  const [nuevoLibro, setNuevoLibro] = useState<LibroManual>(LIBRO_MANUAL_INICIAL);

  // ============================================
  // 📊 ESTADOS DEL WIZARD/PASOS
  // ============================================
  const [pasoActual, setPasoActual] = useState(1);
  const [pasoCompletado, setPasoCompletado] = useState<{ [key: number]: boolean }>({});
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<string[]>([]);

  // ============================================
  // 📊 ESTADOS ADICIONALES
  // ============================================
  const [isEditorialNueva, setIsEditorialNueva] = useState(false);
  const [isAutorNuevo, setIsAutorNuevo] = useState(false);
  const [isGeneroNuevo, setIsGeneroNuevo] = useState(false);

  // ✅ Estado para bloquear/desbloquear campos de factura
  const [facturaDesbloqueada, setFacturaDesbloqueada] = useState(false);

  // ============================================
  // 🔧 FUNCIÓN PARA PRELLENAR DATOS DESDE FACTURA XML
  // ============================================
  const prellenarDatosDesdeFactura = useCallback(() => {
    if (datosFactura && datosFactura.procesado) {
      console.log('🔄 Prellenando datos desde factura XML:', {
        serie: datosFactura.serie,
        folio: datosFactura.folio,
        editorial: datosFactura.editorial
      });

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

      // ✅ BLOQUEAR automáticamente con factura XML
      setFacturaDesbloqueada(false);
      console.log('🔒 Campos de factura bloqueados automáticamente (factura XML)');
    }
  }, [datosFactura]);

  // ✅ NUEVA: Función para auto-bloquear cuando se completa factura manual
  const autoBloquearFacturaCompleta = useCallback(() => {
    // Solo si no hay factura XML procesada
    if (!datosFactura?.procesado) {
      const facturaManualCompleta = !!(
        nuevoLibro.serieFactura &&
        nuevoLibro.folioFactura &&
        nuevoLibro.fechaFactura &&
        nuevoLibro.editorial_nombre &&
        nuevoLibro.rfcProveedor &&
        nuevoLibro.uuidFactura
      );

      if (facturaManualCompleta && facturaDesbloqueada) {
        console.log('🔒 Factura manual completa detectada - Bloqueando automáticamente');
        console.log('✅ Campos completos:', {
          serie: nuevoLibro.serieFactura,
          folio: nuevoLibro.folioFactura,
          fecha: nuevoLibro.fechaFactura,
          editorial: nuevoLibro.editorial_nombre,
          rfc: nuevoLibro.rfcProveedor,
          uuid: nuevoLibro.uuidFactura
        });

        setFacturaDesbloqueada(false);
      }
    }
  }, [nuevoLibro.serieFactura, nuevoLibro.folioFactura, nuevoLibro.fechaFactura, nuevoLibro.editorial_nombre, nuevoLibro.rfcProveedor, nuevoLibro.uuidFactura, datosFactura, facturaDesbloqueada]);

  // ✅ Función para alternar bloqueo de factura
  const toggleBloqueoFactura = useCallback(() => {
    setFacturaDesbloqueada(prev => {
      const nuevoEstado = !prev;
      console.log(`${nuevoEstado ? '🔓' : '🔒'} Campos de factura ${nuevoEstado ? 'desbloqueados' : 'bloqueados'}`);
      return nuevoEstado;
    });
  }, []);

  // ============================================
  // 🔄 EFECTOS
  // ============================================

  // Efecto para prellenar cuando hay factura XML
  useEffect(() => {
    if (datosFactura) {
      prellenarDatosDesdeFactura();
    }
  }, [datosFactura, prellenarDatosDesdeFactura]);

  // ✅ NUEVO: Efecto para auto-bloquear factura manual completa
  useEffect(() => {
    const timer = setTimeout(() => {
      autoBloquearFacturaCompleta();
    }, 1000); // 1 segundo de delay para no interrumpir al usuario

    return () => clearTimeout(timer);
  }, [autoBloquearFacturaCompleta]);

  // ============================================
  // 🔧 FUNCIONES DEL WIZARD
  // ============================================

  // Función para validar paso
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

  // Función para avanzar paso
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

  // Función para retroceder paso
  const retrocederPaso = useCallback(() => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  }, [pasoActual]);

  // Función para ir a paso específico
  const irAPaso = useCallback((paso: number) => {
    const accesible = paso <= pasoActual || pasoCompletado[paso];
    if (accesible && paso >= 1 && paso <= 5) {
      setPasoActual(paso);
    }
  }, [pasoActual, pasoCompletado]);

  // ============================================
  // 🔍 FUNCIÓN PARA BUSCAR ISBN
  // ============================================
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
      console.log('🔍 Buscando ISBN en BD:', isbn);

      // ✅ USAR DatabaseSearchService
      const libroInfo = await DatabaseSearchService.buscarPorISBN(isbn, { debug: true });

      if (libroInfo) {
        console.log('✅ Libro encontrado en BD:', libroInfo.titulo);

        // Prellenar datos encontrados
        setNuevoLibro((prev) => ({
          ...prev,
          isbn: libroInfo.isbn || isbn,
          titulo: libroInfo.titulo || prev.titulo,
          autor_nombre: libroInfo.autor?.nombre || prev.autor_nombre,
          autor_apellidos: libroInfo.autor?.apellidos || prev.autor_apellidos,
          editorial_nombre: libroInfo.editorial?.nombre || prev.editorial_nombre,
          año_publicacion: libroInfo.año_publicacion || prev.año_publicacion,
          paginas: libroInfo.paginas || prev.paginas,
          descripcion: libroInfo.descripcion || prev.descripcion,
          imagen_url: libroInfo.imagen_url || prev.imagen_url,
          peso: libroInfo.peso || prev.peso,
          dimensiones: libroInfo.dimensiones || prev.dimensiones,
          valorUnitario: libroInfo.valorUnitario || libroInfo.precio_compra || prev.valorUnitario,
        }));

        toast.success(`📚 Libro encontrado en BD: ${libroInfo.titulo}`, {
          position: 'top-center',
          autoClose: 3000,
          theme: 'colored',
          toastId: 'isbn-encontrado',
        });

        console.log(`✅ Datos prellenados desde BD (${libroInfo.fuente})`);
      } else {
        console.log('❌ ISBN no encontrado en BD');

        toast.info('📖 ISBN no encontrado en la base de datos. Complete manualmente.', {
          position: 'top-center',
          autoClose: 4000,
          theme: 'colored',
          toastId: 'isbn-no-encontrado',
        });
      }
    } catch (error) {
      console.error('💥 Error buscando ISBN en BD:', error);
      toast.error('Error al buscar información del libro. Verifique la conexión a la base de datos.', {
        position: 'top-center',
        autoClose: 7000,
        theme: 'colored',
        toastId: 'error-buscar-isbn',
      });
    } finally {
      setBuscandoISBNs(false);
    }
  }, [setBuscandoISBNs]);

  // ============================================
  // 🔄 FUNCIONES DE RESETEO
  // ============================================

  // Resetear solo los campos del libro, mantener factura
  const resetearSoloLibro = useCallback(() => {
    console.log('🔄 Reseteando solo campos del libro, manteniendo factura');

    setNuevoLibro(prev => ({
      ...prev,
      // ✅ LIMPIAR SOLO campos del libro
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

      // ✅ MANTENER TODOS los datos de factura y fiscales
      editorial_nombre: prev.editorial_nombre,
      folioFactura: prev.folioFactura,
      serieFactura: prev.serieFactura,
      fechaFactura: prev.fechaFactura,
      uuidFactura: prev.uuidFactura,
      rfcProveedor: prev.rfcProveedor,
      regimenFiscalProveedor: prev.regimenFiscalProveedor,

      // ✅ MANTENER campos SAT
      clave_prodserv: prev.clave_prodserv,
      unidad: prev.unidad,
      claveUnidad: prev.claveUnidad,
      objetoImp: prev.objetoImp,
      metodoPago: prev.metodoPago,
      formaPago: prev.formaPago,
      condicionesPago: prev.condicionesPago,
      usoCfdi: prev.usoCfdi,
      tipoImpuesto: prev.tipoImpuesto,

      // ✅ RESETEAR solo valores de impuestos (se recalculan por libro)
      baseImpuesto: null,
      tasaImpuesto: 0,
      importeImpuesto: 0,
    }));

    // ✅ VOLVER AL PASO 1 después de agregar libro
    setPasoActual(1);
    setPasoCompletado({});
    setEtiquetasSeleccionadas([]);

    // ✅ MANTENER el estado de bloqueo de factura
    console.log('✅ Reset completado - Vuelta al paso 1, datos de factura mantenidos');
  }, []);

  // Resetear formulario completo
  const resetearFormulario = useCallback(() => {
    console.log('🔄 Reseteando formulario completo');

    setNuevoLibro(LIBRO_MANUAL_INICIAL);
    setPasoActual(1);
    setPasoCompletado({});
    setEtiquetasSeleccionadas([]);
    setIsEditorialNueva(false);
    setIsAutorNuevo(false);
    setIsGeneroNuevo(false);

    // ✅ RESETEAR también el estado de bloqueo
    setFacturaDesbloqueada(false);

    // Si hay factura activa, prellenar sus datos
    if (datosFactura) {
      setTimeout(() => {
        prellenarDatosDesdeFactura();
      }, 100);
    }
  }, [datosFactura, prellenarDatosDesdeFactura]);

  // Resetear completo (para cambio de factura)
  const resetearCompleto = useCallback(() => {
    console.log('🔄 Reseteo completo (cambio de factura)');

    setNuevoLibro(LIBRO_MANUAL_INICIAL);
    setPasoActual(1);
    setPasoCompletado({});
    setEtiquetasSeleccionadas([]);
    setIsEditorialNueva(false);
    setIsAutorNuevo(false);
    setIsGeneroNuevo(false);

    // ✅ DESBLOQUEAR campos para nueva factura
    setFacturaDesbloqueada(true);
    console.log('🔓 Campos de factura desbloqueados para nueva factura');
  }, []);

  // ============================================
  // ➕ FUNCIÓN PARA AGREGAR LIBRO
  // ============================================
  const agregarLibroManual = useCallback(() => {
    console.log('📚 === INICIANDO AGREGAR LIBRO ===');

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
      fuente: datosFactura ? 'Manual + Factura XML' : 'Manual + Factura Manual',

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

      // Datos fiscales
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

    console.log('📚 Libro creado:', {
      titulo: libro.titulo,
      folio: libro.folio,
      fuente: libro.fuente,
      total: libro.total
    });

    setLibros((prev) => [...prev, libro]);
    resetearSoloLibro();

    const facturaRef = `${nuevoLibro.serieFactura || datosFactura?.serie}${nuevoLibro.folioFactura || datosFactura?.folio}`;

    toast.success(`✅ Libro agregado a factura ${facturaRef}. Listo para el siguiente libro.`, {
      position: 'top-center',
      autoClose: 3000,
      theme: 'colored',
      toastId: 'libro-agregado',
    });

    console.log(`📚 Libro agregado. Factura ${facturaRef} mantenida para próximo libro.`);
  }, [nuevoLibro, etiquetasSeleccionadas, datosFactura, setLibros, resetearSoloLibro]);

  // ============================================
  // 📤 RETURN DEL HOOK
  // ============================================
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

    // ✅ Estado y función para bloqueo de factura
    facturaDesbloqueada,
    setFacturaDesbloqueada,
    toggleBloqueoFactura,

    // Funciones de validación y navegación
    validarPaso,
    avanzarPaso,
    retrocederPaso,
    irAPaso,

    // Funciones principales
    buscarPorISBNManual,
    agregarLibroManual,

    // Funciones de reseteo
    resetearFormulario,
    resetearSoloLibro,
    resetearCompleto,
    prellenarDatosDesdeFactura,

    // ✅ NUEVA: Función de auto-bloqueo para uso manual si es necesario
    autoBloquearFacturaCompleta,
  };
};
