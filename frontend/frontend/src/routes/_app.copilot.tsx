import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendChatMessage } from "@/lib/api/chat";
import { useNotifications } from "@/context/NotificationContext";
import { toast } from "sonner";
import type { ChatMessage } from "@/types";

export const Route = createFileRoute("/_app/copilot")({
  component: AICopilot,
});

const SUGGESTED = [
  "Re-engage customers inactive for 90 days with a 10% discount",
  "Offer 15% discount to high-value customers",
  "Promote electronics to frequent buyers",
  "Create VIP campaign for top 20 spenders",
];

function AICopilot() {
  const { addNotification } = useNotifications();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (data) => {
      const m: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: data.response, timestamp: new Date() };
      const lower = data.response.toLowerCase();
      if (lower.includes("campaign") && (lower.includes("created") || lower.includes("launched"))) {
        toast.success("Campaign launched successfully!");
        addNotification({ title: "Campaign Created via AI", message: data.response.slice(0, 100), type: "success" });
      }
      setMessages((p) => [...p, m]);
    },
    onError: () => {
      setMessages((p) => [...p, { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I encountered an error. Please try again.", timestamp: new Date() }]);
      toast.error("AI service error");
    },
  });

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, mutation.isPending]);

  const send = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setMessages((p) => [...p, { id: crypto.randomUUID(), role: "user", content: msg, timestamp: new Date() }]);
    setInput("");
    mutation.mutate(msg);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="text-accent" size={26} /> AI Copilot
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Describe a campaign in plain English — I'll handle the rest.</p>
      </motion.div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto card-elevated rounded-2xl bg-card border border-border p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full grid place-items-center text-center">
            <div className="max-w-md">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white mb-3">
                <Sparkles size={24} />
              </div>
              <h3 className="font-semibold">How can I help today?</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-5">Try one of these prompts:</p>
              <div className="grid gap-2">
                {SUGGESTED.map((s) => (
                  <button key={s} onClick={() => send(s)} className="text-left text-sm p-3 rounded-xl bg-secondary/60 hover:bg-secondary border border-border transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-primary to-accent text-white"}`}>
                  {m.role === "user" ? <User size={15} /> : <Bot size={15} />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  {m.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        {mutation.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white"><Bot size={15} /></div>
            <div className="bg-secondary rounded-2xl px-4 py-3 flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="h-2 w-2 rounded-full bg-muted-foreground"
                  animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-4 flex gap-2">
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Re-engage customers inactive for 90 days with a 10% discount"
          className="flex-1 h-12 px-4 rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
        <Button type="submit" size="lg" className="rounded-xl gap-2" disabled={mutation.isPending}>
          <Send size={16} /> Send
        </Button>
      </form>
    </div>
  );
}
