import type { Trip } from "../types";

// 2026/02/17–02/21。順序 = 播放順序:
// 鉤子 → 出發 → Apple Store → 新加坡河・魚尾獅 → 市區 → 牛車水・小印度 → 回程。
//
// 照片在 public/photos/singapore/,影片在 public/videos/singapore/。
//
// ── 節奏 ──────────────────────────────────────────────
// 鏡頭數從 24 砍到 17,省下來的時間分給留下來的鏡頭:
// 一般 1.38 秒、有字幕 2.41 秒、影片 2.76 秒,平均一個鏡頭 2.4 秒。
// 「不要切太快」不是把片子拉長,是同樣長度裡放比較少的鏡頭 —— 片長還是 41 秒。
// 轉場也從 4 影格拉到 10 影格(0.33 秒),鏡頭長了轉場就得跟著長,
// 不然會變成「慢慢看 → 啪一聲換掉」。
//
// ── 版型 ──────────────────────────────────────────────
// 橫幅素材(16:9 / 4:3)一律 fit: "contain":1080×1920 直幅滿版會把兩側裁掉
// 三分之二,魚尾獅跟廟整個會不見。直幅的才用預設的滿版。
//
// ── 字幕 ──────────────────────────────────────────────
// caption = 中文,captionEn = 景點英文名,顯示在下面一行(小一號、字距拉開,
// 跟開頭標題的中英排法同一套)。只有真的是景點才給 captionEn,
// 「出發」「再見,新加坡」這種不是地名的留空。
//
// 地名是我看照片推測的,請自行訂正。
export const singapore: Trip = {
  id: "Singapore",
  title: "新加坡",
  subtitle: "SINGAPORE",
  dir: "singapore",
  // 跟濟州島那支同一個節奏。換歌記得改成新歌的 BPM
  bpm: 174,
  beatsPerPhoto: 4, //  1.38 秒
  beatsPerCaptioned: 7, //  2.41 秒
  transitionFrames: 10, // 0.33 秒的溶接
  shots: [
    // ── 開場鉤子(大標題蓋在上面)。
    //    第一張用直幅滿版的,標題壓在滿版畫面上比壓在模糊底上好看
    { src: "IMG_1652.jpeg", caption: "" },
    { src: "Flow_IMG_20260219_104858_01_220.jpeg", caption: "", fit: "contain" },

    // ── 出發(2/17 桃園)。臉用 emoji 蓋掉,想換表情改 emoji 就好
    {
      src: "Flow_IMG_20260217_113030_01_050.jpeg",
      caption: "出發",
      faces: [
        { emoji: "😎", x: 0.69, y: 0.42, size: 0.37 }, // 右邊前景那位
        { emoji: "😷", x: 0.285, y: 0.618, size: 0.20 }, // 左後方比 YA 那位
      ],
    },
    { src: "IMG_1329.jpeg", caption: "", fit: "contain" },
    { src: "add_changi_arrival.jpeg", caption: "", fit: "contain" }, // 樟宜入境大廳

    // ── 2/18 Apple Marina Bay Sands
    {
      src: "Flow_IMG_20260218_115818_01_205.jpeg",
      caption: "Apple Marina Bay Sands",
      fit: "contain",
    },
    // 圓頂內部。原圖左上角有 Insta360 浮水印,已經塗掉
    { src: "add_apple_mbs_dome.jpeg", caption: "" },

    // ── 2/19 新加坡河 / 魚尾獅 / 濱海灣
    { video: "Flow_VID_20260219_104358_02_215.mp4", from: 3, caption: "", beats: 8 },
    { src: "add_cbd_skyline.jpeg", caption: "", fit: "contain" }, // 對岸 CBD 天際線
    {
      src: "Flow_IMG_20260219_104912_01_222.jpeg",
      caption: "魚尾獅公園",
      captionEn: "Merlion Park",
      fit: "contain",
    },
    {
      video: "Flow_VID_20260219_105216_02_238.mp4",
      from: 3,
      caption: "",
      fit: "contain",
      beats: 8,
      // 這段前 1.3 秒有張臉在畫面中間,往右下移出去。
      // 手持走路左右晃 ±0.06,追不乾淨,所以 size 給 0.34(臉本身只有 0.21)
      // 直接蓋過晃動範圍。at = 從這個鏡頭開頭算起的秒數。
      faces: [
        {
          emoji: "😎",
          x: 0.56,
          y: 0.73,
          size: 0.34,
          keyframes: [
            { at: 0.0, x: 0.56, y: 0.73 },
            { at: 0.4, x: 0.57, y: 0.76 },
            { at: 0.6, x: 0.57, y: 0.8 },
            { at: 0.8, x: 0.59, y: 0.86 },
            { at: 1.0, x: 0.57, y: 0.93 },
            { at: 1.2, x: 0.57, y: 1.0 },
            { at: 1.5, x: 0.57, y: 1.2 }, // 已經在畫面外,被外框裁掉
          ],
        },
      ],
    },
    { src: "add_marinabay_promenade.jpeg", caption: "", fit: "contain" }, // 濱海灣步道
    { src: "add_gallery_entrance.jpeg", caption: "" }, // 美術館外的特展海報柱

    // ── 市區 / 新加坡國家美術館
    {
      video: "Flow_VID_20260219_120251_02_250.mp4",
      from: 6,
      caption: "新加坡國家美術館",
      captionEn: "National Gallery Singapore",
      // 這裡的 beats 是寫死的,所以加了字幕也不會跟著變成 beatsPerCaptioned。
      // 8 拍 = 2.76 秒,比有字幕的預設 7 拍還長,讀得完
      beats: 8,
    },
    { src: "add_gallery_exhibit.jpeg", caption: "", fit: "contain" }, // Into the Modern 展題牆
    { src: "add_gallery_painting.jpeg", caption: "", fit: "contain" }, // 展品
    { src: "IMG_1628.jpeg", caption: "Funan 商場", captionEn: "Funan", fit: "contain" },
    // 原圖只有 480×360,放到 1080 寬是兩倍多的放大,會比別張糊
    { src: "add_bike_parking.jpeg", caption: "", fit: "contain" },

    // ── 美食
    {
      src: "IMG_1631.jpeg",
      caption: "松發肉骨茶 (利達廣場店)",
      captionEn: "Song Fa Bak Kut Teh (The Seletar Mall)",
      // 這行字比別張長一截,給 9 拍(3.1 秒)讀,不然字還沒看完就切掉了
      beats: 9,
    },
    { src: "add_meal_shabu.jpeg", caption: "" }, // 另一餐

    // ── 牛車水 / 佛牙寺
    {
      src: "IMG_1645.jpeg",
      caption: "佛牙寺龍華院",
      captionEn: "Buddha Tooth Relic Temple",
      fit: "contain",
    },
    {
      video: "Flow_VID_20260220_153854_02_254.mp4",
      from: 5,
      caption: "牛車水",
      captionEn: "Chinatown",
      fit: "contain",
      beats: 8,
    },

    // ── 小印度
    { src: "IMG_1657.jpeg", caption: "小印度", captionEn: "Little India", fit: "contain" },

    // ── 2/21 樟宜的花園
    // 這段原本是一個影片鏡頭,改成三張照片。
    // 注意:這裡真正拍的照片只有 Flow_IMG_...283 那一張(跟 284 差兩秒,幾乎一樣,
    // 所以只收一張),其餘三張是從當天的影片抓的靜格 —— 檔名的 @秒數 就是抓的位置,
    // 想換畫面回原片找那個時間點重抓就好。
    // 進到片子裡它們就是會做 Ken Burns 的照片,不是會動的影片。
    {
      src: "garden_286@53s.jpeg",
      caption: "樟宜的花園",
      captionEn: "Changi Airport",
      fit: "contain",
    }, // 玻璃拱頂,先交代這是哪
    { src: "add_butterfly_walk.jpeg", caption: "", fit: "contain" }, // 園區木棧道
    { src: "garden_286@20s.jpeg", caption: "", fit: "contain" }, // 蝴蝶花雕
    { src: "Flow_IMG_20260221_091210_01_283.jpeg", caption: "", fit: "contain" }, // 真照片,特寫收尾
    { src: "add_airport_stairs.jpeg", caption: "", fit: "contain" }, // 航廈樓梯
    { video: "Flow_VID_20260221_101551_02_304.mp4", from: 2, caption: "", beats: 8 },
    // 這段是從 IMG_1717.mov 的 155 秒剪出來的降落畫面
    { video: "IMG_1717_landing.mp4", from: 4, caption: "再見,新加坡", beats: 8 },
  ],
};
