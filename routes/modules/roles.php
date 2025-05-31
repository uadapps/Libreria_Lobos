<?php

use App\Http\Controllers\RoleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Módulo: Gestión de Roles y Permisos
|--------------------------------------------------------------------------
| Todas las rutas relacionadas con la gestión de roles y permisos del sistema
|
| Permisos requeridos:
| - roles.ver: Ver roles y permisos
| - roles.crear: Crear nuevos roles
| - roles.editar: Modificar roles existentes
| - roles.eliminar: Eliminar roles
| - roles.asignar: Asignar roles a usuarios
*/

Route::middleware(['auth', 'check.user.active'])
    ->prefix('roles')
    ->name('roles.')
    ->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Vista Principal de Gestión (Nueva)
        |--------------------------------------------------------------------------
        */

        // Vista principal de gestión de roles (tu nueva página)
        Route::get('/gestion', [RoleController::class, 'index'])
            ->middleware('permission:roles.ver')
            ->name('index');



        // Obtener todos los permisos disponibles
        Route::get('/permisos', function () {
            return response()->json(
                \Spatie\Permission\Models\Permission::select('id', 'name')
                    ->orderBy('name')
                    ->get()
            );
        })->middleware('permission:roles.ver')
            ->name('permisos');

        /*
        |--------------------------------------------------------------------------
        | CRUD Operations para la nueva gestión
        |--------------------------------------------------------------------------
        */

        // Crear nuevo rol
        Route::post('/', [RoleController::class, 'store'])
            ->middleware('permission:roles.crear')
            ->name('store');

        // Actualizar rol existente
        Route::put('/{role}', [RoleController::class, 'update'])
            ->middleware('permission:roles.editar')
            ->name('update');

        // Eliminar rol
        Route::delete('/{role}', [RoleController::class, 'destroy'])
            ->middleware('permission:roles.eliminar')
            ->name('destroy');

        /*
        |--------------------------------------------------------------------------
        | Asignación de Roles a Usuarios
        |--------------------------------------------------------------------------
        */

        // Asignar rol a usuario
        Route::post('/asignar', [RoleController::class, 'asignarRol'])
            ->middleware('permission:roles.asignar')
            ->name('asignar');

        // Quitar rol de usuario
        Route::delete('/quitar', [RoleController::class, 'quitarRol'])
            ->middleware('permission:roles.asignar')
            ->name('quitar');

        // Obtener usuarios con rol específico
        Route::get('/{role}/usuarios', [RoleController::class, 'usuariosConRol'])
            ->middleware('permission:roles.ver')
            ->name('usuarios');

        /*
        |--------------------------------------------------------------------------
        | Validaciones en Tiempo Real
        |--------------------------------------------------------------------------
        */

        // Validar si nombre de rol está disponible
        Route::post('/validar-nombre', function () {
            $name = request('name');
            $roleId = request('role_id', null);

            $query = \Spatie\Permission\Models\Role::where('name', $name);
            if ($roleId) {
                $query->where('id', '!=', $roleId);
            }

            return response()->json([
                'disponible' => !$query->exists(),
                'mensaje' => $query->exists() ? 'El nombre del rol ya está en uso' : 'Nombre disponible'
            ]);
        })->middleware('permission:roles.crear')
            ->name('validar-nombre');

        /*
        |--------------------------------------------------------------------------
        | Reportes y Estadísticas
        |--------------------------------------------------------------------------
        */

        // Estadísticas de roles y permisos
        Route::get('/estadisticas', function () {
            return response()->json([
                'total_roles' => \Spatie\Permission\Models\Role::count(),
                'total_permisos' => \Spatie\Permission\Models\Permission::count(),
                'usuarios_sin_rol' => \App\Models\User::doesntHave('roles')->count(),
                'roles_mas_usados' => \Spatie\Permission\Models\Role::withCount('users')
                    ->orderBy('users_count', 'desc')
                    ->limit(5)
                    ->get(['name', 'users_count'])
            ]);
        })->middleware('permission:roles.ver')
            ->name('estadisticas');
    });
