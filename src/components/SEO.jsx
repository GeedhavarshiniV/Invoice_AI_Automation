import { Helmet } from "react-helmet-async";

/**
 * Reusable per-page SEO component.
 *
 * Usage:
 *   <SEO
 *     title="Ledgerly — AI Invoice Automation"
 *     description="..."
 *     path="/"
 *     schema={someJsonLdObject}      // optional, can be an object or array of objects
 *   />
 *
 * - title/description/canonical/OG/Twitter tags => classic SEO
 * - `schema` prop => injected as JSON-LD <script type="application/ld+json">,
 *   which is what AI answer engines (AEO) and generative engines (GEO) read
 *   to understand and cite page content directly.
 */
const SITE_NAME = "Ledgerly";
const SITE_URL = "https://www.ledgerly.app"; // TODO: replace with your real production domain
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`; // TODO: add an actual 1200x630 image to /public

export default function SEO({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
  schema = null,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — AI-Powered Invoice Automation`;
  const canonicalUrl = `${SITE_URL}${path}`;

  // Allow either a single schema object or an array of schema objects.
  const schemas = schema ? (Array.isArray(schema) ? schema : [schema]) : [];

  return (
    <Helmet>
      {/* Primary SEO tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph (Facebook, LinkedIn, WhatsApp previews, etc.) */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />

      {/* Twitter / X card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD structured data — powers AEO (AI answer engines like
          Google AI Overviews, Perplexity) and GEO (generative engines
          citing/summarizing this page). */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
}

export { SITE_NAME, SITE_URL };
