<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
Route::get('/', function () {
    if (Auth::check()) {
    return redirect()->route('dashboard'); // o la ruta que tú uses
}

    return Inertia::render('auth/login');
})->name('login');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('usuarios', UserController::class);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
