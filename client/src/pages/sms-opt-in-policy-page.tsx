import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import ScrollLink from "@/components/utils/ScrollLink";

export default function SMSOptInPolicyPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-card rounded-lg shadow-lg p-8">
            <h1 className="text-4xl font-bold text-foreground mb-8">
              {t("smsOptIn.title")}
            </h1>
            
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p className="text-lg">
                  {t("smsOptIn.intro")}
                </p>
                
                <p className="mb-6">
                  {t("smsOptIn.consent")}
                </p>
                
                <div className="space-y-4 text-base">
                  <p className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>{t("smsOptIn.keyPoints.noUnsolicited")}</span>
                  </p>
                  <p className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>{t("smsOptIn.keyPoints.optOut")}</span>
                  </p>
                  <p className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>
                      {t("smsOptIn.keyPoints.privacyPolicy")}{" "}
                      <ScrollLink 
                        href="/privacy-policy" 
                        className="text-primary hover:underline font-medium"
                      >
                        {t("smsOptIn.privacyPolicyLink")}
                      </ScrollLink>.
                    </span>
                  </p>
                </div>
                
                <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <h2 className="text-xl font-semibold text-foreground mb-3">
                    {t("smsOptIn.contact.title")}
                  </h2>
                  <p>
                    {t("smsOptIn.contact.description")}{" "}
                    <a 
                      href="mailto:sales@tobais.com" 
                      className="text-primary hover:underline font-medium"
                    >
                      sales@tobais.com
                    </a>.
                  </p>
                </div>
                
                <div className="mt-8 text-center">
                  <ScrollLink 
                    href="/contact"
                    className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    {t("smsOptIn.consentButton")}
                  </ScrollLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}