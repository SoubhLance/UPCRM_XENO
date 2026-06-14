import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users, UserCheck, UserX, Megaphone, Mail, CheckCircle2,
  Eye, MousePointerClick, AlertTriangle, DollarSign, ShoppingCart, RefreshCw,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Legend, AreaChart, Area,
} from "recharts";
import { getCampaigns } from "@/lib/api/campaigns";
import { getAnalytics } from "@/lib/api/analytics";
import StatCard from "@/components/cards/StatCard";
import StatusBadge from "@/components/cards/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Campaign } from "@/types";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"];

function Dashboard() {
  const { data: analytics, isLoading: l1, isError: e1, refetch: r1 } = useQuery({
    queryKey: ["analytics-all"], queryFn: getAnalytics, retry: false,
  });
  const { data: campaigns = [], isLoading: l2, isError: e2, refetch: r2 } = useQuery({
    queryKey: ["campaigns"], queryFn: getCampaigns, retry: false,
  });

  const isLoading = l1 || l2;
  const isError = e1 || e2;
  const refetch = () => { r1(); r2(); };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <AlertTriangle size={48} className="text-destructive animate-pulse" />
        <h3 className="text-lg font-semibold">Failed to load dashboard</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          There was an error retrieving dashboard analytics. Please check your backend connection.
        </p>
        <Button onClick={() => refetch()} className="gap-2 rounded-xl">
          <RefreshCw size={14} /> Retry
        </Button>
      </div>
    );
  }

  const kpis = analytics?.kpis || {
    total_customers: 0,
    active_customers: 0,
    inactive_customers: 0,
    total_campaigns: 0,
    emails_sent: 0,
    total_revenue: 0,
    total_orders: 0,
  };

  const charts = analytics?.charts || {
    active_vs_inactive: [],
    sales_trend: [],
    campaign_performance: [],
    delivery_funnel: [],
    segment_distribution: [],
    top_categories: []
  };

  const totalCustomers = kpis.total_customers;
  const activeCustomers = kpis.active_customers;
  const inactiveCustomers = kpis.inactive_customers;
  const totalRevenue = kpis.total_revenue;
  const totalOrders = kpis.total_orders;

  const totalSent = kpis.emails_sent;
  const totalDelivered = charts.delivery_funnel.find((f: any) => f.stage === "Delivered")?.value || 0;
  const totalOpened = charts.delivery_funnel.find((f: any) => f.stage === "Opened")?.value || 0;
  const totalClicked = charts.delivery_funnel.find((f: any) => f.stage === "Clicked")?.value || 0;
  const totalFailed = campaigns.reduce((s: number, c: Campaign) => s + (c.failed_count || 0), 0);

  const pieData = charts.active_vs_inactive.length > 0 ? charts.active_vs_inactive : [
    { name: "Active", value: activeCustomers },
    { name: "Inactive", value: inactiveCustomers },
  ];

  const campaignPerf = charts.campaign_performance.length > 0 ? charts.campaign_performance : campaigns.slice(0, 8).map((c: Campaign) => ({
    name: c.campaign_name?.slice(0, 12) || `#${c.campaign_id}`,
    Sent: c.sent_count, Delivered: c.delivered_count,
    Opened: c.opened_count, Clicked: c.clicked_count,
  }));

  const funnel = charts.delivery_funnel.length > 0 ? charts.delivery_funnel : [
    { stage: "Sent", value: totalSent },
    { stage: "Delivered", value: totalDelivered },
    { stage: "Opened", value: totalOpened },
    { stage: "Clicked", value: totalClicked },
  ];

  return (
    <div className="space-y-6 max-w-[1600px]">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's what's happening across your customer base today.</p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatCard label="Total Customers" value={totalCustomers} icon={Users} tone="primary" delay={0.0} />
            <StatCard label="Active" value={activeCustomers} icon={UserCheck} tone="success" delay={0.05} />
            <StatCard label="Inactive" value={inactiveCustomers} icon={UserX} tone="danger" delay={0.1} />
            <StatCard label="Revenue" value={Math.round(totalRevenue)} prefix="$" icon={DollarSign} tone="success" delay={0.15} />
            <StatCard label="Orders" value={totalOrders} icon={ShoppingCart} tone="info" delay={0.2} />
            <StatCard label="Campaigns" value={campaigns.length} icon={Megaphone} tone="primary" delay={0.25} />
            <StatCard label="Sent" value={totalSent} icon={Mail} tone="info" delay={0.3} />
            <StatCard label="Delivered" value={totalDelivered} icon={CheckCircle2} tone="success" delay={0.35} />
            <StatCard label="Opened" value={totalOpened} icon={Eye} tone="warning" delay={0.4} />
            <StatCard label="Clicked" value={totalClicked} icon={MousePointerClick} tone="primary" delay={0.45} />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <ChartCard title="Active vs Inactive" delay={0.5}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={[COLORS[1], COLORS[4]][i]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Campaign Funnel" delay={0.55} className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={funnel}>
                  <defs>
                    <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 255)" />
                  <XAxis dataKey="stage" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2.5} fill="url(#fg)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <ChartCard title="Campaign Performance" delay={0.6}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={campaignPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 255)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="Sent" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Delivered" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Opened" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Clicked" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Recent Campaigns" delay={0.65}>
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {campaigns.slice(0, 6).map((c: Campaign) => (
                  <div key={c.campaign_id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{c.campaign_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.channel} · {c.segment}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
                {campaigns.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <AlertTriangle size={28} className="mx-auto opacity-40 mb-2" />
                    No campaigns yet. Connect your backend to see data.
                  </div>
                )}
              </div>
            </ChartCard>
          </div>

          {totalFailed > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/20"
            >
              <AlertTriangle className="text-red-500 shrink-0" size={20} />
              <p className="text-sm"><span className="font-semibold">{totalFailed.toLocaleString()}</span> deliveries failed across campaigns. Review delivery logs.</p>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "white",
  border: "1px solid oklch(0.92 0.01 255)",
  borderRadius: "12px",
  boxShadow: "0 8px 24px -8px oklch(0 0 0 / 0.15)",
  fontSize: "12px",
};

function ChartCard({ title, children, delay = 0, className = "" }: { title: string; children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`card-elevated rounded-2xl bg-card border border-border p-5 ${className}`}
    >
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      {children}
    </motion.div>
  );
}
