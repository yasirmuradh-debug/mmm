/**
 * Restores the exact 3D avatar portrait from the original Jabsz Studio site
 * (https://jabsz-studio.lovable.app/) into public/images/avatar.png.
 *
 * The original site bundles the portrait as a hashed asset
 * (portrait-clean-*.png) and also exposes it as the page's og:image.
 * This script finds it and downloads it. It is safe to run repeatedly and
 * exits quietly (code 0) when the network is unavailable, so it can run
 * as a postinstall hook in sandboxed CI environments.
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "public", "images", "avatar.png");
const SITE = "https://jabsz-studio.lovable.app";
const UA = { "User-Agent": "Mozilla/5.0 (compatible; JabszStudioBuild/1.0)" };

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (process.env.SKIP_AVATAR_FETCH) return;
  if (await exists(dest)) {
    console.log("[fetch-avatar] public/images/avatar.png already present — skipping.");
    return;
  }

  console.log("[fetch-avatar] looking for the original avatar on", SITE, "…");
  const html = await (await fetch(SITE + "/", { headers: UA })).text();

  // 1) og:image meta tag, 2) any hashed portrait asset reference
  const candidates = [
    html.match(/property="og:image"\s+content="([^"]+)"/)?.[1],
    html.match(/content="([^"]+)"\s+property="og:image"/)?.[1],
    html.match(/(\/assets\/portrait[^"'\s)]+\.png)/)?.[1],
  ].filter(Boolean);

  // Also scan referenced JS bundles for the hashed asset path
  if (candidates.length === 0) {
    const scripts = [...html.matchAll(/src="(\/[^"]+\.js)"/g)].map((m) => m[1]).slice(0, 8);
    for (const s of scripts) {
      try {
        const js = await (await fetch(SITE + s, { headers: UA })).text();
        const m = js.match(/(\/assets\/portrait[^"'\s)]+\.png)/);
        if (m) {
          candidates.push(m[1]);
          break;
        }
      } catch {
        /* keep scanning */
      }
    }
  }

  if (candidates.length === 0) throw new Error("could not locate the portrait asset on the live site");

  let url = candidates[0];
  if (url.startsWith("/")) url = SITE + url;

  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10_000) throw new Error("downloaded file is suspiciously small — aborting");

  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  console.log(`[fetch-avatar] saved ${buf.length.toLocaleString()} bytes → public/images/avatar.png`);
}

main().catch((err) => {
  console.warn(`[fetch-avatar] skipped: ${err.message}`);
  console.warn(
    "[fetch-avatar] Run `npm run fetch-avatar` on a machine with normal internet access,\n" +
      "or manually save the portrait from the original site as public/images/avatar.png."
  );
  process.exit(0);
});
