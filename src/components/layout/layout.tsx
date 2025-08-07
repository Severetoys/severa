"use client";

import { useState, useEffect } from 'react';
import Header from './header';
import Sidebar from './sidebar';
import FetishModal from '@/components/fetish-modal';
import type { Fetish } from '@/lib/fetish-data';
import AdultWarningDialog from '@/components/adult-warning-dialog';
import SiteFooter from './site-footer';
import { usePathname } from 'next/navigation';
import SecretChatWidget from '@/components/secret-chat-widget';
import SecretChatButton from '@/components/secret-chat-button';
import MainFooter from './main-footer';

// Removido todos os imports e mocks do Firebase

const getOrCreateChatId = (): string => {
    if (typeof window === 'undefined') {
        return '';
    }
    let chatId = localStorage.getItem('secretChatId');
    if (!chatId) {
        const randomId = Math.random().toString(36).substring(2, 8);
        chatId = `secret-chat-${randomId}`;
        localStorage.setItem('secretChatId', chatId);
    }
    return chatId;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFetish, setSelectedFetish] = useState<Fetish | null>(null);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
    const hasConfirmedAge = localStorage.getItem('ageConfirmed');
    if (!hasConfirmedAge) {
      setIsWarningOpen(true);
    }

    const trackVisitor = async () => {
        if (pathname.startsWith('/admin')) return;

        try {
            // Envia dados para o Worker do Cloudflare
            await fetch('YOUR_CLOUDFLARE_WORKER_URL/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatId: getOrCreateChatId(),
                    pathname: pathname
                }),
            });
        } catch (error) {
            console.error("Erro ao enviar dados de rastreamento para o Worker:", error);
        }
    };

    trackVisitor();

  }, [pathname]);

  const handleConfirmAge = () => {
    localStorage.setItem('ageConfirmed', 'true');
    setIsWarningOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleFetishSelect = (fetish: Fetish) => {
    setSelectedFetish(fetish);
    setSidebarOpen(false); 
  };

  const handleCloseModal = () => {
    setSelectedFetish(null);
  };

  if (!isClient) {
    return null;
  }

  const isAdminPanel = pathname.startsWith('/admin');
  const noHeaderLayoutRoutes = ['/auth', '/old-auth-page', '/chat-secreto'];
  const showHeader = !noHeaderLayoutRoutes.some(route => pathname.startsWith(route)) && !isAdminPanel;
  
  const showMainFooter = pathname === '/';
  const showSiteFooter = !noHeaderLayoutRoutes.some(route => pathname.startsWith(route)) && !showMainFooter && !isAdminPanel;
  const showChat = !isAdminPanel;

  if (isAdminPanel) {
    return <>{children}</>;
  }

  return (
    <>
      <AdultWarningDialog isOpen={isWarningOpen} onConfirm={handleConfirmAge} />
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        { showHeader && <Header onMenuClick={toggleSidebar} /> }
        <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={toggleSidebar} 
            onFetishSelect={handleFetishSelect} 
        />
        <main className="flex-grow flex flex-col items-center">{children}</main>
        {showMainFooter && <MainFooter />}
        {showSiteFooter && <SiteFooter />}
      </div>
      {showChat && (
        <>
            <SecretChatWidget isOpen={isChatOpen} />
            <SecretChatButton onClick={toggleChat} isChatOpen={isChatOpen} />
        </>
      )}
      {selectedFetish && (
        <FetishModal 
          fetish={selectedFetish} 
          isOpen={!!selectedFetish} 
          onClose={handleCloseModal} 
        />
      )}
    </>
  );
};

export default Layout;