import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

/** 底部細進度條 — Reels 常見的完播率小技巧 */
export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pct = Math.min(1, frame / durationInFrames) * 100;

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end" }}>
      <div style={{ height: 8, width: "100%", background: "rgba(255,255,255,0.22)" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#fff" }} />
      </div>
    </AbsoluteFill>
  );
};
