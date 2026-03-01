import { Play } from "../solver/types";
import { formatPlay } from "../solver/format";

export function PlayView({ play }: { play: Play }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs">
      <span className="font-semibold text-base-cta">{play.type}</span>
      <span className="text-slate-200">{formatPlay(play)}</span>
    </span>
  );
}

