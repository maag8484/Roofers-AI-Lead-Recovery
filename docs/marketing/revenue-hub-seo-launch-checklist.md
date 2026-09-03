# Revenue Recovery Hub SEO Launch Checklist

Use this checklist only after the `revenue-recovery-hub` branch has been reviewed and an authorized owner approves the production merge and deployment.

## Before launch

- [ ] Confirm every hub URL loads its intended static HTML page in the deployment preview, including the trailing slash.
- [ ] Confirm every page has one unique title, meta description, canonical URL, H1, and crawlable body copy.
- [ ] Confirm canonical URLs use `https://www.roofaileadrecovery.com` and match the final browser URL.
- [ ] Confirm Article JSON-LD validates and includes author, publisher, publisher logo, publication date, modification date, and `mainEntityOfPage`.
- [ ] Confirm `robots.txt` permits the public hub and references `https://www.roofaileadrecovery.com/sitemap.xml`.
- [ ] Confirm all 15 hub and resource URLs appear once in `sitemap.xml` with accurate `lastmod` dates.
- [ ] Run the production build and test internal links, images, CSS, JavaScript, mobile navigation, calculator behavior, and CTA destinations.
- [ ] Confirm private application routes remain excluded from indexing.
- [ ] Add approved analytics without sending calculator inputs or personal information as event parameters.
- [ ] Define conversion events for calculator start/completion, audit CTA, demo CTA, signup CTA, and resource clicks.

## Launch day

- [ ] Verify each production hub URL returns HTTP 200 and renders the intended content without adding `index.html`.
- [ ] Verify HTTP-to-HTTPS and hostname redirects resolve to one preferred canonical URL without chains.
- [ ] Verify `robots.txt`, `sitemap.xml`, shared CSS, shared JavaScript, logo, and favicon return HTTP 200.
- [ ] Run Google Rich Results Test or Schema Markup Validator on each page type.
- [ ] Run PageSpeed Insights on the hub, calculator, longest guide, and homepage for mobile and desktop.
- [ ] Submit the sitemap in Google Search Console.
- [ ] Request indexing first for the hub, calculator, five cornerstone pages, and resource library.
- [ ] Submit or import the site and sitemap in Bing Webmaster Tools.
- [ ] Record launch baselines for indexed pages, impressions, clicks, organic landing sessions, calculator completions, audit requests, demos, trials, and customers.

## Days 1–7

- [ ] Check Search Console for discovered/crawled-not-indexed pages, canonical conflicts, soft 404s, blocked resources, and server errors.
- [ ] Confirm every support article links to a cornerstone page, a related resource, and the calculator or audit CTA.
- [ ] Add contextual links from relevant existing site copy into the hub; do not rely only on navigation and footer links.
- [ ] Verify campaign links use consistent UTM parameters for email, LinkedIn, YouTube, partners, communities, and paid traffic.
- [ ] Verify analytics records CTA and calculator events correctly before increasing outreach.

## Days 8–14

- [ ] Review early queries and impressions, but avoid major rewrites based on only a few days of data.
- [ ] Improve weak titles or introductions only when query intent is clearly mismatched.
- [ ] Review mobile Core Web Vitals, especially LCP, layout shift, image sizing, and render-blocking resources.
- [ ] Add BreadcrumbList markup consistently when it can be validated across the page set.
- [ ] Pursue one legitimate roofing-industry mention, contribution, or partner link; do not buy bulk backlinks.

## Days 15–21

- [ ] Publish one high-intent resource based on real sales questions or Search Console queries.
- [ ] Link the new resource from the hub and at least two related pages.
- [ ] Update the sitemap with the real publication date.
- [ ] Repurpose the resource into a founder post, company post, short video, and sales follow-up asset.

## Days 22–30

- [ ] Report indexed URLs out of 15, organic impressions/clicks/CTR, queries by page, non-branded traffic, conversions, referrals, Core Web Vitals, and indexing errors.
- [ ] Improve pages earning impressions but weak click-through rates.
- [ ] Strengthen pages approaching page one with original examples, clearer definitions, and relevant internal links.
- [ ] Add verified customer evidence when available, keeping qualified opportunities, booked estimates, signed jobs, and collected revenue distinct.
- [ ] Build the next month's editorial plan from actual search queries and sales objections.

## Ongoing cadence

- [ ] Review indexing and conversions weekly for the first 90 days.
- [ ] Publish one substantial roofing-specific resource every two weeks.
- [ ] Refresh one existing page each month.
- [ ] Complete one legitimate partner or industry contribution effort each week.
- [ ] Audit structured data, internal links, sitemap accuracy, and Core Web Vitals quarterly.

The primary outcome is qualified roofing-company visitors progressing from the calculator to an audit, demo, trial, and paying customer—not raw pageviews.
