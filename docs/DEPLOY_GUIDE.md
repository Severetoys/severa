# 🚀 Guia de Deploy - Repositório Privado

## 📋 Opções de Deploy para seu projeto Next.js

### 1. **Vercel (Recomendado para Next.js)**

#### ✅ **Vantagens:**
- Integração nativa com Next.js
- Deploy automático via GitHub
- SSL gratuito
- Edge functions
- Suporte a repositórios privados

#### 🔧 **Como fazer:**
1. Acesse: https://vercel.com/
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione seu repositório privado
5. Configure as variáveis de ambiente (use os valores do seu .env.local):
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   MERCADOPAGO_PUBLIC_KEY=APP_USR-...
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=AXykIWKfbbsR_Qe4eLrDgxudUWcoFn-cihQdgWJTqEOVQiP5fxXln-C5fr1QABQ4jowP7Oz2nkNtPFie
   PAYPAL_CLIENT_SECRET=EGcfrzzmrL_jpRt-9kp2GaaF3f7jVNvOg4EHVwsnMl4V28_0iyN0UXu5OGvAT1c9e_OeikFuWe8QqSlX
   NEXT_PUBLIC_ENVIRONMENT=production
   NEXT_PUBLIC_PAYPAL_BUSINESS_EMAIL=pix@italosantos.com
   ```
6. Deploy automático!

---

### 2. **Netlify**

#### 🔧 **Como fazer:**
1. Acesse: https://netlify.com/
2. Conecte com GitHub
3. Selecione repositório privado
4. Build command: `npm run build`
5. Publish directory: `.next`
6. Configure variáveis de ambiente

---

### 3. **Firebase Hosting**

#### 🔧 **Como fazer:**
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Login:
   ```bash
   firebase login
   ```
3. Inicialize:
   ```bash
   firebase init hosting
   ```
4. Configure `firebase.json`:
   ```json
   {
     "hosting": {
       "public": "out",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
     }
   }
   ```
5. Build e deploy:
   ```bash
   npm run build
   npm run export
   firebase deploy
   ```

---

### 4. **AWS Amplify**

#### 🔧 **Como fazer:**
1. Acesse AWS Console
2. Procure por "Amplify"
3. "New app" → "Host web app"
4. Conecte GitHub (repositório privado)
5. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
   ```

---

### 5. **DigitalOcean App Platform**

#### 🔧 **Como fazer:**
1. Acesse DigitalOcean
2. "Create" → "Apps"
3. Conecte GitHub (repositório privado)
4. Configure:
   - Build command: `npm run build`
   - Run command: `npm start`
   - Port: 3000

---

## 🎯 **Recomendação:**

**Use VERCEL** - É a melhor opção para Next.js:
- Deploy gratuito
- Domínio personalizado
- SSL automático
- Edge functions
- Integração perfeita com GitHub

## 🔐 **Variáveis de Ambiente:**

Lembre-se de configurar TODAS as variáveis do arquivo `.env` na plataforma escolhida!

## 🚀 **Deploy Rápido (Vercel):**

1. Faça push do código para GitHub
2. Conecte Vercel ao repositório
3. Configure variáveis de ambiente
4. Deploy automático em 2 minutos!

Site estará online em: `https://seu-projeto.vercel.app`
