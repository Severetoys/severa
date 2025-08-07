
"use client";

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function WhatsAppButton() {
  const pathname = usePathname();
  const whatsappUrl = `https://wa.me/italosantos`;
  
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <a 
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
            "fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2 group",
        )}
        aria-label="Fale conosco no WhatsApp"
    >
         <div className="order-1 text-lg font-bold text-yellow-300 animate-pulse-gold-glow text-shadow-neon-gold">
            WHATSAPP
        </div>
        <div
            className={cn(
                "relative h-16 w-16 transition-all duration-300 order-2 animate-pulse-green-glow rounded-full"
            )}
        >
            <img 
                src="/Icon-Whatsapp.svg" 
                alt="WhatsApp"
                width={64}
                height={64}
                style={{ objectFit: 'contain', transition: 'transform 0.3s' }}
                className="group-hover:scale-110 rounded-full"
            />
        </div>
    </a>
  );
}
