---
name: beat-reel
description: 把一資料夾手機照片和影片剪成對拍的 9:16 直幅短片(Remotion + React),輸出可以直接發 IG Reels / YouTube Shorts / TikTok。涵蓋去重挑片、照片式 Ken Burns、剪點踩拍子、橫幅素材在直幅畫面的版型、中英雙語地點字幕、emoji 遮臉。使用時機:使用者說「剪影片」「做 reel」「把旅遊照片做成影片」「這趟的照片剪一支」「shorts」「直幅影片」,或丟出一個裝著出遊/活動照片的資料夾要你處理 —— 即使他們沒講到 Remotion 或任何工具名稱也要用這個 skill。素材以照片為主、或影片沒有人講話的情況特別適合;有口播、要逐字字幕的影片不適用。
---

# beat-reel —— 照片式對拍短片

一資料夾手機素材 → 一支 9:16 直幅短片,剪點踩在音樂拍子上。

## 這個 skill 的立場

**使用者拍,你挑。** 他們交出一個資料夾;決定哪些畫面值得放、照什麼順序、整支多長,
**這件事本身就是剪接**。不要把聯絡表丟回去叫他們選 —— 那是你的工作。

但有兩種情況一定要問:

- **畫面上的字你讀不出來**(招牌、店名、展覽名)。他們在現場,你不在。
- **地名你只是從畫面推測的**。寫錯地名比沒寫更糟。先寫上去、再明講哪幾個是推測的,
  讓他們一眼就能訂正。

## 適用與不適用

適用:旅遊、活動、美食、日常的**照片為主**素材,或影片裡沒有人對著鏡頭講話。

不適用:口播影片。這套沒有語音辨識、沒有逐字字幕、沒有靜音修剪、沒有人聲閃避。
真的要做口播,應該用別的工具。

## 做一支片的全程

```
1. 分流   triage.py            去重、聯絡表、影片縮圖帶
2. 挑片   你讀圖,決定留什麼、什麼順序
3. 搬檔   選中的照片/影片進 public/
4. 寫 config   一趟旅程一個 .ts 檔
5. 算圖   npx remotion render
6. 驗收   抽影格回來看 ← 不要跳過
```

### 1. 分流

```bash
python3 <skill>/scripts/triage.py <素材資料夾> <工作目錄>
```

跑完會有:編號聯絡表 `sheet*.jpg`、影片縮圖帶 `vstrip*.jpg`、
清單 `index.txt`、去重紀錄 `dupes.txt`。

**為什麼不自己 ls 一下就好:** 手機資料夾典型是三百個檔、一半是連拍、
再一堆是機票和訂房截圖。檔名也排不出時間順序(常混著 `IMG_1234`、
`Flow_IMG_日期`、`att.雜湊`)。這支腳本用拍攝時間排序、用感知雜湊把連拍併成一組
只留最銳利那張,通常會砍掉一半以上。

需要 Pillow。缺的話:`python3 -m venv .venv && .venv/bin/pip install Pillow`。

### 2. 挑片

把 `sheet*.jpg` 和 `vstrip*.jpg` 讀進來看。這一步是整個流程的重心,
值得花時間 —— 後面所有參數調整加起來的影響,都比不上挑對片。

**一定要丟掉的:**
- 螢幕截圖:機票、eSIM、訂房確認、地圖、對話紀錄。這些在相簿裡是文件,不是風景。
- 拍到地板、自己的衣服、鏡頭歪 90 度的 —— 穿戴式相機的素材有一半是這種。
- 同一個場景第三張以後的。去重會併掉幾乎一樣的,但「同一面牆換個姿勢」機器併不掉,
  那是你的判斷。

**影片特別注意:** 一支 10 分鐘的影片裡可能只有 3 秒能用。看縮圖帶找那 3 秒,
不要整支拿來。片長不代表價值。

**排序:** 照旅程的時間軸走,開頭插 1–2 張最強的當鉤子。
鉤子要用**直幅滿版**的畫面 —— 大標題壓在滿版照片上,比壓在模糊底上好看太多。

### 3. 搬檔

照片直接複製到 `public/photos/<trip>/`。影片用:

```bash
python3 <skill>/scripts/prep_clips.py public/videos/<trip> a.mov b.mov
python3 <skill>/scripts/prep_clips.py public/videos/<trip> long.mov --from 155 --dur 12 --name landing
```

`.mov` 要轉成 `.mp4`(Studio 預覽是瀏覽器在播,.mov 不一定吃得下),
長片一定要先裁(整支搬進 public/ 會讓每次重載都在等)。

### 4. 寫 config

專案範本在 `<skill>/assets/template/`。還沒有專案就整個複製出來,然後 `npm install`。

一趟旅程一個檔 `src/trips/<name>.ts`,掛進 `src/trips/index.ts` 的 `TRIPS` 陣列,
Root.tsx 會自動幫每一趟註冊一個 composition。**舊的旅程不要動** ——
這個結構的用意就是讓上一支片永遠還算得出來。

```ts
export const tokyo: Trip = {
  id: "Tokyo",                  // composition id,算圖時打這個
  title: "東京", subtitle: "TOKYO",
  dir: "tokyo",                 // public/photos/<dir>/ 與 public/videos/<dir>/
  bpm: 174,                     // 配樂的 BPM。剪點踩這個
  beatsPerPhoto: 4,             // 一般鏡頭幾拍
  beatsPerCaptioned: 7,         // 有字幕的幾拍
  transitionFrames: 10,         // 轉場長度
  shots: [
    { src: "IMG_1652.jpeg", caption: "" },
    { src: "wide.jpeg", caption: "魚尾獅公園", captionEn: "Merlion Park", fit: "contain" },
    { video: "river.mp4", from: 3, caption: "", beats: 8 },
  ],
};
```

一個 shot 填 `src`(照片)或 `video`(影片)二選一。
完整欄位看 `assets/template/src/types.ts`,實際完成品看 `references/examples/singapore.ts`。

**怎麼決定這些數字 —— 讀 `references/craft.md`。** 版型、節奏、轉場、字幕、遮臉
的判斷都在那裡,每一條都附上為什麼。那些不是風格偏好,是踩過坑之後的修正。

### 5. 算圖

```bash
npx remotion compositions src/index.ts          # 先確認長度合不合理
npx remotion render src/index.ts Tokyo out/tokyo.mp4 --log=error
```

一分鐘的片大約要算兩到四分鐘(Remotion 是跑無頭瀏覽器逐格畫)。

### 6. 驗收 —— 不要跳過

**算完一定要把影格抽回來看過再交。** 這不是客套話:字幕會超出畫面、
emoji 會跟臉錯開、橫幅照片會變成一條細帶、轉場會糊成一團 ——
這些在程式碼裡都看不出來,只有看圖才會發現。

```bash
for t in 1 5 10 15 20 25 30; do
  ffmpeg -nostdin -loglevel error -y -ss $t -i out/tokyo.mp4 -frames:v 1 /tmp/f$t.jpg
done
```

抽完排成一張網格圖讀進來(用 Pillow 拼,見 `references/craft.md` 最後一節)。
重點看:每一個有字幕的鏡頭、每一個遮臉的鏡頭、每一個轉場的中點。

交付的時候一併講清楚:片長、幾個鏡頭、哪些地名是你推測的、哪些素材品質比較差。

## 環境

- **ffmpeg** 必要。但 Homebrew 的精簡版 `ffmpeg` 沒有 `drawtext` 也沒有 libass,
  所以**不要用 ffmpeg 畫文字**,聯絡表和驗收網格都用 Pillow 畫。
- **Pillow** 腳本需要。
- **Node 18+** Remotion 需要。

卡住的話看 `references/troubleshooting.md`。

## 參考檔

| 檔案 | 什麼時候讀 |
|---|---|
| `references/craft.md` | **寫 config 之前讀**。版型、節奏、轉場、字幕、遮臉的所有判斷 |
| `references/troubleshooting.md` | 算圖失敗、畫面不對勁 |
| `references/examples/singapore.ts` | 想看一支完成品的 config 長什麼樣 |
| `assets/template/src/types.ts` | 查 shot / trip 有哪些欄位 |
