import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type LoginProps = {
  status?: string;
  canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: LoginProps) {
  const { data, setData, post, processing, errors, reset } = useForm<{
    username: string;
    password: string;
    remember: boolean;
  }>({
    username: '',
    password: '',
    remember: false,
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [formLogoLoaded, setFormLogoLoaded] = useState(false);

  useEffect(() => {
    return () => {
      reset('password');
    };
  }, []);

  const submit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!data.username || !data.password) return;
    post(route('login'));
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/fondo.mp4"
        poster="/images/fondo.jpg"
        autoPlay
        muted
        loop
        playsInline
        onCanPlayThrough={() => setIsLoaded(true)}
      >
        <img src="/images/fondo.jpg" alt="Fondo" />
      </video>

      {showSplash && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-1000 ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          onTransitionEnd={() => {
            if (isLoaded) {
              setShowSplash(false);
            }
          }}
        >
          <div className="w-full h-full flex">
            <div className="w-1/2 h-full bg-black animate-slide-left"></div>
            <div className="w-1/2 h-full bg-black animate-slide-right"></div>
          </div>
          <img
            src="/images/logo_White.png"
            alt=""
            onLoad={() => setLogoLoaded(true)}
            className={`absolute h-64 w-64 animate-pulse transition-opacity duration-1000 ${
              logoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      )}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-white/20 bg-black/40 px-6 py-4 text-white shadow-2xl backdrop-blur-xl">
        <div className="-mb-10 flex justify-center">
          <img
            src="/images/logo_white.png"
            alt=""
            onLoad={() => setFormLogoLoaded(true)}
            className={`h-auto max-w-[250px] drop-shadow-xl transition-opacity duration-500 ${
              formLogoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
        <h2 className=" mb-4 text-center text-4xl font-bookstore  font-bold">
          Iniciar sesión
        </h2>

        {status && <div className="mb-4 text-sm text-green-500">{status}</div>}

        <form onSubmit={submit} noValidate>
          <div className="mb-3">
            <label htmlFor="username" className="block text-sm font-medium">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              placeholder="Tu nombre de usuario"
              value={data.username}
              onChange={(e) => setData('username', e.target.value)}
              required
              className="mt-1 w-full rounded-md bg-white/80 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#c10230]"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-400">{errors.username}</p>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="block text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="Tu contraseña"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              required
              className="mt-1 w-full rounded-md bg-white/80 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#c10230]"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          <div className="mb-4 flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={data.remember}
                onChange={(e) => setData('remember', e.target.checked)}
                className="rounded border-gray-300 text-[#c10230] focus:ring-[#c10230]"
              />
              <span className="ml-2 text-sm">Recordarme</span>
            </label>

            {canResetPassword && (
              <a
                href={route('password.request')}
                className="text-sm text-[#c10230] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
            )}
          </div>

          <button
            type="submit"
            disabled={processing}
            className="mb-4 w-full rounded bg-[#c10230] px-4 py-2 font-semibold text-white transition-colors duration-200 hover:bg-[#a1001f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
