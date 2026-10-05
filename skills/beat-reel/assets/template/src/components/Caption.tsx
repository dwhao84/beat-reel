import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { FontTheme } from "../fonts";

type Props = {
  text: string;
  /** 景點英文名,放在中文下面一行。沒有就不顯示 */
  textEn?: string;
  theme: FontTheme;
  /** 這張照片的長度(影格) */
  durationInFrames: number;
  /** 轉場長度。字幕要在轉場開始前就退掉,
   *  不然溶接的時候會有兩行字疊在一起 */
  fadeOutFrames: number;
};

/** 下方三分之一處的字幕。鏡頭不長,所以彈入要快,但不要快到像彈出來 */
export const Caption: React.FC<Props> = ({
  text,
  textEn,
  theme,
  durationInFrames,
  fadeOutFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!text) return null;

  // damping 高 = 不回彈;mass 放大一點,讓它用約 10 影格滑進來而不是彈進來
  const enter = spring({ frame, fps, config: { damping: 200, mass: 0.6 } });
  const y = interpolate(enter, [0, 1], [26, 0]);

  // 英文名長度差很多(Funan 5 個字母,松發肉骨茶那行 38 個),
  // 字距固定的話長的會頂到畫面邊。字距是寬度的大宗 —— 38 個字母乘 9px
  // 光字距就吃掉 342px,所以只收字距、字級不動,字才不會變小難讀。
  const enTracking = Math.max(4, Math.min(9, Math.round((9 * 28) / Math.max(1, textEn?.length ?? 1))));

  // 退場跟著轉場走:轉場開始前 2 格就退完
  const fadeEnd = Math.max(6, durationInFrames - fadeOutFrames - 2);
  const fadeStart = Math.max(3, fadeEnd - 10);
  const fadeOut = interpolate(frame, [fadeStart, fadeEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 260 }}
    >
      <div
        style={{
          opacity: Math.min(enter, fadeOut),
          transform: `translateY(${y}px)`,
          padding: "0 60px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...theme.caption,
            color: "#fff",
            textShadow: "0 4px 24px rgba(0,0,0,0.7)",
            lineHeight: 1.35,
            // 字距會在最後一個字右邊多出空白,補回來讓視覺置中
            marginRight: -theme.caption.letterSpacing,
          }}
        >
          {text}
        </div>
        {textEn ? (
          <div
            style={{
              fontFamily: theme.subtitle.fontFamily,
              fontWeight: theme.subtitle.fontWeight,
              // 比中文小一號、字距拉開,跟開頭標題的中英排法同一套
              fontSize: 28,
              letterSpacing: enTracking,
              marginTop: 14,
              marginRight: -enTracking,
              color: "rgba(255,255,255,0.88)",
              textShadow: "0 3px 18px rgba(0,0,0,0.75)",
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}
          >
            {textEn}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
