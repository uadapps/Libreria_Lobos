import { useForm } from '@inertiajs/react';

export default function Form({ user = {}, onSuccess = () => {} }) {
  const { data, setData, post, put, processing, errors, reset } = useForm({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    password_confirmation: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const options = {
      onSuccess: () => {
        reset();
        onSuccess();
      },
    };

    if (user?.id) {
      put(`/usuarios/${user.id}`, options);
    } else {
      post('/usuarios', options);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground">Nombre</label>
        <input
          type="text"
          placeholder="Juan Pérez"
          value={data.name}
          onChange={(e) => setData('name', e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2 bg-background text-foreground"
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground">Email</label>
        <input
          type="email"
          placeholder="correo@ejemplo.com"
          value={data.email}
          onChange={(e) => setData('email', e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2 bg-background text-foreground"
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground">Contraseña</label>
        <input
          type="password"
          placeholder="••••••••"
          value={data.password}
          onChange={(e) => setData('password', e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2 bg-background text-foreground"
        />
        {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground">Confirmar Contraseña</label>
        <input
          type="password"
          placeholder="••••••••"
          value={data.password_confirmation}
          onChange={(e) => setData('password_confirmation', e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2 bg-background text-foreground"
        />
      </div>

      <div className="text-right">
        <button
          type="submit"
          disabled={processing}
          className="rounded bg-[#c10230] px-4 py-2 font-semibold text-white hover:bg-[#a1001f] disabled:opacity-50"
        >
          {processing ? 'Guardando...' : user?.id ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}
