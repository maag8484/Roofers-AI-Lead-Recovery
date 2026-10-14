import { readFile } from "node:fs/promises";
import { SITE_URL } from "../src/config/search.js";

// This ownership key is deliberately published on the site, not an account secret.
const config = JSON.parse(await readFile(new URL("../docs/marketing/indexnow.json", import.meta.url), "utf8"));
const sitemapResponse = await fetch(`${SITE_URL}/sitemap.xml`, { signal: AbortSignal.timeout(20000) });
if (!sitemapResponse.ok) throw new Error(`Live sitemap returned ${sitemapResponse.status}`);
const sitemap = await sitemapResponse.text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (!urls.length || urls.some((url) => new URL(url).origin !== SITE_URL)) throw new Error("Invalid live sitemap scope");
const keyLocation = `${SITE_URL}/${config.key}.txt`;
const keyResponse = await fetch(keyLocation, { signal: AbortSignal.timeout(20000) });
if (!keyResponse.ok || (await keyResponse.text()).trim() !== config.key) throw new Error("Live IndexNow ownership file is not verified; nothing submitted");
const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE_URL).host, key: config.key, keyLocation, urlList: urls }),
  signal: AbortSignal.timeout(30000),
});
console.log(JSON.stringify({ checked_at: new Date().toISOString(), endpoint: "api.indexnow.org", status: response.status, urls_submitted: urls.length,
  result: response.status === 200 ? "received" : response.status === 202 ? "received_key_validation_pending" : "failed",
  indexing_confirmed: false, note: "Submission receipt does not establish crawling, indexing or rankings. Google is not an IndexNow destination." }, null, 2));
if (![200, 202].includes(response.status)) process.exitCode = 1;
