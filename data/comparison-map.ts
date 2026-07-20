// Curated mapping: each Mamta check -> the catalog check(s) that cover it.
// Hand-authored; exactly one entry per row in data/mamta-checks.ts.
//
// `catalog` entries are catalog check NAMES. Seeded base checks are read-only
// (there is no PUT on /api/checks — edits go to check_iterations), so their
// names are stable keys.
//
// Three catalog names appear in two pillars each and MUST be pillar-qualified
// as "Pillar :: Check name":
//   Profiling cookies off by default (Ex-US)    — Homepage, Security
//   No placeholder text on any page             — Content, Content Change Detection
//   SSL certificate not expiring within 30 days — Security, SSL & Domain Health
//
// Invariants enforced by data/comparison-map.test.ts:
//   - exactly one entry per MAMTA_CHECKS id, and no entries for unknown ids
//   - relation 'gap'  <=> catalog is []
//   - every ref resolves to exactly one row in CHECKS
import type { MamtaMapping } from '@/types';

export const COMPARISON_MAP: MamtaMapping[] = [
  // ---- US · Homepage ----
  { mamtaId: 'us-homepage-01', relation: 'match', catalog: ['Hero headline renders correctly'] },
  { mamtaId: 'us-homepage-02', relation: 'match', catalog: ['Hero CTA buttons functional'] },
  { mamtaId: 'us-homepage-03', relation: 'match', catalog: ['Hero image loads within 3 seconds'] },
  { mamtaId: 'us-homepage-04', relation: 'match', catalog: ['Logo links back to homepage'] },
  { mamtaId: 'us-homepage-05', relation: 'gap', catalog: [],
    note: 'The catalog only has the Ex-US mirror ("EMA regional news shown not FDA approvals"). Nothing asserts the US-side FDA approval banner renders.' },
  { mamtaId: 'us-homepage-06', relation: 'match', catalog: ['Products section shows correct product list'] },
  { mamtaId: 'us-homepage-07', relation: 'match', catalog: ['REMS callout present on product cards'] },
  { mamtaId: 'us-homepage-08', relation: 'gap', catalog: [],
    note: 'The pipeline section is not covered anywhere in the catalog — products are, pipeline is not.' },
  { mamtaId: 'us-homepage-09', relation: 'gap', catalog: [],
    note: 'Same gap as the FDA news banner: only the Ex-US "EMA regional news" mirror exists.' },
  { mamtaId: 'us-homepage-10', relation: 'match', catalog: ['Footer shows current copyright year'] },
  { mamtaId: 'us-homepage-11', relation: 'match', catalog: ['Cookie banner appears on first visit'] },
  { mamtaId: 'us-homepage-12', relation: 'match', catalog: ['Cookie preferences remembered across sessions'] },
  { mamtaId: 'us-homepage-13', relation: 'match', catalog: ['US cookie banner uses CCPA language not GDPR'] },

  // ---- US · Navigation ----
  { mamtaId: 'us-navigation-01', relation: 'match', catalog: ['All nav items render correctly for locale'] },
  { mamtaId: 'us-navigation-02', relation: 'match', catalog: ['HCP nav item present and routes correctly'] },
  { mamtaId: 'us-navigation-03', relation: 'gap', catalog: [],
    note: 'The catalog checks that nav items render, but nothing exercises dropdown hover behaviour or its child links.' },
  { mamtaId: 'us-navigation-04', relation: 'match', catalog: ['Country selector defaults to correct region'] },
  { mamtaId: 'us-navigation-05', relation: 'match', catalog: ['Switching region routes to correct content'] },
  { mamtaId: 'us-navigation-06', relation: 'match', catalog: ['No broken internal links (404 errors)'] },
  { mamtaId: 'us-navigation-07', relation: 'match', catalog: ['Back and forward browser navigation works'] },

  // ---- US · Content ----
  { mamtaId: 'us-content-01', relation: 'match', catalog: ['PI link present on every product page (US)'] },
  { mamtaId: 'us-content-02', relation: 'match', catalog: ['Black Box warning visible on applicable products'] },
  { mamtaId: 'us-content-03', relation: 'match', catalog: ['REMS programme info and enrollment link present'] },
  { mamtaId: 'us-content-04', relation: 'match', catalog: ['Drug indication statement is clinically accurate'] },
  { mamtaId: 'us-content-05', relation: 'match', catalog: ['AE reporting number on every product page (US)'] },
  { mamtaId: 'us-content-06', relation: 'match', catalog: ['Drug indication statement is clinically accurate'] },
  { mamtaId: 'us-content-07', relation: 'near', catalog: ['FDA label updates for portfolio drugs'],
    note: 'The catalog watches for FDA label changes externally; it does not verify the PI published on the page is the current revision.' },
  { mamtaId: 'us-content-08', relation: 'match', catalog: ['ISI fully visible — not hidden behind see more'] },
  { mamtaId: 'us-content-09', relation: 'match', catalog: ['Content :: No placeholder text on any page'] },
  { mamtaId: 'us-content-10', relation: 'match', catalog: ['Copyright year current in footer'] },
  { mamtaId: 'us-content-11', relation: 'match', catalog: ['References and footnotes correctly numbered'] },
  { mamtaId: 'us-content-12', relation: 'gap', catalog: [],
    note: 'No check covers pipeline disease accuracy (alpha-mannosidosis, cystinosis, lipodystrophy).' },
  { mamtaId: 'us-content-13', relation: 'match', catalog: ['Privacy policy references correct regional law'] },
  { mamtaId: 'us-content-14', relation: 'gap', catalog: [],
    note: 'No "Terms of Use" check anywhere in the catalog. Privacy Policy is covered; Terms is not.' },
  { mamtaId: 'us-content-15', relation: 'gap', catalog: [],
    note: 'Only incidental: the accessibility-statement check crawls footer links for a cookie policy, but no named check asserts it.' },
  { mamtaId: 'us-content-16', relation: 'match', catalog: ['No GDPR or EU language on US pages'] },

  // ---- US · Performance ----
  { mamtaId: 'us-performance-01', relation: 'match', catalog: ['LCP loads within 2.5 seconds'] },
  { mamtaId: 'us-performance-02', relation: 'match', catalog: ['INP interaction response under 200ms'] },
  { mamtaId: 'us-performance-03', relation: 'match', catalog: ['CLS layout shift score below 0.1'] },
  { mamtaId: 'us-performance-04', relation: 'match', catalog: ['Zero JavaScript errors on page load'] },
  { mamtaId: 'us-performance-05', relation: 'match', catalog: ['Unique title tag present on every page'] },
  { mamtaId: 'us-performance-06', relation: 'match', catalog: ['Meta description present and correct length'] },
  { mamtaId: 'us-performance-07', relation: 'match', catalog: ['robots.txt does not block important pages'] },
  { mamtaId: 'us-performance-08', relation: 'match', catalog: ['XML sitemap accessible'] },
  { mamtaId: 'us-performance-09', relation: 'match', catalog: ['Canonical tags point to correct regional URL'] },
  { mamtaId: 'us-performance-10', relation: 'match', catalog: ['hreflang tags correct for all served locales'] },

  // ---- US · Accessibility ----
  { mamtaId: 'us-accessibility-01', relation: 'match', catalog: ['Colour contrast meets 4.5:1 ratio'] },
  { mamtaId: 'us-accessibility-02', relation: 'match', catalog: ['All interactive elements keyboard accessible'] },
  { mamtaId: 'us-accessibility-03', relation: 'match', catalog: ['Skip navigation link present'] },
  { mamtaId: 'us-accessibility-04', relation: 'match', catalog: ['Modals trap focus and close with Escape key'] },
  { mamtaId: 'us-accessibility-05', relation: 'match', catalog: ['Axe scan shows zero critical violations'] },
  { mamtaId: 'us-accessibility-06', relation: 'match', catalog: ['All product images have descriptive alt text'] },

  // ---- US · Responsive ----
  { mamtaId: 'us-responsive-01', relation: 'match', catalog: ['No layout overflow at 1440px desktop'] },
  { mamtaId: 'us-responsive-02', relation: 'match', catalog: ['Navigation adapts correctly at 768px tablet'] },
  { mamtaId: 'us-responsive-03', relation: 'gap', catalog: [],
    note: 'The Responsive pillar covers 1440px overflow, nav at 768px, 375px usability and tap targets — but not product-card reflow at tablet width.' },
  { mamtaId: 'us-responsive-04', relation: 'match', catalog: ['Homepage fully usable at 375px mobile'] },
  { mamtaId: 'us-responsive-05', relation: 'match', catalog: ['Tap targets at least 44px tall for all CTAs'] },
  { mamtaId: 'us-responsive-06', relation: 'match', catalog: ['PI and SmPC documents accessible on mobile'] },
  { mamtaId: 'us-responsive-07', relation: 'near', catalog: ['Tap targets at least 44px tall for all CTAs'],
    note: 'Subsumed by the generic tap-target rule — the REMS link specifically is not called out.' },

  // ---- US · Security ----
  { mamtaId: 'us-security-01', relation: 'match', catalog: ['HTTPS valid with no browser security warnings'] },
  { mamtaId: 'us-security-02', relation: 'match', catalog: ['HTTP automatically redirects to HTTPS'] },
  { mamtaId: 'us-security-03', relation: 'match', catalog: ['Security :: SSL certificate not expiring within 30 days'] },
  { mamtaId: 'us-security-04', relation: 'match', catalog: ['No mixed content warnings in browser'] },
  { mamtaId: 'us-security-05', relation: 'match', catalog: ['No tracking cookies set before user consent'] },
  { mamtaId: 'us-security-06', relation: 'match', catalog: ['CCPA Do Not Sell opt-out available (US)'] },
  { mamtaId: 'us-security-07', relation: 'match', catalog: ['No personal data in URL after form submission'] },
  { mamtaId: 'us-security-08', relation: 'match', catalog: ['Security response headers present on server'] },

  // ---- US · Forms ----
  { mamtaId: 'us-forms-01', relation: 'match', catalog: ['Contact form submits and shows confirmation'] },
  { mamtaId: 'us-forms-02', relation: 'match', catalog: ['Required field validation fires on empty submission'] },
  { mamtaId: 'us-forms-03', relation: 'match', catalog: ['HCP medical information form accessible and complete'] },
  { mamtaId: 'us-forms-04', relation: 'match', catalog: ['Phone number uses correct regional format'] },
  { mamtaId: 'us-forms-05', relation: 'match', catalog: ['AE reporting mechanism present on all product pages'] },
  { mamtaId: 'us-forms-06', relation: 'match', catalog: ['PI PDF downloads correctly (US)'] },
  { mamtaId: 'us-forms-07', relation: 'match', catalog: ['REMS enrollment external link works (US)'] },
  { mamtaId: 'us-forms-08', relation: 'match', catalog: ['External links open in new tab with security attribute'] },

  // ---- Ex-US · Homepage ----
  { mamtaId: 'exus-homepage-01', relation: 'match', catalog: ['Hero headline renders correctly', 'No US regulatory references on Ex-US pages'] },
  { mamtaId: 'exus-homepage-02', relation: 'match', catalog: ['Hero CTA buttons functional'] },
  { mamtaId: 'exus-homepage-03', relation: 'match', catalog: ['Country selector defaults to correct region'] },
  { mamtaId: 'exus-homepage-04', relation: 'match', catalog: ['EMA regional news shown not FDA approvals'] },
  { mamtaId: 'exus-homepage-05', relation: 'match', catalog: ['Products section shows correct product list'] },
  { mamtaId: 'exus-homepage-06', relation: 'match', catalog: ['No US regulatory references on Ex-US pages'] },
  { mamtaId: 'exus-homepage-07', relation: 'match', catalog: ['SmPC and PIL used not PI on Ex-US pages'] },
  { mamtaId: 'exus-homepage-08', relation: 'match', catalog: ['EMA website linked not FDA on Ex-US pages'] },
  { mamtaId: 'exus-homepage-09', relation: 'gap', catalog: [],
    note: 'Regional phone format is covered under Forms, but nothing checks the Ex-US office address / contact block in the footer.' },
  { mamtaId: 'exus-homepage-10', relation: 'match', catalog: ['Cookie banner appears on first visit'] },
  { mamtaId: 'exus-homepage-11', relation: 'match', catalog: ['GDPR banner has granular category controls'] },
  { mamtaId: 'exus-homepage-12', relation: 'match', catalog: ['Homepage :: Profiling cookies off by default (Ex-US)'] },
  { mamtaId: 'exus-homepage-13', relation: 'near', catalog: ['Withdrawing consent as easy as giving it (UX)'],
    note: 'Close, but the catalog frames it as consent withdrawal rather than a persistent "Manage Cookie Preferences" entry point.' },

  // ---- Ex-US · Content ----
  { mamtaId: 'exus-content-01', relation: 'match', catalog: ['SmPC and PIL used not PI on Ex-US pages'] },
  { mamtaId: 'exus-content-02', relation: 'match', catalog: ['SmPC and PIL used not PI on Ex-US pages'] },
  { mamtaId: 'exus-content-03', relation: 'match', catalog: ['EMA website linked not FDA on Ex-US pages'] },
  { mamtaId: 'exus-content-04', relation: 'gap', catalog: [],
    note: 'No check looks for the "unable to provide drug information — contact your physician" regulatory disclaimer.' },
  { mamtaId: 'exus-content-05', relation: 'match', catalog: ['Drug indication statement is clinically accurate'] },
  { mamtaId: 'exus-content-06', relation: 'match', catalog: ['No US regulatory references on Ex-US pages'] },
  { mamtaId: 'exus-content-07', relation: 'match', catalog: ['Regional AE reporting reference present (Ex-US)'] },
  { mamtaId: 'exus-content-08', relation: 'match', catalog: ['No US regulatory references on Ex-US pages'] },
  { mamtaId: 'exus-content-09', relation: 'match', catalog: ['No US regulatory references on Ex-US pages'] },
  { mamtaId: 'exus-content-10', relation: 'gap', catalog: [],
    note: 'No check verifies the EU rare-disease prevalence threshold (1 in 2,000) is stated correctly.' },
  { mamtaId: 'exus-content-11', relation: 'match', catalog: ['References and footnotes correctly numbered'] },
  { mamtaId: 'exus-content-12', relation: 'match', catalog: ['Content :: No placeholder text on any page'] },
  { mamtaId: 'exus-content-13', relation: 'match', catalog: ['Privacy policy references correct regional law', 'Data subject rights covered in privacy policy'] },
  { mamtaId: 'exus-content-14', relation: 'match', catalog: ['DPO contact details in privacy policy (Ex-US)'] },
  { mamtaId: 'exus-content-15', relation: 'match', catalog: ['Right to erasure contact method present'] },
  { mamtaId: 'exus-content-16', relation: 'gap', catalog: [],
    note: 'No check asserts a Cookie Policy exists, let alone that it cites GDPR / the ePrivacy directive.' },
  { mamtaId: 'exus-content-17', relation: 'gap', catalog: [],
    note: 'Same gap as the US side — Terms of Use is absent from the catalog entirely.' },

  // ---- Ex-US · Performance ----
  { mamtaId: 'exus-performance-01', relation: 'near', catalog: ['LCP loads within 2.5 seconds'],
    note: 'The catalog check is not geo-scoped — a US-origin measurement would pass where the sheet intends an EU-origin one.' },
  { mamtaId: 'exus-performance-02', relation: 'near', catalog: ['INP interaction response under 200ms'],
    note: 'Same geo-scoping caveat as LCP: the catalog does not pin the measurement location.' },
  { mamtaId: 'exus-performance-03', relation: 'match', catalog: ['CLS layout shift score below 0.1'] },
  { mamtaId: 'exus-performance-04', relation: 'match', catalog: ['Zero JavaScript errors on page load'] },
  { mamtaId: 'exus-performance-05', relation: 'match', catalog: ['Unique title tag present on every page'] },
  { mamtaId: 'exus-performance-06', relation: 'match', catalog: ['hreflang tags correct for all served locales'] },
  { mamtaId: 'exus-performance-07', relation: 'match', catalog: ['Canonical tags point to correct regional URL'] },
  { mamtaId: 'exus-performance-08', relation: 'match', catalog: ['robots.txt does not block important pages'] },
  { mamtaId: 'exus-performance-09', relation: 'match', catalog: ['XML sitemap accessible'] },

  // ---- Ex-US · Navigation ----
  { mamtaId: 'exus-navigation-01', relation: 'match', catalog: ['All nav items render correctly for locale'] },
  { mamtaId: 'exus-navigation-02', relation: 'match', catalog: ['US-only content absent from Ex-US navigation'] },
  { mamtaId: 'exus-navigation-03', relation: 'match', catalog: ['Switching region routes to correct content'] },
  { mamtaId: 'exus-navigation-04', relation: 'match', catalog: ['Switching region routes to correct content'] },
  { mamtaId: 'exus-navigation-05', relation: 'match', catalog: ['No broken internal links (404 errors)'] },
  { mamtaId: 'exus-navigation-06', relation: 'match', catalog: ['HCP nav item present and routes correctly'] },

  // ---- Ex-US · Accessibility ----
  { mamtaId: 'exus-accessibility-01', relation: 'match', catalog: ['Colour contrast meets 4.5:1 ratio'] },
  { mamtaId: 'exus-accessibility-02', relation: 'match', catalog: ['All interactive elements keyboard accessible'] },
  { mamtaId: 'exus-accessibility-03', relation: 'match', catalog: ['Skip navigation link present'] },
  { mamtaId: 'exus-accessibility-04', relation: 'match', catalog: ['Axe scan shows zero critical violations'] },
  { mamtaId: 'exus-accessibility-05', relation: 'match', catalog: ['All product images have descriptive alt text'] },
  { mamtaId: 'exus-accessibility-06', relation: 'match', catalog: ['Modals trap focus and close with Escape key'] },

  // ---- Ex-US · Responsive ----
  { mamtaId: 'exus-responsive-01', relation: 'match', catalog: ['No layout overflow at 1440px desktop'] },
  { mamtaId: 'exus-responsive-02', relation: 'match', catalog: ['Navigation adapts correctly at 768px tablet'] },
  { mamtaId: 'exus-responsive-03', relation: 'gap', catalog: [],
    note: 'Same gap as the US side — no product-card reflow check at tablet width.' },
  { mamtaId: 'exus-responsive-04', relation: 'match', catalog: ['Homepage fully usable at 375px mobile'] },
  { mamtaId: 'exus-responsive-05', relation: 'match', catalog: ['Tap targets at least 44px tall for all CTAs'] },
  { mamtaId: 'exus-responsive-06', relation: 'match', catalog: ['PI and SmPC documents accessible on mobile'] },
  { mamtaId: 'exus-responsive-07', relation: 'match', catalog: ['Cookie consent banner usable on mobile'] },

  // ---- Ex-US · Security ----
  { mamtaId: 'exus-security-01', relation: 'match', catalog: ['SSL certificate covers all regional subpaths'] },
  { mamtaId: 'exus-security-02', relation: 'match', catalog: ['HTTP automatically redirects to HTTPS'] },
  { mamtaId: 'exus-security-03', relation: 'match', catalog: ['SSL certificate covers all regional subpaths'] },
  { mamtaId: 'exus-security-04', relation: 'match', catalog: ['No tracking cookies set before user consent'] },
  { mamtaId: 'exus-security-05', relation: 'match', catalog: ['Security :: Profiling cookies off by default (Ex-US)'] },
  { mamtaId: 'exus-security-06', relation: 'match', catalog: ['Each cookie category independently toggleable'] },
  { mamtaId: 'exus-security-07', relation: 'match', catalog: ['Withdrawing consent as easy as giving it'] },
  { mamtaId: 'exus-security-08', relation: 'match', catalog: ['No analytics firing before GDPR consent'] },
  { mamtaId: 'exus-security-09', relation: 'match', catalog: ['Privacy policy link in footer of every Ex-US page'] },

  // ---- Ex-US · Forms ----
  { mamtaId: 'exus-forms-01', relation: 'match', catalog: ['Contact form submits and shows confirmation'] },
  { mamtaId: 'exus-forms-02', relation: 'match', catalog: ['Required field validation fires on empty submission'] },
  { mamtaId: 'exus-forms-03', relation: 'match', catalog: ['HCP medical information form accessible and complete'] },
  { mamtaId: 'exus-forms-04', relation: 'match', catalog: ['Phone number uses correct regional format'] },
  { mamtaId: 'exus-forms-05', relation: 'match', catalog: ['Regional AE reporting reference present (Ex-US)'] },
  { mamtaId: 'exus-forms-06', relation: 'match', catalog: ['SmPC and PIL download links work (Ex-US)'] },
  { mamtaId: 'exus-forms-07', relation: 'match', catalog: ['SmPC and PIL download links work (Ex-US)'] },
  { mamtaId: 'exus-forms-08', relation: 'match', catalog: ['External links open in new tab with security attribute'] },
  { mamtaId: 'exus-forms-09', relation: 'match', catalog: ['EMA external link opens correctly (Ex-US)'] },

  // ---- Both · Geo Detection ----
  { mamtaId: 'both-geo-detection-01', relation: 'match', catalog: ['US IP automatically serves US version'] },
  { mamtaId: 'both-geo-detection-02', relation: 'match', catalog: ['UK IP automatically serves UK version'] },
  { mamtaId: 'both-geo-detection-03', relation: 'match', catalog: ['EU IP serves correct regional version'] },
  { mamtaId: 'both-geo-detection-04', relation: 'match', catalog: ['Visitor can override geo-detection manually'] },
  { mamtaId: 'both-geo-detection-05', relation: 'match', catalog: ['Geo-override preference persisted during session'] },
  { mamtaId: 'both-geo-detection-06', relation: 'gap', catalog: [],
    note: 'Geo Detection covers US/UK/EU IPs, override, persistence, leakage, 302s and redirect loops — but not the unsupported-region fallback.' },
  { mamtaId: 'both-geo-detection-07', relation: 'match', catalog: ['No US regulatory content visible on Ex-US pages'] },
  { mamtaId: 'both-geo-detection-08', relation: 'match', catalog: ['No Ex-US content visible on US pages'] },
  { mamtaId: 'both-geo-detection-09', relation: 'match', catalog: ['Geo-redirect uses 302 temporary not 301 permanent'] },
  { mamtaId: 'both-geo-detection-10', relation: 'match', catalog: ['hreflang tags correct for all served locales'] },
  { mamtaId: 'both-geo-detection-11', relation: 'match', catalog: ['No infinite redirect loop on direct regional URL'] },

  // ---- Both · GDPR Compliance ----
  { mamtaId: 'both-gdpr-compliance-01', relation: 'match', catalog: ['CMP loads before any tracking scripts fire'] },
  { mamtaId: 'both-gdpr-compliance-02', relation: 'gap', catalog: [],
    note: 'The catalog covers CMP load order, the TCF string, DataLayer events and analytics-after-consent — but not whether the banner blocks the page until a choice is made.' },
  { mamtaId: 'both-gdpr-compliance-03', relation: 'match', catalog: ['TCF consent string correctly set after acceptance'] },
  { mamtaId: 'both-gdpr-compliance-04', relation: 'match', catalog: ['Consent event fired in DataLayer after acceptance'] },
  { mamtaId: 'both-gdpr-compliance-05', relation: 'match', catalog: ['Analytics fires only after user gives consent'] },
  { mamtaId: 'both-gdpr-compliance-06', relation: 'match', catalog: ['Age gate or under-16 restriction in forms'] },
  { mamtaId: 'both-gdpr-compliance-07', relation: 'match', catalog: ['Right to erasure contact method present'] },
  { mamtaId: 'both-gdpr-compliance-08', relation: 'match', catalog: ['Data access request method present'] },
  { mamtaId: 'both-gdpr-compliance-09', relation: 'near', catalog: ['Data subject rights covered in privacy policy'],
    note: 'Erasure and access got their own catalog checks; portability is only implied by the generic data-subject-rights check.' },
  { mamtaId: 'both-gdpr-compliance-10', relation: 'near', catalog: ['Data subject rights covered in privacy policy'],
    note: 'As with portability — the right to object is not called out separately.' },
  { mamtaId: 'both-gdpr-compliance-11', relation: 'match', catalog: ['Data retention periods specified in policy'] },
  { mamtaId: 'both-gdpr-compliance-12', relation: 'match', catalog: ['Third-party data processors listed or described'] },
];
