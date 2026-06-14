import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users, UserCheck, UserX, Megaphone, Mail, DollarSign,
  BarChart3, RefreshCw, AlertCircle, TrendingUp
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, AreaChart, Area
} from "recharts";
import { getAnalytics } from "@/lib/api/analytics";
import StatCard from "@/components/cards/StatCard";
import StatusBadge from "@/components/cards/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/analytics")({
  component: Analytics,
});

const COLORS = ["#2563EB", "#F59E0B", "#10B981", "#8B5CF6", "#EF4444", "#EC4899"];

const tooltipStyle = {
  backgroundColor: "white",
  border: "1px solid oklch(0.92 0.01 255)",
  borderRadius: "12px",
  boxShadow: "0 8px 24px -8px oklch(0 0 0 / 0.15)",
  fontSize: "12px",
};

function Analytics() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["analytics-page-data"],
    queryFn: getAnalytics,
    retry: false,
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <AlertCircle size={48} className="text-destructive animate-pulse" />
        <h3 className="text-lg font-semibold">Failed to load analytics</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          There was an error retrieving aggregate data. Please check your backend connection.
        </p>
        <Button onClick={() => refetch()} className="gap-2 rounded-xl">
          <RefreshCw size={14} /> Retry
        </Button>
      </div>
    );
  }

  const kpis = data?.kpis || {
    total_customers: 0,
    active_customers: 0,
    inactive_customers: 0,
    total_campaigns: 0,
    emails_sent: 0,
    total_revenue: 0
  };

  const charts = data?.charts || {
    active_vs_inactive: [],
    sales_trend: [],
    campaign_performance: [],
    delivery_funnel: [],
    segment_distribution: [],
    top_categories: []
  };

  const recentCampaigns = data?.recent_campaigns || [];

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="text-primary" size={26} /> Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            System-wide business performance, campaigns analysis, and revenue logs.
          </p>
        </motion.div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="rounded-xl gap-2 bg-card border-border hover:bg-secondary/40"
        >
          <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard label="Total Customers" value={kpis.total_customers} icon={Users} tone="primary" delay={0.0} />
            <StatCard label="Active Customers" value={kpis.active_customers} icon={UserCheck} tone="success" delay={0.04} />
            <StatCard label="Inactive" value={kpis.inactive_customers} icon={UserX} tone="danger" delay={0.08} />
            <StatCard label="Campaigns" value={kpis.total_campaigns} icon={Megaphone} tone="warning" delay={0.12} />
            <StatCard label="Emails Sent" value={kpis.emails_sent} icon={Mail} tone="info" delay={0.16} />
            <StatCard label="Revenue" value={Math.round(kpis.total_revenue)} prefix="$" icon={DollarSign} tone="success" delay={0.20} />
          </div>

          {/* CHARTS LAYER 1 */}
          <div className="grid lg:grid-cols-3 gap-6">
            <ChartCard title="Active vs Inactive Users" delay={0.25}>
              <div className="h-[260px] w-full flex items-center justify-center">
                {charts.active_vs_inactive.length === 0 ? (
                  <EmptyChartState />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.active_vs_inactive}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {charts.active_vs_inactive.map((_: any, i: number) => (
                          <Cell key={i} fill={[COLORS[0], COLORS[1]][i % 2]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Sales Trend ($)" className="lg:col-span-2" delay={0.30}>
              <div className="h-[260px] w-full">
                {charts.sales_trend.length === 0 ? (
                  <EmptyChartState />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.sales_trend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 255)" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2563EB"
                        strokeWidth={2.5}
                        dot={{ r: 3, stroke: "#2563EB", strokeWidth: 1, fill: "#fff" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

          {/* CHARTS LAYER 2 */}
          <div className="grid lg:grid-cols-2 gap-6">
            <ChartCard title="Campaign Performance" delay={0.35}>
              <div className="h-[280px] w-full">
                {charts.campaign_performance.length === 0 ? (
                  <EmptyChartState />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.campaign_performance} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 255)" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Bar dataKey="Sent" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Delivered" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Opened" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Clicked" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Delivery Funnel" delay={0.40}>
              <div className="h-[280px] w-full">
                {charts.delivery_funnel.length === 0 ? (
                  <EmptyChartState />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.delivery_funnel} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="funnelGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 255)" />
                      <XAxis dataKey="stage" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2.5} fill="url(#funnelGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

          {/* CHARTS LAYER 3 */}
          <div className="grid lg:grid-cols-3 gap-6">
            <ChartCard title="Segment Distribution" delay={0.45}>
              <div className="h-[260px] w-full flex items-center justify-center">
                {charts.segment_distribution.length === 0 ? (
                  <EmptyChartState />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.segment_distribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={80}
                      >
                        {charts.segment_distribution.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Top Categories (Revenue)" className="lg:col-span-2" delay={0.50}>
              <div className="h-[260px] w-full">
                {charts.top_categories.length === 0 ? (
                  <EmptyChartState />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={charts.top_categories}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 255)" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" fill="#F59E0B" radius={[0, 4, 4, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

          {/* RECENT CAMPAIGNS TABLE */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="card-elevated rounded-2xl bg-card border border-border overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Recent Campaigns Table</h3>
            </div>
            {recentCampaigns.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                No recent campaigns to display.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/60 border-b border-border">
                    <tr className="text-left">
                      <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        Campaign Name
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                        Sent
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                        Delivered
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                        Opened
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                        Clicked
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                        Failed
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCampaigns.map((c: any, i: number) => (
                      <tr
                        key={i}
                        className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-medium">{c.campaign_name}</td>
                        <td className="px-5 py-3.5 text-right tabular-nums">{c.sent_count?.toLocaleString() || 0}</td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-emerald-600">
                          {c.delivered_count?.toLocaleString() || 0}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-amber-600">
                          {c.opened_count?.toLocaleString() || 0}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-violet-600">
                          {c.clicked_count?.toLocaleString() || 0}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-red-600">
                          {c.failed_count?.toLocaleString() || 0}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={c.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}

function ChartCard({
  title,
  children,
  delay = 0,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`card-elevated rounded-2xl bg-card border border-border p-5 ${className}`}
    >
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      {children}
    </motion.div>
  );
}

function EmptyChartState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <TrendingUp size={24} className="text-muted-foreground opacity-30 mb-2" />
      <p className="text-xs text-muted-foreground">No data records available</p>
    </div>
  );
}
