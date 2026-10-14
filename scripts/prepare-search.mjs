import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { JSDOM } from "jsdom";
import { SITE_URL, HOME_TITLE, HOME_DESCRIPTION, SEARCH_GUIDES, homeStructuredData } from "../src/config/search.js";
import { FAQS } from "../src/pages/home-v2/content.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export function prepareHomepage(html) {
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(HOME_TITLE)}</title>`);
  for (const [attribute, name, content] of [
    ["name", "description", HOME_DESCRIPTION],
    ["property", "og:title", HOME_TITLE],
    ["property", "og:description", HOME_DESCRIPTION],
    ["name", "twitter:title", HOME_TITLE],
    ["name", "twitter:description", HOME_DESCRIPTION],
  ]) {
    const tag = new RegExp(`<meta\\s+[^>]*${attribute}="${name}"[^>]*>`, "g");
    html = html.replace(tag, `<meta ${attribute}="${name}" content="${escapeHtml(content)}" />`);
  }
  html = html.replace(/\s*<meta name="keywords"[\s\S]*?\/>/, "");
  html = html.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/,
    `<script id="roof-ai-structured-data" type="application/ld+json">\n${JSON.stringify(homeStructuredData(FAQS), null, 2)}\n  </script>`);
  const fallback = `<noscript>
    <main style="max-width:960px;margin:40px auto;padding:0 20px;font-family:Inter,system-ui,sans-serif;line-height:1.7">
      <h1>Recover More Roofing Opportunities From Missed Calls</h1>
      <p>Roof AI Lead Recovery helps roofing companies respond to missed and after-hours callers, collect roofing details and create an approved callback or booking next step. Your team keeps answering first and keeps its existing business number.</p>
      <h2>How missed-call recovery works</h2>
      <ol><li>Agree which unanswered or after-hours inquiries the workflow may handle.</li><li>Collect the roofing need, service area and urgency using your approved rules.</li><li>Route the request to a person or a verified scheduling workflow and track the outcome.</li></ol>
      <p>Channels, routing and integrations are verified during setup. An appointment request is not a confirmed booking or a paid job.</p>
      <h2>Pricing</h2><p>$299 per month with a 7-day free trial. Review the exact trial end and first charge date in checkout. No long-term contracts or setup fees.</p>
      <p><a href="/signup">Start your free trial</a> or <a href="mailto:cory@roofaileadrecovery.com?subject=Roof%20AI%20callback%20request">request a callback by email</a>. Enable JavaScript to use the on-page callback form.</p>
      <h2>Roofing call recovery guides</h2>
      <ul>${SEARCH_GUIDES.map(({ title, href, description }) => `<li><a href="${href}">${escapeHtml(title)}</a>: ${escapeHtml(description)}</li>`).join("\n")}</ul>
      <p><a href="/how-much-are-missed-calls-costing-your-roofing-company/">Use the missed-call revenue calculator</a> · <a href="/resources/">Browse all roofing resources</a></p>
    </main>
  </noscript>`;
  return html.replace(/<noscript>[\s\S]*?<\/noscript>/, fallback);
}

export function navigationTemplates(source) {
  const get = (name) => {
    const match = source.match(new RegExp(`const ${name} = \u0060([\\s\\S]*?)\u0060;`));
    if (!match) throw new Error(`Missing ${name} navigation template`);
    const html = match[1].replaceAll("${homeUrl}", "/roofing-revenue-recovery/");
    if (html.includes("${")) throw new Error(`Unresolved ${name} navigation expression`);
    return html;
  };
  return { header: get("header"), footer: get("footer") };
}

export function prepareResourceHtml(html, url, templates) {
  const dom = new JSDOM(html);
  const { document } = dom.window;
  for (const name of ["header", "footer"]) {
    const mount = document.querySelector(`[data-site-${name}]`);
    if (mount && !mount.children.length) mount.innerHTML = templates[name];
  }
  if (!document.querySelector('meta[name="robots"]')) {
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "index, follow, max-image-preview:large";
    document.head.appendChild(robots);
  }
  if (!document.querySelector('meta[property="og:image"]')) {
    for (const [property, content] of [
      ["og:image", `${SITE_URL}/media/roof_ai_lead_recovery_logo_transparent.png`],
      ["og:image:alt", "Roof AI Lead Recovery"],
    ]) {
      const meta = document.createElement("meta");
      meta.setAttribute("property", property);
      meta.content = content;
      document.head.appendChild(meta);
    }
  }
  if (!document.getElementById("search-breadcrumbs")) {
    const entries = [{ name: "Home", item: `${SITE_URL}/` }];
    for (const anchor of document.querySelectorAll(".breadcrumbs a")) {
      const item = new URL(anchor.getAttribute("href"), SITE_URL).href;
      if (item !== url && !entries.some((entry) => entry.item === item)) entries.push({ name: anchor.textContent.trim(), item });
    }
    entries.push({ name: document.querySelector("h1")?.textContent.trim() || document.title, item: url });
    const script = document.createElement("script");
    script.id = "search-breadcrumbs";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: entries.map((entry, i) => ({ "@type": "ListItem", position: i + 1, ...entry })),
    });
    document.head.appendChild(script);
  }
  const result = dom.serialize();
  dom.window.close();
  return result;
}

async function main() {
  if (process.argv.includes("--template")) {
    const filename = path.join(root, "index.html");
    await writeFile(filename, prepareHomepage(await readFile(filename, "utf8")));
    console.log("Updated homepage SEO template and no-JavaScript fallback.");
    return;
  }
  const directory = path.join(root, "dist");
  const filename = path.join(directory, "index.html");
  await writeFile(filename, prepareHomepage(await readFile(filename, "utf8")));
  const templates = navigationTemplates(await readFile(path.join(root, "public/revenue-recovery-assets/site.js"), "utf8"));
  const sitemap = await readFile(path.join(directory, "sitemap.xml"), "utf8");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  let count = 0;
  for (const url of urls) {
    const pathname = new URL(url).pathname;
    if (pathname === "/") continue;
    const page = path.join(directory, pathname, "index.html");
    await writeFile(page, prepareResourceHtml(await readFile(page, "utf8"), url, templates));
    count++;
  }
  console.log(`Prepared ${count} resource pages with HTML navigation and breadcrumbs; homepage metadata synchronized.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
