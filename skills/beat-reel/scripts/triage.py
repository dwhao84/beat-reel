#!/usr/bin/env python3
"""素材分流:把一資料夾手機照片/影片整理成「可以開始挑」的狀態。

做四件事,每一件都是手工做會很慢、而且做不準的:

  1. 去重 —— 同名的 " (1)" / " (2)" 複本,以及連拍。連拍用感知雜湊
     (dHash) 分組,每組只留最銳利的那張。手機一秒按三下很常見,
     不先併掉的話挑片會被同一個畫面洗版。
  2. 聯絡表 —— 把留下的照片排成有編號的網格圖。看圖比看檔名快十倍,
     編號則讓後續「要 017 跟 023」這種對話成立。
  3. 影片縮圖帶 —— 每支影片抽等距數格排成一條,一眼看出哪幾秒能用、
     哪幾段是拍到地板。長片抽多格。
  4. 清單 —— index.txt 把編號、檔名、拍攝時間對起來。

用法:
    python3 triage.py <素材資料夾> <輸出資料夾> [--video-only] [--photo-only]

輸出:
    <輸出>/index.txt          編號 → 檔名 → 拍攝時間
    <輸出>/dupes.txt          哪些被當成重複丟掉,以及留下哪張
    <輸出>/sheet1.jpg ...     照片聯絡表(每張 25 格)
    <輸出>/vstrip1.jpg ...    影片縮圖帶
    <輸出>/videos.txt         影片清單(長度、解析度、直幅還橫幅)

需要 Pillow 跟 ffmpeg。缺了會直接告訴你補哪一行。
"""
import argparse
import collections
import hashlib
import json
import os
import subprocess
import sys

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps, ImageStat
except ImportError:
    sys.exit(
        "缺 Pillow。在輸出資料夾旁邊開個 venv 就好:\n"
        "  python3 -m venv .venv && .venv/bin/pip install Pillow\n"
        "  .venv/bin/python triage.py ...")

PHOTO_EXT = {".jpg", ".jpeg", ".png", ".heic", ".webp"}
VIDEO_EXT = {".mov", ".mp4", ".m4v"}

# dHash 的漢明距離門檻。8 是在「連拍要併掉」跟「同一個景不同構圖要留下」
# 之間試出來的:調到 12 會把同一條街的兩個角度也併掉,調到 4 連拍併不乾淨。
HAMMING = 8

FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


def font(size):
    for p in FONT_CANDIDATES:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                pass
    return ImageFont.load_default()


def have(cmd):
    return subprocess.run(["which", cmd], capture_output=True).returncode == 0


def shot_time(path):
    """拍攝時間。macOS 用 mdls,其他平台退回檔案 mtime。
    檔名排序不可靠 —— 一個資料夾裡常混著 IMG_xxxx、Flow_IMG_日期、att.雜湊,
    照檔名排會把同一天的東西拆到頭尾。"""
    if sys.platform == "darwin":
        r = subprocess.run(
            ["mdls", "-name", "kMDItemContentCreationDate", "-raw", path],
            capture_output=True, text=True)
        v = r.stdout.strip()
        if v and v != "(null)":
            return v
    return str(os.path.getmtime(path))


def dhash(im, s=8):
    g = im.convert("L").resize((s + 1, s), Image.LANCZOS)
    px = g.tobytes()  # "L" 模式就是逐列的灰階位元組,比 getdata() 快而且沒有棄用警告
    bits = 0
    for y in range(s):
        for x in range(s):
            bits = (bits << 1) | (px[y * (s + 1) + x] > px[y * (s + 1) + x + 1])
    return bits


def sharpness(im):
    """邊緣強度的標準差。同一組連拍裡,手震那張這個值明顯低。"""
    g = im.convert("L").resize((400, 400))
    return ImageStat.Stat(g.filter(ImageFilter.FIND_EDGES)).stddev[0]


def ham(a, b):
    return bin(a ^ b).count("1")


def collect(src, exts):
    out = []
    for f in sorted(os.listdir(src)):
        if f.startswith("."):
            continue
        if os.path.splitext(f)[1].lower() in exts:
            out.append(f)
    return out


def dedupe(src, files, log):
    """回傳 (留下的檔名清單, 丟掉幾張)。"""
    info = []
    for f in files:
        p = os.path.join(src, f)
        try:
            im = ImageOps.exif_transpose(Image.open(p))
        except Exception as e:
            log.write(f"讀不開,跳過:{f}  ({e})\n")
            continue
        info.append({
            "f": f,
            "t": shot_time(p),
            "h": dhash(im),
            "s": sharpness(im),
            "md5": hashlib.md5(open(p, "rb").read()).hexdigest(),
            "px": im.width * im.height,
            "w": im.width,
            "hgt": im.height,
        })
    info.sort(key=lambda a: a["t"])

    used, keep = set(), []
    for i, a in enumerate(info):
        if i in used:
            continue
        group = [i]
        used.add(i)
        for j in range(i + 1, len(info)):
            if j in used:
                continue
            b = info[j]
            if a["md5"] == b["md5"] or ham(a["h"], b["h"]) <= HAMMING:
                group.append(j)
                used.add(j)
        best = max(group, key=lambda k: (info[k]["s"], info[k]["px"]))
        keep.append(info[best])
        if len(group) > 1:
            dropped = ", ".join(info[k]["f"] for k in group if k != best)
            log.write(f"留 {info[best]['f']}   併掉 {dropped}\n")
    return keep, len(info) - len(keep)


def contact_sheets(src, keep, out_dir, cols=5, rows=5, tw=300, th=400):
    per = cols * rows
    f_num = font(44)
    paths = []
    for n in range((len(keep) + per - 1) // per):
        chunk = keep[n * per:(n + 1) * per]
        canvas = Image.new("RGB", (cols * tw, rows * th), "#111")
        d = ImageDraw.Draw(canvas)
        for k, rec in enumerate(chunk):
            idx = n * per + k + 1
            im = ImageOps.exif_transpose(Image.open(os.path.join(src, rec["f"]))).convert("RGB")
            im.thumbnail((tw - 6, th - 6))
            canvas.paste(im, ((k % cols) * tw + (tw - im.width) // 2,
                              (k // cols) * th + (th - im.height) // 2))
            lx, ly = (k % cols) * tw + 6, (k // cols) * th + 4
            d.rectangle([lx, ly, lx + 78, ly + 52], fill="black")
            d.text((lx + 8, ly + 2), f"{idx:03d}", fill="yellow", font=f_num)
        p = os.path.join(out_dir, f"sheet{n + 1}.jpg")
        canvas.save(p, quality=86)
        paths.append(p)
    return paths


def probe(path):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,codec_name:format=duration",
         "-of", "json", path],
        capture_output=True, text=True)
    try:
        d = json.loads(r.stdout)
        s = d["streams"][0]
        return int(s["width"]), int(s["height"]), s["codec_name"], float(d["format"]["duration"])
    except Exception:
        return None


def video_strips(src, files, out_dir, cols_px=130, row_h=231):
    """每支影片一列,等距抽格。長片抽 10 格,短片 6 格。"""
    tmp = os.path.join(out_dir, "_frames")
    os.makedirs(tmp, exist_ok=True)
    rows, meta = [], []
    for f in files:
        spec = probe(os.path.join(src, f))
        if not spec:
            continue
        w, h, codec, dur = spec
        meta.append((f, w, h, codec, dur))
        n = 10 if dur > 40 else 6
        shots = []
        for k in range(1, n + 1):
            t = round(dur * k / (n + 1), 2)
            p = os.path.join(tmp, f"{len(rows)}_{k}.jpg")
            subprocess.run(
                ["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-ss", str(t),
                 "-i", os.path.join(src, f), "-frames:v", "1",
                 "-vf", "scale=200:-1", p],
                capture_output=True)
            if os.path.exists(p):
                shots.append((t, p))
        if shots:
            rows.append((f, shots))

    f_lbl, f_t = font(26), font(22)
    label_w, per_page = 330, 6
    paths = []
    for page in range((len(rows) + per_page - 1) // per_page):
        chunk = rows[page * per_page:(page + 1) * per_page]
        maxn = max(len(r[1]) for r in chunk)
        canvas = Image.new("RGB", (label_w + maxn * cols_px, len(chunk) * row_h), "#111")
        d = ImageDraw.Draw(canvas)
        for r, (name, shots) in enumerate(chunk):
            d.text((8, r * row_h + 8), name[:34], fill="#ff0", font=f_lbl)
            for k, (t, p) in enumerate(shots):
                im = Image.open(p)
                im.thumbnail((cols_px - 4, row_h - 30))
                x, y = label_w + k * cols_px, r * row_h + 26
                canvas.paste(im, (x, y))
                d.text((x + 4, y - 24), f"{t:g}s", fill="#0ff", font=f_t)
        p = os.path.join(out_dir, f"vstrip{page + 1}.jpg")
        canvas.save(p, quality=85)
        paths.append(p)

    with open(os.path.join(out_dir, "videos.txt"), "w") as fh:
        for f, w, h, codec, dur in meta:
            ori = "直幅" if h > w else "橫幅"
            fh.write(f"{f}|{w}x{h}|{ori}|{codec}|{dur:.1f}s\n")
    for f in os.listdir(tmp):
        os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)
    return paths


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--photo-only", action="store_true")
    ap.add_argument("--video-only", action="store_true")
    a = ap.parse_args()

    if not have("ffmpeg") or not have("ffprobe"):
        sys.exit("缺 ffmpeg。macOS:brew install ffmpeg")
    os.makedirs(a.out, exist_ok=True)

    photos = collect(a.src, PHOTO_EXT)
    videos = collect(a.src, VIDEO_EXT)
    print(f"原始:照片 {len(photos)}、影片 {len(videos)}")

    if not a.video_only and photos:
        with open(os.path.join(a.out, "dupes.txt"), "w") as log:
            keep, dropped = dedupe(a.src, photos, log)
        with open(os.path.join(a.out, "index.txt"), "w") as fh:
            for i, rec in enumerate(keep, 1):
                fh.write(f"{i:03d}  {rec['f']}  {rec['w']}x{rec['hgt']}  {rec['t']}\n")
        sheets = contact_sheets(a.src, keep, a.out)
        print(f"照片去重:{len(photos)} → {len(keep)}(併掉 {dropped})")
        print(f"聯絡表:{len(sheets)} 張 → {a.out}/sheet*.jpg")
        print(f"清單:{a.out}/index.txt、去重紀錄:{a.out}/dupes.txt")

    if not a.photo_only and videos:
        # 影片也有 " (2)" 複本,照檔名先濾一輪就夠,不值得逐格比對
        seen, uniq = set(), []
        for f in videos:
            base = f.replace(" (1)", "").replace(" (2)", "").replace(" (3)", "")
            if base not in seen:
                seen.add(base)
                uniq.append(f)
        strips = video_strips(a.src, uniq, a.out)
        print(f"影片:{len(videos)} → {len(uniq)} 支不重複")
        print(f"縮圖帶:{len(strips)} 張 → {a.out}/vstrip*.jpg、清單:{a.out}/videos.txt")

    print("\n下一步:把 sheet*.jpg 跟 vstrip*.jpg 讀進來看,然後挑。")


if __name__ == "__main__":
    main()
