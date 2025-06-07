<?php

namespace App\Models\Inventarios;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventoryPeriod extends Model
{
    protected $table = 'LB_inventarios';
    
    protected $fillable = [
        'nombre', 
        'descripcion', 
        'fecha_inicio', 
        'fecha_cierre',
        'usuario_id', 
        'id_status'
    ];

    protected $casts = [
        'fecha_inicio' => 'datetime',
        'fecha_cierre' => 'datetime',
    ];
    public static function obtenerPeriodos(): array
    {
        try {
            $result = DB::select('EXEC LB_inventario_periodos_obtener');
            if (empty($result)) {
                return [];
            }

            return $result;

        } catch (\Exception $e) {
            return [];
        }
    }

  
    public static function insertar(string $nombre, string $descripcion, int $usuarioId): array
    {
        try {
            if (empty($nombre) || empty($descripcion) || !$usuarioId) {
                throw new \InvalidArgumentException('Parámetros inválidos para crear período');
            }
            
            $result = DB::select('EXEC LB_inventario_periodo_insertar ?, ?, ?', [
                $nombre,
                $descripcion,
                $usuarioId
            ]);
            
            $response = $result[0] ?? null;
            
            if (!$response) {
                throw new \Exception('No se recibió respuesta del stored procedure');
            }
            
            $responseArray = (array) $response;
            
            if ($responseArray['result'] === 'success') {

            } else {
                Log::warning('Failed to create inventory period', [
                    'nombre' => $nombre,
                    'usuario_id' => $usuarioId,
                    'error' => $responseArray['message'] ?? 'Unknown error'
                ]);
            }
            
            return $responseArray;
            
        } catch (\Exception $e) {
            Log::error('Error creating inventory period', [
                'nombre' => $nombre,
                'usuario_id' => $usuarioId,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return [
                'result' => 'error',
                'message' => 'Error al crear el período: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Cerrar período específico
     */
    public static function cerrarPeriodo(int $id): array
    {
        try {
            if (!$id || $id <= 0) {
                throw new \InvalidArgumentException('ID de período inválido');
            }
            
            $result = DB::select('EXEC LB_inventario_periodo_cerrar ?', [$id]);
            $response = $result[0] ?? null;
            
            if (!$response) {
                throw new \Exception('No se recibió respuesta del stored procedure');
            }
            
            $responseArray = (array) $response;
            
            if ($responseArray['result'] === 'success') {
              //  Log::info('Inventory period closed successfully', ['period_id' => $id]);
            } else {
                Log::warning('Failed to close inventory period', [
                    'period_id' => $id,
                    'error' => $responseArray['message'] ?? 'Unknown error'
                ]);
            }
            
            return $responseArray;
            
        } catch (\Exception $e) {
            Log::error('Error closing inventory period', [
                'period_id' => $id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return [
                'result' => 'error',
                'message' => 'Error al cerrar el período: ' . $e->getMessage()
            ];
        }
    }

    public static function eliminarVisual(int $id): array
    {
        try {
            if (!$id || $id <= 0) {
                throw new \InvalidArgumentException('ID de período inválido');
            }
            
            $result = DB::select('EXEC LB_inventario_periodo_eliminar_visual ?', [$id]);
            $response = $result[0] ?? null;
            
            if (!$response) {
                throw new \Exception('No se recibió respuesta del stored procedure');
            }
            
            $responseArray = (array) $response;
            
            if ($responseArray['result'] === 'success') {
               // Log::info('Inventory period deleted successfully (soft delete)', ['period_id' => $id]);
            } else {
                Log::warning('Failed to delete inventory period', [
                    'period_id' => $id,
                    'error' => $responseArray['message'] ?? 'Unknown error'
                ]);
            }
            
            return $responseArray;
            
        } catch (\Exception $e) {
            Log::error('Error deleting inventory period', [
                'period_id' => $id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return [
                'result' => 'error',
                'message' => 'Error al eliminar el período: ' . $e->getMessage()
            ];
        }
    }

    public static function obtenerDetalle(int $id): ?object
    {
        try {
            if (!$id || $id <= 0) {
                throw new \InvalidArgumentException('ID de período inválido');
            }
            
            $resultado = DB::select('EXEC LB_inventario_periodo_obtener_detalle ?', [$id]);
            $period = $resultado[0] ?? null;
            
            if ($period) {
             //   Log::info('Inventory period details retrieved successfully', ['period_id' => $id]);
            } else {
                Log::warning('Inventory period not found', ['period_id' => $id]);
            }
            
            return $period;
            
        } catch (\Exception $e) {
            Log::error('Error retrieving inventory period details', [
                'period_id' => $id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return null;
        }
    }

    public static function obtenerMovimientos(int $inventarioId): array
    {
        try {
            if (!$inventarioId || $inventarioId <= 0) {
                throw new \InvalidArgumentException('ID de inventario inválido');
            }
            
            $result = DB::select('EXEC LB_inventario_movimientos_obtener ?', [$inventarioId]);
            
            Log::info('Inventory movements retrieved successfully', [
                'inventario_id' => $inventarioId,
                'movements_count' => count($result)
            ]);
            
            return $result;
            
        } catch (\Exception $e) {
            Log::error('Error retrieving inventory movements', [
                'inventario_id' => $inventarioId,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return [];
        }
    }

    public static function obtenerEstadisticas(int $inventarioId): object
    {
        try {
            if (!$inventarioId || $inventarioId <= 0) {
                throw new \InvalidArgumentException('ID de inventario inválido');
            }
            
            $resultado = DB::select('EXEC LB_inventario_periodo_estadisticas ?', [$inventarioId]);
            $stats = $resultado[0] ?? null;
            
            if ($stats) {
                Log::info('Inventory statistics retrieved successfully', ['inventario_id' => $inventarioId]);
                return $stats;
            } else {
                Log::warning('No statistics found for inventory', ['inventario_id' => $inventarioId]);
                return (object) [
                    'total_movimientos' => 0,
                    'total_libros' => 0,
                    'ultimo_movimiento' => null
                ];
            }
            
        } catch (\Exception $e) {
            Log::error('Error retrieving inventory statistics', [
                'inventario_id' => $inventarioId,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return (object) [
                'total_movimientos' => 0,
                'total_libros' => 0,
                'ultimo_movimiento' => null
            ];
        }
    }

    public static function obtenerPeriodoActivo(): ?object
    {
        try {
            $resultado = DB::select('EXEC LB_inventario_periodo_activo_obtener');
            $activePeriod = $resultado[0] ?? null;
            
            if ($activePeriod) {
                Log::info('Active inventory period found', ['period_id' => $activePeriod->id]);
            } else {
                Log::info('No active inventory period found');
            }
            
            return $activePeriod;
            
        } catch (\Exception $e) {
            Log::error('Error retrieving active inventory period', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return null;
        }
    }
    public static function validarEliminacion(int $id): object
    {
        try {
            if (!$id || $id <= 0) {
                throw new \InvalidArgumentException('ID de período inválido');
            }
            
            $resultado = DB::select('EXEC LB_inventario_periodo_validar_eliminacion ?', [$id]);
            $validation = $resultado[0] ?? null;
            
            if ($validation) {
                Log::info('Deletion validation completed', [
                    'period_id' => $id,
                    'can_delete' => $validation->puede_eliminar
                ]);
                return $validation;
            } else {
                Log::warning('No validation result received', ['period_id' => $id]);
                return (object) ['puede_eliminar' => false, 'mensaje' => 'Error de validación'];
            }
            
        } catch (\Exception $e) {
            Log::error('Error validating period deletion', [
                'period_id' => $id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return (object) [
                'puede_eliminar' => false, 
                'mensaje' => 'Error de validación: ' . $e->getMessage()
            ];
        }
    }

    public static function validarCierre(int $id): object
    {
        try {
            if (!$id || $id <= 0) {
                throw new \InvalidArgumentException('ID de período inválido');
            }
            
            $resultado = DB::select('EXEC LB_inventario_periodo_validar_cierre ?', [$id]);
            $validation = $resultado[0] ?? null;
            
            if ($validation) {
                Log::info('Closure validation completed', [
                    'period_id' => $id,
                    'can_close' => $validation->puede_cerrar
                ]);
                return $validation;
            } else {
                Log::warning('No validation result received for closure', ['period_id' => $id]);
                return (object) ['puede_cerrar' => false, 'mensaje' => 'Error de validación'];
            }
            
        } catch (\Exception $e) {
            Log::error('Error validating period closure', [
                'period_id' => $id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return (object) [
                'puede_cerrar' => false, 
                'mensaje' => 'Error de validación: ' . $e->getMessage()
            ];
        }
    }

    public static function obtenerPeriodosEliminados(): array
    {
        try {
            $result = DB::select('EXEC LB_inventario_periodos_eliminados_obtener');
            
            Log::info('Deleted inventory periods retrieved successfully', ['count' => count($result)]);
            return $result;
            
        } catch (\Exception $e) {
            Log::error('Error retrieving deleted inventory periods', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return [];
        }
    }
    public static function restaurarPeriodo(int $id): array
    {
        try {
            if (!$id || $id <= 0) {
                throw new \InvalidArgumentException('ID de período inválido');
            }     
            $result = DB::select('EXEC LB_inventario_periodo_restaurar ?', [$id]);
            $response = $result[0] ?? null;
            
            if (!$response) {
                throw new \Exception('No se recibió respuesta del stored procedure');
            }  
            $responseArray = (array) $response;         
            if ($responseArray['result'] === 'success') {
                Log::info('Inventory period restored successfully', ['period_id' => $id]);
            } else {
                Log::warning('Failed to restore inventory period', [
                    'period_id' => $id,
                    'error' => $responseArray['message'] ?? 'Unknown error'
                ]);
            }          
            return $responseArray;
            
        } catch (\Exception $e) {
            Log::error('Error restoring inventory period', [
                'period_id' => $id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return [
                'result' => 'error',
                'message' => 'Error al restaurar el período: ' . $e->getMessage()
            ];
        }
    }
    public function user()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function status()
    {
        return $this->belongsTo(InventoryStatus::class, 'id_status');
    }
    public function isActive(): bool
    {
        return $this->status?->nombre === 'abierto';
    }

    public function isClosed(): bool
    {
        return $this->status?->nombre === 'cerrado';
    }
}