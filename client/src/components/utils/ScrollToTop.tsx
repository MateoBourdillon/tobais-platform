import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * ScrollToTop component that scrolls the window to the top when the route changes
 */
export default function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null; // This component doesn't render anything
}