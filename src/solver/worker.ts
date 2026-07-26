/// <reference lib="webworker" />
import { solveGame, SolveResult } from "./solve";
import { Counts } from "./types";
import { normalizeRuleConfig, RuleConfig } from "./rule-config";

export type SolveRequest = {
  handA: number[];
  handB: number[];
  rules: RuleConfig;
};

export type SolverMessage =
  | { type: "progress"; statesVisited: number }
  | { type: "done"; result: SolveResult; elapsedMs: number }
  | { type: "error"; message: string };

function post(message: SolverMessage) {
  (self as unknown as Worker).postMessage(message);
}

self.onmessage = (event: MessageEvent<SolveRequest>) => {
  const { handA, handB, rules } = event.data;
  const startedAt = performance.now();
  try {
    const result = solveGame(
      handA as unknown as Counts,
      handB as unknown as Counts,
      normalizeRuleConfig(rules),
      (stats) => post({ type: "progress", statesVisited: stats.statesVisited }),
    );
    post({ type: "done", result, elapsedMs: performance.now() - startedAt });
  } catch (err) {
    post({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};
