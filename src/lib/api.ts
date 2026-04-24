/**
 * api.ts — Wrapper centralizado de comunicación con el Backend.
 * 
 * PRINCIPIO SOLID — SRP:
 * Este módulo tiene UNA sola responsabilidad: ejecutar peticiones HTTP
 * hacia la API de .NET inyectando automáticamente el JWT Bearer.
 * 
 * PRINCIPIO SOLID — OCP:
 * Para agregar un nuevo endpoint, simplemente creas una nueva función
 * que llame a `apiFetch()`. No necesitas modificar la función base.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5084';

/**
 * Función base que envuelve `fetch()` inyectando headers de autenticación.
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const sessionRaw = sessionStorage.getItem('compraflash_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (sessionRaw) {
    headers['Authorization'] = `Bearer ${sessionRaw}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new ApiError(response.status, errorBody);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export class ApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`API Error ${status}: ${body}`);
    this.name = 'ApiError';
  }
}

// ═══════════════════════════════════════════════════
// Interfaces alineadas con los DTOs del Backend
// ═══════════════════════════════════════════════════

export interface AuthResponse {
  token: string;
  provider: string;
  email: string;
  displayName: string;
  expiresAt: string;
}

/** Corresponde a ListaResponse del backend (sin ítems) */
export interface ListaResponse {
  id: string;
  nombre: string;
  shareToken: string;
  allowEdit: boolean;
  createdAt: string;
  cantidadItems: number;
  totalEstimado: number | null;
}

/** Corresponde a ListaDetalleResponse del backend (con ítems) */
export interface ListaDetalleResponse {
  id: string;
  nombre: string;
  shareToken: string;
  allowEdit: boolean;
  createdAt: string;
  totalEstimado: number | null;
  items: ItemResponse[];
}

/** Corresponde a ItemResponse del backend */
export interface ItemResponse {
  id: string;
  listId: string;
  nombre: string;
  cantidad: number;
  unidad: string | null;
  precio: number | null;
  barcode: string | null;
  comprado: boolean;
  subtotal: number | null;
  createdAt: string;
}

/** Corresponde a CrearItemRequest del backend */
export interface CrearItemRequest {
  nombre: string;
  cantidad: number;
  unidad?: string;
  precio?: number;
  barcode?: string;
  productId?: string;
}

/** Corresponde a ActualizarItemRequest del backend */
export interface ActualizarItemRequest {
  nombre?: string;
  cantidad?: number;
  unidad?: string;
  precio?: number;
  comprado?: boolean;
}

export interface ProductoResponse {
  id: string;
  nombre: string;
  marca: string | null;
  barcode: string | null;
  unidad: string | null;
  precioEstimado: number | null;
  isGlobal: boolean;
}

// ═══════════════════════════════════════════════════
// Servicios de Autenticación
// ═══════════════════════════════════════════════════

export const loginAnonimo = () =>
  apiFetch<AuthResponse>('/api/auth/anonimo', { method: 'POST' });

export const loginGoogle = (googleToken: string) =>
  apiFetch<AuthResponse>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ token: googleToken }),
  });

export const renovarToken = () =>
  apiFetch<AuthResponse>('/api/auth/renovar', { method: 'POST' });

// ═══════════════════════════════════════════════════
// Servicios de Listas
// ═══════════════════════════════════════════════════

/** GET /api/listas — Obtener todas las listas del usuario (sin ítems) */
export const obtenerListas = () =>
  apiFetch<ListaResponse[]>('/api/listas');

/** POST /api/listas — Crear una nueva lista */
export const crearLista = (nombre: string) =>
  apiFetch<ListaResponse>('/api/listas', {
    method: 'POST',
    body: JSON.stringify({ nombre }),
  });

/** GET /api/listas/:id — Obtener una lista CON sus ítems (detalle) */
export const obtenerLista = (id: string) =>
  apiFetch<ListaDetalleResponse>(`/api/listas/${id}`);

/** PATCH /api/listas/:id — Editar nombre o allowEdit */
export const actualizarLista = (id: string, data: { nombre?: string; allowEdit?: boolean }) =>
  apiFetch<ListaResponse>(`/api/listas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

/** DELETE /api/listas/:id — Eliminar una lista */
export const eliminarLista = (id: string) =>
  apiFetch<void>(`/api/listas/${id}`, { method: 'DELETE' });

/** GET /api/compartida/:token — Vista pública de lista compartida (sin auth) */
export const obtenerListaCompartida = (token: string) =>
  apiFetch<ListaDetalleResponse>(`/api/compartida/${token}`);

// ═══════════════════════════════════════════════════
// Servicios de Ítems
// ═══════════════════════════════════════════════════

/** POST /api/listas/:id/items — Agregar ítem a una lista */
export const agregarItem = (listaId: string, data: CrearItemRequest) =>
  apiFetch<ItemResponse>(`/api/listas/${listaId}/items`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

/** PATCH /api/items/:id — Actualizar un ítem */
export const actualizarItem = (itemId: string, data: ActualizarItemRequest) =>
  apiFetch<ItemResponse>(`/api/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

/** DELETE /api/items/:id — Eliminar un ítem */
export const eliminarItem = (itemId: string) =>
  apiFetch<void>(`/api/items/${itemId}`, { method: 'DELETE' });

// ═══════════════════════════════════════════════════
// Servicios de Productos (Catálogo + Barcode)
// ═══════════════════════════════════════════════════

export const buscarPorBarcode = (barcode: string) =>
  apiFetch<ProductoResponse[]>(`/api/productos/barcode/${barcode}`);

export const buscarPorTexto = (texto: string) =>
  apiFetch<ProductoResponse[]>(`/api/productos/buscar?texto=${encodeURIComponent(texto)}`);

/** POST /api/productos — Guardar un producto personal para uso futuro */
export const crearProductoPersonal = (data: {
  nombre: string;
  marca?: string;
  barcode?: string;
  unidad?: string;
  precio?: number;
}) =>
  apiFetch<ProductoResponse>('/api/productos', {
    method: 'POST',
    body: JSON.stringify(data),
  });

/** DELETE /api/productos/:id — Eliminar producto personal */
export const eliminarProducto = (id: string) =>
  apiFetch<void>(`/api/productos/${id}`, { method: 'DELETE' });

