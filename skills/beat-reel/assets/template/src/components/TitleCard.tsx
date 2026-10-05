import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TITLE_FRAMES } from "../config";
import type { FontTheme } from "../fonts";

type Props = { theme: FontTheme; title: string; subtitle: string };

/** 開頭大標題,蓋在第一張照片上,幾秒後淡出 */
export const TitleCard: React.FC<Props> = ({ theme, title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 16, mass: 0.6 } });
  const scale = interpolate(enter, [0, 1], [0.88, 1]);
  const out = interpolate(frame, [TITLE_FRAMES - 18, TITLE_FRAMES], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lineWidth = interpolate(enter, [0, 1], [0, 170]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
      <div style={{ transform: `scale(${scale})`, opacity: enter, textAlign: "center" }}>
        <div
          style={{
            ...theme.title,
            color: "#fff",
            textShadow: "0 6px 40px rgba(0,0,0,0.65)",
            // 字距會在最後一個字右邊多出空白,補回來讓視覺置中
            marginRight: -theme.title.letterSpacing,
          }}
        >
          {title}
        </div>
        <div
          style={{
            width: lineWidth,
            height: 3,
            background: "rgba(255,255,255,0.95)",
            margin: "30px auto",
            borderRadius: 2,
            boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
          }}
        />
        <div
          style={{
            ...theme.subtitle,
            color: "rgba(255,255,255,0.92)",
            textShadow: "0 4px 24px rgba(0,0,0,0.6)",
            marginRight: -theme.subtitle.letterSpacing,
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
