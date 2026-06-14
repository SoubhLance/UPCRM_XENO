import { api } from "./client";

export async function getAnalytics(): Promise<any> {
  const { data } = await api.get("/analytics");
  return data;
}
