// src/lib/chat-cleanup.ts

/**
 * @fileOverview Este arquivo não contém mais a lógica de limpeza.
 * A limpeza de mensagens de chat agora é executada por um Cloudflare Worker.
 */

// Estas funções não fazem nada no site estático.
// Elas existem apenas para evitar erros caso ainda sejam importadas em algum lugar.

export async function cleanupTemporaryMessages(hoursOld: number = 24): Promise<number> {
  console.log('Aviso: cleanupTemporaryMessages não tem efeito em um site estático.');
  return 0;
}

export async function cleanupEmptyChats(): Promise<number> {
  console.log('Aviso: cleanupEmptyChats não tem efeito em um site estático.');
  return 0;
}

export async function manualDeleteAllSecretChats(): Promise<{
  messagesDeleted: number;
  chatsDeleted: number;
}> {
  console.log('Aviso: manualDeleteAllSecretChats não tem efeito em um site estático.');
  return { messagesDeleted: 0, chatsDeleted: 0 };
}

export async function performFullCleanup(hoursOld: number = 24): Promise<{
  messagesDeleted: number;
  chatsDeleted: number;
}> {
  console.log('Aviso: performFullCleanup não tem efeito em um site estático.');
  return { messagesDeleted: 0, chatsDeleted: 0 };
}