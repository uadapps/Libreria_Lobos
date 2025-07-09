<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\InventoryPeriodController;
use App\Http\Controllers\BookController;

use App\Http\Controllers\Admin\EditorialController;
use App\Http\Controllers\Admin\AutorController;
use App\Http\Controllers\Admin\EtiquetaController;
use App\Http\Controllers\Admin\UploadController;
use App\Http\Controllers\FacturaLibrosController;
/*
|--------------------------------------------------------------------------
| Configuración Principal de Rutas
|--------------------------------------------------------------------------
| Este archivo contiene solo la configuración principal y las inclusiones
| de módulos. Cada funcionalidad está separada en su propio archivo.
*/

/*
|--------------------------------------------------------------------------
| Ruta Principal
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }

    return Inertia::render('auth/login', [  // Mantener minúsculas como tienes
        'canResetPassword' => Route::has('password.request'),
        'status' => session('status'),
    ]);
})->name('home');

/*
|--------------------------------------------------------------------------
| Dashboard Principal
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'check.user.active'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});


Route::get('/roles', function () {
    return response()->json(
        \Spatie\Permission\Models\Role::select('id', 'name')
            ->orderBy('name')
            ->get()
    );
})->middleware('permission:usuarios.crear')->name('list');




// Rutas de diagnóstico para timeout
Route::prefix('diagnostico')->group(function () {
    Route::get('/timeout', [App\Http\Controllers\DiagnosticController::class, 'diagnosticarTimeout']);
    Route::get('/timeout-especifico', [App\Http\Controllers\DiagnosticController::class, 'probarTimeoutEspecifico']);
    Route::get('/configuraciones', [App\Http\Controllers\DiagnosticController::class, 'probarConfiguraciones']);
});






Route::post('/libros/guardar-inventario', [BookController::class, 'guardarLibrosEnInventario'])
    ->name('libros.guardar-inventario')
    ->middleware(['auth', 'web']);


Route::middleware(['auth', 'check.user.active'])
    ->group(function () {

        // ✅ Rutas existentes (mantener)
        Route::post('/guardar-lote', [BookController::class, 'guardarLoteLibros']);
        Route::get('/reporte-recientes', [BookController::class, 'reporteLibrosRecientes']);


        // En routes/web.php o routes/api.php

        Route::get('/api/books/estadisticas-post-guardado', [BookController::class, 'estadisticasPostGuardado']);
        // 🆕 NUEVAS RUTAS para DatabaseSearchService
        Route::prefix('libros')->group(function () {
            // ✅ Cambiar a GET y usar método correcto
            Route::get('/buscar-isbn', [BookController::class, 'buscarISBNCompleto']);

            // 🆕 NUEVA: Ruta para búsqueda en lote (LA MÁS IMPORTANTE)
            Route::get('/buscar-lote', [BookController::class, 'buscarLoteCompleto']);

            // 🆕 NUEVAS: Rutas adicionales del servicio
            Route::get('/buscar-titulo', [BookController::class, 'buscarPorTituloCompleto']);
            Route::get('/health', [BookController::class, 'health']);
            Route::get('/estadisticas', [BookController::class, 'estadisticas']);
        });

        /*        // ✅ Mantener ruta antigua si otros lugares la usan
        Route::post('/buscar-isbn', [BookController::class, 'buscarPorISBN'])
            ->name('buscar-isbn-old'); // Darle nombre diferente */
    });

// ============================================
// 🔧 SECCIÓN CORREGIDA - Admin API (SIN DUPLICADOS)
// ============================================

// ✅ ÚNICA DEFINICIÓN - Admin API con middleware correcto
Route::middleware(['auth', 'verified'])->prefix('admin/api')->group(function () {

    Route::get('/editoriales', [EditorialController::class, 'list'])
        ->name('api.editoriales.list');
    Route::get('/editoriales/search', [EditorialController::class, 'search'])
        ->name('api.editoriales.search');
    Route::post('/editoriales', [EditorialController::class, 'store'])
        ->name('api.editoriales.store');

    Route::get('/etiquetas', [EtiquetaController::class, 'list'])
        ->name('api.etiquetas.list');
    Route::get('/etiquetas/search', [EtiquetaController::class, 'search'])
        ->name('api.etiquetas.search');
    Route::post('/etiquetas', [EtiquetaController::class, 'store'])
        ->name('api.etiquetas.store');

    Route::get('/autores', [AutorController::class, 'list'])
        ->name('api.autores.list');
    Route::get('/autores/search', [AutorController::class, 'search'])
        ->name('api.autores.search');
    Route::post('/autores', [AutorController::class, 'store'])
        ->name('api.autores.store');

    Route::post('/upload/imagen', [UploadController::class, 'imagen'])
        ->name('api.upload.imagen');
    Route::delete('/upload/imagen', [UploadController::class, 'eliminarImagen'])
        ->name('api.upload.eliminar');
});

Route::prefix('facturas-libros')->group(function () {
    Route::post('/procesar', [FacturaLibrosController::class, 'procesarFacturaCompleta'])->name('facturas.procesar');
    Route::get('/buscar', [FacturaLibrosController::class, 'buscarFacturas'])->name('facturas.buscar');
    Route::get('/{id}', [FacturaLibrosController::class, 'verDetalleFactura'])->name('facturas.detalle');
    Route::put('/{id}/estado', [FacturaLibrosController::class, 'actualizarEstadoFactura'])->name('facturas.actualizar-estado');
    Route::delete('/{facturaId}/detalle/{detalleId}', [FacturaLibrosController::class, 'eliminarDetalleFactura'])->name('facturas.eliminar-detalle');
    Route::get('/reporte/general', [FacturaLibrosController::class, 'reporteFacturas'])->name('facturas.reporte');
});



Route::get('/storage/{path}', function ($path) {
    $fullPath = storage_path('app/public/' . $path);
    
    // Verificar que el archivo existe
    if (!file_exists($fullPath)) {
        abort(404, 'Archivo no encontrado');
    }
    
    // Verificar que está dentro del directorio permitido (seguridad)
    $realPath = realpath($fullPath);
    $allowedPath = realpath(storage_path('app/public'));
    
    if (!str_starts_with($realPath, $allowedPath)) {
        abort(403, 'Acceso denegado');
    }
    
    // Servir el archivo con el tipo MIME correcto
    return response()->file($fullPath);
})->where('path', '.*')->name('storage.serve');








// Módulo de gestión de usuarios
require __DIR__ . '/modules/usuarios.php';

require __DIR__ . '/modules/roles.php';

// Módulo de API endpoints
require __DIR__ . '/modules/api.php';


// Modulo de gestion de libros
require __DIR__ . '/modules/libros.php';


// Módulo de inventario
require __DIR__ . '/modules/inventario.php';
/*
|--------------------------------------------------------------------------
| Archivos de Configuración del Sistema
|--------------------------------------------------------------------------
*/

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';

/*
|--------------------------------------------------------------------------
| Manejo de Errores y Fallbacks
|--------------------------------------------------------------------------
*/

require __DIR__ . '/core/fallback.php';