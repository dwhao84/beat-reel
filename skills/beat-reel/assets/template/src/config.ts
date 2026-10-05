// ============================================================
//  影片內容在 src/trips/ 底下,一趟旅程一個檔案。
//  這裡只放所有旅程共用的節奏與樣式參數。
// ============================================================

import type { FontPreset } from "./fonts";
import type { Face, Shot, Trip } from "./types";

export type { Face, Shot, Trip };

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// ── 音樂對拍 ───────────────────────────────────────────────
// BPM 寫在各趟旅程裡(src/trips/*.ts),因為每支片配的歌不一樣。
/** 一般照片佔幾拍。174 BPM 下 2 拍 = 0.69 秒 */
export const BEATS_PER_PHOTO = 2;
/** 有字幕的照片佔幾拍。0.69 秒讀不完一句中文,所以給多一點 */
export const BEATS_PER_CAPTIONED = 4;
/** 轉場長度的預設值。對拍片要短,太長會把拍點糊掉;
 *  但鏡頭放長的片子要反過來加長,各趟旅程可以用 transitionFrames 覆蓋 */
export const TRANSITION_FRAMES = 4;
/** 最後一張多留的尾巴,避免戛然而止 */
export const TAIL_FRAMES = 24;
/**
 * 切點打一下輕微放大。只在每張開頭打一次就衰減完。
 * (別改成「每拍都打」:174 BPM 等於每秒彈 2.9 次,會變成持續抖動)
 */
export const PUNCH_ON_CUT = true;
/** Ken Burns 的縮放速率,每秒幾 %。用速率而不是固定幅度,
 *  長短鏡頭的移動速度才會一致,不然短鏡頭看起來會一直晃 */
export const ZOOM_PER_SECOND = 0.045;

/** 開頭標題停留多久 */
export const TITLE_FRAMES = 83; // 8 拍 = 2 小節,退場剛好落在小節線

export const SHOW_PROGRESS_BAR = true;
export const SHOW_CAPTIONS = true;

/**
 * 字體風格,三選一:
 *   "serif" 典雅明體(系統宋體)— 旅遊雜誌 / 電影感
 *   "weibei" 魏碑書法(系統魏碑)— 書法筆觸,最有個性
 *   "yuan"  現代圓體(系統圓體)— 柔和親切
 */
export const FONT_PRESET: FontPreset = "serif";

/** 這趟用多長的轉場 */
export const transitionFramesFor = (trip: Trip) =>
  trip.transitionFrames ?? TRANSITION_FRAMES;

/** 這張照片佔幾拍。單張 > 該趟旅程 > 全域預設 */
export const beatsFor = (trip: Trip, p: Shot) =>
  p.beats ??
  (p.caption
    ? trip.beatsPerCaptioned ?? BEATS_PER_CAPTIONED
    : trip.beatsPerPhoto ?? BEATS_PER_PHOTO);

/**
 * 每一刀的絕對影格位置。
 * 174 BPM 配 30fps 時一拍 = 10.34 影格,不是整數。
 * 所以先用「累積拍數 → 秒 → 影格」再四捨五入,
 * 誤差永遠 < 半格且不會累積;逐張四捨五入的話尾段會整個脫拍。
 */
export const cutFrames = (trip: Trip): number[] => {
  const cuts = [0];
  let beats = 0;
  for (const p of trip.shots) {
    beats += beatsFor(trip, p);
    cuts.push(Math.round((beats * 60) / trip.bpm * FPS));
  }
  return cuts;
};

/** 每個 Sequence 的長度(含要被轉場吃掉的重疊) */
export const shotDurations = (trip: Trip): number[] => {
  const cuts = cutFrames(trip);
  const tr = transitionFramesFor(trip);
  return trip.shots.map((_, i) => {
    const base = cuts[i + 1] - cuts[i] + tr;
    return i === trip.shots.length - 1 ? base + TAIL_FRAMES : base;
  });
};

export const totalFrames = (trip: Trip) => {
  const d = shotDurations(trip);
  return d.reduce((a, b) => a + b, 0) - (d.length - 1) * transitionFramesFor(trip);
};
