<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Exception;
use App\Http\Controllers\BookController;

class FacturaLibrosController extends Controller
{
    /**
     * 📄 PROCESAR FACTURA COMPLETA CON PROVEEDOR Y LIBROS
     */
    public function procesarFacturaCompleta(Request $request)
    {
        try {
            // 🔍 VALIDACIÓN COMPLETA
            $validator = Validator::make($request->all(), [
                'libros' => 'required|array|min:1',
                'libros.*.isbn' => 'required|string',
                'libros.*.titulo' => 'required|string',
                'libros.*.cantidad' => 'required|integer|min:1',
                'libros.*.valorUnitario' => 'required|numeric|min:0',
                'factura_info' => 'required|array',
                'factura_info.rfc' => 'required|string|max:13',
                'factura_info.folio' => 'required|string|max:50',
                'factura_info.serie' => 'nullable|string|max:25',
                'factura_info.fecha' => 'required|date',
                'factura_info.subtotal' => 'required|numeric|min:0',
                'factura_info.total' => 'required|numeric|min:0',
                'proveedor_info' => 'nullable|array',
                'proveedor_info.nombre' => 'required_with:proveedor_info|string|max:255',
                'proveedor_info.rfc' => 'required_with:proveedor_info|string|max:13',
            ]);

            if ($validator->fails()) {
                Log::warning('❌ Validación fallida en factura completa', $validator->errors()->toArray());
                return back()->withErrors($validator)->with([
                    'error' => 'Datos de factura inválidos',
                    'errores' => $validator->errors()
                ]);
            }

            $librosData = $request->input('libros');
            $facturaInfo = $request->input('factura_info');
            $proveedorInfo = $request->input('proveedor_info');
            $metadata = $request->input('metadata', []);

            Log::info('📄 === PROCESANDO FACTURA COMPLETA ===', [
                'folio' => $facturaInfo['serie'] . '-' . $facturaInfo['folio'],
                'rfc' => $facturaInfo['rfc'],
                'total_libros' => count($librosData),
                'valor_factura' => $facturaInfo['total'],
                'tiene_proveedor_info' => !empty($proveedorInfo)
            ]);

            DB::beginTransaction();

            // 🏢 PASO 1: OBTENER O CREAR PROVEEDOR
            $proveedor = $this->obtenerOCrearProveedorPorRFC($facturaInfo['rfc'], $proveedorInfo);

            // 📄 PASO 2: CREAR O ACTUALIZAR FACTURA
            $factura = $this->obtenerOCrearFactura($facturaInfo, $proveedor->id);

            // 📚 PASO 3: PROCESAR LIBROS Y CREAR DETALLES
            $resultados = $this->procesarLibrosYDetalles($librosData, $factura->id);

            // 📊 PASO 4: ACTUALIZAR TOTALES DE FACTURA
            $this->actualizarTotalesFactura($factura->id);

            DB::commit();

            $response = [
                'success' => true,
                'message' => "Factura procesada exitosamente: {$resultados['guardados']} libros registrados",
                'resultado' => $resultados,
                'factura_info' => [
                    'id' => $factura->id,
                    'serie_folio' => ($factura->serie ?: '') . '-' . $factura->folio,
                    'proveedor' => $proveedor->nombre,
                    'rfc' => $proveedor->rfc,
                    'total' => $factura->total,
                    'uuid' => $factura->uuid_fiscal
                ],
                'estadisticasPost' => $this->obtenerEstadisticasGenerales()
            ];

            Log::info('✅ Factura procesada exitosamente', [
                'factura_id' => $factura->id,
                'proveedor_id' => $proveedor->id,
                'libros_guardados' => $resultados['guardados']
            ]);

            return redirect()->back()->with($response);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('💥 Error procesando factura completa: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return back()->with([
                'error' => "Error al procesar la factura: {$e->getMessage()}"
            ]);
        }
    }

    /**
     * 🏢 OBTENER O CREAR PROVEEDOR POR RFC - MEJORADO
     */
private function obtenerOCrearProveedorPorRFC(string $rfc, ?array $proveedorInfo = null): object
{
    $rfc = strtoupper(trim($rfc));

    // Buscar proveedor existente por RFC
    $proveedor = DB::selectOne("
        SELECT * FROM LB_proveedores WHERE rfc = ?
    ", [$rfc]);

    if ($proveedor) {
        Log::info("🏢 Proveedor encontrado por RFC", [
            'id' => $proveedor->id,
            'nombre' => $proveedor->nombre,
            'rfc' => $proveedor->rfc
        ]);

        // Si tenemos nueva información del proveedor, actualizar
        if ($proveedorInfo && !empty($proveedorInfo['nombre'])) {
            $this->actualizarProveedorSiNecesario($proveedor->id, $proveedorInfo);
            // Recargar proveedor actualizado
            $proveedor = DB::selectOne("SELECT * FROM LB_proveedores WHERE id = ?", [$proveedor->id]);
        }

        return $proveedor;
    }

    // Crear nuevo proveedor
    Log::info("➕ Creando nuevo proveedor para RFC: {$rfc}");

    // ✅ CORREGIDO: Usar parámetros individuales en lugar de array_values
    $resultado = DB::select("
        INSERT INTO LB_proveedores (
            nombre, rfc, contacto, telefono, email, direccion, 
            codigo_postal, regimen_fiscal, activo, created_at, created_by
        ) OUTPUT INSERTED.* 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ", [
        // ✅ Parámetros individuales correctamente ordenados
        $proveedorInfo['nombre'] ?? "Proveedor {$rfc}",
        $rfc,
        $proveedorInfo['contacto'] ?? null,
        $proveedorInfo['telefono'] ?? null,
        $proveedorInfo['email'] ?? null,
        $proveedorInfo['direccion'] ?? null,
        $proveedorInfo['codigo_postal'] ?? null,
        $proveedorInfo['regimen_fiscal'] ?? '601',
        1, // activo
        now(),
        auth()->id() ?? 1
    ]);

    $nuevoProveedor = $resultado[0];

    Log::info("✅ Proveedor creado", [
        'id' => $nuevoProveedor->id,
        'nombre' => $nuevoProveedor->nombre,
        'rfc' => $nuevoProveedor->rfc
    ]);

    return $nuevoProveedor;
}

    /**
     * 📄 OBTENER O CREAR FACTURA - MEJORADO
     */
private function obtenerOCrearFactura(array $facturaInfo, int $proveedorId): object
{
    $serie = $facturaInfo['serie'] ?? '';
    $folio = $facturaInfo['folio'];
    $uuid = $facturaInfo['uuid_fiscal'] ?? null;

    // Buscar factura existente
    $query = "SELECT * FROM LB_facturas_libros WHERE serie = ? AND folio = ?";
    $params = [$serie, $folio];

    if ($uuid) {
        $query .= " AND uuid_fiscal = ?";
        $params[] = $uuid;
    }

    $factura = DB::selectOne($query, $params);

    if ($factura) {
        Log::info("📄 Factura encontrada", [
            'id' => $factura->id,
            'serie_folio' => $serie . '-' . $folio
        ]);

        // Actualizar información si es necesario
        $this->actualizarFacturaSiNecesario($factura->id, $facturaInfo, $proveedorId);

        return DB::selectOne("SELECT * FROM LB_facturas_libros WHERE id = ?", [$factura->id]);
    }

    // Crear nueva factura
    Log::info("➕ Creando nueva factura: {$serie}-{$folio}");

    // ✅ CORREGIDO: Usar parámetros individuales en lugar de array_values
    $resultado = DB::select("
        INSERT INTO LB_facturas_libros (
            proveedor_id, serie, folio, numero_factura, uuid_fiscal,
            fecha, fecha_timbrado, subtotal, descuento, impuestos, total,
            moneda, tipo_cambio, condiciones_pago, metodo_pago, forma_pago,
            uso_cfdi, estado, observaciones, created_at, created_by
        ) OUTPUT INSERTED.*
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ", [
        // ✅ Parámetros individuales correctamente ordenados
        $proveedorId,
        $serie,
        $folio,
        $serie . $folio, // numero_factura
        $uuid,
        $facturaInfo['fecha'],
        $facturaInfo['fecha_timbrado'] ?? $facturaInfo['fecha'],
        $facturaInfo['subtotal'] ?? 0,
        $facturaInfo['descuento'] ?? 0,
        $facturaInfo['impuestos'] ?? 0,
        $facturaInfo['total'],
        $facturaInfo['moneda'] ?? 'MXN',
        $facturaInfo['tipo_cambio'] ?? 1,
        $facturaInfo['condiciones_pago'] ?? 'CONTADO',
        $facturaInfo['metodo_pago'] ?? 'PPD',
        $facturaInfo['forma_pago'] ?? '99',
        $facturaInfo['uso_cfdi'] ?? 'G01',
        'pagado', // estado
        $facturaInfo['observaciones'] ?? null,
        now(),
        auth()->id() ?? 1
    ]);

    $nuevaFactura = $resultado[0];

    Log::info("✅ Factura creada", [
        'id' => $nuevaFactura->id,
        'serie_folio' => $serie . '-' . $folio,
        'total' => $nuevaFactura->total
    ]);

    return $nuevaFactura;
}
    /**
     * 📚 PROCESAR LIBROS Y CREAR DETALLES DE FACTURA - MEJORADO
     */
    private function procesarLibrosYDetalles(array $librosData, int $facturaId): array
    {
        $resultados = [
            'guardados' => 0,
            'errores' => 0,
            'detalles' => [],
            'autores_creados' => 0,
            'editoriales_creadas' => 0,
            'etiquetas_creadas' => 0,
            'total_items' => 0,
            'total_valor' => 0
        ];

        // Instanciar BookController una sola vez
        $bookController = app(BookController::class);

        foreach ($librosData as $index => $libroData) {
            try {
                Log::info("📖 Procesando libro #{$index}: {$libroData['isbn']}");

                // 1. Verificar si el libro ya existe
                $libroExistente = DB::selectOne("
                    SELECT id FROM LB_libros WHERE isbn = ?
                ", [$libroData['isbn']]);

                if ($libroExistente) {
                    // 2A. Si existe, solo crear el detalle de factura
                    $libroId = $libroExistente->id;
                    Log::info("📚 Libro ya existe en catálogo, usando ID: {$libroId}");
                } else {
                    // 2B. Si no existe, crear usando BookController
                    $bookController = new BookController(); // o injectado
                    $resultadoLibro = $bookController->guardarLibroIndividual($libroData);
                    $libroId = $resultadoLibro['libro_id'];

                    // Contadores de elementos creados
                    if ($resultadoLibro['autor_creado']) $resultados['autores_creados']++;
                    if ($resultadoLibro['editorial_creada']) $resultados['editoriales_creadas']++;
                    if ($resultadoLibro['etiqueta_creada']) $resultados['etiquetas_creadas']++;
                }

                // 3. Verificar si ya existe el detalle para esta factura
                $detalleExistente = DB::selectOne("
                    SELECT id FROM LB_detalles_factura_libros 
                    WHERE factura_id = ? AND libro_id = ?
                ", [$facturaId, $libroId]);

                if ($detalleExistente) {
                    // Actualizar cantidad si ya existe
                    DB::update("
                        UPDATE LB_detalles_factura_libros 
                        SET cantidad = cantidad + ?,
                            subtotal = (cantidad + ?) * precio_unitario,
                            total = ((cantidad + ?) * precio_unitario) - descuento,
                            updated_at = GETDATE()
                        WHERE id = ?
                    ", [
                        $libroData['cantidad'],
                        $libroData['cantidad'],
                        $libroData['cantidad'],
                        $detalleExistente->id
                    ]);

                    $detalleId = $detalleExistente->id;
                    Log::info("📝 Actualizada cantidad en detalle existente ID: {$detalleId}");
                } else {
                    // Crear nuevo detalle
                    $subtotal = $libroData['valorUnitario'] * $libroData['cantidad'];
                    $descuento = $libroData['descuento'] ?? 0;
                    $total = $subtotal - $descuento;

                    $resultado = DB::select("
                        INSERT INTO LB_detalles_factura_libros (
                            factura_id, libro_id, clave_prodserv, descripcion,
                            unidad, cantidad, precio_unitario, descuento,
                            subtotal, impuesto_trasladado, total, created_at
                        ) OUTPUT INSERTED.id
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
                    ", [
                        $facturaId,
                        $libroId,
                        $libroData['clave_prodserv'] ?? '55101500',
                        $libroData['titulo'],
                        'PZA',
                        $libroData['cantidad'],
                        $libroData['valorUnitario'],
                        $descuento,
                        $subtotal,
                        0, // Impuesto
                        $total
                    ]);

                    $detalleId = $resultado[0]->id;
                }

                $resultados['guardados']++;
                $resultados['total_items'] += $libroData['cantidad'];
                $resultados['total_valor'] += ($libroData['valorUnitario'] * $libroData['cantidad']);

                $resultados['detalles'][] = [
                    'isbn' => $libroData['isbn'],
                    'titulo' => $libroData['titulo'],
                    'libro_id' => $libroId,
                    'detalle_id' => $detalleId,
                    'cantidad' => $libroData['cantidad'],
                    'precio_unitario' => $libroData['valorUnitario'],
                    'status' => 'success'
                ];

                Log::info("✅ Libro #{$index} procesado exitosamente", [
                    'libro_id' => $libroId,
                    'detalle_id' => $detalleId
                ]);
            } catch (\Exception $e) {
                Log::error("❌ Error procesando libro #{$index}", [
                    'isbn' => $libroData['isbn'] ?? 'N/A',
                    'error' => $e->getMessage()
                ]);

                $resultados['errores']++;
                $resultados['detalles'][] = [
                    'isbn' => $libroData['isbn'] ?? 'N/A',
                    'titulo' => $libroData['titulo'] ?? 'N/A',
                    'status' => 'error',
                    'error' => $e->getMessage()
                ];
            }
        }

        Log::info("📊 Procesamiento de libros completado", [
            'factura_id' => $facturaId,
            'guardados' => $resultados['guardados'],
            'errores' => $resultados['errores'],
            'total_items' => $resultados['total_items'],
            'total_valor' => $resultados['total_valor']
        ]);

        return $resultados;
    }

    /**
     * 📊 ACTUALIZAR TOTALES DE FACTURA
     */
    private function actualizarTotalesFactura(int $facturaId): void
    {
        try {
            // Calcular totales desde los detalles
            $totales = DB::selectOne("
                SELECT 
                    COUNT(*) as total_conceptos,
                    SUM(cantidad) as total_items,
                    SUM(subtotal) as subtotal,
                    SUM(descuento) as descuento,
                    SUM(impuesto_trasladado) as impuestos,
                    SUM(total) as total
                FROM LB_detalles_factura_libros
                WHERE factura_id = ?
            ", [$facturaId]);

            if ($totales && $totales->total_conceptos > 0) {
                DB::update("
                    UPDATE LB_facturas_libros
                    SET 
                        subtotal = ?,
                        descuento = ?,
                        impuestos = ?,
                        total = ?,
                        updated_at = GETDATE()
                    WHERE id = ?
                ", [
                    $totales->subtotal ?? 0,
                    $totales->descuento ?? 0,
                    $totales->impuestos ?? 0,
                    $totales->total ?? 0,
                    $facturaId
                ]);

                Log::info("📊 Totales de factura actualizados", [
                    'factura_id' => $facturaId,
                    'conceptos' => $totales->total_conceptos,
                    'items' => $totales->total_items,
                    'total' => $totales->total
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Error actualizando totales de factura: " . $e->getMessage());
        }
    }

    /**
     * 🔄 ACTUALIZAR PROVEEDOR SI ES NECESARIO
     */
    private function actualizarProveedorSiNecesario(int $proveedorId, array $proveedorInfo): void
    {
        $datosActualizacion = [];

        // Solo actualizar campos que tengan valores nuevos y diferentes
        $camposActualizables = [
            'nombre',
            'contacto',
            'telefono',
            'email',
            'direccion',
            'codigo_postal',
            'regimen_fiscal'
        ];

        foreach ($camposActualizables as $campo) {
            if (!empty($proveedorInfo[$campo])) {
                $datosActualizacion[$campo] = $proveedorInfo[$campo];
            }
        }

        if (!empty($datosActualizacion)) {
            // Construir query dinámicamente
            $sets = array_map(fn($campo) => "{$campo} = ?", array_keys($datosActualizacion));
            $valores = array_values($datosActualizacion);
            $valores[] = now(); // updated_at
            $valores[] = $proveedorId; // WHERE id = ?

            $query = "UPDATE LB_proveedores SET " .
                implode(', ', $sets) .
                ", updated_at = ? WHERE id = ?";

            DB::update($query, $valores);

            Log::info("🔄 Proveedor actualizado", [
                'proveedor_id' => $proveedorId,
                'campos_actualizados' => array_keys($datosActualizacion)
            ]);
        }
    }

    /**
     * 🔄 ACTUALIZAR FACTURA SI ES NECESARIO
     */
    private function actualizarFacturaSiNecesario(int $facturaId, array $facturaInfo, int $proveedorId): void
    {
        $datosActualizacion = [];

        // Campos que pueden actualizarse
        if (isset($facturaInfo['uuid_fiscal'])) {
            $datosActualizacion['uuid_fiscal'] = $facturaInfo['uuid_fiscal'];
        }
        if (isset($facturaInfo['fecha_timbrado'])) {
            $datosActualizacion['fecha_timbrado'] = $facturaInfo['fecha_timbrado'];
        }
        if (isset($facturaInfo['observaciones'])) {
            $datosActualizacion['observaciones'] = $facturaInfo['observaciones'];
        }

        // Actualizar proveedor si cambió
        $facturaActual = DB::selectOne("SELECT proveedor_id FROM LB_facturas_libros WHERE id = ?", [$facturaId]);
        if ($facturaActual && $facturaActual->proveedor_id != $proveedorId) {
            $datosActualizacion['proveedor_id'] = $proveedorId;
        }

        if (!empty($datosActualizacion)) {
            $sets = array_map(fn($campo) => "{$campo} = ?", array_keys($datosActualizacion));
            $valores = array_values($datosActualizacion);
            $valores[] = now(); // updated_at
            $valores[] = $facturaId; // WHERE id = ?

            $query = "UPDATE LB_facturas_libros SET " .
                implode(', ', $sets) .
                ", updated_at = ? WHERE id = ?";

            DB::update($query, $valores);

            Log::info("🔄 Factura actualizada", [
                'factura_id' => $facturaId,
                'campos_actualizados' => array_keys($datosActualizacion)
            ]);
        }
    }

    /**
     * 📊 OBTENER ESTADÍSTICAS GENERALES
     */
    private function obtenerEstadisticasGenerales(): array
    {
        try {
            return [
                'libros_total' => DB::selectOne('SELECT COUNT(*) as total FROM LB_libros')->total ?? 0,
                'autores_total' => DB::selectOne('SELECT COUNT(*) as total FROM LB_autores')->total ?? 0,
                'editoriales_total' => DB::selectOne('SELECT COUNT(*) as total FROM LB_editoriales')->total ?? 0,
                'etiquetas_total' => DB::selectOne('SELECT COUNT(*) as total FROM LB_etiquetas')->total ?? 0,
                'proveedores_total' => DB::selectOne('SELECT COUNT(*) as total FROM LB_proveedores')->total ?? 0,
                'facturas_total' => DB::selectOne('SELECT COUNT(*) as total FROM LB_facturas_libros')->total ?? 0,
                'facturas_mes' => DB::selectOne("
                    SELECT COUNT(*) as total FROM LB_facturas_libros 
                    WHERE MONTH(fecha) = MONTH(GETDATE()) 
                    AND YEAR(fecha) = YEAR(GETDATE())
                ")->total ?? 0,
                'valor_inventario' => DB::selectOne("
                    SELECT SUM(precio_compra) as total FROM LB_libros WHERE activo = 1
                ")->total ?? 0,
                'ultima_actualizacion' => now()->toISOString()
            ];
        } catch (\Exception $e) {
            Log::error('Error obteniendo estadísticas generales: ' . $e->getMessage());
            return [
                'error' => true,
                'message' => 'Error obteniendo estadísticas',
                'ultima_actualizacion' => now()->toISOString()
            ];
        }
    }

    /**
     * 🔍 BUSCAR FACTURAS
     */
    public function buscarFacturas(Request $request)
    {
        try {
            $query = DB::table('LB_facturas_libros as f')
                ->join('LB_proveedores as p', 'f.proveedor_id', '=', 'p.id')
                ->select(
                    'f.*',
                    'p.nombre as proveedor_nombre',
                    'p.rfc as proveedor_rfc',
                    DB::raw('(SELECT COUNT(*) FROM LB_detalles_factura_libros WHERE factura_id = f.id) as total_conceptos'),
                    DB::raw('(SELECT SUM(cantidad) FROM LB_detalles_factura_libros WHERE factura_id = f.id) as total_items')
                );

            // Filtros
            if ($request->has('folio')) {
                $query->where('f.folio', 'LIKE', '%' . $request->folio . '%');
            }

            if ($request->has('proveedor')) {
                $query->where('p.nombre', 'LIKE', '%' . $request->proveedor . '%');
            }

            if ($request->has('fecha_inicio')) {
                $query->where('f.fecha', '>=', $request->fecha_inicio);
            }

            if ($request->has('fecha_fin')) {
                $query->where('f.fecha', '<=', $request->fecha_fin);
            }

            if ($request->has('estado')) {
                $query->where('f.estado', $request->estado);
            }

            $facturas = $query->orderBy('f.fecha', 'desc')
                ->paginate($request->per_page ?? 20);

            return response()->json($facturas);
        } catch (\Exception $e) {
            Log::error('Error buscando facturas: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al buscar facturas',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 📄 VER DETALLE DE FACTURA
     */
    public function verDetalleFactura($id)
    {
        try {
            $factura = DB::selectOne("
                SELECT f.*, p.nombre as proveedor_nombre, p.rfc as proveedor_rfc,
                       p.email as proveedor_email, p.telefono as proveedor_telefono
                FROM LB_facturas_libros f
                JOIN LB_proveedores p ON f.proveedor_id = p.id
                WHERE f.id = ?
            ", [$id]);

            if (!$factura) {
                return response()->json(['error' => 'Factura no encontrada'], 404);
            }

            $detalles = DB::select("
                SELECT d.*, l.isbn, l.titulo, l.imagen_url,
                       a.nombre as autor_nombre,
                       e.nombre as editorial_nombre
                FROM LB_detalles_factura_libros d
                JOIN LB_libros l ON d.libro_id = l.id
                LEFT JOIN LB_autores a ON l.autor_id = a.id
                LEFT JOIN LB_editoriales e ON l.editorial_id = e.id
                WHERE d.factura_id = ?
                ORDER BY d.id
            ", [$id]);

            return response()->json([
                'factura' => $factura,
                'detalles' => $detalles,
                'resumen' => [
                    'total_conceptos' => count($detalles),
                    'total_items' => array_sum(array_column($detalles, 'cantidad')),
                    'subtotal' => $factura->subtotal,
                    'descuento' => $factura->descuento,
                    'impuestos' => $factura->impuestos,
                    'total' => $factura->total
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error obteniendo detalle de factura: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al obtener detalle de factura',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 📝 ACTUALIZAR ESTADO DE FACTURA
     */
    public function actualizarEstadoFactura(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'estado' => 'required|in:pendiente,pagada,cancelada',
                'observaciones' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => 'Datos inválidos', 'errors' => $validator->errors()], 400);
            }

            DB::update("
                UPDATE LB_facturas_libros 
                SET estado = ?, 
                    observaciones = COALESCE(?, observaciones),
                    updated_at = GETDATE(),
                    updated_by = ?
                WHERE id = ?
            ", [
                $request->estado,
                $request->observaciones,
                auth()->id() ?? 1,
                $id
            ]);

            // Registrar en bitácora
            DB::insert("
                INSERT INTO LB_bitacora_facturas (factura_id, accion, descripcion, usuario_id, created_at)
                VALUES (?, ?, ?, ?, GETDATE())
            ", [
                $id,
                'CAMBIO_ESTADO',
                "Estado cambiado a: {$request->estado}",
                auth()->id() ?? 1
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estado actualizado correctamente'
            ]);
        } catch (\Exception $e) {
            Log::error('Error actualizando estado de factura: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al actualizar estado',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🗑️ ELIMINAR DETALLE DE FACTURA
     */
    public function eliminarDetalleFactura($facturaId, $detalleId)
    {
        try {
            DB::beginTransaction();

            // Verificar que el detalle pertenece a la factura
            $detalle = DB::selectOne("
                SELECT * FROM LB_detalles_factura_libros 
                WHERE id = ? AND factura_id = ?
            ", [$detalleId, $facturaId]);

            if (!$detalle) {
                return response()->json(['error' => 'Detalle no encontrado'], 404);
            }

            // Eliminar detalle
            DB::delete("
                DELETE FROM LB_detalles_factura_libros 
                WHERE id = ?
            ", [$detalleId]);

            // Actualizar totales
            $this->actualizarTotalesFactura($facturaId);

            // Registrar en bitácora
            DB::insert("
                INSERT INTO LB_bitacora_facturas (factura_id, accion, descripcion, usuario_id, created_at)
                VALUES (?, ?, ?, ?, GETDATE())
            ", [
                $facturaId,
                'DETALLE_ELIMINADO',
                "Eliminado: {$detalle->descripcion} (Cant: {$detalle->cantidad})",
                auth()->id() ?? 1
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Detalle eliminado correctamente'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error eliminando detalle de factura: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al eliminar detalle',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 📊 REPORTE DE FACTURAS
     */
    public function reporteFacturas(Request $request)
    {
        try {
            $fechaInicio = $request->fecha_inicio ?? now()->startOfMonth()->format('Y-m-d');
            $fechaFin = $request->fecha_fin ?? now()->endOfMonth()->format('Y-m-d');

            $reporte = DB::selectOne("
                SELECT 
                    COUNT(DISTINCT f.id) as total_facturas,
                    COUNT(DISTINCT f.proveedor_id) as total_proveedores,
                    SUM(f.subtotal) as subtotal_total,
                    SUM(f.descuento) as descuento_total,
                    SUM(f.impuestos) as impuestos_total,
                    SUM(f.total) as total_general,
                    AVG(f.total) as promedio_factura,
                    (SELECT COUNT(*) FROM LB_detalles_factura_libros d 
                     JOIN LB_facturas_libros f2 ON d.factura_id = f2.id
                     WHERE f2.fecha BETWEEN ? AND ?) as total_conceptos,
                    (SELECT SUM(cantidad) FROM LB_detalles_factura_libros d 
                     JOIN LB_facturas_libros f2 ON d.factura_id = f2.id
                     WHERE f2.fecha BETWEEN ? AND ?) as total_libros
                FROM LB_facturas_libros f
                WHERE f.fecha BETWEEN ? AND ?
            ", [
                $fechaInicio,
                $fechaFin,
                $fechaInicio,
                $fechaFin,
                $fechaInicio,
                $fechaFin
            ]);

            // Top proveedores
            $topProveedores = DB::select("
                SELECT TOP 10
                    p.nombre,
                    p.rfc,
                    COUNT(f.id) as total_facturas,
                    SUM(f.total) as total_compras
                FROM LB_facturas_libros f
                JOIN LB_proveedores p ON f.proveedor_id = p.id
                WHERE f.fecha BETWEEN ? AND ?
                GROUP BY p.id, p.nombre, p.rfc
                ORDER BY total_compras DESC
            ", [$fechaInicio, $fechaFin]);

            // Facturas por estado
            $facturasPorEstado = DB::select("
                SELECT 
                    estado,
                    COUNT(*) as cantidad,
                    SUM(total) as total
                FROM LB_facturas_libros
                WHERE fecha BETWEEN ? AND ?
                GROUP BY estado
            ", [$fechaInicio, $fechaFin]);

            return response()->json([
                'periodo' => [
                    'inicio' => $fechaInicio,
                    'fin' => $fechaFin
                ],
                'resumen' => $reporte,
                'top_proveedores' => $topProveedores,
                'por_estado' => $facturasPorEstado
            ]);
        } catch (\Exception $e) {
            Log::error('Error generando reporte de facturas: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al generar reporte',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
