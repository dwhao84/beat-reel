# 卡住的時候

## ffmpeg 沒有 drawtext / subtitles / ass 濾鏡

```
[AVFilterGraph] No such filter: 'drawtext'
```

Homebrew 的 `ffmpeg` 是精簡版,沒有 libfreetype 也沒有 libass。先確認:

```bash
ffmpeg -filters | grep -E "drawtext|subtitles|ass "
```

**這個 skill 不需要修它** —— 聯絡表和驗收網格都是 Pillow 畫的,
字幕是 Remotion 在瀏覽器裡排版的,都不經過 ffmpeg 的文字濾鏡。
只有在你想用 ffmpeg 直接燒字時才會撞到,那時候才裝 `brew install ffmpeg-full`。

## 缺 Pillow

```bash
python3 -m venv .venv && .venv/bin/pip install Pillow
.venv/bin/python <skill>/scripts/triage.py ...
```

不要用 `pip install --break-system-packages` 去動系統 Python。

## Studio 裡影片是黑的 / 不會動

`.mov` 容器瀏覽器不一定吃得下(算圖沒問題,因為算圖是 ffmpeg 在抽格)。
用 `prep_clips.py` 轉成 `.mp4`,編碼不動所以沒有畫質損失。

## Studio 每次重載都很久

`public/` 裡有大檔。十分鐘的原片就算只用 3 秒,整支放進去也會被打包。
用 `prep_clips.py --from --dur` 先裁出需要的那一段。

## 算圖很慢

Remotion 跑無頭瀏覽器逐格畫,一分鐘的片大約兩到四分鐘,這是正常的。

要快的話:
- 單格驗證用 `npx remotion still ... --frame=N`,不要算整支
- `npx remotion compositions src/index.ts` 只確認長度,不用算

## 改了 config 但長度沒變

鏡頭的 `beats` 是寫死的話,`beatsPerPhoto` / `beatsPerCaptioned` 不會生效。
優先序是:單一鏡頭的 `beats` > 該趟旅程的設定 > `config.ts` 的全域預設。

加了字幕但長度沒變,通常就是這個原因 —— 那個鏡頭有自己的 `beats`。

## 「沒有這趟旅程:X」

`src/trips/index.ts` 的 `TRIPS` 陣列沒掛上去,或 `id` 拼錯。
composition id 大小寫有差。

## 字幕超出畫面

中文那行太長的話只能縮短文字。英文那行會自動收字距,但也有極限 ——
超過 40 個字母就該考慮拿掉括號裡的分店名。

先用 `npx remotion still` 算那一格看,不要算完整支才發現。

## 橫幅照片變成很細的一條

那是 16:9 塞進 9:16 的必然結果(只佔三分之一高)。確認有設 `fit: "contain"`,
然後接受它 —— 改成滿版會裁掉三分之二的寬度,通常更糟。

4:3 的照片會比 16:9 高不少,所以手機直拍的橫幅照片看起來會好很多。

## emoji 跟臉錯開

照片:`x`/`y` 抓錯了,疊格線重新量(見 `craft.md` 的遮臉那節)。

影片:keyframe 不夠密,或 `size` 給太小。手持晃動追不乾淨是常態,
**先把 size 加大**再考慮加 keyframe,通常加大就解決了。

## 舊的旅程算不出來了

改共用的東西(`config.ts`、`components/`)會影響每一趟。
改完至少算一格舊的確認沒壞:

```bash
npx remotion still src/index.ts <舊的Trip> /tmp/check.png --frame=300
```
