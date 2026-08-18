import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://www.roofaileadrecovery.com";
const HOME_TITLE = "Roof AI Lead Recovery | Recover Missed Roofing Leads & Book Estimates";
const HOME_DESCRIPTION =
  "Roof AI Lead Recovery helps roofing companies recover missed calls and lost leads with AI-powered follow-up that books more roofing estimates.";

function updateMeta(selector, attribute, value) {
  const element = document.head.querySelector(selector);
  if (element) element.setAttribute(attribute, value);
}

export function Seo() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  useEffect(() => {
    const title = isHome ? HOME_TITLE : "Roof AI Lead Recovery";
    const description = isHome
      ? HOME_DESCRIPTION
      : "Roof AI Lead Recovery is AI-powered missed-call and lead recovery software for roofing companies.";
    const canonical = `${SITE_URL}${isHome ? "/" : pathname}`;

    document.title = title;
    updateMeta('meta[name="description"]', "content", description);
    updateMeta('meta[name="robots"]', "content", isHome ? "index, follow" : "noindex, nofollow");
    updateMeta('link[rel="canonical"]', "href", canonical);
    updateMeta('meta[property="og:title"]', "content", title);
    updateMeta('meta[property="og:description"]', "content", description);
    updateMeta('meta[property="og:url"]', "content", canonical);
    updateMeta('meta[name="twitter:title"]', "content", title);
    updateMeta('meta[name="twitter:description"]', "content", description);
  }, [isHome, pathname]);

  return null;
}
