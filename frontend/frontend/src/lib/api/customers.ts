import { api } from "./client";
import type { Customer } from "@/types";

export interface CustomerQuery {
  segment?: string;
  channel?: string;
  days_inactive_min?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getCustomers(params: CustomerQuery = {}): Promise<Customer[]> {
  const { data } = await api.get<Customer[]>("/customers", { params });
  return data;
}

export async function getCustomer(id: number): Promise<Customer> {
  const { data } = await api.get<Customer>(`/customers/${id}`);
  return data;
}

export async function ingestCustomers(file: File, onProgress?: (pct: number) => void) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/ingest/customers", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return data;
}
