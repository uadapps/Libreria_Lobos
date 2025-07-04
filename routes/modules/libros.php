<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BookController;
use Inertia\Inertia;

Route::middleware(['auth', 'check.user.active'])
    ->group(function () {
        Route::get('/libros-factura', [BookController::class, 'index'])
            ->middleware('permission:libros.factura-registrar')
            ->name('libros-facturas.index');

    });
