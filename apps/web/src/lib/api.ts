const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status,
      res.status === 401 ? 'No autorizado' :
      res.status === 403 ? 'Sin permisos' :
      res.status === 404 ? 'No encontrado' :
      res.status === 409 ? 'Conflicto' :
      res.status === 429 ? 'Demasiadas solicitudes' :
      res.status >= 500 ? 'Error del servidor' :
      `Error: ${res.status}`
    );
  }

  return res.json();
}

export { API_URL };
