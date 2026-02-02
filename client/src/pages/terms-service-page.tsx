import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import PageLayout from '@/components/layout/PageLayout';

const TermsServicePage: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-primary-600">{language === 'en' ? 'Terms of Service' : 'Términos de Servicio'}</h1>
        
        <div className="prose prose-lg dark:prose-invert mx-auto">
          {language === 'en' ? (
            <>
              <p className="text-lg mb-6">Last updated: April 06, 2025</p>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p>
                  Welcome to TOBAIS. These terms and conditions outline the rules and regulations for the use of our website and services.
                </p>
                <p>
                  By accessing this website, we assume you accept these terms and conditions in full. Do not continue to use TOBAIS's website if you do not accept all of the terms and conditions stated on this page.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Intellectual Property Rights</h2>
                <p>
                  Unless otherwise stated, TOBAIS and/or its licensors own the intellectual property rights for all material on this website. All intellectual property rights are reserved. You may view and/or print pages from the website for your own personal use subject to restrictions set in these terms and conditions.
                </p>
                <p>You must not:</p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Republish material from this website</li>
                  <li>Sell, rent or sub-license material from this website</li>
                  <li>Reproduce, duplicate or copy material from this website</li>
                  <li>Redistribute content from TOBAIS (unless content is specifically made for redistribution)</li>
                </ul>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. User Content</h2>
                <p>
                  In these terms and conditions, "User Content" shall mean any audio, video, text, images or other material you choose to display on this website. By displaying your User Content, you grant TOBAIS a non-exclusive, worldwide, irrevocable, royalty-free, sublicensable license to use, reproduce, adapt, publish, translate and distribute it in any and all media.
                </p>
                <p>
                  Your User Content must be your own and must not be infringing on any third party's rights. TOBAIS reserves the right to remove any of your content from this website at any time without notice.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. No Warranties</h2>
                <p>
                  This website is provided "as is," with all faults, and TOBAIS makes no express or implied representations or warranties, of any kind related to this website or the materials contained on this website.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
                <p>
                  In no event shall TOBAIS, nor any of its officers, directors, and employees, be liable to you for anything arising out of or in any way connected with your use of this website, whether such liability is under contract, tort or otherwise, and TOBAIS, including its officers, directors, and employees shall not be liable for any indirect, consequential or special liability arising out of or in any way related to your use of this website.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Indemnification</h2>
                <p>
                  You hereby indemnify to the fullest extent TOBAIS from and against any and all liabilities, costs, demands, causes of action, damages and expenses (including reasonable attorney's fees) arising out of or in any way related to your breach of any of the provisions of these Terms.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Governing Law & Jurisdiction</h2>
                <p>
                  These Terms will be governed by and construed in accordance with the laws of the United States, and you submit to the non-exclusive jurisdiction of the state and federal courts located in the United States for the resolution of any disputes.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
                <p>
                  If you have any questions about these Terms, please contact us at: <a href="mailto:sales@tobais.com" className="text-primary-600 hover:underline">sales@tobais.com</a>
                </p>
              </section>
            </>
          ) : (
            <>
              <p className="text-lg mb-6">Última actualización: 06 de abril, 2025</p>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introducción</h2>
                <p>
                  Bienvenido a TOBAIS. Estos términos y condiciones describen las reglas y regulaciones para el uso de nuestro sitio web y servicios.
                </p>
                <p>
                  Al acceder a este sitio web, asumimos que acepta estos términos y condiciones en su totalidad. No continúe utilizando el sitio web de TOBAIS si no acepta todos los términos y condiciones establecidos en esta página.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Derechos de Propiedad Intelectual</h2>
                <p>
                  A menos que se indique lo contrario, TOBAIS y/o sus licenciantes poseen los derechos de propiedad intelectual de todo el material en este sitio web. Todos los derechos de propiedad intelectual están reservados. Puede ver y/o imprimir páginas del sitio web para su uso personal sujeto a las restricciones establecidas en estos términos y condiciones.
                </p>
                <p>No debe:</p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Republicar material de este sitio web</li>
                  <li>Vender, alquilar o sublicenciar material de este sitio web</li>
                  <li>Reproducir, duplicar o copiar material de este sitio web</li>
                  <li>Redistribuir contenido de TOBAIS (a menos que el contenido esté específicamente diseñado para su redistribución)</li>
                </ul>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Contenido del Usuario</h2>
                <p>
                  En estos términos y condiciones, "Contenido del Usuario" significará cualquier audio, video, texto, imágenes u otro material que elija mostrar en este sitio web. Al mostrar su Contenido de Usuario, otorga a TOBAIS una licencia no exclusiva, mundial, irrevocable, libre de regalías y sublicenciable para usar, reproducir, adaptar, publicar, traducir y distribuirlo en cualquier medio.
                </p>
                <p>
                  Su Contenido de Usuario debe ser suyo y no debe infringir los derechos de terceros. TOBAIS se reserva el derecho de eliminar cualquier contenido suyo de este sitio web en cualquier momento sin previo aviso.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Sin Garantías</h2>
                <p>
                  Este sitio web se proporciona "tal cual", con todas las fallas, y TOBAIS no hace representaciones o garantías expresas o implícitas, de ningún tipo relacionadas con este sitio web o los materiales contenidos en este sitio web.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Limitación de Responsabilidad</h2>
                <p>
                  En ningún caso TOBAIS, ni ninguno de sus funcionarios, directores y empleados, será responsable ante usted por cualquier cosa que surja de o esté relacionada de alguna manera con su uso de este sitio web, ya sea que dicha responsabilidad esté bajo contrato, agravio o de otra manera, y TOBAIS, incluidos sus funcionarios, directores y empleados, no serán responsables de ninguna responsabilidad indirecta, consecuente o especial que surja de o esté relacionada de alguna manera con su uso de este sitio web.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Indemnización</h2>
                <p>
                  Por la presente, indemniza en la mayor medida posible a TOBAIS de y contra todas y cada una de las responsabilidades, costos, demandas, causas de acción, daños y gastos (incluidos honorarios razonables de abogados) que surjan de o estén relacionados de alguna manera con su incumplimiento de cualquiera de las disposiciones de estos Términos.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Ley Aplicable y Jurisdicción</h2>
                <p>
                  Estos Términos se regirán e interpretarán de acuerdo con las leyes de los Estados Unidos, y usted se somete a la jurisdicción no exclusiva de los tribunales estatales y federales ubicados en los Estados Unidos para la resolución de cualquier disputa.
                </p>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Contáctenos</h2>
                <p>
                  Si tiene alguna pregunta sobre estos Términos, comuníquese con nosotros en: <a href="mailto:sales@tobais.com" className="text-primary-600 hover:underline">sales@tobais.com</a>
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default TermsServicePage;