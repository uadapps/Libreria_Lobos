// services/empleados.ts
import axios from 'axios';
import type { Empleado } from '../../types/Empleado';

export const buscarEmpleados = async (query: string): Promise<Empleado[]> => {
  const response = await axios.get<Empleado[]>('/api/empleados', {
    params: { search: query },
    headers: { Accept: 'application/json' },
  });
  return response.data;
};
