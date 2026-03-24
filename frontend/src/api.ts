import type { ItemsResponse } from "./types";

const BASE_URL = "http://localhost:8080";

export async function fetchItems(params: URLSearchParams, signal?: AbortSignal): Promise<ItemsResponse> {
  const response = await fetch(`${BASE_URL}/items?${params.toString()}`, { signal });
  if (!response.ok) throw new Error("Не удалось загрузить объявления");
  return response.json();
}

export async function fetchItemById(id: string, signal?: AbortSignal): Promise<ItemsResponse> {
  const response = await fetch(`${BASE_URL}/items/${id}`, { signal });
  if (!response.ok) throw new Error("Не удалось загрузить объявление");
  return response.json();
}

export async function updateItem(id: string, payload: unknown): Promise<void> {
  const response = await fetch(`${BASE_URL}/items/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Не удалось сохранить изменения");
}
