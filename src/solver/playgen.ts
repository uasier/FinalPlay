import { isStraightRank } from "./ranks";
import { Counts, Play, PlayType, RankValue } from "./types";

function hasCount(counts: Counts, rank: RankValue, need: number): boolean {
  return (counts[rank] ?? 0) >= need;
}

function addN(arr: RankValue[], rank: RankValue, n: number) {
  for (let i = 0; i < n; i += 1) arr.push(rank);
}

function enumerateRuns(ranks: RankValue[]): Array<{ start: RankValue; end: RankValue }> {
  if (ranks.length === 0) return [];
  const sorted = [...ranks].sort((a, b) => a - b);
  const runs: Array<{ start: RankValue; end: RankValue }> = [];
  let runStart = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i += 1) {
    const cur = sorted[i];
    if (cur === (prev + 1) as RankValue) {
      prev = cur;
      continue;
    }
    runs.push({ start: runStart, end: prev });
    runStart = cur;
    prev = cur;
  }
  runs.push({ start: runStart, end: prev });
  return runs;
}

function chooseSinglesMultiset(options: Array<{ rank: RankValue; max: number }>, need: number): RankValue[][] {
  const result: RankValue[][] = [];
  const cur: RankValue[] = [];

  function rec(idx: number, remaining: number) {
    if (remaining === 0) {
      result.push([...cur]);
      return;
    }
    if (idx >= options.length) return;
    const { rank, max } = options[idx];
    const takeMax = Math.min(max, remaining);
    for (let t = 0; t <= takeMax; t += 1) {
      for (let i = 0; i < t; i += 1) cur.push(rank);
      rec(idx + 1, remaining - t);
      for (let i = 0; i < t; i += 1) cur.pop();
    }
  }

  rec(0, need);
  return result;
}

function chooseDistinctRanks(options: RankValue[], need: number): RankValue[][] {
  const result: RankValue[][] = [];
  const cur: RankValue[] = [];
  function rec(start: number) {
    if (cur.length === need) {
      result.push([...cur]);
      return;
    }
    for (let i = start; i < options.length; i += 1) {
      cur.push(options[i]);
      rec(i + 1);
      cur.pop();
    }
  }
  rec(0);
  return result;
}

export function generateAllPlays(counts: Counts, allow: Record<PlayType, boolean>): Play[] {
  const plays: Play[] = [];

  const sj = 13 as RankValue;
  const bj = 14 as RankValue;
  if (allow.rocket && hasCount(counts, sj, 1) && hasCount(counts, bj, 1)) {
    plays.push({ type: "rocket", keyRank: bj, cards: [sj, bj] });
  }

  if (allow.bomb) {
    for (let r = 0 as RankValue; r <= 12; r = ((r + 1) as RankValue)) {
      if (hasCount(counts, r, 4)) {
        plays.push({ type: "bomb", keyRank: r, cards: [r, r, r, r] });
      }
    }
  }

  for (let r = 0 as RankValue; r <= 14; r = ((r + 1) as RankValue)) {
    if (allow.single && hasCount(counts, r, 1)) plays.push({ type: "single", keyRank: r, cards: [r] });
    if (allow.pair && hasCount(counts, r, 2)) plays.push({ type: "pair", keyRank: r, cards: [r, r] });
    if (allow.triple && hasCount(counts, r, 3)) plays.push({ type: "triple", keyRank: r, cards: [r, r, r] });
  }

  if (allow.triple_single || allow.triple_pair) {
    for (let t = 0 as RankValue; t <= 14; t = ((t + 1) as RankValue)) {
      if (!hasCount(counts, t, 3)) continue;
      for (let k = 0 as RankValue; k <= 14; k = ((k + 1) as RankValue)) {
        if (k === t) continue;
        if (allow.triple_single && hasCount(counts, k, 1)) {
          plays.push({ type: "triple_single", keyRank: t, cards: [t, t, t, k] });
        }
        if (allow.triple_pair && hasCount(counts, k, 2)) {
          plays.push({ type: "triple_pair", keyRank: t, cards: [t, t, t, k, k] });
        }
      }
    }
  }

  if (allow.four_two || allow.four_two_pairs) {
    for (let q = 0 as RankValue; q <= 12; q = ((q + 1) as RankValue)) {
      if (!hasCount(counts, q, 4)) continue;

      if (allow.four_two) {
        const singles: Array<{ rank: RankValue; max: number }> = [];
        for (let r = 0 as RankValue; r <= 14; r = ((r + 1) as RankValue)) {
          if (r === q) continue;
          const max = counts[r] ?? 0;
          if (max > 0) singles.push({ rank: r, max });
        }
        const picks = chooseSinglesMultiset(singles, 2);
        for (const pick of picks) {
          const cards: RankValue[] = [];
          addN(cards, q, 4);
          for (const r of pick) cards.push(r);
          plays.push({ type: "four_two", keyRank: q, cards });
        }
      }

      if (allow.four_two_pairs) {
        const pairRanks: RankValue[] = [];
        for (let r = 0 as RankValue; r <= 14; r = ((r + 1) as RankValue)) {
          if (r === q) continue;
          if (hasCount(counts, r, 2)) pairRanks.push(r);
        }
        const pairCombos = chooseDistinctRanks(pairRanks, 2);
        for (const [p1, p2] of pairCombos) {
          const cards: RankValue[] = [];
          addN(cards, q, 4);
          addN(cards, p1, 2);
          addN(cards, p2, 2);
          plays.push({ type: "four_two_pairs", keyRank: q, cards });
        }
      }
    }
  }

  if (allow.straight) {
    const straightRanks: RankValue[] = [];
    for (let r = 0 as RankValue; r <= 11; r = ((r + 1) as RankValue)) {
      if (hasCount(counts, r, 1)) straightRanks.push(r);
    }
    for (const run of enumerateRuns(straightRanks)) {
      const runLen = (run.end - run.start + 1) as number;
      if (runLen < 5) continue;
      for (let start = run.start; start <= run.end; start = ((start + 1) as RankValue)) {
        for (let end = (start + 4) as RankValue; end <= run.end; end = ((end + 1) as RankValue)) {
          const len = (end - start + 1) as number;
          const cards: RankValue[] = [];
          for (let r = start; r <= end; r = ((r + 1) as RankValue)) cards.push(r);
          plays.push({ type: "straight", keyRank: end, length: len, cards });
        }
      }
    }
  }

  if (allow.straight_pairs) {
    const pairRunRanks: RankValue[] = [];
    for (let r = 0 as RankValue; r <= 11; r = ((r + 1) as RankValue)) {
      if (hasCount(counts, r, 2)) pairRunRanks.push(r);
    }
    for (const run of enumerateRuns(pairRunRanks)) {
      const runLen = (run.end - run.start + 1) as number;
      if (runLen < 3) continue;
      for (let start = run.start; start <= run.end; start = ((start + 1) as RankValue)) {
        for (let end = (start + 2) as RankValue; end <= run.end; end = ((end + 1) as RankValue)) {
          const len = (end - start + 1) as number;
          const cards: RankValue[] = [];
          for (let r = start; r <= end; r = ((r + 1) as RankValue)) addN(cards, r, 2);
          plays.push({ type: "straight_pairs", keyRank: end, length: len, cards });
        }
      }
    }
  }

  if (allow.airplane || allow.airplane_single || allow.airplane_pair) {
    const tripleRunRanks: RankValue[] = [];
    for (let r = 0 as RankValue; r <= 11; r = ((r + 1) as RankValue)) {
      if (hasCount(counts, r, 3)) tripleRunRanks.push(r);
    }
    for (const run of enumerateRuns(tripleRunRanks)) {
      const runLen = (run.end - run.start + 1) as number;
      if (runLen < 2) continue;
      for (let start = run.start; start <= run.end; start = ((start + 1) as RankValue)) {
        for (let end = (start + 1) as RankValue; end <= run.end; end = ((end + 1) as RankValue)) {
          const units = (end - start + 1) as number;

          const tripleRanks: RankValue[] = [];
          for (let r = start; r <= end; r = ((r + 1) as RankValue)) tripleRanks.push(r);

          const baseCards: RankValue[] = [];
          for (const r of tripleRanks) addN(baseCards, r, 3);
          if (allow.airplane) plays.push({ type: "airplane", keyRank: end, length: units, cards: baseCards });

          if (allow.airplane_single) {
            const singleOptions: Array<{ rank: RankValue; max: number }> = [];
            for (let r = 0 as RankValue; r <= 14; r = ((r + 1) as RankValue)) {
              if (tripleRanks.includes(r)) continue;
              const max = counts[r] ?? 0;
              if (max > 0) singleOptions.push({ rank: r, max });
            }
            const wingsSingles = chooseSinglesMultiset(singleOptions, units);
            for (const wing of wingsSingles) {
              const cards: RankValue[] = [...baseCards, ...wing];
              plays.push({ type: "airplane_single", keyRank: end, length: units, cards });
            }
          }

          if (allow.airplane_pair) {
            const pairOptions: RankValue[] = [];
            for (let r = 0 as RankValue; r <= 14; r = ((r + 1) as RankValue)) {
              if (tripleRanks.includes(r)) continue;
              if (hasCount(counts, r, 2)) pairOptions.push(r);
            }
            const wingsPairs = chooseDistinctRanks(pairOptions, units);
            for (const wingRanks of wingsPairs) {
              const wingCards: RankValue[] = [];
              for (const r of wingRanks) addN(wingCards, r, 2);
              const cards: RankValue[] = [...baseCards, ...wingCards];
              plays.push({ type: "airplane_pair", keyRank: end, length: units, cards });
            }
          }
        }
      }
    }
  }

  const filtered = plays.filter((p) => {
    if (p.type === "straight" || p.type === "straight_pairs" || p.type.startsWith("airplane")) {
      if (!p.length || p.length <= 0) return false;
    }
    for (const c of p.cards) {
      if (!Number.isInteger(c)) return false;
      if (!isStraightRank(c) && (p.type === "straight" || p.type === "straight_pairs" || p.type === "airplane")) {
        return false;
      }
    }
    return true;
  });

  return filtered;
}
