const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
const TAB_NAME = "cliente";
const MAX_ROWS = 50000;
const VIP_URL = "https://studio-blush-alpha.vercel.app/exclusivo";
const LOGIN_PAGE_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?page=login";
const APPS_SCRIPT_AUTH_TOKEN = "YOUR_AUTH_TOKEN_HERE";
const MERCADO_PAGO_WEBHOOK_SECRET = "YOUR_WEBHOOK_SECRET"; 
const MERCADO_PAGO_CLIENT_ID = "YOUR_CLIENT_ID"; 
const MERCADO_PAGO_CLIENT_SECRET = "YOUR_CLIENT_SECRET"; 
const MERCADO_PAGO_ACCESS_TOKEN = "YOUR_ACCESS_TOKEN_HERE";
const ALLOWED_IMAGE_SIZE = 1024 * 1024 * 5; // 5MB
const ALLOWED_VIDEO_SIZE = 1024 * 1024 * 10; // 10MB
const FIREBASE_API_ENDPOINT = "https://studio-blush-alpha.vercel.app/api/firebase";

const firebaseConfigForClient = {
  apiKey: "YOUR_FIREBASE_API_KEY", // Replace with your actual API key
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

function setupInitialProperties() {
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('activeSpreadsheetId', SPREADSHEET_ID);
}

function getOrCreateActiveSheet() {
  const properties = PropertiesService.getScriptProperties();
  let currentSheetId = properties.getProperty('activeSpreadsheetId');
  if (!currentSheetId) {
    currentSheetId = SPREADSHEET_ID;
    properties.setProperty('activeSpreadsheetId', SPREADSHEET_ID);
  }
  const ss = SpreadsheetApp.openById(currentSheetId);
  const sheet = ss.getSheetByName(TAB_NAME) || ss.getSheets()[0];
  if (sheet.getLastRow() >= MAX_ROWS) {
    const newSpreadsheet = SpreadsheetApp.create(`Face ID - Dados (${new Date().toLocaleDateString()})`);
    const newSheet = newSpreadsheet.getSheetByName('Página1') || newSpreadsheet.getSheets()[0];
    const oldSheet = ss.getSheetByName(TAB_NAME) || ss.getSheets()[0];
    const headers = oldSheet.getRange(1, 1, 1, oldSheet.getLastColumn()).getValues();
    newSheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setFontWeight("bold");
    properties.setProperty('activeSpreadsheetId', newSpreadsheet.getId());
    return newSheet;
  }
  return sheet;
}

function doGet(e) {
  if (e && e.parameter && e.parameter.page === 'login') {
    return createLoginPage();
  }
  return createRegisterPage();
}

function doPost(e) {
  let result = { success: false, message: "Erro desconhecido." };

  try {
    // Validação básica da requisição
    if (!e || !e.postData || !e.postData.contents) {
      result = { success: false, message: "Solicitação POST inválida ou sem conteúdo." };
      Logger.log("Requisição REJEITADA: " + result.message);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    const payload = e.postData.contents;
    let data;

    try {
      data = JSON.parse(payload);
    } catch (error) {
      result = { success: false, message: "JSON inválido no payload: " + error.message };
      Logger.log(result.message);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    // Verificar se é um webhook do Mercado Pago
    if (data.topic && data.data) {
      return handleMercadoPagoWebhook(e);
    } 
    // Caso contrário, assumir que é uma requisição de registro/login normal
    else if (data.nome || data.email || data.image) {
      return handleUserOperation(data);
    } 
    // Se não for nenhum dos casos acima, rejeitar a requisição
    else {
      result = { success: false, message: "Tipo de requisição não reconhecido." };
      Logger.log(result.message);
    }

  } catch (error) {
    result = { success: false, message: "Erro interno no servidor: " + error.message };
    Logger.log("Erro geral na função doPost: " + error.message);
  }

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function handleMercadoPagoWebhook(e) {
  let result = { success: false, message: "Erro desconhecido." };
  let httpCode = 200; // Sempre retorna 200 OK para evitar reenvios do webhook

  try {
    // 1. Validar a requisição
    if (!e || !e.postData || !e.postData.contents) {
      result = { success: false, message: "Solicitação POST inválida ou sem conteúdo." };
      Logger.log("Webhook REJEITADO: " + result.message);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }
    
    const payload = e.postData.contents;
    
    // 2. Validar a Assinatura (Segurança)
    const receivedSignature = e.request.headers['x-webhook-signature'] || e.request.headers['X-Signature'];
    const timestamp = e.request.headers['x-webhook-timestamp'] || e.request.headers['X-Request-Timestamp'];

    if (!validateMercadoPagoSignature(receivedSignature, timestamp, payload)) {
      result = { success: false, message: "Assinatura do webhook inválida. A requisição será ignorada." };
      Logger.log("Webhook REJEITADO: " + result.message);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Processar dados do webhook
    const webhookData = JSON.parse(payload);
    Logger.log("Webhook DATA RECEBIDO: " + JSON.stringify(webhookData));

    if (!webhookData.data || !webhookData.data.id) {
      result = { success: false, message: "ID do pagamento não encontrado no webhook." };
      Logger.log("Webhook REJEITADO: " + result.message);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    const paymentId = webhookData.data.id;
    Logger.log(`Processando pagamento ID: ${paymentId}`);

    // 4. Buscar detalhes do pagamento na API do Mercado Pago
    const paymentDetails = getMercadoPagoPaymentDetails(paymentId);
    if (!paymentDetails || !paymentDetails.payer || !paymentDetails.payer.email) {
      result = { success: false, message: `Não foi possível obter o email do pagador para o paymentId: ${paymentId}.` };
      Logger.log(result.message);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }
    const customerEmail = paymentDetails.payer.email;
    
    // 5. Atualizar a planilha
    const sheet = getOrCreateActiveSheet();
    if (!sheet) {
      result = { success: false, message: "Planilha de usuários não encontrada." };
      Logger.log(result.message);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const emailColIndex = headers.indexOf("Email");
    const paymentIdColIndex = headers.indexOf("ID de Pagamento");

    if (emailColIndex === -1 || paymentIdColIndex === -1) {
      result = { success: false, message: "Colunas 'Email' ou 'ID de Pagamento' não encontradas." };
      Logger.log(result.message);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    const allData = sheet.getDataRange().getValues();
    let userFound = false;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][emailColIndex] === customerEmail) {
        sheet.getRange(i + 1, paymentIdColIndex + 1).setValue(paymentId);
        result = { success: true, message: `ID de pagamento ${paymentId} vinculado ao usuário ${customerEmail}.` };
        Logger.log(result.message);
        userFound = true;
        break;
      }
    }

    if (!userFound) {
      result = { success: false, message: `Usuário com o email ${customerEmail} não encontrado na planilha.` };
      Logger.log(result.message);
    }

  } catch (error) {
    Logger.log("Erro geral na função handleMercadoPagoWebhook: " + error.message);
    result = { success: false, message: "Ocorreu um erro interno no servidor: " + error.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Valida a assinatura do webhook do Mercado Pago
 */
function validateMercadoPagoSignature(receivedSignature, timestamp, payload) {
  if (!receivedSignature || !timestamp) {
    Logger.log("Assinatura ou timestamp ausente");
    return false;
  }

  try {
    const expectedSignature = Utilities.computeHmacSha256Signature(
      timestamp + payload, 
      MERCADO_PAGO_WEBHOOK_SECRET
    );
    const expectedSignatureBase64 = Utilities.base64Encode(expectedSignature);
    
    Logger.log(`Assinatura recebida: ${receivedSignature}`);
    Logger.log(`Assinatura esperada: ${expectedSignatureBase64}`);
    
    return receivedSignature === expectedSignatureBase64;
  } catch (error) {
    Logger.log("Erro ao validar assinatura: " + error.message);
    return false;
  }
}

/**
 * Busca detalhes do pagamento na API do Mercado Pago
 */
function getMercadoPagoPaymentDetails(paymentId) {
  try {
    const url = `https://api.mercadopago.com/v1/payments/${paymentId}`;
    const headers = {
      'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    };

    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    } else {
      Logger.log(`Erro ao buscar pagamento ${paymentId}: ${response.getResponseCode()}`);
      return null;
    }
  } catch (error) {
    Logger.log(`Erro na requisição para buscar pagamento ${paymentId}: ${error.message}`);
    return null;
  }
}

function handleUserOperation(data) {
  let result;
  try {
    // Verificar operação de registro
    if (data.nome && data.email && data.telefone) {
      result = registerUser(data);
    }
    // Verificar operação de login/verificação
    else if (data.image) {
      result = checkUserAndPayment(data.image);
    }
    else {
      result = { success: false, message: "Operação não reconhecida." };
    }
  } catch (error) {
    result = { success: false, message: "Erro ao processar operação: " + error.message };
    Logger.log(error);
  }

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function updatePaymentIdInSheet(customerEmail, paymentId) {
  let result = { success: false, message: "Erro ao atualizar pagamento." };

  try {
    const sheet = getOrCreateActiveSheet();
    if (!sheet) {
      result.message = `Planilha não encontrada.`;
      Logger.log(result.message);
      return result;
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const emailColIndex = headers.indexOf("Email");
    const paymentIdColIndex = headers.indexOf("ID de Pagamento");

    if (emailColIndex === -1 || paymentIdColIndex === -1) {
      result.message = "Colunas necessárias não encontradas.";
      Logger.log(result.message);
      return result;
    }

    const allData = sheet.getDataRange().getValues();
    let userFound = false;

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][emailColIndex] === customerEmail) {
        sheet.getRange(i + 1, paymentIdColIndex + 1).setValue(paymentId);
        result = { 
          success: true, 
          message: `Pagamento ${paymentId} vinculado ao usuário ${customerEmail}.` 
        };
        Logger.log(result.message);
        userFound = true;
        break;
      }
    }

    if (!userFound) {
      result.message = `Usuário ${customerEmail} não encontrado.`;
      Logger.log(result.message);
    }

  } catch (error) {
    result.message = "Erro ao atualizar planilha: " + error.message;
    Logger.log(result.message);
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function registerUser(formData) {
  if (!formData?.nome || !formData?.email || !formData?.telefone) {
    return { success: false, message: "Dados do formulário incompletos." };
  }

  try {
    // 1. Primeiro verifica duplicatas
    const duplicateCheck = checkExistingUser(formData);
    if (!duplicateCheck.success) {
      return duplicateCheck;
    }

    // 2. Registra no Firebase primeiro
    const firebaseResponse = registerInFirebase(formData);
    if (!firebaseResponse.success) {
      return { 
        success: false, 
        message: "Erro ao registrar no sistema: " + firebaseResponse.error 
      };
    }

    // 3. Se o registro no Firebase foi bem sucedido, salva na planilha
    const sheet = getOrCreateActiveSheet();
    if (!sheet) {
      // Tenta reverter o registro no Firebase
      deleteFromFirebase(firebaseResponse.uid);
      return { success: false, message: "Erro ao acessar a planilha." };
    }

    const newRowData = [
      new Date(),
      formData.nome.trim(),
      formData.email.toLowerCase().trim(),
      formData.telefone.trim(),
      formData.image || "",
      formData.video || "",
      firebaseResponse.uid || "",  // Salva o UID do Firebase
      ""  // ID de Pagamento
    ];

    sheet.appendRow(newRowData);
    
    // 4. Criar cache do rosto para busca rápida
    if (formData.image) {
      cacheUserFace(formData.email, formData.image);
    }

    return { 
      success: true, 
      message: "Cadastro realizado com sucesso.",
      uid: firebaseResponse.uid 
    };
  } catch (error) {
    Logger.log("Erro no registro: " + error.message);
    return { success: false, message: "Erro interno no servidor: " + error.message };
  }
}

function checkUserAndPayment(imageBase64) {
  if (!imageBase64) {
    return { success: false, message: "Imagem não fornecida." };
  }

  try {
    // 1. Primeiro tenta verificar no Firebase
    const firebaseResponse = verifyUserInFirebase(imageBase64);
    if (firebaseResponse.success) {
      // Verifica se tem pagamento registrado
      if (firebaseResponse.user.paymentId) {
        return { success: true, redirectUrl: VIP_URL };
      }
      return { success: false, message: "Pagamento pendente." };
    }

    // 2. Se não encontrou no Firebase, tenta na planilha (backup)
    const sheet = getOrCreateActiveSheet();
    if (!sheet) {
      return { success: false, message: "Erro ao acessar a planilha." };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const imageColIndex = headers.indexOf("Imagem ID (Base64)");
    const emailColIndex = headers.indexOf("Email");
    const paymentIdColIndex = headers.indexOf("ID de Pagamento");
    const firebaseUidIndex = headers.indexOf("Firebase UID");

    if (imageColIndex === -1 || emailColIndex === -1 || paymentIdColIndex === -1) {
      return { success: false, message: "Erro na estrutura da planilha." };
    }

    // Buscar primeiro no cache
    const cachedUser = findUserInCache(imageBase64);
    if (cachedUser) {
      // Verificar pagamento do usuário encontrado no cache
      for (const row of data) {
        if (row[emailColIndex] === cachedUser.email) {
          if (row[paymentIdColIndex]) {
            // Se encontrou na planilha e tem UID do Firebase, sincroniza
            if (row[firebaseUidIndex]) {
              syncUserToFirebase({
                uid: row[firebaseUidIndex],
                email: row[emailColIndex],
                paymentId: row[paymentIdColIndex]
              });
            }
            return { success: true, redirectUrl: VIP_URL };
          }
          return { success: false, message: "Pagamento pendente." };
        }
      }
    }

    // Busca tradicional se não encontrou no cache
    for (const row of data) {
      const storedImage = row[imageColIndex];
      if (storedImage && compareImages(imageBase64, storedImage)) {
        if (row[paymentIdColIndex]) {
          // Sincroniza com Firebase se tiver UID
          if (row[firebaseUidIndex]) {
            syncUserToFirebase({
              uid: row[firebaseUidIndex],
              email: row[emailColIndex],
              paymentId: row[paymentIdColIndex]
            });
          }
          return { success: true, redirectUrl: VIP_URL };
        }
        return { success: false, message: "Pagamento pendente." };
      }
    }

    return { success: false, message: "Usuário não encontrado." };
  } catch (error) {
    Logger.log("Erro na verificação: " + error.message);
    return { success: false, message: "Erro interno: " + error.message };
  }
}

function registerInFirebase(formData) {
  try {
    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify({
        action: 'register',
        data: {
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          image: formData.image,
          video: formData.video
        }
      })
    };

    const response = UrlFetchApp.fetch(FIREBASE_API_ENDPOINT, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log("Erro ao registrar no Firebase: " + error.message);
    return { success: false, error: error.message };
  }
}

function verifyUserInFirebase(imageBase64) {
  try {
    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify({
        action: 'verify',
        data: {
          image: imageBase64
        }
      })
    };

    const response = UrlFetchApp.fetch(FIREBASE_API_ENDPOINT, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log("Erro ao verificar no Firebase: " + error.message);
    return { success: false, error: error.message };
  }
}

function syncUserToFirebase(userData) {
  try {
    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify({
        action: 'sync',
        data: userData
      })
    };

    UrlFetchApp.fetch(FIREBASE_API_ENDPOINT, options);
  } catch (error) {
    Logger.log("Erro ao sincronizar com Firebase: " + error.message);
  }
}

function deleteFromFirebase(uid) {
  try {
    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify({
        action: 'delete',
        data: { uid }
      })
    };

    UrlFetchApp.fetch(FIREBASE_API_ENDPOINT, options);
  } catch (error) {
    Logger.log("Erro ao deletar do Firebase: " + error.message);
  }
}

/**
 * Função para verificar login por Face ID
 * Busca na planilha por uma imagem correspondente e verifica se o usuário tem pagamento
 */
function verifyUserLogin(imageBase64) {
  try {
    console.log('[Face ID Login] Iniciando verificação de usuário...');
    
    const sheet = getOrCreateActiveSheet();
    if (!sheet) {
      return { 
        success: false, 
        message: "Planilha de usuários não encontrada.", 
        isVip: false 
      };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { 
        success: false, 
        message: "Nenhum usuário cadastrado.", 
        isVip: false 
      };
    }
    
    const headers = data.shift();
    const emailColIndex = headers.indexOf("Email");
    const imageColIndex = headers.indexOf("Imagem ID (Base64)");
    const paymentIdColIndex = headers.indexOf("ID de Pagamento");
    const nomeColIndex = headers.indexOf("Nome");
    
    if (emailColIndex === -1 || imageColIndex === -1) {
      return { 
        success: false, 
        message: "Colunas necessárias não encontradas na planilha.", 
        isVip: false 
      };
    }
    
    // Buscar por correspondência de imagem (comparação simples dos primeiros caracteres)
    const imageToCompare = imageBase64.substring(0, 100); // Primeiros 100 caracteres para comparação
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const storedImage = row[imageColIndex];
      
      if (storedImage && storedImage.indexOf(imageToCompare) !== -1) {
        const userEmail = row[emailColIndex];
        const userName = row[nomeColIndex] || 'Usuário';
        const paymentId = row[paymentIdColIndex];
        
        // Verificar se tem pagamento ativo
        const hasActivePayment = paymentId && paymentId !== '';
        
        console.log(`[Face ID Login] Usuário encontrado: ${userName} (${userEmail})`);
        console.log(`[Face ID Login] Pagamento ativo: ${hasActivePayment}`);
        
        return {
          success: true,
          message: `Login realizado com sucesso! Bem-vindo(a), ${userName}.`,
          user: {
            nome: userName,
            email: userEmail,
            isVip: hasActivePayment
          },
          isVip: hasActivePayment,
          redirectUrl: hasActivePayment ? VIP_URL : null
        };
      }
    }
    
    return { 
      success: false, 
      message: "Face ID não reconhecido. Verifique se você está cadastrado.", 
      isVip: false 
    };
    
  } catch (error) {
    console.error('[Face ID Login] Erro na verificação:', error);
    return { 
      success: false, 
      message: "Erro interno durante a verificação do Face ID.", 
      isVip: false 
    };
  }
}

/**
 * Função para verificar status de pagamento de um usuário
 */
function checkPaymentStatus(userEmail) {
  try {
    console.log(`[Payment Check] Verificando pagamento para: ${userEmail}`);
    
    const sheet = getOrCreateActiveSheet();
    if (!sheet) {
      return { success: false, isVip: false, message: "Planilha não encontrada." };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: false, isVip: false, message: "Nenhum usuário cadastrado." };
    }
    
    const headers = data.shift();
    const emailColIndex = headers.indexOf("Email");
    const paymentIdColIndex = headers.indexOf("ID de Pagamento");
    
    if (emailColIndex === -1) {
      return { success: false, isVip: false, message: "Coluna de email não encontrada." };
    }
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row[emailColIndex] === userEmail) {
        const paymentId = row[paymentIdColIndex];
        const hasActivePayment = paymentId && paymentId !== '';
        
        console.log(`[Payment Check] Status para ${userEmail}: ${hasActivePayment ? 'VIP' : 'Básico'}`);
        
        return {
          success: true,
          isVip: hasActivePayment,
          message: hasActivePayment ? "Usuário VIP com pagamento ativo." : "Usuário sem pagamento ativo.",
          redirectUrl: hasActivePayment ? VIP_URL : null
        };
      }
    }
    
    return { success: false, isVip: false, message: "Usuário não encontrado." };
    
  } catch (error) {
    console.error('[Payment Check] Erro:', error);
    return { success: false, isVip: false, message: "Erro ao verificar pagamento." };
  }
}

/**
 * Função para verificar usuário existente (evitar duplicatas)
 */
function checkExistingUser(formData) {
  try {
    const sheet = getOrCreateActiveSheet();
    if (!sheet) {
      return { success: false, message: "Erro ao acessar a planilha." };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const emailColIndex = headers.indexOf("Email");
    const telefoneColIndex = headers.indexOf("Telefone");

    if (emailColIndex === -1) {
      return { success: false, message: "Coluna de email não encontrada." };
    }

    for (const row of data) {
      if (row[emailColIndex] === formData.email.toLowerCase().trim()) {
        return { success: false, message: "Email já cadastrado." };
      }
      if (telefoneColIndex !== -1 && row[telefoneColIndex] === formData.telefone.trim()) {
        return { success: false, message: "Telefone já cadastrado." };
      }
    }

    return { success: true };
  } catch (error) {
    Logger.log("Erro ao verificar usuário existente: " + error.message);
    return { success: false, message: "Erro interno na verificação." };
  }
}

/**
 * Função para comparar imagens Face ID
 */
function compareImages(image1, image2) {
  if (!image1 || !image2) return false;
  
  // Comparação simples - em produção, use uma API de reconhecimento facial
  const sample1 = image1.substring(0, 100);
  const sample2 = image2.substring(0, 100);
  
  return sample1 === sample2;
}

/**
 * Função para fazer cache de rosto do usuário
 */
function cacheUserFace(email, imageBase64) {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = `face_${email}`;
    const userData = {
      email: email,
      imageSample: imageBase64.substring(0, 100)
    };
    cache.put(cacheKey, JSON.stringify(userData), 3600); // Cache por 1 hora
  } catch (error) {
    Logger.log("Erro ao fazer cache do rosto: " + error.message);
  }
}

/**
 * Função para buscar usuário no cache
 */
function findUserInCache(imageBase64) {
  try {
    const cache = CacheService.getScriptCache();
    const imageSample = imageBase64.substring(0, 100);
    
    // Em um cenário real, você teria uma lista de chaves de cache para verificar
    // Por simplicidade, esta implementação retorna null
    return null;
  } catch (error) {
    Logger.log("Erro ao buscar no cache: " + error.message);
    return null;
  }
}

/**
 * Função para criar página de login
 */
function createLoginPage() {
  return HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Login - Studio Italo Santos</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
        .container { max-width: 400px; margin: 0 auto; }
        button { padding: 10px 20px; margin: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background: #0056b3; }
        video { width: 100%; max-width: 300px; border: 1px solid #ccc; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Login Face ID</h1>
        <video id="video" autoplay></video>
        <br>
        <button onclick="captureImage()">Fazer Login</button>
        <div id="result"></div>
      </div>
      
      <script>
        const video = document.getElementById('video');
        
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            video.srcObject = stream;
          })
          .catch(err => {
            console.error('Erro ao acessar câmera:', err);
            document.getElementById('result').innerHTML = '<p style="color: red;">Erro ao acessar câmera</p>';
          });
          
        function captureImage() {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);
          
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          
          // Enviar para verificação
          google.script.run
            .withSuccessHandler(handleSuccess)
            .withFailureHandler(handleError)
            .verifyUserLogin(imageData);
            
          document.getElementById('result').innerHTML = '<p>Verificando...</p>';
        }
        
        function handleSuccess(response) {
          if (response.success && response.isVip) {
            window.location.href = response.redirectUrl;
          } else {
            document.getElementById('result').innerHTML = '<p style="color: red;">' + response.message + '</p>';
          }
        }
        
        function handleError(error) {
          document.getElementById('result').innerHTML = '<p style="color: red;">Erro: ' + error.message + '</p>';
        }
      </script>
    </body>
    </html>
  `);
}

/**
 * Função para criar página de registro
 */
function createRegisterPage() {
  return HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cadastro - Studio Italo Santos</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; }
        input, button { padding: 10px; margin: 5px 0; width: 100%; box-sizing: border-box; }
        button { background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background: #0056b3; }
        video { width: 100%; max-width: 300px; border: 1px solid #ccc; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Cadastro Face ID</h1>
        <form id="registerForm">
          <div class="form-group">
            <label for="nome">Nome Completo:</label>
            <input type="text" id="nome" required>
          </div>
          
          <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" required>
          </div>
          
          <div class="form-group">
            <label for="telefone">Telefone:</label>
            <input type="tel" id="telefone" required>
          </div>
          
          <div class="form-group">
            <label>Capturar Face ID:</label>
            <video id="video" autoplay></video>
            <br>
            <button type="button" onclick="captureImage()">Capturar Foto</button>
            <div id="imageStatus"></div>
          </div>
          
          <button type="submit">Cadastrar</button>
        </form>
        
        <div id="result"></div>
      </div>
      
      <script>
        const video = document.getElementById('video');
        let capturedImage = null;
        
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            video.srcObject = stream;
          })
          .catch(err => {
            console.error('Erro ao acessar câmera:', err);
            document.getElementById('imageStatus').innerHTML = '<p style="color: red;">Erro ao acessar câmera</p>';
          });
          
        function captureImage() {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);
          
          capturedImage = canvas.toDataURL('image/jpeg', 0.8);
          document.getElementById('imageStatus').innerHTML = '<p style="color: green;">Foto capturada com sucesso!</p>';
        }
        
        document.getElementById('registerForm').addEventListener('submit', function(e) {
          e.preventDefault();
          
          if (!capturedImage) {
            alert('Por favor, capture sua foto antes de cadastrar.');
            return;
          }
          
          const formData = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
            image: capturedImage
          };
          
          google.script.run
            .withSuccessHandler(handleSuccess)
            .withFailureHandler(handleError)
            .registerUser(formData);
            
          document.getElementById('result').innerHTML = '<p>Cadastrando...</p>';
        });
        
        function handleSuccess(response) {
          if (response.success) {
            document.getElementById('result').innerHTML = '<p style="color: green;">' + response.message + '</p>';
            document.getElementById('registerForm').reset();
            capturedImage = null;
            document.getElementById('imageStatus').innerHTML = '';
          } else {
            document.getElementById('result').innerHTML = '<p style="color: red;">' + response.message + '</p>';
          }
        }
        
        function handleError(error) {
          document.getElementById('result').innerHTML = '<p style="color: red;">Erro: ' + error.message + '</p>';
        }
      </script>
    </body>
    </html>
  `);
}
