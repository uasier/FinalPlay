import { useEffect, useState } from "react";
import { DEFAULT_RULE_CONFIG, normalizeRuleConfig, RuleConfig } from "../solver/rule-config";

const STORAGE_KEY = "ruleConfig.v1";

/** 规则配置状态，自动持久化到 localStorage。 */
export function useRuleConfig() {
  const [ruleConfig, setRuleConfig] = useState<RuleConfig>(() => {
    if (typeof window === "undefined") return DEFAULT_RULE_CONFIG;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_RULE_CONFIG;
      return normalizeRuleConfig(JSON.parse(raw));
    } catch {
      return DEFAULT_RULE_CONFIG;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ruleConfig));
    } catch {
      // 存储失败不影响使用
    }
  }, [ruleConfig]);

  return { ruleConfig, setRuleConfig };
}
