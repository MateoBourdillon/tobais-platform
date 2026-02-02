import { useState, useEffect, useRef } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';
import { Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function RetellVoiceWidget() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const retellClientRef = useRef<RetellWebClient | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const client = new RetellWebClient();
    retellClientRef.current = client;

    client.on("call_started", () => {
      setIsCallActive(true);
      setIsConnecting(false);
      toast({
        title: "Llamada iniciada",
        description: "Conectado con el asistente de IA"
      });
    });

    client.on("call_ended", () => {
      setIsCallActive(false);
      setIsConnecting(false);
      toast({
        title: "Llamada finalizada",
        description: "La conversación ha terminado"
      });
    });

    client.on("agent_start_talking", () => {
      console.log("Agent started talking");
    });

    client.on("agent_stop_talking", () => {
      console.log("Agent stopped talking");
    });

    client.on("error", (error) => {
      console.error("Retell error:", error);
      setIsCallActive(false);
      setIsConnecting(false);
      toast({
        variant: "destructive",
        title: "Error en la llamada",
        description: "No se pudo conectar con el asistente"
      });
    });

    return () => {
      if (retellClientRef.current) {
        retellClientRef.current.stopCall();
      }
    };
  }, [toast]);

  const startCall = async () => {
    try {
      setIsConnecting(true);
      
      const response = await fetch('/api/retell/create-web-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create web call');
      }

      const { access_token } = await response.json();

      if (retellClientRef.current) {
        await retellClientRef.current.startCall({
          accessToken: access_token,
          sampleRate: 24000,
          emitRawAudioSamples: false
        });
      }
    } catch (error) {
      console.error('Error starting call:', error);
      setIsConnecting(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo iniciar la llamada"
      });
    }
  };

  const stopCall = async () => {
    if (retellClientRef.current) {
      await retellClientRef.current.stopCall();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="lg"
        className={`
          rounded-full w-16 h-16 shadow-lg transition-all duration-300
          ${isCallActive 
            ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
            : 'bg-purple-600 hover:bg-purple-700'
          }
          ${isConnecting ? 'opacity-50' : ''}
        `}
        onClick={isCallActive ? stopCall : startCall}
        disabled={isConnecting}
        data-testid={isCallActive ? "button-end-call" : "button-start-call"}
      >
        {isCallActive ? (
          <PhoneOff className="h-6 w-6" />
        ) : (
          <Phone className="h-6 w-6" />
        )}
      </Button>
      
      {isCallActive && (
        <div className="absolute -top-12 right-0 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">En llamada...</p>
        </div>
      )}
      
      {isConnecting && (
        <div className="absolute -top-12 right-0 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">Conectando...</p>
        </div>
      )}
    </div>
  );
}
