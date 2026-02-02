import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import PageLayout from '@/components/layout/PageLayout';

const PrivacyPolicyPage: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-primary-600">{language === 'en' ? 'Privacy Policy' : 'Política de Privacidad'}</h1>
        
        <div className="prose prose-lg dark:prose-invert mx-auto">
          {language === 'en' ? (
            <>
              <p className="text-lg mb-6">Last updated: April 06, 2025</p>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p>
                  At TOBAIS, we respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. The Data We Collect About You</h2>
                <p>
                  Personal data, or personal information, means any information about an individual from which that person can be identified. It does not include data where the identity has been removed (anonymous data).
                </p>
                <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                  <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
                  <li><strong>Technical Data</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
                  <li><strong>Usage Data</strong> includes information about how you use our website, products, and services.</li>
                </ul>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Personal Data</h2>
                <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                  <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                  <li>Where we need to comply with a legal obligation.</li>
                </ul>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3A. SMS Communications & Consent</h2>
                <p>
                  If you provide your phone number through our website or other communication channels, you may consent to receive SMS notifications from TOBAIS related to service updates, appointment reminders, and important account-related messages.
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>You will never receive unsolicited marketing messages.</li>
                  <li>You may opt out of SMS notifications at any time by replying STOP to any of our messages.</li>
                  <li>By checking the consent box on our contact form or completing our opt-in process, you confirm that you wish to receive such communications.</li>
                </ul>
                <p className="mt-4">
                  For more information on SMS consent, please review our <a href="/opt-in-policy" className="text-primary-600 hover:underline">SMS Opt-In Policy</a>.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
                <p>
                  We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
                <p>
                  We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, regulatory, tax, accounting or reporting requirements.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Your Legal Rights</h2>
                <p>
                  Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
                <p>
                  If you have any questions about this privacy policy or our privacy practices, please contact us at: <a href="mailto:sales@tobais.com" className="text-primary-600 hover:underline">sales@tobais.com</a>
                </p>
              </section>
            </>
          ) : (
            <>
              <p className="text-lg mb-6">Última actualización: 06 de abril, 2025</p>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introducción</h2>
                <p>
                  En TOBAIS, respetamos su privacidad y estamos comprometidos a proteger sus datos personales. Esta política de privacidad le informará sobre cómo cuidamos sus datos personales cuando visita nuestro sitio web y le informará sobre sus derechos de privacidad y cómo la ley lo protege.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Los Datos Que Recopilamos Sobre Usted</h2>
                <p>
                  Datos personales, o información personal, significa cualquier información sobre un individuo a partir de la cual esa persona puede ser identificada. No incluye datos donde la identidad ha sido eliminada (datos anónimos).
                </p>
                <p>Podemos recopilar, utilizar, almacenar y transferir diferentes tipos de datos personales sobre usted que hemos agrupado de la siguiente manera:</p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li><strong>Datos de Identidad</strong> incluyen nombre, apellido, nombre de usuario o identificador similar.</li>
                  <li><strong>Datos de Contacto</strong> incluyen dirección de correo electrónico y números de teléfono.</li>
                  <li><strong>Datos Técnicos</strong> incluyen dirección de protocolo de Internet (IP), tipo y versión del navegador, configuración y ubicación de la zona horaria, tipos y versiones de complementos del navegador, sistema operativo y plataforma, y otra tecnología en los dispositivos que utiliza para acceder a este sitio web.</li>
                  <li><strong>Datos de Uso</strong> incluyen información sobre cómo utiliza nuestro sitio web, productos y servicios.</li>
                </ul>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Cómo Utilizamos Sus Datos Personales</h2>
                <p>Solo utilizaremos sus datos personales cuando la ley nos lo permita. Más comúnmente, utilizaremos sus datos personales en las siguientes circunstancias:</p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Cuando necesitemos ejecutar el contrato que estamos a punto de celebrar o que hemos celebrado con usted.</li>
                  <li>Cuando sea necesario para nuestros intereses legítimos (o los de un tercero) y sus intereses y derechos fundamentales no anulen esos intereses.</li>
                  <li>Cuando necesitemos cumplir con una obligación legal.</li>
                </ul>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3A. Comunicaciones SMS y Consentimiento</h2>
                <p>
                  Si proporciona su número de teléfono a través de nuestro sitio web u otros canales de comunicación, puede consentir recibir notificaciones SMS de TOBAIS relacionadas con actualizaciones de servicios, recordatorios de citas y mensajes importantes relacionados con su cuenta.
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Nunca recibirá mensajes de marketing no solicitados.</li>
                  <li>Puede optar por no recibir notificaciones SMS en cualquier momento respondiendo STOP a cualquiera de nuestros mensajes.</li>
                  <li>Al marcar la casilla de consentimiento en nuestro formulario de contacto o completar nuestro proceso de opt-in, confirma que desea recibir dichas comunicaciones.</li>
                </ul>
                <p className="mt-4">
                  Para obtener más información sobre el consentimiento de SMS, consulte nuestra <a href="/opt-in-policy" className="text-primary-600 hover:underline">Política de Opt-In de SMS</a>.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Seguridad de Datos</h2>
                <p>
                  Hemos implementado medidas de seguridad adecuadas para evitar que sus datos personales se pierdan accidentalmente, se utilicen o accedan de manera no autorizada, se alteren o divulguen. Además, limitamos el acceso a sus datos personales a aquellos empleados, agentes, contratistas y otros terceros que tienen una necesidad comercial de conocer.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Retención de Datos</h2>
                <p>
                  Solo conservaremos sus datos personales durante el tiempo que sea razonablemente necesario para cumplir con los fines para los que los recopilamos, incluidos los fines de satisfacer cualquier requisito legal, regulatorio, fiscal, contable o de informes.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Sus Derechos Legales</h2>
                <p>
                  Bajo ciertas circunstancias, usted tiene derechos bajo las leyes de protección de datos en relación con sus datos personales, incluido el derecho a solicitar acceso, corrección, borrado, restricción, transferencia, a oponerse al procesamiento, a la portabilidad de datos y (cuando el motivo legal del procesamiento es el consentimiento) a retirar el consentimiento.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Contáctenos</h2>
                <p>
                  Si tiene alguna pregunta sobre esta política de privacidad o nuestras prácticas de privacidad, comuníquese con nosotros en: <a href="mailto:sales@tobais.com" className="text-primary-600 hover:underline">sales@tobais.com</a>
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default PrivacyPolicyPage;