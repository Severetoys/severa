
'use server';
/**
 * @fileOverview Server-side actions for managing third-party integrations.
 * These functions simulate connecting/disconnecting by saving state to the database.
 */

import { adminApp } from '@/lib/firebase-admin';
import { getDatabase } from 'firebase-admin/database';

export type Integration = "twitter" | "instagram" | "facebook" | "paypal" | "mercadopago";

// Sanitize service name for safe logging
const sanitizeServiceName = (service: Integration): string => {
  // Ensure only alphanumeric characters and allowed values
  const allowedServices = ["twitter", "instagram", "facebook", "paypal", "mercadopago"];
  return allowedServices.includes(service) ? service : "unknown";
};

const db = adminApp ? getDatabase(adminApp) : null;
const integrationsRef = db ? db.ref('admin/integrations') : null;

/**
 * Placeholder function to connect a service.
 * In a real implementation, this would handle the OAuth flow.
 * For now, it just sets a "connected" flag in the database.
 * @param service The service to connect to.
 * @returns A promise that resolves with a success status.
 */
export async function connectService(service: Integration): Promise<{ success: boolean; message: string }> {
  if (!integrationsRef) {
    console.error("Admin SDK não disponível - não é possível conectar serviço");
    return { success: false, message: "Configuração do sistema não disponível." };
  }

  try {
    await integrationsRef.child(service).set(true);
    console.log(`Service marked as connected:`, sanitizeServiceName(service));
    return { success: true, message: `${service} conectado com sucesso (simulado).` };
  } catch (error: any) {
    console.error(`Error connecting service:`, sanitizeServiceName(service), error);
    return { success: false, message: `Falha ao conectar ${service}.` };
  }
}

/**
 * Placeholder function to disconnect a service.
 * @param service The service to disconnect from.
 * @returns A promise that resolves with a success status.
 */
export async function disconnectService(service: Integration): Promise<{ success: boolean; message: string }> {
  if (!integrationsRef) {
    console.error("Admin SDK não disponível - não é possível desconectar serviço");
    return { success: false, message: "Configuração do sistema não disponível." };
  }

  try {
    await integrationsRef.child(service).set(false);
    console.log(`Service marked as disconnected:`, sanitizeServiceName(service));
    return { success: true, message: `${service} desconectado com sucesso.` };
  } catch (error: any) {
     console.error(`Error disconnecting service:`, sanitizeServiceName(service), error);
    return { success: false, message: `Falha ao desconectar ${service}.` };
  }
}

/**
 * Retrieves the connection status for a specific service.
 * @param service The service to check.
 * @returns A promise that resolves with the connection status (boolean).
 */
export async function getIntegrationStatus(service: Integration): Promise<boolean> {
    if (!integrationsRef) {
        console.error("Admin SDK não disponível - não é possível verificar status de integração");
        return false;
    }

    try {
        const snapshot = await integrationsRef.child(service).once('value');
        return snapshot.val() === true;
    } catch (error: any) {
        console.error(`Error getting status for service:`, sanitizeServiceName(service), error);
        return false;
    }
}
