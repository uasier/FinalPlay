/**
 * 复制文本到剪贴板：优先使用异步 Clipboard API；
 * 被拒绝（未授权、非安全上下文）时回退到隐藏 textarea + execCommand。
 * 返回是否复制成功。
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 继续尝试兼容方案
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
