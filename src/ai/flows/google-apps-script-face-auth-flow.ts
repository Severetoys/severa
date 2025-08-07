'use server';

/**
 * @fileOverview Face Auth flow integrado com Google Apps Script
 * Gerencia autenticação via Face ID usando planilha do Google Sheets
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { registerUserWithAppsScript, verifyUserWithAppsScript, checkPaymentStatusAppsScript, type FaceIDUser } from '@/services/google-apps-script-service';

// Schema de entrada para cadastro
const RegisterFaceIDInputSchema = z.object({
  nome: z.string().describe("Nome do usuário"),
  email: z.string().email().describe("Email do usuário"),
  telefone: z.string().describe("Telefone do usuário"),
  image: z.string().describe("Imagem facial em base64"),
  video: z.string().optional().describe("Vídeo facial em base64"),
  firebaseUid: z.string().optional().describe("UID do Firebase")
});

// Schema de entrada para login
const LoginFaceIDInputSchema = z.object({
  image: z.string().describe("Imagem facial em base64 para autenticação"),
  email: z.string().email().optional().describe("Email opcional para verificação adicional")
});

// Schema de saída para ambas as operações
const FaceIDOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  isVip: z.boolean().optional().describe("Se o usuário tem acesso VIP"),
  redirectUrl: z.string().optional().describe("URL para redirecionamento"),
  userEmail: z.string().optional().describe("Email do usuário autenticado")
});

export type RegisterFaceIDInput = z.infer<typeof RegisterFaceIDInputSchema>;
export type LoginFaceIDInput = z.infer<typeof LoginFaceIDInputSchema>;
export type FaceIDOutput = z.infer<typeof FaceIDOutputSchema>;

/**
 * Fluxo para registrar usuário via Face ID com Google Apps Script
 */
const registerFaceIDFlow = ai.defineFlow(
  {
    name: 'registerFaceIDFlow',
    inputSchema: RegisterFaceIDInputSchema,
    outputSchema: FaceIDOutputSchema,
  },
  async (input): Promise<FaceIDOutput> => {
    try {
      console.log('[Face ID Register] Iniciando cadastro com Google Apps Script...');
      
      const userData: FaceIDUser = {
        nome: input.nome,
        email: input.email,
        telefone: input.telefone,
        image: input.image,
        video: input.video,
        firebaseUid: input.firebaseUid
      };

      const result = await registerUserWithAppsScript(userData);
      
      if (result.success) {
        console.log('[Face ID Register] Usuário cadastrado com sucesso');
        return {
          success: true,
          message: 'Cadastro realizado com sucesso! Agora você pode fazer login.',
          redirectUrl: '/auth/face?tab=signin'
        };
      } else {
        console.log('[Face ID Register] Falha no cadastro:', result.message);
        return {
          success: false,
          message: result.message || 'Erro ao cadastrar usuário.'
        };
      }
    } catch (error) {
      console.error('[Face ID Register] Erro:', error);
      return {
        success: false,
        message: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
);

/**
 * Fluxo para login via Face ID com Google Apps Script
 */
const loginFaceIDFlow = ai.defineFlow(
  {
    name: 'loginFaceIDFlow',
    inputSchema: LoginFaceIDInputSchema,
    outputSchema: FaceIDOutputSchema,
  },
  async (input): Promise<FaceIDOutput> => {
    try {
      console.log('[Face ID Login] Iniciando autenticação com Google Apps Script...');
      
      const result = await verifyUserWithAppsScript({
        image: input.image,
        email: input.email
      });
      
      if (result.success) {
        console.log('[Face ID Login] Usuário autenticado com sucesso');
        
        // Verificar se é VIP (tem pagamento)
        let isVip = false;
        let redirectUrl = '/dashboard';
        
        if (result.isVip) {
          isVip = true;
          redirectUrl = '/exclusivo';
        } else if (result.redirectUrl) {
          redirectUrl = result.redirectUrl;
        }
        
        return {
          success: true,
          message: 'Login realizado com sucesso!',
          isVip,
          redirectUrl,
          userEmail: input.email
        };
      } else {
        console.log('[Face ID Login] Falha na autenticação:', result.message);
        return {
          success: false,
          message: result.message || 'Usuário não reconhecido. Verifique se você está cadastrado.'
        };
      }
    } catch (error) {
      console.error('[Face ID Login] Erro:', error);
      return {
        success: false,
        message: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
);

/**
 * Função exportada para cadastro via Face ID
 */
export async function registerWithFaceID(input: RegisterFaceIDInput): Promise<FaceIDOutput> {
  return registerFaceIDFlow(input);
}

/**
 * Função exportada para login via Face ID
 */
export async function loginWithFaceID(input: LoginFaceIDInput): Promise<FaceIDOutput> {
  return loginFaceIDFlow(input);
}

/**
 * Função exportada para verificar status de pagamento
 */
export async function checkUserPaymentStatus(email: string): Promise<FaceIDOutput> {
  try {
    const result = await checkPaymentStatusAppsScript(email);
    
    return {
      success: result.success,
      message: result.message,
      isVip: result.success, // Se o pagamento foi identificado, é VIP
      redirectUrl: result.success ? '/exclusivo' : '/dashboard'
    };
  } catch (error) {
    return {
      success: false,
      message: `Erro ao verificar status de pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}
