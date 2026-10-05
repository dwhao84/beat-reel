/** 影片裡臉會跑,用關鍵影格給幾個時間點的位置,中間自動內插 */
export type FaceKeyframe = {
  /** 從這個鏡頭開頭算起的第幾秒 */
  at: number;
  x: number;
  y: number;
  /** 不填就沿用 Face 的 size */
  size?: number;
};

/** 蓋在臉上的 emoji。x / y / size 都是「佔畫面寬高的幾成」,
 *  跟著 Ken Burns 一起縮放,所以不用管鏡頭推到哪了。
 *
 *  照片給 x / y / size 就夠了;影片的臉會移動,再加 keyframes。
 *  手持拍攝左右晃得很碎,追不乾淨 —— size 寧可給大一點蓋過去,
 *  也不要追得剛剛好然後每隔幾格露出半張臉。 */
export type Face = {
  emoji: string;
  /** 中心點橫座標,0 = 最左,1 = 最右 */
  x: number;
  /** 中心點縱座標,0 = 最上,1 = 最下 */
  y: number;
  /** emoji 寬度佔畫面寬的幾成 */
  size: number;
  /** 影片用。至少要兩個點,按 at 由小到大排 */
  keyframes?: FaceKeyframe[];
};

/**
 * 一個鏡頭:照片或影片二選一。
 *   照片 → src   檔案放 public/photos/<trip.dir>/
 *   影片 → video 檔案放 public/videos/<trip.dir>/
 */
export type Shot = {
  /** 照片檔名 */
  src?: string;
  /** 影片檔名。跟 src 二選一 */
  video?: string;
  /** 影片從第幾秒開始播(預設 0)。只對 video 有效 */
  from?: number;
  /** 字幕文字,留空字串就不顯示 */
  caption: string;
  /** 景點的英文名,顯示在中文字幕下面一行。
   *  只有真的是景點才給 —— 「出發」「再見,新加坡」這種不是地名的留空 */
  captionEn?: string;
  /** 'in' = 慢慢推近,'out' = 慢慢拉遠。不填就依順序自動交替。只對照片有效 */
  zoom?: "in" | "out";
  /** 'cover'(預設)= 滿版;'contain' = 完整顯示,背景補模糊 */
  fit?: "cover" | "contain";
  /** 這張佔幾拍。不填就用該趟旅程的 beatsPerPhoto / beatsPerCaptioned */
  beats?: number;
  /** 用 emoji 蓋住臉。想換表情或挪位置就改這裡 */
  faces?: Face[];
};

export type Trip = {
  /** Remotion composition id,也是 render 時打的名字 */
  id: string;
  title: string;
  subtitle: string;
  /** public/photos/ 跟 public/videos/ 底下的資料夾名 */
  dir: string;
  /** 配樂的 BPM,決定剪點。換歌就改這裡 */
  bpm: number;
  /** 一般鏡頭佔幾拍。不填用 config.ts 的 BEATS_PER_PHOTO。
   *  想讓整支片切慢一點就調大這個,不要去改 BPM —— BPM 是歌的,改了會脫拍 */
  beatsPerPhoto?: number;
  /** 有字幕的鏡頭佔幾拍。不填用 config.ts 的 BEATS_PER_CAPTIONED */
  beatsPerCaptioned?: number;
  /** 轉場長度(影格)。不填用 config.ts 的 TRANSITION_FRAMES。
   *  鏡頭放長了就要跟著加長,不然會變成「慢慢看 → 啪一聲換掉」 */
  transitionFrames?: number;
  shots: Shot[];
};
