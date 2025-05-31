<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class LoginRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta solicitud.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para el login con username.
     */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Intenta autenticar con los datos proporcionados.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        // Verificar si el usuario existe y está activo ANTES de intentar autenticar
        $user = User::where('username', $this->username)
                    ->where('visible', 1)
                    ->first();

        if (!$user) {
            RateLimiter::hit($this->throttleKey());
            throw ValidationException::withMessages([
                'username' => ['Las credenciales no coinciden con nuestros registros.'],
            ]);
        }

        if ($user->status == 0) {
            RateLimiter::hit($this->throttleKey());
            throw ValidationException::withMessages([
                'username' => ['Tu cuenta ha sido desactivada. Contacta al administrador.'],
            ]);
        }

        // Intentar autenticación con las condiciones adicionales
        $credentials = [
            'username' => $this->username,
            'password' => $this->password,
            'status' => 1,
            'visible' => 1
        ];

        if (!Auth::attempt($credentials, $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());
            throw ValidationException::withMessages([
                'username' => __('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Verifica que no se haya excedido el límite de intentos.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (!RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'username' => __('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Define la clave de identificación para el rate limiter.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('username')) . '|' . $this->ip());
    }

    /**
     * Define el campo que se usará para la autenticación.
     */
    public function username(): string
    {
        return 'username';
    }
}