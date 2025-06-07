<?php

namespace App\Http\Controllers;

use App\Models\Inventarios\InventoryPeriod;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class InventariosController extends Controller
{
    public function index()
    {
        try {
            $periods = InventoryPeriod::obtenerPeriodos();
            if (empty($periods)) {
                throw new \Exception('No se encontraron períodos');
            }        
            $periodsFormatted = collect($periods)->map(function ($period) {
                return [
                    'id' => $period->id ?? null,
                    'name' => $period->name ?? 'Sin nombre',
                    'status' => strtolower($period->status ?? 'cerrado'),
                    'created_at' => $period->created_at ?? null,
                    'closed_at' => $period->closed_at ?? null,
                    'created_by' => $period->created_by ?? 'Usuario Desconocido',
                    'total_movements' => $period->total_movements ?? 0,
                    'total_books' => $period->total_books ?? 0,
                ];
            });
            return Inertia::render('inventarios/index', [
                'periods' => $periodsFormatted,
                'can' => [
                    'crear' => true,
                    'ver' => true,
                    'cerrar' => true,
                ]
            ]);
        } catch (\Exception $e) {
            $periodsFormatted = collect([
                [
                    'id' => 1,
                    'name' => 'Inventario Jun2025',
                    'status' => 'abierto',
                    'created_at' => now()->subDays(10)->format('Y-m-d H:i:s'),
                    'closed_at' => null,
                    'created_by' => 'Usuario Sistema',
                    'total_movements' => 156,
                    'total_books' => 2340,
                ],
            ]);
            return Inertia::render('inventarios/index', [
                'periods' => $periodsFormatted,
                'can' => ['crear' => true, 'ver' => true, 'cerrar' => true],
                'error' => 'Error al cargar períodos. Mostrando datos de ejemplo.'
            ]);
        }
    }
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ], [
            'name.required' => 'El nombre del período es requerido',
            'name.max' => 'El nombre no puede exceder 255 caracteres',
        ]);
        try {
            $result = InventoryPeriod::insertar(
                $request->name,
                'Período de inventario creado desde el sistema',
                Auth::id() 
            );
            if ($result['result'] === 'success') {    
                return redirect()->back()->with('success', $result['message']);
            } else {
                return redirect()->back()->withErrors(['error' => $result['message']]);
            }
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Error inesperado al crear el período']);
        }
    }

    public function close($id)
    {
        try {
            $result = InventoryPeriod::cerrarPeriodo($id);

            if ($result['result'] === 'success') {
                return redirect()->back()->with('success', $result['message']);
            } else {
                return redirect()->back()->withErrors(['error' => $result['message']]);
            }
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Error inesperado al cerrar el período']);
        }
    }

    public function show($id)
    {
        try {
            $period = InventoryPeriod::obtenerDetalle($id);

            if (!$period) {
                return redirect()->route('inventarios.index')
                    ->withErrors(['error' => 'Período no encontrado']);
            }
            $movements = InventoryPeriod::obtenerMovimientos($id);
            $periodData = [
                'id' => $period->id,
                'name' => $period->name,
                'status' => strtolower($period->status ?? 'cerrado'),
                'created_at' => $period->created_at,
                'closed_at' => $period->closed_at,
                'created_by' => $period->created_by ?? 'Usuario Desconocido',
                'total_movements' => $period->total_movements ?? 0,
                'total_books' => $period->total_books ?? 0,
            ];

            return Inertia::render('inventario/Periods/Show', [
                'period' => $periodData,
                'movements' => $movements
            ]);

        } catch (\Exception $e) {
            return redirect()->route('inventarios.index')
                ->withErrors(['error' => 'Error inesperado al mostrar el período']);
        }
    }

    public function destroy($id)
    {
        try {
            $result = InventoryPeriod::eliminarVisual($id);
            if ($result['result'] === 'success') {
              
                return redirect()->back()->with('success', $result['message']);
            } else {
                
                return redirect()->back()->withErrors(['error' => $result['message']]);
            }

        } catch (\Exception $e) {

            return redirect()->back()->withErrors(['error' => 'Error inesperado al eliminar el período']);
        }
    }

    public function getStats($id)
    {
        try {
            $stats = InventoryPeriod::obtenerEstadisticas($id);

            return response()->json([
                'total_movements' => $stats->total_movimientos ?? 0,
                'total_books' => $stats->total_libros ?? 0,
                'last_movement' => $stats->ultimo_movimiento ?? null,
            ]);

        } catch (\Exception $e) {

            return response()->json(['error' => 'Error al obtener estadísticas'], 500);
        }
    }
    public function getActivePeriod()
    {
        try {
            $activePeriod = InventoryPeriod::obtenerPeriodoActivo();

            return response()->json([
                'has_active' => !is_null($activePeriod),
                'active_period' => $activePeriod
            ]);

        } catch (\Exception $e) {
           
            return response()->json(['error' => 'Error al verificar período activo'], 500);
        }
    }

    public function validateClose($id)
    {
        try {
            $validation = InventoryPeriod::validarCierre($id);

            return response()->json([
                'can_close' => $validation->puede_cerrar ?? false,
                'message' => $validation->mensaje ?? 'Error de validación'
            ]);

        } catch (\Exception $e) {
           
            return response()->json(['error' => 'Error al validar cierre'], 500);
        }
    }


   
}