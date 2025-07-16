<?php
// app/Http/Controllers/Admin/ProveedorController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProveedorController extends Controller
{
 public function index(Request $request)
{
    $search = $request->get('search', '');
    $limit = min($request->get('limit', 15), 50);
    
    $query = DB::table('LB_proveedores')
        ->where('activo', true)
        ->whereNotNull('rfc')
        ->where('rfc', '!=', '')
        ->whereNotNull('nombre')
        ->where('nombre', '!=', '');
    
    if ($search) {
        $query->where(function($q) use ($search) {
            $q->where('rfc', 'LIKE', "%{$search}%")
              ->orWhere('nombre', 'LIKE', "%{$search}%");
        });
    }
    
    $proveedores = $query
        ->select('id', 'rfc', 'nombre', 'regimen_fiscal', 'contacto', 'telefono', 'email')
        ->orderBy('rfc') // ✅ Mejor para búsqueda de RFC
        ->limit($limit)
        ->get();
    
    $formatted = $proveedores->map(function($proveedor) {
        return [
            'id' => $proveedor->id,
            'rfc' => $proveedor->rfc,
            'nombre' => $proveedor->nombre,
            'nombre_completo' => $proveedor->nombre . ' - ', // ✅ Para auto-completado
            'regimen_fiscal' => $proveedor->regimen_fiscal,
            'contacto' => $proveedor->contacto,
            'telefono' => $proveedor->telefono,
            'email' => $proveedor->email,
        ];
    });
    
    return response()->json($formatted);
}

    // ✅ Método para crear nuevo proveedor si no existe
    public function store(Request $request)
    {
        $request->validate([
            'rfc' => 'required|string|max:13|unique:LB_proveedores,rfc',
            'nombre' => 'required|string|max:255',
        ]);

        $proveedor = DB::table('LB_proveedores')->insertGetId([
            'rfc' => strtoupper($request->rfc),
            'nombre' => $request->nombre,
            'regimen_fiscal' => $request->regimen_fiscal ?? '',
            'activo' => true,
            'created_at' => now(),
        ]);

        return response()->json([
            'id' => $proveedor,
            'rfc' => strtoupper($request->rfc),
            'nombre' => $request->nombre,
            'nombre_completo' => strtoupper($request->rfc) . ' - ' . $request->nombre
        ], 201);
    }
}
