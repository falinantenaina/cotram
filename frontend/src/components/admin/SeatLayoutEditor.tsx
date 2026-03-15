// frontend/src/components/admin/SeatLayoutEditor.tsx

import { Check, Layers, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  buildFallbackConfig,
  type SeatConfig,
  type SeatPosition,
} from "../../config/seatLayouts";

interface Props {
  value: SeatConfig | null;
  onChange: (config: SeatConfig) => void;
}

type CellType = "seat" | "aisle" | "empty";
interface Cell {
  type: CellType;
  pos?: SeatPosition;
  id?: number;
}
type Grid = Cell[][];
type BenchMap = Record<number, boolean>;

const POS_CYCLE: SeatPosition[] = ["left", "middle", "right"];
const POS_L: Record<SeatPosition, string> = {
  left: "G",
  middle: "M",
  right: "D",
};
const POS_S: Record<SeatPosition, { bg: string; bd: string; tx: string }> = {
  left: { bg: "#eff6ff", bd: "#93c5fd", tx: "#1e3a5f" },
  middle: { bg: "#f3f4f6", bd: "#d1d5db", tx: "#374151" },
  right: { bg: "#f0fdf4", bd: "#86efac", tx: "#14532d" },
};
const COL_H: Record<number, string> = {
  2: "Petit",
  3: "Minibus",
  4: "Crafter",
  5: "Grand bus",
};

// ─── Config → Grid ─────────────────────────────────────────────────────────
// Chaque siège a un col index → on le place à sa colonne exacte
function configToGrid(
  config: SeatConfig,
  numCols: number,
): { grid: Grid; benches: BenchMap } {
  const benches: BenchMap = {};
  const grid: Grid = config.rows.map((row, ri) => {
    benches[ri] = row.isBackBench;
    const cells: Cell[] = Array.from({ length: numCols }, () => ({
      type: "empty" as CellType,
    }));
    row.seats.forEach((seat) => {
      const ci = seat.col < numCols ? seat.col : numCols - 1;
      cells[ci] = { type: "seat", pos: seat.position, id: seat.id };
    });
    return cells;
  });
  return { grid, benches };
}

// ─── Grid → Config ─────────────────────────────────────────────────────────
// On garde la colonne exacte de chaque siège + on renumérote les IDs
function gridToConfig(
  grid: Grid,
  benches: BenchMap,
  base: SeatConfig,
): SeatConfig {
  let idCounter = 1;
  const rows = grid.map((row, ri) => ({
    row: ri + 1,
    isBackBench: benches[ri] ?? false,
    seats: row
      .map((cell, ci) => ({ cell, ci }))
      .filter(({ cell }) => cell.type === "seat")
      .map(({ cell, ci }) => ({
        id: idCounter++,
        row: ri + 1,
        col: ci, // ← position exacte préservée
        position: cell.pos ?? "middle",
      })),
  }));
  return { ...base, totalSeats: idCounter - 1, rows };
}

function createGhost(el: HTMLElement) {
  const g = el.cloneNode(true) as HTMLElement;
  g.style.cssText = `position:fixed;pointer-events:none;z-index:9999;
    width:${el.offsetWidth}px;height:${el.offsetHeight}px;
    opacity:.9;transform:scale(1.12) rotate(1.5deg);
    box-shadow:0 8px 24px rgba(0,0,0,.2);border-radius:10px;`;
  document.body.appendChild(g);
  return g;
}

export function SeatLayoutEditor({ value, onChange }: Props) {
  const initCols = () =>
    !value
      ? 4
      : Math.min(
          Math.max(
            ...value.rows.map((r) =>
              r.seats.length > 0
                ? Math.max(...r.seats.map((s) => s.col + 1))
                : 2,
            ),
            2,
          ),
          5,
        );

  const [showForm, setShowForm] = useState(!value);
  const [capacity, setCapacity] = useState(value?.totalSeats ?? 16);
  const [cols, setCols] = useState(initCols);
  const [grid, setGrid] = useState<Grid>(() =>
    value ? configToGrid(value, initCols()).grid : [],
  );
  const [benches, setBenches] = useState<BenchMap>(() =>
    value ? configToGrid(value, initCols()).benches : {},
  );
  const [sel, setSel] = useState<[number, number] | null>(null);
  const [dragging, setDragging] = useState<[number, number] | null>(null);
  const [over, setOver] = useState<[number, number] | null>(null);
  const [draggingRow, setDraggingRow] = useState<number | null>(null);
  const [overRow, setOverRow] = useState<number | null>(null);

  const ghostRef = useRef<HTMLElement | null>(null);
  const dragKind = useRef<"cell" | "row" | null>(null);
  const wasDrag = useRef(false); // bloc onClick après un drag
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map());
  const rowRefs = useRef<Map<number, HTMLElement>>(new Map());

  useEffect(() => {
    if (value) {
      const c = initCols();
      setCols(c);
      const { grid: g, benches: b } = configToGrid(value, c);
      setGrid(g);
      setBenches(b);
    }
  }, [value]);

  const totalSeats = (g: Grid = grid) =>
    g.reduce((a, r) => a + r.filter((c) => c.type === "seat").length, 0);

  // ── Commit : push grid → config → back to grid (keeps positions) ────────────
  const commit = (g: Grid, b: BenchMap, keepSel?: typeof sel) => {
    if (!value) return;
    const cfg = gridToConfig(g, b, value);
    // Re-derive grid from config to get fresh IDs, but keep same cell positions
    const synced = configToGrid(cfg, cols);
    setGrid(synced.grid);
    setBenches(synced.benches);
    onChange(cfg);
    if (keepSel !== undefined) setSel(keepSel);
    else setSel(null);
  };

  const cg = () => grid.map((r) => r.map((c) => ({ ...c })));

  // ── Mutations ────────────────────────────────────────────────────────────────
  const generate = () => {
    const n = Math.max(1, Math.min(99, capacity));
    const cfg = buildFallbackConfig(n);
    const c = Math.min(
      Math.max(
        ...cfg.rows.map((r) =>
          r.seats.length > 0 ? Math.max(...r.seats.map((s) => s.col + 1)) : 2,
        ),
        2,
      ),
      5,
    );
    setCols(c);
    const { grid: g, benches: b } = configToGrid(cfg, c);
    setGrid(g);
    setBenches(b);
    onChange(cfg);
    setShowForm(false);
    setSel(null);
  };

  const changeCols = (n: number) => {
    const g = grid.map((row) => {
      const cells: Cell[] = Array.from({ length: n }, (_, ci) =>
        ci < row.length ? row[ci]! : { type: "empty" },
      );
      return cells;
    });
    setCols(n);
    commit(g, benches, sel);
  };

  const setCell = (
    ri: number,
    ci: number,
    cell: Cell,
    keepSel?: typeof sel,
  ) => {
    const g = cg();
    g[ri]![ci] = cell;
    commit(g, benches, keepSel);
  };

  const addSeat = (ri: number, ci: number) =>
    setCell(ri, ci, { type: "seat", pos: "middle" });
  const clearCell = (ri: number, ci: number) =>
    setCell(ri, ci, { type: "empty" }, null);

  const setCellPos = (ri: number, ci: number, pos: SeatPosition) => {
    const g = cg();
    const c = g[ri]![ci];
    if (c && c.type === "seat") c.pos = pos;
    commit(g, benches, [ri, ci]);
  };

  const cyclePos = (ri: number, ci: number) => {
    const c = grid[ri]?.[ci];
    if (!c || c.type !== "seat") return;
    const cur = POS_CYCLE.indexOf(c.pos ?? "middle");
    setCellPos(ri, ci, POS_CYCLE[(cur + 1) % 3]!);
  };

  const toggleBench = (ri: number) => {
    const b = { ...benches, [ri]: !benches[ri] };
    setBenches(b);
    commit(grid, b, sel);
  };

  const toggleRowAisle = (ri: number) => {
    const g = cg();
    const row = g[ri]!;
    const hasAisle = row.some((c) => c.type === "aisle");
    if (hasAisle) {
      row.forEach((c, ci) => {
        if (c.type === "aisle") row[ci] = { type: "empty" };
      });
    } else {
      const mid = Math.floor(row.length / 2);
      // Only convert empty cells to aisle, not seats
      if (row[mid]?.type !== "seat") row[mid] = { type: "aisle" };
      else {
        // find nearest empty
        for (let d = 1; d < row.length; d++) {
          if (mid - d >= 0 && row[mid - d]?.type !== "seat") {
            row[mid - d] = { type: "aisle" };
            break;
          }
          if (mid + d < row.length && row[mid + d]?.type !== "seat") {
            row[mid + d] = { type: "aisle" };
            break;
          }
        }
      }
    }
    commit(g, benches, sel);
  };

  const deleteRow = (ri: number) => {
    const g = grid.filter((_, i) => i !== ri);
    const b: BenchMap = {};
    Object.entries(benches).forEach(([k, v]) => {
      const ki = Number(k);
      if (ki < ri) b[ki] = v;
      else if (ki > ri) b[ki - 1] = v;
    });
    if (sel?.[0] === ri) setSel(null);
    commit(g, b);
  };

  const addRow = () => {
    const newRow: Cell[] = Array.from({ length: cols }, (_, ci) => ({
      type: "seat" as CellType,
      pos: POS_CYCLE[ci % 3]!,
    }));
    commit([...grid, newRow], benches);
  };

  // ── Drag — cell (Pointer Events) ─────────────────────────────────────────────
  const onCellDown = (e: React.PointerEvent, ri: number, ci: number) => {
    if (grid[ri]?.[ci]?.type !== "seat") return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragKind.current = "cell";
    wasDrag.current = false;
    setDragging([ri, ci]);
    const el = e.currentTarget as HTMLElement;
    const g = createGhost(el);
    g.style.left = e.clientX - el.offsetWidth / 2 + "px";
    g.style.top = e.clientY - el.offsetHeight / 2 + "px";
    ghostRef.current = g;
  };

  const onMove = (e: React.PointerEvent) => {
    if (dragKind.current === "cell" && ghostRef.current) {
      wasDrag.current = true;
      ghostRef.current.style.left =
        e.clientX - parseInt(ghostRef.current.style.width) / 2 + "px";
      ghostRef.current.style.top =
        e.clientY - parseInt(ghostRef.current.style.height) / 2 + "px";
      let found: [number, number] | null = null;
      cellRefs.current.forEach((el, key) => {
        const r = el.getBoundingClientRect();
        if (
          e.clientX >= r.left &&
          e.clientX <= r.right &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom
        ) {
          const [ri, ci] = key.split("-").map(Number);
          found = [ri!, ci!];
        }
      });
      setOver(found);
    }
    if (dragKind.current === "row") {
      let found: number | null = null;
      rowRefs.current.forEach((el, ri) => {
        const r = el.getBoundingClientRect();
        if (e.clientY >= r.top && e.clientY <= r.bottom) found = ri;
      });
      setOverRow(found);
    }
  };

  const onUp = () => {
    if (dragKind.current === "cell") {
      ghostRef.current?.remove();
      ghostRef.current = null;
      if (
        dragging &&
        over &&
        (dragging[0] !== over[0] || dragging[1] !== over[1])
      ) {
        const [fr, fc] = dragging;
        const [tr, tc] = over;
        const g = cg();
        // Swap the two cells — positions stay fixed, only content moves
        const tmp = { ...g[fr]![fc]! };
        g[fr]![fc] = { ...g[tr]![tc]! };
        g[tr]![tc] = tmp;
        commit(g, benches, [tr, tc]);
      }
      dragKind.current = null;
      setDragging(null);
      setOver(null);
      // Reset après un court délai pour bloquer le onClick suivant
      setTimeout(() => {
        wasDrag.current = false;
      }, 50);
    }
    if (dragKind.current === "row") {
      if (draggingRow !== null && overRow !== null && draggingRow !== overRow) {
        const g = [...grid];
        const b = { ...benches };
        const [moved] = g.splice(draggingRow, 1);
        g.splice(overRow, 0, moved!);
        // Rebuild bench keys
        const nb: BenchMap = {};
        g.forEach((_, i) => {
          const origIdx =
            i <= overRow
              ? i < draggingRow
                ? i
                : i === overRow
                  ? draggingRow
                  : i - 1
              : i;
          nb[i] = b[origIdx] ?? false;
        });
        if (sel?.[0] === draggingRow) setSel([overRow, sel[1]]);
        commit(g, nb);
      }
      dragKind.current = null;
      setDraggingRow(null);
      setOverRow(null);
    }
  };

  const onRowDown = (e: React.PointerEvent, ri: number) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragKind.current = "row";
    setDraggingRow(ri);
  };

  useEffect(() => {
    const c = () => {
      ghostRef.current?.remove();
      ghostRef.current = null;
    };
    window.addEventListener("pointercancel", c);
    return () => window.removeEventListener("pointercancel", c);
  }, []);

  const selCell = sel ? grid[sel[0]]?.[sel[1]] : null;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4" onPointerMove={onMove} onPointerUp={onUp}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-primary" />
          <span className="text-sm font-bold text-gray-700">
            Plan des sièges
          </span>
          {value && (
            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {totalSeats()} places
            </span>
          )}
        </div>
        {value && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setSel(null);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-all"
          >
            <RotateCcw size={11} /> Recréer
          </button>
        )}
      </div>

      {/* Capacity form */}
      {showForm && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-bold text-gray-700 mb-1">
            Nombre de places passagers
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Un plan de base est généré, puis modifiable directement sur le
            visuel.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="number"
              min={1}
              max={99}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              className="w-28 border-2 border-gray-300 rounded-xl py-3 px-4 text-2xl font-black text-gray-900 text-center focus:outline-none focus:border-primary transition-all"
            />
            <button
              onClick={generate}
              disabled={capacity < 1}
              className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-3 rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-all"
            >
              <Check size={16} /> Générer
            </button>
            {value && (
              <button
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      )}

      {/* Editor */}
      {value && !showForm && (
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          {/* BUS */}
          <div style={{ flex: 1, minWidth: 280 }}>
            {/* Cols */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Colonnes
              </span>
              <div
                className="flex gap-1 p-1 rounded-xl"
                style={{ background: "var(--color-background-secondary)" }}
              >
                {[2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => changeCols(n)}
                    style={{
                      width: 28,
                      height: 26,
                      border: "none",
                      cursor: "pointer",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      background:
                        cols === n
                          ? "var(--color-background-primary)"
                          : "transparent",
                      color:
                        cols === n
                          ? "var(--color-text-primary)"
                          : "var(--color-text-secondary)",
                      boxShadow:
                        cols === n ? "0 1px 3px rgba(0,0,0,.1)" : "none",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <span
                style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}
              >
                {COL_H[cols]}
              </span>
            </div>

            <p
              style={{
                fontSize: 11,
                color: "var(--color-text-tertiary)",
                marginBottom: 12,
                lineHeight: 1.6,
              }}
            >
              <strong>Glisser</strong> un siège vers n'importe quelle case ·
              <strong> Clic</strong> case vide = siège ·<strong> |</strong> =
              allée au milieu ·<strong> Double-clic</strong> = G/M/D
            </p>

            {/* Bus frame */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: "var(--color-background-secondary)",
                border: "1.5px solid var(--color-border-secondary)",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  color: "var(--color-text-tertiary)",
                  marginBottom: 12,
                }}
              >
                — avant —
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  maxWidth: 380,
                  margin: "0 auto",
                }}
              >
                {grid.map((row, ri) => {
                  const isRowDrag = draggingRow === ri;
                  const isRowOver =
                    overRow === ri &&
                    draggingRow !== null &&
                    draggingRow !== ri;
                  return (
                    <div
                      key={ri}
                      ref={(el) => {
                        if (el) rowRefs.current.set(ri, el);
                        else rowRefs.current.delete(ri);
                      }}
                    >
                      <div
                        style={{
                          height: 2,
                          borderRadius: 2,
                          background: "#f2cb04",
                          margin: "0 28px 2px",
                          opacity: isRowOver ? 1 : 0,
                          transition: "opacity .1s",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          opacity: isRowDrag ? 0.25 : 1,
                          transition: "opacity .15s",
                        }}
                      >
                        {/* Row handle */}
                        <div
                          onPointerDown={(e) => onRowDown(e, ri)}
                          style={{
                            width: 20,
                            textAlign: "center",
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: "grab",
                            userSelect: "none",
                            flexShrink: 0,
                            color: "var(--color-text-tertiary)",
                            touchAction: "none",
                          }}
                          title="Maintenir pour réordonner"
                        >
                          R{ri + 1}
                        </div>

                        {/* Grid cells */}
                        <div
                          style={{
                            flex: 1,
                            display: "grid",
                            gridTemplateColumns: `${ri === 0 ? "44px " : ""}repeat(${cols}, 1fr)`,
                            gap: 5,
                            borderRadius: 10,
                            padding: "4px 6px",
                            background: benches[ri]
                              ? "rgba(251,191,36,.07)"
                              : "transparent",
                            border: benches[ri]
                              ? "1px dashed rgba(251,191,36,.4)"
                              : "none",
                          }}
                        >
                          {/* Driver */}
                          {ri === 0 && (
                            <div
                              style={{
                                height: 44,
                                borderRadius: 10,
                                background: "#1c1c1c",
                                border: "1.5px solid #2d2d2d",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="rgba(255,255,255,.55)"
                                strokeWidth="1.5"
                              >
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                              </svg>
                              <span
                                style={{
                                  fontSize: 8,
                                  color: "rgba(255,255,255,.3)",
                                  marginTop: 2,
                                }}
                              >
                                Chauf.
                              </span>
                            </div>
                          )}

                          {/* Data cells */}
                          {row.map((cell, ci) => {
                            const key = `${ri}-${ci}`;
                            const isSel = sel?.[0] === ri && sel?.[1] === ci;
                            const isDrag =
                              dragging?.[0] === ri && dragging?.[1] === ci;
                            const isOver =
                              over?.[0] === ri && over?.[1] === ci && !isDrag;

                            const refCb = (el: HTMLElement | null) => {
                              if (el) cellRefs.current.set(key, el);
                              else cellRefs.current.delete(key);
                            };

                            // AISLE
                            if (cell.type === "aisle")
                              return (
                                <div
                                  key={ci}
                                  ref={refCb as any}
                                  onClick={() => {
                                    if (wasDrag.current) return;
                                    addSeat(ri, ci);
                                  }}
                                  style={{
                                    height: 44,
                                    borderRadius: 8,
                                    cursor: "pointer",
                                    background: isOver
                                      ? "rgba(242,203,4,.2)"
                                      : "rgba(254,249,195,.8)",
                                    border: isOver
                                      ? "2px solid #f2cb04"
                                      : "1px dashed #fde047",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transform: isOver
                                      ? "scale(1.05)"
                                      : "scale(1)",
                                    transition: "all .1s",
                                  }}
                                  title="Allée — cliquer pour ajouter un siège ici"
                                >
                                  <svg
                                    width="10"
                                    height="22"
                                    viewBox="0 0 10 22"
                                  >
                                    <path
                                      d="M5 1v20"
                                      stroke="#ca8a04"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeDasharray="3 2"
                                    />
                                  </svg>
                                </div>
                              );

                            // SEAT
                            if (cell.type === "seat" && cell.pos) {
                              const s = POS_S[cell.pos];
                              return (
                                <div
                                  key={ci}
                                  ref={refCb as any}
                                  onPointerDown={(e) => onCellDown(e, ri, ci)}
                                  onClick={() => {
                                    if (wasDrag.current) return;
                                    setSel(isSel ? null : [ri, ci]);
                                  }}
                                  onDoubleClick={() => cyclePos(ri, ci)}
                                  title="Maintenir = déplacer · Clic = sélectionner · Double-clic = G/M/D"
                                  style={{
                                    height: 44,
                                    borderRadius: 10,
                                    background: isOver
                                      ? "rgba(242,203,4,.15)"
                                      : s.bg,
                                    border: isSel
                                      ? "2px solid #f2cb04"
                                      : isOver
                                        ? "2px solid #f2cb04"
                                        : `1.5px solid ${s.bd}`,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: dragging ? "grabbing" : "grab",
                                    userSelect: "none",
                                    touchAction: "none",
                                    opacity: isDrag ? 0.15 : 1,
                                    transform: isSel
                                      ? "scale(1.08)"
                                      : isOver
                                        ? "scale(1.05)"
                                        : "scale(1)",
                                    boxShadow: isSel
                                      ? "0 0 0 3px rgba(242,203,4,.22)"
                                      : "none",
                                    transition: isDrag
                                      ? "opacity .1s"
                                      : "transform .1s, box-shadow .1s",
                                    position: "relative",
                                    zIndex: isSel ? 5 : "auto",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: s.tx,
                                      lineHeight: 1,
                                    }}
                                  >
                                    {cell.id}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 9,
                                      color: s.tx,
                                      opacity: 0.5,
                                      marginTop: 2,
                                    }}
                                  >
                                    {POS_L[cell.pos]}
                                  </span>
                                </div>
                              );
                            }

                            // EMPTY
                            return (
                              <div
                                key={ci}
                                ref={refCb as any}
                                onClick={() => {
                                  if (wasDrag.current) return;
                                  addSeat(ri, ci);
                                }}
                                style={{
                                  height: 44,
                                  borderRadius: 10,
                                  border: isOver
                                    ? "2px solid #f2cb04"
                                    : "1.5px dashed var(--color-border-tertiary)",
                                  background: isOver
                                    ? "rgba(242,203,4,.1)"
                                    : "transparent",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  transform: isOver
                                    ? "scale(1.05)"
                                    : "scale(1)",
                                  transition: "all .1s",
                                }}
                                title="Cliquer pour ajouter · ou déposer un siège ici"
                              >
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 13 13"
                                  fill="none"
                                  style={{
                                    color: isOver
                                      ? "#9a8200"
                                      : "var(--color-border-secondary)",
                                  }}
                                >
                                  <path
                                    d="M6.5 1.5v10M1.5 6.5h10"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </div>
                            );
                          })}
                        </div>

                        {/* Row controls */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                            flexShrink: 0,
                          }}
                        >
                          <button
                            onClick={() => toggleBench(ri)}
                            title="Banquette arrière"
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              padding: "2px 5px",
                              borderRadius: 5,
                              cursor: "pointer",
                              border: benches[ri]
                                ? "1px solid #f59e0b"
                                : "1px solid var(--color-border-tertiary)",
                              background: benches[ri]
                                ? "#fef3c7"
                                : "transparent",
                              color: benches[ri]
                                ? "#92400e"
                                : "var(--color-text-tertiary)",
                            }}
                          >
                            B
                          </button>
                          <button
                            onClick={() => toggleRowAisle(ri)}
                            title="Allée centrale"
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "1px 5px",
                              borderRadius: 5,
                              cursor: "pointer",
                              border: "1px solid var(--color-border-tertiary)",
                              background: "transparent",
                              color: "var(--color-text-tertiary)",
                            }}
                          >
                            |
                          </button>
                          <button
                            onClick={() => deleteRow(ri)}
                            title="Supprimer la rangée"
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 5,
                              cursor: "pointer",
                              border: ".5px solid var(--color-border-tertiary)",
                              background: "transparent",
                              color: "var(--color-text-tertiary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            onMouseEnter={(e) => {
                              const b = e.currentTarget;
                              b.style.background = "#fef2f2";
                              b.style.color = "#dc2626";
                              b.style.borderColor = "#fca5a5";
                            }}
                            onMouseLeave={(e) => {
                              const b = e.currentTarget;
                              b.style.background = "transparent";
                              b.style.color = "var(--color-text-tertiary)";
                              b.style.borderColor =
                                "var(--color-border-tertiary)";
                            }}
                          >
                            <X size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={addRow}
                  style={{
                    marginTop: 6,
                    width: "100%",
                    padding: "8px 0",
                    border: "1.5px dashed var(--color-border-tertiary)",
                    borderRadius: 10,
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--color-text-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                  onMouseEnter={(e) => {
                    const b = e.currentTarget;
                    b.style.borderColor = "#f2cb04";
                    b.style.color = "#8a7300";
                  }}
                  onMouseLeave={(e) => {
                    const b = e.currentTarget;
                    b.style.borderColor = "var(--color-border-tertiary)";
                    b.style.color = "var(--color-text-tertiary)";
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path
                      d="M6.5 1.5v10M1.5 6.5h10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  Ajouter une rangée
                </button>
              </div>

              <div
                style={{
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  color: "var(--color-text-tertiary)",
                  marginTop: 12,
                }}
              >
                — arrière —
              </div>
            </div>
          </div>

          {/* SIDE PANEL */}
          <div
            style={{
              width: 176,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--color-background-primary)",
                border:
                  selCell?.type === "seat"
                    ? "1.5px solid #f2cb04"
                    : ".5px solid var(--color-border-tertiary)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                  color: "var(--color-text-secondary)",
                  marginBottom: 10,
                }}
              >
                Siège sélectionné
              </p>
              {selCell?.type === "seat" && sel ? (
                <>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      marginBottom: 10,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    Siège {selCell.id}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-tertiary)",
                      marginBottom: 6,
                    }}
                  >
                    Position
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 4,
                      marginBottom: 8,
                    }}
                  >
                    {POS_CYCLE.map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setCellPos(sel[0], sel[1], pos)}
                        style={{
                          padding: "6px 0",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 500,
                          border:
                            selCell.pos === pos
                              ? "1.5px solid #f2cb04"
                              : "1.5px solid var(--color-border-tertiary)",
                          background:
                            selCell.pos === pos ? "#f2cb04" : "transparent",
                          color:
                            selCell.pos === pos
                              ? "#000"
                              : "var(--color-text-secondary)",
                        }}
                      >
                        {POS_L[pos]}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => toggleBench(sel[0])}
                    style={{
                      width: "100%",
                      padding: "7px 0",
                      borderRadius: 8,
                      cursor: "pointer",
                      marginBottom: 5,
                      fontSize: 12,
                      fontWeight: 500,
                      border: benches[sel[0]]
                        ? "1.5px solid #f59e0b"
                        : "1.5px solid var(--color-border-tertiary)",
                      background: benches[sel[0]] ? "#fef3c7" : "transparent",
                      color: benches[sel[0]]
                        ? "#92400e"
                        : "var(--color-text-secondary)",
                    }}
                  >
                    {benches[sel[0]] ? "✓ Banquette" : "Banquette?"}
                  </button>
                  <button
                    onClick={() => clearCell(sel[0], sel[1])}
                    style={{
                      width: "100%",
                      padding: "7px 0",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 500,
                      border: "1.5px solid var(--color-border-tertiary)",
                      background: "transparent",
                      color: "var(--color-text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      const b = e.currentTarget;
                      b.style.background = "#fef2f2";
                      b.style.borderColor = "#fca5a5";
                      b.style.color = "#dc2626";
                    }}
                    onMouseLeave={(e) => {
                      const b = e.currentTarget;
                      b.style.background = "transparent";
                      b.style.borderColor = "var(--color-border-tertiary)";
                      b.style.color = "var(--color-text-secondary)";
                    }}
                  >
                    Supprimer
                  </button>
                </>
              ) : (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-tertiary)",
                    textAlign: "center",
                    padding: "6px 0",
                  }}
                >
                  Cliquez un siège pour modifier
                </p>
              )}
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--color-background-primary)",
                border: ".5px solid var(--color-border-tertiary)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                  color: "var(--color-text-secondary)",
                  marginBottom: 10,
                }}
              >
                Résumé
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {grid.map((row, ri) => {
                  const seats = row.filter((c) => c.type === "seat").length;
                  const aisles = row.filter((c) => c.type === "aisle").length;
                  return (
                    <div
                      key={ri}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      <span>
                        R{ri + 1}
                        {benches[ri] ? " · B" : ""}
                      </span>
                      <span style={{ fontWeight: 500 }}>
                        {seats}p{aisles ? ` +${aisles}a` : ""}
                      </span>
                    </div>
                  );
                })}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    fontWeight: 500,
                    borderTop: ".5px solid var(--color-border-tertiary)",
                    paddingTop: 6,
                    marginTop: 2,
                    color: "var(--color-text-primary)",
                  }}
                >
                  <span>Total</span>
                  <span>{totalSeats()} sièges</span>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--color-background-primary)",
                border: ".5px solid var(--color-border-tertiary)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                  color: "var(--color-text-secondary)",
                  marginBottom: 10,
                }}
              >
                Légende
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {POS_CYCLE.map((pos) => {
                  const s = POS_S[pos];
                  return (
                    <div
                      key={pos}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 4,
                          background: s.bg,
                          border: `1.5px solid ${s.bd}`,
                          flexShrink: 0,
                        }}
                      />
                      {POS_L[pos]} ={" "}
                      {pos === "left"
                        ? "Gauche"
                        : pos === "middle"
                          ? "Milieu"
                          : "Droite"}
                    </div>
                  );
                })}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      background: "#fef9c3",
                      border: "1.5px solid #fde047",
                      flexShrink: 0,
                    }}
                  />
                  Allée centrale
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {value && totalSeats() > 0 && !showForm && (
        <div
          className="flex items-center gap-2 text-xs rounded-xl px-3 py-2"
          style={{
            background: "var(--color-background-success)",
            border: ".5px solid var(--color-border-success)",
            color: "var(--color-text-success)",
          }}
        >
          <Check size={13} />
          {totalSeats()} sièges — {grid.length} rangées — {cols} colonnes
        </div>
      )}
    </div>
  );
}
