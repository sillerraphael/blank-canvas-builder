import { useMemo, useCallback } from "react";
import { prepare, layout } from "@chenglou/pretext";

const MSG_FONT = "14px Inter, sans-serif";
const MSG_LINE_HEIGHT = 21; // 14px * 1.5 (leading-relaxed)
const MSG_PADDING_Y = 24; // py-3 = 12px * 2
const MSG_PADDING_X = 32; // px-4 = 16px * 2
const HEADER_H = 56;
const INPUT_H = 64;
const MSG_GAP = 16; // space-y-4
const CONTAINER_PAD_Y = 32; // py-4 = 16px * 2
const AVATAR_W = 38; // avatar + gap

interface Message {
  id: number;
  role: "assistant" | "user";
  content: string;
  time: string;
}

/**
 * Uses @chenglou/pretext to compute total chat content height
 * without touching the DOM — ~600× faster than DOM measurement.
 */
export function usePretextLayout() {
  // Cache prepared texts by message id + width
  const cache = useMemo(() => new Map<string, number>(), []);

  const measureMessages = useCallback(
    (messages: Message[], panelW: number): number => {
      // Available width for message text: panel - padding - avatar - bubble padding
      const maxBubbleW = (panelW * 0.8) - MSG_PADDING_X;
      const textMaxW = maxBubbleW - AVATAR_W;

      let totalH = CONTAINER_PAD_Y;

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        // Strip markdown bold markers for measurement
        const plainText = msg.content.replace(/\*\*/g, "");
        const cacheKey = `${msg.id}:${Math.round(textMaxW)}`;

        let bubbleH = cache.get(cacheKey);
        if (bubbleH === undefined) {
          const prepared = prepare(plainText, MSG_FONT);
          const result = layout(prepared, textMaxW, MSG_LINE_HEIGHT);
          // Clamp to at least 1 line for empty strings
          const lineCount = Math.max(1, result.lineCount);
          bubbleH = lineCount * MSG_LINE_HEIGHT + MSG_PADDING_Y;
          cache.set(cacheKey, bubbleH);
        }

        totalH += bubbleH;
        // Add timestamp height (~18px)
        totalH += 18;
        // Add gap between messages (except last)
        if (i < messages.length - 1) {
          totalH += MSG_GAP;
        }
      }

      return HEADER_H + totalH + INPUT_H;
    },
    [cache]
  );

  return { measureMessages };
}
