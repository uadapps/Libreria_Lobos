<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckUserActive
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            
            // Verificar si el usuario está inactivo o no visible
            if ($user->status == 0 || $user->visible == 0) {
                // Cerrar la sesión del usuario
                Auth::logout();
                
                // Invalidar la sesión
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                
                // Respuesta según el tipo de petición
                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'message' => 'Tu cuenta ha sido desactivada. Contacta al administrador.',
                        'redirect' => route('login')
                    ], 401);
                }
                
                return redirect()->route('login')->with('error', 'Tu cuenta ha sido desactivada. Contacta al administrador.');
            }
        }
        
        return $next($request);
    }
}