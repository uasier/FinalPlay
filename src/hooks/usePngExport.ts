import { useCallback, useState } from "react";

/** 将某个 DOM 节点导出为 PNG（基于 html-to-image，按需动态加载）。 */
export function usePngExport() {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const exportPng = useCallback(
    async (el: HTMLElement, filePrefix: string) => {
      if (exporting) return;
      setExporting(true);
      setMessage(null);
      try {
        const { toPng } = await import("html-to-image");
        let dataUrl: string | null = null;
        let lastErr: unknown;
        for (const pixelRatio of [2, 1]) {
          try {
            dataUrl = await toPng(el, { cacheBust: true, pixelRatio, backgroundColor: "#ffffff" });
            break;
          } catch (err) {
            lastErr = err;
          }
        }
        if (!dataUrl) throw lastErr;

        const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const a = document.createElement("a");
        a.download = `${filePrefix}-${stamp}.png`;
        a.href = dataUrl;
        a.click();
        setMessage("已导出 PNG");
      } catch (err) {
        console.error(err);
        setMessage("导出失败：内容过大或浏览器限制");
      } finally {
        setExporting(false);
      }
    },
    [exporting],
  );

  return { exporting, message, exportPng };
}
