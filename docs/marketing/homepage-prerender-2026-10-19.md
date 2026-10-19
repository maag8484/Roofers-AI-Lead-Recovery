# Homepage search rendering — October 19, 2026

The live technical audit passed all 25 sitemap URLs before this change. Its remaining warning was the homepage's empty React mount: the real headline, callback form and navigation were available only after JavaScript ran. The other 24 pages already returned static content and navigation.

## Prepared change

- Render the existing public React homepage during `postbuild`, using the same components and public initial state. Do not create an authenticated service client or read customer data during rendering; a build-only service adapter rejects service access.
- Hydrate the pre-rendered homepage at `/`. Keep lazy application routes in a separate, empty `app.html` shell with `noindex` and their existing authentication flow.
- Display homepage copy immediately, without first-load entrance fades. Retain scroll and interactive motion. Keep the eager homepage outside the lazy-route Suspense boundary so an auth effect cannot interrupt its initial hydration.
- Keep the callback fieldset disabled until its client handler has attached. A visitor without JavaScript receives an email contact link and a link to the existing standalone demo; an unhandled form cannot place contact details into a GET URL.
- Fill missing Open Graph and Twitter preview fields on resource pages using each page's own title, description, canonical URL and existing image. Preserve deliberately authored preview metadata.
- Extend the existing technical audit to require the homepage's real H1, navigation and safe callback markup, plus social-preview fields on every sitemap page.

The offer, customer claims, consent text, API, payments, recovery engine and routing permissions are unchanged.

## Validation

- Production build passed, including rendering with authenticated-service access blocked.
- All 86 existing tests passed.
- Local technical audit passed all 25 sitemap URLs; every page now contains HTML navigation. No technical errors or client-rendering warnings remain in the local result.
- Local JSDOM integration checks hydrated the actual generated markup with the client entry, observed no hydration errors or duplicate H1, confirmed unchecked consent blocks submission, and exercised one mocked saved callback through its success/locked state. Menu, lazy demo, FAQ and the direct signup shell also passed. No live request, customer record, message, call or payment was created.
- The no-JavaScript check found one headline, the current price, a disabled callback form and the working email fallback.

The local environment had no Chromium executable and its browser download failed. A real-browser preview check and production verification are still required before claiming the release is live. The JSDOM check does not verify visual layout, video decoding, field Core Web Vitals, search-engine indexing or rankings.

Use `npm run build`, `npm test` and `npm run seo:audit` to repeat the build and technical checks. After deployment, repeat `npm run seo:audit -- --origin https://www.roofaileadrecovery.com`; use a browser to verify the callback destination, menu, demo, FAQ and direct signup route without submitting live test data. Use Search Console URL Inspection for Google's view.

Existing IndexNow ownership is configured in `docs/marketing/indexnow.json`. Reuse that public key and the existing verification file; an IndexNow receipt does not establish indexing and does not submit URLs to Google.

## Primary references

- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://www.indexnow.org/documentation
