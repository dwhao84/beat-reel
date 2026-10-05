# 剪接判斷

這份文件裡的每一條都是改出來的,不是設計出來的。先交了一版、看了成品覺得哪裡不對、
回頭找原因 —— 寫下來的是原因,不是結論。所以遇到不一樣的素材時,照原因判斷,
不要照數字照抄。

## 目錄

1. [版型:橫幅素材放進直幅畫面](#版型)
2. [節奏:拍子、鏡頭長度、片長](#節奏)
3. [轉場](#轉場)
4. [Ken Burns](#ken-burns)
5. [字幕](#字幕)
6. [用 emoji 遮臉](#遮臉)
7. [驗收用的拼圖腳本](#驗收)

---

## 版型

畫面是 1080×1920。素材分兩種處理:

**直幅照片 → `fit: "cover"`(預設)。** 滿版,邊緣裁一點點。3:4 的照片裁掉兩側約
四分之一,9:16 的幾乎不裁。

**橫幅照片 → `fit: "contain"`。** 這一條沒有例外。

為什麼:16:9 的照片用滿版塞進 9:16,只會留下中間**三分之一的寬度**。
魚尾獅在右、金沙在左的那張,滿版之後兩個都不見,只剩中間一片水。
`contain` 會把照片縮到滿版寬、置中,上下用同一張照片放大模糊當底。

`contain` 的三個細節,都是看了成品才發現要補的:

- **照片要抬高,不要垂直置中。** 橫幅照片在直幅畫面裡只佔三分之一高,置中的話
  字幕剛好壓在照片下緣上。抬高之後下半部空出來給字幕,整個看起來才像排版過的。
  (`KenBurnsShot.tsx` 的 `paddingBottom: 300`)
- **糊底要壓暗角。** 天空多的照片糊完是一整片均勻的灰,看起來像沒做完。
  加一圈 radial gradient 暗角就有層次了。
- **外框要裁切。** 跟著臉移動的 emoji 走出照片範圍時,沒裁的話會掉到糊底上
  變成一顆浮在半空的黃球。

**一串連續的 contain 鏡頭沒關係,但 cover / contain 交替跳會很頓。** 畫面的形狀
每一刀都在變。這件事在[轉場](#轉場)那節有對應的處理。

---

## 節奏

### 剪點怎麼算

剪點踩在音樂拍子上。174 BPM 配 30fps 時一拍 = 10.34 影格,**不是整數**。

正確做法是先累積拍數、換算成秒、最後才取整:

```
cuts[i] = round(累積拍數 × 60 / BPM × FPS)
```

逐張四捨五入再相加的話,誤差會一路累積,片尾整個脫拍。
累積後才取整,誤差永遠小於半格,而且不會長大。
(`config.ts` 的 `cutFrames()` 已經這樣做了,不要改成逐張算。)

### 鏡頭要多長

| | 拍數 @174 BPM | 秒 |
|---|---|---|
| 一般鏡頭 | 4 | 1.38 |
| 有字幕 | 7 | 2.41 |
| 影片 | 8 | 2.76 |

字幕的要長,因為一句中文讀完要時間。影片要比照片長 ——
太短的話觀眾還沒看出那是會動的就被切掉了。

**使用者說「切太快」的時候,不要把片子拉長,要減鏡頭。** 同樣的長度裡放比較少、
比較長的鏡頭。這次是 24 個鏡頭砍到 17 個,片長完全沒變,
但平均一個鏡頭從 1.7 秒變成 2.4 秒。先砍過場性質、沒有地標的鏡頭。

**不要為了調節奏去改 BPM。** BPM 是歌的,改了就脫拍。要改的是
`beatsPerPhoto` / `beatsPerCaptioned`,或單一鏡頭的 `beats`。

### 片長

30–45 秒是舒服的區間。超過一分鐘要有理由。
IG Reels 上限 90 秒,但長不等於好。

使用者每多給一批素材,片子就會長一截 —— 這是必然的,但要**主動回報**,
並且提議砍哪幾個最弱的鏡頭。不要自己默默砍,也不要默默放到兩分鐘。

---

## 轉場

### 兩條規則

```ts
const sameShape = (a.fit ?? "cover") === (b.fit ?? "cover");
if (!sameShape) return fade();          // 版型換了就一定用溶接
if (i % 4 === 3) return slide({ ... });  // 版型一樣才偶爾給一次輕推
return fade();
```

**為什麼版型換了一定要溶接:** 滿版跳到模糊底橫幅的時候,畫面的形狀本來就在變;
這時候再用推的,等於同時換形狀又換位置,一定頓。溶接會把形狀的變化糊掉。

**wipe 不要用。** 它有一條硬邊掃過畫面,是所有轉場裡最跳的一種。

### 長度要跟著鏡頭長度走

4 影格(0.13 秒)是配 0.69 秒鏡頭的。鏡頭放長到 1.4 秒之後還用 4 影格,
會變成「慢慢看 → 啪一聲換掉」。

鏡頭 1.4 秒以上就用 **10 影格(0.33 秒)**,並且加 easing ——
線性的溶接頭尾會「啪」一下才開始動,`Easing.inOut(Easing.ease)` 兩端才接得平順。

### 切點的那一下

每個鏡頭開頭有一下輕微放大(punch)。轉場拉長之後這一下大半會被溶解蓋掉,
所以幅度要調小(0.7%)、衰減拉長(12 影格),讓它變成「推一下」而不是「彈一下」。

**不要改成每拍都彈。** 174 BPM 等於每秒彈 2.9 次,那不是節奏感,是持續抖動。

---

## Ken Burns

**用速率,不要用固定幅度。** 每個鏡頭長度不一樣,用固定幅度的話短鏡頭的移動速度
會變成長鏡頭的兩倍,看起來一直在晃。用「每秒縮放幾 %」才會一致。

```ts
const span = Math.min(0.12, (durationInFrames / FPS) * ZOOM_PER_SECOND);
```

上限 12%,免得長鏡頭推到爆。

**影片不要加 Ken Burns。** 畫面本身就在動了,再推鏡頭會頭暈。
只留切點那一下的 punch。(`KenBurnsShot.tsx` 已經這樣判斷了。)

---

## 字幕

### 中英雙行

```ts
{ caption: "魚尾獅公園", captionEn: "Merlion Park" }
```

中文在上,英文在下 —— 小一號、全大寫、字距拉開,跟開頭標題的中英排法同一套,
整支片才會一致。

**只有真的是景點才給英文名。** 「出發」「再見,新加坡」這種不是地名,
加了會變成翻譯字幕而不是景點標示。本身就是英文的(`Apple Marina Bay Sands`)
也不用再加一行。

### 長度會差很多

景點名從 5 個字母(`Funan`)到 38 個字母
(`SONG FA BAK KUT TEH (THE SELETAR MALL)`)都有。字距固定的話長的會頂到畫面邊。

**收字距,不要縮字級** —— 38 個字母乘 9px,光字距就吃掉 342px,是寬度的大宗;
字級縮下去反而變得難讀。`Caption.tsx` 已經按長度自動收。

### 停留時間

字幕長的鏡頭要多給拍數。`SONG FA BAK KUT TEH (THE SELETAR MALL)` 那張給了 9 拍
(3.1 秒),用預設的 7 拍會還沒讀完就切掉。

字幕的退場要**跟著轉場走** —— 轉場開始前 2 格就退完,不然溶接的時候會有兩行字疊在一起。

### 地名要標示來源

你不在現場。地名從照片推測的就明講哪幾個是推測的,讓使用者一眼能訂正。
招牌上的字讀不出來就直接問 —— 這比猜錯好。

---

## 遮臉

```ts
faces: [
  { emoji: "😎", x: 0.69, y: 0.42, size: 0.37 },
  { emoji: "😷", x: 0.285, y: 0.618, size: 0.20 },
]
```

`x` / `y` / `size` 都是佔畫面的比例。emoji 跟畫面放在同一層,
所以 Ken Burns 推進去的時候會一起放大,不會推到一半跟臉錯開。

### 怎麼抓位置

把照片拉出來、疊一層格線讀座標,比猜快得多:

```python
im = ImageOps.exif_transpose(Image.open(p)).convert("RGB")
im = im.resize((540, int(540 * im.height / im.width)))
d = ImageDraw.Draw(im)
for i in range(1, 10):
    d.line([(im.width*i/10, 0), (im.width*i/10, im.height)], fill="#0f0")
    d.line([(0, im.height*i/10), (im.width, im.height*i/10)], fill="#ff0")
```

### 影片要用關鍵影格

臉會跑,所以要給幾個時間點的位置,中間自動內插。`at` 是從這個鏡頭開頭算起的秒數:

```ts
keyframes: [
  { at: 0.0, x: 0.56, y: 0.73 },
  { at: 0.8, x: 0.59, y: 0.86 },
  { at: 1.2, x: 0.57, y: 1.00 },
  { at: 1.5, x: 0.57, y: 1.20 },  // 已經在畫面外,被外框裁掉
]
```

**emoji 要給得比臉大。** 手持邊走邊拍左右晃 ±0.06,追得剛剛好的話每隔幾格
就會露出半張臉。臉本身佔 0.21 就給 0.34,直接蓋過晃動範圍 ——
比起追得很準但偶爾漏,寧可大一點。

**臉移出畫面之後,keyframe 繼續往外推就好**,不用另外關掉它,外框會裁掉。

### 糊底也要加重

`contain` 的背景是同一個畫面放大模糊的,所以臉在那裡也糊糊地在。
44px 雖然認不出是誰,但還看得出是一團膚色的頭。
有 emoji 的鏡頭自動加到 80px,只剩一片深色暈開。(`KenBurnsShot.tsx` 已經判斷了。)

### 影片的浮水印

穩定器 App(Insta360 之類)會壓浮水印。裁掉通常會連主體一起裁,
改用局部模糊覆蓋比較實際 —— 羽化遮罩貼一塊高斯模糊上去,
在平滑的背景上幾乎看不出來:

```python
box = (40, 168, 310, 232)
pad = 28
big = (box[0]-pad, box[1]-pad, box[2]+pad, box[3]+pad)
patch = im.crop(big).filter(ImageFilter.GaussianBlur(26))
mask = Image.new("L", (big[2]-big[0], big[3]-big[1]), 0)
ImageDraw.Draw(mask).rounded_rectangle(
    [pad-10, pad-10, mask.width-pad+10, mask.height-pad+10], radius=22, fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(14))
im.paste(patch, (big[0], big[1]), mask)
```

羽化那一步不能省,不然會出現一個很明顯的方框。

---

## 驗收

算完抽影格拼成一張網格讀進來。**不要用 ffmpeg 的 drawtext 標時間** ——
Homebrew 的精簡版 ffmpeg 沒有那個濾鏡。用 Pillow:

```python
import os
from PIL import Image, ImageDraw, ImageFont
D, out = "/tmp/frames", "/tmp/check.jpg"
files = sorted(os.listdir(D), key=lambda f: float(f[:-4]))
TW, TH, COLS = 230, 409, 6
rows = (len(files) + COLS - 1) // COLS
c = Image.new("RGB", (COLS*TW, rows*TH), "#111")
d = ImageDraw.Draw(c)
font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 24)
for k, f in enumerate(files):
    im = Image.open(os.path.join(D, f)).convert("RGB")
    im.thumbnail((TW-4, TH-4))
    c.paste(im, ((k%COLS)*TW + (TW-im.width)//2, (k//COLS)*TH + (TH-im.height)//2))
    lx, ly = (k%COLS)*TW+4, (k//COLS)*TH+2
    d.rectangle([lx, ly, lx+88, ly+30], fill="black")
    d.text((lx+5, ly+1), f[:-4]+"s", fill="yellow", font=font)
c.save(out, quality=90)
```

重點看三種畫面:

- **每一個有字幕的鏡頭** —— 字有沒有超出畫面、中英兩行有沒有打架
- **每一個遮臉的鏡頭** —— emoji 有沒有跟臉錯開、有沒有露出下巴
- **轉場的中點** —— 溶接有沒有糊成一團

單張不確定的時候用 `npx remotion still src/index.ts <Trip> out.png --frame=N`
直接算那一格,比算整支快很多。
