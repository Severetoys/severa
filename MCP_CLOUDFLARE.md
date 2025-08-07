# MCP (Model Context Protocol) com Cloudflare

## 🔧 O que é MCP?

O Model Context Protocol (MCP) é um protocolo que permite que modelos de IA se conectem a sistemas externos de forma segura e padronizada. Com o MCP da Cloudflare, você pode:

- 🌐 Gerenciar domínios e DNS
- 📄 Criar e atualizar Pages
- 🛡️ Configurar regras de firewall
- 📊 Acessar analytics
- 🔐 Gerenciar SSL/TLS

## 📦 Instalação

```bash
# Instalar MCP Server para Cloudflare
npm install @cloudflare/mcp-server-cloudflare

# Instalar SDK do MCP
npm install @modelcontextprotocol/sdk

# Instalar Wrangler CLI
npm install -g wrangler
```

## ⚙️ Configuração

### 1. Obter Credenciais Cloudflare

1. **API Token**: Acesse [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Clique em "Create Token"
   - Use o template "Custom token"
   - Permissões necessárias:
     - `Zone:Read`
     - `Page:Edit`
     - `DNS:Edit`

2. **Account ID**: Encontre no dashboard da Cloudflare (lado direito)

### 2. Configurar Variáveis de Ambiente

```bash
export CLOUDFLARE_API_TOKEN='your_api_token_here'
export CLOUDFLARE_ACCOUNT_ID='your_account_id_here'
```

### 3. Executar Configuração

```bash
./setup-mcp.sh
```

## 🚀 Uso do MCP

### Comandos Disponíveis

```bash
# Listar zonas DNS
npx @cloudflare/mcp-server-cloudflare zones list

# Criar registro DNS
npx @cloudflare/mcp-server-cloudflare dns create --zone="example.com" --type="A" --name="www" --content="192.0.2.1"

# Listar Pages
npx @cloudflare/mcp-server-cloudflare pages list

# Deploy de Page
npx @cloudflare/mcp-server-cloudflare pages deploy --project="my-project" --directory="./out"
```

### Integração com IA

O MCP permite que assistentes de IA executem comandos Cloudflare automaticamente:

```typescript
import { McpClient } from '@modelcontextprotocol/sdk';

const client = new McpClient({
  serverCommand: 'node',
  serverArgs: ['node_modules/@cloudflare/mcp-server-cloudflare/dist/index.js'],
  env: {
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID
  }
});
```

## 📁 Estrutura de Arquivos

```
├── .mcprc.json          # Configuração MCP
├── setup-mcp.sh         # Script de configuração
├── wrangler.toml        # Configuração Cloudflare
└── package.json         # Dependências
```

## 🔒 Segurança

- ✅ Nunca commite tokens de API
- ✅ Use variáveis de ambiente
- ✅ Configure permissões mínimas necessárias
- ✅ Monitore uso da API

## 📚 Recursos Úteis

- [Documentação MCP](https://modelcontextprotocol.io/)
- [Cloudflare API Docs](https://developers.cloudflare.com/api/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## 🛠️ Troubleshooting

### Erro de Autenticação
```bash
# Verificar token
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
     -H "Authorization: Bearer YOUR_API_TOKEN"
```

### Erro de Permissões
- Verifique se o token tem as permissões necessárias
- Confirme se o Account ID está correto
