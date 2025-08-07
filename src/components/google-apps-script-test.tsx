'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { registerWithFaceID, loginWithFaceID, checkUserPaymentStatus } from '@/ai/flows/google-apps-script-face-auth-flow';

export default function GoogleAppsScriptTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Estados para cadastro
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  
  // Estados para login
  const [loginEmail, setLoginEmail] = useState('');
  
  const handleRegisterTest = async () => {
    if (!nome || !email || !telefone) {
      setResult({ success: false, message: 'Preencha todos os campos' });
      return;
    }
    
    setLoading(true);
    try {
      const testData = {
        nome,
        email,
        telefone,
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/test' // Imagem de teste
      };
      
      const response = await registerWithFaceID(testData);
      setResult(response);
    } catch (error) {
      setResult({ success: false, message: `Erro: ${error}` });
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoginTest = async () => {
    setLoading(true);
    try {
      const testData = {
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/test', // Imagem de teste
        email: loginEmail || undefined
      };
      
      const response = await loginWithFaceID(testData);
      setResult(response);
    } catch (error) {
      setResult({ success: false, message: `Erro: ${error}` });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePaymentStatusTest = async () => {
    if (!loginEmail) {
      setResult({ success: false, message: 'Preencha o email' });
      return;
    }
    
    setLoading(true);
    try {
      const response = await checkUserPaymentStatus(loginEmail);
      setResult(response);
    } catch (error) {
      setResult({ success: false, message: `Erro: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Teste Google Apps Script</h1>
      
      {/* Teste de Cadastro */}
      <Card>
        <CardHeader>
          <CardTitle>Teste de Cadastro</CardTitle>
          <CardDescription>Testar registro de usuário na planilha</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite o email"
            />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="Digite o telefone"
            />
          </div>
          <Button onClick={handleRegisterTest} disabled={loading}>
            {loading ? 'Testando...' : 'Testar Cadastro'}
          </Button>
        </CardContent>
      </Card>
      
      {/* Teste de Login */}
      <Card>
        <CardHeader>
          <CardTitle>Teste de Login</CardTitle>
          <CardDescription>Testar autenticação via Face ID</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="loginEmail">Email (opcional)</Label>
            <Input
              id="loginEmail"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Digite o email"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleLoginTest} disabled={loading}>
              {loading ? 'Testando...' : 'Testar Login'}
            </Button>
            <Button onClick={handlePaymentStatusTest} disabled={loading || !loginEmail}>
              {loading ? 'Testando...' : 'Verificar Pagamento'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Resultado */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado do Teste</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant={result.success ? "default" : "destructive"}>
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Status:</strong> {result.success ? 'Sucesso' : 'Erro'}</p>
                  <p><strong>Mensagem:</strong> {result.message}</p>
                  {result.isVip !== undefined && (
                    <p><strong>É VIP:</strong> {result.isVip ? 'Sim' : 'Não'}</p>
                  )}
                  {result.redirectUrl && (
                    <p><strong>Redirect URL:</strong> {result.redirectUrl}</p>
                  )}
                  {result.userEmail && (
                    <p><strong>Email do Usuário:</strong> {result.userEmail}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
            <details className="mt-4">
              <summary className="cursor-pointer font-medium">Resposta Completa (JSON)</summary>
              <pre className="mt-2 p-4 bg-muted rounded text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
