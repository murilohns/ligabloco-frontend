// frontend/src/lib/services.api.ts
import { apiClient } from './axios';
import type { ServiceCategory, PricingType } from './service-categories';

export interface ServiceProvider {
  id: string;
  name: string;
  phone: string | null;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  pricing_type: PricingType;
  price: number | null;
  category: ServiceCategory;
  image_urls: string[];
  thumb_urls: string[];
  is_active: boolean;
  provider: ServiceProvider;
  created_at: string;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  pricing_type: PricingType;
  price?: number;
  category: ServiceCategory;
  images: File[];
}

export interface UpdateServiceInput {
  name?: string;
  description?: string;
  pricing_type?: PricingType;
  price?: number;
  category?: ServiceCategory;
  keepImages: string[];
  newImages: File[];
}

function parseService(raw: unknown): Service {
  const r = raw as Record<string, unknown>;
  return { ...(r as object), price: r.price ? Number(r.price) : null } as Service;
}

export async function listServices(): Promise<Service[]> {
  const { data } = await apiClient.get<unknown[]>('/services');
  return data.map(parseService);
}

export async function listMyServices(): Promise<Service[]> {
  const { data } = await apiClient.get<unknown[]>('/services/mine');
  return data.map(parseService);
}

export async function getService(id: string): Promise<Service> {
  const { data } = await apiClient.get<unknown>(`/services/${id}`);
  return parseService(data);
}

export async function createService(input: CreateServiceInput): Promise<Service> {
  const fd = new FormData();
  fd.append('name', input.name);
  if (input.description) fd.append('description', input.description);
  fd.append('pricing_type', input.pricing_type);
  if (input.price !== undefined) fd.append('price', String(input.price));
  fd.append('category', input.category);
  for (const file of input.images) fd.append('images', file);
  const { data } = await apiClient.post<unknown>('/services', fd);
  return parseService(data);
}

export async function updateService(id: string, input: UpdateServiceInput): Promise<Service> {
  const fd = new FormData();
  if (input.name !== undefined) fd.append('name', input.name);
  if (input.description !== undefined) fd.append('description', input.description);
  if (input.pricing_type !== undefined) fd.append('pricing_type', input.pricing_type);
  if (input.price !== undefined) fd.append('price', String(input.price));
  if (input.category !== undefined) fd.append('category', input.category);
  for (const url of input.keepImages) fd.append('keepImages', url);
  for (const file of input.newImages) fd.append('newImages', file);
  const { data } = await apiClient.patch<unknown>(`/services/${id}`, fd);
  return parseService(data);
}

export async function softDeleteService(id: string): Promise<void> {
  await apiClient.delete(`/services/${id}`);
}

export async function reactivateService(id: string): Promise<Service> {
  const { data } = await apiClient.patch<unknown>(`/services/${id}/reactivate`);
  return parseService(data);
}

export async function hardDeleteService(id: string, reason: string): Promise<void> {
  await apiClient.delete(`/services/${id}/hard-delete`, { data: { reason } });
}
