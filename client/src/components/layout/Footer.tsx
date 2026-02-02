import { useLanguage } from "@/contexts/LanguageContext";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaGlobe, FaWhatsapp } from "react-icons/fa";
import { Shield } from "lucide-react";
import tobaisLogo from "@/assets/tobais-logo.png";
import SecureLink from "@/lib/secure-link";
import ScrollLink from "@/components/utils/ScrollLink";

export default function Footer() {
  const { t, language, toggleLanguage } = useLanguage();
  
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center overflow-hidden border-2 border-primary-500 mr-3">
                <img 
                  src={tobaisLogo} 
                  alt="TOBAIS Logo" 
                  className="h-12 w-12 object-cover" 
                />
              </div>
              <div className="text-2xl font-['Poppins'] font-bold text-white">TOBAIS</div>
            </div>
            <p className="text-gray-400 mb-4">
              {t("footer.description")}
            </p>
            <div className="flex space-x-4">
              <SecureLink 
                href="https://www.facebook.com/profile.php?id=638325699357067" 
                className="text-gray-400 hover:text-white transition-colors" 
                aria-label="Facebook"
              >
                <FaFacebookF />
              </SecureLink>
              <SecureLink 
                href="https://www.instagram.com/tobais.official/" 
                className="text-gray-400 hover:text-white transition-colors" 
                aria-label="Instagram"
              >
                <FaInstagram />
              </SecureLink>
              <SecureLink 
                href="https://wa.me/17042071760" 
                className="text-gray-400 hover:text-white transition-colors" 
                aria-label="WhatsApp"
              >
                <FaWhatsapp />
              </SecureLink>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <FaLinkedinIn />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">{t("footer.services")}</h3>
            <ul className="space-y-2 text-gray-400">
              <li><ScrollLink href="/services" className="hover:text-white transition-colors">{t("services.webDesign.title")}</ScrollLink></li>
              <li><ScrollLink href="/services" className="hover:text-white transition-colors">{t("services.automation.title")}</ScrollLink></li>
              <li><ScrollLink href="/services" className="hover:text-white transition-colors">{t("services.branding.title")}</ScrollLink></li>
              <li><ScrollLink href="/services" className="hover:text-white transition-colors">{t("services.socialMedia.title")}</ScrollLink></li>
              <li><ScrollLink href="/services" className="hover:text-white transition-colors">{t("services.accounting.title")}</ScrollLink></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">{t("footer.company")}</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <ScrollLink href="/about" className="hover:text-white transition-colors">
                  {t("footer.aboutUs")}
                </ScrollLink>
              </li>
              <li><ScrollLink href="/blog" className="hover:text-white transition-colors">{t("footer.blog")}</ScrollLink></li>
              <li><ScrollLink href="/careers" className="hover:text-white transition-colors">{t("footer.careers")}</ScrollLink></li>
              <li>
                <ScrollLink href="/contact" className="hover:text-white transition-colors">
                  {t("footer.contact")}
                </ScrollLink>
              </li>
              <li>
                <ScrollLink 
                  href="/auth" 
                  className="hover:text-purple-400 transition-colors text-xs flex items-center group"
                >
                  <Shield className="w-3 h-3 mr-1 group-hover:text-purple-400" />
                  Staff Portal
                </ScrollLink>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">{t("footer.legal")}</h3>
            <ul className="space-y-2 text-gray-400">
              <li><ScrollLink href="/privacy-policy" className="hover:text-white transition-colors">{t("footer.privacyPolicy")}</ScrollLink></li>
              <li><ScrollLink href="/terms-service" className="hover:text-white transition-colors">{t("footer.termsOfService")}</ScrollLink></li>
              <li><ScrollLink href="/opt-in-policy" className="hover:text-white transition-colors">{t("footer.smsOptInPolicy")}</ScrollLink></li>
              <li><ScrollLink href="/cookie-policy" className="hover:text-white transition-colors">{t("footer.cookiePolicy")}</ScrollLink></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            {t("footer.copyright")}
          </p>
          
          <div className="mt-4 md:mt-0 flex items-center">
            <button 
              onClick={toggleLanguage}
              className="flex items-center text-gray-400 hover:text-white transition-colors mr-4"
              aria-label="Toggle language"
            >
              <FaGlobe className="mr-2" />
              <span>{t("footer.language")}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
