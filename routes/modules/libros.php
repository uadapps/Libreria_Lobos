<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BookController;
use Inertia\Inertia;

Route::get('/libros', [BookController::class, 'index']);


Route::middleware(['auth', 'verified', 'check.user.active'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});
