<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Laravel\Telescope\Telescope;
class BookController extends Controller
{
    // Variables para trackear creaciones
    private array $autoresCreados = [];
    private array $editorialesCreadas = [];
    private array $etiquetasCreadas = [];

    public function index()
    {
        return Inertia::render('libros-facturas/index');
    }

    public function buscarLoteCompleto(Request $request): JsonResponse
    {
       
        try {
            $validator = Validator::make($request->all(), [
                'isbns' => 'required|string|max:5000'
            ]);
            if ($validator->fails()) {
                return response()->json(['error' => 'Parámetros inválidos'], 400);
            }
            $isbnsString = $request->query('isbns');
            $isbns = array_filter(array_map('trim', explode(',', $isbnsString)));
            if (count($isbns) > 100) {
                return response()->json(['error' => 'Máximo 100 ISBNs'], 400);
            }
            $resultadosSP = $this->ejecutarStoredProcedure($isbns);
            $resultadosCompletos = $this->completarConAPIs($resultadosSP, $isbns);
            return response()->json($resultadosCompletos);
        } catch (\Exception $e) {
            return $this->fallbackBusquedaIndividual($isbns ?? []);
        }
    }

    public function buscarISBNCompleto(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'isbn' => 'required|string|min:10|max:20'
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => 'ISBN inválido'], 400);
            }
            $isbn = $this->limpiarISBN(trim($request->query('isbn')));
            $requestLote = new Request(['isbns' => $isbn]);
            $resultadosCompletos = $this->completarConAPIs(
                $this->ejecutarStoredProcedure([$isbn]),
                [$isbn]
            );
            return response()->json($resultadosCompletos[0] ?? $this->respuestaVacia($isbn));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error interno'], 500);
        }
    }

    private function ejecutarStoredProcedure(array $isbns): array
    {
        try {
            $isbnsString = implode(',', $isbns);
            $resultados = DB::select('EXEC sp_BuscarLibrosLote ?', [$isbnsString]);
            return $resultados;
        } catch (\Exception $e) {
            throw $e;
        }
    }

    private function completarConAPIs(array $resultadosSP, array $isbnsOriginales): array
    {
        $resultadosCompletos = [];
        foreach ($isbnsOriginales as $index => $isbnOriginal) {
            $isbnLimpio = $this->limpiarISBN($isbnOriginal);
            $resultadoSP = $this->encontrarResultadoSP($resultadosSP, $isbnLimpio);
            if ($resultadoSP && $resultadoSP->encontrado) {
                $libroCompleto = $this->formatearDesdeSP($resultadoSP);
                if ($this->necesitaEnriquecimiento($libroCompleto)) {
                    $libroCompleto = $this->enriquecerConAPIs($libroCompleto);
                }
                $resultadosCompletos[] = $libroCompleto;
            } else {
                $libroAPI = $this->buscarSoloEnAPIs($isbnLimpio);
                $resultadosCompletos[] = $libroAPI;
            }
        }
        return $resultadosCompletos;
    }

    private function encontrarResultadoSP(array $resultadosSP, string $isbn): ?object
    {
        foreach ($resultadosSP as $resultado) {
            if ($resultado->ISBN === $isbn) {
                return $resultado;
            }
        }
        return null;
    }

    private function formatearDesdeSP(object $resultadoSP): array
    {
        return [
            'id' => $resultadoSP->id,
            'isbn' => $resultadoSP->ISBN,
            'titulo' => $resultadoSP->titulo,
            'autor' => [
                'nombre' => trim($resultadoSP->autor_nombre ?? '') ?: null
            ],
            'editorial' => ['nombre' => $resultadoSP->editorial_nombre],
            'genero' => ['nombre' => $resultadoSP->etiquetas ?? 'General'],
            'etiquetas' => $resultadoSP->etiquetas,
            'año_publicacion' => $resultadoSP->año_publicacion,
            'paginas' => $resultadoSP->paginas,
            'descripcion' => $resultadoSP->descripcion,
            'imagen_url' => $resultadoSP->imagen_url,
            'valorUnitario' => $resultadoSP->precio_compra,
            'encontrado' => true,
            'fuente' => $resultadoSP->fuente,
            'mensaje' => $resultadoSP->mensaje,
            'fuentes_consultadas' => [$resultadoSP->fuente . ' ✅']
        ];
    }

    private function necesitaEnriquecimiento(array $libro): bool
    {
        return empty($libro['descripcion']) ||
            empty($libro['imagen_url']) ||
            empty($libro['paginas']) ||
            empty($libro['autor']['nombre']) ||
            $libro['autor']['nombre'] === 'Desconocido' ||
            $libro['editorial']['nombre'] === 'Editorial Desconocida' ||
            $libro['genero']['nombre'] === 'General';
    }

    private function enriquecerConAPIs(array $libroBase): array
    {
        $isbn = $libroBase['isbn'];
        try {
            $datosGoogle = $this->buscarEnGoogleBooks($isbn);
            if ($datosGoogle) {
                $libroBase = $this->combinarDatosInteligente($libroBase, $datosGoogle, 'Google Books');
                $libroBase['fuentes_consultadas'][] = 'Google Books ✅';
            } else {
                $libroBase['fuentes_consultadas'][] = 'Google Books ❌';
            }
        } catch (\Exception $e) {
            $libroBase['fuentes_consultadas'][] = 'Google Books ⚠️';
        }
        try {
            $datosOL = $this->buscarEnOpenLibrary($isbn);
            if ($datosOL) {
                $libroBase = $this->combinarDatosInteligente($libroBase, $datosOL, 'OpenLibrary');
                $libroBase['fuentes_consultadas'][] = 'OpenLibrary ✅';
            } else {
                $libroBase['fuentes_consultadas'][] = 'OpenLibrary ❌';
            }
        } catch (\Exception $e) {
            $libroBase['fuentes_consultadas'][] = 'OpenLibrary ⚠️';
        }
        if (count($libroBase['fuentes_consultadas']) > 1) {
            $libroBase['fuente'] = 'COMBINADO';
        }
        return $libroBase;
    }

    private function combinarDatosInteligente(array $base, array $nuevos, string $fuente): array
    {
        if (empty($base['titulo']) && !empty($nuevos['titulo'])) {
            $base['titulo'] = $nuevos['titulo'];
        }
        if (empty($base['descripcion']) && !empty($nuevos['descripcion'])) {
            $base['descripcion'] = $nuevos['descripcion'];
        } elseif (
            !empty($base['descripcion']) && !empty($nuevos['descripcion']) &&
            strlen($nuevos['descripcion']) > strlen($base['descripcion'])
        ) {
            $base['descripcion'] = $nuevos['descripcion'];
        }
        if (empty($base['imagen_url']) && !empty($nuevos['imagen_url'])) {
            $base['imagen_url'] = $nuevos['imagen_url'];
        }
        if (empty($base['paginas']) && !empty($nuevos['paginas'])) {
            $base['paginas'] = $nuevos['paginas'];
        }
        if (empty($base['año_publicacion']) && !empty($nuevos['año_publicacion'])) {
            $base['año_publicacion'] = $nuevos['año_publicacion'];
        }
        if (empty($base['autor']['nombre']) && !empty($nuevos['autor']['nombre'])) {
            $base['autor']['nombre'] = $nuevos['autor']['nombre'];
        }
        if (($base['editorial']['nombre'] === 'Editorial Desconocida' ||
                empty($base['editorial']['nombre'])) &&
            !empty($nuevos['editorial']['nombre'])
        ) {
            $base['editorial']['nombre'] = $nuevos['editorial']['nombre'];
        }
        if (($base['genero']['nombre'] === 'General' ||
                empty($base['genero']['nombre'])) &&
            !empty($nuevos['genero']['nombre'])
        ) {
            $base['genero']['nombre'] = $nuevos['genero']['nombre'];
        }
        return $base;
    }

    private function buscarSoloEnAPIs(string $isbn): array
    {
        $resultado = $this->respuestaVacia($isbn);
        $encontradoEnAPIs = false;
        try {
            $datosGoogle = $this->buscarEnGoogleBooks($isbn);
            if ($datosGoogle) {
                $resultado = $this->combinarDatosInteligente($resultado, $datosGoogle, 'Google Books');
                $resultado['fuentes_consultadas'][] = 'Google Books ✅';
                $encontradoEnAPIs = true;
            } else {
                $resultado['fuentes_consultadas'][] = 'Google Books ❌';
            }
        } catch (\Exception $e) {
            $resultado['fuentes_consultadas'][] = 'Google Books ⚠️';
        }

        try {
            $datosOL = $this->buscarEnOpenLibrary($isbn);
            if ($datosOL) {
                $resultado = $this->combinarDatosInteligente($resultado, $datosOL, 'OpenLibrary');
                $resultado['fuentes_consultadas'][] = 'OpenLibrary ✅';
                $encontradoEnAPIs = true;
            } else {
                $resultado['fuentes_consultadas'][] = 'OpenLibrary ❌';
            }
        } catch (\Exception $e) {
            $resultado['fuentes_consultadas'][] = 'OpenLibrary ⚠️';
        }

        if ($encontradoEnAPIs) {
            $resultado['encontrado'] = true;
            $resultado['fuente'] = 'APIS_EXTERNAS';
        }

        return $resultado;
    }

    private function buscarEnGoogleBooks(string $isbn): ?array
    {
        try {
            $response = Http::timeout(8)->get('https://www.googleapis.com/books/v1/volumes', [
                'q' => "isbn:{$isbn}",
                'maxResults' => 1
            ]);

            if ($response->successful()) {
                $data = $response->json();

                if (isset($data['items'][0]['volumeInfo'])) {
                    $libro = $data['items'][0]['volumeInfo'];
                    $resultado = [];

                    if (!empty($libro['title'])) {
                        $resultado['titulo'] = $libro['title'];
                    }

                    if (!empty($libro['authors'][0])) {
                        $resultado['autor'] = ['nombre' => trim($libro['authors'][0])];
                    }
                    if (!empty($libro['publisher'])) {
                        $resultado['editorial'] = ['nombre' => $libro['publisher']];
                    }
                    if (!empty($libro['categories'][0])) {
                        $categoria = $this->mapearCategoria($libro['categories'][0]);
                        $resultado['genero'] = ['nombre' => $categoria];
                    }

                    if (!empty($libro['publishedDate'])) {
                        $resultado['año_publicacion'] = $this->extraerAño($libro['publishedDate']);
                    }

                    if (!empty($libro['pageCount']) && $libro['pageCount'] > 0) {
                        $resultado['paginas'] = $libro['pageCount'];
                    }

                    if (!empty($libro['description'])) {
                        $resultado['descripcion'] = $this->limpiarDescripcion($libro['description']);
                    }

                    if (!empty($libro['imageLinks']['thumbnail'])) {
                        $resultado['imagen_url'] = str_replace('http:', 'https:', $libro['imageLinks']['thumbnail']);
                    }

                    return empty($resultado) ? null : $resultado;
                }
            }

            return null;
        } catch (\Exception $e) {
            throw $e;
        }
    }

    private function buscarEnOpenLibrary(string $isbn): ?array
    {
        try {
            $response = Http::timeout(8)->get("https://openlibrary.org/api/books", [
                'bibkeys' => "ISBN:{$isbn}",
                'jscmd' => 'details',
                'format' => 'json'
            ]);
            if ($response->successful()) {
                $data = $response->json();
                $key = "ISBN:{$isbn}";

                if (isset($data[$key]['details'])) {
                    $detalles = $data[$key]['details'];
                    $resultado = [];

                    if (!empty($detalles['title'])) {
                        $resultado['titulo'] = $detalles['title'];
                    }

                    if (!empty($detalles['authors'][0]['name'])) {
                        $resultado['autor'] = ['nombre' => trim($detalles['authors'][0]['name'])];
                    }

                    if (!empty($detalles['publishers'][0])) {
                        $resultado['editorial'] = ['nombre' => $detalles['publishers'][0]];
                    }

                    if (!empty($detalles['subjects'][0])) {
                        $categoria = $this->mapearCategoria($detalles['subjects'][0]);
                        $resultado['genero'] = ['nombre' => $categoria];
                    }

                    if (!empty($detalles['publish_date'])) {
                        $resultado['año_publicacion'] = $this->extraerAño($detalles['publish_date']);
                    }

                    if (!empty($detalles['number_of_pages'])) {
                        $resultado['paginas'] = $detalles['number_of_pages'];
                    }

                    if (!empty($detalles['description'])) {
                        $desc = is_array($detalles['description']) ?
                            $detalles['description']['value'] : $detalles['description'];
                        $resultado['descripcion'] = $this->limpiarDescripcion($desc);
                    }

                    return empty($resultado) ? null : $resultado;
                }
            }

            return null;
        } catch (\Exception $e) {
            throw $e;
        }
    }

    private function mapearCategoria(string $categoriaOriginal): string
    {
        $mapeo = [
            'Fiction' => 'Ficción',
            'Family & Relationships' => 'Familia y Relaciones',
            'Biography & Autobiography' => 'Biografía',
            'History' => 'Historia',
            'Science' => 'Ciencia',
            'Technology & Engineering' => 'Tecnología',
            'Business & Economics' => 'Negocios',
            'Self-Help' => 'Autoayuda',
            'Health & Fitness' => 'Salud',
            'Cooking' => 'Cocina',
            'Travel' => 'Viajes',
            'Religion' => 'Religión',
            'Philosophy' => 'Filosofía',
            'Psychology' => 'Psicología',
            'Education' => 'Educación',
            'Juvenile Fiction' => 'Literatura Juvenil',
            'Young Adult Fiction' => 'Ficción para Jóvenes',
            'Comics & Graphic Novels' => 'Cómics',
            'Poetry' => 'Poesía',
            'Drama' => 'Teatro',
            'Literary Criticism' => 'Crítica Literaria',
            'Art' => 'Arte',
            'Music' => 'Música',
            'Sports & Recreation' => 'Deportes',
            'Nature' => 'Naturaleza',
            'Political Science' => 'Ciencia Política',
            'Law' => 'Derecho',
            'Medical' => 'Medicina',
            'Mathematics' => 'Matemáticas',
            'Literature' => 'Literatura',
            'Fantasy' => 'Fantasía',
            'Romance' => 'Romance',
            'Mystery' => 'Misterio',
            'Thriller' => 'Thriller',
            'Horror' => 'Terror',
            'Adventure' => 'Aventura'
        ];

        return $mapeo[$categoriaOriginal] ?? $categoriaOriginal;
    }

    private function fallbackBusquedaIndividual(array $isbns): JsonResponse
    {
        $resultados = [];

        foreach ($isbns as $isbn) {
            $isbnLimpio = $this->limpiarISBN($isbn);
            $resultado = $this->buscarSoloEnAPIs($isbnLimpio);
            $resultado['fuentes_consultadas'][] = 'BD_LOCAL ❌ (Fallback)';
            $resultados[] = $resultado;
        }

        return response()->json($resultados);
    }

    private function extraerAño(string $fecha): ?int
    {
        if (preg_match('/(\d{4})/', $fecha, $matches)) {
            $año = intval($matches[1]);
            return ($año >= 1900 && $año <= date('Y') + 1) ? $año : null;
        }
        return null;
    }

    private function limpiarDescripcion(string $descripcion): string
    {
        $limpia = strip_tags($descripcion);
        $limpia = html_entity_decode($limpia);
        return trim($limpia);
    }

    private function respuestaVacia(string $isbn): array
    {
        return [
            'id' => null,
            'isbn' => $isbn,
            'titulo' => null,
            'autor' => ['nombre' => null],
            'editorial' => ['nombre' => null],
            'genero' => ['nombre' => null],
            'etiquetas' => null,
            'año_publicacion' => null,
            'paginas' => null,
            'descripcion' => null,
            'imagen_url' => null,
            'valorUnitario' => null,
            'encontrado' => false,
            'fuente' => 'NO_ENCONTRADO',
            'fuentes_consultadas' => []
        ];
    }

    private function limpiarISBN(string $isbn): string
    {
        return preg_replace('/[^0-9X]/', '', strtoupper($isbn));
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'Guardado'], 201);
    }

    public function estadisticas(): JsonResponse
    {
        try {
            $tablasNuevas = 0;
            try {
                $tablasNuevas = DB::selectOne('SELECT COUNT(*) as total FROM LB_libros')->total ?? 0;
                Log::info("📊 Libros en LB_libros: {$tablasNuevas}");
            } catch (\Exception $e) {
                // Tabla no disponible
            }
            $tablasViejas = 0;
            try {
                $tablasViejas = DB::selectOne('SELECT COUNT(*) as total FROM products')->total ?? 0;
            } catch (\Exception $e) {
                // Tabla no disponible
            }

            $autores = 0;
            try {
                $autores = DB::selectOne('SELECT COUNT(*) as total FROM LB_autores')->total ?? 0;
            } catch (\Exception $e) {
                // Tabla no disponible
            }

            $editoriales = 0;
            try {
                $editoriales = DB::selectOne('SELECT COUNT(*) as total FROM LB_editoriales')->total ?? 0;
            } catch (\Exception $e) {
                // Tabla no disponible
            }

            $etiquetas = 0;
            try {
                $etiquetas = DB::selectOne('SELECT COUNT(*) as total FROM LB_etiquetas')->total ?? 0;
            } catch (\Exception $e) {
                // Tabla no disponible
            }

            $estadisticas = [
                'totalLibros' => $tablasNuevas + $tablasViejas,
                'tablasNuevas' => $tablasNuevas,
                'tablasViejas' => $tablasViejas,
                'autores' => $autores,
                'editoriales' => $editoriales,
                'etiquetas' => $etiquetas,
                'coberturaNuevas' => $tablasNuevas + $tablasViejas > 0
                    ? round(($tablasNuevas / ($tablasNuevas + $tablasViejas)) * 100, 2)
                    : 0,
                'timestamp' => now()->toISOString()
            ];
            return response()->json($estadisticas);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error obteniendo estadísticas',
                'mensaje' => 'No se pudieron cargar las estadísticas de la base de datos',
                'details' => config('app.debug') ? $e->getMessage() : 'Error interno',
                'totalLibros' => 0,
                'tablasNuevas' => 0,
                'tablasViejas' => 0,
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    public function health(): JsonResponse
    {
        try {
            DB::select('SELECT 1 as test');
            Log::info('✅ Health check exitoso');

            return response()->json([
                'status' => 'ok',
                'database' => 'connected',
                'timestamp' => now()->toISOString(),
                'message' => 'Base de datos conectada correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'database' => 'disconnected',
                'timestamp' => now()->toISOString(),
                'message' => 'Error de conexión a base de datos',
                'error' => config('app.debug') ? $e->getMessage() : 'Database connection failed'
            ], 500);
        }
    }

    public function buscarPorISBN(Request $request): JsonResponse
    {
        try {
            $isbn = $request->query('isbn');
            if (!$isbn) {
                return response()->json([
                    'error' => 'ISBN requerido',
                    'message' => 'Debe proporcionar un ISBN para buscar'
                ], 400);
            }

            $isbnLimpio = preg_replace('/[^0-9X]/', '', strtoupper(trim($isbn)));
            if (strlen($isbnLimpio) < 10) {
                return response()->json([
                    'error' => 'ISBN inválido',
                    'message' => 'El ISBN debe tener al menos 10 dígitos'
                ], 400);
            }

            $libro = null;

            try {
                $resultado = DB::select("
                SELECT TOP 1
                    lbl.id, lbl.isbn, lbl.titulo,
                    lba.nombre AS autor_nombre,
                    lbe.nombre AS editorial_nombre,
                    'General' AS genero_nombre,
                    lbl.año AS año_publicacion,
                    NULL AS paginas,
                    lbl.descripcion, lbl.imagen_url, lbl.precio_compra,
                    'TABLAS_NUEVAS' AS fuente,
                    1 AS encontrado,
                    'Encontrado en base de datos actual (LB_*)' AS mensaje
                FROM LB_libros lbl
                LEFT JOIN LB_autores lba ON lba.id = lbl.autor_id
                LEFT JOIN LB_editoriales lbe ON lbe.id = lbl.editorial_id
                WHERE lbl.isbn = ?
            ", [$isbnLimpio]);

                if (!empty($resultado)) {
                    $libro = $resultado[0];
                }
            } catch (\Exception $e) {
                Log::warning("⚠️ Error buscando en LB_libros: " . $e->getMessage());
            }

            if (!$libro) {
                try {
                    $resultado = DB::select("
                    SELECT TOP 1
                        p.id, p.isbn, p.name AS titulo,
                        'Autor Desconocido' AS autor_nombre,
                        ISNULL(e.name, 'Editorial Desconocida') AS editorial_nombre,
                        'General' AS genero_nombre,
                        NULL AS año_publicacion, NULL AS paginas,
                        NULL AS descripcion, NULL AS imagen_url, NULL AS precio_compra,
                        'TABLAS_VIEJAS' AS fuente,
                        1 AS encontrado,
                        'Encontrado en base de datos legacy (products)' AS mensaje
                    FROM products p
                    LEFT JOIN editorials e ON e.id = p.editorial_id
                    WHERE p.isbn = ?
                ", [$isbnLimpio]);

                    if (!empty($resultado)) {
                        $libro = $resultado[0];
                    }
                } catch (\Exception $e) {
                    Log::warning("⚠️ Error buscando en products: " . $e->getMessage());
                }
            }

            if ($libro) {
                return response()->json([
                    'id' => $libro->id,
                    'isbn' => $libro->isbn,
                    'titulo' => $libro->titulo,
                    'autor_nombre' => $libro->autor_nombre,
                    'editorial_nombre' => $libro->editorial_nombre,
                    'genero_nombre' => $libro->genero_nombre,
                    'año_publicacion' => $libro->año_publicacion,
                    'paginas' => $libro->paginas,
                    'descripcion' => $libro->descripcion,
                    'imagen_url' => $libro->imagen_url,
                    'precio_compra' => $libro->precio_compra,
                    'fuente' => $libro->fuente,
                    'encontrado' => true,
                    'mensaje' => $libro->mensaje
                ]);
            }

            return response()->json([
                'id' => null,
                'isbn' => $isbnLimpio,
                'titulo' => null,
                'encontrado' => false,
                'mensaje' => 'Libro no encontrado en la base de datos',
                'fuente' => 'NO_ENCONTRADO'
            ]);
        } catch (\Exception $e) {
            Log::error('💥 Error buscando por ISBN: ' . $e->getMessage());

            return response()->json([
                'error' => 'Error interno del servidor',
                'mensaje' => 'No se pudo procesar la búsqueda por ISBN',
                'details' => config('app.debug') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }

    public function buscarPorTitulo(Request $request): JsonResponse
    {
        try {
            $titulo = $request->query('titulo');

            if (!$titulo || strlen(trim($titulo)) < 3) {
                return response()->json([
                    'error' => 'Título inválido',
                    'message' => 'El título debe tener al menos 3 caracteres'
                ], 400);
            }

            $tituloLimpio = trim($titulo);
            Log::info("🔍 Buscando libro por título: '{$tituloLimpio}'");

            $resultado = DB::select("
            SELECT TOP 1
                lbl.id, lbl.isbn, lbl.titulo,
                lba.nombre AS autor_nombre,
                lbe.nombre AS editorial_nombre,
                'General' AS genero_nombre,
                lbl.año AS año_publicacion,
                NULL AS paginas,
                lbl.descripcion, lbl.imagen_url, lbl.precio_compra,
                'TABLAS_NUEVAS' AS fuente,
                1 AS encontrado,
                'Encontrado por título en LB_libros' AS mensaje
            FROM LB_libros lbl
            LEFT JOIN LB_autores lba ON lba.id = lbl.autor_id
            LEFT JOIN LB_editoriales lbe ON lbe.id = lbl.editorial_id
            WHERE lbl.titulo LIKE ?
            ORDER BY
                CASE WHEN lbl.titulo = ? THEN 1 ELSE 2 END,
                LEN(lbl.titulo)
        ", ["%{$tituloLimpio}%", $tituloLimpio]);

            if (empty($resultado)) {
                $resultado = DB::select("
                SELECT TOP 1
                    p.id, p.isbn, p.name AS titulo,
                    'Autor Desconocido' AS autor_nombre,
                    ISNULL(e.name, 'Editorial Desconocida') AS editorial_nombre,
                    'General' AS genero_nombre,
                    NULL AS año_publicacion, NULL AS paginas,
                    NULL AS descripcion, NULL AS imagen_url, NULL AS precio_compra,
                    'TABLAS_VIEJAS' AS fuente,
                    1 AS encontrado,
                    'Encontrado por título en products' AS mensaje
                FROM products p
                LEFT JOIN editorials e ON e.id = p.editorial_id
                WHERE p.name LIKE ?
                ORDER BY
                    CASE WHEN p.name = ? THEN 1 ELSE 2 END,
                    LEN(p.name)
            ", ["%{$tituloLimpio}%", $tituloLimpio]);
            }

            if (!empty($resultado)) {
                $libro = $resultado[0];

                return response()->json([
                    'id' => $libro->id,
                    'isbn' => $libro->isbn,
                    'titulo' => $libro->titulo,
                    'autor_nombre' => $libro->autor_nombre,
                    'editorial_nombre' => $libro->editorial_nombre,
                    'genero_nombre' => $libro->genero_nombre,
                    'año_publicacion' => $libro->año_publicacion,
                    'paginas' => $libro->paginas,
                    'descripcion' => $libro->descripcion,
                    'imagen_url' => $libro->imagen_url,
                    'precio_compra' => $libro->precio_compra,
                    'fuente' => $libro->fuente,
                    'encontrado' => true,
                    'mensaje' => $libro->mensaje
                ]);
            }

            return response()->json([
                'id' => null,
                'isbn' => null,
                'titulo' => $tituloLimpio,
                'encontrado' => false,
                'mensaje' => 'Libro no encontrado por título',
                'fuente' => 'NO_ENCONTRADO'
            ]);
        } catch (\Exception $e) {
            Log::error('💥 Error buscando por título: ' . $e->getMessage());

            return response()->json([
                'error' => 'Error interno del servidor',
                'mensaje' => 'No se pudo procesar la búsqueda por título'
            ], 500);
        }
    }


    public function guardarLibrosEnInventario(Request $request)
    {

        try {
            $validator = Validator::make($request->all(), [
                'libros' => 'required|array|min:1',
                'libros.*.isbn' => 'required|string',
                'libros.*.titulo' => 'required|string',
                'libros.*.cantidad' => 'required|integer|min:1',
                'libros.*.valorUnitario' => 'required|numeric|min:0',
            ]);

            if ($validator->fails()) {
                Log::warning('❌ Validación fallida', $validator->errors()->toArray());

                // ✅ SIEMPRE retornar con Inertia cuando viene de un componente Inertia
                return back()->withErrors($validator)->with([
                    'error' => 'Datos inválidos. Verifique la información de los libros.',
                    'errores' => $validator->errors()
                ]);
            }

            $librosData = $request->input('libros');
            DB::beginTransaction();

            $resultados = [
                'guardados' => 0,
                'errores' => 0,
                'detalles' => [],
                'autores_creados' => 0,
                'editoriales_creadas' => 0,
                'etiquetas_creadas' => 0
            ];

            foreach ($librosData as $index => $libroData) {
                try {
                    $resultado = $this->guardarLibroIndividual($libroData);
                    $resultados['guardados']++;
                    $resultados['detalles'][] = [
                        'isbn' => $libroData['isbn'],
                        'titulo' => $libroData['titulo'],
                        'id_generado' => $resultado['libro_id'],
                        'status' => 'success'
                    ];

                    if ($resultado['autor_creado']) $resultados['autores_creados']++;
                    if ($resultado['editorial_creada']) $resultados['editoriales_creadas']++;
                    if ($resultado['etiqueta_creada']) $resultados['etiquetas_creadas']++;
                } catch (\Exception $e) {
                    Log::error("❌ Error guardando libro {$index}: " . $e->getMessage());
                    $resultados['errores']++;
                    $resultados['detalles'][] = [
                        'isbn' => $libroData['isbn'] ?? 'N/A',
                        'titulo' => $libroData['titulo'] ?? 'N/A',
                        'status' => 'error',
                        'error' => $e->getMessage()
                    ];
                }
            }

            DB::commit();

            $estadisticasPost = [
                'libros_total' => DB::selectOne('SELECT COUNT(*) as total FROM LB_libros')->total ?? 0,
                'autores_total' => DB::selectOne('SELECT COUNT(*) as total FROM LB_autores')->total ?? 0,
                'editoriales_total' => DB::selectOne('SELECT COUNT(*) as total FROM LB_editoriales')->total ?? 0,
                'etiquetas_total' => DB::selectOne('SELECT COUNT(*) as total FROM LB_etiquetas')->total ?? 0,
                'ultima_actualizacion' => now()->toISOString()
            ];
            $mensajeExito = "Guardado completado: {$resultados['guardados']} libros registrados exitosamente";
            return redirect()->back()->with([
                'success' => $mensajeExito,
                'resultado' => $resultados,
                'estadisticasPost' => $estadisticasPost
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('💥 Error general guardando libros: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            // ✅ CORREGIDO: Usar back() también para errores
            return back()->with([
                'error' => "Error al guardar los libros: {$e->getMessage()}",
                'debug' => config('app.debug') ? $e->getMessage() : null
            ]);
        }
    }

    public function estadisticasPostGuardado(): JsonResponse
    {
        try {
            $stats = [
                'libros_total' => DB::selectOne('SELECT COUNT(*) as total FROM LB_libros')->total ?? 0,
                'autores_total' => DB::selectOne('SELECT COUNT(*) as total FROM LB_autores')->total ?? 0,
                'editoriales_total' => DB::selectOne('SELECT COUNT(*) as total FROM LB_editoriales')->total ?? 0,
                'etiquetas_total' => DB::selectOne('SELECT COUNT(*) as total FROM LB_etiquetas')->total ?? 0,
                'ultima_actualizacion' => now()->toISOString()
            ];

            return response()->json($stats);
        } catch (\Exception $e) {
            Log::error('Error obteniendo estadísticas post-guardado: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error obteniendo estadísticas',
                'stats' => [
                    'libros_total' => 0,
                    'autores_total' => 0,
                    'editoriales_total' => 0,
                    'etiquetas_total' => 0,
                    'ultima_actualizacion' => now()->toISOString()
                ]
            ], 500);
        }
    }

private function validarYLimpiarDatos(array $libroData): array
{
    $limites = [
        'isbn' => 20,
        'titulo' => 255,
        'descripcion' => null, // nvarchar(max) - SIN LÍMITE
        'imagen_url' => 500,
    ];

    $datosLimpios = [];

    $datosLimpios['isbn'] = substr(trim($libroData['isbn']), 0, $limites['isbn']);
    $datosLimpios['titulo'] = substr(trim($libroData['titulo']), 0, $limites['titulo']);

    // SOLO LIMPIAR CARACTERES, NO TRUNCAR
    $descripcion = $libroData['descripcion'] ?? '';
    $descripcion = str_replace(["\r\n", "\r", "\n"], ' ', $descripcion);
    $descripcion = preg_replace('/\s+/', ' ', $descripcion);
    $descripcion = trim($descripcion);

    $datosLimpios['descripcion'] = $descripcion;
    $datosLimpios['imagen_url'] = substr(trim($libroData['imagen_url'] ?? ''), 0, $limites['imagen_url']);

    $datosLimpios['año'] = isset($libroData['año_publicacion']) && is_numeric($libroData['año_publicacion'])
        ? (int)$libroData['año_publicacion']
        : null;

    $datosLimpios['precio'] = isset($libroData['valorUnitario']) && is_numeric($libroData['valorUnitario'])
        ? (float)$libroData['valorUnitario']
        : 0;

    // ✅ AGREGADO: Campo páginas
    $datosLimpios['paginas'] = isset($libroData['paginas']) && is_numeric($libroData['paginas'])
        ? (int)$libroData['paginas']
        : null;

    return $datosLimpios;
}

public  function guardarLibroIndividual(array $libroData): array
{
    try {
        Log::info("🔧 Procesando libro individual:", [
            'isbn' => $libroData['isbn'] ?? 'N/A',
            'titulo' => $libroData['titulo'] ?? 'N/A',
            'estructura_etiquetas' => $libroData['etiquetas'] ?? 'No definido'
        ]);

        $autorId = $this->obtenerOCrearAutor(
            $libroData['autor']['nombre'] ?? 'Autor Desconocido'
        );

        $editorialId = $this->obtenerOCrearEditorial(
            $libroData['editorial']['nombre'] ?? 'Editorial Desconocida'
        );

        // ✅ PROCESAR ETIQUETAS MÚLTIPLES - COMPATIBLE CON EL NUEVO FRONTEND
        $etiquetasIds = $this->procesarEtiquetasMultiples($libroData);
     //   Log::info("🏷️ Etiquetas procesadas:", ['ids' => $etiquetasIds]);
        $datosLimpios = $this->validarYLimpiarDatos($libroData);

        $libroExistente = DB::selectOne("
            SELECT id FROM LB_libros WHERE isbn = ?
        ", [$datosLimpios['isbn']]);

        if ($libroExistente) {
            $this->actualizarLibroConDescripcionLarga($libroExistente->id, $datosLimpios, $autorId, $editorialId);
            Log::info("📝 Libro actualizado: {$datosLimpios['titulo']} (ID: {$libroExistente->id})");
            $libroId = $libroExistente->id;

            // ✅ ACTUALIZAR MÚLTIPLES ETIQUETAS
            $this->actualizarEtiquetasDelLibro($libroId, $etiquetasIds);
        } else {
            $libroId = $this->crearLibroConDescripcionLarga($datosLimpios, $autorId, $editorialId);
            Log::info("➕ Libro creado: {$datosLimpios['titulo']} (ID: {$libroId})");

            // ✅ INSERTAR MÚLTIPLES ETIQUETAS
            $this->insertarEtiquetasDelLibro($libroId, $etiquetasIds);
        }

        return [
            'libro_id' => $libroId,
            'autor_creado' => isset($this->autoresCreados[$autorId]),
            'editorial_creada' => isset($this->editorialesCreadas[$editorialId]),
            'etiqueta_creada' => !empty(array_intersect($etiquetasIds, array_keys($this->etiquetasCreadas))),
            'etiquetas_procesadas' => count($etiquetasIds)
        ];

    } catch (\Exception $e) {
        Log::error("❌ Error en guardarLibroIndividual:", [
            'error' => $e->getMessage(),
            'libro' => $libroData['titulo'] ?? 'N/A',
            'trace' => $e->getTraceAsString()
        ]);
        throw $e;
    }
}

private function procesarEtiquetasMultiples(array $libroData): array
{
    $etiquetasIds = [];

    // ✅ OPCIÓN 1: Formato nuevo del frontend (array de strings)
    if (isset($libroData['etiquetas']) && is_array($libroData['etiquetas'])) {
        Log::info("🏷️ Formato nuevo: array de etiquetas", $libroData['etiquetas']);

        foreach ($libroData['etiquetas'] as $etiquetaNombre) {
            if (!empty(trim($etiquetaNombre))) {
                $etiquetasIds[] = $this->obtenerOCrearEtiqueta(trim($etiquetaNombre));
            }
        }
    }
    // ✅ OPCIÓN 2: Formato anterior (genero.nombre con comas)
    elseif (isset($libroData['genero']['nombre']) && !empty($libroData['genero']['nombre'])) {
        $generoTexto = $libroData['genero']['nombre'];
        Log::info("🏷️ Formato anterior: genero con texto", ['genero' => $generoTexto]);

        // Dividir por comas si las tiene
        if (strpos($generoTexto, ',') !== false) {
            $etiquetas = array_map('trim', explode(',', $generoTexto));
            $etiquetas = array_filter($etiquetas, function($e) { return !empty($e); });

            Log::info("🏷️ Dividiendo por comas:", $etiquetas);

            foreach ($etiquetas as $etiquetaNombre) {
                $etiquetasIds[] = $this->obtenerOCrearEtiqueta($etiquetaNombre);
            }
        } else {
            // Solo una etiqueta
            $etiquetasIds[] = $this->obtenerOCrearEtiqueta($generoTexto);
        }
    }
    // ✅ FALLBACK: Sin etiquetas definidas
    else {
        Log::info("🏷️ Sin etiquetas definidas, usando 'General'");
        $etiquetasIds[] = $this->obtenerOCrearEtiqueta('General');
    }

    // ✅ VALIDACIÓN: Al menos una etiqueta
    if (empty($etiquetasIds)) {
        Log::warning("⚠️ No se procesó ninguna etiqueta, usando 'General'");
        $etiquetasIds[] = $this->obtenerOCrearEtiqueta('General');
    }

    Log::info("🏷️ Etiquetas finales:", [
        'cantidad' => count($etiquetasIds),
        'ids' => $etiquetasIds
    ]);

    return $etiquetasIds;
}

private function insertarEtiquetasDelLibro(int $libroId, array $etiquetasIds): void
{
    try {
        foreach ($etiquetasIds as $etiquetaId) {
            $existeRelacion = DB::selectOne("
                SELECT id FROM LB_Etiquetas_Libros
                WHERE id_libro = ? AND id_etiqueta = ?
            ", [$libroId, $etiquetaId]);

            if (!$existeRelacion) {
                DB::insert("
                    INSERT INTO LB_Etiquetas_Libros (id_etiqueta, id_libro, created_at, created_by)
                    VALUES (?, ?, GETDATE(), 1)
                ", [$etiquetaId, $libroId]);

                Log::info("🏷️ Etiqueta {$etiquetaId} asignada al libro {$libroId}");
            }
        }
    } catch (\Exception $e) {
        Log::error("❌ Error insertando etiquetas múltiples:", [
            'libro_id' => $libroId,
            'etiquetas_ids' => $etiquetasIds,
            'error' => $e->getMessage()
        ]);

    }
}

private function actualizarEtiquetasDelLibro(int $libroId, array $etiquetasIds): void
{
    try {
        // Eliminar etiquetas existentes
        DB::delete("DELETE FROM LB_Etiquetas_Libros WHERE id_libro = ?", [$libroId]);

        // Insertar nuevas etiquetas
        $this->insertarEtiquetasDelLibro($libroId, $etiquetasIds);

        Log::info("🔄 Etiquetas actualizadas para libro {$libroId}: " . implode(', ', $etiquetasIds));

    } catch (\Exception $e) {
        Log::error("❌ Error actualizando etiquetas múltiples:", [
            'libro_id' => $libroId,
            'error' => $e->getMessage()
        ]);

    }
}


private function crearLibroConDescripcionLarga(array $datos, int $autorId, int $editorialId): int
{
    try {
        // Insertar libro SIN descripción primero
        $libroId = DB::select("
            INSERT INTO LB_libros (
                isbn, titulo, autor_id, editorial_id,
                año, precio_compra, imagen_url, paginas,
                activo, created_at, updated_at
            ) OUTPUT INSERTED.id
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
        ", [
            $datos['isbn'],
            $datos['titulo'],
            $autorId,
            $editorialId,
            $datos['año'],
            $datos['precio'],
            $datos['imagen_url'],
            $datos['paginas'],
            1
        ])[0]->id;

        // Actualizar descripción por separado si existe
        if (!empty($datos['descripcion'])) {
            DB::update("UPDATE LB_libros SET descripcion = ? WHERE id = ?", [
                $datos['descripcion'],
                $libroId
            ]);
        }

        return $libroId;
    } catch (\Exception $e) {
        Log::error("❌ Error creando libro con descripción larga: " . $e->getMessage());
        throw $e;
    }
}

private function actualizarLibroConDescripcionLarga(int $libroId, array $datos, int $autorId, int $editorialId): void
{
    try {
        // Actualizar campos básicos sin descripción
        DB::update("
            UPDATE LB_libros SET
                titulo = ?,
                autor_id = ?,
                editorial_id = ?,
                año = ?,
                precio_compra = ?,
                imagen_url = ?,
                paginas = ?,
                updated_at = GETDATE()
            WHERE id = ?
        ", [
            $datos['titulo'],
            $autorId,
            $editorialId,
            $datos['año'],
            $datos['precio'],
            $datos['imagen_url'],
            $datos['paginas'],
            $libroId
        ]);

        // Actualizar descripción por separado si existe
        if (!empty($datos['descripcion'])) {
            DB::update("UPDATE LB_libros SET descripcion = ? WHERE id = ?", [
                $datos['descripcion'],
                $libroId
            ]);
        }
    } catch (\Exception $e) {
        Log::error("❌ Error actualizando libro con descripción larga: " . $e->getMessage());
        throw $e;
    }
}

    /**
     * 🏷️ INSERTAR ETIQUETA EN TABLA AUXILIAR
     */
    private function insertarEtiquetaLibro(int $libroId, int $etiquetaId): void
    {
        try {
            $existeRelacion = DB::selectOne("
                SELECT id FROM LB_Etiquetas_Libros
                WHERE id_libro = ? AND id_etiqueta = ?
            ", [$libroId, $etiquetaId]);

            if (!$existeRelacion) {
                DB::insert("
                    INSERT INTO LB_Etiquetas_Libros (id_etiqueta, id_libro, created_at, created_by)
                    VALUES (?, ?, GETDATE(), 1)
                ", [$etiquetaId, $libroId]);

                Log::info("🏷️ Etiqueta {$etiquetaId} asignada al libro {$libroId}");
            } else {
                Log::info("🏷️ Etiqueta {$etiquetaId} ya existe para libro {$libroId}");
            }
        } catch (\Exception $e) {
            Log::error("❌ Error insertando etiqueta en tabla auxiliar: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * 🔄 ACTUALIZAR ETIQUETA EN TABLA AUXILIAR
     */
    private function actualizarEtiquetaLibro(int $libroId, int $etiquetaId): void
    {
        try {
            DB::delete("DELETE FROM LB_Etiquetas_Libros WHERE id_libro = ?", [$libroId]);
            $this->insertarEtiquetaLibro($libroId, $etiquetaId);
            Log::info("🔄 Etiqueta actualizada para libro {$libroId}");
        } catch (\Exception $e) {
            Log::error("❌ Error actualizando etiqueta: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * 👤 OBTENER O CREAR AUTOR
     */
    private function obtenerOCrearAutor(string $nombre): int
    {
        $nombre = trim($nombre);

        if (empty($nombre) || $nombre === 'Autor Desconocido') {
            $nombre = 'Autor Desconocido';
        }

        $autorExistente = DB::selectOne("
            SELECT id FROM LB_autores WHERE nombre = ?
        ", [$nombre]);

        if ($autorExistente) {
            Log::info("👤 Autor encontrado: {$nombre} (ID: {$autorExistente->id})");
            return $autorExistente->id;
        }

        $autorId = DB::select("
            INSERT INTO LB_autores (
                nombre, nacionalidad, activo,
                created_at, updated_at
            ) OUTPUT INSERTED.id VALUES (?, ?, ?, GETDATE(), GETDATE())
        ", [
            $nombre,
            'Desconocida',
            1
        ])[0]->id;

        $this->autoresCreados[$autorId] = true;
        Log::info("➕ Autor creado: {$nombre} (ID: {$autorId})");

        return $autorId;
    }

    /**
     * 🏢 OBTENER O CREAR EDITORIAL
     */
    private function obtenerOCrearEditorial(string $nombre): int
    {
        $nombre = trim($nombre);

        if (empty($nombre) || $nombre === 'Editorial Desconocida') {
            $nombre = 'Editorial Desconocida';
        }

        $editorialExistente = DB::selectOne("
            SELECT id FROM LB_editoriales WHERE nombre = ?
        ", [$nombre]);

        if ($editorialExistente) {
            Log::info("🏢 Editorial encontrada: {$nombre} (ID: {$editorialExistente->id})");
            return $editorialExistente->id;
        }

        $editorialId = DB::select("
            INSERT INTO LB_editoriales (
                nombre, contacto, activo,
                created_at, updated_at
            ) OUTPUT INSERTED.id VALUES (?, ?, ?, GETDATE(), GETDATE())
        ", [
            $nombre,
            'Sin contacto',
            1
        ])[0]->id;

        $this->editorialesCreadas[$editorialId] = true;
        Log::info("➕ Editorial creada: {$nombre} (ID: {$editorialId})");

        return $editorialId;
    }

private function obtenerOCrearEtiqueta(string $nombre): int
{
    $nombre = trim($nombre);
    if (empty($nombre)) {
        $nombre = 'General';
    }

    // ✅ BUSCAR ETIQUETA EXISTENTE
    $etiquetaExistente = DB::selectOne("
        SELECT id FROM LB_Etiquetas WHERE nombre = ?
    ", [$nombre]);

    if ($etiquetaExistente) {
        Log::info("🏷️ Etiqueta encontrada: {$nombre} (ID: {$etiquetaExistente->id})");
        return $etiquetaExistente->id;
    }

    // ✅ CREAR NUEVA ETIQUETA - INCLUYENDO SLUG
    try {
        Log::info("➕ Creando nueva etiqueta: {$nombre}");
        
        // Generar slug a partir del nombre
        $slug = $this->generarSlug($nombre);
        
        // Escapar valores para SQL
        $nombreEscapado = str_replace("'", "''", $nombre);
        $slugEscapado = str_replace("'", "''", $slug);
        $userId = auth()->id() ?? 1;
        
        // SQL incluyendo la columna slug
        $sql = "
            INSERT INTO LB_Etiquetas (nombre, slug, descripcion, activo, created_at, created_by)
            OUTPUT INSERTED.id
            VALUES ('{$nombreEscapado}', '{$slugEscapado}', '{$nombreEscapado}', 1, GETDATE(), {$userId})
        ";
        
        Log::info("🔧 Ejecutando SQL: " . $sql);
        
        $resultado = DB::select($sql);
        
        if (empty($resultado)) {
            throw new \Exception("No se obtuvo respuesta del INSERT");
        }
        
        $etiquetaId = $resultado[0]->id;
        $this->etiquetasCreadas[$etiquetaId] = true;
        Log::info("✅ Etiqueta creada exitosamente: {$nombre} (ID: {$etiquetaId})");
        
        return $etiquetaId;

    } catch (\Exception $e) {
        Log::error("❌ Error creando etiqueta: {$nombre}", [
            'error' => $e->getMessage(),
            'sql_intentado' => $sql ?? 'N/A'
        ]);
        
        // Verificar si se creó a pesar del error
        $etiquetaExistente = DB::selectOne("
            SELECT id FROM LB_Etiquetas WHERE nombre = ?
        ", [$nombre]);
        
        if ($etiquetaExistente) {
            Log::info("🔄 Etiqueta encontrada después del error: {$nombre} (ID: {$etiquetaExistente->id})");
            return $etiquetaExistente->id;
        }
        
        // FALLBACK: Usar etiqueta existente
        Log::warning("⚠️ Fallback a etiqueta existente ID 8");
        return 8; // ID que ya existe en tu BD
    }
}

/**
 * Generar slug a partir del nombre
 */
private function generarSlug(string $nombre): string
{
    // Convertir a minúsculas
    $slug = strtolower($nombre);
    
    // Reemplazar caracteres especiales
    $slug = str_replace(['á', 'é', 'í', 'ó', 'ú', 'ñ'], ['a', 'e', 'i', 'o', 'u', 'n'], $slug);
    
    // Reemplazar espacios y caracteres especiales con guiones
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    
    // Limpiar guiones al inicio y final
    $slug = trim($slug, '-');
    
    return $slug;
}
}
