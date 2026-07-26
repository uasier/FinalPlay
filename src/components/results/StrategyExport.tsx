import { useEffect, useRef, useState } from "react";
import { StrategyNode } from "../../solver/solve";
import { RuleConfig } from "../../solver/rule-config";
import { buildStrategyMarkdown, StrategyText } from "../../solver/strategy-text";
import { copyText } from "../../utils/clipboard";
import { Button } from "../../ui/Button";

/**
 * 必胜思路导出工具条：
 * - 复制完整思路（Markdown 全文，覆盖 B 的所有应对）；
 * - 下载 .md 文件；
 * - 复制分享链接（打开后自动载入牌面与规则并求解）。
 * 全文按需惰性生成并缓存，避免大策略树在渲染期做无谓计算。
 */
export function StrategyExport({
  root,
  rules,
  shareUrl,
}: {
  root: StrategyNode;
  rules: RuleConfig;
  shareUrl: string | null;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const cache = useRef<StrategyText | null>(null);

  useEffect(() => {
    cache.current = null;
    setMessage(null);
  }, [root, rules, shareUrl]);

  function getText(): StrategyText {
    if (!cache.current) cache.current = buildStrategyMarkdown(root, rules, { shareUrl });
    return cache.current;
  }

  function flash(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(null), 2500);
  }

  async function copyMarkdown() {
    const { markdown, sceneCount } = getText();
    const ok = await copyText(markdown);
    flash(ok ? `已复制完整思路（${sceneCount} 个局面）` : "复制失败：浏览器未授权剪贴板");
  }

  function downloadMarkdown() {
    const { markdown, sceneCount } = getText();
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = "必胜思路.md";
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
    flash(`已下载（${sceneCount} 个局面）`);
  }

  async function copyShareLink() {
    if (!shareUrl) return;
    const ok = await copyText(shareUrl);
    flash(ok ? "已复制分享链接，打开即自动求解" : "复制失败：浏览器未授权剪贴板");
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">分享必胜思路</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={copyMarkdown}>
            复制完整思路
          </Button>
          <Button size="sm" onClick={downloadMarkdown}>
            下载 Markdown
          </Button>
          {shareUrl && (
            <Button variant="primary" size="sm" onClick={copyShareLink}>
              复制分享链接
            </Button>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-xs text-slate-400">
        {message ?? "全文穷举 B 的所有应对与 A 的固定回应；链接打开后自动载入牌面并求解。"}
      </p>
    </div>
  );
}
