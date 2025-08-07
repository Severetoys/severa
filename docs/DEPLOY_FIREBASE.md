# 🔥 Deploy no Firebase Hosting - Studio Italo Santos

## 🎯 **Por que Firebase Hosting?**

✅ **Vantagens:**
- Já tem Firebase configurado no projeto
- SSL gratuito automático
- CDN global
- Domínio personalizado gratuito
- Integração perfeita com outros serviços Firebase
- Suporte a Next.js

## 📋 **Pré-requisitos:**
- Node.js instalado
- Projeto Firebase já configurado ✅
- Next.js configurado para export estático

---

## 🚀 **Passo a Passo:**

### 1. **Instalar Firebase CLI**
```bash
npm install -g firebase-tools
```

### 2. **Login no Firebase**
```bash
firebase login
```

### 3. **Configurar Next.js para Export Estático**
Atualize o `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  experimental: {
    esmExternals: true
  }
}

module.exports = nextConfig
```

### 4. **Inicializar Firebase Hosting**
```bash
firebase init hosting
```

**Configurações:**
- **Use an existing project:** Sim
- **Select project:** `authkit-y9vjx`
- **Public directory:** `out`
- **Single-page app:** Sim
- **Overwrite index.html:** Não

### 5. **Configurar firebase.json**
```json
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [{
      "source": "**",
      "destination": "/index.html"
    }]
  }
}
```

### 6. **Build e Deploy**
```bash
# Build do projeto
npm run build

# Deploy no Firebase
firebase deploy --only hosting
```

---

## ⚡ **Script Automático de Deploy**

Crie um arquivo `deploy-firebase.js`:

```javascript
const { execSync } = require('child_process');

console.log('🔥 Iniciando deploy no Firebase...');

try {
  // Build do projeto
  console.log('📦 Fazendo build...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Deploy no Firebase
  console.log('🚀 Fazendo deploy...');
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });
  
  console.log('✅ Deploy concluído!');
  console.log('🌐 Site: https://authkit-y9vjx.web.app');
  
} catch (error) {
  console.error('❌ Erro no deploy:', error.message);
  process.exit(1);
}
```

Adicione no `package.json`:
```json
{
  "scripts": {
    "deploy:firebase": "node deploy-firebase.js"
  }
}
```

---

## 🌐 **URLs do seu site:**

**URL Principal:**
```
https://authkit-y9vjx.web.app
```

**URL Alternativa:**
```
https://authkit-y9vjx.firebaseapp.com
```

---

## 🔧 **Domínio Personalizado:**

1. **Firebase Console** → Hosting
2. **Add custom domain**
3. Digite: `italosantos.com`
4. **Verify ownership** (DNS TXT record)
5. **Configure DNS** (A records)
6. **SSL automático** em 24-48h

---

## ⚠️ **Problemas Comuns:**

### 1. **Erro de Build:**
```bash
# Teste local primeiro
npm run build
```

### 2. **Imagens não carregam:**
- Adicione `images: { unoptimized: true }` no `next.config.js`

### 3. **Rotas não funcionam:**
- Configure `rewrites` no `firebase.json`

### 4. **Variáveis de ambiente:**
- Next.js só exporta variáveis `NEXT_PUBLIC_*`
- APIs devem usar Firebase Functions

---

## 🎯 **Comandos Úteis:**

```bash
# Ver projetos Firebase
firebase projects:list

# Servir localmente
firebase serve

# Ver logs
firebase functions:log

# Deploy apenas hosting
firebase deploy --only hosting

# Deploy completo
firebase deploy
```

---

## ✅ **Checklist de Deploy:**

- [ ] Firebase CLI instalado
- [ ] Login no Firebase feito
- [ ] `next.config.js` configurado para export
- [ ] `firebase.json` configurado
- [ ] Build passou sem erro
- [ ] Deploy feito com sucesso
- [ ] Site acessível
- [ ] Todas as páginas funcionando
- [ ] Domínio personalizado (opcional)

---

## 🚀 **Deploy Rápido:**

```bash
# Comando único para deploy
npm run build && firebase deploy --only hosting
```

**Seu site estará em:** `https://authkit-y9vjx.web.app`

## 💡 **Dica Extra:**

Firebase Hosting é **gratuito** e perfeito para sites estáticos Next.js!

**Deploy completo em 5 minutos! 🔥**
