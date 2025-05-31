<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Limpiar la caché de permisos
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Definir todos los permisos
        $permissions = [
            'usuarios.crear',
            'usuarios.editar',
            'usuarios.eliminar',
            'usuarios.ver',
            'configuracion.acceder',
            'reportes.ver',
            'reportes.generar',
            'productos.crear',
            'productos.editar',
            'productos.eliminar',
            'productos.ver',
            'ventas.crear',
            'ventas.editar',
            'ventas.eliminar',
            'ventas.ver',
            'inventario.gestionar',
            'pagos.gestionar',
            'contabilidad.acceder',
            'contabilidad.editar',
            'impuestos.gestionar',
            'auditorias.realizar',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Crear roles y asignar permisos
        $roles = [
            'Sistemas' => $permissions,
            'Administrador de Librería' => [
                'productos.crear',
                'productos.editar',
                'productos.eliminar',
                'productos.ver',
                'ventas.crear',
                'ventas.editar',
                'ventas.eliminar',
                'ventas.ver',
                'inventario.gestionar',
                'reportes.ver',
            ],
            'Caja' => [
                'ventas.crear',
                'ventas.editar',
                'ventas.ver',
                'pagos.gestionar',
            ],
            'Bodega' => [
                'inventario.gestionar',
                'productos.ver',
            ],
            'Contador' => [
                'reportes.ver',
                'reportes.generar',
                'contabilidad.acceder',
                'contabilidad.editar',
                'impuestos.gestionar',
                'auditorias.realizar',
            ],
        ];

        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $role->syncPermissions($rolePermissions);
        }
    }
}
