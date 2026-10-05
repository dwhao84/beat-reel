import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { FPS, PUNCH_ON_CUT, WIDTH, ZOOM_PER_SECOND } from "../config";
import type { Face, Shot } from "../types";

type Props = {
  shot: Shot;
  /** public/photos/ 與 public/videos/ 底下的旅程資料夾 */
  dir: string;
  zoom: "in" | "out";
  /** 這個鏡頭的長度(影格)。長短不一,所以不能用全域常數 */
  durationInFrames: number;
};

/**
 * 切點那一下的放大幅度與衰減長度。
 * 轉場拉長之後這一下大半會被溶解蓋掉,所以幅度調小、衰減拉長,
 * 讓它變成「推一下」而不是「彈一下」。
 */
const PUNCH_AMOUNT = 0.007;
const PUNCH_FRAMES = 12;

/** emoji 的字級要比臉寬一點點,glyph 本身四周有空白 */
const EMOJI_OVERSCAN = 1.08;

/**
 * 算出這一格 emoji 該在哪。
 * 沒給 keyframes 就是定點(照片);有的話就在關鍵影格之間線性內插,
 * 頭尾超出範圍的直接貼齊第一格 / 最後一格。
 */
const faceAt = (f: Face, frame: number) => {
  const ks = f.keyframes;
  if (!ks || ks.length < 2) return { x: f.x, y: f.y, size: f.size };

  const t = frame / FPS;
  if (t <= ks[0].at) {
    return { x: ks[0].x, y: ks[0].y, size: ks[0].size ?? f.size };
  }
  const last = ks[ks.length - 1];
  if (t >= last.at) {
    return { x: last.x, y: last.y, size: last.size ?? f.size };
  }

  const i = ks.findIndex((k, n) => n > 0 && t < k.at);
  const a = ks[i - 1];
  const b = ks[i];
  const p = (t - a.at) / (b.at - a.at);
  return {
    x: a.x + (b.x - a.x) * p,
    y: a.y + (b.y - a.y) * p,
    size: (a.size ?? f.size) + ((b.size ?? f.size) - (a.size ?? f.size)) * p,
  };
};

/**
 * 一個鏡頭(照片或影片)。
 *
 * 照片會加 Ken Burns 緩慢縮放,縮放用「固定速率」而不是固定幅度:
 * 每個鏡頭長度不一,若用固定幅度,短鏡頭的移動速度會變快,看起來會一直晃。
 *
 * 影片本身就在動了,再推鏡頭會頭暈,所以只留切點那一下的 punch。
 */
export const KenBurnsShot: React.FC<Props> = ({ shot, dir, zoom, durationInFrames }) => {
  const frame = useCurrentFrame();
  const isVideo = Boolean(shot.video);
  const url = isVideo
    ? staticFile(`videos/${dir}/${shot.video}`)
    : staticFile(`photos/${dir}/${shot.src}`);
  const fit = shot.fit ?? "cover";

  // 這張總共要走多少縮放量(依長度等比),上限 12% 免得長鏡頭爆掉
  const span = Math.min(0.12, (durationInFrames / FPS) * ZOOM_PER_SECOND);
  const base = 1.02; // 留一點底,避免縮放邊緣露出背景
  const from = zoom === "in" ? base : base + span;
  const to = zoom === "in" ? base + span : base;

  const drift = isVideo
    ? base
    : interpolate(frame, [0, durationInFrames], [from, to], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  const punch =
    PUNCH_ON_CUT && frame < PUNCH_FRAMES
      ? 1 + PUNCH_AMOUNT * Math.pow(1 - frame / PUNCH_FRAMES, 3)
      : 1;

  const scale = drift * punch;
  const trimBefore = Math.round((shot.from ?? 0) * FPS);

  // 影片一律靜音:配樂是後面在 App 裡疊的,留著原聲會打架
  const media = (style: React.CSSProperties) =>
    isVideo ? (
      <OffthreadVideo src={url} trimBefore={trimBefore} muted style={style} />
    ) : (
      <Img src={url} style={style} />
    );

  // emoji 跟畫面放在同一層,所以 Ken Burns 推進去的時候 emoji 會一起放大,
  // 不會推到一半就跟臉錯開
  const faces = shot.faces?.map((f, i) => {
    const at = faceAt(f, frame);
    return (
      <div
        key={`${f.emoji}-${i}`}
        style={{
          position: "absolute",
          left: `${at.x * 100}%`,
          top: `${at.y * 100}%`,
          transform: "translate(-50%, -50%)",
          fontSize: at.size * WIDTH * EMOJI_OVERSCAN,
          lineHeight: 1,
        }}
      >
        {f.emoji}
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {/* contain 模式:同一個畫面放大模糊當背景,避免上下黑邊 */}
      {fit === "contain" ? (
        <>
          {media({
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scale(1.25)",
            // 有 emoji 蓋臉的鏡頭,糊底裡那張臉也要一起糊掉 ——
            // 44px 已經認不出是誰,但還看得出是一團膚色的頭,再加重一點
            filter: shot.faces?.length
              ? "blur(80px) brightness(0.42) saturate(1.35)"
              : "blur(44px) brightness(0.52) saturate(1.35)",
          })}
          {/* 糊底本身很平,壓個暗角才不會像一片灰牆 */}
          <AbsoluteFill
            style={{
              background:
                "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.5) 100%)",
            }}
          />
        </>
      ) : null}

      {fit === "contain" ? (
        // 橫幅素材在直幅畫面裡只佔三分之一高,置中的話字幕會壓在上面。
        // 把它抬到偏上,下半部空出來給字幕,看起來才像排版過的。
        <AbsoluteFill style={{ justifyContent: "center", paddingBottom: 300 }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              transform: `scale(${scale})`,
              transformOrigin: "center center",
              // 陰影掛在外框、裁切也在外框:emoji 跟著臉移出畫面時
              // 會被切掉,不會掉到下面的模糊底上
              boxShadow: "0 24px 70px rgba(0,0,0,0.55)",
              overflow: "hidden",
            }}
          >
            {media({ width: "100%", objectFit: "contain", display: "block" })}
            {faces}
          </div>
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
        >
          {media({ width: "100%", height: "100%", objectFit: "cover" })}
          {faces}
        </AbsoluteFill>
      )}

      {/* 底部漸層,讓字幕讀得清楚 */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 22%, rgba(0,0,0,0) 40%)",
        }}
      />
    </AbsoluteFill>
  );
};
