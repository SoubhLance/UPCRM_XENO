import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronLeft, ChevronRight, RefreshCw, Download, Database,
  SlidersHorizontal, X, FileSpreadsheet, Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getCustomers } from "@/lib/api/customers";
import { getOrders } from "@/lib/api/orders";
import { getCampaigns, getCampaignEvents } from "@/lib/api/campaigns";
import StatusBadge from "@/components/cards/StatusBadge";
import type { Customer, Order, Campaign, CampaignEvent } from "@/types";

export const Route = createFileRoute("/_app/database")({
  component: DatabaseExplorer,
});

const TABS = [
  { id: "customers", label: "Customers" },
  { id: "orders", label: "Orders" },
  { id: "campaigns", label: "Campaigns" },
  { id: "events", label: "Campaign Events" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PAGE_SIZE = 20;

function DatabaseExplorer() {
  const [activeTab, setActiveTab] = useState<TabId>("customers");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState("default");
  
  // Specific filters
  const [customerSegment, setCustomerSegment] = useState("All");
  const [orderCategory, setOrderCategory] = useState("All");
  const [campaignChannel, setCampaignChannel] = useState("All");
  const [campaignStatus, setCampaignStatus] = useState("All");

  const [selectedRow, setSelectedRow] = useState<any>(null);

  // Queries
  const {
    data: customers = [],
    isLoading: lCustomers,
    refetch: rCustomers,
    isRefetching: rfCustomers
  } = useQuery({
    queryKey: ["db-customers", search, customerSegment, page],
    queryFn: () => getCustomers({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      search: search || undefined,
      segment: customerSegment !== "All" ? customerSegment : undefined
    }),
    enabled: activeTab === "customers",
    retry: false,
  });

  const {
    data: orders = [],
    isLoading: lOrders,
    refetch: rOrders,
    isRefetching: rfOrders
  } = useQuery({
    queryKey: ["db-orders", search, orderCategory, page],
    queryFn: () => getOrders({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      search: search || undefined,
      category: orderCategory !== "All" ? orderCategory : undefined
    }),
    enabled: activeTab === "orders",
    retry: false,
  });

  const {
    data: campaigns = [],
    isLoading: lCampaigns,
    refetch: rCampaigns,
    isRefetching: rfCampaigns
  } = useQuery({
    queryKey: ["db-campaigns", search, campaignChannel, campaignStatus],
    queryFn: () => getCampaigns(),
    enabled: activeTab === "campaigns",
    retry: false,
  });

  const {
    data: events = [],
    isLoading: lEvents,
    refetch: rEvents,
    isRefetching: rfEvents
  } = useQuery({
    queryKey: ["db-events", search, page],
    queryFn: () => getCampaignEvents({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      search: search || undefined
    }),
    enabled: activeTab === "events",
    retry: false,
    refetchInterval: 10000,
  });

  const isLoading = lCustomers || lOrders || lCampaigns || lEvents;
  const isRefetching = rfCustomers || rfOrders || rfCampaigns || rfEvents;

  // Sorting & Filtering (for local filter additions where backend is simpler)
  let displayCustomers = [...customers];
  if (sortBy === "spent") displayCustomers.sort((a, b) => b.total_spent - a.total_spent);
  if (sortBy === "orders") displayCustomers.sort((a, b) => b.total_orders - a.total_orders);
  if (sortBy === "id") displayCustomers.sort((a, b) => b.customer_id - a.customer_id);

  let displayOrders = [...orders];
  if (sortBy === "amount") displayOrders.sort((a, b) => b.total_amount - a.total_amount);
  if (sortBy === "quantity") displayOrders.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
  if (sortBy === "id") displayOrders.sort((a, b) => b.order_id - a.order_id);

  let displayCampaigns = campaigns.filter(c => {
    const matchSearch = !search || c.campaign_name?.toLowerCase().includes(search.toLowerCase());
    const matchChannel = campaignChannel === "All" || c.channel === campaignChannel;
    const matchStatus = campaignStatus === "All" || c.status === campaignStatus;
    return matchSearch && matchChannel && matchStatus;
  });
  if (sortBy === "sent") displayCampaigns.sort((a, b) => b.sent_count - a.sent_count);
  if (sortBy === "delivered") displayCampaigns.sort((a, b) => b.delivered_count - a.delivered_count);
  if (sortBy === "id") displayCampaigns.sort((a, b) => b.campaign_id - a.campaign_id);

  let displayEvents = [...events];
  if (sortBy === "id") displayEvents.sort((a, b) => b.event_id - a.event_id);
  if (sortBy === "campaign") displayEvents.sort((a, b) => b.campaign_id - a.campaign_id);

  const activeDataLength = 
    activeTab === "customers" ? displayCustomers.length :
    activeTab === "orders" ? displayOrders.length :
    activeTab === "campaigns" ? displayCampaigns.length :
    displayEvents.length;

  // Refetch current tab
  const handleRefresh = () => {
    if (activeTab === "customers") rCustomers();
    else if (activeTab === "orders") rOrders();
    else if (activeTab === "campaigns") rCampaigns();
    else if (activeTab === "events") rEvents();
  };

  // CSV Export
  const handleExportCSV = () => {
    let exportData: any[] = [];
    let prefix = "export";
    
    if (activeTab === "customers") {
      exportData = displayCustomers.map(c => ({
        "Customer ID": c.customer_id,
        "Name": c.name,
        "Email": c.email_addr,
        "Segment": c.segment,
        "Total Orders": c.total_orders,
        "Total Spent": c.total_spent,
        "Communication Status": c.communication_status,
      }));
      prefix = "customers";
    } else if (activeTab === "orders") {
      exportData = displayOrders.map(o => ({
        "Order ID": o.order_id,
        "Customer ID": o.customer_id,
        "Category": o.product_category,
        "Price": o.product_price,
        "Quantity": o.quantity,
        "Total Amount": o.total_amount,
      }));
      prefix = "orders";
    } else if (activeTab === "campaigns") {
      exportData = displayCampaigns.map(c => ({
        "Campaign ID": c.campaign_id,
        "Campaign Name": c.campaign_name,
        "Segment": c.segment,
        "Channel": c.channel,
        "Status": c.status,
        "Sent Count": c.sent_count,
        "Delivered Count": c.delivered_count,
        "Opened Count": c.opened_count,
        "Clicked Count": c.clicked_count,
        "Failed Count": c.failed_count,
      }));
      prefix = "campaigns";
    } else if (activeTab === "events") {
      exportData = displayEvents.map(e => ({
        "Event ID": e.event_id,
        "Campaign ID": e.campaign_id,
        "Customer ID": e.customer_id,
        "Channel": e.channel,
        "Status": e.status,
        "Timestamp": e.event_time,
        "Message": e.message,
        "Offer Code": e.offer_code,
        "Template Name": e.template_name,
        "Customer Name": e.customer_name,
      }));
      prefix = "campaign_events";
    }

    if (exportData.length === 0) return;

    const headers = Object.keys(exportData[0]).join(",");
    const rows = exportData.map(row =>
      Object.values(row).map(val => {
        const clean = String(val ?? "").replace(/"/g, '""');
        return `"${clean}"`;
      }).join(",")
    );
    const csvString = [headers, ...rows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${prefix}_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="text-primary" size={26} /> Database Viewer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and search live tables in the CRM relational database.
          </p>
        </motion.div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            disabled={activeDataLength === 0}
            className="rounded-xl bg-primary hover:bg-primary/90 gap-2 h-10 px-4"
          >
            <Download size={14} /> Export CSV
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading || isRefetching}
            className="rounded-xl h-10 w-10 bg-card border-border hover:bg-secondary/40"
          >
            <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-border gap-2 pb-px overflow-x-auto scrollbar-none">
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                setPage(0);
                setSearch("");
                setSortBy("default");
              }}
              className={`relative px-4 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="db-active-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                />
              )}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* FILTERS PANEL */}
      <div className="card-elevated rounded-2xl bg-card border border-border p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search table values…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-9 h-10 rounded-xl"
            />
          </div>

          {/* Contextual Filters */}
          {activeTab === "customers" && (
            <Select value={customerSegment} onValueChange={(v) => { setCustomerSegment(v); setPage(0); }}>
              <SelectTrigger className="w-[160px] h-10 rounded-xl">
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Segments</SelectItem>
                <SelectItem value="High-Value">High-Value</SelectItem>
                <SelectItem value="Medium-Value">Medium-Value</SelectItem>
                <SelectItem value="Low-Value">Low-Value</SelectItem>
                <SelectItem value="Churned">Churned</SelectItem>
              </SelectContent>
            </Select>
          )}

          {activeTab === "orders" && (
            <Select value={orderCategory} onValueChange={(v) => { setOrderCategory(v); setPage(0); }}>
              <SelectTrigger className="w-[160px] h-10 rounded-xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Books">Books</SelectItem>
                <SelectItem value="Home & Kitchen">Home & Kitchen</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
              </SelectContent>
            </Select>
          )}

          {activeTab === "campaigns" && (
            <>
              <Select value={campaignChannel} onValueChange={(v) => { setCampaignChannel(v); setPage(0); }}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Channels</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
              <Select value={campaignStatus} onValueChange={(v) => { setCampaignStatus(v); setPage(0); }}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          {/* Contextual Sorters */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-10 rounded-xl">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-muted-foreground" />
                <SelectValue placeholder="Sort" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Sort</SelectItem>
              {activeTab === "customers" && (
                <>
                  <SelectItem value="id">Customer ID</SelectItem>
                  <SelectItem value="spent">Total Spent</SelectItem>
                  <SelectItem value="orders">Total Orders</SelectItem>
                </>
              )}
              {activeTab === "orders" && (
                <>
                  <SelectItem value="id">Order ID</SelectItem>
                  <SelectItem value="amount">Total Amount</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                </>
              )}
              {activeTab === "campaigns" && (
                <>
                  <SelectItem value="id">Campaign ID</SelectItem>
                  <SelectItem value="sent">Sent Count</SelectItem>
                  <SelectItem value="delivered">Delivered Count</SelectItem>
                </>
              )}
              {activeTab === "events" && (
                <>
                  <SelectItem value="id">Event ID</SelectItem>
                  <SelectItem value="campaign">Campaign ID</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TABLE AND STATES */}
      <div className="card-elevated rounded-2xl bg-card border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : activeDataLength === 0 ? (
          <EmptyDataState />
        ) : (
          <div className="overflow-x-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <table className="w-full text-sm">
                  <thead className="bg-secondary/60 border-b border-border">
                    {activeTab === "customers" && (
                      <tr className="text-left">
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Customer ID</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Name</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Email</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Segment</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground text-right">Total Orders</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground text-right">Total Spent</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Comm Status</th>
                      </tr>
                    )}

                    {activeTab === "orders" && (
                      <tr className="text-left">
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Order ID</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Customer ID</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Category</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground text-right">Price</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground text-right">Quantity</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground text-right">Total Amount</th>
                      </tr>
                    )}

                    {activeTab === "campaigns" && (
                      <tr className="text-left">
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Campaign ID</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Campaign Name</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Segment</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Channel</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Status</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground text-right">Sent</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground text-right">Delivered</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground text-right">Opened</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground text-right">Clicked</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground text-right">Failed</th>
                      </tr>
                    )}

                    {activeTab === "events" && (
                      <tr className="text-left">
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Event ID</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Campaign ID</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Customer ID</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Customer Name</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Channel</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Status</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Timestamp</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Message</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Offer Code</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase text-muted-foreground">Template Name</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {activeTab === "customers" &&
                      (displayCustomers as Customer[]).map((c, i) => (
                        <tr
                          key={c.customer_id}
                          onClick={() => setSelectedRow({ type: "Customer", data: c })}
                          className="border-b border-border/50 last:border-0 hover:bg-secondary/40 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-3.5 font-mono text-muted-foreground">#{c.customer_id}</td>
                          <td className="px-5 py-3.5 font-medium">{c.name}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{c.email_addr}</td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={c.segment} />
                          </td>
                          <td className="px-5 py-3.5 text-right tabular-nums">{c.total_orders}</td>
                          <td className="px-5 py-3.5 text-right tabular-nums font-semibold">
                            ${c.total_spent?.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={c.communication_status} />
                          </td>
                        </tr>
                      ))}

                    {activeTab === "orders" &&
                      (displayOrders as Order[]).map((o, i) => (
                        <tr
                          key={o.order_id}
                          onClick={() => setSelectedRow({ type: "Order", data: o })}
                          className="border-b border-border/50 last:border-0 hover:bg-secondary/40 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-3.5 font-mono text-muted-foreground">#{o.order_id}</td>
                          <td className="px-5 py-3.5 font-mono text-muted-foreground">#{o.customer_id}</td>
                          <td className="px-5 py-3.5">{o.product_category || "—"}</td>
                          <td className="px-5 py-3.5 text-right tabular-nums">${o.product_price?.toFixed(2)}</td>
                          <td className="px-5 py-3.5 text-right tabular-nums">{o.quantity}</td>
                          <td className="px-5 py-3.5 text-right tabular-nums font-semibold">
                            ${o.total_amount?.toFixed(2)}
                          </td>
                        </tr>
                      ))}

                    {activeTab === "campaigns" &&
                      (displayCampaigns as Campaign[]).map((c, i) => (
                        <tr
                          key={c.campaign_id}
                          onClick={() => setSelectedRow({ type: "Campaign", data: c })}
                          className="border-b border-border/50 last:border-0 hover:bg-secondary/40 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-3.5 font-mono text-muted-foreground">#{c.campaign_id}</td>
                          <td className="px-5 py-3.5 font-medium">{c.campaign_name}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{c.segment || "—"}</td>
                          <td className="px-5 py-3.5 text-muted-foreground capitalize">{c.channel || "—"}</td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="px-5 py-3.5 text-right tabular-nums">{c.sent_count}</td>
                          <td className="px-5 py-3.5 text-right tabular-nums text-emerald-600">{c.delivered_count}</td>
                          <td className="px-5 py-3.5 text-right tabular-nums text-amber-600">{c.opened_count}</td>
                          <td className="px-5 py-3.5 text-right tabular-nums text-violet-600">{c.clicked_count}</td>
                          <td className="px-5 py-3.5 text-right tabular-nums text-red-600">{c.failed_count}</td>
                        </tr>
                      ))}

                    {activeTab === "events" &&
                      (displayEvents as CampaignEvent[]).map((e, i) => (
                        <tr
                          key={e.event_id}
                          onClick={() => setSelectedRow({ type: "Campaign Event", data: e })}
                          className="border-b border-border/50 last:border-0 hover:bg-secondary/40 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-3.5 font-mono text-muted-foreground">#{e.event_id}</td>
                          <td className="px-5 py-3.5 font-mono text-muted-foreground">#{e.campaign_id}</td>
                          <td className="px-5 py-3.5 font-mono text-muted-foreground">#{e.customer_id}</td>
                          <td className="px-5 py-3.5 font-medium">{e.customer_name}</td>
                          <td className="px-5 py-3.5 text-muted-foreground capitalize">{e.channel}</td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={e.status} />
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground text-xs">
                            {e.event_time ? new Date(e.event_time).toLocaleString() : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground max-w-[200px] truncate">{e.message}</td>
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700">
                              {e.offer_code}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">{e.template_name}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {activeTab !== "campaigns" && activeDataLength > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} · showing up to {PAGE_SIZE} rows
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-xl border-border bg-card hover:bg-secondary/40 gap-1.5"
            >
              <ChevronLeft size={14} /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={activeDataLength < PAGE_SIZE}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border-border bg-card hover:bg-secondary/40 gap-1.5"
            >
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* ROW MODAL */}
      <Dialog open={!!selectedRow} onOpenChange={() => setSelectedRow(null)}>
        <DialogContent className="max-w-xl rounded-2xl">
          {selectedRow && (
            <>
              <DialogHeader className="border-b border-border pb-3">
                <DialogTitle className="text-lg flex items-center gap-2">
                  <Database className="text-primary" size={18} />
                  {selectedRow.type} Inspector
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4 max-h-[70dvh] overflow-y-auto space-y-4 pr-1">
                {Object.entries(selectedRow.data).map(([key, val]) => {
                  if (typeof val === "object" && val !== null) {
                    return (
                      <div key={key} className="space-y-1">
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                          {key.replace(/_/g, " ")}
                        </p>
                        <div className="bg-secondary/40 border border-border rounded-xl p-3 text-xs space-y-1 font-mono">
                          {Object.entries(val).map(([nk, nv]: any) => (
                            <div key={nk} className="flex justify-between">
                              <span className="text-muted-foreground">{nk}:</span>
                              <span className="font-semibold text-foreground">{String(nv)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0 text-sm">
                      <span className="text-muted-foreground font-medium capitalize">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="font-semibold text-foreground text-right max-w-[70%] truncate">
                        {key === "segment" || key === "status" || key === "communication_status" ? (
                          <StatusBadge status={String(val)} />
                        ) : String(val) === "true" || String(val) === "false" ? (
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            val ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"
                          }`}>
                            {String(val)}
                          </span>
                        ) : (
                          String(val ?? "—")
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyDataState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      {/* SVG database explorer illustration */}
      <svg
        className="w-32 h-32 text-muted-foreground/30 mb-4 animate-pulse"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5V19A9 3 0 0 0 21 19V5" />
        <path d="M3 12A9 3 0 0 0 21 12" />
        <circle cx="12" cy="12" r="3" stroke="#2563EB" strokeWidth="1.5" />
        <line x1="14.5" y1="14.5" x2="19" y2="19" stroke="#F59E0B" strokeWidth="1.5" />
      </svg>
      <h3 className="text-md font-semibold text-foreground">No records matched search criteria</h3>
      <p className="text-sm text-muted-foreground max-w-sm mt-1">
        We couldn't locate any records in this table. Try refining your filters, clearing your search term, or seed new data using the Data Uploader.
      </p>
    </div>
  );
}
