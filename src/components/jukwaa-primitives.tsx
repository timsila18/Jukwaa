import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

function toneClass(tone: Tone) {
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  if (tone === "danger") return "border-red-200 bg-red-50 text-red-800";
  if (tone === "accent") return "border-sky-200 bg-sky-50 text-sky-900";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function JukwaaCard({ className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`j-panel p-4 ${className}`} {...props} />;
}

export function JukwaaButton({ className = "", variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }) {
  const variantClass = variant === "primary" ? "j-button-primary px-4" : "j-button-secondary px-4";
  return <button className={`inline-flex items-center justify-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className}`} {...props} />;
}

export function JukwaaNotice({ children, tone = "neutral", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <div className={`rounded-md border p-3 text-sm font-semibold ${toneClass(tone)} ${className}`}>{children}</div>;
}

export function JukwaaField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
