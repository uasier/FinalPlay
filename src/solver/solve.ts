import { generateAllPlays } from "./playgen";
import { otherPlayer } from "./ranks";
import { canBeat } from "./rules";
import { Counts, GameState, Move, Play, Player, RankValue } from "./types";
import { DEFAULT_RULE_CONFIG, RuleConfig, ruleKey } from "./rule-config";

export type StrategyNode = {
  turn: Player;
  constraint: Play | null;
  a: Counts;
  b: Counts;
  children: Array<{ move: Move; next: StrategyNode }>;
};

export type SolveStats = {
  statesVisited: number;
  memoHits: number;
  playCacheSize: number;
};

export type SolveResult =
  | {
      ok: true;
      strategy: StrategyNode;
      stats: SolveStats;
    }
  | {
      ok: false;
      stats: SolveStats;
    };

function countsKey(c: Counts): string {
  return c.join(",");
}

function stateKey(s: GameState): string {
  const c = s.constraint;
  const cKey = c ? `${c.type}:${c.keyRank}:${c.length ?? ""}:${c.cards.join(".")}` : "none";
  return `${countsKey(s.a)}|${countsKey(s.b)}|${s.turn}|${cKey}`;
}

function cloneCounts(c: Counts): number[] {
  return Array.from(c);
}

function applyPlay(hand: Counts, play: Play): Counts {
  const next = cloneCounts(hand);
  for (const r of play.cards) next[r] -= 1;
  return next as Counts;
}

function isEmpty(hand: Counts): boolean {
  for (const n of hand) if (n > 0) return false;
  return true;
}

function legalMovesFor(
  hand: Counts,
  constraint: Play | null,
  playCache: Map<string, Play[]>,
  rulesKey: string,
  allow: RuleConfig["allow"],
): Move[] {
  const passMove: Move = { kind: "PASS" };
  const toPlayMove = (play: Play): Move => ({ kind: "PLAY", play });

  const key = `${rulesKey}|${countsKey(hand)}`;
  let plays = playCache.get(key);
  if (!plays) {
    plays = generateAllPlays(hand, allow);
    playCache.set(key, plays);
  }
  if (!constraint) return plays.map(toPlayMove);
  const beaters = plays.filter((p) => canBeat(p, constraint));
  return [passMove, ...beaters.map(toPlayMove)];
}

function sanitizeCounts(c: Counts): Counts {
  const next = cloneCounts(c);
  for (let i = 0; i < next.length; i += 1) next[i] = Math.max(0, next[i] | 0);
  return next as Counts;
}

type MemoEntry = { winForA: boolean; node?: StrategyNode };

export function solveGame(handA: Counts, handB: Counts, rules: RuleConfig = DEFAULT_RULE_CONFIG): SolveResult {
  const playCache = new Map<string, Play[]>();
  const memo = new Map<string, MemoEntry>();
  const stats: SolveStats = { statesVisited: 0, memoHits: 0, playCacheSize: 0 };
  const rulesKey = ruleKey(rules);

  const start: GameState = {
    a: sanitizeCounts(handA),
    b: sanitizeCounts(handB),
    turn: "A",
    constraint: null
  };

  function solve(state: GameState): MemoEntry {
    const key = stateKey(state);
    const cached = memo.get(key);
    if (cached) {
      stats.memoHits += 1;
      return cached;
    }

    stats.statesVisited += 1;
    if (isEmpty(state.a)) {
      const node: StrategyNode = { turn: state.turn, constraint: state.constraint, a: state.a, b: state.b, children: [] };
      const entry: MemoEntry = { winForA: true, node };
      memo.set(key, entry);
      return entry;
    }
    if (isEmpty(state.b)) {
      const entry: MemoEntry = { winForA: false };
      memo.set(key, entry);
      return entry;
    }

    const turn = state.turn;
    const currentHand = turn === "A" ? state.a : state.b;
    const moves = legalMovesFor(currentHand, state.constraint, playCache, rulesKey, rules.allow);
    stats.playCacheSize = Math.max(stats.playCacheSize, playCache.size);

    if (turn === "A") {
      for (const move of moves) {
        const nextState: GameState =
          move.kind === "PASS"
            ? { a: state.a, b: state.b, turn: otherPlayer(turn), constraint: null }
            : {
                a: applyPlay(state.a, move.play),
                b: state.b,
                turn: otherPlayer(turn),
                constraint: move.play
              };
        const child = solve(nextState);
        if (child.winForA) {
          const node: StrategyNode = {
            turn,
            constraint: state.constraint,
            a: state.a,
            b: state.b,
            children: [{ move, next: child.node! }]
          };
          const entry: MemoEntry = { winForA: true, node };
          memo.set(key, entry);
          return entry;
        }
      }
      const entry: MemoEntry = { winForA: false };
      memo.set(key, entry);
      return entry;
    }

    const children: Array<{ move: Move; next: StrategyNode }> = [];
    for (const move of moves) {
      const nextState: GameState =
        move.kind === "PASS"
          ? { a: state.a, b: state.b, turn: otherPlayer(turn), constraint: null }
          : {
              a: state.a,
              b: applyPlay(state.b, move.play),
              turn: otherPlayer(turn),
              constraint: move.play
            };
      const child = solve(nextState);
      if (!child.winForA) {
        const entry: MemoEntry = { winForA: false };
        memo.set(key, entry);
        return entry;
      }
      children.push({ move, next: child.node! });
    }
    const node: StrategyNode = { turn, constraint: state.constraint, a: state.a, b: state.b, children };
    const entry: MemoEntry = { winForA: true, node };
    memo.set(key, entry);
    return entry;
  }

  const root = solve(start);
  stats.playCacheSize = playCache.size;
  if (root.winForA && root.node) return { ok: true, strategy: root.node, stats };
  return { ok: false, stats };
}
