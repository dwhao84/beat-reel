import type { Trip } from "../types";
import { example } from "./example";

// 一趟旅程一個檔案。新增一趟:在 src/trips/ 加檔案,然後掛進這個陣列,
// Root.tsx 會自動幫每一趟註冊一個 composition。
//
//   import { tokyo } from "./tokyo";
//   export const TRIPS: Trip[] = [tokyo, example];
//
// 寫好自己的之後可以把 example 拿掉(連同 example.ts 跟 public/photos/example/)。
export const TRIPS: Trip[] = [example];

export const tripById = (id: string): Trip => {
  const t = TRIPS.find((x) => x.id === id);
  if (!t) throw new Error(`沒有這趟旅程:${id}`);
  return t;
};
