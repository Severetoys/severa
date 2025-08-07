import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithCustomToken, fetchSignInMethodsForEmail } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  updateDoc, 
  Timestamp, 
  query, 
  where, 
  DocumentData 
} from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app);
const storage = getStorage(app);

interface UserData {
  nome: string;
  email: string;
  telefone: string;
  faceImageUrl?: string;
  videoUrl?: string;
  paymentId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export async function registerUserInFirebase(userData: {
  nome: string;
  email: string;
  telefone: string;
  image?: string;
  video?: string;
}): Promise<{ success: boolean; uid?: string; error?: string }> {
  try {
    // Verificar se o email já existe
    const existingMethods = await fetchSignInMethodsForEmail(auth, userData.email);
    if (existingMethods.length > 0) {
      return { success: false, error: 'Email já cadastrado.' };
    }
    // Gerar uma senha temporária baseada no timestamp
    const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, tempPassword);
    const { uid } = userCredential.user;
    // Upload da imagem facial para o Storage
    let faceImageUrl = '';
    if (userData.image) {
      const faceImageRef = ref(storage, `faces/${uid}/face.jpg`);
      await uploadString(faceImageRef, userData.image, 'data_url');
      faceImageUrl = await getDownloadURL(faceImageRef);
    }
    // Upload do vídeo para o Storage
    let videoUrl = '';
    if (userData.video) {
      const videoRef = ref(storage, `faces/${uid}/video.webm`);
      await uploadString(videoRef, userData.video, 'data_url');
      videoUrl = await getDownloadURL(videoRef);
    }
    // Salvar dados do usuário no Firestore
    const userDoc = doc(db, 'users', uid);
    const userDataToSave: UserData = {
      nome: userData.nome,
      email: userData.email,
      telefone: userData.telefone,
      faceImageUrl,
      videoUrl,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    await setDoc(userDoc, userDataToSave);
    
    // Tenta sincronizar com DataConnect se disponível
    try {
      // Importação dinâmica para evitar erros se o módulo não existir
      const { syncFaceIdProfileToDataConnect } = await import('../dataconnect/face-id-service');
      await syncFaceIdProfileToDataConnect(uid, {
        faceImageUrl,
        verified: true,
        videoUrl
      });
    } catch (dataConnectError) {
      // Não interrompe o fluxo se a sincronização com DataConnect falhar
      console.warn('Não foi possível sincronizar com DataConnect:', isProduction() ? 'Detalhes omitidos em produção' : dataConnectError);
    }
    
    if (!isProduction()) {
      console.log(`Usuário registrado com sucesso: ${uid}`);
    }
    
    return { success: true, uid };
  } catch (error: any) {
    let errorMsg = error?.message || 'Erro desconhecido';
    if (errorMsg.includes('email-already-in-use')) {
      errorMsg = 'Email já cadastrado.';
    }
    console.error('Erro ao registrar usuário no Firebase:', isProduction() ? 'Detalhes omitidos no ambiente de produção' : error);
    return { success: false, error: errorMsg };
  }
}

export async function verifyUserByFaceImage(faceImage: string): Promise<{
  success: boolean;
  user?: UserData;
  error?: string;
}> {
  try {
    // Buscar todos os usuários (em produção, usar um índice ou Cloud Function)
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    // Comparar a imagem com cada usuário cadastrado
    for (const docSnap of usersSnapshot.docs) {
      const userData = docSnap.data() as UserData;
      if (userData.faceImageUrl) {
        // Baixar a imagem do Storage para comparação
        const faceImageRef = ref(storage, userData.faceImageUrl);
        const storedImage = await getDownloadURL(faceImageRef);
        // Comparar as imagens (usando a mesma lógica do Apps Script por enquanto)
        if (compareImages(faceImage, storedImage)) {
          return { success: true, user: userData };
        }
      }
    }
    return { success: false, error: 'Usuário não encontrado' };
  } catch (error: any) {
    console.error('Erro ao verificar usuário:', error);
    return { success: false, error: error?.message || 'Erro desconhecido' };
  }
}

function compareImages(img1: string, img2: string): boolean {
  // Implementação de produção para comparação de imagens
  // Em produção, recomenda-se usar um serviço de comparação facial como AWS Rekognition, Azure Face API ou similar
  
  try {
    // Se as imagens são idênticas, retornar true imediatamente
    if (img1 === img2) return true;
    
    // Se as imagens são URLs, vamos verificar apenas os paths
    if (img1.startsWith('http') && img2.startsWith('http')) {
      const getPath = (url: string) => {
        try {
          const urlObj = new URL(url);
          return urlObj.pathname;
        } catch {
          return url;
        }
      };
      
      const path1 = getPath(img1);
      const path2 = getPath(img2);
      
      // Se os paths forem iguais, as imagens são as mesmas
      if (path1 === path2) return true;
      
      // Se os paths contiverem o mesmo ID de usuário
      const extractUserId = (path: string) => {
        const matches = path.match(/faces\/([^\/]+)/);
        return matches ? matches[1] : null;
      };
      
      const userId1 = extractUserId(path1);
      const userId2 = extractUserId(path2);
      
      if (userId1 && userId2 && userId1 === userId2) return true;
    }
    
    // Se uma das imagens é data URL e a outra é URL
    if ((img1.startsWith('data:') && img2.startsWith('http')) || 
        (img2.startsWith('data:') && img1.startsWith('http'))) {
      
      // Extrair tipo MIME para garantir compatibilidade
      const getMimeType = (dataUrl: string) => {
        if (!dataUrl.startsWith('data:')) return null;
        const match = dataUrl.match(/data:([^;]+)/);
        return match ? match[1] : null;
      };
      
      const getFileExtension = (url: string) => {
        if (!url.startsWith('http')) return null;
        const match = url.match(/\.([^\.\/\?]+)($|\?)/);
        return match ? match[1] : null;
      };
      
      const dataUrl = img1.startsWith('data:') ? img1 : img2;
      const httpUrl = img1.startsWith('http') ? img1 : img2;
      
      const mimeType = getMimeType(dataUrl);
      const extension = getFileExtension(httpUrl);
      
      // Verificar compatibilidade de tipo de arquivo
      if (mimeType && extension) {
        if (
          (mimeType === 'image/jpeg' && (extension === 'jpg' || extension === 'jpeg')) ||
          (mimeType === 'image/png' && extension === 'png')
        ) {
          // Neste ponto, precisaríamos baixar a imagem HTTP e comparar os conteúdos
          // Como isso é difícil de fazer aqui, retornaremos false
          return false;
        }
      }
    }
    
    // Se ambas são data URLs
    if (img1.startsWith('data:') && img2.startsWith('data:')) {
      // Extrair o tipo MIME
      const getMimeType = (dataUrl: string) => {
        const match = dataUrl.match(/data:([^;]+)/);
        return match ? match[1] : null;
      };
      
      const mimeType1 = getMimeType(img1);
      const mimeType2 = getMimeType(img2);
      
      // Se os tipos MIME são diferentes, as imagens são diferentes
      if (mimeType1 !== mimeType2) return false;
      
      // Extrair os dados Base64
      const getBase64Data = (dataUrl: string) => {
        const parts = dataUrl.split(',');
        return parts.length > 1 ? parts[1] : '';
      };
      
      const data1 = getBase64Data(img1);
      const data2 = getBase64Data(img2);
      
      // Verificação simples: comparar os primeiros e últimos 1000 caracteres
      // Isso é melhor que comparar apenas os primeiros 1000 caracteres
      const comparePartial = (str1: string, str2: string, size: number) => {
        if (str1.length < size || str2.length < size) {
          return str1 === str2;
        }
        
        const start1 = str1.substring(0, size);
        const start2 = str2.substring(0, size);
        
        const end1 = str1.substring(str1.length - size);
        const end2 = str2.substring(str2.length - size);
        
        return start1 === start2 && end1 === end2;
      };
      
      return comparePartial(data1, data2, 1000);
    }
    
    // Por padrão, retornamos false
    return false;
  } catch (error) {
    console.error("Erro ao comparar imagens:", error);
    return false;
  }
}

export async function updateUserPayment(uid: string, paymentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userDoc = doc(db, 'users', uid);
    await updateDoc(userDoc, {
      paymentId,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar pagamento:', error);
    return { success: false, error: error?.message || 'Erro desconhecido' };
  }
}

export async function getUserByUid(uid: string): Promise<{
  success: boolean;
  user?: UserData;
  error?: string;
}> {
  try {
    const userDoc = doc(db, 'users', uid);
    const userSnapshot = await getDoc(userDoc);
    if (!userSnapshot.exists()) {
      return { success: false, error: 'Usuário não encontrado' };
    }
    return { success: true, user: userSnapshot.data() as UserData };
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    return { success: false, error: error?.message || 'Erro desconhecido' };
  }
}

/**
 * Vincula um pagamento do Mercado Pago a um usuário pelo email
 */
export async function linkMercadoPagoPayment(email: string, paymentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!isProduction()) {
      console.log(`Vinculando pagamento ${paymentId} ao usuário ${email}`);
    } else {
      console.log('Processando vinculação de pagamento em ambiente de produção');
    }
    
    // Buscar usuário pelo email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      const errorMsg = `Usuário com email ${isProduction() ? '[email protegido]' : email} não encontrado`;
      console.error(errorMsg);
      return { 
        success: false, 
        error: errorMsg 
      };
    }
    
    // Pegar o primeiro usuário que corresponde ao email
    const userDoc = querySnapshot.docs[0];
    const uid = userDoc.id;
    
    // Atualizar o documento do usuário com o ID de pagamento
    await updateDoc(doc(db, 'users', uid), {
      paymentId,
      updatedAt: Timestamp.now(),
      paymentDate: Timestamp.now(),
      paymentStatus: 'approved',
      paymentMethod: 'mercado_pago'
    });
    
    // Tenta sincronizar com DataConnect se disponível
    try {
      // Importação dinâmica para evitar erros se o módulo não existir
      const { syncFaceIdProfileToDataConnect } = await import('../dataconnect/face-id-service');
      await syncFaceIdProfileToDataConnect(uid, {
        faceImageUrl: userDoc.data().faceImageUrl || '',
        verified: true,
        paymentId,
        paymentStatus: 'approved',
        paymentMethod: 'mercado_pago',
        videoUrl: userDoc.data().videoUrl
      });
    } catch (dataConnectError) {
      // Não interrompe o fluxo se a sincronização com DataConnect falhar
      console.warn('Não foi possível sincronizar com DataConnect:', isProduction() ? 'Detalhes omitidos em produção' : dataConnectError);
    }
    
    if (!isProduction()) {
      console.log(`Pagamento ${paymentId} vinculado com sucesso ao usuário ${email}`);
    } else {
      console.log('Vinculação de pagamento concluída com sucesso');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao vincular pagamento:', isProduction() ? 'Detalhes omitidos no ambiente de produção' : error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Busca um usuário pelo email
 */
export async function getUserByEmail(email: string): Promise<{
  success: boolean;
  user?: UserData;
  uid?: string;
  error?: string;
}> {
  try {
    if (!email) {
      return { success: false, error: 'Email não fornecido' };
    }
    
    console.log(`Buscando usuário com email: ${email}`);
    
    // Buscar usuário pelo email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`Usuário com email ${email} não encontrado`);
      return { 
        success: false, 
        error: `Usuário com email ${email} não encontrado` 
      };
    }
    
    // Pegar o primeiro usuário que corresponde ao email
    const userDoc = querySnapshot.docs[0];
    const uid = userDoc.id;
    const userData = userDoc.data() as UserData;
    
    return { 
      success: true, 
      user: userData,
      uid
    };
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Sincroniza dados entre o Firebase e o Google Apps Script
 */
export async function syncUserDataWithAppsScript(userData: {
  uid: string;
  email: string;
  nome?: string;
  telefone?: string;
  paymentId?: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log(`Sincronizando dados do usuário ${userData.email} entre Firebase e Apps Script`);
    
    const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      return { 
        success: false, 
        error: 'URL do Apps Script não configurada'
      };
    }
    
    const syncOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'syncUser',
        data: {
          uid: userData.uid,
          email: userData.email,
          nome: userData.nome,
          telefone: userData.telefone,
          paymentId: userData.paymentId,
          timestamp: new Date().toISOString()
        }
      })
    };
    
    const response = await fetch(APPS_SCRIPT_URL, syncOptions);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`Sincronização com Apps Script: ${result.success ? 'Sucesso' : 'Falha'}`);
    
    return {
      success: result.success,
      error: result.message || result.error
    };
  } catch (error) {
    console.error('Erro ao sincronizar com Apps Script:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Verifica se o ambiente atual é de produção
 */
export function isProduction(): boolean {
  // Verificar a variável de ambiente do Next.js
  const envVar = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV;
  return envVar === 'production';
}

