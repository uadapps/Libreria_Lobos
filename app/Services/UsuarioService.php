<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\VarDumper\VarDumper;

class UsuarioService
{
    public function insertar(array $data): void
    {
        DB::statement('EXEC LB_usuarios_insertar ?, ?, ?, ?, ?, ?, ?', [
            $data['id_empleado'],
            $data['nombres'],
            $data['apellidos'],
            $data['username'],
            $data['email'],
            $data['mobile'],
            bcrypt($data['password']),
        ]);
    }


    public function actualizar(int $id, array $data): void
    {
        DB::statement('EXEC LB_usuarios_actualizar ?, ?, ?, ?, ?, ?, ?', [
            $id,
            $data['nombres'],
            $data['apellidos'],
            $data['username'],
            $data['email'],
            $data['mobile'],
            $data['password'],
        ]);
    }


    public function eliminarVisual(int $id): void
    {
        DB::statement('EXEC LB_usuarios_eliminar_visual ?', [$id]);
    }

    public function actualizarStatus(int $id, bool $status): void
    {
        DB::statement('EXEC LB_usuarios_actualizar_status ?, ?', [$id, $status]);
    }

    public function obtenerEmpleados(string $busqueda): array
    {
        return DB::select('EXEC LB_obtener_empleados ?', [$busqueda]);
    }
}
