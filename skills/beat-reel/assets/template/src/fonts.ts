import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";

// 中文用 macOS 內建字型(不必下載,算圖快,也不會因為沒網路就失敗)。
// Google 的中文字型被切成上百個編號子集,全部載入會超時,所以只拿它的拉丁字型來配。
const cormorant = loadCormorant("normal", { weights: ["300", "400"], subsets: ["latin"] });
const montserrat = loadMontserrat("normal", { weights: ["300", "400"], subsets: ["latin"] });

/** 中文字族後面都接 fallback,萬一系統沒這支字也不會變成豆腐字 */
const cjk = (family: string) => `"${family}", "PingFang TC", sans-serif`;

export type FontPreset = "serif" | "weibei" | "yuan";

type TextStyle = {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  letterSpacing: number;
};

export type FontTheme = {
  label: string;
  title: TextStyle;
  subtitle: TextStyle;
  caption: TextStyle;
};

export const FONT_THEMES: Record<FontPreset, FontTheme> = {
  // 宋體-繁 + Cormorant Garamond — 旅遊雜誌 / 電影感
  serif: {
    label: "典雅明體",
    title: { fontFamily: cjk("Songti TC"), fontWeight: 700, fontSize: 126, letterSpacing: 16 },
    subtitle: {
      fontFamily: cormorant.fontFamily,
      fontWeight: 300,
      fontSize: 40,
      letterSpacing: 22,
    },
    caption: { fontFamily: cjk("Songti TC"), fontWeight: 700, fontSize: 60, letterSpacing: 6 },
  },

  // 魏碑 + Montserrat — 書法筆觸,最有個性
  weibei: {
    label: "魏碑書法",
    title: { fontFamily: cjk("Weibei TC"), fontWeight: 700, fontSize: 138, letterSpacing: 10 },
    subtitle: {
      fontFamily: montserrat.fontFamily,
      fontWeight: 300,
      fontSize: 34,
      letterSpacing: 24,
    },
    caption: { fontFamily: cjk("Weibei TC"), fontWeight: 700, fontSize: 64, letterSpacing: 4 },
  },

  // 圓體 + Montserrat — 柔和親切,vlog 感
  yuan: {
    label: "現代圓體",
    title: { fontFamily: cjk("Yuanti TC"), fontWeight: 700, fontSize: 130, letterSpacing: 8 },
    subtitle: {
      fontFamily: montserrat.fontFamily,
      fontWeight: 400,
      fontSize: 34,
      letterSpacing: 20,
    },
    caption: { fontFamily: cjk("Yuanti TC"), fontWeight: 700, fontSize: 58, letterSpacing: 3 },
  },
};
