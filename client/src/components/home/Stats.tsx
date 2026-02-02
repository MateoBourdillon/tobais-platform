import { useLanguage } from "@/contexts/LanguageContext";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Brain } from "lucide-react";

export default function Stats() {
  const { t } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const handleDemoClick = () => {
    window.location.href = '/demo';
  };
  
  return (
    <section className="py-16 bg-primary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center" ref={ref}>
          <motion.div
            className="group cursor-pointer flex flex-col items-center justify-center space-y-6"
            onClick={handleDemoClick}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
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
              {/* Bright aura glow layers for dark metallic blue effect */}
              <div className="absolute inset-0 w-28 h-28 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 rounded-full blur-3xl opacity-40 animate-pulse"></div>
              <div className="absolute inset-0 w-26 h-26 bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 rounded-full blur-2xl opacity-30"></div>
              <div className="absolute inset-0 w-24 h-24 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full blur-xl opacity-20"></div>
              
              {/* Brain icon container with dark metallic blue styling */}
              <div className="relative w-24 h-24 bg-gradient-to-r from-slate-900 via-blue-950 to-gray-900 rounded-full flex items-center justify-center border-2 border-blue-700/50 shadow-2xl shadow-blue-900/50">
                <Brain className="w-12 h-12 text-slate-200 drop-shadow-2xl" />
                
                {/* Inner dark metallic glow */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-800/20 to-slate-700/20 blur-md"></div>
              </div>
            </motion.div>

            {/* Metallic Blue CTA Button */}
            <motion.button
              className="relative px-8 py-4 rounded-full text-white font-semibold text-lg transition-all duration-300 overflow-hidden group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
                boxShadow: `
                  0 8px 32px rgba(15, 23, 42, 0.6),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                `,
                border: '1px solid rgba(51, 65, 85, 0.5)'
              }}
              whileHover={{ 
                y: -2,
                boxShadow: `
                  0 12px 40px rgba(15, 23, 42, 0.8),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.4)
                `
              }}
              whileTap={{ y: 0, scale: 0.98 }}
              aria-label="Automatization con IA - pruébalo con tus datos"
            >
              {/* Metallic shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              
              {/* Button text with two lines */}
              <span className="relative z-10 flex flex-col items-center leading-tight">
                <span className="text-lg font-bold">{t("ai.automation")}</span>
                <span className="text-sm font-medium opacity-90">{t("ai.tryData")}</span>
              </span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}