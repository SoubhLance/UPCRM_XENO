import { api } from "./client";
import type { Order } from "@/types";

export interface OrderQuery {
  search?: string;
  category?: string;
  returned?: boolean;
  limit?: number;
  offset?: number;
}

export async function getOrders(params: OrderQuery = {}): Promise<Order[]> {
  const { data } = await api.get<Order[]>("/orders", { params });
  return data;
}

export async function ingestOrders(file: File, onProgress?: (pct: number) => void) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/ingest/orders", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return data;
}
