import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, Eye, MousePointerClick, AlertTriangle, ArrowLeft } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import StatCard from "@/components/cards/StatCard";
import StatusBadge from "@/components/cards/StatusBadge";
import { getCampaign } from "@/lib/api/campaigns";

export const Route = createFileRoute("/_app/campaigns/$id")({
  component: CampaignDetails,
});

const COLORS = ["#10B981", "#F59E0B", "#8B5CF6", "#EF4444"];

function CampaignDetails() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: c, isLoading } = useQuery({
    queryKey: ["campaign", id], queryFn: () => getCampaign(Number(id)), enabled: !!id, retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }
  if (!c) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Campaign not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/campaigns" })}>Back to Campaigns</Button>
      </div>
    );
  }

  const total = c.sent_count || 1;
  const pieData = [
    { name: "Delivered", value: c.delivered_count },
    { name: "Opened", value: c.opened_count },
    { name: "Clicked", value: c.clicked_count },
    { name: "Failed", value: c.failed_count },
  ].filter((d) => d.value > 0);

  const metrics = [
    { label: "Sent", value: c.sent_count, pct: 100 },
    { label: "Delivered", value: c.delivered_count, pct: (c.delivered_count / total) * 100 },
    { label: "Opened", value: c.opened_count, pct: (c.opened_count / total) * 100 },
    { label: "Clicked", value: c.clicked_count, pct: (c.clicked_count / total) * 100 },
    { label: "Failed", value: c.failed_count, pct: (c.failed_count / total) * 100 },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/campaigns" })} className="gap-1.5 -ml-2">
        <ArrowLeft size={16} /> Back to Campaigns
      </Button>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{c.campaign_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{c.channel} · {c.segment}</p>
        </div>
        <StatusBadge status={c.status} />
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Sent" value={c.sent_count} icon={Mail} tone="info" delay={0} />
        <StatCard label="Delivered" value={c.delivered_count} icon={CheckCircle2} tone="success" delay={0.05} />
        <StatCard label="Opened" value={c.opened_count} icon={Eye} tone="warning" delay={0.1} />
        <StatCard label="Clicked" value={c.clicked_count} icon={MousePointerClick} tone="primary" delay={0.15} />
        <StatCard label="Failed" value={c.failed_count} icon={AlertTriangle} tone="danger" delay={0.2} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-elevated rounded-2xl bg-card border border-border p-6">
          <h3 className="text-sm font-semibold mb-4">Funnel Progress</h3>
          <div className="space-y-4">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium">{m.label}</span>
                  <span className="text-muted-foreground tabular-nums">{m.value} ({m.pct.toFixed(1)}%)</span>
                </div>
                <Progress value={m.pct} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated rounded-2xl bg-card border border-border p-6">
          <h3 className="text-sm font-semibold mb-4">Outcome Breakdown</h3>
          {pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {c.message && (
        <div className="card-elevated rounded-2xl bg-card border border-border p-6">
          <h3 className="text-sm font-semibold mb-2">Message Preview</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{c.message}</p>
        </div>
      )}
    </div>
  );
}
