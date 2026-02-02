import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import PageLayout from '@/components/layout/PageLayout';

const CareersPage: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-primary-600">
          {language === 'en' ? 'Careers at TOBAIS' : 'Carreras en TOBAIS'}
        </h1>
        
        <div className="prose prose-lg dark:prose-invert mx-auto">
          {language === 'en' ? (
            <>
              <p className="text-lg mb-6">Join our growing team of talented professionals who are passionate about AI and digital marketing solutions.</p>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Why Work With Us</h2>
                <p>
                  At TOBAIS, we're building the future of digital marketing through innovative AI-powered solutions. Our team is dedicated to helping businesses grow through cutting-edge technology and creative strategies.
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Work with the latest technologies in AI and digital marketing</li>
                  <li>International team with offices in Charlotte, NC (U.S.) and Montevideo (Uruguay)</li>
                  <li>Flexible work arrangements and competitive compensation</li>
                  <li>Opportunities for professional growth and development</li>
                  <li>Collaborative and innovative work environment</li>
                </ul>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Current Openings</h2>
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mb-6">
                  <h3 className="text-xl font-semibold mb-2">Senior AI Developer</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Full-time • Remote</p>
                  <p className="mb-4">We're looking for an experienced AI developer to help build and improve our AI-powered marketing tools.</p>
                  <button className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded transition duration-300">
                    Apply Now
                  </button>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mb-6">
                  <h3 className="text-xl font-semibold mb-2">Digital Marketing Specialist</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Full-time • Charlotte, NC</p>
                  <p className="mb-4">Join our marketing team to create and execute innovative digital strategies for our clients.</p>
                  <button className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded transition duration-300">
                    Apply Now
                  </button>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">UI/UX Designer</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Full-time • Montevideo, Uruguay</p>
                  <p className="mb-4">Create beautiful, intuitive user experiences for our web applications and client projects.</p>
                  <button className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded transition duration-300">
                    Apply Now
                  </button>
                </div>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">How to Apply</h2>
                <p>
                  To apply for any of our open positions, please send your resume and a brief cover letter to <a href="mailto:sales@tobais.com" className="text-primary-600 hover:underline">sales@tobais.com</a>.
                </p>
                <p>
                  Be sure to include the position title in your email subject line and tell us why you're excited to join the TOBAIS team.
                </p>
              </section>
            </>
          ) : (
            <>
              <p className="text-lg mb-6">Únete a nuestro creciente equipo de profesionales talentosos apasionados por la IA y las soluciones de marketing digital.</p>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Por Qué Trabajar Con Nosotros</h2>
                <p>
                  En TOBAIS, estamos construyendo el futuro del marketing digital a través de soluciones innovadoras impulsadas por IA. Nuestro equipo está dedicado a ayudar a las empresas a crecer mediante tecnología de vanguardia y estrategias creativas.
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Trabaja con las últimas tecnologías en IA y marketing digital</li>
                  <li>Equipo internacional con oficinas en Charlotte, NC (U.S.) y Montevideo (Uruguay)</li>
                  <li>Acuerdos de trabajo flexibles y compensación competitiva</li>
                  <li>Oportunidades de crecimiento y desarrollo profesional</li>
                  <li>Entorno de trabajo colaborativo e innovador</li>
                </ul>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Puestos Disponibles</h2>
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mb-6">
                  <h3 className="text-xl font-semibold mb-2">Desarrollador Senior de IA</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Tiempo completo • Remoto</p>
                  <p className="mb-4">Buscamos un desarrollador de IA experimentado para ayudar a construir y mejorar nuestras herramientas de marketing impulsadas por IA.</p>
                  <button className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded transition duration-300">
                    Aplicar Ahora
                  </button>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mb-6">
                  <h3 className="text-xl font-semibold mb-2">Especialista en Marketing Digital</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Tiempo completo • Charlotte, NC</p>
                  <p className="mb-4">Únete a nuestro equipo de marketing para crear y ejecutar estrategias digitales innovadoras para nuestros clientes.</p>
                  <button className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded transition duration-300">
                    Aplicar Ahora
                  </button>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Diseñador UI/UX</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Tiempo completo • Montevideo, Uruguay</p>
                  <p className="mb-4">Crea experiencias de usuario hermosas e intuitivas para nuestras aplicaciones web y proyectos de clientes.</p>
                  <button className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded transition duration-300">
                    Aplicar Ahora
                  </button>
                </div>
              </section>
              
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Cómo Aplicar</h2>
                <p>
                  Para aplicar a cualquiera de nuestras posiciones abiertas, envía tu currículum y una breve carta de presentación a <a href="mailto:sales@tobais.com" className="text-primary-600 hover:underline">sales@tobais.com</a>.
                </p>
                <p>
                  Asegúrate de incluir el título del puesto en la línea de asunto de tu correo electrónico y cuéntanos por qué estás entusiasmado por unirte al equipo de TOBAIS.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default CareersPage;