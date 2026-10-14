import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_URL, HOME_TITLE, HOME_DESCRIPTION, homeStructuredData } from "@/config/search";
import { FAQS } from "@/pages/home-v2/content";

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
    let structuredData = document.getElementById("roof-ai-structured-data");
    if (isHome) {
      if (!structuredData) {
        structuredData = document.createElement("script");
        structuredData.id = "roof-ai-structured-data";
        structuredData.type = "application/ld+json";
        document.head.appendChild(structuredData);
      }
      structuredData.textContent = JSON.stringify(homeStructuredData(FAQS));
    } else {
      structuredData?.remove();
    }
  }, [isHome, pathname]);

  return null;
}
