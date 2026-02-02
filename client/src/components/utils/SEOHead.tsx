import { useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SEOHeadProps {
  title: string;
  description: string;
  type?: 'website' | 'article';
  image?: string;
  url?: string;
  author?: string;
  authorUrl?: string;
  datePublished?: string;
  dateModified?: string;
  keywords?: string[];
  canonicalUrl?: string;
  published?: boolean; // Controls robots tag for drafts
}

interface JsonLdBlogPosting {
  "@context": string;
  "@type": string;
  headline: string;
  description: string;
  image?: string;
  author?: {
    "@type": string;
    name: string;
    url?: string;
  };
  publisher: {
    "@type": string;
    name: string;
    logo: {
      "@type": string;
      url: string;
    };
  };
  datePublished?: string;
  dateModified?: string;
  mainEntityOfPage: {
    "@type": string;
    "@id": string;
  };
  inLanguage: string;
  keywords?: string;
}

interface HeadState {
  originalTitle: string;
  originalMetas: Map<string, string>;
  originalLinks: Map<string, string>;
  originalLang: string;
}

/**
 * SEOHead component for blog-specific SEO optimization
 * Safely manages document head with complete cleanup on unmount
 * Designed specifically for blog pages with no impact on other parts of the application
 */
export default function SEOHead({
  title,
  description,
  type = 'article',
  image = '/images/TOBAIS_Banner1_webp.webp',
  url,
  author,
  authorUrl,
  datePublished,
  dateModified,
  keywords = [],
  canonicalUrl,
  published = true
}: SEOHeadProps) {
  const { language } = useLanguage();
  const headStateRef = useRef<HeadState | null>(null);
  
  useEffect(() => {
    // Store original head state for cleanup
    const originalTitle = document.title;
    const originalMetas = new Map<string, string>();
    const originalLinks = new Map<string, string>();
    const originalLang = document.documentElement.lang;
    
    // Store existing meta tags
    const metaSelectors = [
      'meta[name="description"]',
      'meta[name="keywords"]',
      'meta[name="robots"]',
      'meta[name="author"]',
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[property="og:type"]',
      'meta[property="og:url"]',
      'meta[property="og:image"]',
      'meta[property="og:image:width"]',
      'meta[property="og:image:height"]',
      'meta[property="og:site_name"]',
      'meta[property="og:locale"]',
      'meta[property="og:locale:alternate"]',
      'meta[property="article:published_time"]',
      'meta[property="article:modified_time"]',
      'meta[property="article:author"]',
      'meta[property="article:tag"]',
      'meta[name="twitter:card"]',
      'meta[name="twitter:title"]',
      'meta[name="twitter:description"]',
      'meta[name="twitter:image"]',
      'meta[name="twitter:site"]'
    ];
    
    metaSelectors.forEach(selector => {
      const meta = document.querySelector(selector) as HTMLMetaElement;
      if (meta) {
        const key = meta.getAttribute('name') || meta.getAttribute('property') || '';
        originalMetas.set(key, meta.content);
      }
    });
    
    // Store existing link tags
    const linkSelectors = [
      'link[rel="canonical"]',
      'link[rel="alternate"][hreflang="en"]',
      'link[rel="alternate"][hreflang="es"]',
      'link[rel="alternate"][hreflang="x-default"]'
    ];
    
    linkSelectors.forEach(selector => {
      const link = document.querySelector(selector) as HTMLLinkElement;
      if (link) {
        const key = `${link.rel}-${link.getAttribute('hreflang') || 'default'}`;
        originalLinks.set(key, link.href);
      }
    });
    
    headStateRef.current = { originalTitle, originalMetas, originalLinks, originalLang };
    
    // Generate URLs and paths
    const currentUrl = url || window.location.href;
    const cleanCanonical = canonicalUrl || currentUrl.split('?')[0]; // Strip query params
    const fullTitle = `${title} | TOBAIS - AI-Powered Digital Marketing`;
    const ogImage = image.startsWith('http') ? image : `${window.location.origin}${image}`;
    const publisherLogo = `${window.location.origin}/images/TOBAIS_NewLogoL_webp.webp`;
    
    // Helper function to set or update meta tag
    const setMetaTag = (name: string, content: string, attribute = 'name') => {
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };
    
    // Helper function to set or update link tag with hreflang support
    const setLinkTag = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
      let link = document.querySelector(selector) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        if (hreflang) {
          link.setAttribute('hreflang', hreflang);
        }
        document.head.appendChild(link);
      }
      link.href = href;
    };
    
    // Update document title
    document.title = fullTitle;
    
    // Basic meta tags
    setMetaTag('description', description);
    if (keywords.length > 0) {
      setMetaTag('keywords', keywords.join(', '));
    }
    setMetaTag('robots', published ? 'index, follow' : 'noindex, nofollow');
    setMetaTag('author', author || 'TOBAIS Team');
    
    // Open Graph tags
    setMetaTag('og:title', fullTitle, 'property');
    setMetaTag('og:description', description, 'property');
    setMetaTag('og:type', type, 'property');
    setMetaTag('og:url', cleanCanonical, 'property');
    setMetaTag('og:image', ogImage, 'property');
    setMetaTag('og:image:width', '1200', 'property');
    setMetaTag('og:image:height', '630', 'property');
    setMetaTag('og:site_name', 'TOBAIS', 'property');
    setMetaTag('og:locale', language === 'es' ? 'es_ES' : 'en_US', 'property');
    setMetaTag('og:locale:alternate', language === 'es' ? 'en_US' : 'es_ES', 'property');
    
    // Article-specific Open Graph tags
    if (type === 'article') {
      if (datePublished) setMetaTag('article:published_time', datePublished, 'property');
      if (dateModified) setMetaTag('article:modified_time', dateModified, 'property');
      if (author) setMetaTag('article:author', author, 'property');
      if (keywords.length > 0) {
        keywords.forEach(keyword => {
          // For multiple tags, we need to create multiple elements
          const existingTags = document.querySelectorAll('meta[property="article:tag"]');
          const hasKeyword = Array.from(existingTags).some(tag => (tag as HTMLMetaElement).content === keyword.trim());
          if (!hasKeyword) {
            const tagMeta = document.createElement('meta');
            tagMeta.setAttribute('property', 'article:tag');
            tagMeta.content = keyword.trim();
            document.head.appendChild(tagMeta);
          }
        });
      }
    }
    
    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage);
    setMetaTag('twitter:site', '@tobaisagency');
    
    // Canonical URL
    setLinkTag('canonical', cleanCanonical);
    
    // Complete alternate language links
    const baseUrl = cleanCanonical.replace(/(\?lang=\w+)|(\?.*&lang=\w+)|(&lang=\w+)/g, '');
    setLinkTag('alternate', `${baseUrl}?lang=en`, 'en');
    setLinkTag('alternate', `${baseUrl}?lang=es`, 'es');
    setLinkTag('alternate', baseUrl, 'x-default');
    
    // JSON-LD structured data for blog posts
    if (type === 'article') {
      let jsonLdScript = document.querySelector('script[type="application/ld+json"]#blog-post-schema') as HTMLScriptElement;
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.type = 'application/ld+json';
        jsonLdScript.id = 'blog-post-schema';
        document.head.appendChild(jsonLdScript);
      }
      
      const jsonLdData: JsonLdBlogPosting = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: title,
        description: description,
        image: ogImage,
        author: {
          "@type": "Person",
          name: author || "TOBAIS Team",
          ...(authorUrl && { url: authorUrl })
        },
        publisher: {
          "@type": "Organization",
          name: "TOBAIS",
          logo: {
            "@type": "ImageObject",
            url: publisherLogo
          }
        },
        datePublished: datePublished || new Date().toISOString(),
        dateModified: dateModified || datePublished || new Date().toISOString(),
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": cleanCanonical
        },
        inLanguage: language === 'es' ? 'es-ES' : 'en-US',
        ...(keywords.length > 0 && { keywords: keywords.join(', ') })
      };
      
      jsonLdScript.textContent = JSON.stringify(jsonLdData);
    }
    
    // Update HTML lang attribute
    document.documentElement.lang = language === 'es' ? 'es' : 'en';
    
    // Cleanup function - restore original head state
    return () => {
      if (!headStateRef.current) return;
      
      const { originalTitle, originalMetas, originalLinks, originalLang } = headStateRef.current;
      
      // Restore title
      document.title = originalTitle;
      
      // Restore HTML lang
      document.documentElement.lang = originalLang;
      
      // Remove or restore meta tags
      const metasToRestore = [
        'description', 'keywords', 'robots', 'author',
        'og:title', 'og:description', 'og:type', 'og:url', 'og:image',
        'og:image:width', 'og:image:height', 'og:site_name', 'og:locale', 'og:locale:alternate',
        'article:published_time', 'article:modified_time', 'article:author',
        'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:site'
      ];
      
      metasToRestore.forEach(name => {
        const selector = name.startsWith('og:') || name.startsWith('article:') ? 
          `meta[property="${name}"]` : `meta[name="${name}"]`;
        const meta = document.querySelector(selector) as HTMLMetaElement;
        
        if (meta) {
          if (originalMetas.has(name)) {
            meta.content = originalMetas.get(name)!;
          } else {
            meta.parentNode?.removeChild(meta);
          }
        }
      });
      
      // Remove article:tag metas (these are multiple elements)
      const articleTags = document.querySelectorAll('meta[property="article:tag"]');
      articleTags.forEach(tag => tag.parentNode?.removeChild(tag));
      
      // Restore or remove link tags
      const linksToRestore = [
        'canonical-default',
        'alternate-en',
        'alternate-es',
        'alternate-x-default'
      ];
      
      linksToRestore.forEach(key => {
        const [rel, hreflang] = key.split('-');
        const selector = hreflang === 'default' ? 
          `link[rel="${rel}"]:not([hreflang])` : 
          `link[rel="${rel}"][hreflang="${hreflang}"]`;
        const link = document.querySelector(selector) as HTMLLinkElement;
        
        if (link) {
          if (originalLinks.has(key)) {
            link.href = originalLinks.get(key)!;
          } else {
            link.parentNode?.removeChild(link);
          }
        }
      });
      
      // Remove JSON-LD script
      const jsonLdScript = document.querySelector('script[type="application/ld+json"]#blog-post-schema');
      if (jsonLdScript && jsonLdScript.parentNode) {
        jsonLdScript.parentNode.removeChild(jsonLdScript);
      }
    };
  }, [title, description, type, image, url, author, authorUrl, datePublished, dateModified, keywords, canonicalUrl, published, language]);
  
  return null; // This component doesn't render anything visible
}