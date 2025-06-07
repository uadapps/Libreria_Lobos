<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InventariosController;

Route::middleware(['auth', 'check.user.active'])
    ->prefix('inventario')
    ->name('inventario.')
    ->group(function () {
        Route::get('/periodos', [InventariosController::class, 'index'])
            ->middleware('permission:inventario.periodos-listar') 
            ->name('periodos.index');    
        Route::post('/periodos', [InventariosController::class, 'store'])
            ->middleware('permission:inventario.periodos-crear')   
            ->name('periodos.store');
        Route::get('/periodos/{period}', [InventariosController::class, 'show'])
            ->middleware('permission:inventario.periodos-ver')    
            ->name('periodos.show');
        Route::patch('/periodos/{period}/cerrar', [InventariosController::class, 'close'])
            ->middleware('permission:inventario.periodos-cerrar')  
            ->name('periodos.cerrar');
        Route::delete('/periodos/{period}', [InventariosController::class, 'destroy'])
            ->middleware('permission:inventario.periodos-eliminar') 
            ->name('periodos.destroy');
    });
