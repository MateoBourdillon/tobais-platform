/**
 * SEO Configuration - Centralized company data for structured markup
 * Based on architect's robust design - no hardcoded data, real company info only
 */

export interface SEOConfig {
  organization: {
    name: string;
    alternateName?: string;
    url: string;
    logo: string;
    sameAs: string[];
    slogan: {
      en: string;
      es: string;
    };
    knowsAbout: string[];
    inLanguage: string[];
    areaServed: string[];
  };
  localBusiness: {
    enabled: boolean;
    type: 'LocalBusiness' | 'ProfessionalService';
    areaServed: string[]; // Fixed: aligned with Schema.org standard
  };
  contact: {
    email: string;
    website: string;
  };
}

/**
 * Localized organization data interface - maintains type consistency
 */
export interface LocalizedOrganization {
  name: string;
  alternateName?: string;
  url: string;
  logo: string;
  sameAs: string[];
  sloganText: string; // Localized slogan as string
  knowsAbout: string[];
  inLanguageCode: string; // Single language code for current locale
  areaServed: string[];
}

/**
 * Get canonical base URL at runtime - handles different environments
 */
function getCanonicalBase(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://tobais.com'; // fallback for SSR
}

/**
 * TOBAIS Company Configuration
 * Only real, verified company information - no fabricated data
 */
export const seoConfig: SEOConfig = {
  organization: {
    name: "TOBAIS",
    alternateName: "Technology on Business Artificial Intelligence Solutions",
    url: getCanonicalBase(),
    logo: `${getCanonicalBase()}/images/TOBAIS_NewLogoL_webp.webp`,
    sameAs: [
      // Only include verified social media profiles
      // Add when available: LinkedIn, Twitter, Instagram, etc.
    ],
    slogan: {
      en: "AI-Powered Digital Marketing Solutions",
      es: "Soluciones de Marketing Digital Impulsadas por IA"
    },
    knowsAbout: [
      "Web Design",
      "Digital Marketing", 
      "Artificial Intelligence",
      "Marketing Automation",
      "Social Media Marketing",
      "Branding",
      "Business Analytics",
      "Content Creation",
      "SEO Optimization",
      "E-commerce Solutions"
    ],
    inLanguage: ["en-US", "es-ES", "es-MX"],
    areaServed: [
      "United States",
      "Latin America", 
      "Mexico",
      "Central America",
      "South America"
    ]
  },
  localBusiness: {
    enabled: true, // Enable LocalBusiness schema
    type: 'ProfessionalService',
    areaServed: [ // Fixed: aligned with Schema.org standard
      "United States",
      "Latin America"
    ]
  },
  contact: {
    email: "info@tobais.com",
    website: getCanonicalBase()
  }
};

/**
 * Service Schema Configuration
 * Maps to actual TOBAIS services from database/translations
 */
export interface ServiceConfig {
  name: {
    en: string;
    es: string;
  };
  description: {
    en: string;
    es: string;
  };
  category: string;
  provider: string; // Organization name
}

/**
 * Helper function to get localized organization data - maintains type consistency
 */
export function getLocalizedOrganization(language: 'en' | 'es' = 'en'): LocalizedOrganization {
  const { organization } = seoConfig;
  
  return {
    name: organization.name,
    alternateName: organization.alternateName,
    url: organization.url,
    logo: organization.logo,
    sameAs: [...organization.sameAs], // Clone array to avoid mutations
    sloganText: organization.slogan[language],
    knowsAbout: [...organization.knowsAbout], // Clone array 
    inLanguageCode: language === 'es' ? 'es-ES' : 'en-US',
    areaServed: getLocalizedServiceArea(language)
  };
}

/**
 * Helper function to get localized service area
 */
export function getLocalizedServiceArea(language: 'en' | 'es' = 'en'): string[] {
  if (language === 'es') {
    return [
      "Estados Unidos",
      "América Latina",
      "México", 
      "Centroamérica",
      "Sudamérica"
    ];
  }
  return [...seoConfig.organization.areaServed]; // Clone to avoid mutations
}

/**
 * Enhanced validation function with format checking
 */
export function validateSEOConfig(): boolean {
  const { organization, contact } = seoConfig;
  
  // Basic presence check
  const required = [
    organization.name,
    organization.url,
    organization.logo,
    organization.slogan.en,
    organization.slogan.es,
    contact.email,
    contact.website
  ];
  
  const hasRequiredFields = required.every(field => field && field.length > 0);
  
  // Format validation
  const urlPattern = /^https?:\/\/.+/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const hasValidUrls = urlPattern.test(organization.url) && 
                       urlPattern.test(organization.logo) &&
                       urlPattern.test(contact.website);
  
  const hasValidEmail = emailPattern.test(contact.email);
  
  // Array validation
  const hasValidArrays = organization.inLanguage.length > 0 && 
                        organization.areaServed.length > 0 &&
                        organization.knowsAbout.length > 0;
  
  return hasRequiredFields && hasValidUrls && hasValidEmail && hasValidArrays;
}