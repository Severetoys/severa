"use client";

import { useState, useEffect, useRef } from 'react';
import { UploadCloud, ClipboardCopy, Link as LinkIcon, Trash2, Loader2, Eye, Download, Send, Inbox, FileImage } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useToast } from "../../../hooks/use-toast";
import { getStorage, ref, listAll, deleteObject, getMetadata, getDownloadURL, uploadBytes } from "firebase/storage";
import { app as firebaseApp } from '../../../lib/firebase';
import { Progress } from '../../../components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { format } from 'date-fns';
import axios from 'axios';
import Image from 'next/image';
import { Badge } from "../../../components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "../../../components/ui/dialog";

interface UploadedFile {
    name: string;
    url: string;
    fullPath: string;
    size: number;
    createdAt: string;
    type: string;
}

export default function AdminUploadsPage() {
    const { toast } = useToast();
    const storage = getStorage(firebaseApp);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(true);

    const fetchUploadedFiles = async () => {
        setIsLoadingFiles(true);
        try {
            const storageRef = ref(storage, 'italosantos.com/general-uploads/');
            const result = await listAll(storageRef);
            const filesData = await Promise.all(
                result.items.map(async (itemRef) => {
                    const url = await getDownloadURL(itemRef);
                    const metadata = await getMetadata(itemRef);
                    return {
                        name: itemRef.name,
                        url,
                        fullPath: itemRef.fullPath,
                        size: metadata.size,
                        createdAt: metadata.timeCreated,
                        type: metadata.contentType || 'unknown'
                    };
                })
            );
            filesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setUploadedFiles(filesData);
        } catch (error) {
            console.error("Erro ao buscar arquivos:", error);
            toast({ variant: "destructive", title: "Falha ao carregar arquivos" });
        } finally {
            setIsLoadingFiles(false);
        }
    };

    useEffect(() => {
        fetchUploadedFiles();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    // Upload via API (servidor)
    const handleUploadViaAPI = async () => {
        if (!file) {
            toast({ variant: "destructive", title: "Nenhum arquivo selecionado" });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                },
            });

            toast({
                title: "Upload via API Concluído!",
                description: "Seu arquivo foi enviado através do servidor.",
            });
            await fetchUploadedFiles();

        } catch (error: any) {
            console.error("Erro no upload via API:", error);
            const errorMessage = error.response?.data?.error || "Não foi possível enviar o arquivo.";
            toast({ variant: "destructive", title: "Erro no Upload", description: errorMessage });
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            setFile(null);
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Upload direto para Firebase Storage (client-side)
    const handleDirectFirebaseUpload = async () => {
        if (!file) {
            toast({ variant: "destructive", title: "Nenhum arquivo selecionado" });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const fileName = `italosantos.com/general-uploads/${Date.now()}_${sanitizedFileName}`;
            const storageRef = ref(storage, fileName);
            
            // Simular progresso para upload direto
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 100);

            await uploadBytes(storageRef, file);
            setUploadProgress(100);
            clearInterval(progressInterval);

            toast({
                title: "Upload Direto Concluído!",
                description: "Arquivo enviado diretamente para o Firebase Storage.",
            });
            
            await fetchUploadedFiles();

        } catch (error: any) {
            console.error("Erro no upload direto:", error);
            toast({ 
                variant: "destructive", 
                title: "Erro no Upload Direto", 
                description: "Não foi possível enviar o arquivo diretamente." 
            });
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            setFile(null);
            setIsUploading(false);
            setUploadProgress(0);
        }
    };
    
    const handleImportFromLink = async () => {
        if(!linkUrl || !URL.canParse(linkUrl)) {
            toast({ variant: "destructive", title: "URL Inválida", description: "Por favor, insira um link válido." });
            return;
        }
        
        setIsImporting(true);
        toast({ title: "Importando mídia...", description: "Isso pode levar alguns segundos."});
        try {
            const response = await fetch('/api/import-from-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: linkUrl }),
            });
            
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Falha ao importar o arquivo.');
            }
            
            toast({ title: "Importação Concluída!", description: `Arquivo salvo como ${result.fileName}`});
            setLinkUrl('');
            await fetchUploadedFiles();

        } catch (error: any) {
             toast({ variant: "destructive", title: "Erro na Importação", description: error.message });
        } finally {
            setIsImporting(false);
        }
    }

    const handleDelete = async (filePath: string) => {
        if (!confirm("Tem certeza que deseja excluir este arquivo? A ação é irreversível.")) return;
        try {
            const fileRef = ref(storage, filePath);
            await deleteObject(fileRef);
            toast({ title: "Arquivo Excluído!" });
            await fetchUploadedFiles();
        } catch (error) {
             console.error("Erro ao excluir: ", error);
             toast({ variant: "destructive", title: "Erro ao Excluir" });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Link copiado!" });
    };

    const isImageFile = (type: string) => {
        return type.startsWith('image/');
    };

    const formatFileSize = (bytes: number) => {
        return (bytes / 1024 / 1024).toFixed(2);
    };

    const getFileTypeColor = (type: string) => {
        if (type.startsWith('image/')) return 'bg-green-100 text-green-800';
        if (type.startsWith('video/')) return 'bg-blue-100 text-blue-800';
        if (type.startsWith('audio/')) return 'bg-purple-100 text-purple-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UploadCloud className="h-6 w-6" />
                        Gerenciador de Mídias - Firebase Storage
                    </CardTitle>
                    <CardDescription>
                       Envie arquivos via servidor (API) ou diretamente ao Firebase Storage. Importe através de links externos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="upload" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="upload" className="flex items-center gap-2">
                                <Send className="h-4 w-4" />
                                Enviar Arquivo
                            </TabsTrigger>
                            <TabsTrigger value="direct" className="flex items-center gap-2">
                                <UploadCloud className="h-4 w-4" />
                                Upload Direto
                            </TabsTrigger>
                            <TabsTrigger value="link" className="flex items-center gap-2">
                                <Inbox className="h-4 w-4" />
                                Importar Link
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="upload">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Upload via Servidor (API)</CardTitle>
                                    <CardDescription>
                                        Envio através do servidor backend com processamento de metadados
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="file-upload-api">Selecione um arquivo</Label>
                                        <Input 
                                            ref={fileInputRef} 
                                            id="file-upload-api" 
                                            type="file" 
                                            onChange={handleFileChange} 
                                            className="mt-1" 
                                            disabled={isUploading}
                                        />
                                    </div>
                                    {file && (
                                        <div className="p-3 bg-muted rounded-lg">
                                            <p className="text-sm font-medium">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(file.size)} MB • {file.type}
                                            </p>
                                        </div>
                                    )}
                                    {isUploading && (
                                        <div className="space-y-2">
                                            <Progress value={uploadProgress} className="w-full" />
                                            <p className="text-sm text-muted-foreground text-center">
                                                {uploadProgress}% concluído
                                            </p>
                                        </div>
                                    )}
                                    <Button onClick={handleUploadViaAPI} disabled={!file || isUploading} className="w-full">
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                Enviando via API...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4"/>
                                                Enviar via Servidor
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="direct">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Upload Direto ao Firebase</CardTitle>
                                    <CardDescription>
                                        Envio direto do navegador para o Firebase Storage (mais rápido)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="file-upload-direct">Selecione um arquivo</Label>
                                        <Input 
                                            id="file-upload-direct" 
                                            type="file" 
                                            onChange={handleFileChange} 
                                            className="mt-1" 
                                            disabled={isUploading}
                                        />
                                    </div>
                                    {file && (
                                        <div className="p-3 bg-muted rounded-lg">
                                            <p className="text-sm font-medium">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(file.size)} MB • {file.type}
                                            </p>
                                        </div>
                                    )}
                                    {isUploading && (
                                        <div className="space-y-2">
                                            <Progress value={uploadProgress} className="w-full" />
                                            <p className="text-sm text-muted-foreground text-center">
                                                {uploadProgress}% concluído
                                            </p>
                                        </div>
                                    )}
                                    <Button onClick={handleDirectFirebaseUpload} disabled={!file || isUploading} className="w-full">
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                Upload Direto...
                                            </>
                                        ) : (
                                            <>
                                                <UploadCloud className="mr-2 h-4 w-4"/>
                                                Upload Direto Firebase
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="link">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Importar de Link Externo</CardTitle>
                                    <CardDescription>
                                        Baixe e salve arquivos de URLs externas
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="link-url">URL da Mídia</Label>
                                        <Input 
                                            id="link-url" 
                                            type="url" 
                                            placeholder="https://exemplo.com/imagem.jpg" 
                                            value={linkUrl} 
                                            onChange={(e) => setLinkUrl(e.target.value)} 
                                            className="mt-1" 
                                            disabled={isImporting} 
                                        />
                                    </div>
                                    <Button onClick={handleImportFromLink} disabled={!linkUrl || isImporting} className="w-full">
                                        {isImporting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                Importando...
                                            </>
                                        ) : (
                                            <>
                                                <LinkIcon className="mr-2 h-4 w-4"/>
                                                Importar via Link
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileImage className="h-5 w-5" />
                        Arquivos no Firebase Storage
                    </CardTitle>
                    <CardDescription>
                        Lista de arquivos enviados para 'italosantos.com/general-uploads/'
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingFiles ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Preview</TableHead>
                                    <TableHead>Nome do Arquivo</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Tamanho</TableHead>
                                    <TableHead>Criado em</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {uploadedFiles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                            Nenhum arquivo encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    uploadedFiles.map((f) => (
                                        <TableRow key={f.fullPath}>
                                            <TableCell>
                                                {isImageFile(f.type) ? (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <button className="hover:opacity-80 transition-opacity">
                                                                <Image 
                                                                    src={f.url} 
                                                                    alt={f.name}
                                                                    width={50} 
                                                                    height={50} 
                                                                    className="rounded object-cover"
                                                                />
                                                            </button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-3xl">
                                                            <Image 
                                                                src={f.url} 
                                                                alt={f.name}
                                                                width={800} 
                                                                height={600} 
                                                                className="rounded object-contain w-full h-auto"
                                                            />
                                                        </DialogContent>
                                                    </Dialog>
                                                ) : (
                                                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                                        <FileImage className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="max-w-xs truncate" title={f.name}>
                                                    {f.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getFileTypeColor(f.type)}>
                                                    {f.type.split('/')[0]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatFileSize(f.size)} MB</TableCell>
                                            <TableCell>
                                                {format(new Date(f.createdAt), "dd/MM/yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-1 justify-end">
                                                    <Button 
                                                        variant="outline" 
                                                        size="icon" 
                                                        onClick={() => window.open(f.url, '_blank')}
                                                        title="Visualizar"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="icon" 
                                                        onClick={() => copyToClipboard(f.url)}
                                                        title="Copiar Link"
                                                    >
                                                        <ClipboardCopy className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="destructive" 
                                                        size="icon" 
                                                        onClick={() => handleDelete(f.fullPath)}
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
