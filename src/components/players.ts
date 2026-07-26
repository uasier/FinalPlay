import { Owner } from "../solver/cards";

/** 双方玩家的统一视觉语言：A 蓝色（先手）、B 橙色。 */
export const PLAYER_THEME: Record<
  Owner,
  {
    label: string;
    /** 手牌区标题 */
    title: string;
    /** 徽标（卡牌角标 / 步骤序号） */
    badge: string;
    /** 信息胶囊 */
    chip: string;
    /** 卡牌选中描边 */
    cardRing: string;
    /** 分段控件选中态 */
    segActive: string;
    /** 小圆点 */
    dot: string;
  }
> = {
  A: {
    label: "A",
    title: "玩家 A · 先手",
    badge: "bg-blue-600 text-white",
    chip: "border-blue-200 bg-blue-50 text-blue-700",
    cardRing: "ring-2 ring-blue-500 border-blue-500",
    segActive: "bg-blue-600 text-white shadow-sm",
    dot: "bg-blue-600",
  },
  B: {
    label: "B",
    title: "玩家 B",
    badge: "bg-orange-500 text-white",
    chip: "border-orange-200 bg-orange-50 text-orange-700",
    cardRing: "ring-2 ring-orange-500 border-orange-500",
    segActive: "bg-orange-500 text-white shadow-sm",
    dot: "bg-orange-500",
  },
};
