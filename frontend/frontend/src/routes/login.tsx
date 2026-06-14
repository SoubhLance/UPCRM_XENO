import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Logo from "@/components/Logo";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@upcrm.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      toast.success("Welcome back!");
      navigate({ to: "/dashboard", replace: true });
    } else {
      toast.error("Invalid credentials");
    }
  };

  return (
    <div className="relative min-h-dvh gradient-bg flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-40 h-40 bg-white/5 rounded-full blur-2xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-accent/15 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass rounded-3xl p-8 md:p-10 w-full max-w-md shadow-2xl relative"
      >
        <div className="flex justify-center mb-8">
          <Logo variant="light" size="lg" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label className="text-white/80 text-xs uppercase tracking-wider">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:bg-white/15 focus-visible:ring-accent"
            />
          </div>
          <div>
            <Label className="text-white/80 text-xs uppercase tracking-wider">Password</Label>
            <div className="relative mt-1.5">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:bg-white/15 focus-visible:ring-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl group"
          >
            {loading ? "Signing in…" : (
              <span className="inline-flex items-center gap-2">
                Sign in <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            )}
          </Button>

          <p className="text-center text-xs text-white/50 pt-2">
            Demo: any credentials work — JWT integration coming soon.
          </p>
        </form>
      </motion.div>
    </div>
  );
}
