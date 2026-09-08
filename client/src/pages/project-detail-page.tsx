import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Loader2, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Tag,
  Share2,
  Download,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const [activeImage, setActiveImage] = useState<string | null>(null);
  
  // Fetch project details
  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ["/api/projects", id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Project not found");
      return res.json();
    }
  });

  // Get badge color for project status
  const getStatusBadgeClass = (status: string): string => {
    switch(status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-800">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-800 px-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-red-600 dark:text-red-300 text-2xl">!</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {language === 'es' ? 'Proyecto no encontrado' : 'Project Not Found'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-center max-w-md mb-6">
          {language === 'es' 
            ? 'Lo sentimos, no pudimos encontrar el proyecto que estás buscando.'
            : 'Sorry, we could not find the project you are looking for.'}
        </p>
        <Link href="/projects">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === 'es' ? 'Volver a Proyectos' : 'Back to Projects'}
          </Button>
        </Link>
      </div>
    );
  }
  
  // Format dates if available
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  };
  
  // Get project-specific images
  let projectImages = [];
  
  // Project-specific images based on project ID
  if (project.id === 5) { // Matoro Bridge Platform
    projectImages = [
      "/images/Matoro Bridge.png", // Spanish version
      "/images/Login.png", // Login page
      "/images/Admin Dashboard.png", // Admin Dashboard
      "/images/Home.png", // Home page dark
      "/images/HomeClaro.png", // Home page light
      "/images/forCompanies.png", // Companies page
      "/images/professionals.png", // Professionals page
      "/images/OurBlog.png", // Blog page
      "/images/responsive.png", // Mobile view
      "/images/Admin footer.png" // Admin footer
    ];
  } else if (project.id === 7) { // UruDomótica
    projectImages = [
      "/images/urudomotica-home.png", // Home principal
      "/images/servicios.png", // Servicios
      "/images/beneficios.png", // Beneficios
      "/images/proceso.png", // Proceso
      "/images/casosdeuso.png" // Casos de uso
    ];
  } else {
    // Default images for other projects
    projectImages = [
      project.image || "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1550305080-4e029753abcf?auto=format&fit=crop&w=800&q=80"
    ];
  }
  
  // Set active image if not set
  if (!activeImage) {
    setActiveImage(projectImages[0]);
  }
  
  return (
    <>
      <Navbar />
      <div className="bg-white dark:bg-gray-800 min-h-screen pb-16 transition-colors duration-200">
        {/* Back to projects */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Link href="/projects">
            <Button variant="ghost" className="mb-6 flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === 'es' ? 'Volver a Proyectos' : 'Back to Projects'}
            </Button>
          </Link>
        </div>
        
        {/* Project details */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column: Images & info */}
            <div className="lg:col-span-2">
              {/* Main image */}
              <motion.div 
                className="bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden aspect-[16/9] mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <img 
                  src={activeImage || projectImages[0]} 
                  alt={language === 'es' && project.titleEs ? project.titleEs : project.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              
              {/* Thumbnails */}
              {projectImages.length > 1 && (
                <motion.div 
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {projectImages.map((img, index) => (
                    <div 
                      key={index}
                      className={`aspect-video rounded-lg overflow-hidden cursor-pointer border-2 ${
                        activeImage === img ? 'border-primary-500' : 'border-transparent'
                      }`}
                      onClick={() => setActiveImage(img)}
                    >
                      <img 
                        src={img} 
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </motion.div>
              )}
              
              {/* Project content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="mb-6">
                    <TabsTrigger value="description">
                      {language === 'es' ? 'Descripción' : 'Description'}
                    </TabsTrigger>
                    <TabsTrigger value="features">
                      {language === 'es' ? 'Características' : 'Features'}
                    </TabsTrigger>
                    <TabsTrigger value="results">
                      {language === 'es' ? 'Resultados' : 'Results'}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="description" className="mt-0">
                    <div className="prose dark:prose-invert max-w-none">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        {language === 'es' ? 'Acerca del Proyecto' : 'About the Project'}
                      </h3>
                      
                      <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                        {language === 'es' && project.descriptionEs 
                          ? project.descriptionEs 
                          : project.description}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="features" className="mt-0">
                    <div className="prose dark:prose-invert max-w-none">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        {language === 'es' ? 'Características Principales' : 'Key Features'}
                      </h3>
                      
                      <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                        {project.id === 5 ? (
                          // Matoro Bridge Platform features
                          <>
                            <li className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{language === 'es' ? 'Interfaz bilingüe (inglés/español) para accesibilidad global' : 'Bilingual interface (English/Spanish) for global accessibility'}</span>
                            </li>
                            <li className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{language === 'es' ? 'MIA - Asistente de migración con IA para validación de documentos' : 'MIA - AI Migration assistant for document validation'}</span>
                            </li>
                            <li className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{language === 'es' ? 'Integración completa con Google Workspace para automatización de documentos' : 'Google Workspace integration for document automation'}</span>
                            </li>
                            <li className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{language === 'es' ? 'Integración con Stripe y PayPal para facturación segura' : 'Stripe and PayPal integration for secure billing'}</span>
                            </li>
                            <li className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{language === 'es' ? 'Soporte para modo claro y oscuro para mayor accesibilidad' : 'Light and Dark mode support for enhanced accessibility'}</span>
                            </li>
                            <li className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{language === 'es' ? 'Integración con proveedores de envío para logística courier' : 'Shipping provider integration for courier logistics'}</span>
                            </li>
                            <li className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{language === 'es' ? 'Sección de blog para recursos profesionales y artículos' : 'Blog section for professional resources and articles'}</span>
                            </li>
                          </>
                        ) : (
                          // Default features for other projects
                          <>
                            <li className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{language === 'es' ? 'Diseño responsivo para todas las plataformas' : 'Responsive design for all platforms'}</span>
                            </li>
                            <li className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{language === 'es' ? 'Integración con sistemas existentes' : 'Integration with existing systems'}</span>
                            </li>
                            <li className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{language === 'es' ? 'Experiencia de usuario optimizada' : 'Optimized user experience'}</span>
                            </li>
                            <li className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{language === 'es' ? 'Seguridad de datos avanzada' : 'Advanced data security'}</span>
                            </li>
                            <li className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{language === 'es' ? 'Análisis y reportes detallados' : 'Detailed analytics and reporting'}</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="results" className="mt-0">
                    <div className="prose dark:prose-invert max-w-none">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        {language === 'es' ? 'Resultados del Proyecto' : 'Project Results'}
                      </h3>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {language === 'es' 
                          ? 'Este proyecto demostrará resultados para nuestro cliente, incluyendo:'
                          : 'This project will demonstrate results for our client, including:'}
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {project.id === 5 ? (
                          // Matoro Bridge Platform results
                          <>
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">87%</div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                {language === 'es' ? 'Reducción en tiempos de integración laboral internacional' : 'Reduction in international workforce integration time'}
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">92%</div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                {language === 'es' ? 'Precisión en la validación de documentos con IA' : 'Accuracy in AI document validation'}
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">73%</div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                {language === 'es' ? 'Reducción en tiempo de procesamiento de solicitudes' : 'Reduction in application processing time'}
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">64%</div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                {language === 'es' ? 'Aumento en la satisfacción del cliente' : 'Increase in client satisfaction'}
                              </div>
                            </div>
                          </>
                        ) : (
                          // Default results for other projects
                          <>
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">35%</div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                {language === 'es' ? 'Aumento en conversiones' : 'Increase in conversions'}
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">42%</div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                {language === 'es' ? 'Reducción en tiempo de carga' : 'Decrease in load time'}
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">28%</div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                {language === 'es' ? 'Aumento en tiempo de sesión' : 'Increase in session time'}
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">67%</div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                {language === 'es' ? 'Mejora en experiencia de usuario' : 'Improvement in user experience'}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </div>
            
            {/* Right column: Project details */}
            <motion.div 
              className="lg:col-span-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sticky top-20">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {language === 'es' && project.titleEs ? project.titleEs : project.title}
                </h1>
                
                <div className="mb-6">
                  <Badge className={getStatusBadgeClass(project.status || '')}>
                    {project.status}
                  </Badge>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'es' ? 'Fecha de inicio' : 'Start Date'}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {project.id === 5 
                          ? '05/05/2025' 
                          : project.id === 7 
                            ? '08/25/2025'
                            : formatDate(project.startDate)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'es' ? 'Fecha de finalización' : 'End Date'}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {project.id === 5 
                          ? '06/14/2025' 
                          : project.id === 7 
                            ? '09/14/2025'
                            : formatDate(project.endDate)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'es' ? 'Duración' : 'Duration'}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {project.id === 5 
                          ? (language === 'es' ? '4 a 6 semanas' : '4 to 6 weeks')
                          : project.id === 7
                            ? (language === 'es' ? '3 semanas' : '3 weeks')
                            : (project.startDate && project.endDate 
                                ? (() => {
                                    const start = new Date(project.startDate);
                                    const end = new Date(project.endDate);
                                    const diffTime = Math.abs(end.getTime() - start.getTime());
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    const diffMonths = Math.floor(diffDays / 30);
                                    
                                    if (language === 'es') {
                                      return diffMonths > 0 
                                        ? `${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'} (${diffDays} días)`
                                        : `${diffDays} días`;
                                    } else {
                                      return diffMonths > 0 
                                        ? `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} (${diffDays} days)`
                                        : `${diffDays} days`;
                                    }
                                  })()
                                : 'N/A'
                              )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Tag className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'es' ? 'Categoría' : 'Category'}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {project.id === 5 
                          ? (language === 'es' ? 'Desarrollo de Plataforma Web' : 'Web Platform Development') 
                          : (language === 'es' ? 'Desarrollo Web' : 'Web Development')
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button className="w-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Compartir' : 'Share'}
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Descargar Caso' : 'Download Case Study'}
                  </Button>
                  <Link href="/contact">
                    <Button variant="default" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'Solicitar Servicio Similar' : 'Request Similar Service'}
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}