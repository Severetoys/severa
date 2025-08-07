# 🚀 Deploy Firebase - Comandos Rápidos

## ⚡ **Instalação (uma vez apenas):**

```bash
# 1. Instalar Firebase CLI
npm install -g firebase-tools

# 2. Login no Firebase
firebase login

# 3. Inicializar (se necessário)
firebase init hosting
```

**Configurações do init:**
- ✅ Use existing project: `authkit-y9vjx`  
- ✅ Public directory: `out`
- ✅ Single-page app: `Yes`
- ❌ Overwrite index.html: `No`

---

## 🔥 **Deploy Rápido:**

### Opção 1 - Script Automático:
```bash
npm run deploy:firebase
```

### Opção 2 - Manual:
```bash
npm run build:firebase
firebase deploy --only hosting
```

### Opção 3 - Super Rápido:
```bash
npm run deploy:quick
```

---

## 🌐 **Seu site estará em:**

- **URL Principal:** https://authkit-y9vjx.web.app
- **URL Alternativa:** https://authkit-y9vjx.firebaseapp.com

---

## 🎯 **Comandos Úteis:**

```bash
# Ver projetos Firebase
firebase projects:list

# Servir localmente (após build)
firebase serve

# Apenas hosting
firebase deploy --only hosting

# Deploy completo
firebase deploy

# Ver logs
firebase functions:log
```

---

## ✅ **Deploy em 3 comandos:**

```bash
npm install -g firebase-tools
firebase login
npm run deploy:firebase
```

**Pronto! Site online em 2 minutos! 🔥**
