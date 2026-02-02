import { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Zap, Cpu, Brain, Rocket, Target, Activity, TrendingUp, X, User, Building2, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import '../styles/showcase-animations.css';

// Floating CSS Animation Elements
function FloatingElement({ children, delay = 0, duration = 3 }: { children: React.ReactNode; delay?: number; duration?: number }) {
  return (
    <motion.div
      className="absolute"
      animate={{
        y: [0, -20, 0],
        rotate: [0, 5, -5, 0],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedBackground({ variant = 'a' }: { variant?: 'a' | 'b' }) {
  const particleOpacity = variant === 'b' ? 0.25 : 0.35;
  const shapeOpacity = variant === 'b' ? 0.15 : 0.20;
  
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Enhanced smooth gradient background - darker variants */}
      <div 
        className="absolute inset-0"
        style={{
          opacity: variant === 'b' ? 0.45 : 0.50,
          background: variant === 'b' 
            ? `
              radial-gradient(circle at 20% 30%, rgba(165, 107, 255, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(255, 91, 190, 0.18) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
              linear-gradient(135deg, rgba(20, 10, 39, 0.9), rgba(42, 20, 85, 0.7), rgba(26, 13, 50, 0.95))
            `
            : `
              radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.25) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.20) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.18) 0%, transparent 50%),
              linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(88, 28, 135, 0.65), rgba(15, 23, 42, 0.90))
            `
        }}
      />

      {/* Floating geometric shapes with adjusted opacity */}
      <FloatingElement delay={0}>
        <div className="absolute top-20 left-10 w-20 h-20 rounded-2xl blur-xl" 
             style={{ 
               background: `linear-gradient(135deg, rgba(165, 107, 255, ${shapeOpacity}) 0%, rgba(255, 91, 190, ${shapeOpacity * 0.8}) 100%)`
             }} />
      </FloatingElement>
      
      <FloatingElement delay={1.5}>
        <div className="absolute top-1/3 right-16 w-16 h-16 rounded-full blur-lg"
             style={{ 
               background: `linear-gradient(135deg, rgba(59, 130, 246, ${shapeOpacity * 0.9}) 0%, rgba(34, 197, 94, ${shapeOpacity * 0.7}) 100%)`
             }} />
      </FloatingElement>
      
      <FloatingElement delay={2.5}>
        <div className="absolute bottom-1/3 left-1/4 w-24 h-24 rounded-full blur-2xl"
             style={{ 
               background: `linear-gradient(135deg, rgba(16, 185, 129, ${shapeOpacity * 0.8}) 0%, rgba(6, 182, 212, ${shapeOpacity * 0.6}) 100%)`
             }} />
      </FloatingElement>
      
      <FloatingElement delay={1}>
        <div className="absolute top-1/2 right-1/4 w-12 h-32 rounded-full blur-xl transform rotate-45"
             style={{ 
               background: `linear-gradient(180deg, rgba(249, 115, 22, ${shapeOpacity * 0.9}) 0%, rgba(220, 38, 38, ${shapeOpacity * 0.7}) 100%)`
             }} />
      </FloatingElement>
      
      {/* Subtler animated particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: `rgba(255, 255, 255, ${particleOpacity})`
          }}
          animate={{
            y: [0, -80, 0],
            opacity: [particleOpacity * 0.5, particleOpacity, particleOpacity * 0.5],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Ambient mesh gradient overlay - more subtle */}
      <div 
        className="absolute inset-0"
        style={{
          opacity: variant === 'b' ? 0.25 : 0.30,
          background: `
            conic-gradient(from 0deg at 50% 50%, 
              transparent 0deg, 
              rgba(165, 107, 255, 0.08) 45deg,
              transparent 90deg,
              rgba(255, 91, 190, 0.06) 135deg,
              transparent 180deg,
              rgba(139, 92, 246, 0.07) 225deg,
              transparent 270deg,
              rgba(165, 107, 255, 0.08) 315deg,
              transparent 360deg)
          `,
          animation: 'spin 60s linear infinite'
        }}
      />
    </div>
  );
}

// Main Showcase Component
export default function ShowcasePage() {
  const { t } = useLanguage();
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  const automationFeatures = [
    {
      id: 'ai-briefs',
      title: t("ai.showcase.features.aiBriefs.title"),
      description: t("ai.showcase.features.aiBriefs.description"),
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      demo: async () => {
        setIsGenerating(true);
        try {
          const response = await fetch('/api/ai-brief', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Demo Client',
              email: 'demo@example.com',
              company: 'TOBAIS Showcase',
              industry: 'Digital Marketing',
              goal: 'Demonstrate AI automation capabilities',
              style: 'Modern',
              budget: '10000',
              notes: 'Real-time AI generation demo'
            })
          });
          const data = await response.json();
          setAiInsights(data);
        } catch (error) {
          console.error('Error:', error);
        }
        setIsGenerating(false);
      }
    },
    {
      id: 'real-time-analytics',
      title: t("ai.showcase.features.analytics.title"),
      description: t("ai.showcase.features.analytics.description"),
      icon: Target,
      color: 'from-blue-500 to-cyan-500',
      demo: async () => {
        setIsGenerating(true);
        try {
          const response = await fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company: 'TOBAIS Showcase',
              industry: 'Digital Marketing'
            })
          });
          const data = await response.json();
          setAiInsights(data);
        } catch (error) {
          console.error('Error:', error);
          // Fallback to sample data if API fails
          setAiInsights({
            title: 'Real-Time Performance Dashboard',
            summary: 'Analytics en vivo mostrando conversiones, tráfico web, y engagement social en tiempo real.',
            bullets: [
              'Conversiones: +34% en las últimas 24h',
              'Tráfico web: 2,847 visitantes activos',
              'Engagement social: 89% de interacción positiva'
            ]
          });
        }
        setIsGenerating(false);
      }
    },
    {
      id: 'automation-flows',
      title: t("ai.showcase.features.automation.title"),
      description: t("ai.showcase.features.automation.description"),
      icon: Zap,
      color: 'from-green-500 to-emerald-500',
      demo: async () => {
        setIsGenerating(true);
        try {
          const response = await fetch('/api/automation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company: 'TOBAIS Showcase',
              industry: 'Digital Marketing',
              goal: 'Convertir leads en clientes mediante automatización inteligente'
            })
          });
          const data = await response.json();
          setAiInsights(data);
        } catch (error) {
          console.error('Error:', error);
          // Fallback to sample data if API fails
          setAiInsights({
            title: 'Automation Flow: Lead to Customer',
            summary: 'Proceso automatizado que convierte leads en clientes usando IA y triggers inteligentes.',
            bullets: [
              'Email personalizado enviado automáticamente',
              'Seguimiento basado en comportamiento del usuario',
              'Scoring predictivo para priorizar leads calientes'
            ]
          });
        }
        setIsGenerating(false);
      }
    },
    {
      id: 'predictive-insights',
      title: t("ai.showcase.features.insights.title"),
      description: t("ai.showcase.features.insights.description"),
      icon: Cpu,
      color: 'from-orange-500 to-red-500',
      demo: async () => {
        setIsGenerating(true);
        try {
          const response = await fetch('/api/insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company: 'TOBAIS Showcase',
              industry: 'Digital Marketing'
            })
          });
          const data = await response.json();
          setAiInsights(data);
        } catch (error) {
          console.error('Error:', error);
          // Fallback to sample data if API fails
          setAiInsights({
            title: 'Predictive Market Analysis',
            summary: 'Análisis predictivo que anticipa tendencias del mercado y oportunidades de crecimiento.',
            bullets: [
              'Predicción: Aumento del 42% en demanda Q2',
              'Oportunidad identificada en sector fintech',
              'Recomendación: Expandir servicios de automatización'
            ]
          });
        }
        setIsGenerating(false);
      }
    }
  ];

  // Color variant - can be switched between 'a' and 'b'
  const colorVariant = 'a'; // Change to 'b' for darker version
  
  const backgroundClasses = colorVariant === 'a' 
    ? "min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden relative"
    : "min-h-screen text-white overflow-hidden relative";
  
  const backgroundStyle = colorVariant === 'b' ? {
    background: 'linear-gradient(135deg, #140A27 0%, #2A1455 35%, #1A0D32 100%)'
  } : {};

  return (
    <div ref={containerRef} className={backgroundClasses} style={backgroundStyle}>
      {/* Navigation Button - Back to Home */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        onClick={() => window.location.href = '/'}
        className="fixed top-6 left-6 z-50 group flex items-center space-x-3 px-6 py-3 bg-black/30 backdrop-blur-md border border-purple-500/30 rounded-full hover:bg-black/50 hover:border-purple-400/50 transition-all duration-300"
        whileHover={{ scale: 1.05, x: -5 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
        <span className="text-white/90 group-hover:text-white font-medium">{t("ai.showcase.mainMenu")}</span>
        
        {/* Neon glow effect */}
        <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      </motion.button>

      {/* CSS-only 3D rotating elements that overflow containers */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full opacity-30 blur-xl animate-pulse" 
           style={{
             animation: 'spin 20s linear infinite, pulse 3s ease-in-out infinite',
             transform: 'translate3d(0, 0, 0) rotateY(45deg)',
             filter: 'blur(20px) brightness(1.2)'
           }} />
      
      <div className="absolute -top-10 -right-10 w-60 h-60 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full opacity-20 blur-2xl"
           style={{
             animation: 'spin 15s linear infinite reverse, bounce 4s ease-in-out infinite',
             transform: 'translate3d(0, 0, 0) rotateX(30deg)',
             filter: 'blur(30px) saturate(1.5)'
           }} />
      
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gradient-to-t from-emerald-500 via-cyan-500 to-transparent rounded-full opacity-25 blur-3xl"
           style={{
             transform: 'translateX(-50%) translate3d(0, 50%, 0) rotateZ(45deg)',
             animation: 'float 8s ease-in-out infinite',
             filter: 'blur(40px) hue-rotate(45deg)'
           }} />
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <AnimatedBackground variant={colorVariant} />
      </div>

      {/* Hero Section with Parallax */}
      <motion.section 
        style={{ y, scale }}
        className="relative z-10 h-screen flex items-center justify-center"
      >
        <div className="text-center space-y-12 px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-sm text-white border border-white/20 px-6 py-2 text-lg">
                <Sparkles className="w-5 h-5 mr-3" />
                {t("ai.showcase.badge")}
              </Badge>
            </motion.div>

            <motion.h1 
              className="text-8xl lg:text-9xl font-black bg-clip-text text-transparent leading-tight"
              style={{
                backgroundImage: colorVariant === 'b' 
                  ? 'linear-gradient(135deg, #ffffff 0%, #e2d5f7 30%, #fbb6ce 70%, #ffffff 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #ddd6fe 40%, #fbcfe8 100%)',
                textShadow: colorVariant === 'b' 
                  ? '0 0 60px rgba(165, 107, 255, 0.6), 0 8px 32px rgba(139, 92, 246, 0.4)'
                  : '0 0 40px rgba(139, 92, 246, 0.5), 0 4px 20px rgba(139, 92, 246, 0.3)',
                filter: 'drop-shadow(0 4px 20px rgba(139, 92, 246, 0.3))'
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 1, type: "spring", stiffness: 100 }}
            >
              {t("ai.showcase.title")}
            </motion.h1>

            <motion.p 
              className="text-4xl lg:text-5xl font-light text-gray-200 leading-tight"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {t("ai.showcase.subtitle")}
            </motion.p>

            <motion.p 
              className="text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              {t("ai.showcase.description")}
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="space-y-8"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-2xl px-12 py-6 shadow-2xl backdrop-blur-sm border border-purple-400/30 transition-all duration-300 hover:shadow-purple-500/25"
                onClick={() => {
                  document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Rocket className="w-7 h-7 mr-3" />
                {t("ai.showcase.liveDemoButton")}
              </Button>
            </motion.div>
            
            <motion.div 
              className="flex justify-center space-x-8 text-base text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <div className="flex items-center bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                <Activity className="w-5 h-5 mr-2 text-green-400" />
                {t("ai.showcase.realTimeAI")}
              </div>
              <div className="flex items-center bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                {t("ai.showcase.fullyAutomated")}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Interactive Demos Section */}
      <section id="demos" className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t("ai.showcase.interactiveTitle")}
            </h2>
            <h3 className="text-2xl font-semibold mb-6 text-gray-300">
              {t("ai.showcase.interactiveSubtitle")}
            </h3>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t("ai.showcase.interactiveDescription")}
            </p>
          </motion.div>

          {/* Three-level layout structure */}
          <div className="space-y-12 max-w-6xl mx-auto mb-12">
            
            {/* Level 1: Centered Brain CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-center"
            >
              <motion.div
                className="group cursor-pointer flex flex-col items-center justify-center space-y-6"
                onClick={() => window.location.href = '/demo'}
              >
                {/* Glowing Brain Icon - Neon Purple Effect */}
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.1 }}
                  animate={{
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    scale: {
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                >
                  {/* Multiple glow layers for intense neon effect */}
                  <div className="absolute inset-0 w-24 h-24 bg-gradient-to-r from-purple-400 via-fuchsia-500 to-pink-500 rounded-full blur-2xl opacity-80 animate-pulse"></div>
                  <div className="absolute inset-0 w-24 h-24 bg-gradient-to-r from-purple-500 to-fuchsia-600 rounded-full blur-xl opacity-90"></div>
                  
                  {/* Brain icon container with enhanced neon styling */}
                  <div className="relative w-24 h-24 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 rounded-full flex items-center justify-center border-2 border-fuchsia-400/70 shadow-2xl shadow-purple-500/50">
                    <Brain className="w-12 h-12 text-white drop-shadow-2xl" />
                    
                    {/* Inner glow */}
                    <div className="absolute inset-2 rounded-full bg-gradient-to-r from-fuchsia-400/30 to-purple-400/30 blur-md"></div>
                  </div>
                </motion.div>

                {/* Metallic CTA Button */}
                <motion.button
                  className="relative px-8 py-3 rounded-full text-white font-semibold text-lg transition-all duration-300 overflow-hidden group-hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 50%, #ec4899 100%)',
                    boxShadow: `
                      0 8px 32px rgba(124, 58, 237, 0.4),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                    `,
                    border: '1px solid rgba(192, 38, 211, 0.5)'
                  }}
                  whileHover={{ 
                    y: -2,
                    boxShadow: `
                      0 12px 40px rgba(124, 58, 237, 0.6),
                      inset 0 1px 0 rgba(255, 255, 255, 0.3),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                    `
                  }}
                  whileTap={{ y: 0, scale: 0.98 }}
                  aria-label="Pruébalo con tus propios datos"
                >
                  {/* Metallic shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  
                  {/* Button text */}
                  <span className="relative z-10">{t("ai.tryData")}</span>
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Level 2: First two cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {automationFeatures.slice(0, 2).map((feature, index) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    rotateY: 8,
                    rotateX: 5,
                    z: 50
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="group cursor-pointer"
                  onClick={() => {
                    setActiveDemo(feature.id);
                    feature.demo();
                  }}
                  style={{
                    transformStyle: "preserve-3d",
                    perspective: "1000px"
                  }}
                >
                  <div className="relative rounded-3xl p-8 h-[280px] overflow-hidden backdrop-blur-sm border border-white/10 transition-all duration-500 group-hover:shadow-2xl"
                       style={{
                         background: colorVariant === 'b' 
                           ? `linear-gradient(135deg, 
                               rgba(255,255,255,0.08) 0%, 
                               rgba(255,255,255,0.03) 50%, 
                               rgba(0,0,0,0.15) 100%),
                               ${feature.color.includes('purple') ? 'linear-gradient(135deg, #6b21a8, #be1e6b)' :
                                 feature.color.includes('blue') ? 'linear-gradient(135deg, #1e40af, #0e7490)' :
                                 feature.color.includes('green') ? 'linear-gradient(135deg, #047857, #065f46)' :
                                 'linear-gradient(135deg, #c2410c, #991b1b)'}`
                           : `linear-gradient(135deg, 
                               rgba(255,255,255,0.1) 0%, 
                               rgba(255,255,255,0.05) 50%, 
                               rgba(0,0,0,0.22) 100%),
                               ${feature.color.includes('purple') ? 'linear-gradient(135deg, #7c3aed, #db2777)' :
                                 feature.color.includes('blue') ? 'linear-gradient(135deg, #2563eb, #0891b2)' :
                                 feature.color.includes('green') ? 'linear-gradient(135deg, #059669, #047857)' :
                                 'linear-gradient(135deg, #ea580c, #b91c1c)'}`,
                         boxShadow: colorVariant === 'b' 
                           ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                           : '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                       }}
                  >
                    {/* Glassmorphism overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20 backdrop-blur-sm"></div>
                    
                    {/* Gloss effect */}
                    <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-t-3xl opacity-50"></div>
                    
                    {/* Content container with parallax */}
                    <div className="relative z-10 h-full flex flex-col">
                      {/* Icon container with enhanced styling */}
                      <motion.div 
                        className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30"
                        whileHover={{ scale: 1.1, rotateY: 15 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <feature.icon className="w-8 h-8 text-white drop-shadow-lg" />
                      </motion.div>

                      {/* Title and description */}
                      <div className="flex-1 space-y-3">
                        <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                          {feature.title}
                        </h3>
                        <p className="text-white/90 text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </div>

                      {/* Enhanced CTA button */}
                      <motion.button
                        className="mt-6 w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-xl py-3 px-6 text-white font-medium transition-all duration-300 hover:shadow-lg"
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                      >
                        {t("ai.showcase.demoButton")}
                      </motion.button>
                    </div>

                    {/* Animated border glow */}
                    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                         style={{
                           background: `linear-gradient(135deg, transparent, rgba(255,255,255,0.1), transparent)`,
                           boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2)`
                         }}>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Level 3: Last two cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {automationFeatures.slice(2, 4).map((feature, index) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    rotateY: 8,
                    rotateX: 5,
                    z: 50
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="group cursor-pointer"
                  onClick={() => {
                    setActiveDemo(feature.id);
                    feature.demo();
                  }}
                  style={{
                    transformStyle: "preserve-3d",
                    perspective: "1000px"
                  }}
                >
                  <div className="relative rounded-3xl p-8 h-[280px] overflow-hidden backdrop-blur-sm border border-white/10 transition-all duration-500 group-hover:shadow-2xl"
                       style={{
                         background: colorVariant === 'b' 
                           ? `linear-gradient(135deg, 
                               rgba(255,255,255,0.08) 0%, 
                               rgba(255,255,255,0.03) 50%, 
                               rgba(0,0,0,0.15) 100%),
                               ${feature.color.includes('purple') ? 'linear-gradient(135deg, #6b21a8, #be1e6b)' :
                                 feature.color.includes('blue') ? 'linear-gradient(135deg, #1e40af, #0e7490)' :
                                 feature.color.includes('green') ? 'linear-gradient(135deg, #047857, #065f46)' :
                                 'linear-gradient(135deg, #c2410c, #991b1b)'}`
                           : `linear-gradient(135deg, 
                               rgba(255,255,255,0.1) 0%, 
                               rgba(255,255,255,0.05) 50%, 
                               rgba(0,0,0,0.22) 100%),
                               ${feature.color.includes('purple') ? 'linear-gradient(135deg, #7c3aed, #db2777)' :
                                 feature.color.includes('blue') ? 'linear-gradient(135deg, #2563eb, #0891b2)' :
                                 feature.color.includes('green') ? 'linear-gradient(135deg, #059669, #047857)' :
                                 'linear-gradient(135deg, #ea580c, #b91c1c)'}`,
                         boxShadow: colorVariant === 'b' 
                           ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                           : '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                       }}
                  >
                    {/* Glassmorphism overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20 backdrop-blur-sm"></div>
                    
                    {/* Gloss effect */}
                    <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-t-3xl opacity-50"></div>
                    
                    {/* Content container with parallax */}
                    <div className="relative z-10 h-full flex flex-col">
                      {/* Icon container with enhanced styling */}
                      <motion.div 
                        className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30"
                        whileHover={{ scale: 1.1, rotateY: 15 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <feature.icon className="w-8 h-8 text-white drop-shadow-lg" />
                      </motion.div>

                      {/* Title and description */}
                      <div className="flex-1 space-y-3">
                        <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                          {feature.title}
                        </h3>
                        <p className="text-white/90 text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </div>

                      {/* Enhanced CTA button */}
                      <motion.button
                        className="mt-6 w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-xl py-3 px-6 text-white font-medium transition-all duration-300 hover:shadow-lg"
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                      >
                        {t("ai.showcase.demoButton")}
                      </motion.button>
                    </div>

                    {/* Animated border glow */}
                    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                         style={{
                           background: `linear-gradient(135deg, transparent, rgba(255,255,255,0.1), transparent)`,
                           boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2)`
                         }}>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* AI Results Display */}
          {(aiInsights || isGenerating) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-black/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30"
            >
              {isGenerating ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    <span className="text-xl">Generando con IA...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-400 font-medium">AI Response - Generado en tiempo real</span>
                  </div>
                  
                  <h3 className="text-3xl font-bold text-white">{aiInsights.title}</h3>
                  
                  <p className="text-gray-300 text-lg leading-relaxed">{aiInsights.summary}</p>
                  
                  <div className="space-y-3">
                    <h4 className="text-xl font-semibold text-purple-400">Puntos Clave:</h4>
                    <ul className="space-y-2">
                      {aiInsights.bullets && aiInsights.bullets.map((bullet: string, index: number) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start space-x-3"
                        >
                          <Sparkles className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-200">{bullet}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>


    </div>
  );
}