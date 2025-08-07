import { NextRequest, NextResponse } from 'next/server';
import { createSubscriptionInternal } from '@/lib/subscription-check';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('Webhook PayPal recebido:', body);

        // Verificar se é um evento de pagamento aprovado
        if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
            const payment = body.resource;
            
            // Extrair informações do pagamento
            const paymentId = payment.id;
            const customerEmail = payment.payer?.email_address;
            const amount = parseFloat(payment.amount?.value || '0');
            
            // Determinar plano baseado no valor
            let planId = 'monthly'; // padrão
            if (amount <= 3) planId = 'daily';
            else if (amount <= 10) planId = 'weekly';
            else if (amount <= 30) planId = 'monthly';
            else planId = 'quarterly';

            if (customerEmail && paymentId) {
                // Criar assinatura
                const result = await createSubscriptionInternal({
                    userId: `pp_${paymentId}`, // ID temporário baseado no pagamento
                    email: customerEmail,
                    planId,
                    paymentId,
                    paymentMethod: 'paypal'
                });

                if (result.success) {
                    console.log('Assinatura PayPal criada com sucesso:', result.subscriptionId);
                    
                    return NextResponse.json({ 
                        success: true, 
                        message: 'Pagamento PayPal processado e assinatura criada',
                        subscriptionId: result.subscriptionId
                    });
                } else {
                    console.error('Erro ao criar assinatura PayPal:', result.error);
                    return NextResponse.json({ 
                        success: false, 
                        message: 'Erro ao processar assinatura PayPal' 
                    }, { status: 500 });
                }
            } else {
                console.error('Dados do pagamento PayPal incompletos');
                return NextResponse.json({ 
                    success: false, 
                    message: 'Dados do pagamento incompletos' 
                }, { status: 400 });
            }
        }

        // Para outros tipos de evento, apenas confirmar recebimento
        return NextResponse.json({ success: true, message: 'Webhook PayPal recebido' });

    } catch (error) {
        console.error('Erro no webhook PayPal:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        }, { status: 500 });
    }
}
