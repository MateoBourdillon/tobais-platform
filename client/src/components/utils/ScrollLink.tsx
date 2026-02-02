import { Link } from 'wouter';
import { ReactNode } from 'react';

interface ScrollLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

/**
 * ScrollLink component that scrolls to top when clicked
 * Wraps the wouter Link component with scroll to top functionality
 */
export default function ScrollLink({
  href,
  className,
  children,
  onClick,
  ...props
}: ScrollLinkProps) {
  const handleClick = () => {
    // Scroll to top immediately when link is clicked
    window.scrollTo(0, 0);
    
    // Call any additional onClick handler if provided
    if (onClick) {
      onClick();
    }
  };

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}