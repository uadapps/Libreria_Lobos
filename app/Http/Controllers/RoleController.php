<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::withCount('users')
            ->with('permissions')
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'guard_name' => $role->guard_name,
                    'users_count' => $role->users_count,
                    'permissions' => $role->permissions->pluck('name'),
                    'created_at' => $role->created_at,
                    'updated_at' => $role->updated_at,
                ];
            });

        $permissions = Permission::select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('roles/index', [
            'roles' => $roles,
            'permissions' => $permissions,
            'can' => [
                'crear' => auth()->check() ? auth()->user()->can('roles.crear') : false,
                'editar' => auth()->check() ? auth()->user()->can('roles.editar') : false,
                'eliminar' => auth()->check() ? auth()->user()->can('roles.eliminar') : false,
                'ver' => auth()->check() ? auth()->user()->can('roles.ver') : false,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique(Role::class, 'name')
            ],
            'permissions' => 'array',
            'permissions.*' => Rule::exists(Permission::class, 'name')
        ], [
            'name.required' => 'el nombre del rol es obligatorio.',
            'name.string' => 'el nombre del rol debe ser texto.',
            'name.max' => 'el nombre del rol no puede tener más de :max caracteres.',
            'name.unique' => 'ya existe un rol con este nombre.',
            'permissions.array' => 'los permisos deben ser un arreglo.',
            'permissions.*.exists' => 'uno o más permisos seleccionados no son válidos.',
        ]);

        if ($validator->fails()) {
            return back()->withErrors(['error' => $validator->errors()->first()])->withInput();
        }

        try {
            $role = Role::create([
                'name' => $request->name,
                'guard_name' => 'web'
            ]);

            if ($request->has('permissions')) {
                $role->syncPermissions($request->permissions);
            }

            return back()->with('success', 'rol creado exitosamente');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'error al crear el rol: ' . $e->getMessage()]);
        }
    }

    public function update(Request $request, Role $role)
    {
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique(Role::class, 'name')->ignore($role->id)
            ],
            'permissions' => 'array',
            'permissions.*' => Rule::exists(Permission::class, 'name')
        ], [
            'name.required' => 'el nombre del rol es obligatorio.',
            'name.string' => 'el nombre del rol debe ser texto.',
            'name.max' => 'el nombre del rol no puede tener más de :max caracteres.',
            'name.unique' => 'ya existe otro rol con este nombre.',
            'permissions.array' => 'los permisos deben ser un arreglo.',
            'permissions.*.exists' => 'uno o más permisos seleccionados no son válidos.',
        ]);

        if ($validator->fails()) {
            return back()->withErrors(['error' => $validator->errors()->first()])->withInput();
        }

        try {
            $role->update([
                'name' => $request->name
            ]);

            if ($request->has('permissions')) {
                $role->syncPermissions($request->permissions);
            }

            return back()->with('success', 'rol actualizado exitosamente');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'error al actualizar el rol: ' . $e->getMessage()]);
        }
    }

    public function destroy(Role $role)
    {
        try {
            if ($role->users()->count() > 0) {
                return back()->withErrors(['error' => 'no se puede eliminar un rol que tiene usuarios asignados.']);
            }

            $role->delete();

            return back()->with('success', 'rol eliminado exitosamente');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'error al eliminar el rol: ' . $e->getMessage()]);
        }
    }

    public function asignarRol(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'role_name' => [
                'required',
                Rule::exists(Role::class, 'name')
            ]
        ], [
            'user_id.required' => 'el usuario es obligatorio.',
            'user_id.exists' => 'el usuario seleccionado no existe.',
            'role_name.required' => 'el rol es obligatorio.',
            'role_name.exists' => 'el rol seleccionado no existe.',
        ]);

        if ($validator->fails()) {
            return back()->withErrors(['error' => $validator->errors()->first()]);
        }

        try {
            $user = \App\Models\User::find($request->user_id);
            $user->assignRole($request->role_name);
            return back()->with('success', 'rol asignado exitosamente');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'error al asignar el rol: ' . $e->getMessage()]);
        }
    }

    public function quitarRol(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'role_name' => [
                'required',
                Rule::exists(Role::class, 'name')
            ]
        ], [
            'user_id.required' => 'el usuario es obligatorio.',
            'user_id.exists' => 'el usuario seleccionado no existe.',
            'role_name.required' => 'el rol es obligatorio.',
            'role_name.exists' => 'el rol seleccionado no existe.',
        ]);

        if ($validator->fails()) {
            return back()->withErrors(['error' => $validator->errors()->first()]);
        }

        try {
            $user = \App\Models\User::find($request->user_id);
            $user->removeRole($request->role_name);

            return back()->with('success', 'rol removido exitosamente');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'error al remover el rol: ' . $e->getMessage()]);
        }
    }

    public function usuariosConRol(Role $role)
    {
        $usuarios = $role->users()
            ->select('id', 'nombres', 'apellidos', 'username', 'email')
            ->get();

        return response()->json($usuarios);
    }

    private function getValidationMessages(): array
    {
        return [
            'required' => 'este campo es obligatorio.',
            'string' => 'este campo debe ser texto.',
            'max' => 'este campo no puede tener más de :max caracteres.',
            'unique' => 'ya existe un registro con este valor.',
            'exists' => 'el valor seleccionado no es válido.',
            'array' => 'este campo debe ser un arreglo.',
        ];
    }

    private function getAttributeNames(): array
    {
        return [
            'name' => 'nombre del rol',
            'permissions' => 'permisos',
            'permissions.*' => 'permiso',
            'user_id' => 'usuario',
            'role_name' => 'rol',
        ];
    }
}
