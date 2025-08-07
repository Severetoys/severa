#!/bin/bash

echo "🔧 Configurando MCP para Cloudflare..."

# Verificar se as variáveis de ambiente estão definidas
if [[ -z "$CLOUDFLARE_API_TOKEN" || -z "$CLOUDFLARE_ACCOUNT_ID" ]]; then
    echo "⚠️  Variáveis de ambiente necessárias:"
    echo "   CLOUDFLARE_API_TOKEN - Token da API do Cloudflare"
    echo "   CLOUDFLARE_ACCOUNT_ID - ID da conta do Cloudflare"
    echo ""
    echo "🔗 Para obter essas informações:"
    echo "   1. Acesse: https://dash.cloudflare.com/profile/api-tokens"
    echo "   2. Crie um token com permissões de Zone:Read e Page:Edit"
    echo "   3. Encontre o Account ID no dashboard"
    echo ""
    echo "💡 Exemplo de uso:"
    echo "   export CLOUDFLARE_API_TOKEN='your_token_here'"
    echo "   export CLOUDFLARE_ACCOUNT_ID='your_account_id_here'"
    echo "   ./setup-mcp.sh"
    exit 1
fi

# Criar arquivo de configuração com variáveis reais
cat > .mcprc.json << EOF
{
  "mcpServers": {
    "cloudflare": {
      "command": "node",
      "args": ["node_modules/@cloudflare/mcp-server-cloudflare/dist/index.js"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "$CLOUDFLARE_API_TOKEN",
        "CLOUDFLARE_ACCOUNT_ID": "$CLOUDFLARE_ACCOUNT_ID"
      }
    }
  }
}
EOF

echo "✅ Configuração MCP criada com sucesso!"
echo "📁 Arquivo: .mcprc.json"

# Verificar se o MCP server está funcionando
echo "🔍 Testando conexão com Cloudflare..."
npx @cloudflare/mcp-server-cloudflare --help

if [ $? -eq 0 ]; then
    echo "✅ MCP Server para Cloudflare configurado com sucesso!"
else
    echo "❌ Erro na configuração do MCP Server"
    exit 1
fi
