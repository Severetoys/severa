
// src/app/api/upload/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminApp } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Verificar se o Firebase Admin está disponível
    if (!adminApp) {
      return NextResponse.json({ 
        error: 'Configuração do servidor não disponível. Use o upload direto ao Firebase.',
        suggestion: 'Tente usar a aba "Upload Direto" que funciona diretamente com o Firebase Storage.'
      }, { status: 503 });
    }

    const { getStorage } = await import('firebase-admin/storage');
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const visibility = formData.get('visibility') as string || 'public';
    const isSubscriberOnly = formData.get('isSubscriberOnly') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }
    
    // Sanitize filename
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');

    const bucket = getStorage(adminApp).bucket('authkit-y9vjx.appspot.com');
    const fileName = `italosantos.com/general-uploads/${Date.now()}_${sanitizedFileName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.type,
        metadata: {
          visibility: visibility,
          isSubscriberOnly: isSubscriberOnly.toString(),
          uploadedBy: 'admin',
          uploadDate: new Date().toISOString()
        }
      },
    });

    await new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        console.error("Erro no stream de upload:", err);
        reject(err);
      });
      blobStream.on('finish', () => {
        resolve(true);
      });
      blobStream.end(fileBuffer);
    });

    // Make the file public
    await blob.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
    
    return NextResponse.json({ message: 'Upload bem-sucedido!', url: publicUrl }, { status: 200 });

  } catch (error: any) {
    console.error('[API UPLOAD] Erro:', error);
    return NextResponse.json({ 
      error: `Erro no upload via servidor: ${error.message}`,
      suggestion: 'Tente usar a aba "Upload Direto" que funciona diretamente com o Firebase Storage.'
    }, { status: 500 });
  }
}
