import { api } from "./client";
import type { Campaign, CampaignCreate, CampaignEvent } from "@/types";

export async function getCampaigns(): Promise<Campaign[]> {
  const { data } = await api.get<Campaign[]>("/campaigns");
  return data;
}

export async function getCampaign(id: number): Promise<Campaign> {
  const { data } = await api.get<Campaign>(`/campaigns/${id}`);
  return data;
}

export async function createCampaign(payload: CampaignCreate): Promise<Campaign> {
  const { data } = await api.post<Campaign>("/campaign/create", payload);
  return data;
}

export interface CampaignEventsQuery {
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getCampaignEvents(params: CampaignEventsQuery = {}): Promise<CampaignEvent[]> {
  const { data } = await api.get<CampaignEvent[]>("/campaign-events", { params });
  return data;
}
