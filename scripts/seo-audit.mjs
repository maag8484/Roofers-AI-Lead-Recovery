import { readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { SITE_URL, SEARCH_GUIDES } from "../src/config/search.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const option = (name) => args.includes(name) ? args[args.indexOf(name) + 1] : null;
const origin = option("--origin");
const output = option("--output");
const cache = new Map();
const checks = [];
const problems = [];
const warnings = [];

async function resource(pathname) {
  if (cache.has(pathname)) return cache.get(pathname);
  const pending = (async () => {
    if (origin) {
      try {
        const response = await fetch(new URL(pathname, origin), { signal: AbortSignal.timeout(25000), headers: { "User-Agent": "RoofAI-SEO-Review/1.0" } });
        return { status: response.status, body: await response.text(), final_url: response.url, robots_header: response.headers.get("x-robots-tag") };
      } catch (error) { return { status: 0, body: "", error: error.message }; }
    }
    const filename = path.join(root, "dist", pathname.endsWith("/") ? `${pathname}index.html` : pathname);
    try { return { status: 200, body: await readFile(filename, "utf8") }; }
    catch { return { status: 404, body: "" }; }
  })();
  cache.set(pathname, pending);
  return pending;
}

const sitemap = await resource("/sitemap.xml");
if (sitemap.status !== 200) throw new Error(`Sitemap unavailable (${sitemap.status}); build the site first for a local audit`);
const urls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (!urls.length || new Set(urls).size !== urls.length) throw new Error("Empty or duplicate sitemap URLs");
if (urls.some((url) => new URL(url).origin !== SITE_URL)) throw new Error("Sitemap contains a noncanonical host");
const robots = await resource("/robots.txt");
if (robots.status !== 200 || !robots.body.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) problems.push("Missing robots.txt or sitemap directive");
const rules = robots.body.split(/\r?\n/).map((line) => line.match(/^Disallow:\s*(\S+)/i)?.[1]).filter(Boolean);

const documents = new Map();
let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < urls.length) {
    const url = urls[cursor++];
    const pathname = new URL(url).pathname;
    const response = await resource(pathname);
    const errors = [];
    const notices = [];
    if (response.status !== 200) errors.push(`HTTP ${response.status}${response.error ? `: ${response.error}` : ""}`);
    if (rules.some((rule) => rule === "/" || pathname.startsWith(rule))) errors.push("Blocked in robots.txt");
    if (response.final_url && new URL(response.final_url).pathname !== pathname) errors.push(`Unexpected redirect: ${response.final_url}`);
    if (/noindex/i.test(response.robots_header || "")) errors.push("Noindex response header");
    const dom = new JSDOM(response.body);
    const { document } = dom.window;
    const title = document.title.trim();
    const description = document.querySelector('meta[name="description"]')?.content?.trim();
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href");
    if (!title) errors.push("Missing title");
    if (!description) errors.push("Missing description");
    if (canonical !== url) errors.push(`Canonical mismatch: ${canonical || "missing"}`);
    if (/noindex/i.test(document.querySelector('meta[name="robots"]')?.content || "")) errors.push("Noindex meta tag");
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try { JSON.parse(script.textContent); } catch { errors.push("Invalid JSON-LD"); }
    }
    document.querySelectorAll("noscript").forEach((node) => node.remove());
    const h1s = document.querySelectorAll("h1");
    if (pathname === "/") {
      notices.push("Homepage uses client rendering; confirm Google's rendered content with Search Console URL Inspection.");
    } else {
      if (h1s.length !== 1) errors.push(`Expected one H1, found ${h1s.length}`);
      if (!document.querySelector("[data-site-header] nav")) errors.push("Navigation is missing from the HTML");
      if (!document.querySelector("[data-site-footer] footer")) errors.push("Footer is missing from the HTML");
      if (!document.getElementById("search-breadcrumbs")) errors.push("Breadcrumb data missing");
    }
    if (SEARCH_GUIDES.some((guide) => guide.href === pathname) && !document.querySelector('a[href="/#inquiry"]')) errors.push("Priority guide has no callback-form destination");
    const links = [...document.querySelectorAll("a[href]")].map((link) => link.getAttribute("href"));
    const ids = new Set([...document.querySelectorAll("[id]")].map((element) => element.id));
    checks.push({ url, status: response.status, title, description, canonical, server_navigation: Boolean(document.querySelector("[data-site-header] nav")), h1_count_without_noscript: h1s.length, errors, notices });
    documents.set(url, { links, ids });
    dom.window.close();
  }
}));

const titles = new Map();
for (const check of checks) {
  if (titles.has(check.title)) check.errors.push(`Duplicate title with ${titles.get(check.title)}`);
  titles.set(check.title, check.url);
  for (const error of check.errors) problems.push(`${check.url}: ${error}`);
  for (const notice of check.notices) warnings.push(`${check.url}: ${notice}`);
}

const appPaths = new Set(["/signup", "/login", "/privacy", "/terms"]);
for (const [source, { links }] of documents) {
  for (const href of links) {
    if (/^(mailto:|tel:|javascript:)/i.test(href)) continue;
    let target;
    try { target = new URL(href, source); } catch { problems.push(`${source}: Invalid link ${href}`); continue; }
    if (target.origin !== SITE_URL) continue;
    const targetUrl = `${target.origin}${target.pathname}`;
    const known = documents.get(targetUrl);
    if (known) {
      // App homepage IDs are rendered by React; the audit dialog is added by site.js.
      if (target.pathname !== "/" && target.hash && target.hash !== "#audit-request" && !known.ids.has(decodeURIComponent(target.hash.slice(1)))) problems.push(`${source}: Missing anchor ${target.href}`);
    } else if (!appPaths.has(target.pathname)) {
      if (origin) {
        const linked = await resource(target.pathname);
        if (linked.status !== 200) problems.push(`${source}: Broken internal link ${target.href} (${linked.status})`);
      } else {
        const filename = path.join(root, "dist", target.pathname.endsWith("/") ? `${target.pathname}index.html` : decodeURIComponent(target.pathname));
        try { await access(filename); } catch { problems.push(`${source}: Broken internal link ${target.href}`); }
      }
    }
  }
}

if (origin) {
  const missing = await resource("/__roof_ai_seo_missing_page_check__");
  if (missing.status !== 404) problems.push(`Unknown route must return 404, received ${missing.status}`);
  for (const pathname of ["/signup", "/home-v1"]) {
    const response = await resource(pathname);
    if (response.status !== 200 || !/noindex/i.test(response.robots_header || "")) problems.push(`${pathname}: Application/legacy route lacks the expected HTTP 200 and noindex header`);
  }
}

const report = {
  checked_at: new Date().toISOString(),
  target: origin || "local dist",
  sitemap_urls: urls.length,
  pages_with_html_navigation: checks.filter((check) => check.server_navigation).length,
  errors: [...new Set(problems)], warnings: [...new Set(warnings)],
  indexing_confirmed: null,
  private_search_metrics: { google_impressions: null, google_clicks: null, google_average_position: null, bing_impressions: null, bing_clicks: null },
  note: "Technical accessibility is not evidence of search-engine indexing or ranking. Private webmaster data is not part of this audit.",
  pages: checks.sort((a, b) => a.url.localeCompare(b.url)),
};
if (output) await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ checked_at: report.checked_at, target: report.target, sitemap_urls: report.sitemap_urls, pages_with_html_navigation: report.pages_with_html_navigation, errors: report.errors, warnings: report.warnings }, null, 2));
if (report.errors.length) process.exitCode = 1;
