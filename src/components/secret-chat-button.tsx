
"use client";

import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import Image from 'next/image';


interface SecretChatButtonProps {
    onClick: () => void;
    isChatOpen: boolean;
}

export default function SecretChatButton({ onClick, isChatOpen }: SecretChatButtonProps) {
    return (
       <div
            className={cn(
                "fixed bottom-6 left-6 z-[1001] flex flex-col items-center gap-2"
            )}
       >
            <div className="order-1 text-lg font-bold text-yellow-300 animate-pulse-gold-glow text-shadow-neon-gold">
                CHAT SECRETO
            </div>
            <button
                onClick={onClick}
                aria-label={isChatOpen ? "Fechar Chat Secreto" : "Abrir Chat Secreto"}
                className={cn(
                    "relative h-16 w-16 transition-all duration-300 order-2 group animate-pulse-red-glow rounded-full"
                )}
            >
                {isChatOpen ? (
                    <div className="flex items-center justify-center h-full w-full bg-card rounded-full border-2 border-primary">
                        <X className="h-9 w-9 text-primary" />
                    </div>
                ) : (
                    <img
                        src="/lcon-chat-secreto.svg"
                        alt="Chat Secreto"
                        width={64}
                        height={64}
                        style={{ objectFit: 'contain', transition: 'transform 0.3s' }}
                        className="group-hover:scale-110 rounded-full"
                    />
                )}
            </button>
       </div>
    );
}
