<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Editorial as LbEditorial;
use Illuminate\Http\Request;

class EditorialController extends Controller
{
    /**
     * Lista de editoriales para el modal
     */
// Agregar soporte para búsqueda al método actual
public function list()
{
    $search = request()->get('search', '');

    $query = LbEditorial::select('id', 'nombre', 'contacto', 'telefono', 'email')
        ->where('activo', true);
    if (!empty($search)) {
        $query->where('nombre', 'LIKE', '%' . $search . '%');
    }
    $editoriales = $query->orderBy('nombre')->get();
   return response()->json(['editoriales' => $editoriales]);

}
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255|unique:LB_editoriales,nombre',
            'contacto' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            'direccion' => 'nullable|string',
        ]);
        $editorial = LbEditorial::create([
            'nombre' => $request->nombre,
            'contacto' => $request->contacto,
            'telefono' => $request->telefono,
            'email' => $request->email,
            'direccion' => $request->direccion,
            'activo' => true,
        ]);

        return back()->with([
            'message' => 'Editorial creada exitosamente',
            'type' => 'success',
            'nueva_editorial' => [
                'id' => $editorial->id,
                'nombre' => $editorial->nombre,
                'contacto' => $editorial->contacto ?? $editorial->email,
            ]
        ]);
    }

    /**
     * Buscar editorial por nombre (para autocompletado)
     */
    public function search(Request $request)
    {
        $query = $request->get('q', '');

        $editoriales = LbEditorial::where('activo', true)
            ->where(function ($q) use ($query) {
                $q->where('nombre', 'LIKE', "%{$query}%")
                  ->orWhere('contacto', 'LIKE', "%{$query}%");
            })
            ->select('id', 'nombre', 'contacto')
            ->limit(10)
            ->get();

        return response()->json([
            'editoriales' => "hola"
        ]);
    }
}
