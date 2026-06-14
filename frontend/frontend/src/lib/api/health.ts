import { api } from "./client";

export async function checkHealth() {
  const { data } = await api.get("/");
  return data;
}
