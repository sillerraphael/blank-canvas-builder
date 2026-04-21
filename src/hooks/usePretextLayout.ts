import { useMemo, useCallback } from "react";
import {
  prepareWithSegments,
  measureLineStats,
  type PreparedTextWithSegments,
} from "@chenglou/pretext";

const MSG_FONT = "14px Inter, sans-serif";
const MSG_LINE_HEIGHT = 21; // 14px * 1.5 (leading-relaxed)
const MSG_PADDING_Y = 24;   // py-3 = 12px * 2
const MSG_PADDING_X = 32;   // px-4 = 16px * 2
const HEADER_H = 56;
const INPUT_H = 64;
const MSG_GAP = 16;         // space-y-4
const CONTAINER_PAD_Y = 32; // py-4 = 16px * 2
const TIMESTAMP_H = 18;

interface Message {
  id: number;
  role: "assistant" | "user";
  content: string;
  time: string;
}

export interface BubbleDims {
  width: number;
  height: number;
}

/**
 * Uses @chenglou/pretext to compute shrinkwrapped bubble dimensions and total
 * chat height without touching the DOM — ~300-600× faster than DOM measurement.
 *
 * Workflow:
 *   prepareWithSegments() — one-time: canvas measurement + Unicode segmentation, cached by text
 *   measureLineStats()    — cheap: pure arithmetic over cached segment widths
 */
export function usePretextLayout() {
  // Cache prepared text by content string — canvas measurement is expensive, do it once per unique text
  const preparedCache = useMemo(() => new Map<string, PreparedTextWithSegments>(), []);

  const getPrepared = useCallback(
    (plainText: string): PreparedTextWithSegments => {
      let prepared = preparedCache.get(plainText);
      if (!prepared) {
        prepared = prepareWithSegments(plainText, MSG_FONT);
        preparedCache.set(plainText, prepared);
      }
      return prepared;
    },
    [preparedCache]
  );

  /**
   * Compute the tightest bubble dimensions for a given text and max outer width.
   *
   * Returns:
   *   width  — shrinkwrapped outer bubble width (text natural width + padding, capped at maxBubbleW)
   *   height — bubble height (line count × line height + vertical padding)
   *
   * This is the core pretext use case: exact dimensions before any DOM paint,
   * enabling smooth streaming animations without layout shift.
   */
  const measureBubble = useCallback(
    (text: string, maxBubbleW: number): BubbleDims => {
      const plainText = text.replace(/\*\*/g, "");
      if (!plainText.trim()) {
        // Empty / in-progress streaming placeholder
        return { width: MSG_PADDING_X + 24, height: MSG_LINE_HEIGHT + MSG_PADDING_Y };
      }
      const textMaxW = maxBubbleW - MSG_PADDING_X;
      const prepared = getPrepared(plainText);
      // measureLineStats: pure arithmetic — no string allocations, no DOM
      const { lineCount, maxLineWidth } = measureLineStats(prepared, textMaxW);
      return {
        // +2px rounding buffer for sub-pixel font metrics
        width: Math.min(Math.ceil(maxLineWidth) + MSG_PADDING_X + 2, maxBubbleW),
        height: Math.max(1, lineCount) * MSG_LINE_HEIGHT + MSG_PADDING_Y,
      };
    },
    [getPrepared]
  );

  /**
   * Compute total messages area height for panel auto-grow.
   * Called on every message update and panel resize — stays fast because
   * prepareWithSegments results are cached by text content.
   */
  const measureMessages = useCallback(
    (messages: Message[], panelW: number): number => {
      // px-5 scroll container padding on each side = 40px total
      const maxBubbleW = (panelW - 40) * 0.8;
      let totalH = CONTAINER_PAD_Y;
      for (let i = 0; i < messages.length; i++) {
        const { height } = measureBubble(messages[i].content, maxBubbleW);
        totalH += height + TIMESTAMP_H;
        if (i < messages.length - 1) totalH += MSG_GAP;
      }
      return HEADER_H + totalH + INPUT_H;
    },
    [measureBubble]
  );

  return { measureBubble, measureMessages };
}
