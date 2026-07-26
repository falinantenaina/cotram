import { Loader } from "lucide-react";
import type { ReactNode } from "react";

// ─── PageHeader ───────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-400 text-sm mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: string;
  sub?: string;
  color?: string;
}
export function StatCard({ label, value, icon: Icon, accent = "bg-gray-100 text-gray-500", sub, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex items-start gap-3 sm:gap-4 hover:shadow-md transition-shadow">
      <div className={`size-10 sm:size-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className={`text-xl sm:text-2xl font-black leading-none mb-0.5 ${color ?? "text-gray-900"}`}>{value}</p>
        <p className="text-xs sm:text-sm text-gray-500 leading-tight">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
interface StatusBadgeProps {
  label: string;
  dot?: string;
  badge: string;
}
export function StatusBadge({ label, dot, badge }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border ${badge}`}>
      {dot && <span className={`size-1.5 rounded-full ${dot}`} />}
      {label}
    </span>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
}
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
      <div className="size-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={24} className="text-gray-300" />
      </div>
      <h3 className="font-bold text-gray-600 mb-2">{title}</h3>
      {description && <p className="text-gray-400 text-sm mb-5 text-center max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────────
export function LoadingSpinner({ message = "Chargement..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}

// ─── ConfirmDeleteModal ───────────────────────────────────────────────────────
interface ConfirmDeleteModalProps {
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
  icon?: React.ElementType;
}
export function ConfirmDeleteModal({
  title, description, onConfirm, onClose, isLoading, icon: Icon,
}: ConfirmDeleteModalProps) {
  const DeleteIcon = Icon ?? (() => null);
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="size-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <DeleteIcon size={22} className="text-red-600" />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm mb-6">{description}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 text-sm hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-red-700"
          >
            {isLoading ? <Loader size={14} className="animate-spin" /> : <DeleteIcon size={14} />}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Wrapper ────────────────────────────────────────────────────────────
interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  headerClass?: string;
}
export function Modal({ title, subtitle, onClose, children, footer, size = "md", headerClass = "bg-gray-900 text-white" }: ModalProps) {
  const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl" };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl w-full ${sizes[size]} shadow-2xl flex flex-col max-h-[95vh]`}>
        <div className={`${headerClass} px-6 py-5 rounded-t-2xl shrink-0`}>
          <div className="flex items-center justify-between">
            <div>
              {subtitle && <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">{subtitle}</p>}
              <h2 className="text-lg font-black">{title}</h2>
            </div>
            <button onClick={onClose} className="size-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="px-6 pb-6 border-t border-gray-50 pt-4 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

// ─── ErrorAlert ───────────────────────────────────────────────────────────────
export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <span className="text-red-500 shrink-0">⚠</span>
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

// ─── Input / Select / Textarea helpers ───────────────────────────────────────
export const inputClass = "w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white";

export function FormField({ label, required, children, hint }: { label: string; required?: boolean; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─── OccupancyBar ─────────────────────────────────────────────────────────────
export function OccupancyBar({ value, max, showLabel = true }: { value: number; max: number; showLabel?: boolean }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : pct >= 40 ? "bg-emerald-400" : "bg-gray-300";
  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{value}/{max}</span>
          <span className={`font-bold ${pct >= 90 ? "text-red-500" : pct >= 70 ? "text-amber-500" : "text-gray-500"}`}>{pct}%</span>
        </div>
      )}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
