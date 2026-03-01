import { Play } from "./types";

export function sameStructure(a: Play, b: Play): boolean {
  if (a.type !== b.type) return false;
  const needsLen = a.type === "straight" || a.type === "straight_pairs" || a.type.startsWith("airplane");
  if (needsLen) return a.length === b.length;
  return true;
}

export function canBeat(candidate: Play, constraint: Play): boolean {
  if (constraint.type === "rocket") return false;
  if (candidate.type === "rocket") return true;

  if (constraint.type === "bomb") {
    return candidate.type === "bomb" && candidate.keyRank > constraint.keyRank;
  }

  if (candidate.type === "bomb") return true;

  if (!sameStructure(candidate, constraint)) return false;
  return candidate.keyRank > constraint.keyRank;
}

