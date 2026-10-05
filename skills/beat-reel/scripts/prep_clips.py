#!/usr/bin/env python3
"""把選好的影片片段備到 public/videos/<trip>/。

兩件事:

  1. .mov → .mp4。Remotion 算圖時是 ffmpeg 在抽格,.mov 沒問題;
     但 Studio 預覽是瀏覽器在播,.mov 容器不一定吃得下。
     編碼不動(-c copy),所以沒有畫質損失也很快。
  2. 長片先裁。一支 10 分鐘的原片只為了用中間 3 秒,整支搬進 public/
     會讓 bundle 肥到幾十 MB、Studio 每次重載都在等。
     指定 --from/--dur 就重新編碼切出那一段。

用法:
    # 整支轉封裝
    python3 prep_clips.py <輸出目錄> a.mov b.mov

    # 只要原片 155 秒開始的 12 秒
    python3 prep_clips.py <輸出目錄> long.mov --from 155 --dur 12 --name landing

裁過的檔名會帶上秒數,之後想換畫面才找得回原片的哪個時間點。
"""
import argparse
import os
import subprocess
import sys


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"ffmpeg failed / ffmpeg 失敗:\n{' '.join(cmd)}\n{r.stderr[-800:]}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out_dir")
    ap.add_argument("clips", nargs="+")
    ap.add_argument("--from", dest="start", type=float,
                    help="從第幾秒開始切(只在單一片段時有意義)")
    ap.add_argument("--dur", type=float, help="切幾秒")
    ap.add_argument("--name", help="輸出檔名(不含副檔名)")
    a = ap.parse_args()

    os.makedirs(a.out_dir, exist_ok=True)
    trimming = a.start is not None or a.dur is not None
    if trimming and len(a.clips) > 1:
        sys.exit("--from/--dur takes one clip at a time / 一次只能處理一支片段")

    for src in a.clips:
        stem = a.name or os.path.splitext(os.path.basename(src))[0]
        if trimming:
            stem = a.name or f"{stem}@{int(a.start or 0)}s"
            dst = os.path.join(a.out_dir, stem + ".mp4")
            cmd = ["ffmpeg", "-nostdin", "-loglevel", "error", "-y"]
            if a.start is not None:
                cmd += ["-ss", str(a.start)]
            cmd += ["-i", src]
            if a.dur is not None:
                cmd += ["-t", str(a.dur)]
            # 要從任意秒開始必須重編,-c copy 只會對齊到關鍵影格
            cmd += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                    "-an", "-movflags", "+faststart", dst]
        else:
            dst = os.path.join(a.out_dir, stem + ".mp4")
            cmd = ["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-i", src,
                   "-c", "copy", "-movflags", "+faststart", dst]
        run(cmd)
        mb = os.path.getsize(dst) / 1e6
        print(f"{os.path.basename(dst)}  {mb:.1f} MB")

    print(f"\nstaged / 放好了 → {a.out_dir}")
    print('reference it as  { video: "<name>.mp4", from: <seconds>, ... }  in the trip config')


if __name__ == "__main__":
    main()
