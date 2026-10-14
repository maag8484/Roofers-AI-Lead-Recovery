export const SITE_URL = "https://www.roofaileadrecovery.com";
export const HOME_TITLE = "Missed Call Recovery for Roofers | Roof AI Lead Recovery";
export const HOME_DESCRIPTION =
  "Recover missed and after-hours roofing calls with configured AI follow-up, qualification and callback or booking workflows. Keep your business number. $299/month.";

export const SEARCH_GUIDES = [
  {
    title: "Missed-call text-back for roofers",
    href: "/resources/roofing-missed-call-text-back/",
    description: "See the first message, qualification steps and handoff rules a useful text-back workflow needs.",
  },
  {
    title: "AI receptionist for roofing companies",
    href: "/ai-receptionist-for-roofing-companies/",
    description: "Compare overflow coverage, full-time answering, setup questions and appointment workflows.",
  },
  {
    title: "After-hours answering for roofers",
    href: "/after-hours-answering-for-roofing-companies/",
    description: "Plan how evening, weekend and storm-related callers reach an approved next step.",
  },
  {
    title: "Roofing answering service vs. AI recovery",
    href: "/roofing-answering-service-vs-ai-lead-recovery/",
    description: "Compare coverage, qualification, handoff and total cost against your current process.",
  },
];

export function homeStructuredData(faqs) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Roof AI Lead Recovery",
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/media/roof_ai_lead_recovery_logo_transparent.png`,
        description: "Missed-call and after-hours recovery for roofing companies.",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Roof AI Lead Recovery",
        url: `${SITE_URL}/`,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
        name: "Roof AI Lead Recovery",
        url: `${SITE_URL}/`,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        publisher: { "@id": `${SITE_URL}/#organization` },
        description: HOME_DESCRIPTION,
        featureList: [
          "Configured missed-call and after-hours workflows",
          "Roofing-specific qualification",
          "Approved callback or booking requests",
          "Lead tracking dashboard",
          "Keep your existing business number",
        ],
        offers: {
          "@type": "Offer",
          price: "299",
          priceCurrency: "USD",
          url: `${SITE_URL}/signup`,
          description: "$299 per month with a 7-day free trial. Review the exact trial end and first charge date in checkout.",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "299",
            priceCurrency: "USD",
            unitText: "month",
            billingDuration: "P1M",
          },
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: faqs.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };
}
