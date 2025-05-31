<?php

use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Módulo: Gestión de Usuarios
|--------------------------------------------------------------------------
| Todas las rutas relacionadas con la gestión de usuarios del sistema
| 
| Permisos requeridos:
| - usuarios.ver: Ver listado de usuarios
| - usuarios.crear: Crear nuevos usuarios
| - usuarios.editar: Modificar usuarios existentes
| - usuarios.eliminar: Eliminar usuarios
*/

Route::middleware(['auth', 'check.user.active'])
    ->prefix('usuarios')
    ->name('usuarios.')
    ->group(function () {
        
        /*
        |--------------------------------------------------------------------------
        | CRUD Básico de Usuarios
        |--------------------------------------------------------------------------
        */
        
        // Listar usuarios
        Route::get('/', [UserController::class, 'index'])
            ->name('index')
            ->middleware('permission:usuarios.ver');
        
        // Crear nuevo usuario
        Route::post('/', [UserController::class, 'store'])
            ->name('store')
            ->middleware('permission:usuarios.crear');
        
        // Actualizar usuario existente
        Route::put('/{usuario}', [UserController::class, 'update'])
            ->name('update')
            ->middleware('permission:usuarios.editar');
        
        // Eliminar usuario individual
        Route::delete('/{usuario}', [UserController::class, 'destroy'])
            ->name('destroy')
            ->middleware('permission:usuarios.eliminar');
        
        /*
        |--------------------------------------------------------------------------
        | Operaciones Masivas
        |--------------------------------------------------------------------------
        */
        
        // Eliminación múltiple de usuarios
        Route::delete('/eliminar-multiples', [UserController::class, 'eliminarMultiples'])
            ->name('eliminar-multiples')
            ->middleware('permission:usuarios.eliminar');
        
        /*
        |--------------------------------------------------------------------------
        | Gestión de Status
        |--------------------------------------------------------------------------
        */
        
        // Cambiar estatus de usuario individual
        Route::post('/{id}/status', [UserController::class, 'actualizarStatus'])
            ->name('status')
            ->middleware('permission:usuarios.editar');
        
        // Cambiar estatus múltiple de usuarios
        Route::post('/status-multiple', [UserController::class, 'actualizarStatusMultiple'])
            ->name('status-multiple')
            ->middleware('permission:usuarios.editar');
            
        /*
        |--------------------------------------------------------------------------
        | Funciones Adicionales (agregar según necesites)
        |--------------------------------------------------------------------------
        */
        
        // Resetear contraseña de usuario
        Route::post('/{usuario}/reset-password', [UserController::class, 'resetPassword'])
            ->name('reset-password')
            ->middleware('permission:usuarios.editar');
        
        // Exportar usuarios
        Route::get('/export', [UserController::class, 'export'])
            ->name('export')
            ->middleware('permission:usuarios.ver');
        
        // Importar usuarios
        Route::post('/import', [UserController::class, 'import'])
            ->name('import')
            ->middleware('permission:usuarios.crear');
      
    });