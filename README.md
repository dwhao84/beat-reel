# beat-reel

把一資料夾手機照片剪成對拍的 9:16 直幅短片。

照片為主、剪點踩在音樂拍子上、中英雙語地點字幕。輸出直接發 IG Reels、
YouTube Shorts、TikTok。

---

## 它解決什麼

手機裡的旅遊資料夾典型長這樣:三百個檔、一半是連拍、再一堆是機票和訂房截圖、
檔名混著 `IMG_1234` 跟 `Flow_IMG_20260217_112821_01_040`,照檔名排會把同一天的
東西拆到頭尾。影片一支十分鐘,裡面只有三秒能用。

**挑片才是剪接,而挑片之前要先把素材整理到看得下去。** 這個 plugin 兩件事都做。

另外一半是版型與節奏的判斷 —— 橫幅照片塞進直幅畫面會只剩中間三分之一、
轉場長度要跟著鏡頭長度走、字幕退場要跟著轉場走。這些在程式碼裡看不出來,
所以都寫進 `references/craft.md`,**每一條都附上為什麼**,因為遇到不一樣的素材時
要照原因判斷,不是照數字照抄。

## 安裝

**Claude Code —— plugin:**

```
/plugin marketplace add <你的 GitHub 帳號>/beat-reel
/plugin install beat-reel
```

裝好之後,說「把這趟的照片剪成一支影片」或「剪影片 ~/Desktop/沖繩」就會觸發。

**當成一般模組用:** `skills/beat-reel/assets/template/` 是一個獨立的 Remotion 專案,
複製出來 `npm install` 就能單獨用,不需要 Claude。

## 需要什麼

| | 用途 |
|---|---|
| ffmpeg | 抽影格、轉封裝 |
| Python 3 + Pillow | 聯絡表、縮圖帶、驗收拼圖 |
| Node 18+ | Remotion |

```bash
brew install ffmpeg node
python3 -m venv .venv && .venv/bin/pip install Pillow
```

Homebrew 的精簡版 ffmpeg 沒有 `drawtext`,但這套不需要 —— 文字全部是
Pillow 或 Remotion 在畫的。

## 一支片怎麼走完

```
素材資料夾
   │
   ├─ triage.py ─────── 去重(感知雜湊併連拍,留最銳利那張)
   │                    編號聯絡表 + 影片縮圖帶
   │
   ├─ 挑片 ──────────── 讀圖決定留什麼、什麼順序
   │                    丟掉截圖、拍到地板的、同場景第三張以後
   │
   ├─ prep_clips.py ─── .mov → .mp4,長片先裁
   │
   ├─ 寫 config ─────── 一趟旅程一個 .ts 檔
   │                    bpm / 每個鏡頭幾拍 / 轉場多長 / 字幕 / 遮臉
   │
   ├─ remotion render ─ 1080×1920
   │
   └─ 驗收 ─────────── 抽影格拼成網格看過再交
```

## 這個 config 長什麼樣

```ts
export const tokyo: Trip = {
  id: "Tokyo",
  title: "東京", subtitle: "TOKYO",
  dir: "tokyo",
  bpm: 174,              // 配樂的 BPM,剪點踩這個
  beatsPerPhoto: 4,      // 1.38 秒
  beatsPerCaptioned: 7,  // 2.41 秒
  transitionFrames: 10,  // 0.33 秒的溶接
  shots: [
    { src: "hook.jpeg", caption: "" },
    { src: "wide.jpeg", caption: "淺草寺", captionEn: "Sensoji", fit: "contain" },
    { video: "street.mp4", from: 3, caption: "", beats: 8 },
    {
      src: "selfie.jpeg", caption: "出發",
      faces: [{ emoji: "😎", x: 0.69, y: 0.42, size: 0.37 }],
    },
  ],
};
```

一趟旅程一個檔,掛進 `TRIPS` 陣列就多一個 composition。**舊的旅程不會被動到** ——
這個結構的用意就是讓上一支片永遠還算得出來。

## 不適用的情況

**口播影片。** 這套沒有語音辨識、沒有逐字字幕、沒有靜音修剪、沒有人聲閃避。
素材是對著鏡頭講話的話,應該用別的工具。

**配樂。** 輸出是無聲的,音樂在發布的 App 裡疊。剪點已經對好拍子,
所以疊上去就會準 —— 前提是你疊的歌 BPM 跟 config 裡寫的一樣。

## 檔案

```
skills/beat-reel/
├── SKILL.md                      流程
├── scripts/
│   ├── triage.py                 去重 + 聯絡表 + 影片縮圖帶
│   └── prep_clips.py             .mov → .mp4,長片裁段
├── references/
│   ├── craft.md                  版型、節奏、轉場、字幕、遮臉的所有判斷
│   ├── troubleshooting.md        卡住的時候
│   └── examples/singapore.ts     一支完成品的 config
└── assets/template/              Remotion 專案範本(可單獨使用)
```

## License

MIT
