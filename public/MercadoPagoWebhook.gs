const SPREADSHEET_ID_MP = "18BqDSFSKvn_U1nzl0ogiOkejNLhzW9UnnaW_qvSim5w";
const TAB_NAME_MP = "cliente";
const MERCADO_PAGO_WEBHOOK_SECRET = "fece411ffe42db3a3bb143728423f37ad4f92a42bdc1c1dfd516638f9f940b37"; 
const MERCADO_PAGO_CLIENT_ID = "1595377099020994"; 
const MERCADO_PAGO_CLIENT_SECRET = "UIZDvvOe0UeHtdgwe8oJl5taJLVLZEdI"; 

/**
 * Função principal para receber webhooks do Mercado Pago.
 * @param {GoogleAppsScript.Events.DoPost} e O objeto de evento da requisição POST.
 */
function doPost(e) {
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
      Logger.log(result.message);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Processar o Payload do Webhook
    const webhookData = JSON.parse(payload);
    Logger.log("Webhook recebido: " + JSON.stringify(webhookData));

    const paymentId = webhookData.data ? webhookData.data.id : null;
    const topic = webhookData.topic;

    if (topic !== 'payment' || !paymentId) {
      const message = `Webhook ignorado. Tópico: '${topic}', ID de Pagamento: '${paymentId}'.`;
      result = { success: true, message: message };
      Logger.log(message);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Obter o email do pagador
    const paymentDetails = getMercadoPagoPaymentDetails(paymentId);
    if (!paymentDetails || !paymentDetails.payer || !paymentDetails.payer.email) {
      result = { success: false, message: `Não foi possível obter o email do pagador para o paymentId: ${paymentId}.` };
      Logger.log(result.message);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }
    const customerEmail = paymentDetails.payer.email;
    
    // 5. Atualizar a planilha
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID_MP);
    const sheet = ss.getSheetByName(TAB_NAME_MP);

    if (!sheet) {
      result = { success: false, message: `A aba '${TAB_NAME_MP}' não foi encontrada.` };
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
    Logger.log("Erro geral na função doPost: " + error.message);
    result = { success: false, message: "Ocorreu um erro interno no servidor: " + error.message };
  }

  // Resposta final do webhook
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Valida a assinatura do webhook do Mercado Pago.
 * @param {string} signature A assinatura recebida.
 * @param {string} timestamp O timestamp recebido.
 * @param {string} payload O corpo RAW da requisição.
 * @returns {boolean} True se a assinatura for válida, False caso contrário.
 */
function validateMercadoPagoSignature(signature, timestamp, payload) {
  if (!signature || !timestamp || !payload) {
    Logger.log("Dados de assinatura incompletos.");
    return false;
  }

  const parts = signature.split('=');
  if (parts.length !== 2 || parts[0] !== 'v1') {
    Logger.log("Formato de assinatura inválido.");
    return false;
  }
  const receivedHash = parts[1];
  
  const stringToSign = `${timestamp}.${payload}`;
  const hmac = Utilities.computeHmacSha256Signature(stringToSign, MERCADO_PAGO_WEBHOOK_SECRET);
  const expectedHash = Utilities.base64Encode(hmac);
  
  return receivedHash === expectedHash;
}

/**
 * Obtém detalhes completos de um pagamento do Mercado Pago via API.
 * @param {string} paymentId O ID do pagamento.
 * @returns {Object|null} Os detalhes do pagamento ou null em caso de erro.
 */
function getMercadoPagoPaymentDetails(paymentId) {
  try {
    const tokenUrl = "https://api.mercadopago.com/oauth/token";
    const tokenOptions = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify({
        'client_id': MERCADO_PAGO_CLIENT_ID,
        'client_secret': MERCADO_PAGO_CLIENT_SECRET,
        'grant_type': 'client_credentials'
      }),
      'muteHttpExceptions': true
    };
    const tokenResponse = UrlFetchApp.fetch(tokenUrl, tokenOptions);
    const tokenData = JSON.parse(tokenResponse.getContentText());
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      Logger.log("Falha ao obter Access Token do Mercado Pago.");
      return null;
    }

    const paymentUrl = `https://api.mercadopago.com/v1/payments/${paymentId}`;
    const paymentOptions = {
      'method': 'get',
      'headers': {
        'Authorization': `Bearer ${accessToken}`
      },
      'muteHttpExceptions': true
    };
    const paymentResponse = UrlFetchApp.fetch(paymentUrl, paymentOptions);
    const paymentDetails = JSON.parse(paymentResponse.getContentText());

    if (paymentResponse.getResponseCode() >= 200 && paymentResponse.getResponseCode() < 300) {
      return paymentDetails;
    } else {
      Logger.log(`Erro ao buscar detalhes do pagamento ${paymentId}: Código ${paymentResponse.getResponseCode()}, Resposta: ${paymentResponse.getContentText()}`);
      return null;
    }

  } catch (e) {
    Logger.log("Exceção ao buscar detalhes do pagamento do Mercado Pago: " + e.message);
    return null;
  }
}