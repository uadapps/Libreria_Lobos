<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Etiqueta as LbEtiqueta;
use Illuminate\Http\Request;

class EtiquetaController extends Controller
{
    /**
     * Lista de etiquetas para el modal (esto son las categorías)
     */
    public function list()
    {
        $etiquetas = LbEtiqueta::select('id', 'nombre', 'descripcion')
            ->where('activo', true)
            ->orderBy('nombre')
            ->get()
            ->map(function ($etiqueta) {
                return [
                    'id' => $etiqueta->id,
                    'nombre' => $etiqueta->nombre,
                    'descripción' => $etiqueta->descripción,
                ];
            });

        return response()->json([
            'etiquetas' => $etiquetas,
            'categorias' => $etiquetas,
        ]);
    }

    /**
     * Crear nueva etiqueta desde el modal
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100|unique:LB_Etiquetas,nombre',
            'descripción' => 'nullable|string',
        ]);

        $etiqueta = LbEtiqueta::create([
            'nombre' => $request->nombre,
            'descripción' => $request->descripción,
            'activo' => true,
        ]);

        return back()->with([
            'message' => 'Etiqueta creada exitosamente',
            'type' => 'success',
            'nueva_etiqueta' => [
                'id' => $etiqueta->id,
                'nombre' => $etiqueta->nombre,
                'descripción' => $etiqueta->descripción,
            ]
        ]);
    }

    /**
     * Buscar etiquetas por nombre
     */
    public function search(Request $request)
    {
        $query = $request->get('q', '');

        $etiquetas = LbEtiqueta::where('activo', true)
            ->where('nombre', 'LIKE', "%{$query}%")
            ->select('id', 'nombre', 'descripción')
            ->limit(15)
            ->get();

        return response()->json([
            'etiquetas' => $etiquetas,
            'categorias' => $etiquetas, // Alias para el frontend
        ]);
    }
}
