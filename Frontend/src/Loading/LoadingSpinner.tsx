// @ts-nocheck
import React from "react";

type Size = "sm" | "md" | "lg" | "xl" | number;
type Variant = "default" | "table" | "card" | "fullscreen";

interface Props {
  message?: string;
  subtitle?: string;
  size?: Size;
  variant?: Variant;
  fullScreen?: boolean;
  className?: string;
  color?: string; // gardé pour compat, ignoré (violet forcé)
}

const sizeMap: Record<string, { spinner: number; wrap: string; title: string; subtitle: string }> = {
  sm: { spinner: 20, wrap: "w-9 h-9", title: "text-sm", subtitle: "text-xs" },
  md: { spinner: 28, wrap: "w-12 h-12", title: "text-sm", subtitle: "text-xs" },
  lg: { spinner: 36, wrap: "w-16 h-16", title: "text-base", subtitle: "text-sm" },
  xl: { spinner: 48, wrap: "w-20 h-20", title: "text-lg", subtitle: "text-sm" },
};

function resolveSize(size: Size) {
  if (typeof size === "number") return { spinner: size, wrap: "w-16 h-16", title: "text-base", subtitle: "text-sm" };
  return sizeMap[size] || sizeMap["lg"];
}

const LoadingSpinner: React.FC<Props> = ({
  message = "Chargement...",
  subtitle = "Veuillez patienter",
  size = "sm",
  variant = "default",
  fullScreen = false,
  className = "",
}) => {
  // petite boule circulaire violette — taille dépend du variant si non précisé
  const effectiveSize = size === "lg" && variant === "table" ? "sm" : size;
  const s = resolveSize(effectiveSize as Size);
  const isTable = variant === "table";
  const isCard = variant === "card";

  const content = (
    <div className={`flex flex-col items-center justify-center text-center ${isTable ? "py-12 px-6" : isCard ? "py-8 px-6" : "py-6"} ${className}`}>
      {/* petite boule circulaire violette */}
      <div className={`${s.wrap} rounded-full bg-violet-600 flex items-center justify-center mb-3 shadow-md shadow-violet-500/20`}>
        <div
          className="rounded-full border-2 border-white/30 border-t-white animate-spin"
          style={{ width: Math.max(16, s.spinner - 8), height: Math.max(16, s.spinner - 8), borderWidth: 2.5 }}
        />
      </div>
      <h4 className={`${s.title} font-semibold text-slate-900`}>{message}</h4>
      {subtitle && <p className={`${s.subtitle} text-slate-500 mt-1`}>{subtitle}</p>}
    </div>
  );

  if (fullScreen || variant === "fullscreen") {
    return (
      <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-sm w-full">
          {content}
        </div>
      </div>
    );
  }

  if (isTable) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
