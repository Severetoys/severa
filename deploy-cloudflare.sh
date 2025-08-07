#!/bin/bash

echo "🚀 Iniciando deploy para Cloudflare Pages..."

# Verificar se wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    echo "⚠️  Wrangler não encontrado. Instalando..."
    npm install -g wrangler
fi

# Build do projeto
echo "📦 Fazendo build do projeto..."
npm run build:cloudflare

if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    
    # Deploy para Cloudflare Pages
    echo "🌐 Fazendo deploy para Cloudflare Pages..."
    wrangler pages publish out --project-name="authkit-cloudflare"
    
    if [ $? -eq 0 ]; then
        echo "🎉 Deploy realizado com sucesso!"
        echo "🔗 Acesse: https://authkit-cloudflare.pages.dev"
    else
        echo "❌ Erro no deploy"
        exit 1
    fi
else
    echo "❌ Erro no build"
    exit 1
fi
