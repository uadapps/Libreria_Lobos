// ============================================
// 📁 src/config/axios.ts
// Configuración centralizada de Axios
// ============================================

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Configuración base
const axiosConfig: AxiosRequestConfig = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Instancia para APIs externas (Google Books, OpenLibrary)
export const externalApi: AxiosInstance = axios.create({
  ...axiosConfig,
  timeout: 15000, // Más tiempo para APIs externas
});

// Instancia para tu backend
export const backendApi: AxiosInstance = axios.create({
  ...axiosConfig,
  baseURL: '/api', // Tu API base
  timeout: 8000,
});

// Interceptor para requests (agregar token, logging, etc.)
backendApi.interceptors.request.use(
  (config) => {
    // Agregar token de autenticación si existe
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log de requests en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Request:', config.method?.toUpperCase(), config.url);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses (manejo de errores, transformaciones)
backendApi.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log de responses exitosas en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Response:', response.status, response.config.url);
    }

    return response;
  },
  (error) => {
    // Manejo centralizado de errores
    if (error.response) {
      // Error del servidor
      const { status, data } = error.response;

      switch (status) {
        case 401:
          console.log('🔒 No autorizado - redirigiendo al login');
          // window.location.href = '/login';
          break;
        case 403:
          console.log('🚫 Acceso prohibido');
          break;
        case 404:
          console.log('📭 Recurso no encontrado');
          break;
        case 422:
          console.log('⚠️ Error de validación:', data.errors);
          break;
        case 500:
          console.log('💥 Error del servidor');
          break;
        default:
          console.log(`❌ Error ${status}:`, data.message);
      }
    } else if (error.request) {
      // No hay respuesta del servidor
      console.log('🌐 Sin respuesta del servidor');
    } else {
      // Error de configuración
      console.log('⚙️ Error de configuración:', error.message);
    }

    return Promise.reject(error);
  }
);

// Interceptor para APIs externas (sin auth)
externalApi.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🌍 External API Request:', config.url);
    }
    return config;
  }
);

externalApi.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🌍 External API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    console.warn('🌍 External API Error:', error.message);
    return Promise.reject(error);
  }
);

// Función para cancelar requests
export const createCancelToken = () => axios.CancelToken.source();

// Función para verificar si un error es de cancelación
export const isCancel = (error: any) => axios.isCancel(error);

// Hook personalizado para requests con cancelación automática
export const useApiRequest = () => {
  const cancelTokenRef = React.useRef<any>(null);

  React.useEffect(() => {
    return () => {
      // Cancelar requests al desmontar componente
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
      }
    };
  }, []);

  const makeRequest = async (requestFn: (cancelToken: any) => Promise<any>) => {
    // Cancelar request anterior si existe
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('New request initiated');
    }

    // Crear nuevo cancel token
    cancelTokenRef.current = createCancelToken();

    try {
      const result = await requestFn(cancelTokenRef.current.token);
      return result;
    } catch (error) {
      if (!isCancel(error)) {
        throw error;
      }
    }
  };

  return { makeRequest };
};

export default { backendApi, externalApi };
