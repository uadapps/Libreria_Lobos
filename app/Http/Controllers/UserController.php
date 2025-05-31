<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use App\Services\UsuarioService;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\VarDumper\VarDumper;

class UserController extends Controller
{
    protected $usuarios;

    public function __construct(UsuarioService $usuarios)
    {
        $this->usuarios = $usuarios;
    }

public function index()
{
    $usuarios = User::with('roles')
        ->where('visible', true)
        ->paginate(10);

    // Aplicamos map sin perder la estructura de paginación
    $usuarios->getCollection()->transform(function ($u) {
        return [
            'id' => $u->id,
            'nombres' => $u->nombres,
            'apellidos' => $u->apellidos,
            'email' => $u->email,
            'username' => $u->username,
            'mobile' => $u->mobile,
            'status' => $u->status,
            'visible' => $u->visible,
            'roles' => $u->roles->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
            ]),
            'role_id' => $u->roles->first()?->id ?? 0,
            'role_name' => $u->roles->first()?->name ?? '—',
            'id_empleado' => $u->id_empleado,
            'id_fotografia' => $u->id_fotografia,
            'puesto' => $u->puesto,
        ];
    });

    return Inertia::render('usuarios/index', [
        'usuarios' => $usuarios, // ⬅️ aquí sí se mantiene el objeto paginado completo
        'paginacion' => $usuarios->links(),
    ]);
}



    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombres'     => 'required|string|max:255',
            'apellidos'   => 'required|string|max:255',
            'email'       => [
                'required',
                'email',
                Rule::unique(User::class, 'email')->where(fn($q) => $q->where('visible', 1)),
            ],
            'username'    => [
                'required',
                'string',
                Rule::unique(User::class, 'username')->where(fn($q) => $q->where('visible', 1)),
            ],
            'id_empleado' => [
                'required',
                Rule::unique(User::class, 'id_empleado')->where(fn($q) => $q->where('visible', 1)),
            ],
            'mobile'      => 'nullable|string|max:20',
            'password'    => 'required|string|min:8|confirmed',
            'role_id'     => 'required|integer|exists:LB_roles,id',
        ], [
            'email.unique'       => 'Este correo ya está en uso.',
            'username.unique'    => 'Este nombre de usuario ya existe.',
            'id_empleado.unique' => 'Este empleado ya tiene un usuario asignado.',
            'role_id.required'   => 'Debes seleccionar un rol.',
            'role_id.exists'     => 'El rol seleccionado no es válido.',
        ]);

        try {
            $this->usuarios->insertar($validated);
            $user = User::where('id_empleado', $validated['id_empleado'])->firstOrFail();
            $role = \Spatie\Permission\Models\Role::findOrFail($validated['role_id']);
            $user->syncRoles([$role->name]);
            return redirect()->route('usuarios.index')
                ->with('success', 'Usuario creado exitosamente o reactivado.');
        } catch (\Throwable $e) {
            return back()->withInput()
                ->withErrors(['general' => $e->getMessage()]);
        }
    }

    public function update(Request $request, User $usuario)
    {
        $rules = [
            'nombres'     => 'required|string|max:255',
            'apellidos'   => 'required|string|max:255',
            'email'       => [
                'required',
                'email',
                Rule::unique(User::class, 'email')->ignore($usuario->id)->where(fn($q) => $q->where('visible', 1)),
            ],
            'username'    => [
                'required',
                'string',
                Rule::unique(User::class, 'username')->ignore($usuario->id)->where(fn($q) => $q->where('visible', 1)),
            ],
            'id_empleado' => [
                'required',
                Rule::unique(User::class, 'id_empleado')->ignore($usuario->id)->where(fn($q) => $q->where('visible', 1)),
            ],
            'mobile'      => 'nullable|string|max:20',
            'password'    => 'nullable|string|min:8|confirmed',
        ];

        if (auth()->check() && auth()->user()->hasPermissionTo('usuarios.asignar_rol')) {
            $rules['role_id'] = ['required', 'integer', 'exists:roles,id']; // Usar tabla de Spatie
        }

        $validated = $request->validate($rules, [
            'email.unique'       => 'Este correo ya está en uso.',
            'username.unique'    => 'Este nombre de usuario ya existe.',
            'id_empleado.unique' => 'Este empleado ya tiene un usuario asignado.',
            'role_id.required'   => 'Debes seleccionar un rol.',
            'role_id.exists'     => 'El rol seleccionado no es válido.',
        ]);

        try {
            $validated['password'] = $request->filled('password')
                ? bcrypt($request->password)
                : $usuario->password;

            // Crear datos del usuario sin role_id
            $userData = $validated;
            unset($userData['role_id']); // Remover role_id de los datos del usuario

            // Actualizar usuario
            $this->usuarios->actualizar($usuario->id, $userData);

            // Asignar rol con Spatie si tiene permisos
            if (auth()->user()->hasPermissionTo('usuarios.asignar_rol') && $request->filled('role_id')) {
                $role = \Spatie\Permission\Models\Role::findOrFail($validated['role_id']);
                $usuario->syncRoles([$role->name]);
            }

            return redirect()->route('usuarios.index')
                ->with('success', 'Usuario actualizado exitosamente.');
        } catch (\Throwable $e) {
            return back()->withInput()
                ->withErrors(['general' => 'Ocurrió un error inesperado al actualizar el usuario.' . $e->getMessage()]);
        }
    }


    public function destroy(User $usuario)
    {
        $this->usuarios->eliminarVisual($usuario->id);
        return back()->with('success', 'Usuario eliminado visualmente.');
    }

    public function eliminarMultiples(Request $request)
    {
        foreach ($request->input('ids', []) as $id) {
            $this->usuarios->eliminarVisual($id);
        }

        return back()->with('success', 'Usuarios eliminados visualmente.');
    }

    public function actualizarStatus(Request $request, $id)
    {
        $this->usuarios->actualizarStatus($id, $request->input('status'));
        return redirect()->route('usuarios.index')
            ->with('success', 'Estado actualizado correctamente.');
    }

    public function actualizarStatusMultiple(Request $request)
    {
        $request->validate([
            'ids'    => 'required|array',
            'status' => 'required|boolean',
        ]);

        foreach ($request->input('ids') as $id) {
            $this->usuarios->actualizarStatus($id, $request->input('status'));
        }

        return back()->with('success', 'Estado actualizado correctamente.');
    }

    public function buscarEmpleados(Request $request)
    {
        $empleados = $this->usuarios->obtenerEmpleados($request->query('search', ''));

        $data = collect($empleados)->map(fn($e) => [
            'id_empleado'          => $e->ID_Empleado,
            'id_persona'           => $e->ID_Persona,
            'nombre_completo'      => $e->NombreCompleto,
            'nombres'              => $e->Nombres,
            'paterno'              => $e->Paterno,
            'materno'              => $e->Materno,
            'correo'               => $e->Correo,
            'celular'              => $e->Celular,
            'telefono'             => $e->Telefono,
            'puesto'               => $e->Puesto,
            'area'                 => $e->Area,
            'campus'               => $e->ID_Campus,
            'correo_institucional' => $e->CorreoInstitucional,
            'id_fotografia'        => base64_encode($e->ID_Fotografia),
        ]);

        return response()->json($data);
    }
}
