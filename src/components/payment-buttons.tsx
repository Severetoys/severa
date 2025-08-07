
"use client";

import { Wallet, initMercadoPago } from '@mercadopago/sdk-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import PixPaymentModal from './pix-payment-modal';
import PayPalButton from './paypal-button-enhanced';
import { Button } from './ui/button';
import { CreditCard, Smartphone, Apple } from 'lucide-react';

interface PaymentButtonsProps {
    onPaymentSuccess: () => void;
    amount: number;
    currency: string;
}

export default function PaymentButtons({ onPaymentSuccess, amount, currency }: PaymentButtonsProps) {
    const { toast } = useToast();
    const [preferenceId, setPreferenceId] = useState<string | null>(null);
    const [isPixModalOpen, setIsPixModalOpen] = useState(false);
    
    // Chaves de produção
    const mercadoPagoPublicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || 'APP_USR-e9289eca-b8bd-4677-9481-bc9f6388eb67';
    
    useEffect(() => {
        initMercadoPago(mercadoPagoPublicKey, { locale: 'pt-BR' });
    }, [mercadoPagoPublicKey]);
    
    useEffect(() => {
        // Criar preferência de pagamento
        const createPreference = async () => {
            try {
                const response = await fetch('/api/create-preference', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount,
                        currency,
                        description: 'Assinatura Premium'
                    }),
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setPreferenceId(data.preferenceId);
                }
            } catch (error) {
                console.error('Erro ao criar preferência:', error);
                // Fallback para ID de teste
                setPreferenceId("TEST-PREFERENCE-ID");
            }
        };
        
        createPreference();
    }, [amount, currency]);

    const handlePayPalSuccess = () => {
        toast({
            title: '✅ Pagamento PayPal Aprovado!',
            description: 'Seu acesso foi liberado com sucesso.',
        });
        onPaymentSuccess();
    };

    const handleGooglePayClick = () => {
        // Verificar se está em dispositivo Android ou se Google Pay está disponível
        const isAndroid = /Android/i.test(navigator.userAgent);
        const hasGooglePay = 'google' in window && 'payments' in (window as any).google;
        
        if (hasGooglePay) {
            toast({
                title: 'Google Pay',
                description: 'Redirecionando para Google Pay...',
            });
            // Aqui você implementaria a integração real do Google Pay
        } else if (isAndroid) {
            // Redirecionar para Google Play Store para baixar Google Pay
            window.open('https://play.google.com/store/apps/details?id=com.google.android.apps.nfc.payment', '_blank');
        } else {
            toast({
                title: 'Google Pay',
                description: 'Google Pay não está disponível neste dispositivo. Use PIX ou PayPal.',
            });
        }
    };

    const handleApplePayClick = () => {
        // Verificar se está em dispositivo Apple e se Apple Pay está disponível
        const isAppleDevice = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent);
        const hasApplePay = 'ApplePaySession' in window && (window as any).ApplePaySession?.canMakePayments();
        
        if (hasApplePay) {
            toast({
                title: 'Apple Pay',
                description: 'Redirecionando para Apple Pay...',
            });
            // Aqui você implementaria a integração real do Apple Pay
        } else if (isAppleDevice) {
            // Redirecionar para App Store para configurar Apple Pay
            window.open('https://apps.apple.com/app/apple-pay/id', '_blank');
        } else {
            toast({
                title: 'Apple Pay',
                description: 'Apple Pay não está disponível neste dispositivo. Use PIX ou PayPal.',
            });
        }
    };

    const handlePixClick = () => {
        if (currency !== 'BRL') {
            toast({
                variant: 'destructive',
                title: 'PIX Indisponível',
                description: 'O pagamento com PIX só está disponível para transações em BRL.',
            });
            return;
        }
        setIsPixModalOpen(true);
    };

    if (!preferenceId) {
        return <div className="h-[72px] flex items-center justify-center"><p className="text-sm text-muted-foreground">Carregando pagamentos...</p></div>;
    }

    return (
        <div className="space-y-4 w-full max-w-sm">
            {/* PayPal - Primeiro botão (principal) */}
            <div className="w-full">
                <PayPalButton
                    onPaymentSuccess={handlePayPalSuccess}
                    amount={amount.toString()}
                    currency={currency}
                    description="Acesso Premium"
                    className="w-full"
                    variant="premium"
                />
            </div>

            {/* Outros métodos de pagamento */}
            <div className="flex justify-around items-center w-full">
                <div className="flex-1 flex justify-center">
                    <button 
                        className="transition-transform hover:scale-105 cursor-pointer bg-transparent border-none p-0"
                        onClick={handleGooglePayClick}
                        aria-label="Pagar com Google Pay"
                    >
                        <Image 
                            src="https://firebasestorage.googleapis.com/v0/b/authkit-y9vjx.firebasestorage.app/o/WhatsApp%20Image%202025-07-26%20at%2002.02.58%20(1).jpeg?alt=media&token=00683b6b-59ac-483c-93f4-6c879ab9b86c"
                            alt="Google Pay" 
                            width={80} 
                            height={32} 
                            className="object-contain"
                        />
                    </button>
                </div>
                
                <div className="flex-shrink-0 mx-2 flex flex-col items-center">
                    <button 
                        className="transition-transform hover:scale-105" 
                        onClick={handlePixClick}
                        aria-label="Pagar com PIX"
                    >
                        <Image 
                            src="https://firebasestorage.googleapis.com/v0/b/authkit-y9vjx.firebasestorage.app/o/WhatsApp%20Image%202025-07-25%20at%2021.41.37.jpeg?alt=media&token=4cfc8616-1e75-4eb2-8936-fbae3f2bc649" 
                            alt="PIX" 
                            width={28} 
                            height={28} 
                            className="object-contain"
                        />
                    </button>
                </div>

                <div className="flex-1 flex justify-center">
                    <button 
                        className="transition-transform hover:scale-105 cursor-pointer bg-transparent border-none p-0"
                        onClick={handleApplePayClick}
                        aria-label="Pagar com Apple Pay"
                    >
                        <Image 
                            src="https://firebasestorage.googleapis.com/v0/b/authkit-y9vjx.firebasestorage.app/o/WhatsApp%20Image%202025-07-26%20at%2002.02.58.jpeg?alt=media&token=3a91ba87-6df8-41db-a3bd-64f720e7feb2"
                            alt="Apple Pay" 
                            width={80} 
                            height={32} 
                            className="object-contain"
                        />
                    </button>
                </div>
            </div>

            {/* MercadoPago - Link direto para checkout */}
            {preferenceId && preferenceId !== "TEST-PREFERENCE-ID" && (
                <div className="w-full">
                    <Button
                        onClick={() => {
                            window.open(`https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`, '_blank');
                        }}
                        className="w-full bg-[#009ee3] hover:bg-[#0087c7] text-white"
                    >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pagar com MercadoPago
                    </Button>
                </div>
            )}

            <PixPaymentModal
                isOpen={isPixModalOpen}
                onOpenChange={setIsPixModalOpen}
                amount={amount}
                onPaymentSuccess={onPaymentSuccess}
            />
        </div>
    );
}
