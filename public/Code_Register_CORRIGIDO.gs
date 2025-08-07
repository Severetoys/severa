/**
 * Google Apps Script - FaceID Auth & Register
 * Corrigido para evitar erro de 'Cannot read properties of undefined (reading \"headers\")'
 * Suporta requisições JSON e form-data do Next.js
 */

function doPost(e) {
  // Checagem defensiva para evitar erro de headers/postData
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: "Missing request data (e.postData.contents)"
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var headers = (e && e.headers) ? e.headers : {};
  var contentType = headers["Content-Type"] || headers["content-type"] || "";
  var data;

  // Tenta parsear como JSON, se falhar tenta como form-data
  try {
    if (contentType.indexOf("application/json") !== -1) {
      data = JSON.parse(e.postData.contents);
    } else {
      // Form-data (x-www-form-urlencoded)
      data = {};
      var params = e.postData.contents.split("&");
      params.forEach(function(param) {
        var parts = param.split("=");
        var key = decodeURIComponent(parts[0]);
        var value = decodeURIComponent(parts[1] || "");
        data[key] = value;
      });
    }
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: "Erro ao processar dados: " + err.message
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // Exemplo de ações suportadas
  var action = data.action || "";
  if (action === "register") {
    // ...lógica de registro...
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: "Usuário registrado!" })
    ).setMimeType(ContentService.MimeType.JSON);
  } else if (action === "login") {
    // ...lógica de login...
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: "Login realizado!" })
    ).setMimeType(ContentService.MimeType.JSON);
  } else if (action === "checkPayment") {
    // ...lógica de pagamento...
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: "Pagamento verificado!" })
    ).setMimeType(ContentService.MimeType.JSON);
  } else {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: "Ação não reconhecida." })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Adicione suas funções de registro, login e pagamento abaixo conforme sua lógica
// function handleRegister(data) { ... }
// function handleLogin(data) { ... }
// function handleCheckPayment(data) { ... }
