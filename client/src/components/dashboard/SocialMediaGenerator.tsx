import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import SocialMediaList from "./SocialMediaList";

// Form schema
const generateSchema = z.object({
  prompt: z.string().min(10, "Please provide more details for better content generation"),
  platform: z.string().min(1, "Platform is required"),
  language: z.enum(["en", "es"]).default("en")
});

// Multi-platform schema
const multiPlatformSchema = z.object({
  prompt: z.string().min(10, "Please provide more details for better content generation"),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  language: z.enum(["en", "es"]).default("en")
});

// Recommendations schema
const recommendationsSchema = z.object({
  audience: z.string().min(5, "Please describe your audience in more detail"),
  industry: z.string().min(3, "Industry is required"),
  language: z.enum(["en", "es"]).default("en")
});

type GenerateFormValues = z.infer<typeof generateSchema>;
type MultiPlatformFormValues = z.infer<typeof multiPlatformSchema>;
type RecommendationsFormValues = z.infer<typeof recommendationsSchema>;

interface ContentResponse {
  content: string;
  hashtags: string[] | string;
}

interface MultiPlatformResponse {
  [platform: string]: ContentResponse;
}

interface RecommendationsResponse {
  topics: string[];
  contentTypes: string[];
  platforms: string[];
}

export default function SocialMediaGenerator() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [activeMainTab, setActiveMainTab] = useState<string>("generator");
  const [activeGeneratorTab, setActiveGeneratorTab] = useState<string>("single");
  
  // Single platform states
  const [generatedContent, setGeneratedContent] = useState<ContentResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Multi-platform states
  const [multiContent, setMultiContent] = useState<MultiPlatformResponse | null>(null);
  const [isGeneratingMulti, setIsGeneratingMulti] = useState(false);
  const [isSavingMulti, setIsSavingMulti] = useState(false);
  
  // Recommendations states
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isSavingRecommendation, setIsSavingRecommendation] = useState(false);
  
  // Form setup
  const generateForm = useForm<GenerateFormValues>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      prompt: "",
      platform: "",
      language: language
    }
  });
  
  const multiPlatformForm = useForm<MultiPlatformFormValues>({
    resolver: zodResolver(multiPlatformSchema),
    defaultValues: {
      prompt: "",
      platforms: [],
      language: language
    }
  });
  
  const recommendationsForm = useForm<RecommendationsFormValues>({
    resolver: zodResolver(recommendationsSchema),
    defaultValues: {
      audience: "",
      industry: "",
      language: language
    }
  });
  
  // Single platform content generation
  const onGenerateSubmit = async (values: GenerateFormValues) => {
    setIsGenerating(true);
    
    try {
      console.log("Enviando solicitud con datos:", values);
      const response = await apiRequest("POST", "/api/social-media/generate", values);
      console.log("Respuesta recibida:", response);
      const data = await response.json();
      console.log("Datos procesados:", data);
      setGeneratedContent(data);
    } catch (error) {
      console.error("Error al generar contenido:", error);
      toast({
        title: "Error al generar contenido",
        description: error instanceof Error ? error.message : "No se pudo generar el contenido. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Save generated content
  const saveContent = async () => {
    if (!generatedContent) return;
    
    setIsSaving(true);
    
    try {
      const platform = generateForm.getValues("platform");
      const contentData = {
        platform,
        content: generatedContent.content,
        contentEs: language === "es" ? generatedContent.content : "",
        aiGenerated: true,
        metadata: JSON.stringify({ hashtags: generatedContent.hashtags }),
        scheduled: false
      };
      
      await apiRequest("POST", "/api/social-media/save", contentData);
      
      toast({
        title: "Éxito",
        description: "Contenido guardado exitosamente",
        variant: "default",
      });
      
      // Reset content after saving
      setGeneratedContent(null);
      
      // Switch to the list tab to show saved content
      setActiveMainTab("list");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save content",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Multi-platform content generation
  const onMultiPlatformSubmit = async (values: MultiPlatformFormValues) => {
    setIsGeneratingMulti(true);
    
    try {
      console.log("Enviando solicitud multi-plataforma con datos:", values);
      const response = await apiRequest("POST", "/api/social-media/multi-platform", values);
      console.log("Respuesta multi-plataforma recibida:", response);
      const data = await response.json();
      console.log("Datos multi-plataforma procesados:", data);
      setMultiContent(data);
    } catch (error) {
      console.error("Error al generar contenido multi-plataforma:", error);
      toast({
        title: "Error al generar contenido",
        description: error instanceof Error ? error.message : "No se pudo generar el contenido multi-plataforma. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingMulti(false);
    }
  };
  
  // Save multi-platform content for a specific platform
  const handleSaveMultiContent = async (platform: string, content: ContentResponse) => {
    setIsSavingMulti(true);
    
    try {
      const contentData = {
        platform,
        content: content.content,
        contentEs: multiPlatformForm.getValues("language") === "es" ? content.content : "",
        aiGenerated: true,
        metadata: JSON.stringify({ hashtags: content.hashtags }),
        scheduled: false
      };
      
      await apiRequest("POST", "/api/social-media/save", contentData);
      
      toast({
        title: "Éxito",
        description: "Contenido guardado exitosamente",
        variant: "default",
      });
      
      // Switch to the list tab to show saved content
      setActiveMainTab("list");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar el contenido",
        variant: "destructive",
      });
    } finally {
      setIsSavingMulti(false);
    }
  };
  
  // Get content recommendations
  const onRecommendationsSubmit = async (values: RecommendationsFormValues) => {
    setIsLoadingRecommendations(true);
    
    try {
      console.log("Enviando solicitud de recomendaciones con datos:", values);
      const response = await apiRequest("POST", "/api/content-recommendations", values);
      console.log("Respuesta de recomendaciones recibida:", response);
      const data = await response.json();
      console.log("Datos de recomendaciones procesados:", data);
      setRecommendations(data);
    } catch (error) {
      console.error("Error al obtener recomendaciones:", error);
      toast({
        title: "Error al obtener recomendaciones",
        description: error instanceof Error ? error.message : "No se pudieron obtener las recomendaciones de contenido. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecommendations(false);
    }
  };
  
  // Save recommendations as a note
  const saveRecommendation = async (platform: string = "general") => {
    if (!recommendations) return;
    
    setIsSavingRecommendation(true);
    
    try {
      // Create a formatted content string from the recommendations
      const topics = recommendations.topics.map(topic => `- ${topic}`).join('\n');
      const contentTypes = recommendations.contentTypes.map(type => `- ${type}`).join('\n');
      const platforms = recommendations.platforms.map(platform => `- ${platform}`).join('\n');
      
      const content = `Recomendaciones de contenido:\n\nTemas:\n${topics}\n\nTipos de contenido:\n${contentTypes}\n\nPlataformas recomendadas:\n${platforms}`;
      
      const contentData = {
        platform,
        content,
        contentEs: recommendationsForm.getValues("language") === "es" ? content : "",
        aiGenerated: true,
        metadata: JSON.stringify({ 
          type: "recommendations",
          audience: recommendationsForm.getValues("audience"),
          industry: recommendationsForm.getValues("industry")
        }),
        scheduled: false
      };
      
      await apiRequest("POST", "/api/social-media/save", contentData);
      
      toast({
        title: "Éxito",
        description: "Recomendaciones guardadas exitosamente",
        variant: "default",
      });
      
      // Switch to the list tab to show saved content
      setActiveMainTab("list");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar las recomendaciones",
        variant: "destructive",
      });
    } finally {
      setIsSavingRecommendation(false);
    }
  };
  
  return (
    <div>
      <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
        <Card>
          <CardHeader>
            <CardTitle>Generador de Contenido para Redes Sociales</CardTitle>
            <CardDescription>Genera contenido atractivo para tus redes sociales</CardDescription>
            <TabsList className="mt-2">
              <TabsTrigger value="generator">
                Generar Contenido
              </TabsTrigger>
              <TabsTrigger value="list">
                Ver Contenido
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="generator" className="space-y-6">
              {activeMainTab === "generator" && (
                <Tabs value={activeGeneratorTab} onValueChange={setActiveGeneratorTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="single">Plataforma Única</TabsTrigger>
                    <TabsTrigger value="multi">Multi-plataforma</TabsTrigger>
                    <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="single" className="space-y-6">
            <Form {...generateForm}>
              <form onSubmit={generateForm.handleSubmit(onGenerateSubmit)} className="space-y-4">
                <FormField
                  control={generateForm.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Información del negocio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="¿Sobre qué quieres publicar?"
                          className="min-h-[120px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={generateForm.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plataforma</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar plataforma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="twitter">Twitter / X</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={generateForm.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idioma</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar idioma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    "Generar"
                  )}
                </Button>
              </form>
            </Form>
            
            {generatedContent && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-2">Contenido generado</h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md mb-4">
                  <p className="whitespace-pre-line">{generatedContent.content}</p>
                </div>
                
                {generatedContent.hashtags && (
                  <div>
                    <h4 className="text-md font-medium mb-2">Hashtags</h4>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        // Manejar tanto arrays como strings de hashtags
                        if (Array.isArray(generatedContent.hashtags)) {
                          return generatedContent.hashtags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded-md text-sm"
                            >
                              {tag}
                            </span>
                          ));
                        } else if (typeof generatedContent.hashtags === 'string') {
                          // Si es un string, dividirlo por espacios para mostrarlo como etiquetas separadas
                          return generatedContent.hashtags.split(' ').map((tag, index) => (
                            <span 
                              key={index} 
                              className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded-md text-sm"
                            >
                              {tag}
                            </span>
                          ));
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 mt-4">
                  <Button 
                    onClick={saveContent} 
                    disabled={isSaving}
                    variant="outline"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar"
                    )}
                  </Button>
                  <Button disabled>
                    Programar
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="multi" className="space-y-6">
            <Form {...multiPlatformForm}>
              <form onSubmit={multiPlatformForm.handleSubmit(onMultiPlatformSubmit)} className="space-y-4">
                <FormField
                  control={multiPlatformForm.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Información del negocio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="¿Sobre qué quieres publicar?"
                          className="min-h-[120px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={multiPlatformForm.control}
                    name="platforms"
                    render={() => (
                      <FormItem>
                        <FormLabel>Seleccionar plataformas</FormLabel>
                        <div className="space-y-2">
                          {["twitter", "facebook", "instagram", "linkedin"].map((platform) => (
                            <div key={platform} className="flex items-center space-x-2">
                              <Checkbox
                                id={platform}
                                onCheckedChange={(checked) => {
                                  const currentPlatforms = multiPlatformForm.getValues("platforms");
                                  const updatedPlatforms = checked
                                    ? [...currentPlatforms, platform]
                                    : currentPlatforms.filter(p => p !== platform);
                                  multiPlatformForm.setValue("platforms", updatedPlatforms, { shouldValidate: true });
                                }}
                              />
                              <label
                                htmlFor={platform}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {platform === "twitter" ? "Twitter / X" : 
                                 platform === "facebook" ? "Facebook" : 
                                 platform === "instagram" ? "Instagram" : "LinkedIn"}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={multiPlatformForm.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idioma</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar idioma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isGeneratingMulti}
                  className="w-full"
                >
                  {isGeneratingMulti ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    "Generar para todas las plataformas"
                  )}
                </Button>
              </form>
            </Form>
            
            {multiContent && (
              <div className="mt-8 space-y-8">
                {Object.entries(multiContent).map(([platform, content]) => (
                  <div key={platform} className="border rounded-md p-4">
                    <h3 className="text-lg font-medium mb-2 capitalize">{platform}</h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md mb-4">
                      <p className="whitespace-pre-line">{content.content}</p>
                    </div>
                    
                    {content.hashtags && (
                      <div>
                        <h4 className="text-md font-medium mb-2">Hashtags</h4>
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            // Manejar tanto arrays como strings de hashtags
                            if (Array.isArray(content.hashtags)) {
                              return content.hashtags.map((tag, index) => (
                                <span 
                                  key={index} 
                                  className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded-md text-sm"
                                >
                                  {tag}
                                </span>
                              ));
                            } else if (typeof content.hashtags === 'string') {
                              // Si es un string, dividirlo por espacios para mostrarlo como etiquetas separadas
                              return content.hashtags.split(' ').map((tag, index) => (
                                <span 
                                  key={index} 
                                  className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded-md text-sm"
                                >
                                  {tag}
                                </span>
                              ));
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <Button
                        onClick={() => handleSaveMultiContent(platform, content)}
                        disabled={isSavingMulti}
                        className="w-full"
                      >
                        {isSavingMulti ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          "Guardar para publicar"
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-6">
            <Form {...recommendationsForm}>
              <form onSubmit={recommendationsForm.handleSubmit(onRecommendationsSubmit)} className="space-y-4">
                <FormField
                  control={recommendationsForm.control}
                  name="audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audiencia</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe tu audiencia objetivo (p.ej., propietarios de pequeñas empresas en U.S., entre 30-45 años)"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={recommendationsForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industria</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Tu industria (p.ej., e-commerce, salud, finanzas)"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={recommendationsForm.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idioma</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar idioma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  disabled={isLoadingRecommendations}
                  className="w-full"
                >
                  {isLoadingRecommendations ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    "Obtener recomendaciones"
                  )}
                </Button>
              </form>
            </Form>
            
            {recommendations ? (
              <>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-medium mb-2">Temas</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {recommendations.topics.map((topic, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300">{topic}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-medium mb-2">Tipos de contenido</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {recommendations.contentTypes.map((type, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300">{type}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-medium mb-2">Plataformas</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {recommendations.platforms.map((platform, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300">{platform}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button 
                    onClick={() => saveRecommendation()} 
                    disabled={isSavingRecommendation}
                    className="w-full"
                  >
                    {isSavingRecommendation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar recomendaciones"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-8 p-6 border border-dashed rounded-md text-center">
                <p className="text-gray-500 dark:text-gray-400">No hay recomendaciones aún. Completa el formulario para recibir sugerencias.</p>
              </div>
            )}
          </TabsContent>
                </Tabs>
              )}
            </TabsContent>
          
            <TabsContent value="list">
              <SocialMediaList />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
