# Integração Face ID com Google Apps Script

Este documento explica como a integração entre o Face ID e o Google Apps Script funciona no seu projeto.

## 📋 Resumo da Integração

O sistema permite que usuários se cadastrem e façam login usando reconhecimento facial, com os dados armazenados em uma planilha do Google Sheets através do Google Apps Script.

## 🎯 Fluxo Completo

### 1. **Cadastro do Usuário**
- Usuário acessa `/auth/face` e vai para a aba "Cadastrar"
- Preenche nome, email e telefone
- Grava um vídeo/foto facial
- Sistema envia dados para Google Apps Script
- Apps Script salva na planilha do Google Sheets

### 2. **Login do Usuário**
- Usuário acessa Face ID na página inicial
- Sistema captura imagem facial
- Envia para Google Apps Script
- Apps Script compara com imagens da planilha
- Se encontrar correspondência, autentica o usuário
- Verifica se tem pagamento (VIP) e redireciona adequadamente

### 3. **Verificação de Pagamento**
- Sistema verifica se usuário tem "ID de Pagamento" na planilha
- Se sim: usuário é VIP → redireciona para `/exclusivo`
- Se não: usuário é member → redireciona para `/assinante`

## 🔧 Arquivos Criados/Modificados

### Novos Arquivos:
- `src/services/google-apps-script-service.ts` - Comunicação com Apps Script
- `src/ai/flows/google-apps-script-face-auth-flow.ts` - Fluxo de autenticação
- `src/contexts/face-id-auth-context.tsx` - Contexto de autenticação
- `src/components/face-id-protected-route.tsx` - Proteção de rotas
- `src/components/google-apps-script-test.tsx` - Página de testes
- `src/app/test-face-id/page.tsx` - Rota de testes
- `google-apps-script-face-login.js` - Código para adicionar ao Apps Script

### Arquivos Modificados:
- `src/app/page.tsx` - Botão Face ID agora aponta para `/auth/face`
- `src/app/auth/face/page.tsx` - Integração com Google Apps Script
- `src/app/assinante/page.tsx` - Proteção com Face ID
- `src/app/layout.tsx` - Contexto de autenticação

## 📝 Google Apps Script

### Código que precisa ser adicionado ao seu Apps Script:

O arquivo `google-apps-script-face-login.js` contém todo o código necessário. Principais funções:

1. **`verifyUserLogin(imageBase64)`** - Verifica login por Face ID
2. **`doPost(e)`** - Atualizado para suportar login e cadastro
3. **`doGet(e)`** - Suporta página de login

### Estrutura da Planilha:
- **Coluna A**: Data/Hora
- **Coluna B**: Nome
- **Coluna C**: Email
- **Coluna D**: Telefone
- **Coluna E**: Imagem ID (Base64)
- **Coluna F**: Vídeo (Base64)
- **Coluna G**: Firebase UID
- **Coluna H**: ID de Pagamento

## 🚀 Como Testar

### 1. Configurar URL do Apps Script
No arquivo `src/services/google-apps-script-service.ts`, atualize a URL:
```typescript
const APPS_SCRIPT_URL = "SUA_URL_DO_APPS_SCRIPT_AQUI";
```

### 2. Publicar o Apps Script
- Adicione o código do arquivo `google-apps-script-face-login.js`
- Publique como Web App
- Permissões: "Qualquer pessoa, mesmo anônima"

### 3. Teste Local
- Acesse `/test-face-id` para testar a integração
- Teste cadastro e login
- Verifique os logs no console

### 4. Teste no Site
- Acesse a página inicial
- Clique em "Face ID"
- Teste cadastro e login via Face ID

## 🔒 Autenticação e Proteção

### Contexto de Autenticação
- `FaceIDAuthProvider` gerencia estado global
- `useFaceIDAuth()` hook para acessar dados do usuário
- Estados: `isAuthenticated`, `userType` ('vip'|'member'), `userEmail`

### Proteção de Rotas
- `FaceIDProtectedRoute` componente para proteger páginas
- Automaticamente redireciona não autenticados para `/auth/face`
- Suporte a `requireVIP` para páginas exclusivas

### Exemplo de Uso:
```tsx
<FaceIDProtectedRoute requireVIP={true}>
  <PaginaExclusiva />
</FaceIDProtectedRoute>
```

## 🔄 Integração com Sistema de Assinantes

O Face ID está totalmente integrado com o sistema de assinaturas existente:

1. **Usuário faz login via Face ID**
2. **Sistema verifica se tem pagamento**
3. **Se tem pagamento**: É VIP → acesso a `/exclusivo`
4. **Se não tem pagamento**: É member → vai para `/assinante` para fazer pagamento

## ⚙️ Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas:
- `GOOGLE_SHEETS_WEBHOOK_SECRET` - Para webhooks
- `FIREBASE_FACEID_SECRET` - Para segurança adicional

## 🐛 Troubleshooting

### Problemas Comuns:

1. **Erro de CORS**: Configure o Apps Script corretamente
2. **URL inválida**: Verifique se a URL do Apps Script está correta
3. **Planilha não encontrada**: Verifique se a aba "cliente" existe
4. **Face ID não funciona**: Verifique permissões da câmera

### Logs para Debug:
- Console do navegador: logs do frontend
- Apps Script: logs do Google Apps Script
- Página de teste: `/test-face-id` para debug

## 📱 Compatibilidade

- **Navegadores**: Chrome, Firefox, Safari, Edge
- **Dispositivos**: Desktop e Mobile
- **Câmera**: Necessária para Face ID
- **JavaScript**: Necessário habilitado

## 🎯 Próximos Passos

1. Teste a integração completa
2. Configure URLs e variáveis de ambiente
3. Publique o Apps Script
4. Teste em produção
5. Monitor logs para possíveis ajustes

---

**Nota**: Lembre-se de atualizar a URL do Apps Script no código e publicar corretamente no Google Apps Script com as permissões adequadas.
