import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import PageLayout from '@/components/layout/PageLayout';

const CookiePolicyPage: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-primary-600">{language === 'en' ? 'Cookie Policy' : 'Política de Cookies'}</h1>
        
        <div className="prose prose-lg dark:prose-invert mx-auto">
          {language === 'en' ? (
            <>
              <p className="text-lg mb-6">Last updated: April 06, 2025</p>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
                <p>
                  Cookies are small pieces of text sent to your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.
                </p>
                <p>
                  Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your personal computer or mobile device when you go offline, while session cookies are deleted as soon as you close your web browser.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. How TOBAIS Uses Cookies</h2>
                <p>
                  When you use and access our Service, we may place a number of cookie files in your web browser.
                </p>
                <p>We use cookies for the following purposes:</p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>
                    <strong>Essential Cookies:</strong> We may use essential cookies to authenticate users and prevent fraudulent use of user accounts.
                  </li>
                  <li>
                    <strong>Preference Cookies:</strong> We may use preference cookies to remember information that changes the way the Service behaves or looks, such as your preferred language or the region you are in.
                  </li>
                  <li>
                    <strong>Analytics Cookies:</strong> We may use analytics cookies to track information about how the Service is used so that we can make improvements. We may also use analytics cookies to test new advertisements, pages, features or new functionality of the Service to see how our users react to them.
                  </li>
                </ul>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Third-Party Cookies</h2>
                <p>
                  In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Service, deliver advertisements on and through the Service, and so on.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. What Are Your Choices Regarding Cookies</h2>
                <p>
                  If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser.
                </p>
                <p>
                  Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer, you may not be able to store your preferences, and some of our pages might not display properly.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. How to Manage Cookies</h2>
                <p>For the Chrome web browser, please visit this page from Google:</p>
                <p><a href="https://support.google.com/accounts/answer/32050" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">https://support.google.com/accounts/answer/32050</a></p>
                
                <p className="mt-4">For the Internet Explorer web browser, please visit this page from Microsoft:</p>
                <p><a href="http://support.microsoft.com/kb/278835" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">http://support.microsoft.com/kb/278835</a></p>
                
                <p className="mt-4">For the Firefox web browser, please visit this page from Mozilla:</p>
                <p><a href="https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored</a></p>
                
                <p className="mt-4">For the Safari web browser, please visit this page from Apple:</p>
                <p><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac</a></p>
                
                <p className="mt-4">For any other web browser, please visit your web browser's official web pages.</p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
                <p>
                  If you have any questions about our Cookie Policy, please contact us at: <a href="mailto:sales@tobais.com" className="text-primary-600 hover:underline">sales@tobais.com</a>
                </p>
              </section>
            </>
          ) : (
            <>
              <p className="text-lg mb-6">Última actualización: 06 de abril, 2025</p>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. ¿Qué Son Las Cookies?</h2>
                <p>
                  Las cookies son pequeños archivos de texto que los sitios web que visita envían a su navegador web. Un archivo de cookie se almacena en su navegador web y permite que el Servicio o un tercero lo reconozca y facilite su próxima visita y haga que el Servicio sea más útil para usted.
                </p>
                <p>
                  Las cookies pueden ser cookies "persistentes" o de "sesión". Las cookies persistentes permanecen en su computadora personal o dispositivo móvil cuando se desconecta, mientras que las cookies de sesión se eliminan tan pronto como cierra su navegador web.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Cómo TOBAIS Utiliza Las Cookies</h2>
                <p>
                  Cuando utiliza y accede a nuestro Servicio, podemos colocar varios archivos de cookies en su navegador web.
                </p>
                <p>Utilizamos cookies para los siguientes propósitos:</p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>
                    <strong>Cookies Esenciales:</strong> Podemos utilizar cookies esenciales para autenticar usuarios y prevenir el uso fraudulento de cuentas de usuario.
                  </li>
                  <li>
                    <strong>Cookies de Preferencia:</strong> Podemos utilizar cookies de preferencia para recordar información que cambia la forma en que el Servicio se comporta o se ve, como su idioma preferido o la región en la que se encuentra.
                  </li>
                  <li>
                    <strong>Cookies Analíticas:</strong> Podemos utilizar cookies analíticas para rastrear información sobre cómo se utiliza el Servicio para poder realizar mejoras. También podemos utilizar cookies analíticas para probar nuevos anuncios, páginas, características o nueva funcionalidad del Servicio para ver cómo reaccionan nuestros usuarios.
                  </li>
                </ul>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Cookies de Terceros</h2>
                <p>
                  Además de nuestras propias cookies, también podemos utilizar varias cookies de terceros para informar las estadísticas de uso del Servicio, entregar anuncios en y a través del Servicio, etc.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. ¿Cuáles Son Sus Opciones Con Respecto a Las Cookies?</h2>
                <p>
                  Si desea eliminar cookies o instruir a su navegador web para que elimine o rechace cookies, visite las páginas de ayuda de su navegador web.
                </p>
                <p>
                  Sin embargo, tenga en cuenta que si elimina las cookies o se niega a aceptarlas, es posible que no pueda utilizar todas las funciones que ofrecemos, que no pueda guardar sus preferencias y que algunas de nuestras páginas no se muestren correctamente.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Cómo Gestionar las Cookies</h2>
                <p>Para el navegador web Chrome, visite esta página de Google:</p>
                <p><a href="https://support.google.com/accounts/answer/32050" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">https://support.google.com/accounts/answer/32050</a></p>
                
                <p className="mt-4">Para el navegador web Internet Explorer, visite esta página de Microsoft:</p>
                <p><a href="http://support.microsoft.com/kb/278835" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">http://support.microsoft.com/kb/278835</a></p>
                
                <p className="mt-4">Para el navegador web Firefox, visite esta página de Mozilla:</p>
                <p><a href="https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored</a></p>
                
                <p className="mt-4">Para el navegador web Safari, visite esta página de Apple:</p>
                <p><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac</a></p>
                
                <p className="mt-4">Para cualquier otro navegador web, visite las páginas web oficiales de su navegador web.</p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Contáctenos</h2>
                <p>
                  Si tiene alguna pregunta sobre nuestra Política de Cookies, comuníquese con nosotros en: <a href="mailto:sales@tobais.com" className="text-primary-600 hover:underline">sales@tobais.com</a>
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default CookiePolicyPage;