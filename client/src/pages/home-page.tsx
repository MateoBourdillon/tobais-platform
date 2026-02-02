import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import ServiceCards from "@/components/home/ServiceCards";
import AboutSection from "@/components/home/AboutSection";
import OurProcess from "@/components/home/OurProcess";
import AISolutions from "@/components/home/AISolutions";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import Stats from "@/components/home/Stats";
import Testimonials from "@/components/home/Testimonials";
import FAQ from "@/components/home/FAQ";
import ContactSection from "@/components/home/ContactSection";
import CTASection from "@/components/home/CTASection";
import UniversalSEO from "@/components/utils/UniversalSEO";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HomePage() {
  const { t, language } = useLanguage();
  
  // TOBAIS services data for structured markup - using REAL translations for both locales
  const services = [
    {
      name: {
        en: "Web Design",
        es: "Diseño Web"
      },
      description: {
        en: "Custom responsive websites that attract and convert visitors with modern designs.",
        es: "Sitios web responsivos personalizados que atraen y convierten visitantes con diseños modernos."
      },
      category: "WebDesign"
    },
    {
      name: {
        en: "Automation",
        es: "Automatización"
      },
      description: {
        en: "Streamline your business processes with AI-powered automation solutions.",
        es: "Optimice los procesos de su empresa con soluciones de automatización impulsadas por IA."
      },
      category: "ProcessAutomation"
    },
    {
      name: {
        en: "Branding",
        es: "Branding"
      },
      description: {
        en: "Create a memorable brand identity that resonates with your target audience.",
        es: "Cree una identidad de marca memorable que resuene con su audiencia objetivo."
      },
      category: "BrandingServices"
    },
    {
      name: {
        en: "Social Media Marketing",
        es: "Marketing en Redes Sociales"
      },
      description: {
        en: "Engage with your audience through strategic social media marketing campaigns.",
        es: "Involúcrese con su audiencia a través de campañas estratégicas de marketing en redes sociales."
      },
      category: "SocialMediaMarketing"
    }
  ];

  // FAQ data from REAL translations - typed safely for structured markup
  const faqItems = [
    {
      question: language === 'es' 
        ? "¿Cuánto tiempo toma completar un sitio web?"
        : "How long does it take to complete a website?",
      answer: language === 'es'
        ? "Normalmente, nuestros proyectos de diseño web tardan entre 2 y 6 semanas dependiendo de la complejidad. Los sitios sencillos pueden completarse en tan solo 2 semanas, mientras que proyectos más complejos con características personalizadas pueden tardar entre 4 y 6 semanas."
        : "Typically, our web design projects take 2-6 weeks depending on complexity. Simple sites can be completed in as little as 2 weeks, while more complex projects with custom features may take 4-6 weeks."
    },
    {
      question: language === 'es'
        ? "¿Ofrecen servicios de mantenimiento?"
        : "Do you offer maintenance services?",
      answer: language === 'es'
        ? "Sí, ofrecemos paquetes de mantenimiento continuo para mantener su sitio web seguro, actualizado y funcionando sin problemas. Nuestros planes de mantenimiento mensual incluyen actualizaciones regulares, verificaciones de seguridad, copias de seguridad y soporte técnico."
        : "Yes, we offer ongoing maintenance packages to keep your website secure, updated, and running smoothly. Our monthly maintenance plans include regular updates, security checks, backups, and technical support."
    },
    {
      question: language === 'es'
        ? "¿Qué servicios de automatización proporcionan?"
        : "What automation services do you provide?",
      answer: language === 'es'
        ? "Nuestros servicios de automatización incluyen automatización de flujos de trabajo, automatización de marketing por correo electrónico, programación de redes sociales, gestión de datos de clientes, integración de CRM y creación de contenido impulsada por IA. Personalizamos soluciones basadas en sus necesidades comerciales específicas."
        : "Our automation services include workflow automation, email marketing automation, social media scheduling, customer data management, CRM integration, and AI-powered content creation. We customize solutions based on your specific business needs."
    },
    {
      question: language === 'es'
        ? "¿Trabajan con clientes tanto en EE. UU. como en América Latina?"
        : "Do you work with clients in both the U.S. and Latin America?",
      answer: language === 'es'
        ? "Sí, atendemos con orgullo a clientes tanto en U.S. como en toda América Latina. Nuestro equipo es completamente bilingüe (inglés/español) y está familiarizado con los panoramas comerciales en ambas regiones, lo que nos permite proporcionar soluciones culturalmente relevantes."
        : "Yes, we proudly serve clients in both the U.S. and throughout Latin America. Our team is fully bilingual (English/Spanish) and familiar with the business landscapes in both regions, allowing us to provide culturally relevant solutions."
    }
  ];

  return (
    <>
      <UniversalSEO
        page="home"
        title={t("hero.title")}
        description={t("hero.subtitle")}
        canonicalPath="/"
        keywords={["AI marketing", "digital agency", "web design", "automation", "TOBAIS", "U.S.", "Latin America", "LATAM"]}
        services={services}
        faq={faqItems}
      />
      <Navbar />
      <main className="overflow-hidden">
        <Hero />
        <Stats />
        <ServiceCards />
        <OurProcess />
        <AboutSection />
        <AISolutions />
        <FeaturedProjects />
        <Testimonials />
        <FAQ />
        <ContactSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
