<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/*
|--------------------------------------------------------------------------
| Manejo de Errores y Rutas No Encontradas
|--------------------------------------------------------------------------
| Gestión centralizada de errores 404 y rutas no definidas.
| Proporciona experiencia de usuario coherente y logging de errores.
*/

/*
|--------------------------------------------------------------------------
| Ruta Fallback Principal
|--------------------------------------------------------------------------
*/

Route::fallback(function () {
    
    // Logging para monitoreo y debug
    if (app()->environment('local', 'staging')) {
        Log::info('404 - URL no encontrada', [
            'url' => request()->fullUrl(),
            'method' => request()->method(),
            'user_agent' => request()->userAgent(),
            'referer' => request()->header('referer'),
            'ip' => request()->ip(),
            'user_id' => Auth::id(),
            'timestamp' => now(),
        ]);
    }
    
    // Manejo diferenciado según estado de autenticación
    if (Auth::check()) {
        // Usuario autenticado - redirigir al dashboard
        return redirect()->route('dashboard')
            ->with('info', 'La página que buscas no existe. Te hemos redirigido al inicio.');
    }
    
    // Usuario no autenticado - redirigir al login
    return redirect('/')
        ->with('warning', 'Página no encontrada. Por favor, inicia sesión para acceder al sistema.');
        
});

/*
|--------------------------------------------------------------------------
| Manejo de Errores de API (opcional)
|--------------------------------------------------------------------------
*/

Route::prefix('api')->group(function () {
    Route::fallback(function () {
        return response()->json([
            'error' => 'Endpoint no encontrado',
            'message' => 'La ruta de API solicitada no existe',
            'available_endpoints' => [
                'GET /api/roles' => 'Obtener roles disponibles',
                'GET /api/usuarios/buscar' => 'Buscar usuarios',
                'POST /api/validar-username' => 'Validar nombre de usuario',
                'POST /api/validar-email' => 'Validar email',
            ]
        ], 404);
    });
});