<p align="right"><a href="README.en.md">English</a> · <b>繁體中文</b></p>

# beat-reel

把一資料夾手機照片剪成對拍的 9:16 直幅短片。

照片為主、剪點踩在音樂拍子上、中英雙語地點字幕。輸出 1080×1920 的 mp4,
直接發 IG Reels、YouTube Shorts、TikTok。

一個 Claude Code plugin。裝好之後說「把這趟的照片剪成一支影片」就會動,
你不用記任何指令。裡面的 Remotion 專案也可以單獨拿出來當一般 npm 專案用。

---

## 目錄

- [它解決什麼問題](#它解決什麼問題)
- [最關鍵的一張圖](#最關鍵的一張圖)
- [畫面上有哪些東西](#畫面上有哪些東西)
- [安裝](#安裝)
- [第一支片怎麼跑](#第一支片怎麼跑)
- [剪點怎麼踩拍子](#剪點怎麼踩拍子)
- [config 寫法](#config-寫法)
- [剪接判斷都在 craft.md](#剪接判斷都在-craftmd)
- [它不做什麼](#它不做什麼)
- [需要什麼](#需要什麼)
- [檔案在哪](#檔案在哪)

---

## 它解決什麼問題

手機裡的旅遊資料夾長這樣 —— 下面是一趟五天新加坡行的**真實數字**:

```
原始素材                        照片 210 張、影片 118 支
  ├─ 同名的 (1) (2) 複本         85 個
  ├─ 連拍(同一面牆按十一下)     再去掉 42 張
  ├─ 螢幕截圖:機票、eSIM、
  │  訂房確認、地圖、對話紀錄    10 張
  └─ 拍到地板跟自己衣服的影片     55 支裡有一半
                                 ↓
最後進到片子裡的                 24 張照片 + 6 段影片
```

**挑片才是剪接。** 但挑片之前得先把素材整理到「看得下去」的狀態,
而那件事手工做會很慢、而且做不準:

- **檔名排不出順序** —— 一個資料夾裡常混著 `IMG_1234`、`Flow_IMG_20260217_112821_01_040`、
  `att.0MZAqq6esmne0_9zD20v.jpeg`。照檔名排會把同一天的東西拆到頭尾。
- **連拍肉眼併不完** —— 兩百張裡要找出哪十一張是同一面牆、哪一張最銳利,很花時間。
- **影片看不出哪裡能用** —— 一支十分鐘的片可能只有三秒值得放,但你得把它看完才知道。

`triage.py` 把這三件事做掉。實測跑完整個新加坡資料夾(328 個檔)**49 秒**,
輸出編號聯絡表和影片縮圖帶,剩下的就是看圖決定。

另一半問題是**版型跟節奏的判斷**,那些在程式碼裡看不出來,所以全部寫進
[`craft.md`](skills/beat-reel/references/craft.md),而且每一條都附上為什麼。

## 最關鍵的一張圖

直幅畫面最大的坑:橫幅照片放進去會變什麼樣。

<img src="docs/fit-comparison.png" width="620">

同一張 1920×1080 的照片、同一個 1080×1920 的畫面。
左邊滿版,**只剩中間三分之一的寬度** —— 字被裁掉一半,
真實照片裡就是「魚尾獅在右、金沙在左,兩個都不見」。
右邊把整張照片留下來,上下用同一張照片放大模糊當底。

所以規則很簡單:**直幅照片用 `cover`(預設),橫幅照片一律 `contain`。**

`contain` 還有三個細節,都是看了成品才發現要補的:照片要**抬高**不要垂直置中
(不然字幕會壓在照片下緣)、糊底要**壓暗角**(不然是一片均勻的灰)、
外框要**裁切**(不然遮臉的 emoji 走出去會變成浮在半空的黃球)。
理由寫在 craft.md。

## 畫面上有哪些東西

每一個元件都對應 config 裡的一個欄位。看懂這張就知道要改哪裡:

<img src="docs/frame-anatomy.png" width="860">

**A 是開場。** 大標題疊在第一個鏡頭上,幾秒後淡出 —— 它不是獨立的一張卡,
所以第一個鏡頭要挑直幅滿版的,字壓在滿版照片上比壓在模糊底上好看太多。
`title` / `subtitle` 寫在 trip 層,整趟共用。

**B 是橫幅照片的版型。** 由下往上看:底部漸層讓字在亮畫面上也讀得到、
`captionEn` 在 `caption` 下面一行(小一號、字距拉開)、照片band 抬高 300px
所以下半部空出來給字幕、糊底是同一張照片放大 1.25 倍再模糊、
再壓一層暗角免得糊底看起來像一片灰牆。

直幅照片不會有 band 跟糊底,整張鋪滿,其餘元件位置一樣。

## 安裝

### 當 Claude Code plugin(推薦)

```
/plugin marketplace add dwhao84/beat-reel
/plugin install beat-reel
```

裝好之後任何目錄下說這類話都會觸發:

```
把這趟的照片剪成一支影片
剪影片 ~/Desktop/沖繩
這個資料夾的照片做成 reel
```

### 用 Codex / Gemini / 其他 agent

`.claude-plugin/` 跟 SKILL.md 的自動觸發是 Claude Code 專屬的,
但**內容本身沒有綁任何工具** —— 腳本是純 Python,範本是一般 npm 專案,
判斷寫在 markdown 裡。

根目錄的 [`AGENTS.md`](AGENTS.md) 就是給非 Claude 的 agent 的完整作業合約
(Codex 會自動讀這個檔名,Gemini CLI 讀 [`GEMINI.md`](GEMINI.md),內容指向同一份)。

```bash
git clone https://github.com/dwhao84/beat-reel
cd beat-reel
```

然後跟你的 agent 說:

```
讀 AGENTS.md，照裡面的流程把 ~/Desktop/沖繩 剪成一支 reel
```

差別只在**它不會自己發現這個 repo** —— 指一次路就好,後面的流程完全一樣。

### 當一般 npm 專案

`skills/beat-reel/assets/template/` 是一個獨立的 Remotion 專案,不需要 Claude:

```bash
git clone https://github.com/dwhao84/beat-reel
cp -R beat-reel/skills/beat-reel/assets/template my-reel
cd my-reel && npm install
npm run studio          # 開箱就有一支 6 秒的範例片
```

## 第一支片怎麼跑

### 1 — 分流

```bash
python3 skills/beat-reel/scripts/triage.py ~/Desktop/沖繩 ~/Desktop/沖繩-work
```

```
原始:照片 210、影片 118
照片去重:210 → 83(併掉 127)
聯絡表:4 張 → ~/Desktop/沖繩-work/sheet*.jpg
影片:118 → 55 支不重複
縮圖帶:10 張 → ~/Desktop/沖繩-work/vstrip*.jpg
```

產出四種東西:

| 檔案 | 是什麼 |
|---|---|
| `sheet*.jpg` | 編號聯絡表,一張 25 格。看圖比看檔名快十倍,編號讓「我要 017 跟 023」這種對話成立 |
| `vstrip*.jpg` | 影片縮圖帶,每支片等距抽格排成一條,一眼看出哪幾秒能用 |
| `index.txt` | 編號 → 檔名 → 拍攝時間 |
| `dupes.txt` | 哪些被當成重複併掉、留下哪一張。不同意的話可以撈回來 |

去重用**感知雜湊(dHash)**:把圖縮成 9×8 的灰階、比較相鄰像素的明暗、
得到一個 64 bit 指紋,指紋差 8 bit 以內就當成同一組,每組留**邊緣最銳利**那張
(手震的那張這個值明顯低)。門檻 8 是試出來的 —— 調到 12 會把同一條街的兩個角度
也併掉,調到 4 連拍併不乾淨。

### 2 — 挑片

讀 `sheet*.jpg` 和 `vstrip*.jpg`,決定留什麼、什麼順序。這一步是整個流程的重心。

**一定要丟掉的:** 螢幕截圖(機票、訂房、地圖 —— 那是文件不是風景)、
拍到地板或鏡頭歪 90 度的、同一個場景第三張以後的。

**排序:** 照旅程時間軸走,開頭插一兩張最強的當鉤子。
鉤子要用**直幅滿版**的畫面 —— 大標題壓在滿版照片上,比壓在模糊底上好看太多。

### 3 — 搬檔

照片直接複製到 `public/photos/<trip>/`。影片要處理:

```bash
# 整支轉封裝(.mov → .mp4,編碼不動所以沒有畫質損失)
python3 scripts/prep_clips.py public/videos/okinawa a.mov b.mov

# 只要原片 155 秒開始的 12 秒
python3 scripts/prep_clips.py public/videos/okinawa long.mov --from 155 --dur 12 --name landing
```

為什麼要轉:算圖時是 ffmpeg 在抽格,`.mov` 沒問題;但 Studio 預覽是**瀏覽器在播**,
`.mov` 容器不一定吃得下。

為什麼長片要先裁:一支十分鐘的原片只為了用中間三秒,整支搬進 `public/`
會讓 bundle 肥到幾十 MB、Studio 每次重載都在等。

### 4 — 寫 config

一趟旅程一個檔 `src/trips/okinawa.ts`,掛進 `src/trips/index.ts` 的 `TRIPS` 陣列。
Root.tsx 會自動幫每一趟註冊一個 composition,**舊的旅程不會被動到** ——
這個結構的用意就是讓上一支片永遠還算得出來。

### 5 — 算圖

```bash
npx remotion compositions src/index.ts                       # 先看長度合不合理
npx remotion render src/index.ts Okinawa out/okinawa.mp4     # 算
```

一分鐘的片大約兩到四分鐘(Remotion 跑無頭瀏覽器逐格畫)。

### 6 — 驗收

**算完一定要抽影格回來看過再交。** 字幕會超出畫面、emoji 會跟臉錯開、
轉場會糊成一團 —— 這些在程式碼裡都看不出來,只有看圖才會發現。

```bash
for t in 1 5 10 15 20 25 30; do
  ffmpeg -nostdin -loglevel error -y -ss $t -i out/okinawa.mp4 -frames:v 1 /tmp/f$t.jpg
done
```

單格不確定用 `npx remotion still src/index.ts Okinawa out.png --frame=N`,
比算整支快很多。

## 剪點怎麼踩拍子

<img src="docs/beat-timeline.png" width="860">

每個鏡頭佔幾拍由 `beatsPerPhoto`(一般)、`beatsPerCaptioned`(有字幕)
或單一鏡頭的 `beats` 決定,剪點就落在那些拍子上。

**關鍵在最下面那行:影格要累積後才取整。** 174 BPM 配 30fps 時一拍 = 10.34 影格,
不是整數。逐張四捨五入再相加的話誤差會一路累積,片尾整個脫拍;
先累積拍數再換算成影格,誤差永遠小於半格而且不會長大。

轉場跨在剪點上(前後各吃一半),所以鏡頭放長的時候轉場也要跟著加長 ——
4 影格是配 0.69 秒鏡頭的,鏡頭變成 1.4 秒還用 4 影格會變成「慢慢看 → 啪一聲換掉」。

**要調節奏改拍數,不要改 `bpm`。** BPM 是歌的,改了就脫拍。

## config 寫法

```ts
import type { Trip } from "../types";

export const okinawa: Trip = {
  id: "Okinawa",            // composition id,算圖時打這個
  title: "沖繩",
  subtitle: "OKINAWA",
  dir: "okinawa",           // public/photos/<dir>/ 與 public/videos/<dir>/
  bpm: 174,                 // 配樂的 BPM。剪點踩這個
  beatsPerPhoto: 4,         // 一般鏡頭幾拍 → 1.38 秒
  beatsPerCaptioned: 7,     // 有字幕的幾拍 → 2.41 秒
  transitionFrames: 10,     // 轉場長度 → 0.33 秒
  shots: [
    // 直幅照片,滿版。開場用這種,標題壓上去好看
    { src: "hook.jpeg", caption: "" },

    // 橫幅照片,完整顯示 + 模糊底,中英雙語字幕
    {
      src: "wide.jpeg",
      caption: "首里城",
      captionEn: "Shuri Castle",
      fit: "contain",
    },

    // 影片:從第 3 秒開始播,這個鏡頭佔 8 拍
    { video: "street.mp4", from: 3, caption: "", beats: 8 },

    // 用 emoji 蓋臉。x/y/size 都是佔畫面的比例
    {
      src: "selfie.jpeg",
      caption: "出發",
      faces: [{ emoji: "😎", x: 0.69, y: 0.42, size: 0.37 }],
    },
  ],
};
```

### Trip 欄位

| 欄位 | 必填 | 說明 |
|---|---|---|
| `id` | ✓ | composition id,算圖時打的名字。大小寫有差 |
| `title` / `subtitle` | ✓ | 開頭大標題的中文 / 英文 |
| `dir` | ✓ | `public/photos/<dir>/` 跟 `public/videos/<dir>/` 的資料夾名 |
| `bpm` | ✓ | 配樂的 BPM。**不要為了調節奏改這個**,改了會脫拍 |
| `beatsPerPhoto` | | 一般鏡頭幾拍,預設 2 |
| `beatsPerCaptioned` | | 有字幕的幾拍,預設 4 |
| `transitionFrames` | | 轉場長度,預設 4。鏡頭放長就要跟著加長 |
| `shots` | ✓ | 鏡頭陣列,順序就是播放順序 |

### Shot 欄位

| 欄位 | 說明 |
|---|---|
| `src` | 照片檔名。跟 `video` 二選一 |
| `video` | 影片檔名。跟 `src` 二選一 |
| `from` | 影片從第幾秒開始播,預設 0 |
| `caption` | 中文字幕,空字串就不顯示 |
| `captionEn` | 景點英文名,顯示在中文下一行。**只有真的是景點才給** |
| `fit` | `"cover"`(預設,滿版)或 `"contain"`(完整顯示 + 模糊底) |
| `beats` | 這個鏡頭佔幾拍。會蓋過旅程的設定 |
| `zoom` | `"in"` 或 `"out"`,不填就自動交替 |
| `faces` | emoji 遮臉,見下 |

### 遮臉

```ts
faces: [
  { emoji: "😎", x: 0.69, y: 0.42, size: 0.37 },
]
```

emoji 跟畫面放在同一層,所以 Ken Burns 推進去的時候會一起放大,不會錯開。

影片裡臉會移動,用關鍵影格給幾個時間點的位置,中間自動內插
(`at` = 從這個鏡頭開頭算起的秒數):

```ts
faces: [{
  emoji: "😎", x: 0.56, y: 0.73, size: 0.34,
  keyframes: [
    { at: 0.0, x: 0.56, y: 0.73 },
    { at: 0.8, x: 0.59, y: 0.86 },
    { at: 1.2, x: 0.57, y: 1.00 },
    { at: 1.5, x: 0.57, y: 1.20 },   // 已經在畫面外,外框會裁掉
  ],
}]
```

**emoji 要給得比臉大。** 手持邊走邊拍左右晃 ±0.06,追得剛剛好的話每隔幾格
就會露出半張臉。臉本身佔 0.21 就給 0.34。

## 剪接判斷都在 craft.md

[`references/craft.md`](skills/beat-reel/references/craft.md) 是這個 repo 真正的核心。
裡面每一條都是**改出來的,不是設計出來的** —— 先交了一版、看了成品覺得哪裡不對、
回頭找原因。寫下來的是原因,所以遇到不一樣的素材時可以照原因判斷,不是照數字照抄。

摘幾條:

**剪點要累積後才取整。** 174 BPM 配 30fps 時一拍 = 10.34 影格,不是整數。
逐張四捨五入再相加的話誤差會累積,片尾整個脫拍;
先累積拍數再換算成影格,誤差永遠小於半格而且不會長大。

**「切太快」要減鏡頭,不是拉長片子。** 同樣的長度裡放比較少、比較長的鏡頭。
新加坡那支是 24 個鏡頭砍到 17 個,片長完全沒變,
但平均一個鏡頭從 1.7 秒變成 2.4 秒。

**版型換了一定要用溶接。** 滿版跳到模糊底橫幅的時候,畫面形狀本來就在變;
這時候再用推的等於同時換形狀又換位置,一定頓。溶接會把形狀的變化糊掉。

**轉場長度要跟著鏡頭長度走。** 4 影格是配 0.69 秒鏡頭的;鏡頭放長到 1.4 秒之後
還用 4 影格,會變成「慢慢看 → 啪一聲換掉」。

**Ken Burns 用速率不用固定幅度。** 每個鏡頭長度不一樣,固定幅度的話短鏡頭的
移動速度會是長鏡頭的兩倍,看起來一直在晃。

**影片不要加 Ken Burns。** 畫面本身就在動了,再推鏡頭會頭暈。

卡住的時候看 [`troubleshooting.md`](skills/beat-reel/references/troubleshooting.md)。

## 它不做什麼

**口播影片。** 沒有語音辨識、沒有逐字字幕、沒有靜音修剪、沒有人聲閃避。
素材是對著鏡頭講話的話,這套幫不上忙,該用別的工具。

**配樂。** 輸出是無聲的,音樂在發布的 App 裡疊。剪點已經對好拍子,
所以疊上去就會準 —— 前提是你疊的歌 BPM 跟 config 裡寫的一樣。

**自動挑片。** 這是刻意的。哪個畫面「精彩」不在像素裡,
而機器挑出來的片單通常不如你自己看三分鐘聯絡表。
工具負責把兩百張變成八十張,最後那三十張是人的事。

## 需要什麼

| | 用途 | 安裝 |
|---|---|---|
| ffmpeg | 抽影格、轉封裝 | `brew install ffmpeg` |
| Python 3 + Pillow | 聯絡表、縮圖帶、驗收拼圖 | `python3 -m venv .venv && .venv/bin/pip install Pillow` |
| Node 18+ | Remotion | `brew install node` |

Homebrew 的精簡版 ffmpeg 沒有 `drawtext` 也沒有 libass,**但這套不需要** ——
文字全部是 Pillow 或 Remotion 在畫的,不經過 ffmpeg 的文字濾鏡。

## 檔案在哪

```
beat-reel/
├── AGENTS.md                        給非 Claude 的 agent 的作業合約
├── GEMINI.md                        指向 AGENTS.md
├── .claude-plugin/
│   ├── plugin.json                  plugin 設定
│   └── marketplace.json             marketplace 設定
├── docs/
│   ├── fit-comparison.png           cover vs contain
│   ├── frame-anatomy.png            畫面元件對照 config 欄位
│   └── beat-timeline.png            剪點怎麼踩拍子
└── skills/beat-reel/
    ├── SKILL.md                     流程(Claude 讀這個)
    ├── scripts/
    │   ├── triage.py                去重 + 聯絡表 + 影片縮圖帶
    │   └── prep_clips.py            .mov → .mp4、長片裁段
    ├── references/
    │   ├── craft.md                 版型、節奏、轉場、字幕、遮臉的所有判斷
    │   ├── troubleshooting.md       卡住的時候
    │   └── examples/singapore.ts    一支完成品的 config
    └── assets/template/             Remotion 專案範本(可單獨使用)
        ├── src/
        │   ├── config.ts            共用的節奏與樣式參數
        │   ├── types.ts             Trip / Shot / Face 的完整定義
        │   ├── PhotoReel.tsx        組裝 + 轉場選擇
        │   ├── components/          Ken Burns、字幕、標題、進度條
        │   └── trips/               一趟旅程一個檔
        └── public/photos/example/   開箱範例的佔位圖
```

## License

MIT
