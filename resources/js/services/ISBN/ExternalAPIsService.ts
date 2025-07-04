// ============================================
// 📁 src/services/ISBN/ExternalAPIsService.ts
// ============================================

import { LibroCompleto } from '../../types/LibroCompleto';

// ✅ INTERFACES PARA GOOGLE BOOKS
interface GoogleBooksResponse {
  kind: string;
  totalItems: number;
  items?: GoogleBookItem[];
}

interface GoogleBookItem {
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

// ✅ INTERFACES PARA OPENLIBRARY
interface OpenLibraryResponse {
  numFound: number;
  start: number;
  docs: OpenLibraryDoc[];
}

interface OpenLibraryDoc {
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

interface OpcionesBusqueda {
  timeout?: number;
  incluirDescripcion?: boolean;
  incluirImagen?: boolean;
}

export class ExternalAPIsService {
  private static readonly GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';
  private static readonly OPENLIBRARY_BASE_URL = 'https://openlibrary.org/search.json';

  /**
   * 🌐 Buscar libro por ISBN en APIs externas
   */
  static async buscarISBN(
    isbn: string,
    opciones: OpcionesBusqueda = {}
  ): Promise<LibroCompleto | null> {
    try {
      console.log(`🔍 === INICIANDO BÚSQUEDA EN APIs ===`);
      console.log(`📚 ISBN: ${isbn}`);

      // 1. Intentar primero Google Books (más completo)
      const libroGoogle = await this.buscarEnGoogleBooks(isbn, opciones);
      if (libroGoogle) {
        console.log(`✅ Encontrado en Google Books: "${libroGoogle.titulo}"`);
        return libroGoogle;
      }

      // 2. Si no encuentra en Google Books, intentar OpenLibrary
      const libroOpenLibrary = await this.buscarEnOpenLibrary(isbn, opciones);
      if (libroOpenLibrary) {
        console.log(`✅ Encontrado en OpenLibrary: "${libroOpenLibrary.titulo}"`);
        return libroOpenLibrary;
      }

      console.log(`❌ No encontrado en ninguna API: ${isbn}`);
      return null;

    } catch (error) {
      console.error('💥 Error buscando en APIs externas:', error);
      return null;
    }
  }

  /**
   * 📚 Buscar en Google Books
   */
  private static async buscarEnGoogleBooks(
    isbn: string,
    opciones: OpcionesBusqueda = {}
  ): Promise<LibroCompleto | null> {
    try {
      const { timeout = 10000 } = opciones;

      const url = `${this.GOOGLE_BOOKS_BASE_URL}?q=isbn:${isbn}`;

      console.log(`🔍 Google Books URL: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(timeout)
      });

      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.status}`);
      }

      const data: GoogleBooksResponse = await response.json();

      console.log(`📦 Google Books response totalItems: ${data.totalItems}`);

      if (data.totalItems > 0 && data.items?.[0]) {
        const item = data.items[0];
        console.log(`📖 Procesando item de Google Books:`, {
          id: item.id,
          title: item.volumeInfo?.title,
          authors: item.volumeInfo?.authors
        });

        const libroConvertido = this.convertirGoogleBookALibroCompleto(item, isbn);

        console.log(`✅ Libro convertido desde Google Books:`, {
          id: libroConvertido.id,
          titulo: libroConvertido.titulo,
          autor: libroConvertido.autor.nombre
        });

        return libroConvertido;
      }

      console.log(`❌ Google Books - No encontrado: ${isbn}`);
      return null;

    } catch (error) {
      console.error('💥 Error en Google Books:', error);
      return null;
    }
  }

  /**
   * 📖 Buscar en OpenLibrary
   */
  private static async buscarEnOpenLibrary(
    isbn: string,
    opciones: OpcionesBusqueda = {}
  ): Promise<LibroCompleto | null> {
    try {
      const { timeout = 10000 } = opciones;

      const url = `${this.OPENLIBRARY_BASE_URL}?isbn=${isbn}&fields=key,title,author_name,first_publish_year,publisher,language,isbn,cover_i,subject,author_key`;

      console.log(`🔍 OpenLibrary URL: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(timeout)
      });

      if (!response.ok) {
        throw new Error(`OpenLibrary API error: ${response.status}`);
      }

      const data: OpenLibraryResponse = await response.json();

      console.log(`📦 OpenLibrary response numFound: ${data.numFound}`);

      if (data.numFound > 0 && data.docs?.[0]) {
        const doc = data.docs[0];
        console.log(`📖 Procesando item de OpenLibrary:`, {
          key: doc.key,
          title: doc.title,
          author_name: doc.author_name
        });

        const libroConvertido = this.convertirOpenLibraryALibroCompleto(doc, isbn);

        console.log(`✅ Libro convertido desde OpenLibrary:`, {
          id: libroConvertido.id,
          titulo: libroConvertido.titulo,
          autor: libroConvertido.autor.nombre
        });

        return libroConvertido;
      }

      console.log(`❌ OpenLibrary - No encontrado: ${isbn}`);
      return null;

    } catch (error) {
      console.error('💥 Error en OpenLibrary:', error);
      return null;
    }
  }

  /**
   * 🔄 Convertir respuesta de Google Books a LibroCompleto
   */
  private static convertirGoogleBookALibroCompleto(
    item: GoogleBookItem,
    isbn: string
  ): LibroCompleto {
    const volumeInfo = item.volumeInfo;

    console.log(`🔄 === CONVIRTIENDO GOOGLE BOOK ===`);
    console.log(`📚 volumeInfo.title:`, volumeInfo.title);
    console.log(`👥 volumeInfo.authors:`, volumeInfo.authors);
    console.log(`🏢 volumeInfo.publisher:`, volumeInfo.publisher);

    // ✅ VALIDACIÓN ROBUSTA DE TÍTULO
    let titulo = 'Título no disponible';
    if (volumeInfo.title && typeof volumeInfo.title === 'string' && volumeInfo.title.trim()) {
      titulo = volumeInfo.title.trim();
    }

    console.log(`📖 Título extraído: "${titulo}"`);

    // Extraer año de publicación
    let añoPublicacion: number | undefined;
    if (volumeInfo.publishedDate) {
      const año = parseInt(volumeInfo.publishedDate.split('-')[0]);
      if (!isNaN(año)) {
        añoPublicacion = año;
      }
    }

    // ✅ VALIDACIÓN ROBUSTA DE AUTOR
    let autorNombre = 'Autor Desconocido';
    if (volumeInfo.authors && Array.isArray(volumeInfo.authors) && volumeInfo.authors.length > 0 && volumeInfo.authors[0]) {
      autorNombre = volumeInfo.authors[0].trim();
    }

    console.log(`👤 Autor extraído: "${autorNombre}"`);

    // ✅ VALIDACIÓN ROBUSTA DE GÉNERO
    let genero = 'General';
    if (volumeInfo.categories && Array.isArray(volumeInfo.categories) && volumeInfo.categories.length > 0 && volumeInfo.categories[0]) {
      genero = volumeInfo.categories[0].trim();
    }

    // ✅ VALIDACIÓN ROBUSTA DE EDITORIAL
    let editorial = 'Editorial Desconocida';
    if (volumeInfo.publisher && typeof volumeInfo.publisher === 'string' && volumeInfo.publisher.trim()) {
      editorial = volumeInfo.publisher.trim();
    }

    // Obtener imagen
    const imagenUrl = volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail;
    const libroCompleto = {
      id: `google-${item.id}`,
      isbn: isbn,
      titulo: titulo,
      cantidad: 1,
      valorUnitario: 0, // Google Books no proporciona precios
      descuento: 0,
      total: 0,

      autor: {
        nombre: autorNombre,
        apellidos: ''
      },

      editorial: {
        nombre: editorial
      },

      genero: {
        nombre: genero
      },

      descripcion: volumeInfo.description,
      imagenUrl: imagenUrl,
      imagen_url: imagenUrl,
      añoPublicacion: añoPublicacion,
      año: añoPublicacion,
      paginas: volumeInfo.pageCount,

      // Metadatos
      fuente: '🌐 Google Books API',
      estado: "procesado" as const,
      informacionLimitada: false,
      enriquecidoConAPIs: true,
      calidadDatos: 'alta'
    };

    console.log(`📤 === LIBRO FINAL GOOGLE BOOKS ===`);
    console.log(`📖 Título final: "${libroCompleto.titulo}"`);
    console.log(`👤 Autor final: "${libroCompleto.autor.nombre}"`);
    console.log(`🏢 Editorial final: "${libroCompleto.editorial.nombre}"`);

    return libroCompleto;
  }

  /**
   * 🔄 Convertir respuesta de OpenLibrary a LibroCompleto
   */
  private static convertirOpenLibraryALibroCompleto(
    doc: OpenLibraryDoc,
    isbn: string
  ): LibroCompleto {
    console.log(`🔄 === CONVIRTIENDO OPENLIBRARY ===`);
    console.log(`📚 doc.title:`, doc.title);
    console.log(`👥 doc.author_name:`, doc.author_name);
    console.log(`🏢 doc.publisher:`, doc.publisher);

    // ✅ VALIDACIÓN ROBUSTA DE TÍTULO
    let titulo = 'Título no disponible';
    if (doc.title && typeof doc.title === 'string' && doc.title.trim()) {
      titulo = doc.title.trim();
    }

    // ✅ VALIDACIÓN ROBUSTA DE AUTOR
    let autorNombre = 'Autor Desconocido';
    if (doc.author_name && Array.isArray(doc.author_name) && doc.author_name.length > 0 && doc.author_name[0]) {
      autorNombre = doc.author_name[0].trim();
    }

    // ✅ VALIDACIÓN ROBUSTA DE GÉNERO
    let genero = 'General';
    if (doc.subject && Array.isArray(doc.subject) && doc.subject.length > 0 && doc.subject[0]) {
      genero = doc.subject[0].trim();
    }

    // ✅ VALIDACIÓN ROBUSTA DE EDITORIAL
    let editorial = 'Editorial Desconocida';
    if (doc.publisher && Array.isArray(doc.publisher) && doc.publisher.length > 0 && doc.publisher[0]) {
      editorial = doc.publisher[0].trim();
    }

    // Construir URL de imagen si existe cover_i
    let imagenUrl: string | undefined;
    if (doc.cover_i) {
      imagenUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
    }

    const libroCompleto = {
      id: `openlibrary-${doc.key.replace('/works/', '')}`,
      isbn: isbn,
      titulo: titulo,
      cantidad: 1,
      valorUnitario: 0, // OpenLibrary no proporciona precios
      descuento: 0,
      total: 0,

      autor: {
        nombre: autorNombre,
        apellidos: ''
      },

      editorial: {
        nombre: editorial
      },

      genero: {
        nombre: genero
      },

      descripcion: undefined, // OpenLibrary no proporciona descripción en search
      imagenUrl: imagenUrl,
      imagen_url: imagenUrl,
      añoPublicacion: doc.first_publish_year,
      año: doc.first_publish_year,
      paginas: undefined, // OpenLibrary no proporciona páginas en search

      // Metadatos
      fuente: '📚 OpenLibrary API',
      estado: "procesado" as const,
      informacionLimitada: true, // Menos información que Google Books
      enriquecidoConAPIs: true,
      calidadDatos: 'media'
    };

    console.log(`📤 === LIBRO FINAL OPENLIBRARY ===`);
    console.log(`📖 Título final: "${libroCompleto.titulo}"`);
    console.log(`👤 Autor final: "${libroCompleto.autor.nombre}"`);
    console.log(`🏢 Editorial final: "${libroCompleto.editorial.nombre}"`);

    return libroCompleto;
  }

  /**
   * 🔧 Buscar múltiples ISBNs (uno por uno)
   */
  static async buscarMultiplesISBNs(
    isbns: string[],
    onProgress?: (actual: number, total: number) => void,
    opciones: OpcionesBusqueda = {}
  ): Promise<(LibroCompleto | null)[]> {
    const resultados: (LibroCompleto | null)[] = [];

    console.log(`🚀 === INICIANDO BÚSQUEDA MÚLTIPLE ===`);
    console.log(`📚 Total ISBNs: ${isbns.length}`);

    for (let i = 0; i < isbns.length; i++) {
      console.log(`🔍 [${i + 1}/${isbns.length}] Buscando: ${isbns[i]}`);

      if (onProgress) {
        onProgress(i + 1, isbns.length);
      }

      const libro = await this.buscarISBN(isbns[i], opciones);
      resultados.push(libro);

      if (libro) {
        console.log(`✅ [${i + 1}/${isbns.length}] Encontrado: "${libro.titulo}"`);
      } else {
        console.log(`❌ [${i + 1}/${isbns.length}] No encontrado: ${isbns[i]}`);
      }

      // Pequeña pausa para no saturar las APIs
      if (i < isbns.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`📊 === RESUMEN BÚSQUEDA MÚLTIPLE ===`);
    console.log(`✅ Encontrados: ${resultados.filter(r => r !== null).length}`);
    console.log(`❌ No encontrados: ${resultados.filter(r => r === null).length}`);

    return resultados;
  }

  /**
   * 🧪 Probar conectividad con las APIs
   */
  static async verificarConectividad(): Promise<{
    googleBooks: boolean;
    openLibrary: boolean;
  }> {
    const resultados = {
      googleBooks: false,
      openLibrary: false
    };

    try {
      // Probar Google Books con un ISBN conocido
      const responseGoogle = await fetch(
        `${this.GOOGLE_BOOKS_BASE_URL}?q=isbn:9786070714863`,
        { signal: AbortSignal.timeout(5000) }
      );
      resultados.googleBooks = responseGoogle.ok;
      console.log(`🌐 Google Books conectividad: ${resultados.googleBooks ? '✅' : '❌'}`);
    } catch (error) {
      console.warn('⚠️ Google Books no disponible:', error);
    }

    try {
      // Probar OpenLibrary con un ISBN conocido
      const responseOpenLibrary = await fetch(
        `${this.OPENLIBRARY_BASE_URL}?isbn=9786070714863`,
        { signal: AbortSignal.timeout(5000) }
      );
      resultados.openLibrary = responseOpenLibrary.ok;
      console.log(`📚 OpenLibrary conectividad: ${resultados.openLibrary ? '✅' : '❌'}`);
    } catch (error) {
      console.warn('⚠️ OpenLibrary no disponible:', error);
    }

    return resultados;
  }
}
