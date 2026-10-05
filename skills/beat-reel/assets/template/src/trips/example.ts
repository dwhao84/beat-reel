import type { Trip } from "../types";

/**
 * 開箱範例 —— 讓你 `npm run studio` 立刻看得到東西,
 * 順便示範 cover 跟 contain 在直幅畫面裡差多少。
 *
 * 寫好自己的旅程之後,把這個檔案和 public/photos/example/ 刪掉,
 * 再從 trips/index.ts 的 TRIPS 拿掉就好。
 */
export const example: Trip = {
  id: "Example",
  title: "範例",
  subtitle: "EXAMPLE",
  dir: "example",
  bpm: 174,
  beatsPerPhoto: 4,
  beatsPerCaptioned: 7,
  transitionFrames: 10,
  shots: [
    // 直幅照片:滿版,大標題壓在上面最好看,所以開場都用這種
    { src: "01-portrait.jpeg", caption: "" },
    // 橫幅照片:一律 contain。滿版會只剩中間三分之一的寬度
    { src: "02-wide.jpeg", caption: "橫幅用 contain", captionEn: "Contained", fit: "contain" },
    // 4:3 比 16:9 高一截,同樣是 contain,版面寬鬆很多
    { src: "03-wide.jpeg", caption: "", fit: "contain" },
  ],
};
