import { useCallback, useEffect, useRef, useState } from "react";
import { SolveResult } from "../solver/solve";
import { Counts } from "../solver/types";
import { RuleConfig } from "../solver/rule-config";
import { SolverMessage } from "../solver/worker";

export type SolverState =
  | { status: "idle" }
  | { status: "solving"; statesVisited: number }
  | { status: "done"; result: SolveResult; elapsedMs: number }
  | { status: "error"; message: string };

function createWorker(): Worker {
  return new Worker(new URL("../solver/worker.ts", import.meta.url), { type: "module" });
}

/**
 * 在 Web Worker 中运行求解，主线程不再冻结：
 * - 求解中实时汇报已访问状态数；
 * - 可随时取消（直接终止 Worker）。
 */
export function useSolver() {
  const [state, setState] = useState<SolverState>({ status: "idle" });
  const workerRef = useRef<Worker | null>(null);

  const dispose = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  useEffect(() => dispose, [dispose]);

  const solve = useCallback(
    (handA: Counts, handB: Counts, rules: RuleConfig) => {
      dispose();
      const worker = createWorker();
      workerRef.current = worker;
      setState({ status: "solving", statesVisited: 0 });

      worker.onmessage = (event: MessageEvent<SolverMessage>) => {
        const msg = event.data;
        if (msg.type === "progress") {
          setState((prev) =>
            prev.status === "solving" ? { status: "solving", statesVisited: msg.statesVisited } : prev,
          );
        } else if (msg.type === "done") {
          setState({ status: "done", result: msg.result, elapsedMs: msg.elapsedMs });
        } else {
          setState({ status: "error", message: msg.message });
        }
      };
      worker.onerror = (event) => {
        setState({ status: "error", message: event.message || "求解线程异常" });
      };

      worker.postMessage({ handA: Array.from(handA), handB: Array.from(handB), rules });
    },
    [dispose],
  );

  const cancel = useCallback(() => {
    dispose();
    setState({ status: "idle" });
  }, [dispose]);

  const reset = useCallback(() => {
    dispose();
    setState((prev) => (prev.status === "idle" ? prev : { status: "idle" }));
  }, [dispose]);

  return { state, solve, cancel, reset };
}
