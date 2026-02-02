import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Versión simplificada sin usar react-hook-form ni zod
interface EditSocialMediaDialogProps {
  contentId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditSocialMediaDialog({
  contentId,
  isOpen,
  onClose,
}: EditSocialMediaDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [platform, setPlatform] = useState("");
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [error, setError] = useState("");

  // Cargar el contenido cuando se abre el diálogo
  useEffect(() => {
    if (isOpen && contentId) {
      const fetchContent = async () => {
        setIsLoading(true);
        setError("");
        
        try {
          console.log(`Solicitando contenido con ID: ${contentId}`);
          
          const response = await fetch(`/api/social-media/${contentId}`, {
            method: 'GET',
            credentials: 'include',
          });
          
          console.log("Respuesta recibida código:", response.status);
          
          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log("Datos recibidos:", data);
          
          if (!data || !data.content) {
            throw new Error("El contenido recibido no tiene el formato esperado");
          }
          
          // Establecer los valores básicos
          setPlatform(data.platform || "");
          setContent(data.content || "");
          
          // Intentar extraer hashtags del metadata si existe
          if (data.metadata) {
            try {
              const metadataObj = typeof data.metadata === 'string' 
                ? JSON.parse(data.metadata)
                : data.metadata;
                
              if (metadataObj && metadataObj.hashtags) {
                if (Array.isArray(metadataObj.hashtags)) {
                  setHashtags(metadataObj.hashtags.join(" "));
                } else if (typeof metadataObj.hashtags === 'string') {
                  setHashtags(metadataObj.hashtags);
                }
              }
            } catch (err) {
              console.log("Error procesando metadata, no se usarán hashtags:", err);
            }
          }
        } catch (error) {
          console.error("Error fetching content:", error);
          setError("No se pudo cargar el contenido para editar");
          toast({
            title: "Error",
            description: "No se pudo cargar el contenido para editar",
            variant: "destructive",
          });
          // Cerramos el diálogo después de un momento
          setTimeout(onClose, 1500);
        } finally {
          setIsLoading(false);
        }
      };

      fetchContent();
    }
  }, [isOpen, contentId, toast, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contentId || !content.trim()) {
      setError("El contenido no puede estar vacío");
      return;
    }

    if (content.length < 10) {
      setError("El contenido debe tener al menos 10 caracteres");
      return;
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      // Datos simplificados para actualizar
      const updateData = {
        content: content.trim(),
        metadata: JSON.stringify({ hashtags: hashtags.trim() })
      };
      
      console.log(`Enviando actualización para ID ${contentId}:`, updateData);
      
      const response = await fetch(`/api/social-media/${contentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      // Invalidar consulta para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ["/api/social-media"] });
      
      toast({
        title: "Éxito",
        description: "Contenido actualizado correctamente",
        variant: "default",
      });
      
      onClose();
    } catch (error) {
      console.error("Error updating content:", error);
      setError("No se pudo actualizar el contenido");
      toast({
        title: "Error",
        description: "No se pudo actualizar el contenido",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar contenido</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="py-6 text-center text-red-500">{error}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4">
              <div className="flex gap-2 items-center mb-2">
                <Label>Plataforma:</Label>
                <span className="capitalize">{platform}</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Contenido</Label>
                <Textarea 
                  id="content"
                  placeholder="Contenido del post" 
                  className="min-h-[150px]" 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isSubmitting}
                  required
                  minLength={10}
                />
              </div>
              
              <div className="space-y-2 mt-4">
                <Label htmlFor="hashtags">Hashtags</Label>
                <Input 
                  id="hashtags"
                  placeholder="Hashtags separados por espacios (ej: #marketing #socialmedia)" 
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}