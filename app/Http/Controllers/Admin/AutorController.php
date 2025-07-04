<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Autor as LbAutor;
use Illuminate\Http\Request;

class AutorController extends Controller
{
    /**
     * Lista de autores para el modal
     */
public function list(Request $request)
{
    $query = LbAutor::select('id', 'nombre', 'seudonimo', 'nacionalidad', 'biografia')
        ->where('activo', true);

    // Si hay búsqueda, filtrar
    if ($request->has('search') && !empty($request->search)) {
        $search = $request->search;
        $query->where(function($q) use ($search) {
            $q->where('nombre', 'LIKE', "%{$search}%")
              ->orWhere('seudonimo', 'LIKE', "%{$search}%");
        });
    }

    $autores = $query->orderBy('nombre')
      //  ->limit(20) // Limitar resultados
        ->get()
        ->map(function ($autor) {
            return [
                'id' => $autor->id,
                'nombre' => $autor->nombre,
                'seudónimo' => $autor->seudónimo,
                'nacionalidad' => $autor->nacionalidad,
                'nombre_completo' => $autor->seudónimo ?
                    "{$autor->nombre} ({$autor->seudónimo})" :
                    $autor->nombre,
            ];
        });

    return response()->json(['autores' => $autores]);
}

    /**
     * Crear nuevo autor desde el modal
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'seudónimo' => 'nullable|string|max:255',
            'nacionalidad' => 'nullable|string|max:100',
            'biografía' => 'nullable|string',
            'fecha_nacimiento' => 'nullable|date',
            'fecha_muerte' => 'nullable|date',
        ]);

        $autor = LbAutor::create([
            'nombre' => $request->nombre,
            'seudónimo' => $request->seudónimo,
            'nacionalidad' => $request->nacionalidad,
            'biografía' => $request->biografía,
            'fecha_nacimiento' => $request->fecha_nacimiento,
            'fecha_muerte' => $request->fecha_muerte,
            'activo' => true,
        ]);

        return back()->with([
            'message' => 'Autor creado exitosamente',
            'type' => 'success',
            'nuevo_autor' => [
                'id' => $autor->id,
                'nombre' => $autor->nombre,
                'seudónimo' => $autor->seudónimo,
                'nombre_completo' => $autor->seudónimo ?
                    "{$autor->nombre} ({$autor->seudónimo})" :
                    $autor->nombre,
            ]
        ]);
    }

    /**
     * Buscar autores
     */
    public function search(Request $request)
    {
        $query = $request->get('q', '');

        $autores = LbAutor::where('activo', true)
            ->where(function ($q) use ($query) {
                $q->where('nombre', 'LIKE', "%{$query}%")
                  ->orWhere('seudónimo', 'LIKE', "%{$query}%");
            })
            ->select('id', 'nombre', 'seudónimo', 'nacionalidad')
            ->limit(10)
            ->get();

        return response()->json([
            'autores' => $autores
        ]);
    }
}
