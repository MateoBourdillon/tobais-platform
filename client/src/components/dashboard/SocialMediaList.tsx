import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SocialMedia } from "@shared/schema";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Trash2, PencilIcon } from "lucide-react";
import EditSocialMediaDialog from "./EditSocialMediaDialog";

export default function SocialMediaList() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null);

  // Fetch user's social media content
  const { data: socialMediaContent, isLoading } = useQuery<SocialMedia[]>({
    queryKey: ["/api/social-media"],
    enabled: !!user
  });

  // Delete social media content mutation
  const deleteSocialMediaMutation = useMutation({
    mutationFn: async (contentId: number) => {
      return await apiRequest("DELETE", `/api/social-media/${contentId}`);
    },
    onSuccess: () => {
      // Invalidate and refetch social media content
      queryClient.invalidateQueries({ queryKey: ["/api/social-media"] });
      toast({
        title: "Éxito",
        description: "Contenido eliminado correctamente",
        variant: "default",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error deleting social media content",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
    }
  });

  const handleDeleteClick = (contentId: number) => {
    setSelectedContentId(contentId);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (contentId: number) => {
    setSelectedContentId(contentId);
    setEditDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedContentId !== null) {
      deleteSocialMediaMutation.mutate(selectedContentId);
    }
  };

  // Function to parse and display metadata (hashtags)
  const displayHashtags = (content: SocialMedia) => {
    try {
      if (!content.metadata) return null;
      
      const metadata = JSON.parse(content.metadata);
      if (!metadata.hashtags) return null;
      
      // Handle both string and array formats
      const hashtags = Array.isArray(metadata.hashtags) 
        ? metadata.hashtags 
        : typeof metadata.hashtags === 'string'
        ? metadata.hashtags.split(' ')
        : [];
      
      return (
        <div className="mt-3">
          <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Hashtags:</h4>
          <div className="flex flex-wrap gap-1.5">
            {hashtags.map((tag: string, index: number) => (
              <span 
                key={index}
                className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-2 py-0.5 rounded-md text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      );
    } catch (error) {
      console.error("Error parsing metadata:", error);
      return null;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Redes Sociales</CardTitle>
          <CardDescription>Gestiona tu contenido de redes sociales</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : socialMediaContent && socialMediaContent.length > 0 ? (
            <div className="space-y-6">
              {socialMediaContent.map((content) => (
                <div key={content.id} className="border rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="capitalize font-medium">{content.platform}</span>
                      {content.aiGenerated && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 text-xs">
                          Generado por IA
                        </span>
                      )}
                      {content.scheduled && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                          Programado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(content.createdAt).toLocaleDateString(
                          language === 'es' ? 'es-ES' : 'en-US', 
                          { year: 'numeric', month: 'short', day: 'numeric' }
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/20" 
                        onClick={() => handleEditClick(content.id)}
                      >
                        <PencilIcon className="h-4 w-4 text-blue-500" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20" 
                        onClick={() => handleDeleteClick(content.id)}
                        disabled={deleteSocialMediaMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {content.content}
                  </p>
                  {displayHashtags(content)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              No tienes contenido guardado. Genera nuevo contenido para empezar.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro/a de que quieres eliminar este contenido? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteSocialMediaMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteSocialMediaMutation.isPending}
            >
              {deleteSocialMediaMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <EditSocialMediaDialog 
        contentId={selectedContentId}
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
      />
    </>
  );
}