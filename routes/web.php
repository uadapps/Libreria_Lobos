<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\InventoryPeriodController;

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


/*
|--------------------------------------------------------------------------
| Módulos de Funcionalidad
|--------------------------------------------------------------------------
| Cada módulo maneja una funcionalidad específica del sistema
*/

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
