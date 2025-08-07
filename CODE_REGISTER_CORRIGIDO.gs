// ===== CODE_REGISTER.GS CORRIGIDO =====
// Substitua TODO o conteúdo do arquivo Code_Register.gs por este código

const SPREADSHEET_ID = "18BqDSFSKvn_U1nzl0ogiOkejNLhzW9UnnaW_qvSim5w";
const TAB_NAME = "cliente";
const MAX_ROWS = 50000;
const VIP_URL = "https://studio-blush-alpha.vercel.app/exclusivo";
const LOGIN_PAGE_URL = "https://script.google.com/macros/s/AKfycbx8D38lGjcdEvy1jil76meU3z9OyD53n3MbMZl-rlErO_P_qL72TfmVDQIlri6OZvHu/exec?page=login";
const APPS_SCRIPT_AUTH_TOKEN = "fece411ffe42db3a3bb143728423f37ad4f92a42bdc1c1dfd516638f9f940b37";

const firebaseConfigForClient = {
  // SECURITY NOTE: In production, these values should come from environment variables
  // This is a Google Apps Script file that needs hardcoded values for client-side use
  // Make sure to use your actual Firebase project values here
  apiKey: "your_api_key_here",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project.firebasestorage.app",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id",
  measurementId: "your_measurement_id"
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

function createRegisterPage() {
  return HtmlService.createHtmlOutput(getRegisterPageContent()).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function createLoginPage() {
  return HtmlService.createHtmlOutput(getLoginPageContent()).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ===== FUNÇÃO doPost CORRIGIDA PARA NEXT.JS =====
function doPost(e) {
  try {
    console.log('=== doPost INICIADO ===');
    console.log('Evento completo:', JSON.stringify(e));
    
    // Verificar se o evento existe
    if (!e) {
      console.log('ERRO: Evento é null/undefined');
      return createJsonResponse(false, 'Evento não definido');
    }
    
    let data = {};
    
    // Processar dados do POST
    if (e.postData && e.postData.contents) {
      console.log('Processando postData.contents:', e.postData.contents);
      try {
        data = JSON.parse(e.postData.contents);
        console.log('Dados JSON parseados:', JSON.stringify(data));
      } catch (parseError) {
        console.log('Erro ao fazer parse JSON:', parseError);
        console.log('Tentando usar e.parameter...');
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      console.log('Usando e.parameter:', JSON.stringify(e.parameter));
      data = e.parameter;
    } else {
      console.log('ERRO: Nenhum dado encontrado');
      return createJsonResponse(false, 'Dados POST não encontrados');
    }
    
    console.log('Dados finais processados:', JSON.stringify(data));
    
    // Verificar se é uma requisição do Next.js (tem action)
    if (data.action) {
      console.log('Requisição Next.js detectada, action:', data.action);
      return handleNextJSRequest(data);
    }
    
    // Se não tem action, é um pagamento legado
    console.log('Requisição de pagamento legado detectada');
    return handleLegacyPayment(data);
    
  } catch (error) {
    console.error('ERRO GERAL no doPost:', error);
    return createJsonResponse(false, 'Erro interno: ' + error.toString());
  }
}

// Função para criar resposta JSON padronizada
function createJsonResponse(success, message, extraData = {}) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString(),
    ...extraData
  };
  
  console.log('Resposta enviada:', JSON.stringify(response));
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// Função para processar requisições do Next.js
function handleNextJSRequest(data) {
  console.log('=== handleNextJSRequest ===');
  console.log('Action:', data.action);
  
  switch (data.action) {
    case 'register':
      return handleRegisterFromNextJS(data);
    case 'login':
      return handleLoginFromNextJS(data);
    case 'checkPayment':
      return handleCheckPaymentFromNextJS(data);
    default:
      return createJsonResponse(false, 'Ação não reconhecida: ' + data.action);
  }
}

// Cadastro vindo do Next.js
function handleRegisterFromNextJS(data) {
  try {
    console.log('=== REGISTER NEXT.JS ===');
    console.log('Dados de cadastro:', JSON.stringify(data));
    
    // Validar dados obrigatórios
    if (!data.nome || !data.email || !data.image) {
      return createJsonResponse(false, 'Nome, email e imagem são obrigatórios');
    }
    
    // Verificar se usuário já existe
    const existingCheck = checkExistingUser({
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      image: data.image
    });
    
    if (!existingCheck.success) {
      return createJsonResponse(false, existingCheck.message);
    }
    
    // Registrar usuário
    const registerResult = registerUser({
      nome: data.nome,
      email: data.email,
      telefone: data.telefone || '',
      image: data.image,
      video: data.video || '',
      firebaseUid: data.firebaseUid || ''
    });
    
    if (registerResult.success) {
      return createJsonResponse(true, 'Usuário cadastrado com sucesso');
    } else {
      return createJsonResponse(false, registerResult.message);
    }
    
  } catch (error) {
    console.error('Erro no cadastro Next.js:', error);
    return createJsonResponse(false, 'Erro ao cadastrar: ' + error.toString());
  }
}

// Login vindo do Next.js
function handleLoginFromNextJS(data) {
  try {
    console.log('=== LOGIN NEXT.JS ===');
    console.log('Dados de login:', JSON.stringify(data));
    
    if (!data.image) {
      return createJsonResponse(false, 'Imagem obrigatória para login');
    }
    
    const sheet = getOrCreateActiveSheet();
    if (!sheet) {
      return createJsonResponse(false, 'Planilha não encontrada');
    }
    
    // Buscar usuário pela imagem
    const rows = sheet.getDataRange().getValues();
    console.log('Verificando', rows.length - 1, 'usuários cadastrados');
    
    for (let i = 1; i < rows.length; i++) {
      const rowEmail = rows[i][2];      // C: Email
      const rowImage = rows[i][4];      // E: Imagem ID (Base64)
      const paymentId = rows[i][7];     // H: ID de Pagamento
      
      // Verificar correspondência por imagem
      let imageMatch = false;
      if (rowImage && data.image) {
        const storedPart = rowImage.substring(0, 100);
        const providedPart = data.image.substring(0, 100);
        imageMatch = storedPart === providedPart;
      }
      
      // Verificar correspondência por email se fornecido
      const emailMatch = data.email && rowEmail === data.email;
      
      if (imageMatch || emailMatch) {
        console.log('Usuário encontrado:', rowEmail);
        
        const isVip = paymentId && paymentId !== '';
        
        return createJsonResponse(true, 'Usuário encontrado', {
          isVip: isVip,
          redirectUrl: isVip ? VIP_URL : '/assinante',
          userEmail: rowEmail,
          userName: rows[i][1] // B: Nome
        });
      }
    }
    
    return createJsonResponse(false, 'Usuário não reconhecido');
    
  } catch (error) {
    console.error('Erro no login Next.js:', error);
    return createJsonResponse(false, 'Erro ao fazer login: ' + error.toString());
  }
}

// Verificar pagamento vindo do Next.js
function handleCheckPaymentFromNextJS(data) {
  try {
    console.log('=== CHECK PAYMENT NEXT.JS ===');
    
    if (!data.email && !data.image) {
      return createJsonResponse(false, 'Email ou imagem obrigatória');
    }
    
    const sheet = getOrCreateActiveSheet();
    if (!sheet) {
      return createJsonResponse(false, 'Planilha não encontrada');
    }
    
    const rows = sheet.getDataRange().getValues();
    
    for (let i = 1; i < rows.length; i++) {
      const rowEmail = rows[i][2];      // C: Email
      const rowImage = rows[i][4];      // E: Imagem
      const paymentId = rows[i][7];     // H: ID de Pagamento
      
      let userMatch = false;
      
      if (data.email && rowEmail === data.email) {
        userMatch = true;
      } else if (data.image && rowImage && rowImage.includes(data.image.substring(0, 50))) {
        userMatch = true;
      }
      
      if (userMatch) {
        const isVip = paymentId && paymentId !== '';
        return createJsonResponse(true, 'Status verificado', {
          isVip: isVip,
          paymentId: paymentId || null
        });
      }
    }
    
    return createJsonResponse(false, 'Usuário não encontrado');
    
  } catch (error) {
    console.error('Erro check payment Next.js:', error);
    return createJsonResponse(false, 'Erro ao verificar pagamento: ' + error.toString());
  }
}

// Função para processar pagamentos legados (compatibilidade)
function handleLegacyPayment(data) {
  console.log('=== PAGAMENTO LEGADO ===');
  
  const { paymentId, customerEmail } = data;
  
  if (!paymentId || !customerEmail) {
    return createJsonResponse(false, 'Payload inválido. Dados de pagamento ou email ausentes.');
  }
  
  const sheet = getOrCreateActiveSheet();
  if (!sheet) {
    return createJsonResponse(false, "A aba '" + TAB_NAME + "' não foi encontrada.");
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const emailCol = headers.indexOf("Email") + 1;
  const paymentIdCol = headers.indexOf("ID de Pagamento") + 1;
  
  if (emailCol === 0 || paymentIdCol === 0) {
    return createJsonResponse(false, "Colunas 'Email' ou 'ID de Pagamento' não encontradas.");
  }
  
  const dataRange = sheet.getRange(2, emailCol, sheet.getLastRow(), 1);
  const textFinder = dataRange.createTextFinder(customerEmail).findNext();
  
  if (textFinder) {
    sheet.getRange(textFinder.getRow(), paymentIdCol).setValue(paymentId);
    return createJsonResponse(true, "ID de pagamento vinculado ao usuário " + customerEmail + ".");
  } else {
    return createJsonResponse(false, "Usuário com o email " + customerEmail + " não encontrado.");
  }
}

// ===== FUNÇÕES ORIGINAIS (sem modificação) =====

function registerUser(formData) {
  if (!formData || !formData.nome || !formData.email || !formData.telefone) {
    return { success: false, message: "Dados do formulário inválidos." };
  }
  try {
    const sheet = getOrCreateActiveSheet();
    if (!sheet) {
      return { success: false, message: "A aba '" + TAB_NAME + "' não foi encontrada." };
    }
    const newRowData = [
      new Date(),
      formData.nome,
      formData.email,
      formData.telefone,
      formData.image || "",
      formData.video || "",
      formData.firebaseUid || "",
      ""
    ];
    sheet.appendRow(newRowData);
    return { success: true, message: "Novo usuário registrado com sucesso." };
  } catch (error) {
    return { success: false, message: "Ocorreu um erro no servidor: " + error.message };
  }
}

function checkExistingUser(formData) {
  const sheet = getOrCreateActiveSheet();
  if (!sheet) {
    return { success: false, message: "Planilha de usuários não encontrada." };
  }
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: true, message: "Nenhum usuário encontrado." };
  }
  const headers = data.shift();
  const emailColIndex = headers.indexOf("Email");
  const telefoneColIndex = headers.indexOf("Telefone");
  const imageColIndex = headers.indexOf("Imagem ID (Base64)");
  if (emailColIndex === -1 || telefoneColIndex === -1 || imageColIndex === -1) {
    return { success: false, message: "Colunas necessárias não encontradas." };
  }
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[emailColIndex] === formData.email) {
      return { success: false, message: "Email já cadastrado." };
    }
    if (row[telefoneColIndex] === formData.telefone) {
      return { success: false, message: "Telefone já cadastrado." };
    }
    if (row[imageColIndex] && formData.image && row[imageColIndex].indexOf(formData.image.substring(0, 100)) !== -1) {
      return { success: false, message: "Rosto já cadastrado." };
    }
  }
  return { success: true, message: "Dados únicos, pode cadastrar." };
}

function checkPaymentStatus(customerEmail) {
  try {
    const sheet = getOrCreateActiveSheet();
    if (!sheet) {
      return { success: false, message: "Planilha de usuários não encontrada." };
    }
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const emailCol = headers.indexOf("Email") + 1;
    const paymentIdCol = headers.indexOf("ID de Pagamento") + 1;
    if (emailCol === 0 || paymentIdCol === 0) {
      return { success: false, message: "Colunas 'Email' ou 'ID de Pagamento' não encontradas." };
    }
    const dataRange = sheet.getRange(2, emailCol, sheet.getLastRow() - 1, paymentIdCol);
    const textFinder = dataRange.createTextFinder(customerEmail).findNext();
    if (textFinder) {
      const paymentIdCell = sheet.getRange(textFinder.getRow(), paymentIdCol).getValue();
      if (paymentIdCell && paymentIdCell !== "") {
        return { success: true, message: "Pagamento identificado." };
      }
    }
    return { success: false, message: "Pagamento não identificado." };
  } catch (error) {
    return { success: false, message: "Ocorreu um erro ao verificar o pagamento: " + error.message };
  }
}

function setupSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(TAB_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_NAME);
  }
  sheet.clear();
  const headers = [["Data/Hora", "Nome", "Email", "Telefone", "Imagem ID (Base64)", "Vídeo (Base64)", "Firebase UID", "ID de Pagamento"]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setFontWeight("bold");
  sheet.setColumnWidth(1, 150).setColumnWidth(2, 200).setColumnWidth(3, 250).setColumnWidth(4, 150).setColumnWidth(5, 150).setColumnWidth(6, 150).setColumnWidth(7, 200).setColumnWidth(8, 200);
  return "Planilha reconfigurada com sucesso!";
}

// ===== FUNÇÕES HTML (sem modificação) =====

function getRegisterPageContent() {
  const loginUrl = ScriptApp.getService().getUrl() + '?page=login';
  return `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Face ID - Cadastro</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <style>
            body { font-family: 'Inter', sans-serif; background-color: #0c0a09; color: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
            .container { max-width: 800px; background-color: rgba(0, 0, 0, 0.4); backdrop-filter: blur(12px); border-radius: 16px; box-shadow: 0 0 15px rgba(255, 0, 0, 0.6), 0 0 25px rgba(255, 0, 0, 0.4), 0 0 35px rgba(255, 0, 0, 0.2); padding: 30px; text-align: center; border: 1px solid rgba(255, 0, 0, 0.3); }
            h1 { font-size: 2.5rem; font-weight: bold; margin-bottom: 2rem; color: #ff0000; text-shadow: 0 0 5px #ff0000, 0 0 10px #ff0000, 0 0 15px #ff0000; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Face ID - Sistema Ativo</h1>
            <p>Sistema integrado com Next.js funcionando!</p>
            <a href="${loginUrl}" style="color: #ff0000;">Login</a>
        </div>
    </body>
    </html>
  `;
}

function getLoginPageContent() {
  const registerUrl = ScriptApp.getService().getUrl();
  return `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Face ID - Login</title>
    </head>
    <body>
        <div style="text-align: center; padding: 50px;">
            <h1>Face ID - Login Ativo</h1>
            <p>Sistema integrado com Next.js funcionando!</p>
            <a href="${registerUrl}" style="color: #ff0000;">Cadastro</a>
        </div>
    </body>
    </html>
  `;
}
