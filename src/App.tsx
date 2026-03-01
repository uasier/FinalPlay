import { useMemo, useState } from "react";
import { Card, DECK, Owner, cardsToCounts } from "./solver/cards";
import { SolveResult, solveGame } from "./solver/solve";
import { DeckGrid } from "./components/DeckGrid";
import { Hand } from "./components/Hand";
import { StrategyPanel } from "./components/StrategyPanel";

type Tool = Owner | "erase";

function getCardsForOwner(ownerById: Record<string, Owner | null>, owner: Owner): Card[] {
  return DECK.filter((c) => ownerById[c.id] === owner);
}

export default function App() {
  const [tool, setTool] = useState<Tool>("A");
  const [ownerById, setOwnerById] = useState<Record<string, Owner | null>>(() => {
    const base: Record<string, Owner | null> = {};
    for (const c of DECK) base[c.id] = null;
    return base;
  });

  const [solving, setSolving] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);
  const cardsA = useMemo(() => getCardsForOwner(ownerById, "A"), [ownerById]);
  const cardsB = useMemo(() => getCardsForOwner(ownerById, "B"), [ownerById]);

  function setOwner(cardId: string, nextOwner: Owner | null) {
    setOwnerById((prev) => {
      if (prev[cardId] === nextOwner) return prev;
      return { ...prev, [cardId]: nextOwner };
    });
  }

  function clearHands() {
    setOwnerById((prev) => {
      const next: Record<string, Owner | null> = { ...prev };
      for (const id of Object.keys(next)) next[id] = null;
      return next;
    });
    setResult(null);
  }

  async function onSolve() {
    setSolving(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 0));
    try {
      const handA = cardsToCounts(cardsA);
      const handB = cardsToCounts(cardsB);
      setResult(solveGame(handA, handB));
    } finally {
      setSolving(false);
    }
  }

  const canSolve = cardsA.length > 0 && cardsB.length > 0 && !solving;

  return (
    <div className="min-h-dvh bg-base-bg text-base-text">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <header className="scanlines relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
          <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-2xl tracking-wide md:text-3xl">斗地主残局破解</h1>
              <p className="mt-1 text-sm text-slate-300">
                设置 A/B 手牌，点击求解，输出「A 必胜（B 任意应对都会输）」的策略树。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-white/10 bg-black/20 p-1">
                <button
                  type="button"
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    tool === "A" ? "bg-white/10 shadow-neon" : "hover:bg-white/5"
                  }`}
                  onClick={() => setTool("A")}
                >
                  指派给 A
                </button>
                <button
                  type="button"
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    tool === "B" ? "bg-white/10 shadow-neon" : "hover:bg-white/5"
                  }`}
                  onClick={() => setTool("B")}
                >
                  指派给 B
                </button>
                <button
                  type="button"
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    tool === "erase" ? "bg-white/10 shadow-neon" : "hover:bg-white/5"
                  }`}
                  onClick={() => setTool("erase")}
                >
                  橡皮擦
                </button>
              </div>

              <button
                type="button"
                className="rounded-xl border border-base-cta/40 bg-base-cta px-4 py-2 text-sm font-semibold text-black shadow-neon transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onSolve}
                disabled={!canSolve}
              >
                {solving ? "求解中…" : "求解（A 先手）"}
              </button>
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
                onClick={clearHands}
              >
                清空
              </button>
            </div>
          </div>
        </header>

        <main className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
              <h2 className="font-display text-lg tracking-wide">设置初始手牌</h2>
              <p className="mt-1 text-sm text-slate-300">
                选中工具后点击牌面即可指派。花色仅用于区分卡牌，不影响斗地主大小比较。
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Hand owner="A" cards={cardsA} onRemove={(id) => setOwner(id, null)} />
                <Hand owner="B" cards={cardsB} onRemove={(id) => setOwner(id, null)} />
              </div>
              <div className="mt-4">
                <DeckGrid
                  tool={tool}
                  ownerById={ownerById}
                  onAssign={(cardId) => setOwner(cardId, tool === "erase" ? null : tool)}
                />
              </div>
            </div>
          </section>

          <section className="lg:col-span-5">
            <StrategyPanel solving={solving} result={result} />
          </section>
        </main>
      </div>
    </div>
  );
}

