// Centralized types matching FastAPI backend schemas
export interface Customer {
  customer_id: number;
  name: string;
  email_addr?: string;
  phone?: string;
  gender?: string;
  age?: number;
  city?: string;
  segment?: string;
  preferred_channel?: string;
  favorite_category?: string;
  total_orders: number;
  total_spent: number;
  days_since_last_order: number;
  last_order_date?: string;
  communication_status?: string;
  last_contacted?: string;
}

export interface Campaign {
  campaign_id: number;
  campaign_name: string;
  segment?: string;
  channel?: string;
  status?: string;
  message?: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  failed_count: number;
  created_at?: string;
}

export interface CampaignCreate {
  campaign_name: string;
  segment?: string;
  channel: string;
  message: string;
  customer_ids?: number[];
}

export interface Order {
  order_id: number;
  customer_id: number;
  purchase_date?: string;
  product_category?: string;
  product_price?: number;
  quantity?: number;
  total_amount: number;
  payment_method?: string;
  returned?: boolean;
}

export interface CampaignEvent {
  event_id: number;
  campaign_id: number;
  customer_id: number;
  channel: string;
  status: string;
  event_time?: string;
  message?: string;
  offer_code?: string;
  template_name?: string;
  customer_name?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  response: string;
}

export interface SystemService {
  name: string;
  status: "healthy" | "degraded" | "down";
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
  timestamp: Date;
  read: boolean;
}
