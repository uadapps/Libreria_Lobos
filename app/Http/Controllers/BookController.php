<?php
namespace App\Http\Controllers;

use App\Models\LBLibro;
use Illuminate\Http\Request;

class BookController extends Controller
{
    public function index()
    {
        $libros = LBLibro::all();
        return response()->json($libros);
    }

    public function store(Request $request)
    {
        $request->validate([
            'isbn' => 'required|unique:LB_libros,isbn',
            'titulo' => 'required|string|max:255',
            'editorial_id' => 'nullable|integer',
            'edicion' => 'nullable|string',
            'anio' => 'nullable|integer',
            'genero' => 'nullable|string',
            'precio_sugerido' => 'nullable|numeric',
            'autor' => 'nullable|integer'
        ]);

        $libro = LBLibro::create($request->all());

        return response()->json([
            'message' => 'Libro registrado correctamente.',
            'libro' => $libro
        ], 201);
    }
}
