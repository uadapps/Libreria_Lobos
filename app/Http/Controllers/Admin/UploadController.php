<?php
namespace App\Http\Controllers\Admin;
// ============================================
// 📁 app/Http/Controllers/Admin/UploadController.php
// ============================================
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class UploadController extends Controller
{
    /**
     * Subir imagen de libro
     */
    public function imagen(Request $request)
    {
        $request->validate([
            'imagen' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120', // 5MB max
            'tipo' => 'required|string|in:libro,autor,editorial',
        ]);

        try {
            $file = $request->file('imagen');
            $tipo = $request->input('tipo', 'libro');

            // Generar nombre único
            $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();

            // Crear directorio si no existe
            $directory = "public/{$tipo}s";
            if (!Storage::exists($directory)) {
                Storage::makeDirectory($directory);
            }

            // Guardar archivo
            $path = $file->storeAs("public/{$tipo}s", $filename);

            // Generar path relativo para la BD
            $relativePath = "{$tipo}s/{$filename}";

            // Generar URL pública
            $url = Storage::url($relativePath);

            return back()->with([
                'message' => 'Imagen subida exitosamente',
                'type' => 'success',
                'upload' => [
                    'success' => true,
                    'path' => $relativePath, // Este va a la BD
                    'url' => $url, // Este para preview
                    'filename' => $filename,
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error uploading image: ' . $e->getMessage());

            return back()->withErrors([
                'imagen' => 'Error al subir la imagen. Por favor, intenta de nuevo.'
            ])->with([
                'type' => 'error',
                'upload' => [
                    'success' => false,
                    'error' => 'Error al procesar la imagen'
                ]
            ]);
        }
    }

    /**
     * Eliminar imagen
     */
    public function eliminarImagen(Request $request)
    {
        $request->validate([
            'path' => 'required|string',
        ]);

        try {
            $path = $request->input('path');

            // Agregar 'public/' si no lo tiene
            $fullPath = str_starts_with($path, 'public/') ? $path : "public/{$path}";

            // Verificar que el archivo existe
            if (Storage::exists($fullPath)) {
                Storage::delete($fullPath);

                return back()->with([
                    'message' => 'Imagen eliminada exitosamente',
                    'type' => 'success',
                    'deleted' => true
                ]);
            }

            return back()->with([
                'message' => 'Imagen no encontrada',
                'type' => 'warning'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error deleting image: ' . $e->getMessage());

            return back()->withErrors([
                'imagen' => 'Error al eliminar la imagen.'
            ]);
        }
    }
}
