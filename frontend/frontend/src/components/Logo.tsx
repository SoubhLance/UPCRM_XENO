interface LogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
}

export default function Logo({ variant = "dark", size = "md" }: LogoProps) {
  const wordmark = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  }[size];
  const tagline = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
  }[size];

  const crmColor = variant === "light" ? "text-white" : "text-primary";
  const taglineColor = variant === "light" ? "text-white/50" : "text-muted-foreground";

  return (
    <div className="flex flex-col leading-none">
      <h1 className={`${wordmark} font-extrabold tracking-tight`}>
        <span className="text-accent">UP</span>
        <span className={crmColor}>CRM</span>
      </h1>
      <p className={`${tagline} ${taglineColor} font-bold tracking-[0.3em] uppercase mt-1`}>
        Xeno_CRM
      </p>
    </div>
  );
}
