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
        col: ci,
        position: cell.pos ?? "middle",
      })),
  }));
  return { ...base, totalSeats: idCounter - 1, rows };
}

function createGhost(el: HTMLElement) {
  const g = el.cloneNode(true) as HTMLElement;
  g.style.cssText = `position:fixed;pointer-events:none;z-index:9999;
    width:${el.offsetWidth}px;height:${el.offsetHeight}px;
    opacity:.85;transform:scale(1.1) rotate(2deg);
    box-shadow:0 8px 24px rgba(0,0,0,.25);border-radius:10px;`;
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
  const wasDrag = useRef(false);
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

  const commit = (g: Grid, b: BenchMap, keepSel?: typeof sel) => {
    if (!value) return;
    const cfg = gridToConfig(g, b, value);
    const synced = configToGrid(cfg, cols);
    setGrid(synced.grid);
    setBenches(synced.benches);
    onChange(cfg);
    if (keepSel !== undefined) setSel(keepSel);
    else setSel(null);
  };

  const cg = () => grid.map((r) => r.map((c) => ({ ...c })));

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
    if (!value) return;
    const { grid: g, benches: b } = configToGrid(value, n);
    setCols(n);
    setGrid(g);
    setBenches(b);
    setSel(null);
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
      if (row[mid]?.type !== "seat") row[mid] = { type: "aisle" };
      else {
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
        const tmp = { ...g[fr]![fc]! };
        g[fr]![fc] = { ...g[tr]![tc]! };
        g[tr]![tc] = tmp;
        commit(g, benches, [tr, tc]);
      }
      dragKind.current = null;
      setDragging(null);
      setOver(null);
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

  return (
    <div className="space-y-4" onPointerMove={onMove} onPointerUp={onUp}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 bg-gray-900 rounded-lg flex items-center justify-center">
            <Layers size={13} className="text-yellow-400" />
          </div>
          <span className="text-sm font-bold text-gray-700">
            Plan des sièges
          </span>
          {value && (
            <span className="text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full">
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
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-2.5 py-1.5 rounded-lg transition-all"
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
              className="w-28 border-2 border-gray-300 rounded-xl py-3 px-4 text-2xl font-black text-gray-900 text-center focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
            />
            <button
              onClick={generate}
              disabled={capacity < 1}
              className="flex items-center gap-2 bg-yellow-400 text-gray-900 font-bold px-5 py-3 rounded-xl hover:bg-yellow-500 disabled:opacity-40 transition-all shadow-sm"
            >
              <Check size={16} /> Générer
            </button>
            {value && (
              <button
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      )}

      {/* Editor */}
      {value && !showForm && (
        <div className="flex gap-4 flex-wrap items-start">
          {/* BUS */}
          <div className="flex-1 min-w-[280px]">
            {/* Cols */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Colonnes
              </span>
              <div className="flex gap-1 p-1 rounded-xl bg-gray-100">
                {[2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => changeCols(n)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      cols === n
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-gray-400">{COL_H[cols]}</span>
            </div>

            <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
              <strong className="text-gray-600">Glisser</strong> un siège vers
              n'importe quelle case ·{" "}
              <strong className="text-gray-600">Clic</strong> case vide = siège ·{" "}
              <strong className="text-gray-600">|</strong> = allée au milieu ·{" "}
              <strong className="text-gray-600">Double-clic</strong> = G/M/D
            </p>

            {/* Bus frame */}
            <div className="rounded-2xl p-4 bg-gray-50 border border-gray-200">
              <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                — avant —
              </div>

              <div className="flex flex-col gap-[5px] max-w-[380px] mx-auto">
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
                        className="rounded-sm bg-yellow-400 mx-7 mb-[2px]"
                        style={{
                          height: 2,
                          opacity: isRowOver ? 1 : 0,
                          transition: "opacity .1s",
                        }}
                      />
                      <div
                        className="flex items-center gap-1.5"
                        style={{
                          opacity: isRowDrag ? 0.25 : 1,
                          transition: "opacity .15s",
                        }}
                      >
                        {/* Row handle */}
                        <div
                          onPointerDown={(e) => onRowDown(e, ri)}
                          className="w-5 text-center text-[10px] font-bold text-gray-400 cursor-grab select-none shrink-0"
                          style={{ touchAction: "none" }}
                          title="Maintenir pour réordonner"
                        >
                          R{ri + 1}
                        </div>

                        {/* Grid cells */}
                        <div
                          className="flex-1 grid gap-[5px] rounded-[10px] p-[4px_6px]"
                          style={{
                            gridTemplateColumns: `${ri === 0 ? "44px " : ""}repeat(${cols}, 1fr)`,
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
                            <div className="h-[44px] rounded-[10px] bg-gray-900 border-[1.5px] border-gray-700 flex flex-col items-center justify-center">
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
                              <span className="text-[8px] text-white/30 mt-0.5">
                                Chauf.
                              </span>
                            </div>
                          )}

                          {/* Data cells */}
                          {row.map((cell, ci) => {
                            const key = `${ri}-${ci}`;
                            const isSel =
                              sel?.[0] === ri && sel?.[1] === ci;
                            const isDrag =
                              dragging?.[0] === ri && dragging?.[1] === ci;
                            const isOver =
                              over?.[0] === ri &&
                              over?.[1] === ci &&
                              !isDrag;

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
                                  className="h-[44px] rounded-lg cursor-pointer flex items-center justify-center transition-all"
                                  style={{
                                    background: isOver
                                      ? "rgba(242,203,4,.2)"
                                      : "rgba(254,249,195,.8)",
                                    border: isOver
                                      ? "2px solid #f2cb04"
                                      : "1px dashed #fde047",
                                    transform: isOver
                                      ? "scale(1.05)"
                                      : "scale(1)",
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
                                  onPointerDown={(e) =>
                                    onCellDown(e, ri, ci)
                                  }
                                  onClick={() => {
                                    if (wasDrag.current) return;
                                    setSel(isSel ? null : [ri, ci]);
                                  }}
                                  onDoubleClick={() => cyclePos(ri, ci)}
                                  title="Maintenir = déplacer · Clic = sélectionner · Double-clic = G/M/D"
                                  className="h-[44px] rounded-[10px] flex flex-col items-center justify-center relative transition-all"
                                  style={{
                                    background: isOver
                                      ? "rgba(242,203,4,.15)"
                                      : s.bg,
                                    border: isSel
                                      ? "2px solid #f2cb04"
                                      : isOver
                                        ? "2px solid #f2cb04"
                                        : `1.5px solid ${s.bd}`,
                                    cursor: dragging
                                      ? "grabbing"
                                      : "grab",
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
                                    zIndex: isSel ? 5 : "auto",
                                  }}
                                >
                                  <span
                                    className="text-[11px] font-bold leading-none"
                                    style={{ color: s.tx }}
                                  >
                                    {cell.id}
                                  </span>
                                  <span
                                    className="text-[9px] mt-0.5 opacity-50"
                                    style={{ color: s.tx }}
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
                                className="h-[44px] rounded-[10px] flex items-center justify-center cursor-pointer transition-all"
                                style={{
                                  border: isOver
                                    ? "2px solid #f2cb04"
                                    : "1.5px dashed #d1d5db",
                                  background: isOver
                                    ? "rgba(242,203,4,.1)"
                                    : "transparent",
                                  transform: isOver
                                    ? "scale(1.05)"
                                    : "scale(1)",
                                }}
                                title="Cliquer pour ajouter · ou déposer un siège ici"
                              >
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 13 13"
                                  fill="none"
                                  style={{
                                    color: isOver ? "#9a8200" : "#d1d5db",
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
                        <div className="flex flex-col gap-[3px] shrink-0">
                          <button
                            onClick={() => toggleBench(ri)}
                            title="Banquette arrière"
                            className={`text-[9px] font-bold px-[5px] py-[2px] rounded-[5px] cursor-pointer transition-all ${
                              benches[ri]
                                ? "border border-amber-400 bg-amber-50 text-amber-700"
                                : "border border-gray-200 text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            B
                          </button>
                          <button
                            onClick={() => toggleRowAisle(ri)}
                            title="Allée centrale"
                            className="text-[11px] font-bold px-[5px] py-[1px] rounded-[5px] cursor-pointer border border-gray-200 text-gray-400 hover:text-gray-600 transition-all"
                          >
                            |
                          </button>
                          <button
                            onClick={() => deleteRow(ri)}
                            title="Supprimer la rangée"
                            className="w-[22px] h-[22px] rounded-[5px] cursor-pointer border border-gray-200 bg-transparent text-gray-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
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
                  className="mt-1.5 w-full py-2 border-[1.5px] border-dashed border-gray-300 rounded-[10px] bg-transparent cursor-pointer text-xs text-gray-400 flex items-center justify-center gap-1.5 hover:border-yellow-400 hover:text-yellow-600 transition-all"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 13 13"
                    fill="none"
                  >
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

              <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-3">
                — arrière —
              </div>
            </div>
          </div>

          {/* SIDE PANEL */}
          <div className="w-[176px] flex flex-col gap-2.5 shrink-0">
            {/* Selected seat */}
            <div
              className={`rounded-xl p-4 transition-all ${
                selCell?.type === "seat"
                  ? "bg-white border-2 border-yellow-400 shadow-sm"
                  : "bg-white border border-gray-200"
              }`}
            >
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                Siège sélectionné
              </p>
              {selCell?.type === "seat" && sel ? (
                <>
                  <p className="text-sm font-bold text-gray-900 mb-2.5">
                    Siège {selCell.id}
                  </p>
                  <p className="text-[11px] text-gray-400 mb-1.5">Position</p>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {POS_CYCLE.map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setCellPos(sel[0], sel[1], pos)}
                        className={`py-1.5 rounded-lg cursor-pointer text-xs font-semibold transition-all ${
                          selCell.pos === pos
                            ? "bg-yellow-400 text-gray-900 border-2 border-yellow-400"
                            : "border border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {POS_L[pos]}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => toggleBench(sel[0])}
                    className={`w-full py-2 rounded-lg cursor-pointer mb-1.5 text-xs font-semibold transition-all ${
                      benches[sel[0]]
                        ? "border-2 border-amber-400 bg-amber-50 text-amber-700"
                        : "border border-gray-200 text-gray-600 hover:border-amber-300"
                    }`}
                  >
                    {benches[sel[0]] ? "✓ Banquette" : "Banquette?"}
                  </button>
                  <button
                    onClick={() => clearCell(sel[0], sel[1])}
                    className="w-full py-2 rounded-lg cursor-pointer text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                  >
                    Supprimer
                  </button>
                </>
              ) : (
                <p className="text-xs text-gray-400 text-center py-1.5">
                  Cliquez un siège pour modifier
                </p>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-xl p-4 bg-white border border-gray-200">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                Résumé
              </p>
              <div className="flex flex-col gap-1">
                {grid.map((row, ri) => {
                  const seats = row.filter((c) => c.type === "seat").length;
                  const aisles = row.filter((c) => c.type === "aisle").length;
                  return (
                    <div
                      key={ri}
                      className="flex justify-between text-xs text-gray-600"
                    >
                      <span>
                        R{ri + 1}
                        {benches[ri] ? " · B" : ""}
                      </span>
                      <span className="font-medium">
                        {seats}p{aisles ? ` +${aisles}a` : ""}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-100 pt-1.5 mt-1">
                  <span>Total</span>
                  <span>{totalSeats()} sièges</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="rounded-xl p-4 bg-white border border-gray-200">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                Légende
              </p>
              <div className="flex flex-col gap-1.5">
                {POS_CYCLE.map((pos) => {
                  const s = POS_S[pos];
                  return (
                    <div
                      key={pos}
                      className="flex items-center gap-2 text-xs text-gray-600"
                    >
                      <div
                        className="w-3.5 h-3.5 rounded shrink-0"
                        style={{
                          background: s.bg,
                          border: `1.5px solid ${s.bd}`,
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
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div
                    className="w-3.5 h-3.5 rounded shrink-0"
                    style={{
                      background: "#fef9c3",
                      border: "1.5px solid #fde047",
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
        <div className="flex items-center gap-2 text-xs rounded-xl px-3 py-2 bg-green-50 border border-green-200 text-green-700">
          <Check size={13} />
          {totalSeats()} sièges — {grid.length} rangées — {cols} colonnes
        </div>
      )}
    </div>
  );
}
