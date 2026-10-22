import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { JSDOM } from "jsdom";
import { createServer } from "vite";
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
      <h2>Pricing</h2><p>Free missed-call audit, then a free 30-day pilot up to 40 recovered calls. Optional $149/month founding rate locked 12 months for the first 10 customers; standard $299/month. No automatic paid conversion.</p>
      <p><a href="/signup">Start the Free 30-Day Pilot</a> or <a href="mailto:cory@roofaileadrecovery.com?subject=Roof%20AI%20callback%20request">request a callback by email</a>. Enable JavaScript to use the on-page callback form.</p>
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
  // Social crawlers do not need JavaScript to read the resource's own title,
  // description and URL. Preserve any deliberately authored page metadata.
  for (const [attribute, name, content] of [
    ["property", "og:type", "website"],
    ["property", "og:site_name", "Roof AI Lead Recovery"],
    ["property", "og:title", document.title],
    ["property", "og:description", document.querySelector('meta[name="description"]')?.content || ""],
    ["property", "og:url", url],
    ["name", "twitter:card", "summary_large_image"],
    ["name", "twitter:title", document.title],
    ["name", "twitter:description", document.querySelector('meta[name="description"]')?.content || ""],
    ["name", "twitter:image", document.querySelector('meta[property="og:image"]')?.content || ""],
    ["name", "twitter:image:alt", document.querySelector('meta[property="og:image:alt"]')?.content || "Roof AI Lead Recovery"],
  ]) {
    if (document.querySelector(`meta[${attribute}="${name}"]`)) continue;
    const meta = document.createElement("meta");
    meta.setAttribute(attribute, name);
    meta.content = content;
    document.head.appendChild(meta);
  }
  const result = dom.serialize();
  dom.window.close();
  return result;
}

export function preparePrerenderedHomepage(html, markup) {
  const dom = new JSDOM(html);
  const { document } = dom.window;
  const mount = document.getElementById("root");
  if (!mount || !markup.includes('id="inquiry"')) throw new Error("Missing public homepage or callback form in pre-render");
  mount.innerHTML = markup;
  mount.setAttribute("data-prerendered-homepage", "");
  // The same real page now works without JavaScript; retain only an honest
  // contact fallback instead of a second, duplicate marketing page.
  // Write the noscript content after serialization: a DOM innerHTML assignment
  // treats its markup as text and would escape the working contact link.
  const result = dom.serialize().replace(/<noscript>[\s\S]*?<\/noscript>/,
    '<noscript><p style="max-width:960px;margin:20px auto;padding:0 20px;font:16px/1.7 system-ui">Enable JavaScript to request a callback, or <a href="mailto:cory@roofaileadrecovery.com?subject=Roof%20AI%20callback%20request">email Cory to request a human callback</a>. You can also <a href="/roofing-missed-call-demo/">watch the roofing demo</a>.</p></noscript>');
  dom.window.close();
  return result;
}

export function prepareAppShell(html) {
  const dom = new JSDOM(html);
  const { document } = dom.window;
  const mount = document.getElementById("root");
  mount.replaceChildren();
  mount.removeAttribute("data-prerendered-homepage");
  document.querySelector('meta[name="robots"]').content = "noindex, follow";
  const result = dom.serialize();
  dom.window.close();
  return result;
}

async function renderPublicHomepage() {
  const server = await createServer({
    root,
    configFile: path.join(root, "vite.config.js"),
    appType: "custom",
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    ssr: {
      noExternal: ["react-router-dom", "react-router"],
      resolve: { conditions: ["module", "node", "import", "module-sync"] },
    },
    resolve: {
      alias: [{ find: /^@\/lib\/(?:supabase|authRedirect)(?:\.js)?$/, replacement: path.join(root, "scripts/prerender-public-client.js") }],
    },
  });
  try {
    const { renderHomepage } = await server.ssrLoadModule("/scripts/prerender-homepage.jsx");
    return renderHomepage();
  } finally { await server.close(); }
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
  const homepage = prepareHomepage(await readFile(filename, "utf8"));
  // App routes must keep their own shell: a direct signup/login visit must not
  // briefly display the pre-rendered homepage while authentication loads.
  await writeFile(path.join(directory, "app.html"), prepareAppShell(homepage));
  await writeFile(filename, preparePrerenderedHomepage(homepage, await renderPublicHomepage()));
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
  console.log(`Prepared ${count} resource pages with HTML navigation, breadcrumbs and social previews; public homepage pre-rendered.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
