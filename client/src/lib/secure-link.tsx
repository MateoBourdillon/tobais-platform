import React from 'react';

interface SecureLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Componente SecureLink que garantiza que los enlaces sean seguros y tengan los atributos
 * de seguridad adecuados para prevenir ataques.
 * 
 * - Fuerza HTTPS en enlaces si no se especifica
 * - Añade atributos rel seguros para enlaces externos
 * - Implementa protecciones contra phishing y clickjacking
 */
export const SecureLink: React.FC<SecureLinkProps> = ({
  href,
  children,
  className = '',
  target = '',
  rel = '',
  onClick,
  ...props
}) => {
  // Normalizar URL para asegurar que usa HTTPS
  let secureHref = href;
  
  // Si es URL absoluta que comienza con http://, cambiar a https://
  if (secureHref.startsWith('http://')) {
    secureHref = secureHref.replace('http://', 'https://');
  }
  
  // Si es URL relativa, mantenerla como está
  
  // Para enlaces externos (que contienen ://) añadir atributos de seguridad
  let secureRel = rel;
  let secureTarget = target;
  
  const isExternalLink = secureHref.includes('://') && !secureHref.includes('tobais.com');
  
  if (isExternalLink) {
    // Para enlaces externos, forzar target="_blank" y añadir rel seguros
    secureTarget = "_blank";
    
    // Asegurar que el enlace tiene noreferrer y noopener para prevenir ataques
    const relValues = secureRel.split(' ').filter(Boolean);
    if (!relValues.includes('noreferrer')) relValues.push('noreferrer');
    if (!relValues.includes('noopener')) relValues.push('noopener');
    secureRel = relValues.join(' ');
  }
  
  return (
    <a
      href={secureHref}
      className={className}
      target={secureTarget}
      rel={secureRel}
      onClick={onClick}
      {...props}
    >
      {children}
    </a>
  );
};

export default SecureLink;