// ============================================
// 📁 src/services/ISBN/DatabaseSearchService.ts - CON PROGRESO EN CHUNKS
// ============================================

import { LibroCompleto } from '../../types/LibroCompleto';
import { ExternalAPIsService } from './ExternalAPIsService';

interface LibroDatabase {
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

interface OpcionesBusqueda {
  forzarAPIs?: boolean;
  soloAPIs?: boolean;
  timeout?: number;
  incluirDescripcion?: boolean;
  incluirImagen?: boolean;
}

export class DatabaseSearchService {
  private static readonly BUSCAR_ISBN_URL = '/libros/buscar-isbn';
  private static readonly BUSCAR_LOTE_URL = '/libros/buscar-lote';
  private static readonly BUSCAR_TITULO_URL = '/libros/buscar-titulo';
  private static readonly HEALTH_URL = '/libros/health';
  private static readonly ESTADISTICAS_URL = '/libros/estadisticas';

  // 🔧 TIMEOUTS MÁS CONSERVADORES
  private static readonly DEFAULT_TIMEOUT_INDIVIDUAL = 5000; // 5 segundos
  private static readonly DEFAULT_TIMEOUT_LOTE = 15000; // 15 segundos
  private static readonly DEFAULT_TIMEOUT_HEALTH = 3000; // 3 segundos

  /**
   * Convertir respuesta del backend a LibroCompleto
   */
  private static convertirALibroCompleto(data: LibroDatabase): LibroCompleto {
    // Buscar autor en múltiples formatos
    let autorNombre = 'Autor Desconocido';

    if ((data as any).autor?.nombre) {
      autorNombre = (data as any).autor.nombre;
    } else if (data.autor_nombre) {
      autorNombre = data.autor_nombre;
    } else if (typeof (data as any).autor === 'string') {
      autorNombre = (data as any).autor;
    }

    // Buscar editorial en múltiples formatos
    let editorialNombre = 'Editorial Desconocida';
    if ((data as any).editorial?.nombre) {
      editorialNombre = (data as any).editorial.nombre;
    } else if (data.editorial_nombre) {
      editorialNombre = data.editorial_nombre;
    }

    // Buscar género en múltiples formatos
    let generoNombre = 'General';
    if ((data as any).genero?.nombre) {
      generoNombre = (data as any).genero.nombre;
    } else if (data.genero_nombre) {
      generoNombre = data.genero_nombre;
    }

    return {
      id: `db-${data.id || Date.now()}`,
      isbn: data.isbn,
      titulo: data.titulo,
      cantidad: 1,
      valorUnitario: data.precio_compra || 0,
        precioCompra: data.precio_compra || 0,
      descuento: 0,
      total: 0,

      autor: {
        nombre: autorNombre,
        apellidos: data.autor_apellidos || ''
      },

      editorial: {
        nombre: editorialNombre
      },

      genero: {
        nombre: generoNombre
      },

      descripcion: data.descripcion,
      imagenUrl: data.imagen_url,
      imagen_url: data.imagen_url,
      añoPublicacion: data.año_publicacion,
      año: data.año_publicacion,
      paginas: data.paginas,

      fuente: this.mapearFuente(data.fuente),
      estado: 'procesado',
      informacionLimitada: data.fuente === 'TABLAS_VIEJAS',
      enriquecidoConAPIs: data.fuente === 'APIS_EXTERNAS',
      calidadDatos: data.fuente === 'TABLAS_NUEVAS' ? 'alta' : 'media'
    };
  }

  /**
   * Mapear fuente del SP a texto descriptivo
   */
  private static mapearFuente(fuente: string): string {
    switch (fuente) {
      case 'TABLAS_NUEVAS':
        return '📊 Base de datos LB_ (información completa)';
      case 'TABLAS_VIEJAS':
        return '📚 Base de datos legacy (información básica)';
      case 'APIS_EXTERNAS':
        return '🌐 APIs externas (Google Books + OpenLibrary) → Guardado en LB_';
      case 'NO_ENCONTRADO':
        return '❌ No encontrado';
      default:
        return `Base de datos (${fuente})`;
    }
  }

  /**
   * 🔧 BUSCAR UN LIBRO POR ISBN - LÓGICA SIMPLIFICADA
   */
  static async buscarPorISBN(
    isbn: string,
    opciones: OpcionesBusqueda = {}
  ): Promise<LibroCompleto | null> {
    try {
      console.log('🔍 === BÚSQUEDA POR ISBN ===');
      console.log('📖 ISBN:', isbn);
      console.log('⚙️ Opciones:', opciones);

      // 🔧 LÓGICA SIMPLIFICADA Y CLARA
      const debeUsarSoloAPIs = opciones.soloAPIs === true;
      const debeEvitarAPIs = opciones.forzarAPIs === false;

      console.log('🧠 Decisiones de búsqueda:');
      console.log('   - Solo APIs:', debeUsarSoloAPIs);
      console.log('   - Evitar APIs:', debeEvitarAPIs);

      // 1️⃣ Si se pide solo APIs, ir directo a APIs
      if (debeUsarSoloAPIs) {
        console.log('🌐 Buscando SOLO en APIs externas...');
        return await this.buscarEnAPIsExternas(isbn, opciones);
      }

      // 2️⃣ Buscar primero en BD (comportamiento normal)
      console.log('📊 Buscando en Base de Datos...');
      const libroBD = await this.buscarEnBaseDatos(isbn, opciones);

      if (libroBD) {
        console.log(`✅ Encontrado en BD: "${libroBD.titulo}"`);
        return libroBD;
      }

      // 3️⃣ Si no se encontró en BD y NO se prohíben las APIs, buscar en APIs
      if (!debeEvitarAPIs) {
        console.log('🌐 No encontrado en BD, buscando en APIs...');
        const libroAPI = await this.buscarEnAPIsExternas(isbn, opciones);

        if (libroAPI) {
          console.log(`✅ Encontrado en APIs: "${libroAPI.titulo}"`);
          return libroAPI;
        }
      } else {
        console.log('⚠️ APIs deshabilitadas por opciones');
      }

      console.log(`❌ No encontrado: ${isbn}`);
      return null;

    } catch (error) {
      console.error('💥 Error en búsqueda individual:', error);

      // 🔧 MANEJO ESPECÍFICO DE TIMEOUTS
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        console.error('⏰ Error de timeout - considera ajustar el tiempo límite');
        // Podrías lanzar un error específico o retornar null
        return null;
      }

      throw error;
    }
  }

  /**
   * 🔧 BUSCAR EN BASE DE DATOS - CON TIMEOUT OPTIMIZADO
   */
  private static async buscarEnBaseDatos(
    isbn: string,
    opciones: OpcionesBusqueda = {}
  ): Promise<LibroCompleto | null> {
    const timeout = opciones.timeout || this.DEFAULT_TIMEOUT_INDIVIDUAL;

    try {
      const params = new URLSearchParams({ isbn });
      const url = `${this.BUSCAR_ISBN_URL}?${params.toString()}`;

      console.log(`🔗 Llamando a: ${url} (timeout: ${timeout}ms)`);

      // 🔧 USAR AbortController PARA MEJOR CONTROL
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      const data: LibroDatabase = await response.json();

      console.log('📊 Respuesta BD:', {
        encontrado: data.encontrado,
        fuente: data.fuente,
        titulo: data.titulo || 'N/A'
      });

      if (data.encontrado === true) {
        return this.convertirALibroCompleto(data);
      }

      return null;

    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`⏰ Timeout en BD después de ${timeout}ms`);
        return null;
      }
      throw error;
    }
  }

  /**
   * 🔧 BUSCAR EN APIs EXTERNAS - CON MANEJO DE ERRORES MEJORADO
   */
  private static async buscarEnAPIsExternas(
    isbn: string,
    opciones: OpcionesBusqueda = {}
  ): Promise<LibroCompleto | null> {
    try {
      console.log('🌐 === BÚSQUEDA EN APIs EXTERNAS ===');
      console.log('📖 ISBN:', isbn);

      // 🔧 VERIFICAR QUE EL SERVICIO EXISTE
      if (!ExternalAPIsService || typeof ExternalAPIsService.buscarISBN !== 'function') {
        console.error('❌ ExternalAPIsService no disponible o mal configurado');
        return null;
      }

      const resultado = await ExternalAPIsService.buscarISBN(isbn, {
        timeout: opciones.timeout || this.DEFAULT_TIMEOUT_INDIVIDUAL,
        incluirDescripcion: opciones.incluirDescripcion,
        incluirImagen: opciones.incluirImagen
      });

      if (resultado) {
        console.log(`✅ Encontrado en APIs: "${resultado.titulo}"`);
      } else {
        console.log(`❌ No encontrado en APIs: ${isbn}`);
      }

      return resultado;

    } catch (error) {
      console.error('💥 Error en APIs externas:', error.message);

      // 🔧 NO PROPAGAR ERRORES DE APIs PARA NO ROMPER EL FLUJO
      return null;
    }
  }

  /**
   * 🔧 PROCESAR LOTE - CON MEJOR MANEJO DE TIMEOUTS Y PROGRESO
   */
  static async procesarLoteISBNs(
    isbns: string[],
    onProgress?: (actual: number, total: number) => void,
    titulos?: string[],
    opciones: OpcionesBusqueda = {}
  ): Promise<(LibroCompleto | null)[]> {
    try {
      if (isbns.length === 0) {
        return [];
      }

      console.log(`📚 Procesando lote de ${isbns.length} ISBNs`);

      if (onProgress) {
        onProgress(0, isbns.length);
      }

      // 🔧 TIMEOUT ESPECÍFICO PARA LOTES
      const opcionesLote = {
        ...opciones,
        timeout: opciones.timeout || this.DEFAULT_TIMEOUT_LOTE
      };

      // 1️⃣ Buscar en BD primero CON PROGRESO
      const resultadosBD = await this.buscarLoteEnBaseDatos(isbns, opcionesLote, onProgress);

      // 2️⃣ Identificar faltantes
      const noEncontrados: { index: number; isbn: string }[] = [];
      resultadosBD.forEach((libro, index) => {
        if (!libro) {
          noEncontrados.push({ index, isbn: isbns[index] });
        }
      });

      // 3️⃣ Buscar faltantes en APIs si está permitido
      const debeUsarAPIs = opciones.soloAPIs === true ||
                          (opciones.forzarAPIs !== false && noEncontrados.length > 0);

      if (debeUsarAPIs && noEncontrados.length > 0) {
        console.log(`Buscando ${noEncontrados.length} ISBNs en APIs...`);

        try {
          const isbnsFaltantes = noEncontrados.map(item => item.isbn);
          const resultadosAPI = await ExternalAPIsService.buscarMultiplesISBNs(
            isbnsFaltantes,
            (actual, total) => {
              const progresoTotal = resultadosBD.filter(l => l !== null).length + actual;
              if (onProgress) {
                onProgress(progresoTotal, isbns.length);
              }
            },
            opcionesLote
          );

          // Asignar resultados de APIs
          resultadosAPI.forEach((libroAPI, apiIndex) => {
            if (libroAPI) {
              const posicionOriginal = noEncontrados[apiIndex].index;
              resultadosBD[posicionOriginal] = libroAPI;
            }
          });

        } catch (apiError) {
          console.error('⚠️ Error en APIs durante lote:', apiError.message);
          // Continuar con los resultados que tenemos
        }
      }

      // 4️⃣ Progreso final
      if (onProgress) {
        onProgress(isbns.length, isbns.length);
      }

      // 5️⃣ Estadísticas finales
      const encontrados = resultadosBD.filter(libro => libro !== null).length;
      const porcentaje = Math.round((encontrados / isbns.length) * 100);

      console.log(`📊 Lote completado: ${encontrados}/${isbns.length} (${porcentaje}%)`);

      return resultadosBD;

    } catch (error) {
      console.error('💥 Error en procesamiento de lote:', error);
      throw error;
    }
  }

  /**
   * 🔧 BUSCAR LOTE EN BD CON PROGRESO MEJORADO
   */
  private static async buscarLoteEnBaseDatos(
    isbns: string[],
    opciones: OpcionesBusqueda = {},
    onProgress?: (actual: number, total: number) => void
  ): Promise<(LibroCompleto | null)[]> {

    // 🚀 ESTRATEGIA BASADA EN TAMAÑO DEL LOTE
    if (isbns.length > 20) {
      console.log(`📦 Lote grande detectado (${isbns.length} ISBNs), usando estrategia de chunks`);
      return await this.buscarLoteGrandeEnChunks(isbns, opciones, onProgress);
    } else {
      console.log(`📚 Lote pequeño (${isbns.length} ISBNs), procesamiento normal`);
      return await this.buscarLotePequeño(isbns, opciones, onProgress);
    }
  }

  /**
   * 📚 BUSCAR LOTE PEQUEÑO (≤20 ISBNs) CON PROGRESO
   */
  private static async buscarLotePequeño(
    isbns: string[],
    opciones: OpcionesBusqueda = {},
    onProgress?: (actual: number, total: number) => void
  ): Promise<(LibroCompleto | null)[]> {
    const timeout = opciones.timeout || 45000; // 45 segundos para lotes pequeños

    try {
      const params = new URLSearchParams({
        isbns: isbns.join(',')
      });
      const url = `${this.BUSCAR_LOTE_URL}?${params.toString()}`;

      console.log(`🔗 Lote pequeño: ${isbns.length} ISBNs (timeout: ${timeout}ms)`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      const resultados: LibroDatabase[] = await response.json();
      const librosCompletos = this.procesarResultados(isbns, resultados);

      // ✅ REPORTAR PROGRESO COMPLETO PARA LOTE PEQUEÑO
      if (onProgress) {
        onProgress(isbns.length, isbns.length);
      }

      return librosCompletos;

    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`⏰ Timeout en lote pequeño después de ${timeout}ms`);
        return new Array(isbns.length).fill(null);
      }
      throw error;
    }
  }

  /**
   * 📦 BUSCAR LOTE GRANDE EN CHUNKS CON PROGRESO DETALLADO
   */
  private static async buscarLoteGrandeEnChunks(
    isbns: string[],
    opciones: OpcionesBusqueda = {},
    onProgress?: (actual: number, total: number) => void
  ): Promise<(LibroCompleto | null)[]> {

    const CHUNK_SIZE = 15; // Chunks de 15 ISBNs (balance entre velocidad y estabilidad)
    const chunks: string[][] = [];

    // Dividir en chunks
    for (let i = 0; i < isbns.length; i += CHUNK_SIZE) {
      chunks.push(isbns.slice(i, i + CHUNK_SIZE));
    }

    console.log(`📦 Dividiendo ${isbns.length} ISBNs en ${chunks.length} chunks de ~${CHUNK_SIZE}`);

    const resultadosCompletos: (LibroCompleto | null)[] = [];
    const estadisticasChunks = {
      exitosos: 0,
      fallidos: 0,
      tiempoTotal: 0
    };

    const tiempoInicio = Date.now();

    // Procesar chunks secuencialmente CON PROGRESO
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const tiempoChunkInicio = Date.now();

      console.log(`🔄 Chunk ${i + 1}/${chunks.length}: ${chunk.length} ISBNs`);

      try {
        const resultadosChunk = await this.buscarChunkConTimeout(chunk, 30000); // 30s por chunk
        resultadosCompletos.push(...resultadosChunk);

        estadisticasChunks.exitosos++;

        const tiempoChunk = Date.now() - tiempoChunkInicio;
        console.log(`✅ Chunk ${i + 1} completado en ${tiempoChunk}ms`);

        // ✅ REPORTAR PROGRESO DESPUÉS DE CADA CHUNK
        if (onProgress) {
          const progresoActual = resultadosCompletos.length;
          onProgress(progresoActual, isbns.length);
        }

        // Pausa breve entre chunks (salvo el último)
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }

      } catch (error) {
        console.error(`❌ Error en chunk ${i + 1}:`, error);

        // Agregar nulls para este chunk fallido
        const chunkNulls = new Array(chunk.length).fill(null);
        resultadosCompletos.push(...chunkNulls);
        estadisticasChunks.fallidos++;

        // ✅ REPORTAR PROGRESO INCLUSO CON ERRORES
        if (onProgress) {
          const progresoActual = resultadosCompletos.length;
          onProgress(progresoActual, isbns.length);
        }
      }
    }

    estadisticasChunks.tiempoTotal = Date.now() - tiempoInicio;

    console.log(`🎉 Lote grande completado:`, {
      chunks_exitosos: estadisticasChunks.exitosos,
      chunks_fallidos: estadisticasChunks.fallidos,
      tiempo_total: `${estadisticasChunks.tiempoTotal}ms`,
      resultados_obtenidos: resultadosCompletos.length
    });

    return resultadosCompletos;
  }

  /**
   * 🕐 BUSCAR CHUNK CON TIMEOUT ESPECÍFICO
   */
  private static async buscarChunkConTimeout(
    isbns: string[],
    timeout: number
  ): Promise<(LibroCompleto | null)[]> {

    const params = new URLSearchParams({
      isbns: isbns.join(',')
    });
    const url = `${this.BUSCAR_LOTE_URL}?${params.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`⚠️ Timeout en chunk de ${isbns.length} ISBNs después de ${timeout}ms`);
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const resultados: LibroDatabase[] = await response.json();
      return this.procesarResultados(isbns, resultados);

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 🔧 PROCESAR RESULTADOS (método auxiliar)
   */
  private static procesarResultados(
    isbnsOriginales: string[],
    resultados: LibroDatabase[]
  ): (LibroCompleto | null)[] {

    const librosCompletos: (LibroCompleto | null)[] = [];

    for (let i = 0; i < isbnsOriginales.length; i++) {
      if (i < resultados.length) {
        const resultado = resultados[i];
        if (resultado && resultado.encontrado) {
          librosCompletos.push(this.convertirALibroCompleto(resultado));
        } else {
          librosCompletos.push(null);
        }
      } else {
        librosCompletos.push(null);
      }
    }

    return librosCompletos;
  }

  /**
   * Buscar por título
   */
  static async buscarPorTitulo(
    titulo: string,
    opciones: OpcionesBusqueda = {}
  ): Promise<LibroCompleto | null> {
    try {
      if (!titulo || titulo.trim().length < 3) {
        return null;
      }

      const timeout = opciones.timeout || this.DEFAULT_TIMEOUT_INDIVIDUAL;
      const params = new URLSearchParams({
        titulo: titulo.trim()
      });

      const url = `${this.BUSCAR_TITULO_URL}?${params.toString()}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      const data: LibroDatabase = await response.json();

      if (data.encontrado) {
        return this.convertirALibroCompleto(data);
      }

      return null;

    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ Timeout buscando por título');
        return null;
      }
      console.error('Error buscando por título:', error);
      return null;
    }
  }

  /**
   * 🔧 VERIFICAR CONECTIVIDAD - CON TIMEOUTS CORTOS
   */
  static async verificarConectividad(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.DEFAULT_TIMEOUT_HEALTH);

      const response = await fetch(this.HEALTH_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Error verificando conectividad:', error.message);
      return false;
    }
  }

  /**
   * Obtener estadísticas de la base de datos
   */
  static async obtenerEstadisticasDB(): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.DEFAULT_TIMEOUT_INDIVIDUAL);

      const response = await fetch(this.ESTADISTICAS_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const estadisticas = await response.json();

      console.log(`📊 Estadísticas de BD:`);
      console.log(`   📚 Total libros: ${estadisticas.totalLibros}`);
      console.log(`   📊 En LB_: ${estadisticas.tablasNuevas}`);
      console.log(`   📄 En legacy: ${estadisticas.tablasViejas}`);
      if (estadisticas.autores) console.log(`   👤 Autores: ${estadisticas.autores}`);
      if (estadisticas.editoriales) console.log(`   🏢 Editoriales: ${estadisticas.editoriales}`);
      if (estadisticas.etiquetas) console.log(`   🏷️ Etiquetas: ${estadisticas.etiquetas}`);

      return estadisticas;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ Timeout obteniendo estadísticas');
        return null;
      }
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  }

  /**
   * Mostrar estadísticas del lote procesado
   */
  private static mostrarEstadisticasLote(resultados: LibroDatabase[]) {
    const stats = {
      total: resultados.length,
      encontrados: 0,
      tablasNuevas: 0,
      tablasViejas: 0,
      noEncontrados: 0
    };

    resultados.forEach(resultado => {
      if (resultado && resultado.encontrado) {
        stats.encontrados++;
        switch (resultado.fuente) {
          case 'TABLAS_NUEVAS':
            stats.tablasNuevas++;
            break;
          case 'TABLAS_VIEJAS':
            stats.tablasViejas++;
            break;
        }
      } else {
        stats.noEncontrados++;
      }
    });

    const porcentajeExito = stats.total > 0 ? Math.round((stats.encontrados / stats.total) * 100) : 0;

    console.log(`📊 === ESTADÍSTICAS DEL LOTE ===`);
    console.log(`📈 Total: ${stats.total}`);
    console.log(`✅ Encontrados: ${stats.encontrados} (${porcentajeExito}%)`);
    console.log(`📊 Desde LB_: ${stats.tablasNuevas}`);
    console.log(`📚 Desde legacy: ${stats.tablasViejas}`);
    console.log(`❌ No encontrados: ${stats.noEncontrados}`);
  }
}
