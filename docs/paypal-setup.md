# Configuração PayPal - Instruções

## Para usar PayPal em produção, siga estes passos:

### 1. Configurar variáveis de ambiente
Adicione no arquivo `.env.local`:

```env
# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_real_paypal_client_id_here
NEXT_PUBLIC_PAYPAL_BUSINESS_EMAIL=your_paypal_email@example.com
```

### 2. Obter Client ID do PayPal
1. Acesse [PayPal Developer](https://developer.paypal.com/)
2. Faça login com sua conta PayPal
3. Vá em "My Apps & Credentials"
4. Crie uma nova aplicação
5. Copie o "Client ID" para a variável de ambiente

### 3. Configurar conta PayPal Business
1. Converta sua conta para PayPal Business (se necessário)
2. Configure botões de pagamento no painel do PayPal
3. Anote seu email de negócios

### 4. Testar integração
- Em desenvolvimento: usa `client-id=test`
- Em produção: usa o Client ID real

### 5. URLs de pagamento disponíveis:

#### Botão de doação:
```
https://www.paypal.com/donate/?business=SEU_EMAIL&no_recurring=0&item_name=Assinatura+Mensal&currency_code=BRL
```

#### Botão de compra:
```
https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=SEU_EMAIL&item_name=Assinatura+Mensal&amount=29.90&currency_code=BRL
```

### 6. Funcionalidades implementadas:
- ✅ Botão PayPal integrado com SDK
- ✅ Fallback para link direto em caso de erro
- ✅ Configuração centralizada
- ✅ Suporte a variáveis de ambiente
- ✅ Error handling robusto
- ✅ Toast notifications

### 7. Como funciona atualmente:
1. **Cenário ideal**: Botão PayPal SDK funciona normalmente
2. **Fallback 1**: Se SDK falhar, mostra link direto para PayPal
3. **Fallback 2**: Se tudo falhar, abre PayPal em nova aba

### 8. Para personalizar:
- Edite `src/lib/paypal-config.ts` para alterar valores padrão
- Modifique `src/components/paypal-hosted-button.tsx` para funcionalidades específicas
