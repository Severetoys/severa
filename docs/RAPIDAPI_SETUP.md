# Configuração do Sistema de Fallback para APIs do X/Twitter

## Visão Geral

O sistema agora possui **fallback automático** entre duas APIs:
1. **API Oficial do X** (primeira tentativa)
2. **RapidAPI** (fallback automático)

## Como Configurar

### 1. API Oficial do X (Já Configurada)
- Token: `TWITTER_BEARER_TOKEN` no arquivo `.env.local`
- Status: ✅ Já configurado

### 2. RapidAPI (Fallback) - CONFIGURAÇÃO NECESSÁRIA

#### Passo 1: Criar Conta no RapidAPI
1. Acesse [RapidAPI](https://rapidapi.com/)
2. Crie uma conta gratuita
3. Confirme seu email

#### Passo 2: Encontrar a API do Twitter
1. Na busca, digite "Twitter API v2"
2. Selecione uma das opções populares:
   - "Twitter API v2" (recomendado)
   - "Twitter API v1.1"
   - "Social Searcher"

#### Passo 3: Obter a Chave da API
1. Clique em "Subscribe to Test"
2. Escolha um plano (geralmente há planos gratuitos)
3. Copie a **X-RapidAPI-Key** fornecida

#### Passo 4: Configurar no Projeto
1. Abra o arquivo `.env.local`
2. Substitua `YOUR_RAPIDAPI_KEY_HERE` pela sua chave:
   ```bash
   RAPIDAPI_KEY="sua_chave_aqui"
   ```
3. Se necessário, ajuste o host da API:
   ```bash
   RAPIDAPI_HOST="twitter-api-v2.p.rapidapi.com"
   ```

## Como o Sistema Funciona

### Fluxo de Fallback
```
1. Tentar API Oficial do X
   ├── ✅ Sucesso → Usar dados + Atualizar cache
   └── ❌ Falha (rate limit/erro) → Ir para passo 2

2. Tentar RapidAPI (fallback)
   ├── ✅ Sucesso → Usar dados + Atualizar cache
   └── ❌ Falha → Ir para passo 3

3. Usar Cache Antigo (se disponível)
   ├── ✅ Cache disponível → Usar dados antigos
   └── ❌ Sem cache → Retornar erro
```

### Vantagens do Sistema
- **Alta Disponibilidade**: Duas APIs independentes
- **Rate Limit Inteligente**: Detecta e se adapta automaticamente
- **Cache Adaptativo**: 1h normal, 4h durante problemas
- **Transparente**: Usuário não percebe as mudanças
- **Logs Detalhados**: Console mostra qual API foi usada

## Monitoramento

### Página de Status
- Acesse `/admin/x-status` para ver:
  - Status das APIs em tempo real
  - Informações de cache
  - Rate limiting status
  - Histórico de tentativas

### Logs no Console
```
✅ API oficial funcionou! Encontrados 25 tweets com mídia.
❌ API oficial falhou: Rate limit atingido
🔄 Tentando RapidAPI como fallback...
✅ RapidAPI funcionou! Encontrados 23 tweets com mídia.
```

## Resolução de Problemas

### "RapidAPI falhou: RAPIDAPI_KEY não configurado"
- Configure a chave da RapidAPI no arquivo `.env.local`

### "Todas as APIs falharam"
- Verifique conexão com internet
- Confirme se as chaves estão corretas
- Verifique logs no console para detalhes

### Performance Lenta
- Normal durante fallback (tenta API oficial primeiro)
- Cache ativo reduz chamadas às APIs
- Use a página de status para monitorar

## Custos

### API Oficial do X
- **Gratuito**: Até certo limite mensal
- **Rate Limit**: ~300 requests/15min

### RapidAPI
- **Planos Gratuitos**: Geralmente disponíveis
- **Pagos**: A partir de $5-10/mês para mais requests
- **Varia por provedor**: Cada API tem seus próprios limites

## Configuração Completa

Arquivo `.env.local` deve conter:
```bash
# API Oficial do X
TWITTER_BEARER_TOKEN="seu_token_oficial_aqui"

# RapidAPI (Fallback)
RAPIDAPI_KEY="sua_chave_rapidapi_aqui"
RAPIDAPI_HOST="twitter-api-v2.p.rapidapi.com"
```

## Próximos Passos

1. **Configure a RapidAPI** seguindo os passos acima
2. **Teste o sistema** na página `/admin/x-settings`
3. **Monitore** via `/admin/x-status`
4. **Aproveite** a alta disponibilidade! 🚀
