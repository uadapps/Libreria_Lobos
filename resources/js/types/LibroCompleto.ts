export interface LibroCompleto {
    id: string;
    isbn: string;
    titulo: string;
    cantidad: number;
    valorUnitario: number;
    descuento: number;
    total: number;
    autor: {
        nombre: string; 
        apellidos: string; 
    };
    editorial: {
        nombre: string;
    };
    genero: {
        nombre: string;
    };
    descripcion?: string;
    imagenUrl?: string; 
    imagen_url?: string; 
    añoPublicacion?: number; 
    año?: number; 
    año_publicacion?: number; 
    paginas?: number;
    peso?: number;
    dimensiones?: string;
    url_compra?: string;
    ubicacion_fisica?: string;
    notas_internas?: string;
    estado_fisico?: 'nuevo' | 'usado' | 'renovado' | 'dañado';
    fuente?: string;
    estado: 'procesado' | 'error' | 'pendiente';
    errorMsg?: string;
    informacionLimitada?: boolean;
    enriquecidoConAPIs?: boolean;
    calidadDatos?: 'alta' | 'media' | 'baja';
    fechaEnriquecimiento?: string;
    fuentesAPIs?: string[];
    folio?: string;
    fechaFactura?: string;
    proveedor?: string;
    clave_prodserv?: string;
    unidad?: string;
    claveUnidad?: string;
    objetoImp?: string;
    rfcProveedor?: string;
    regimenFiscalProveedor?: string;
    metodoPago?: string;
    formaPago?: string;
    condicionesPago?: string;
    usoCfdi?: string;
    uuid?: string;
    impuestos?: number;
    tasaImpuesto?: number;
}
export interface FacturaLibro {
    isbn: string;
    titulo: string;
    autor?: string; 
    cantidad: number;
    valorUnitario: number;
    descuento: number;
    total: number;
    editorial?: string;
    fechaFactura?: string;
    folio?: string;
    clave_prodserv?: string;
    unidad?: string;
    claveUnidad?: string;
    rfcProveedor?: string;
    regimenFiscalProveedor?: string;
    uuid?: string;
    metodoPago?: string;
    formaPago?: string;
    usoCfdi?: string;
    impuestos?: number;
    tasaImpuesto?: number;
}
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
export interface LibroManual {
    isbn: string;
    titulo: string;
    cantidad: number;
    valorUnitario: number;
    descuento: number;
    autor_nombre: string;
    autor_apellidos: string;
    editorial_nombre: string;
    año_publicacion: number | null;
    paginas: number | null;
    descripcion: string;
    genero: string;
    etiquetas: string;
    imagen_url: string;
    url_compra: string;
    peso: number | null;
    dimensiones: string;
    estado_fisico: 'nuevo' | 'usado' | 'renovado' | 'dañado';
    ubicacion_fisica: string;
    notas_internas: string;
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
    tasaImpuesto: number | null;
    importeImpuesto: number | null;
    folioFactura: string;
    serieFactura: string;
    fechaFactura: string;
    uuidFactura: string;
    idioma?: string;
    edicion?: string;
    nacionalidad?: string;
    biografia?: string;
    proveedor?: string;
    codigo_interno?: string;
    contacto_editorial?: string;
}

export interface DatosFactura {
    folio: string;
    fecha: string;
    editorial: string;
    numeroConceptos: number;
    procesado: boolean;
    serie: string;
    fechaTimbrado?: string;
    subtotal: number;
    descuento: number;
    total: number;
    moneda: string;
    tipoCambio: number;
    tipoComprobante: string;
    metodoPago: string;
    formaPago: string;
    condicionesPago: string;
    lugarExpedicion: string;
    emisor: {
        rfc: string;
        nombre: string;
        regimenFiscal: string;
    };
    receptor: {
        rfc: string;
        nombre: string;
        usoCfdi: string;
        domicilioFiscal: string;
        regimenFiscal: string;
    };
    timbreFiscal?: {
        uuid: string;
        fechaTimbrado: string;
        selloCfd: string;
        noCertificadoSat: string;
        selloSat: string;
        rfcProvCertif: string;
    };
    impuestos: {
        totalImpuestosTrasladados: number;
        traslados: Array<{
            base: number;
            impuesto: string;
            tipoFactor: string;
            tasaOCuota: number;
            importe: number;
        }>;
    };
    rfc?: string;
    uuid?: string;
    regimenFiscal?: string;
    datosCompletos?: unknown;
    conceptosOriginales?: ConceptoFactura[];
}
export interface ConceptoFactura {
    cantidad: number;
    claveProdServ: string;
    claveUnidad: string;
    descripcion: string;
    noIdentificacion: string; 
    objetoImp: string;
    unidad: string;
    valorUnitario: number;
    importe: number;
    descuento?: number;
    impuestos?: {
        traslados?: Array<{
            base: number;
            impuesto: string;
            tipoFactor: string;
            tasaOCuota: number;
            importe: number;
        }>;
    };
}
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

export interface OpcionesBusqueda {
    forzarAPIs?: boolean;
    soloAPIs?: boolean;
    timeout?: number;
    incluirDescripcion?: boolean;
    incluirImagen?: boolean;
    debug?: boolean;
}

export interface LibroDatabase {
    id?: number;
    isbn: string;
    titulo: string;
    autor?: { nombre?: string };
    autor_nombre?: string;
    autor_apellidos?: string;
    editorial?: { nombre?: string };
    editorial_nombre?: string;
    genero?: { nombre?: string };
    genero_nombre?: string;
    año_publicacion?: number;
    paginas?: number;
    descripcion?: string;
    imagen_url?: string;
    precio_compra?: number;
    precio_venta?: number;
    fuente: string;
    encontrado: boolean;
    mensaje?: string;
}


export interface GoogleBooksResponse {
    kind: string;
    totalItems: number;
    items?: GoogleBookItem[];
}

export interface GoogleBookItem {
    kind: string;
    id: string;
    volumeInfo: {
        title?: string;
        authors?: string[];
        publisher?: string;
        publishedDate?: string;
        description?: string;
        industryIdentifiers?: Array<{
            type: string;
            identifier: string;
        }>;
        pageCount?: number;
        categories?: string[];
        imageLinks?: {
            smallThumbnail?: string;
            thumbnail?: string;
        };
        language?: string;
    };
}

export interface OpenLibraryResponse {
    numFound: number;
    start: number;
    docs: OpenLibraryDoc[];
}

export interface OpenLibraryDoc {
    key: string;
    title?: string;
    author_name?: string[];
    first_publish_year?: number;
    publisher?: string[];
    language?: string[];
    edition_count?: number;
    isbn?: string[];
    cover_i?: number;
    subject?: string[];
    author_key?: string[];
}
export interface FormularioLibroProps {
    libro?: LibroCompleto;
    onSubmit: (libro: Partial<LibroCompleto>) => void;
    onCancel: () => void;
    modo: 'crear' | 'editar';
}
export interface LibroCardProps {
    libro: LibroCompleto;
    onVerDetalles: (libro: LibroCompleto) => void;
    onEditar: (id: string) => void;
    onEliminar: (id: string) => void;
    editando: boolean;
}
export interface LibroDetallesModalProps {
    libro: LibroCompleto | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (libro: LibroCompleto) => void;
    onDelete?: (id: string) => void;
    readonly?: boolean;
}
export interface FiltrosLibros {
    busqueda?: string;
    fuente?: string;
    estado?: string;
    editorial?: string;
    genero?: string;
    año?: number;
    precioMin?: number;
    precioMax?: number;
}
export interface OrdenLibros {
    campo: 'titulo' | 'autor' | 'editorial' | 'año' | 'precio' | 'total' | 'fechaFactura';
    direccion: 'asc' | 'desc';
}
export interface PaginacionLibros {
    pagina: number;
    porPagina: number;
    total: number;
    totalPaginas: number;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: Record<string, string[]>;
}

export interface LibrosResponse {
    libros: LibroCompleto[];
    paginacion: PaginacionLibros;
    estadisticas: EstadisticasLibros;
}
export interface Autor {
    id: number;
    nombre: string;
    apellidos?: string;
    nombre_completo?: string;
    seudónimo?: string;
    nacionalidad?: string;
    biografía?: string;
}

export interface Editorial {
    id: number;
    nombre: string;
    contacto?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
}

export interface Etiqueta {
    id: number;
    nombre: string;
    descripción?: string;
    color?: string;
}

export interface Categoria {
    id: number;
    nombre: string;
    descripción?: string;
}
