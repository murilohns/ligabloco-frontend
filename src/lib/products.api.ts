import { apiClient } from './axios';
import type { Category } from './categories';

export interface ProductSeller {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: Category;
  image_urls: string[];
  is_active: boolean;
  seller: ProductSeller;
  created_at: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  category: Category;
  images: File[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  category?: Category;
  keepImages: string[];
  newImages: File[];
}

// Prisma Decimal arrives as string over JSON — parse to Number in one place
function parseProduct(raw: unknown): Product {
  const r = raw as Record<string, unknown>;
  return { ...(r as object), price: Number(r.price) } as Product;
}

export async function listProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<unknown[]>('/products');
  return data.map(parseProduct);
}

export async function listMyProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<unknown[]>('/products/mine');
  return data.map(parseProduct);
}

export async function getProduct(id: string): Promise<Product> {
  const { data } = await apiClient.get<unknown>(`/products/${id}`);
  return parseProduct(data);
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const fd = new FormData();
  fd.append('name', input.name);
  if (input.description) fd.append('description', input.description);
  fd.append('price', String(input.price));
  fd.append('category', input.category);
  for (const file of input.images) fd.append('images', file);
  // DO NOT manually set Content-Type — axios detects FormData and adds boundary (research Pitfall 4)
  const { data } = await apiClient.post<unknown>('/products', fd);
  return parseProduct(data);
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const fd = new FormData();
  if (input.name !== undefined) fd.append('name', input.name);
  if (input.description !== undefined) fd.append('description', input.description);
  if (input.price !== undefined) fd.append('price', String(input.price));
  if (input.category !== undefined) fd.append('category', input.category);
  for (const url of input.keepImages) fd.append('keepImages', url);
  for (const file of input.newImages) fd.append('newImages', file);
  const { data } = await apiClient.patch<unknown>(`/products/${id}`, fd);
  return parseProduct(data);
}

export async function softDeleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}

export async function reactivateProduct(id: string): Promise<Product> {
  const { data } = await apiClient.patch<unknown>(`/products/${id}/reactivate`);
  return parseProduct(data);
}
