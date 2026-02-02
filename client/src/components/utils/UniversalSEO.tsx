/**
 * UniversalSEO Component - Robust SEO optimization for main pages
 * Based on architect's approved design - composites SEOHead + JSON-LD @graph
 * 
 * Features:
 * - Uses SEOHead for base meta/OG/Twitter/canonical/hreflang
 * - Adds single JSON-LD @graph with Organization/LocalBusiness/Services/FAQ
 * - Complete cleanup on unmount (no residue)
 * - Bilingual support (EN/ES)
 * - AI platform optimization (ChatGPT, Claude, Perplexity)
 */

import { useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import SEOHead from './SEOHead';
import { getLocalizedOrganization, seoConfig, validateSEOConfig } from '@/lib/seo-config';

export interface ServiceInput {
  name: {
    en: string;
    es: string;
  };
  description: {
    en: string;
    es: string;
  };
  category?: string;
  price?: {
    amount: number;
    currency: string;
  };
}

export interface FAQInput {
  question: string;
  answer: string;
}

interface UniversalSEOProps {
  page: 'home' | 'services' | 'about' | 'contact' | 'projects';
  title: string;
  description: string;
  canonicalPath: string; // e.g., "/", "/services", "/about"
  image?: string;
  keywords?: string[];
  services?: ServiceInput[];
  faq?: FAQInput[];
}

/**
 * UniversalSEO - Robust SEO component for main pages
 * Uses SEOHead as base + adds structured data JSON-LD @graph
 */
export default function UniversalSEO({
  page,
  title,
  description,
  canonicalPath,
  image,
  keywords = [],
  services = [],
  faq = []
}: UniversalSEOProps) {
  const { language } = useLanguage();
  const jsonLdScriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Only proceed if config is valid
    if (!validateSEOConfig()) {
      console.warn('UniversalSEO: Invalid SEO configuration, skipping structured data');
      return;
    }

    const lang = language === 'es' ? 'es' : 'en';
    const orgData = getLocalizedOrganization(lang);
    const canonicalUrl = `${orgData.url}${canonicalPath}`;

    // Build JSON-LD @graph with Organization + LocalBusiness + Services + FAQ
    const jsonLdGraph: any[] = [];

    // 1. Organization Schema
    const organizationSchema = {
      "@type": "Organization",
      "@id": `${orgData.url}#organization`,
      name: orgData.name,
      ...(orgData.alternateName && { alternateName: orgData.alternateName }),
      url: orgData.url,
      logo: {
        "@type": "ImageObject",
        "@id": `${orgData.url}#logo`,
        url: orgData.logo,
        caption: `${orgData.name} Logo`
      },
      ...(orgData.sameAs.length > 0 && { sameAs: orgData.sameAs }),
      slogan: orgData.sloganText,
      knowsAbout: orgData.knowsAbout,
      inLanguage: orgData.inLanguageCode,
      areaServed: orgData.areaServed
    };
    jsonLdGraph.push(organizationSchema);

    // 2. LocalBusiness Schema (if enabled)
    if (seoConfig.localBusiness.enabled) {
      const localBusinessSchema = {
        "@type": seoConfig.localBusiness.type,
        "@id": `${orgData.url}#localbusiness`,
        name: orgData.name,
        url: orgData.url,
        logo: { "@id": `${orgData.url}#logo` }, // Reference to logo above
        areaServed: seoConfig.localBusiness.areaServed,
        inLanguage: orgData.inLanguageCode
      };
      jsonLdGraph.push(localBusinessSchema);
    }

    // 3. Service Schemas (if services provided)
    if (services.length > 0) {
      services.forEach((service, index) => {
        const serviceSchema: any = {
          "@type": "Service",
          "@id": `${orgData.url}#service-${index}`,
          name: service.name[lang],
          description: service.description[lang],
          provider: { "@id": `${orgData.url}#organization` }, // Reference to organization
          ...(service.category && { category: service.category })
        };

        // Add Offer only if real price data is provided
        if (service.price) {
          serviceSchema.offers = {
            "@type": "Offer",
            price: service.price.amount.toString(),
            priceCurrency: service.price.currency,
            priceSpecification: {
              "@type": "PriceSpecification",
              price: service.price.amount,
              priceCurrency: service.price.currency,
              valueAddedTaxIncluded: false
            }
          };
        }

        jsonLdGraph.push(serviceSchema);
      });
    }

    // 4. FAQ Schema (if FAQ provided and this is appropriate page)
    if (faq.length > 0 && (page === 'home' || page === 'services')) {
      const faqSchema = {
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        mainEntity: faq.map((item, index) => ({
          "@type": "Question",
          "@id": `${canonicalUrl}#faq-${index}`,
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer
          }
        }))
      };
      jsonLdGraph.push(faqSchema);
    }

    // Create and inject JSON-LD script
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'seo-universal-graph'; // Unique ID to prevent collisions
    jsonLdScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": jsonLdGraph
    });

    document.head.appendChild(jsonLdScript);
    jsonLdScriptRef.current = jsonLdScript;

    // Cleanup function - remove JSON-LD script
    return () => {
      if (jsonLdScriptRef.current && jsonLdScriptRef.current.parentNode) {
        jsonLdScriptRef.current.parentNode.removeChild(jsonLdScriptRef.current);
        jsonLdScriptRef.current = null;
      }
    };
  }, [page, title, description, canonicalPath, language, services, faq]);

  // Compose with SEOHead for base meta tags, OG, Twitter, canonical, hreflang
  // SEOHead handles all the complex head state management and cleanup
  const canonicalUrl = `${getLocalizedOrganization(language === 'es' ? 'es' : 'en').url}${canonicalPath}`;
  
  return (
    <SEOHead
      title={title}
      description={description}
      type="website" // Main pages are websites, not articles
      image={image}
      canonicalUrl={canonicalUrl}
      keywords={keywords}
    />
  );
}