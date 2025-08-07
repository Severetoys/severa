import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createSubscriptionInternal } from '@/lib/subscription-check';

export async function POST(request: NextRequest) {
    // Configurar MercadoPago
    const client = new MercadoPagoConfig({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });
    try {
        const body = await request.json();
        console.log('Webhook MercadoPago recebido:', body);

        // Verificar se é uma notificação de pagamento
        if (body.type === 'payment') {
            const paymentId = body.data.id;
            
            // Buscar detalhes do pagamento
            const payment = new Payment(client);
            const paymentData = await payment.get({ id: paymentId });

            console.log('Dados do pagamento:', paymentData);

            // Verificar se o pagamento foi aprovado
            if (paymentData.status === 'approved') {
                // Extrair informações do pagamento
                const customerEmail = paymentData.payer?.email;
                const paymentMethod = paymentData.payment_method_id === 'pix' ? 'pix' : 'mercadopago';
                
                // Determinar plano baseado no valor (pode ser melhorado)
                let planId = 'monthly'; // padrão
                const amount = paymentData.transaction_amount || 0;
                
                if (amount <= 3) planId = 'daily';
                else if (amount <= 10) planId = 'weekly';
                else if (amount <= 30) planId = 'monthly';
                else planId = 'quarterly';

                if (customerEmail) {
                    // Criar assinatura
                    const result = await createSubscriptionInternal({
                        userId: `mp_${paymentId}`, // ID temporário baseado no pagamento
                        email: customerEmail,
                        planId,
                        paymentId: paymentId.toString(),
                        paymentMethod
                    });

                    if (result.success) {
                        console.log('Assinatura criada com sucesso:', result.subscriptionId);
                        
                        // Aqui você pode enviar um email de confirmação ou notificar o usuário
                        // await sendConfirmationEmail(customerEmail, planId);
                        
                        return NextResponse.json({ 
                            success: true, 
                            message: 'Pagamento processado e assinatura criada',
                            subscriptionId: result.subscriptionId
                        });
                    } else {
                        console.error('Erro ao criar assinatura:', result.error);
                        return NextResponse.json({ 
                            success: false, 
                            message: 'Erro ao processar assinatura' 
                        }, { status: 500 });
                    }
                } else {
                    console.error('Email do cliente não encontrado no pagamento');
                    return NextResponse.json({ 
                        success: false, 
                        message: 'Email do cliente não encontrado' 
                    }, { status: 400 });
                }
            } else {
                console.log('Pagamento não aprovado, status:', paymentData.status);
                return NextResponse.json({ 
                    success: true, 
                    message: 'Pagamento recebido mas não aprovado' 
                });
            }
        }

        // Para outros tipos de notificação, apenas confirmar recebimento
        return NextResponse.json({ success: true, message: 'Webhook recebido' });

    } catch (error) {
        console.error('Erro no webhook MercadoPago:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        }, { status: 500 });
    }
}
