import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useState } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import UniversalSEO from "@/components/utils/UniversalSEO";

export default function ProjectsPage() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // SEO content using existing hardcoded strings
  const pageTitle = language === 'es' ? 'Nuestros Proyectos' : 'Our Projects';
  const pageDescription = language === 'es' 
    ? 'Explora nuestra colección de proyectos exitosos y casos de estudio que demuestran nuestro enfoque y experiencia en el desarrollo de soluciones digitales para nuestros clientes.'
    : 'Explore our collection of successful projects and case studies showcasing our approach and expertise in developing digital solutions for our clients.';
  
  // Fetch all projects
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"]
  });
  
  // Filter projects based on search query and status
  const filteredProjects = projects?.filter(project => {
    const title = language === 'es' && project.titleEs ? project.titleEs : project.title;
    const matchesSearch = searchQuery === "" || 
      (title && title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || 
      (project.status && project.status === statusFilter);
    
    return matchesSearch && matchesStatus;
  });
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4
      }
    }
  };
  
  // Get status options from projects
  const statuses = projects
    ? Array.from(new Set(projects.map(p => p.status).filter(Boolean) as string[]))
    : [];
    
  // Get badge color for project type
  const getProjectBadgeClass = (type: string): string => {
    switch(type) {
      case 'web-design': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'automation': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'branding': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'marketing': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  return (
    <>
      <UniversalSEO
        page="projects"
        title={pageTitle}
        description={pageDescription}
        canonicalPath="/projects"
        keywords={["web development", "case studies", "client projects", "digital solutions", "portfolio", "TOBAIS"]}
      />
      <Navbar />
      <div className="bg-white dark:bg-gray-800 min-h-screen pb-16 transition-colors duration-200">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-900 dark:to-primary-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <motion.h1 
              className="text-3xl md:text-5xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {pageTitle}
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-primary-100 max-w-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {pageDescription}
            </motion.p>
          </div>
        </div>
        
        {/* Filters Section */}
        <div className="bg-gray-50 dark:bg-gray-700 py-6 border-b border-gray-200 dark:border-gray-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder={language === 'es' ? "Buscar proyectos..." : "Search projects..."}
                  className="pl-10 bg-white dark:bg-gray-800"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="text-gray-500 dark:text-gray-400 h-4 w-4" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800">
                    <SelectValue placeholder={language === 'es' ? "Filtrar por estado" : "Filter by status"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'es' ? "Todos" : "All"}</SelectItem>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Projects Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : filteredProjects && filteredProjects.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredProjects.map(project => (
                <motion.div 
                  key={project.id}
                  className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100 dark:border-gray-600"
                  variants={itemVariants}
                >
                  {/* Project image */}
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={project.image || "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=800&q=80"} 
                      alt={language === 'es' && project.titleEs ? project.titleEs : project.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                  
                  {/* Project details */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="mb-4">
                      <Badge variant="secondary" className={getProjectBadgeClass(project.status || '')}>
                        {project.status}
                      </Badge>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                      {language === 'es' && project.titleEs ? project.titleEs : project.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                      {language === 'es' && project.descriptionEs 
                        ? project.descriptionEs.split('\n')[0] 
                        : project.description?.split('\n')[0] || ''}
                    </p>
                    
                    <div className="mt-auto">
                      <Link href={`/projects/${project.id}`}>
                        <Button 
                          className="w-full mt-4 flex items-center justify-center gap-2"
                        >
                          {language === 'es' ? 'Ver Detalles' : 'View Details'} <ArrowRight size={16} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                {language === 'es' ? 'No se encontraron proyectos' : 'No projects found'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {language === 'es' 
                  ? 'Intenta ajustar tus filtros o términos de búsqueda para encontrar lo que estás buscando.'
                  : 'Try adjusting your filters or search terms to find what you are looking for.'}
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}