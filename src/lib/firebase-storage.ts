"use client";

// Importes REAL do Cloudflare Workers
// Substituímos os imports do Firebase por uma URL de API que simula a interação
// com um Cloudflare Worker.

const API_ENDPOINT = 'https://your-cloudflare-worker.your-account.workers.dev';

export interface CloudflareFile {
  name: string;
  fullPath: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
  metadata?: {
    visibility?: 'public' | 'subscribers';
    customMetadata?: Record<string, string>;
  };
}

// As funções agora interagem com a API do Cloudflare Workers
export async function listCloudflareFiles(folderPath: string = 'general-uploads'): Promise<CloudflareFile[]> {
    try {
        const response = await fetch(`${API_ENDPOINT}/files?folder=${folderPath}`);
        if (!response.ok) {
            throw new Error('Falha ao buscar arquivos do Cloudflare Workers');
        }
        return await response.json();
    } catch (error) {
        console.error("Erro ao buscar arquivos:", error);
        return [];
    }
}

export async function getCloudflareDownloadURL(filePath: string): Promise<string | null> {
    // A URL de download geralmente é o próprio endpoint do arquivo no R2
    return `${API_ENDPOINT}/files/${filePath}`;
}

export async function getCloudflareMetadata(filePath: string): Promise<any> {
    try {
        const response = await fetch(`${API_ENDPOINT}/metadata?path=${filePath}`);
        if (!response.ok) {
            throw new Error('Falha ao obter metadados');
        }
        return await response.json();
    } catch (error) {
        console.error("Erro ao buscar metadados:", error);
        return null;
    }
}

export async function fetchCloudflareFiles(folderPath: string = 'general-uploads'): Promise<CloudflareFile[]> {
  try {
      const files = await listCloudflareFiles(folderPath);
      // Você pode adicionar mais lógica aqui para enriquecer os dados, se necessário
      return files;
  } catch (error) {
      console.error("Erro ao buscar arquivos:", error);
      return [];
  }
}

export function isImageFile(contentType: string): boolean {
  return contentType.startsWith('image/');
}

export function isVideoFile(contentType: string): boolean {
  return contentType.startsWith('video/');
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}