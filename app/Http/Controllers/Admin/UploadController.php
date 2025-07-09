<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class UploadController extends Controller
{
public function imagen(Request $request)
{
    Log::info('🚀 === INICIO UPLOAD ===');
    $request->validate([
        'imagen' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        'tipo' => 'sometimes|string|in:libro,autor,editorial',
    ]);

    try {
        $file = $request->file('imagen');
        $tipo = $request->input('tipo', 'libro');
        $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();

        $directory = "{$tipo}s"; // Solo "libros", no "public/libros"
        
        // Crear directorio si no existe en el disco público
        $publicDisk = Storage::disk('public');
        if (!$publicDisk->exists($directory)) {
            $publicDisk->makeDirectory($directory, 0755, true);
        }
        $path = $publicDisk->putFileAs($directory, $file, $filename);

        $relativePath = $path; // Ya viene sin 'public/' → "libros/xxx.jpg"
        $publicUrl = '/storage/' . $relativePath; // "/storage/libros/xxx.jpg"

        Log::info('✅ Archivo guardado:', [
            'path_completo' => $path,
            'path_relativo' => $relativePath,
            'url_publica' => $publicUrl,
            'existe' => $publicDisk->exists($path)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Imagen subida exitosamente',
            'upload' => [
                'success' => true,
                'path' => $relativePath,     
                'url' => $publicUrl,         
                'filename' => $filename,
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime' => $file->getMimeType(),
            ]
        ], 200);

    } catch (\Exception $e) {
        Log::error('💥 Error subiendo imagen:', [
            'mensaje' => $e->getMessage(),
            'archivo' => $e->getFile(),
            'linea' => $e->getLine()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Error al subir la imagen: ' . $e->getMessage(),
            'upload' => [
                'success' => false,
                'error' => $e->getMessage()
            ]
        ], 500);
    }
}

    public function eliminarImagen(Request $request)
    {
        $request->validate([
            'path' => 'required|string',
        ]);

        try {
            $path = $request->input('path');
            $fullPath = str_starts_with($path, 'public/') ? $path : "public/{$path}";
            Log::info('🗑️ Eliminando imagen:', [
                'path_original' => $path,
                'path_completo' => $fullPath,
                'existe' => Storage::exists($fullPath)
            ]);

            if (Storage::exists($fullPath)) {
                Storage::delete($fullPath);

                return back()->with([
                    'flash' => [
                        'success' => true,
                        'message' => 'Imagen eliminada exitosamente',
                        'deleted' => true
                    ]
                ]);
            }

            return back()->with([
                'flash' => [
                    'success' => false,
                    'message' => 'Imagen no encontrada'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('💥 Error eliminando imagen:', [
                'mensaje' => $e->getMessage(),
                'path' => $request->input('path')
            ]);

            return back()->withErrors([
                'imagen' => 'Error al eliminar la imagen: ' . $e->getMessage()
            ])->with([
                'flash' => [
                    'success' => false,
                    'message' => 'Error al eliminar la imagen'
                ]
            ]);
        }
    }
}
