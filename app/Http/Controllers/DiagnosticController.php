<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\JsonResponse;

class DiagnosticController extends Controller
{
    /**
     * 🔍 DIAGNÓSTICO COMPLETO DE TIMEOUTS
     */
    public function diagnosticarTimeout(Request $request): JsonResponse
    {
        $isbns = ['9786073826112', '9786073854061', '9786073832335', '9786073843614', '9786073824941'];

        set_time_limit(300); // 5 minutos para diagnóstico
        ini_set('memory_limit', '1024M');

        $diagnostico = [
            'inicio' => microtime(true),
            'configuracion_php' => $this->verificarConfiguracionPHP(),
            'pruebas' => []
        ];

        Log::info('🔍 === INICIANDO DIAGNÓSTICO DE TIMEOUT ===');

        // 1. PROBAR SOLO EL STORED PROCEDURE
        $diagnostico['pruebas']['stored_procedure'] = $this->probarStoredProcedure($isbns);

        // 2. PROBAR SOLO UNA API EXTERNA
        $diagnostico['pruebas']['google_books'] = $this->probarGoogleBooks($isbns[0]);

        // 3. PROBAR EL FLUJO COMPLETO PASO A PASO
        $diagnostico['pruebas']['flujo_completo'] = $this->probarFlujoCompleto($isbns);

        // 4. PROBAR DIFERENTES TAMAÑOS DE LOTE
        $diagnostico['pruebas']['diferentes_tamanos'] = $this->probarDiferentesTamanos();

        $diagnostico['tiempo_total'] = round((microtime(true) - $diagnostico['inicio']) * 1000, 2);

        Log::info('🔍 Diagnóstico completado en ' . $diagnostico['tiempo_total'] . 'ms');

        return response()->json($diagnostico);
    }

    /**
     * 🔧 VERIFICAR CONFIGURACIÓN PHP
     */
    private function verificarConfiguracionPHP(): array
    {
        return [
            'max_execution_time' => ini_get('max_execution_time'),
            'memory_limit' => ini_get('memory_limit'),
            'post_max_size' => ini_get('post_max_size'),
            'max_input_time' => ini_get('max_input_time'),
            'default_socket_timeout' => ini_get('default_socket_timeout'),
            'user_agent' => ini_get('user_agent'),
            'auto_detect_line_endings' => ini_get('auto_detect_line_endings'),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version()
        ];
    }

    /**
     * 🧪 PROBAR SOLO EL STORED PROCEDURE
     */
    private function probarStoredProcedure(array $isbns): array
    {
        $resultado = [
            'inicio' => microtime(true),
            'exito' => false,
            'registros_devueltos' => 0,
            'error' => null,
            'tiempo_ms' => 0
        ];

        try {
            Log::info('🧪 Probando SOLO el Stored Procedure...');

            $isbnsString = implode(',', $isbns);
            $registros = DB::select('EXEC sp_BuscarLibrosLote ?', [$isbnsString]);

            $resultado['tiempo_ms'] = round((microtime(true) - $resultado['inicio']) * 1000, 2);
            $resultado['exito'] = true;
            $resultado['registros_devueltos'] = count($registros);

            Log::info("✅ SP exitoso: {$resultado['registros_devueltos']} registros en {$resultado['tiempo_ms']}ms");

        } catch (\Exception $e) {
            $resultado['tiempo_ms'] = round((microtime(true) - $resultado['inicio']) * 1000, 2);
            $resultado['error'] = $e->getMessage();
            Log::error("💥 Error en SP: " . $e->getMessage());
        }

        return $resultado;
    }

    /**
     * 🧪 PROBAR SOLO GOOGLE BOOKS
     */
    private function probarGoogleBooks(string $isbn): array
    {
        $resultado = [
            'inicio' => microtime(true),
            'exito' => false,
            'datos_recibidos' => false,
            'error' => null,
            'tiempo_ms' => 0,
            'timeout_usado' => 5
        ];

        try {
            Log::info("🧪 Probando Google Books para ISBN: {$isbn}");

            $response = Http::timeout(5)->get('https://www.googleapis.com/books/v1/volumes', [
                'q' => "isbn:{$isbn}",
                'maxResults' => 1
            ]);

            $resultado['tiempo_ms'] = round((microtime(true) - $resultado['inicio']) * 1000, 2);

            if ($response->successful()) {
                $data = $response->json();
                $resultado['exito'] = true;
                $resultado['datos_recibidos'] = isset($data['items'][0]['volumeInfo']);
                Log::info("✅ Google Books exitoso en {$resultado['tiempo_ms']}ms");
            } else {
                $resultado['error'] = "HTTP {$response->status()}";
                Log::warning("⚠️ Google Books falló: HTTP {$response->status()}");
            }

        } catch (\Exception $e) {
            $resultado['tiempo_ms'] = round((microtime(true) - $resultado['inicio']) * 1000, 2);
            $resultado['error'] = $e->getMessage();
            Log::error("💥 Error en Google Books: " . $e->getMessage());
        }

        return $resultado;
    }

    /**
     * 🧪 PROBAR FLUJO COMPLETO PASO A PASO
     */
    private function probarFlujoCompleto(array $isbns): array
    {
        $resultado = [
            'inicio' => microtime(true),
            'pasos' => [],
            'tiempo_total_ms' => 0,
            'exito_general' => false
        ];

        // Paso 1: SP
        $inicioSP = microtime(true);
        try {
            $isbnsString = implode(',', $isbns);
            $registrosSP = DB::select('EXEC sp_BuscarLibrosLote ?', [$isbnsString]);
            $tiempoSP = round((microtime(true) - $inicioSP) * 1000, 2);

            $resultado['pasos']['sp'] = [
                'exito' => true,
                'tiempo_ms' => $tiempoSP,
                'registros' => count($registrosSP)
            ];

            Log::info("✅ Paso SP: {$tiempoSP}ms, {$resultado['pasos']['sp']['registros']} registros");

        } catch (\Exception $e) {
            $tiempoSP = round((microtime(true) - $inicioSP) * 1000, 2);
            $resultado['pasos']['sp'] = [
                'exito' => false,
                'tiempo_ms' => $tiempoSP,
                'error' => $e->getMessage()
            ];
            Log::error("💥 Paso SP falló: " . $e->getMessage());
            return $resultado; // Si falla el SP, no continuar
        }

        // Paso 2: Procesar resultados del SP
        $inicioProcesamiento = microtime(true);
        try {
            $librosFormateados = [];
            foreach ($registrosSP as $registro) {
                if ($registro->encontrado) {
                    $librosFormateados[] = [
                        'isbn' => $registro->ISBN,
                        'titulo' => $registro->titulo,
                        'encontrado' => true
                    ];
                }
            }

            $tiempoProcesamiento = round((microtime(true) - $inicioProcesamiento) * 1000, 2);
            $resultado['pasos']['procesamiento'] = [
                'exito' => true,
                'tiempo_ms' => $tiempoProcesamiento,
                'libros_procesados' => count($librosFormateados)
            ];

            Log::info("✅ Paso Procesamiento: {$tiempoProcesamiento}ms");

        } catch (\Exception $e) {
            $tiempoProcesamiento = round((microtime(true) - $inicioProcesamiento) * 1000, 2);
            $resultado['pasos']['procesamiento'] = [
                'exito' => false,
                'tiempo_ms' => $tiempoProcesamiento,
                'error' => $e->getMessage()
            ];
            Log::error("💥 Paso Procesamiento falló: " . $e->getMessage());
        }

        // Paso 3: Simular respuesta JSON
        $inicioJSON = microtime(true);
        try {
            $respuestaFinal = json_encode($librosFormateados ?? []);
            $tiempoJSON = round((microtime(true) - $inicioJSON) * 1000, 2);

            $resultado['pasos']['json'] = [
                'exito' => true,
                'tiempo_ms' => $tiempoJSON,
                'tamano_json' => strlen($respuestaFinal)
            ];

            Log::info("✅ Paso JSON: {$tiempoJSON}ms, {$resultado['pasos']['json']['tamano_json']} bytes");

        } catch (\Exception $e) {
            $tiempoJSON = round((microtime(true) - $inicioJSON) * 1000, 2);
            $resultado['pasos']['json'] = [
                'exito' => false,
                'tiempo_ms' => $tiempoJSON,
                'error' => $e->getMessage()
            ];
            Log::error("💥 Paso JSON falló: " . $e->getMessage());
        }

        $resultado['tiempo_total_ms'] = round((microtime(true) - $resultado['inicio']) * 1000, 2);
        $resultado['exito_general'] =
            ($resultado['pasos']['sp']['exito'] ?? false) &&
            ($resultado['pasos']['procesamiento']['exito'] ?? false) &&
            ($resultado['pasos']['json']['exito'] ?? false);

        return $resultado;
    }

    /**
     * 🧪 PROBAR DIFERENTES TAMAÑOS DE LOTE
     */
    private function probarDiferentesTamanos(): array
    {
        $isbnsBase = ['9786073826112', '9786073854061', '9786073832335', '9786073843614', '9786073824941'];
        $tamanos = [1, 3, 5, 10, 15, 20];
        $resultados = [];

        foreach ($tamanos as $tamano) {
            if ($tamano > count($isbnsBase)) {
                // Duplicar ISBNs para alcanzar el tamaño deseado
                $isbns = array_slice(array_merge(
                    array_fill(0, ceil($tamano / count($isbnsBase)), $isbnsBase)
                )[0], 0, $tamano);
            } else {
                $isbns = array_slice($isbnsBase, 0, $tamano);
            }

            $inicio = microtime(true);
            try {
                $isbnsString = implode(',', $isbns);
                $registros = DB::select('EXEC sp_BuscarLibrosLote ?', [$isbnsString]);
                $tiempo = round((microtime(true) - $inicio) * 1000, 2);

                $resultados[$tamano] = [
                    'exito' => true,
                    'tiempo_ms' => $tiempo,
                    'registros' => count($registros),
                    'tiempo_por_isbn' => round($tiempo / $tamano, 2)
                ];

                Log::info("📊 Tamaño {$tamano}: {$tiempo}ms ({$resultados[$tamano]['tiempo_por_isbn']}ms/ISBN)");

            } catch (\Exception $e) {
                $tiempo = round((microtime(true) - $inicio) * 1000, 2);
                $resultados[$tamano] = [
                    'exito' => false,
                    'tiempo_ms' => $tiempo,
                    'error' => $e->getMessage()
                ];
                Log::error("💥 Tamaño {$tamano} falló: " . $e->getMessage());
            }

            // Pausa entre pruebas
            usleep(100000); // 0.1 segundos
        }

        return $resultados;
    }

    /**
     * 🧪 PROBAR TIMEOUT ESPECÍFICAMENTE
     */
    public function probarTimeoutEspecifico(Request $request): JsonResponse
    {
        $isbns = explode(',', $request->query('isbns', '9786073826112,9786073854061,9786073832335'));
        $timeoutSegundos = (int)$request->query('timeout', 30);

        Log::info("🧪 === PRUEBA DE TIMEOUT ESPECÍFICO ===");
        Log::info("📚 ISBNs: " . count($isbns));
        Log::info("⏰ Timeout: {$timeoutSegundos}s");

        // Configurar timeout específico
        set_time_limit($timeoutSegundos);
        ini_set('max_execution_time', $timeoutSegundos);

        $inicio = microtime(true);
        $resultado = [
            'timeout_configurado' => $timeoutSegundos,
            'cantidad_isbns' => count($isbns),
            'inicio' => $inicio
        ];

        try {
            // Simular el proceso completo
            $isbnsString = implode(',', $isbns);

            Log::info("🔍 Ejecutando SP...");
            $tiempoSP = microtime(true);
            $registros = DB::select('EXEC sp_BuscarLibrosLote ?', [$isbnsString]);
            $resultado['tiempo_sp'] = round((microtime(true) - $tiempoSP) * 1000, 2);

            Log::info("🔄 Procesando resultados...");
            $tiempoProceso = microtime(true);
            $procesados = [];
            foreach ($registros as $registro) {
                $procesados[] = [
                    'isbn' => $registro->ISBN,
                    'titulo' => $registro->titulo,
                    'encontrado' => $registro->encontrado
                ];
            }
            $resultado['tiempo_procesamiento'] = round((microtime(true) - $tiempoProceso) * 1000, 2);

            $resultado['tiempo_total'] = round((microtime(true) - $inicio) * 1000, 2);
            $resultado['exito'] = true;
            $resultado['registros_procesados'] = count($procesados);

            Log::info("✅ Prueba exitosa: {$resultado['tiempo_total']}ms total");

        } catch (\Exception $e) {
            $resultado['tiempo_total'] = round((microtime(true) - $inicio) * 1000, 2);
            $resultado['exito'] = false;
            $resultado['error'] = $e->getMessage();
            $resultado['tipo_error'] = get_class($e);

            Log::error("💥 Prueba falló: " . $e->getMessage());
        }

        return response()->json($resultado);
    }

    /**
     * 🧪 PROBAR CONFIGURACIONES DIFERENTES
     */
    public function probarConfiguraciones(): JsonResponse
    {
        $configuraciones = [
            ['memory' => '256M', 'timeout' => 30],
            ['memory' => '512M', 'timeout' => 60],
            ['memory' => '1024M', 'timeout' => 120],
            ['memory' => '2048M', 'timeout' => 180]
        ];

        $isbns = ['9786073826112', '9786073854061', '9786073832335', '9786073843614', '9786073824941'];
        $resultados = [];

        foreach ($configuraciones as $index => $config) {
            Log::info("🧪 Probando configuración {$index}: {$config['memory']}, {$config['timeout']}s");

            // Aplicar configuración
            ini_set('memory_limit', $config['memory']);
            set_time_limit($config['timeout']);

            $inicio = microtime(true);
            try {
                $isbnsString = implode(',', $isbns);
                $registros = DB::select('EXEC sp_BuscarLibrosLote ?', [$isbnsString]);
                $tiempo = round((microtime(true) - $inicio) * 1000, 2);

                $resultados["config_{$index}"] = [
                    'configuracion' => $config,
                    'exito' => true,
                    'tiempo_ms' => $tiempo,
                    'registros' => count($registros),
                    'memory_peak' => memory_get_peak_usage(true),
                    'memory_current' => memory_get_usage(true)
                ];

            } catch (\Exception $e) {
                $tiempo = round((microtime(true) - $inicio) * 1000, 2);
                $resultados["config_{$index}"] = [
                    'configuracion' => $config,
                    'exito' => false,
                    'tiempo_ms' => $tiempo,
                    'error' => $e->getMessage(),
                    'memory_peak' => memory_get_peak_usage(true),
                    'memory_current' => memory_get_usage(true)
                ];
            }

            // Pausa entre configuraciones
            sleep(1);
        }

        return response()->json($resultados);
    }
}
