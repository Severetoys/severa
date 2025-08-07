const SPREADSHEET_ID = "18BqDSFSKvn_U1nzl0ogiOkejNLhzW9UnnaW_qvSim5w";
const TAB_NAME = "cliente";
const MAX_ROWS = 50000;
const VIP_URL = "https://studio-blush-alpha.vercel.app/exclusivo";
const LOGIN_PAGE_URL = "https://script.google.com/macros/s/AKfycbx8D38lGjcdEvy1jil76meU3z9OyD53n3MbMZl-rlErO_P_qL72TfmVDQIlri6OZvHu/exec?page=login";
const APPS_SCRIPT_AUTH_TOKEN = "fece411ffe42db3a3bb143728423f37ad4f92a42bdc1c1dfd516638f9f940b37";
const firebaseConfigForClient = {
  apiKey: "AIzaSyC7yaXjEFWFORvyLyHh1O5SPYjRCzptTg8",
  authDomain: "authkit-y9vjx.firebaseapp.com",
  projectId: "authkit-y9vjx",
  storageBucket: "authkit-y9vjx.firebasestorage.app",
  messagingSenderId: "308487499277",
  appId: "1:308487499277:web:3fde6468b179432e9f2f44",
  measurementId: "G-XKJWPXDPZS"
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
    if (formData.email && row[emailColIndex] === formData.email) {
      return { success: false, message: "Email já cadastrado." };
    }
    if (formData.telefone && row[telefoneColIndex] === formData.telefone) {
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
function doPost(e) {
  let result;
  try {
    if (!e || !e.postData || !e.postData.contents) {
      result = { success: false, message: "Solicitação POST inválida ou sem conteúdo." };
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }
    const payload = JSON.parse(e.postData.contents);
    // Roteamento simples: ação via campo "action" no payload
    switch (payload.action) {
      case "register":
        result = registerUser(payload);
        break;
      case "checkUser":
        result = checkExistingUser(payload);
        break;
      case "login":
        // Aqui você pode implementar a lógica de verificação facial
        result = verifyUserLogin(payload);
        break;
      case "checkPayment":
        result = checkPaymentStatus(payload.customerEmail);
        break;
      default:
        result = { success: false, message: "Ação não reconhecida." };
    }
  } catch (error) {
    result = { success: false, message: "Ocorreu um erro no servidor: " + error.message };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// Exemplo de função de login facial (deve ser implementada conforme sua lógica)
function verifyUserLogin(payload) {
  // Exemplo: busca por imagem base64 no banco
  const sheet = getOrCreateActiveSheet();
  if (!sheet) {
    return { success: false, message: "Planilha de usuários não encontrada." };
  }
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: false, message: "Nenhum usuário cadastrado." };
  }
  const headers = data.shift();
  const imageColIndex = headers.indexOf("Imagem ID (Base64)");
  if (imageColIndex === -1) {
    return { success: false, message: "Coluna de imagem não encontrada." };
  }
  if (!payload.image) {
    return { success: false, message: "Imagem não fornecida para verificação." };
  }
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[imageColIndex] && payload.image && row[imageColIndex].indexOf(payload.image.substring(0, 100)) !== -1) {
      return { success: true, message: "Usuário autenticado!", redirectUrl: VIP_URL };
    }
  }
  return { success: false, message: "Usuário não reconhecido." };
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
            .form-group { margin-bottom: 2rem; text-align: left; }
            .form-group label { display: block; margin-bottom: 0.75rem; color: #ff0000; font-weight: 600; text-shadow: 0 0 3px #ff0000; }
            .form-group input { width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid rgba(255, 0, 0, 0.4); background-color: rgba(0, 0, 0, 0.4); color: #ffffff; font-size: 1.1rem; box-sizing: border-box; }
            #videoGravado { margin-top: 1rem; border-radius: 16px; max-width: 100%; display: none; }
            .send-button, .capture-button, .sms-button { background-color: #ff0000; color: #ffffff; padding: 0.8rem 2rem; border: none; border-radius: 8px; cursor: pointer; font-size: 1.2rem; transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease; margin-top: 1.5rem; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 0 8px rgba(255, 0, 0, 0.7); }
            .send-button:hover, .capture-button:hover, .sms-button:hover { box-shadow: 0 0 15px rgba(255, 0, 0, 0.9), 0 0 20px rgba(255, 0, 0, 0.6); }
            .send-button:disabled, .capture-button:disabled, .sms-button:disabled { background-color: rgba(255, 0, 0, 0.5); cursor: not-allowed; box-shadow: none; }
            .capture-button i, .sms-button i { margin-right: 0.5rem; }
            .error-message { color: #f87171; margin-top: 1.5rem; font-size: 1rem; padding: 1rem; background-color: rgba(248, 113, 113, 0.2); border-radius: 8px; display: none; }
            .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); justify-content: center; align-items: center; }
            .modal-content { background-color: #0c0a09; padding: 2rem; border-radius: 16px; max-width: 90%; width: 500px; position: relative; }
            .modal-body video { width: 100%; border-radius: 14px; }
            .modal-close-button { position: absolute; top: 1rem; right: 1.5rem; font-size: 2rem; color: #ff0000; cursor: pointer; border: none; background: none; }
            #videoMessage { margin-top: 1rem; }
            .page-link { margin-top: 2rem; display: block; color: #ff0000; text-decoration: none; }
            .auth-method-toggle { margin-bottom: 1.5rem; }
            .auth-method-toggle button { background-color: #333; color: #eee; padding: 0.6rem 1.2rem; border: 1px solid #555; border-radius: 8px; cursor: pointer; margin: 0 5px; transition: background-color 0.3s; }
            .auth-section { display: none; }
            #recaptcha-container { margin-top: 1rem; display: flex; justify-content: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Face ID - Cadastro</h1>
            <div id="opencv-status">Carregando...</div>
            <form id="registrationForm">
                <div id="personalAndSmsSection">
                    <div class="form-group"><label for="nome">Nome:</label><input type="text" id="nome" required></div>
                    <div class="form-group"><label for="email">Email:</label><input type="email" id="email" required></div>
                    <div class="form-group"><label for="telefone">Telefone:</label><input type="tel" id="telefone" required placeholder="+55 (XX) XXXXX-XXXX"></div>
                </div>
                <div id="faceRecordingSection">
                    <div class="form-group" style="text-align: center;"><label>Gravar Vídeo de Verificação Facial</label><button type="button" class="capture-button" id="openModalButton" disabled><i class="fas fa-video"></i> Gravar</button></div>
                    <div class="form-group"><video id="videoGravado" controls></video></div>
                </div>
                <button type="submit" class="send-button" id="sendButton" disabled>Enviar Cadastro Completo</button>
            </form>
            <div id="error-message" class="error-message"></div>
            <a href="${loginUrl}" class="page-link">Já tem uma conta? Faça Login</a>
        </div>
        <div id="cameraModal" class="modal"><div class="modal-content"><div class="modal-header"><h2>Gravação de Vídeo</h2><button type="button" id="closeModalButton" class="modal-close-button">&times;</button></div><div class="modal-body"><video id="videoInput" autoplay playsinline></video><div id="videoMessage">Iniciando câmera...</div></div></div></div>
        <script>
            let opencvLoaded = false, isCameraOpen = false, mediaRecorder, videoBase64 = '', imageBase64 = '';
            const nomeInput = document.getElementById('nome');
            const emailInput = document.getElementById('email');
            const telefoneInput = document.getElementById('telefone');
            const openModalButton = document.getElementById('openModalButton');
            const videoGravado = document.getElementById('videoGravado');
            const sendButton = document.getElementById('sendButton');
            const errorMessageElement = document.getElementById('error-message');
            const cameraModal = document.getElementById('cameraModal');
            const closeModalButton = document.getElementById('closeModalButton');
            const videoInput = document.getElementById('videoInput');
            const videoMessage = document.getElementById('videoMessage');
            const registrationForm = document.getElementById('registrationForm');
            function onOpenCvReady() { document.getElementById('opencv-status').textContent = 'OpenCV.js carregado.'; openModalButton.disabled = false; }
            function stopCamera() { if (videoInput.srcObject) { videoInput.srcObject.getTracks().forEach(track => track.stop()); videoInput.srcObject = null; } isCameraOpen = false; }
            function fecharModalCamera() { cameraModal.style.display = 'none'; stopCamera(); if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop(); }
            function getRecorderOptions() { const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']; for (const mimeType of mimeTypes) if (MediaRecorder.isTypeSupported(mimeType)) return { mimeType }; return {}; }
            async function recordAndCapture() { return new Promise((resolve, reject) => { if (!isCameraOpen) return reject(new Error('A câmera não está ativa.')); let capturedImageData = null, capturedVideoData = null; const checkCompletion = () => { if (capturedImageData && capturedVideoData) resolve({ videoData: capturedVideoData, imageData: capturedImageData }); }; setTimeout(() => { if (isCameraOpen && videoInput.readyState >= 3) { const canvas = document.createElement('canvas'); canvas.width = videoInput.videoWidth; canvas.height = videoInput.videoHeight; canvas.getContext('2d').drawImage(videoInput, 0, 0, canvas.width, canvas.height); capturedImageData = { base64: canvas.toDataURL('image/jpeg') }; checkCompletion(); } }, 2500); const recordedChunks = [], recorderOptions = getRecorderOptions(); try { mediaRecorder = new MediaRecorder(videoInput.srcObject, recorderOptions); } catch (e) { return reject(new Error("Não foi possível criar o MediaRecorder: " + e.message)); } mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); }; mediaRecorder.onstop = () => { const blob = new Blob(recordedChunks, { type: recorderOptions.mimeType || 'video/webm' }); const url = URL.createObjectURL(blob); const reader = new FileReader(); reader.onloadend = () => { capturedVideoData = { base64: reader.result, url }; checkCompletion(); }; reader.onerror = () => reject(new Error("Falha ao ler o blob de vídeo.")); reader.readAsDataURL(blob); }; mediaRecorder.onerror = err => reject(new Error("Erro no MediaRecorder: " + err)); mediaRecorder.start(); videoMessage.textContent = 'Gravando... Fique parado.'; setTimeout(() => { if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop(); }, 5000); }); }
            async function startAutomaticRecording() { if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { mostrarErro('Seu navegador não suporta acesso à câmera.'); return; } cameraModal.style.display = 'flex'; videoMessage.textContent = 'Iniciando câmera...'; try { const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); videoInput.srcObject = stream; isCameraOpen = true; await new Promise(resolve => videoInput.onloadedmetadata = resolve); const { videoData, imageData } = await recordAndCapture(); videoBase64 = videoData.base64; imageBase64 = imageData.base64; videoGravado.src = videoData.url; videoGravado.style.display = 'block'; sendButton.disabled = false; fecharModalCamera(); } catch (error) { mostrarErro(error.message); fecharModalCamera(); } }
            function mostrarErro(mensagem) { errorMessageElement.textContent = mensagem; errorMessageElement.style.display = 'block'; }
            function enviarDados(event) {
              event.preventDefault();
              if (!videoBase64 || !imageBase64) {
                  mostrarErro('Por favor, grave o vídeo facial antes de enviar.');
                  return;
              }
              sendButton.disabled = true;
              sendButton.textContent = 'Enviando...';
              const dataToSend = {
                nome: nomeInput.value,
                email: emailInput.value,
                telefone: telefoneInput.value,
                video: videoBase64,
                image: imageBase64
              };
              google.script.run
                .withSuccessHandler(checkResponse => {
                  if (!checkResponse.success) {
                    mostrarErro(checkResponse.message);
                    sendButton.disabled = false;
                    sendButton.textContent = 'Enviar Cadastro Completo';
                  } else {
                    google.script.run
                      .withSuccessHandler(response => {
                        if (response.success) {
                          alert('Cadastro realizado com sucesso! Aguardando pagamento.');
                          registrationForm.reset();
                          videoGravado.style.display = 'none';
                          videoBase64 = '';
                          imageBase64 = '';
                          sendButton.disabled = true;
                          window.location.href = "${LOGIN_PAGE_URL}";
                        } else {
                          mostrarErro(response.message || 'Ocorreu um erro.');
                        }
                        sendButton.disabled = false;
                        sendButton.textContent = 'Enviar Cadastro Completo';
                      })
                      .withFailureHandler(error => {
                        mostrarErro('Falha no envio: ' + error.message);
                        sendButton.disabled = false;
                        sendButton.textContent = 'Enviar Cadastro Completo';
                      })
                      .registerUser(dataToSend);
                  }
                })
                .withFailureHandler(error => {
                  mostrarErro('Falha na verificação de usuário: ' + error.message);
                  sendButton.disabled = false;
                  sendButton.textContent = 'Enviar Cadastro Completo';
                })
                .checkExistingUser(dataToSend);
            }
            openModalButton.addEventListener('click', startAutomaticRecording);
            closeModalButton.addEventListener('click', fecharModalCamera);
            registrationForm.addEventListener('submit', enviarDados);
            window.addEventListener('load', () => { if (typeof cv !== 'undefined') onOpenCvReady(); });
        </script>
        <script async src="https://docs.opencv.org/4.9.0/opencv.js" onload="onOpenCvReady();"></script>
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <style>
            body { font-family: 'Inter', sans-serif; background-color: #0c0a09; color: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
            .container { max-width: 500px; background-color: rgba(0, 0, 0, 0.4); backdrop-filter: blur(12px); border-radius: 16px; box-shadow: 0 0 15px rgba(255, 0, 0, 0.6), 0 0 25px rgba(255, 0, 0, 0.4), 0 0 35px rgba(255, 0, 0, 0.2); padding: 30px; text-align: center; border: 1px solid rgba(255, 0, 0, 0.3); }
            h1 { font-size: 2.5rem; font-weight: bold; margin-bottom: 2rem; color: #ff0000; text-shadow: 0 0 5px #ff0000, 0 0 10px #ff0000, 0 0 15px #ff0000; }
            .login-button { background-color: #ff0000; color: #ffffff; padding: 1rem 2.5rem; border: none; border-radius: 8px; cursor: pointer; font-size: 1.3rem; transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease; margin-top: 1.5rem; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 0 8px rgba(255, 0, 0, 0.7); }
            .login-button:hover { box-shadow: 0 0 15px rgba(255, 0, 0, 0.9), 0 0 20px rgba(255, 0, 0, 0.6); }
            .login-button:disabled { background-color: rgba(255, 0, 0, 0.5); cursor: not-allowed; box-shadow: none; }
            .login-button i { margin-right: 1rem; }
            .error-message { color: #f87171; margin-top: 1.5rem; font-size: 1rem; padding: 1rem; background-color: rgba(248, 113, 113, 0.2); border-radius: 8px; display: none; }
            #status { margin-top: 1.5rem; font-size: 1.1rem; }
            .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); justify-content: center; align-items: center; }
            .modal-content { background-color: #0c0a09; padding: 2rem; border-radius: 16px; max-width: 90%; width: 500px; position: relative; }
            .modal-body video { width: 100%; border-radius: 14px; }
            .page-link { margin-top: 2rem; display: block; color: #ff0000; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Login com Face ID</h1>
            <p id="status">Clique no botão para autenticar</p>
            <button type="button" class="login-button" id="loginButton"><i class="fas fa-camera"></i> Autenticar com Face ID</button>
            <div id="error-message" class="error-message"></div>
            <a href="${registerUrl}" class="page-link">Não tem uma conta? Cadastre-se</a>
        </div>
        <div id="cameraModal" class="modal"><div class="modal-content"><div class="modal-body"><video id="videoInput" autoplay playsinline></video></div></div></div>
        <script>
            // JS Client-side
            const loginButton = document.getElementById('loginButton');
            const statusElement = document.getElementById('status');
            const errorMessageElement = document.getElementById('error-message');
            const cameraModal = document.getElementById('cameraModal');
            const videoInput = document.getElementById('videoInput');
            function mostrarErro(mensagem) { errorMessageElement.textContent = mensagem; errorMessageElement.style.display = 'block'; statusElement.textContent = 'Falha na autenticação'; }
            async function handleLogin() {
                loginButton.disabled = true;
                statusElement.textContent = 'Iniciando câmera...';
                errorMessageElement.style.display = 'none';
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { mostrarErro('Seu navegador não suporta acesso à câmera.'); loginButton.disabled = false; return; }
                let stream;
                try {
                    cameraModal.style.display = 'flex';
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    videoInput.srcObject = stream;
                    await new Promise(resolve => videoInput.onloadedmetadata = resolve);
                    statusElement.textContent = 'Olhe para a câmera...';
                    const imageBase64 = await new Promise(resolve => {
                        setTimeout(() => {
                            const canvas = document.createElement('canvas');
                            canvas.width = videoInput.videoWidth;
                            canvas.height = videoInput.videoHeight;
                            canvas.getContext('2d').drawImage(videoInput, 0, 0, canvas.width, canvas.height);
                            resolve(canvas.toDataURL('image/jpeg'));
                        }, 1500);
                    });
                    statusElement.textContent = 'Verificando...';
                    google.script.run
                        .withSuccessHandler(response => {
                            if (response.success) {
                                statusElement.textContent = 'Autenticado! Redirecionando...';
                                window.location.href = response.redirectUrl;
                                setTimeout(() => { window.close(); }, 500);
                            } else {
                                mostrarErro(response.message || 'Usuário não reconhecido.');
                                loginButton.disabled = false;
                            }
                        })
                        .withFailureHandler(error => {
                            mostrarErro('Erro no servidor: ' + error.message);
                            loginButton.disabled = false;
                        })
                        .verifyUserLogin(imageBase64);
                } catch (error) {
                    mostrarErro('Erro na câmera: ' + error.message);
                    loginButton.disabled = false;
                } finally {
                    if(stream) stream.getTracks().forEach(track => track.stop());
                    cameraModal.style.display = 'none';
                }
            }
            loginButton.addEventListener('click', handleLogin);
        </script>
    </body>
    </html>
  `;
}