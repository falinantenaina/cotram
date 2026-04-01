// frontend/src/pages/admin/SeatTemplates.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Edit3, Layers, Loader, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { seatTemplateApi, type SeatTemplate } from "../../api/seatTemplateApi";
import { SeatLayoutEditor } from "../../components/admin/SeatLayoutEditor";
import { buildFallbackConfig, type SeatConfig } from "../../config/seatLayouts";

// ─── Modal créer / éditer ─────────────────────────────────────────────────────
function TemplateModal({
  template,
  onClose,
}: {
  template: SeatTemplate | null; // null = nouveau
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(template?.name ?? "");
  const [seatConfig, setSeatConfig] = useState<SeatConfig | null>(
    template?.seatConfig ?? buildFallbackConfig(16),
  );
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Le nom est requis");
      if (!seatConfig) throw new Error("Configurez le plan des sièges");
      if (template)
        return seatTemplateApi.update(template._id, name.trim(), seatConfig);
      return seatTemplateApi.create(name.trim(), seatConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seat-templates"] });
      onClose();
    },
    onError: (err: any) =>
      setError(err?.response?.data?.message ?? err.message ?? "Erreur"),
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 bg-gray-900 rounded-xl flex items-center justify-center">
              <Layers size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="font-black text-gray-900">
                {template ? "Modifier le template" : "Nouveau template"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Plan de sièges réutilisable
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Nom */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Nom du template
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Crafter 16p, Minibus 9p, Starex VIP…"
              className="w-full border-2 border-gray-200 rounded-xl py-3 px-4 text-sm font-semibold focus:outline-none focus:border-primary transition-all"
              autoFocus
            />
          </div>

          {/* Éditeur de plan */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Plan des sièges
            </label>
            <SeatLayoutEditor value={seatConfig} onChange={setSeatConfig} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 text-sm"
          >
            Annuler
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !name.trim() || !seatConfig}
            className="flex-1 py-3 bg-primary text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {mutation.isPending ? (
              <Loader size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            {template ? "Sauvegarder" : "Créer le template"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function SeatTemplates() {
  const queryClient = useQueryClient();
  const [modalTarget, setModalTarget] = useState<SeatTemplate | null | "new">(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<SeatTemplate | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["seat-templates"],
    queryFn: seatTemplateApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => seatTemplateApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seat-templates"] });
      setDeleteTarget(null);
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="size-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <Layers size={20} className="text-primary" />
            </div>
            <h1 className="text-3xl font-black text-gray-900">
              Templates de sièges
            </h1>
          </div>
          <p className="text-gray-400 text-sm ml-13">
            Créez des plans réutilisables pour chaque type de véhicule
          </p>
        </div>
        <button
          onClick={() => setModalTarget("new")}
          className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-3 rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95"
        >
          <Plus size={18} /> Nouveau template
        </button>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="size-12 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400 text-sm">Chargement…</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100">
          <div className="size-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Layers size={28} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">
            Aucun template
          </h3>
          <p className="text-gray-400 text-sm mb-6 text-center max-w-xs">
            Créez votre premier template pour l'utiliser lors de la génération
            d'horaires
          </p>
          <button
            onClick={() => setModalTarget("new")}
            className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90"
          >
            <Plus size={15} /> Créer un template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => {
            const cfg = tpl.seatConfig;
            const rows = cfg.rows?.length ?? 0;
            const seats = cfg.totalSeats ?? 0;
            const hasAisle = cfg.rows?.some(
              (r: any) =>
                r.seats?.length <
                (cfg.rows?.[1]?.seats?.length ?? r.seats?.length),
            );
            const hasBench = cfg.rows?.some((r: any) => r.isBackBench);

            return (
              <div
                key={tpl._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                {/* Preview miniature du plan */}
                <div className="bg-gray-50 px-4 pt-4 pb-2">
                  <MiniPreview config={cfg} />
                </div>

                {/* Infos */}
                <div className="p-4">
                  <h3 className="font-black text-gray-900 text-base mb-1 truncate">
                    {tpl.name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-[11px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {seats} places
                    </span>
                    <span className="text-[11px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {rows} rangées
                    </span>
                    {hasBench && (
                      <span className="text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Banquette
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mb-3">
                    Modifié le{" "}
                    {new Date(tpl.updatedAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModalTarget(tpl)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                    >
                      <Edit3 size={12} /> Modifier
                    </button>
                    <button
                      onClick={() => setDeleteTarget(tpl)}
                      className="size-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal créer / éditer */}
      {modalTarget !== null && (
        <TemplateModal
          template={modalTarget === "new" ? null : modalTarget}
          onClose={() => setModalTarget(null)}
        />
      )}

      {/* Confirm delete */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="size-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-center text-gray-900 mb-1">
              Supprimer "{deleteTarget.name}" ?
            </h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              Les horaires existants ne seront pas affectés.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget._id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mini aperçu du plan (lecture seule) ─────────────────────────────────────
function MiniPreview({ config }: { config: SeatConfig }) {
  let numCols = 1;
  config.rows.forEach((row) => {
    row.seats.forEach((s) => {
      numCols = Math.max(numCols, s.col + 1);
    });
  });

  return (
    <div className="space-y-1 max-w-[180px] mx-auto py-1">
      {config.rows.map((row, ri) => {
        const cells: Array<"seat" | "aisle" | "empty"> =
          Array(numCols).fill("empty");
        row.seats.forEach((s) => {
          cells[Math.min(s.col, numCols - 1)] = "seat";
        });
        const seatCols = row.seats.map((s) => Math.min(s.col, numCols - 1));
        if (seatCols.length >= 2) {
          const minC = Math.min(...seatCols),
            maxC = Math.max(...seatCols);
          for (let ci = minC + 1; ci < maxC; ci++) {
            if (cells[ci] === "empty") cells[ci] = "aisle";
          }
        }

        return (
          <div
            key={ri}
            style={{
              display: "grid",
              gridTemplateColumns: `${ri === 0 ? "14px " : ""}repeat(${numCols}, 1fr)`,
              gap: 3,
              padding: row.isBackBench ? "1px 3px" : "0",
              borderRadius: row.isBackBench ? 4 : 0,
              border: row.isBackBench
                ? "1px dashed rgba(251,191,36,.4)"
                : "none",
              background: row.isBackBench
                ? "rgba(251,191,36,.05)"
                : "transparent",
            }}
          >
            {ri === 0 && (
              <div
                style={{ height: 12, borderRadius: 3, background: "#1c1c1c" }}
              />
            )}
            {cells.map((kind, ci) => (
              <div
                key={ci}
                style={{
                  height: 12,
                  borderRadius: 3,
                  background:
                    kind === "seat"
                      ? "#e5e7eb"
                      : kind === "aisle"
                        ? "rgba(253,224,71,.5)"
                        : "transparent",
                  border: kind === "seat" ? "1px solid #d1d5db" : "none",
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
