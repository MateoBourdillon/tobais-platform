import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import ScrollLink from "@/components/utils/ScrollLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/use-auth";
import { useStaffAuth } from "@/hooks/use-staff-auth";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Moon, Sun, Menu, X, Shield, Brain } from "lucide-react";
import tobaisLogo from "/images/TOBAIS_NewLogoT_webp.webp";

export default function Navbar() {
  const [location] = useLocation();
  const { language, t, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logoutMutation } = useAuth();
  const { user: staffUser, isStaff: isStaffAuthenticated } = useStaffAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  
  // Close mobile menu when navigating
  useEffect(() => {
    setIsOpen(false);
  }, [location]);
  
  const isActive = (path: string) => {
    return location === path 
      ? "border-primary-500 dark:border-primary-400 border-b-[3px] text-primary-600 dark:text-primary-300 font-semibold bg-gray-50 dark:bg-gray-700" 
      : "border-transparent hover:border-primary-300 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400";
  };
  
  const navItems = [
    { path: "/", label: t("navigation.home") },
    { path: "/services", label: t("navigation.services") },
    { path: "/projects", label: t("navigation.projects") },
    { path: "/about", label: t("navigation.about") },
    { path: "/blog", label: t("navigation.blog") },
    { path: "/contact", label: t("navigation.contact") },
    { path: "/showcase", label: "Showcase", special: "violet" }
  ];
  
  // External link to TOBAISTOCK
  const externalLinks = [
    { url: "https://tobaistock.com/", label: "TOBAISTOCK", special: "blue" }
  ];
  
  const toggleMenu = () => setIsOpen(!isOpen);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <ScrollLink href="/" className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center overflow-hidden border-2 border-primary-500 mr-2">
                  <img 
                    src={tobaisLogo} 
                    alt="TOBAIS Logo" 
                    className="h-10 w-10 object-cover" 
                  />
                </div>
                <span className="text-2xl font-['Poppins'] font-bold text-primary-600 dark:text-primary-400 cursor-pointer">TOBAIS</span>
              </ScrollLink>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navItems.map((item) => (
                <ScrollLink 
                  key={item.path} 
                  href={item.path} 
                  className={`inline-flex items-center px-4 py-2 border-b-2 rounded-t-md text-sm font-medium transition-all ${
                    item.special === 'violet' 
                      ? 'text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 bg-violet-50/80 dark:bg-violet-900/20 hover:bg-violet-100/90 dark:hover:bg-violet-900/30 border-violet-300 shadow-sm hover:shadow-violet-200/50 dark:hover:shadow-violet-900/20'
                      : isActive(item.path)
                  }`}
                >
                  {item.label}
                </ScrollLink>
              ))}
              {/* External links */}
              {externalLinks.map((link) => (
                <a 
                  key={link.url} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`inline-flex items-center px-4 py-2 border-b-2 rounded-t-md text-sm font-medium transition-all ${
                    link.special === 'blue'
                      ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50/80 dark:bg-blue-900/20 hover:bg-blue-100/90 dark:hover:bg-blue-900/30 border-blue-300 shadow-sm hover:shadow-blue-200/50 dark:hover:shadow-blue-900/20'
                      : 'border-transparent text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          
          <div className="flex items-center">
            {/* Language toggle */}
            <button 
              onClick={toggleLanguage}
              className="ml-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
              aria-label={`Switch language to ${language === 'en' ? 'Spanish' : 'English'}`}
            >
              <span className="flex items-center text-sm font-medium">
                {language === 'en' ? 'EN' : 'ES'}
              </span>
            </button>
            
            {/* Theme toggle */}
            <button 
              onClick={toggleTheme}
              className="ml-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon size={18} />
              ) : (
                <Sun size={18} />
              )}
            </button>
            
            {/* Auth buttons (desktop) */}
            <div className="hidden md:flex items-center ml-4">
              {user ? (
                <>
                  <div className="flex items-center mr-3">
                    <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm mr-2">
                      {(user.firstName ? user.firstName.charAt(0) : user.username.charAt(0)).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {user.firstName || user.username}
                    </span>
                  </div>
                  <ScrollLink href="/dashboard">
                    <Button variant="ghost" size="sm" className="mr-2">
                      {t("navigation.dashboard")}
                    </Button>
                  </ScrollLink>
                  {isStaffAuthenticated && (
                    <ScrollLink href="/staff-dashboard">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mr-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      >
                        <Brain className="w-4 h-4 mr-1" />
                        Staff Portal
                      </Button>
                    </ScrollLink>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="border-gray-300 dark:border-gray-500 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t("navigation.logout")}
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <ScrollLink href="/auth">
                    <Button variant="outline" size="sm">
                      {t("navigation.login")}
                    </Button>
                  </ScrollLink>
                  <ScrollLink href="/auth?mode=register">
                    <Button variant="default" size="sm">
                      {t("navigation.signup")}
                    </Button>
                  </ScrollLink>
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="-mr-2 flex items-center md:hidden">
              <button 
                onClick={toggleMenu}
                className="bg-white dark:bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700`}>
        <div className="pt-2 pb-3 space-y-0">
          {navItems.map((item) => (
            <ScrollLink 
              key={item.path} 
              href={item.path}
              className={`block pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors ${
                item.special === 'violet'
                  ? 'text-violet-600 dark:text-violet-400 bg-violet-50/80 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 mx-2 rounded-lg'
                  : location === item.path 
                    ? 'border-primary-500 dark:border-primary-300 border-l-[4px] bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 font-semibold' 
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
              }`}
            >
              {item.label}
            </ScrollLink>
          ))}
          
          {/* External links for mobile menu */}
          {externalLinks.map((link) => (
            <a 
              key={link.url} 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`block pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors ${
                link.special === 'blue'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 mx-2 rounded-lg'
                  : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300'
              }`}
            >
              {link.label}
            </a>
          ))}
          
          {/* Auth buttons (mobile) */}
          {user ? (
            <>
              <div className="flex items-center pl-3 pr-4 py-3 border-l-4 border-transparent bg-gray-50 dark:bg-gray-700">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm mr-2">
                  {(user.firstName ? user.firstName.charAt(0) : user.username.charAt(0)).toUpperCase()}
                </div>
                <span className="text-base font-medium text-gray-700 dark:text-gray-200">
                  {user.firstName || user.username}
                </span>
              </div>
              <ScrollLink 
                href="/dashboard"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-base font-medium transition-colors"
              >
                {t("navigation.dashboard")}
              </ScrollLink>
              {isStaffAuthenticated && (
                <ScrollLink 
                  href="/staff-dashboard"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent hover:bg-purple-50 dark:hover:bg-purple-900/20 text-base font-medium transition-colors text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                >
                  <div className="flex items-center">
                    <Brain className="w-4 h-4 mr-2" />
                    Staff Portal
                  </div>
                </ScrollLink>
              )}
              <button 
                onClick={handleLogout}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-base font-medium transition-colors"
              >
                {t("navigation.logout")}
              </button>
            </>
          ) : (
            <>
              <ScrollLink 
                href="/auth"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-base font-medium transition-colors"
              >
                {t("navigation.login")}
              </ScrollLink>
              <ScrollLink 
                href="/auth?mode=register"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-base font-medium transition-colors"
              >
                {t("navigation.signup")}
              </ScrollLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
