"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Loader2, MapPin, Paperclip, Video, Mic, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

// Importes REAL do Cloudflare Workers
// Note: A lógica para a comunicação com o Cloudflare Workers precisaria ser implementada
// Este é um exemplo de como a estrutura de importação e as referências poderiam ser adaptadas.
// As funções `onSnapshot`, `addDoc`, etc., do Firebase não têm equivalentes diretos
// e precisariam ser substituídas por chamadas a uma API do Cloudflare Workers.
// Aqui, criamos um mock simples para ilustrar a mudança.

const API_ENDPOINT = 'https://your-cloudflare-worker.your-account.workers.dev';

interface Message {
  id: string;
  senderId: string;
  text: string; 
  originalText?: string;
  timestamp: Date; // Usando objeto Date em vez de Timestamp do Firebase
  isLocation?: boolean;
  imageUrl?: string;
  isTemporary?: boolean;
}

const getOrCreateChatId = (): string => {
    if (typeof window === 'undefined') return '';
    
    const sessionId = Math.random().toString(36).substring(2, 12);
    const timestamp = Date.now();
    const chatId = `secret-chat-${timestamp}-${sessionId}`;
    
    console.log(`[Chat Widget] Novo chat temporário criado: ${chatId}`);
    
    return chatId;
};

// Mock de um usuário para simular a autenticação anônima do Firebase
const mockUser = {
    uid: getOrCreateChatId(),
};

interface SecretChatWidgetProps {
    isOpen: boolean;
}

export default function SecretChatWidget({ isOpen }: SecretChatWidgetProps) {
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [currentUser, setCurrentUser] = useState<typeof mockUser | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatId = useRef<string>('');

    const [showVideoCall, setShowVideoCall] = useState(false);

    useEffect(() => {
        if (isOpen && !chatId.current) {
            chatId.current = getOrCreateChatId();
            console.log(`[Chat Widget] Chat temporário iniciado: ${chatId.current}`);
        }
    }, [isOpen]);

    // Simula a autenticação anônima com um usuário mock
    useEffect(() => {
        if (!isOpen) return;

        setIsAuthenticating(true);
        // Simula um tempo de autenticação
        setTimeout(() => {
            setCurrentUser(mockUser);
            setIsAuthenticating(false);
            console.log('User signed in:', mockUser.uid);
        }, 500);

    }, [isOpen]);

    // Simula a escuta de mensagens com polling em vez de onSnapshot
    useEffect(() => {
        if (!currentUser || !chatId.current || !isOpen) {
            if (!isOpen) setIsLoading(true);
            return;
        }

        setIsLoading(true);

        const fetchMessages = async () => {
            try {
                const response = await fetch(`${API_ENDPOINT}/chats/${chatId.current}/messages`);
                if (!response.ok) throw new Error('Network response was not ok');
                const msgs: Message[] = await response.json();
                setMessages(msgs);
                setIsLoading(false);
            } catch (error) {
                console.error("Erro ao buscar mensagens: ", error);
                setIsLoading(false);
                toast({
                    variant: 'destructive',
                    title: 'Erro no chat',
                    description: 'Não foi possível carregar as mensagens. Recarregue a página.'
                });
            }
        };

        // Simula a escuta em tempo real com polling a cada 3 segundos
        fetchMessages();
        const intervalId = setInterval(fetchMessages, 3000);

        return () => clearInterval(intervalId);

    }, [currentUser, isOpen, toast]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSendMessage = useCallback(async (text: string, options: { isLocation?: boolean; imageUrl?: string } = {}) => {
        const { isLocation = false, imageUrl = '' } = options;
        const trimmedMessage = text.trim();
        if ((trimmedMessage === '' && !imageUrl) || isSending || !currentUser || !chatId.current) return;
        
        setIsSending(true);

        try {
            const messagePayload = {
                text: trimmedMessage,
                senderId: currentUser.uid,
                timestamp: new Date().toISOString(), // Usando ISO string para a data
                isLocation,
                imageUrl,
                isTemporary: true,
            };

            const response = await fetch(`${API_ENDPOINT}/chats/${chatId.current}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messagePayload),
            });

            if (!response.ok) throw new Error('Failed to send message');
            
            if (!isLocation && !imageUrl) {
                setNewMessage('');
            }
        } catch (error: any) {
            console.error("Erro ao enviar mensagem:", error);
            toast({ 
                variant: 'destructive', 
                title: 'Erro ao Enviar',
                description: `Falha ao enviar mensagem: ${error.message || 'Erro desconhecido'}`
            });
        } finally {
            setIsSending(false);
        }
    }, [isSending, currentUser, toast]);
    
    const sendLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast({ variant: 'destructive', title: 'Geolocalização não suportada.' });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
                handleSendMessage(link, { isLocation: true });
            },
            () => {
                toast({ variant: 'destructive', title: 'Não foi possível obter sua localização.' });
            }
        );
    }, [handleSendMessage, toast]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser || !chatId.current) {
            return;
        }

        setIsSending(true);
        toast({ title: "Enviando imagem..." });

        try {
            // A lógica de upload de arquivos precisaria ser adaptada para o Cloudflare
            // Aqui, estamos simulando o upload para um Worker que armazena em R2, por exemplo
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_ENDPOINT}/upload/${chatId.current}`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('File upload failed');
            
            const { imageUrl } = await response.json();
            
            await handleSendMessage(`Imagem: ${file.name}`, { imageUrl: imageUrl });
            toast({ title: "Imagem enviada com sucesso!" });
        } catch (error: any) {
            console.error("Erro ao enviar imagem:", error);
            
            toast({ 
                variant: 'destructive', 
                title: 'Erro ao enviar imagem', 
                description: 'Erro desconhecido ao enviar imagem.'
            });
        } finally {
            setIsSending(false);
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    const renderMessageContent = (msg: Message) => {
        if (msg.imageUrl) {
            return (
                 <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                    <Image src={msg.imageUrl} alt="Imagem enviada" width={200} height={200} className="rounded-md max-w-full h-auto" />
                </a>
            );
        }
        if (msg.senderId === currentUser?.uid) {
            if (msg.isLocation && msg.text?.startsWith('http')) {
                 return (
                    <a href={msg.text} target="_blank" rel="noopener noreferrer" className="underline flex items-center gap-1 text-primary-foreground">
                        <MapPin className="h-4 w-4" /> Minha Localização
                    </a>
                );
            }
            return msg.text;
        }
        return msg.text;
    };
    
    if (!isOpen) return null;

    if (showVideoCall) {
        return (
            <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center">
                <div className="text-white text-center">
                    <p className="text-xl mb-4">Chamada de vídeo temporariamente indisponível</p>
                    <Button onClick={() => setShowVideoCall(false)} variant="outline">
                        Fechar
                    </Button>
                </div>
            </div>
        );
    }


    return (
        <div className={cn("fixed bottom-24 left-6 z-[1000] transition-all duration-300", isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none")}>
            <Card className="w-[360px] h-[500px] max-w-md flex flex-col animate-in fade-in-0 zoom-in-95 duration-500 shadow-neon-red-strong border-primary/50 bg-black/90 backdrop-blur-xl md:rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-center relative border-b border-primary/20">
                    <CardTitle className="text-xl text-primary text-shadow-neon-red-light">
                        CHAT SECRETO
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                     {(isLoading || isAuthenticating) ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-10 w-10 animate-spin text-primary"/>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === 'admin' ? 'justify-start' : 'justify-end')}>
                                {msg.senderId === 'admin' && (
                                    <div className="relative">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>A</AvatarFallback>
                                        </Avatar>
                                        <CheckCircle 
                                            className="absolute -bottom-1 -right-1 h-4 w-4 text-blue-500 bg-white rounded-full"
                                        />
                                    </div>
                                )}
                                <div className={cn(
                                    "max-w-xs md:max-w-md rounded-lg px-3 py-2 relative",
                                    msg.senderId === 'admin' ? 'bg-secondary text-secondary-foreground rounded-bl-sm' : 'bg-primary text-primary-foreground rounded-br-sm'
                                )}>
                                    <div className="text-sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {renderMessageContent(msg)}
                                    </div>
                                    <p className="text-xs text-right opacity-70 mt-1">
                                        {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Enviando...'}
                                    </p>
                                </div>
                                {msg.senderId !== 'admin' && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>
                <CardFooter className="border-t border-primary/20 p-2.5 flex flex-col items-start gap-2">
                     <div className="flex w-full items-center space-x-1">
                        <Button variant="ghost" size="icon" className="text-primary" onClick={() => setShowVideoCall(true)} disabled={!currentUser}><Video className="h-5 w-5"/></Button>
                        <Button variant="ghost" size="icon" className="text-primary" onClick={() => fileInputRef.current?.click()} disabled={!currentUser}><Paperclip className="h-5 w-5"/></Button>
                        <Button variant="ghost" size="icon" className="text-primary" onClick={sendLocation} disabled={!currentUser}><MapPin className="h-5 w-5"/></Button>
                        <Button variant="ghost" size="icon" className="text-primary" disabled><Mic className="h-5 w-5"/></Button>
                     </div>
                    <div className="flex w-full items-center space-x-2">
                        <Textarea
                            placeholder={isAuthenticating ? "Autenticando..." : "Mensagem..."}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(newMessage);
                                }
                            }}
                            className="flex-1 bg-primary/20 border-primary/30 focus:shadow-neon-red-light min-h-[40px] h-10 max-h-24 resize-none rounded-2xl px-4 text-white placeholder:text-neutral-400"
                            disabled={isSending || newMessage.trim() === '' || isAuthenticating}
                            rows={1}
                        />
                        <Button 
                            type="submit" 
                            size="icon" 
                            onClick={() => handleSendMessage(newMessage)} 
                            disabled={isSending || newMessage.trim() === '' || isAuthenticating}
                            className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-full w-10 h-10 flex-shrink-0"
                            aria-label="Enviar Mensagem"
                        >
                            {isAuthenticating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}