import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import ScrollLink from "@/components/utils/ScrollLink";
import { Button } from "@/components/ui/button";
import { motion, useAnimation } from "framer-motion";
import { BarChart, Zap, Brain } from "lucide-react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import heroVideo from "/images/hiperrealistcTOBAIS.mp4";

export default function Hero() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2
  });
  
  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };
  

  
  // Animated cards for features
  const features = [
    { 
      icon: <Brain className="w-10 h-10" />,
      title: t("hero.features.ai.title"),
      description: t("hero.features.ai.description"),
      color: "from-blue-600 to-purple-600"
    },
    { 
      icon: <BarChart className="w-10 h-10" />,
      title: t("hero.features.analytics.title"),
      description: t("hero.features.analytics.description"),
      color: "from-emerald-600 to-teal-600"
    },
    { 
      icon: <Zap className="w-10 h-10" />,
      title: t("hero.features.automation.title"),
      description: t("hero.features.automation.description"),
      color: "from-amber-500 to-orange-600"
    }
  ];

  // Scroll down animation for the indicator
  const scrollIndicatorVariants = {
    hidden: { y: -10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        delay: 2,
        duration: 0.5,
        repeat: Infinity,
        repeatType: "reverse" as const,
        repeatDelay: 0.2
      }
    }
  };
  
  return (
    <section 
      id="home" 
      ref={ref}
      className="relative overflow-hidden min-h-[90vh] bg-black"
    >
      {/* Video background */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={heroVideo} type="video/mp4" />
      </video>
      
      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-0"></div>
      

      
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-28 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="text-white space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate={controls}
          >
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold font-['Poppins'] text-white leading-tight"
              variants={itemVariants}
            >
              {t("hero.title")}
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl opacity-90 text-white"
              variants={itemVariants}
            >
              {t("hero.subtitle")}
            </motion.p>
            
            <motion.div 
              className="flex flex-wrap gap-4 pt-4"
              variants={itemVariants}
            >
              <ScrollLink href="/contact">
                <div className="relative overflow-hidden group cursor-pointer">
                  <span className="text-white font-bold text-lg transition-all duration-300 relative z-10 px-8 py-3 inline-block">
                    {t("hero.cta1")}
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-950 to-gray-900 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg"></span>
                  {/* Metallic shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </div>
              </ScrollLink>
              
              <ScrollLink href="/contact">
                <div className="relative overflow-hidden group cursor-pointer">
                  <span className="text-white font-bold text-lg transition-all duration-300 relative z-10 px-8 py-3 inline-block">
                    {t("hero.cta2")}
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-950 to-gray-900 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg"></span>
                  {/* Metallic shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </div>
              </ScrollLink>
            </motion.div>
          </motion.div>
          
          {/* Animated feature cards */}
          <motion.div 
            className="flex flex-col space-y-6"
            initial={{ opacity: 0 }}
            animate={controls}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`bg-gradient-to-r ${feature.color} bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-xl p-6 border border-white/10 shadow-xl transition-all hover:translate-x-1 hover:-translate-y-1 overflow-hidden relative group`}
                initial={{ opacity: 0, x: 50 }}
                animate={controls}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.15 }}
                whileHover={{ 
                  scale: 1.03,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
                  transition: { duration: 0.2 } 
                }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1500 ease-in-out" />
                
                <div className="flex items-start space-x-4 relative z-10">
                  <div className="bg-white/20 p-3 rounded-lg text-white transition-all duration-300 group-hover:bg-white/30">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-white/90">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
      

      {/* No additional decorative elements needed since we're using the background image */}
    </section>
  );
}
