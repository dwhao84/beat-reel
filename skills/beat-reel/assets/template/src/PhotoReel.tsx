import React from "react";
import { AbsoluteFill, Easing, Sequence } from "remotion";
import {
  linearTiming,
  TransitionSeries,
  type TransitionPresentation,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

import {
  shotDurations,
  SHOW_CAPTIONS,
  SHOW_PROGRESS_BAR,
  TITLE_FRAMES,
  transitionFramesFor,
} from "./config";
import { tripById } from "./trips";
import { FONT_THEMES, type FontPreset } from "./fonts";
import { KenBurnsShot } from "./components/KenBurnsShot";
import { Caption } from "./components/Caption";
import { TitleCard } from "./components/TitleCard";
import { ProgressBar } from "./components/ProgressBar";
import type { Shot } from "./types";

/**
 * 挑轉場。
 *
 * 規則只有兩條,但這兩條就是「順不順」的關鍵:
 *  1. 前後兩個鏡頭的版型不一樣(滿版 ↔ 模糊底橫幅)就一定用溶接。
 *     版型一換,畫面的形狀跟著變,這時候再用推的,等於同時換形狀又換位置,
 *     看起來就會頓。溶接會把形狀的變化糊掉。
 *  2. 版型一樣的時候,每隔幾刀給一次輕推,方向左右交替,才不會整支都在溶。
 *
 * 原本還有 wipe,拿掉了 —— 它有一條硬邊掃過畫面,是這裡面最跳的一種。
 */
const pickPresentation = (
  a: Shot,
  b: Shot,
  i: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): TransitionPresentation<any> => {
  const sameShape = (a.fit ?? "cover") === (b.fit ?? "cover");
  if (!sameShape) return fade();
  if (i % 4 === 3) {
    return slide({ direction: i % 8 === 3 ? "from-right" : "from-left" });
  }
  return fade();
};

export type PhotoReelProps = { tripId: string; fontPreset: FontPreset };

export const PhotoReel: React.FC<PhotoReelProps> = ({ tripId, fontPreset }) => {
  const trip = tripById(tripId);
  const theme = FONT_THEMES[fontPreset];
  const durations = shotDurations(trip);
  const transitionFrames = transitionFramesFor(trip);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        {trip.shots.map((shot, i) => {
          const nodes = [
            <TransitionSeries.Sequence
              key={`seq-${shot.src ?? shot.video}-${i}`}
              durationInFrames={durations[i]}
            >
              <KenBurnsShot
                shot={shot}
                dir={trip.dir}
                zoom={shot.zoom ?? (i % 2 === 0 ? "in" : "out")}
                durationInFrames={durations[i]}
              />
              {SHOW_CAPTIONS ? (
                <Caption
                  text={shot.caption}
                  textEn={shot.captionEn}
                  theme={theme}
                  durationInFrames={durations[i]}
                  fadeOutFrames={transitionFrames}
                />
              ) : null}
            </TransitionSeries.Sequence>,
          ];

          if (i < trip.shots.length - 1) {
            nodes.push(
              <TransitionSeries.Transition
                key={`tr-${i}`}
                presentation={pickPresentation(shot, trip.shots[i + 1], i)}
                timing={linearTiming({
                  durationInFrames: transitionFrames,
                  // 線性的溶接頭尾會「啪」一下才開始動,加 ease 兩端才接得平順
                  easing: Easing.inOut(Easing.ease),
                })}
              />,
            );
          }

          return nodes;
        })}
      </TransitionSeries>

      {/* 開場標題疊在第一個鏡頭上 */}
      <Sequence durationInFrames={TITLE_FRAMES}>
        <TitleCard theme={theme} title={trip.title} subtitle={trip.subtitle} />
      </Sequence>

      {SHOW_PROGRESS_BAR ? <ProgressBar /> : null}
    </AbsoluteFill>
  );
};
