# Deploy para Cloudflare Pages

## 📋 Pré-requisitos

1. **Conta no Cloudflare** - [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI** - `npm install -g wrangler`
3. **Node.js 18+**

## 🚀 Deploy Rápido

### 1. Instalar Wrangler
```bash
npm install -g wrangler
```

### 2. Login no Cloudflare
```bash
wrangler login
```

### 3. Build e Deploy
```bash
npm run build:cloudflare
npx wrangler pages publish out --project-name="seu-projeto"
```

## 📁 Estrutura de Arquivos

- `wrangler.toml` - Configuração do Cloudflare
- `_headers` - Headers HTTP personalizados
- `_redirects` - Redirecionamentos
- `deploy-cloudflare.sh` - Script automatizado de deploy

## ⚙️ Configuração de Variáveis

Configure no dashboard do Cloudflare Pages:

### Variáveis de Ambiente
```
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=your_mercadopago_key
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://seu-dominio.pages.dev
```

## 🔧 Comandos Úteis

```bash
# Desenvolvimento local
npm run dev

# Build para produção
npm run build:cloudflare

# Deploy automatizado
./deploy-cloudflare.sh

# Preview local do build
npm run preview
```

## 📝 Características do Cloudflare Pages

- ✅ Deploy automático via Git
- ✅ CDN global gratuito
- ✅ SSL automático
- ✅ Preview deployments
- ✅ Analytics integrado
- ✅ 100GB de bandwidth gratuito

## 🔗 Links Úteis

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Next.js + Cloudflare](https://developers.cloudflare.com/pages/framework-guides/deploy-a-nextjs-site/)
