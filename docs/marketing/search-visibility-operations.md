# Roof AI search visibility operations

Authorized by Cory on October 14, 2026: implement SEO improvements and review visibility every couple of weeks. Keep the current site, $299/month offer, seven-day trial, callback inquiry, signup and customer application.

## Production and source

- Canonical site: https://www.roofaileadrecovery.com/
- Repository: maag8484/Roofers-AI-Lead-Recovery; production branch: main.
- Vercel team: team_WVLU1KlTTe2JoW2OrqAQIXaC; project: prj_2CY5raQNIZ9FZ8yQQyaIAbbs6DHD.
- Baseline and subsequent review dates: `docs/marketing/search-visibility-baseline.json`.
- Technical audit: `npm run seo:audit` after building, or `npm run seo:audit -- --origin https://www.roofaileadrecovery.com --output /tmp/roof-ai-seo-live.json`.
- Search-engine submission: `npm run seo:submit` verifies the deployed public ownership file and submits the live sitemap's URLs to IndexNow participants. It does not submit to Google. Never treat an HTTP receipt as proof of indexing.

## Implemented scope

The four existing buyer guides cover missed-call text-back, AI receptionists, after-hours answering and live answering versus AI recovery. Each provides the actual current offer, relevant comparisons and a direct link to the existing `/#inquiry` callback form. New homepage guide cards, navigation and footer links improve discovery. Internal links have no UTMs, preserving original acquisition attribution.

Production builds insert the existing shared resource navigation and footer into the HTML of all sitemap resource pages. The browser script retains a source-page fallback without duplicating built navigation. Breadcrumb JSON-LD and explicit public-page robots tags are generated during `postbuild`. Homepage metadata, visible FAQ markup and the no-JavaScript summary share the current product facts; old universal response-time, instant booking and fifteen-minute setup claims were removed from SEO markup. The homepage remains a JavaScript-rendered React page: check its actual Google rendering with URL Inspection rather than inferring success from the no-JavaScript summary.

Application and legacy-marketing routes return `X-Robots-Tag: noindex, follow`. `/home-v1` is allowed to be crawled so the noindex header can be seen. Existing authentication and robots restrictions on private routes remain as configured. Unknown routes must return a real 404.

## Review cadence and ownership

The account's 20-active-task limit prevented a standalone task. The existing **Roof AI Sales Research** automation (`6acb8f8658048191ba41a224011c6bdd`) retains its weekly Friday sales briefing and adds SEO review on alternate Fridays beginning **October 30, 2026**, then November 13 and November 27. Do not create a duplicate task or disable an unrelated one. Check the latest automation before changing cadence.

For each due review:

1. Read this file and the latest baseline; inspect subsequent deployments before editing source.
2. Audit the 24 sitemap URLs, canonical host, response status, robots/noindex, titles, descriptions, HTML navigation, internal links and callback destinations. Investigate regressions without repeatedly rewriting healthy pages.
3. Review publicly accessible brand and buyer-query results across Google, Bing and DuckDuckGo where actually accessible. Identify the engine and evidence. Search-service results are not an exact Google position or a complete indexing inventory.
4. Compare with the prior review. Report important changes, concrete technical failures and the single best next SEO improvement. Record a dated review and next due date in the repository. Do not auto-publish changes from this research-only task.
5. Prioritize organic callback requests, qualified conversations, activated customers and collected subscription payments. Keep each stage separate and mark inaccessible metrics unknown.

## Access still required

Google Search Console's Supermetrics data source `GW` was **NOT_AUTHENTICATED** when checked October 14. No private Google impressions, clicks, CTR, positions or indexing coverage were retrieved. Owner connection is needed before those metrics can be added to monitoring. Do not keep or commit temporary login URLs or account credentials. Public checks operate independently.

Bing Webmaster Tools ownership and private reports have not been verified. IndexNow is an additional discovery route for participating engines, not a substitute for those reports. Google sitemap submission and URL Inspection remain unverified until authenticated access is available. Do not use obsolete sitemap ping endpoints or Google's restricted Indexing API for ordinary marketing pages.

No verified customer-result dataset or permission to publish a named customer case study was supplied for this change. Existing demonstration examples must remain labeled as examples. Prepare a real case study only after verifying records and publication permission. Industry outreach and backlink purchases are outside this implementation; do not contact anyone from the SEO review.

## Official references

- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- https://www.indexnow.org/documentation

## Mobile performance follow-up

The first post-release mobile lab audit reported homepage performance 52/100 (LCP 13.3s) and text-back-guide performance 75/100 (LCP 4.8s), with no real-user field dataset. Both automated SEO category scores were 100; these scores do not establish indexing or rankings. A follow-up splits non-homepage routes, reuses the existing 10KB logo instead of the 720KB PNG, and loads support chat assets only after the visitor opens chat. Keep the same endpoint and support behavior. See the follow-up pull request for the new production lab measurement; do not mix lab and field metrics.

Initial SEO production verification: PR #19, commit b650f656112cb32623f65379347bcf00f91e9178, deployment dpl_CDeXw5WALx4j2oqCdvN38Zije9hZ READY. All 24 production sitemap URLs passed the technical audit on October 14 at 20:50 UTC. IndexNow returned HTTP 202 for 24 URLs; key validation and indexing remain unconfirmed.
