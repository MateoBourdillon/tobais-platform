import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from '@/components/utils/ScrollToTop';

interface PageLayoutProps {
  children: ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
};

export default PageLayout;