# Roof AI Lead Recovery: brand and roofing SEO audit

Date: September 11, 2026. Review branch: `review/brand-roofing-seo-2026-09-11`.
Base: `main` at `3dae25aeec04bed039264d6a203efa77e3d70112`.

The public HTTP checks passed for the homepage and calculator. Actual Google indexing, Google's chosen canonical, and Search Console sitemap processing remain **unverified**. Browser tab discovery and a fresh tab both timed out before Search Console could be inspected. No indexing request or sitemap submission was made. Search-tool queries did not provide usable brand/domain results; that is not evidence that Google has excluded the pages or that a competitor outranks them.

## Live evidence before these changes

| Check | Homepage | Calculator / audit page |
| --- | --- | --- |
| URL | https://www.roofaileadrecovery.com/ | https://www.roofaileadrecovery.com/how-much-are-missed-calls-costing-your-roofing-company/ |
| HTTP response | 200, HTML | 200, HTML |
| Redirect at preferred URL | None | None |
| Canonical in returned HTML | Self-referencing HTTPS www URL | Self-referencing HTTPS www URL with trailing slash |
| HTTP X-Robots-Tag | Absent | Absent |
| HTML robots meta | index, follow with preview directives | Absent; no noindex directive |
| robots.txt permits crawl | Yes | Yes |
| Listed in sitemap | Yes | Yes |
| Google index status | Unverified | Unverified |
| Google-selected canonical | Unverified | Unverified |

`https://www.roofaileadrecovery.com/robots.txt` returned 200 and text/plain. It allows the public pages and declares `https://www.roofaileadrecovery.com/sitemap.xml`. The sitemap returned 200 and application/xml. Its 16 URLs are unique and include each target once. The live target lastmod values were September 4 for the homepage and September 3 for the calculator. The review updates only those two dates to September 11 to reflect the content edits.

| Alternate URL | Observed behavior |
| --- | --- |
| https://roofaileadrecovery.com/ | 308 to https://www.roofaileadrecovery.com/ |
| http://roofaileadrecovery.com/ | 308 to HTTPS non-www, then the above 308 to www |
| http://www.roofaileadrecovery.com/ | 308 to HTTPS www |
| Calculator path without trailing slash | 200; canonical points to trailing-slash version |
| Calculator path ending in /index.html | 200; canonical points to trailing-slash version |
| Homepage with ?utm_source=seo-audit | 200; canonical points to clean homepage |

These are direct HTTP observations from this environment, not Googlebot fetch results. A redirecting alternate URL can legitimately appear as "Page with redirect" in Search Console. Inspect the final preferred destination before treating that status as an indexing defect. The non-www HTTP route has two hops; shortening it is a secondary hosting improvement, not an observed failure of either preferred URL. No redirect or hosting changes are included here.

## Changes prepared for review

| Element | Homepage | Calculator / audit page |
| --- | --- | --- |
| Title | Roof AI Lead Recovery \| Roofing Missed-Call Recovery | Roofing Missed-Revenue Calculator \| Roof AI Lead Recovery |
| Meta description | Roof AI Lead Recovery is roofing lead-recovery software for missed and after-hours calls. Qualify homeowner inquiries and help book roofing estimates. | Use Roof AI Lead Recovery's free roofing missed-call calculator to estimate revenue at risk from unanswered homeowner calls. Request your Missed Revenue Audit. |
| H1 | Roof AI Lead Recovery for Missed Roofing Calls | How Much Are Missed Calls Costing Your Roofing Company? |
| Main copy | Names the full brand, roofing lead-recovery software, missed/after-hours/weekend calls, and homeowner repair/replacement/storm needs. | Names the full brand in the introduction, explains the calculator and audit, and describes the roofing recovery workflow. |
| Internal links | Adds a descriptive hero link to the calculator and the corresponding no-JavaScript fallback link. | Adds a static branded homepage breadcrumb and a contextual branded homepage link. |

The homepage previously sent one title in its HTML and changed it to another in `Seo.jsx`. The review makes the initial title, runtime title, Open Graph title, and Twitter title agree, with matching descriptions. It also aligns the no-JavaScript introduction and H1 with the visible hero.

The calculator previously used only "Roof AI" in its HTML title and identified the entire website as the revenue hub in its WebPage schema. The review uses "Roof AI Lead Recovery" consistently and references the homepage's stable `#website` and `#organization` identities. The homepage WebSite schema retains the full name and adds the existing short name "Roof AI" as alternateName. Breadcrumb schema matches the visible breadcrumb. No reviews, customers, results, affiliations, or external profile links were invented.

The obsolete keywords meta tag, which included lead-generation language, is removed. Changes preserve the calculator formula, form hooks, consent handling, API endpoints, attribution logic, pricing, and existing trial/demo destinations.

## Validation

- `npm run build`: passed with available local dependencies. This was not a fresh lockfile install. Vite emitted its existing large-chunk advisory; the main bundle is about 1.32 MB before gzip.
- Built homepage and calculator HTML: one title, description, canonical and fallback/static H1 per page; matching Open Graph/Twitter metadata; no noindex; full brand present.
- Homepage HTML title and description match the runtime `Seo.jsx` values.
- JSON-LD parses successfully and the calculator references the intended website and organization. This is syntax/consistency validation, not a Google rich-result eligibility result.
- Built sitemap: parses as XML, 16 unique URLs, both targets present exactly once.
- Existing `test/conversion-events.test.js`: 3/3 passed against the edited page and existing site script. The runner used the already installed jsdom from the conversion-events checkout; test assertions were unchanged. Checks cover calculator event deduplication/attribution, accepted audit submission, and rejected rate-limited submission.
- `git diff --check`: passed.
- Responsive browser layout and Search Console rendering remain unverified because browser control timed out. Review the homepage hero on mobile and desktop before production publication.

No production merge or deployment was performed. This branch starts from current main and does not incorporate the separate direct-trial checkout review branch. Review overlapping Hero.jsx edits when combining those changes.

## Finish in Google Search Console

Use the verified domain property `roofaileadrecovery.com` or the matching HTTPS www property.

1. Inspect `https://www.roofaileadrecovery.com/` and `https://www.roofaileadrecovery.com/how-much-are-missed-calls-costing-your-roofing-company/` separately.
2. Record the indexed report's overall status, page-indexing reason, last crawl, crawl allowed, page fetch, indexing allowed, user-declared canonical and Google-selected canonical. The expected chosen canonicals are the exact URLs above. Use indexed data for Google's chosen canonical; the live test cannot determine it.
3. Open Sitemaps and record status, last read and discovered pages for `https://www.roofaileadrecovery.com/sitemap.xml`. The expected successful result is "Success"; a public HTTP 200 does not establish this. If missing, submit that URL. Diagnose any processing error shown.
4. If either preferred page is not indexed, inspect the reason and use Test Live URL. Confirm its content, resources, title and canonical render as intended. Address the specific failure before requesting indexing.
5. After approved production publication and live verification of these changes, request indexing once for each preferred page. Save the confirmation. Requesting indexing does not guarantee inclusion or ranking.
6. Record a 28-day Search Performance baseline for these two pages: impressions, clicks, CTR and average position. Examine "Roof AI Lead Recovery", "roofing missed-call recovery", "roofing lead-recovery software" and close variants. Do not label missing query rows as zero demand; low-volume queries can be omitted.

To complete the blocked verification without this browser connection, obtain screenshots or exports of both expanded URL Inspection reports and the sitemap detail report. No password or verification code is needed in chat.

## Google guidance

- [URL Inspection](https://support.google.com/webmasters/answer/9012289): indexed data versus live tests and Google-selected canonicals.
- [Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): consistent canonical, sitemap and redirect signals.
- [Titles](https://developers.google.com/search/docs/appearance/title-link): descriptive concise titles, brand and heading consistency, and recrawl/reprocessing delays.
- [Site names](https://developers.google.com/search/docs/appearance/site-names): homepage WebSite name and alternateName.

These edits clarify brand identity and relevance. They do not establish copying by a competitor or guarantee an exact snippet, indexing date or search position.
