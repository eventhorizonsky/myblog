/**
 * 拉取小黑盒表情列表 → emojis.json
 * 用法: npx tsx fetch-emojis.ts
 */
import { createSignedParams, getBaseApiParams } from "./heibox-signing";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUTPUT = path.resolve(__dirname, "../frontend/public/content/emojis.json");

interface EmojiItem { code: string; img: string; type: number; }
interface EmojiGroup { group_code: string; emojis: EmojiItem[]; }

async function main() {
  const base = getBaseApiParams();
  const signed = createSignedParams("/bbs/app/api/emojis/list");
  const url = `https://api.xiaoheihe.cn/bbs/app/api/emojis/list?${new URLSearchParams({ ...base, hkey: signed.hkey, _time: String(signed._time), nonce: signed.nonce })}`;

  console.log("📥 拉取表情列表...");
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 ...", Accept: "application/json", Referer: "https://www.xiaoheihe.cn/" } });
  const data = await res.json();

  if (data.status !== "ok") { console.error("❌", data.msg); process.exit(1); }

  // 构建 [group_code] → { img, code } 的映射
  const emojiMap: Record<string, { img: string; code: string }> = {};
  for (const group of data.result.emoji_groups as EmojiGroup[]) {
    for (const e of group.emojis) {
      const key = `[${group.group_code}_${e.code}]`;
      emojiMap[key] = { img: e.img, code: e.code };
    }
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(emojiMap, null, 2));
  console.log(`✅ 保存 ${Object.keys(emojiMap).length} 个表情 → ${OUTPUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
