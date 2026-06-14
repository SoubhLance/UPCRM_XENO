import { api } from "./client";
import type { ChatResponse } from "@/types";

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>("/chat", { message });
  return data;
}
