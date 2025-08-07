// src/services/faceIdService.ts
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxZ3CL2OFZi3zyCv0ZbKiA1Ma0XFM4Ik0TAr6LnmJFXcK2UiIfq9qkBZiviLve9OA3E/exec'; // URL completa da sua implantação do Apps Script

export async function registerUser(data: {
  nome: string;
  email: string;
  telefone: string;
  image: string;
  video: string;
}) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'register', ...data }),
  });
  return await res.json();
}

export async function checkExistingUser(data: {
  email: string;
  telefone: string;
  image: string;
}) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'checkUser', ...data }),
  });
  return await res.json();
}

export async function loginWithFace(image: string) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', image }),
  });
  return await res.json();
}

export async function checkPayment(email: string) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'checkPayment', customerEmail: email }),
  });
  return await res.json();
}
