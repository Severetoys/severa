'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Image as ImageIcon, Video, FileText, Crown } from 'lucide-react';
import { ProtectedGallery } from "@/components/protected-gallery";
import { ContentProtector } from "@/components/content-protector";
import { useContentAccess } from "@/hooks/use-content-access";
import { Badge } from "@/components/ui/badge";

export default function ExclusivePage() {
  const { canAccessSubscriberContent, isSubscriptionActive, subscriptionPlan, subscriptionExpiry } = useContentAccess();

  return (
    <main className="flex flex-1 w-full flex-col items-center p-4 bg-background">
      <Card className="w-full max-w-6xl animate-in fade-in-0 zoom-in-95 duration-500 shadow-neon-red-strong border-primary/50 bg-card/90 backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-primary text-shadow-neon-red-light flex items-center justify-center gap-3">
            <Crown className="text-amber-500" /> Conteúdo Exclusivo
          </CardTitle>
          <CardDescription>
            Área exclusiva para assinantes com conteúdo premium
          </CardDescription>
          
          {canAccessSubscriberContent && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge className="bg-green-600 hover:bg-green-700">
                <Shield className="h-3 w-3 mr-1" />
                Acesso Liberado
              </Badge>
              {subscriptionPlan && (
                <Badge variant="outline">
                  Plano: {subscriptionPlan}
                </Badge>
              )}
              {subscriptionExpiry && (
                <Badge variant="secondary" className="text-xs">
                  Expira: {subscriptionExpiry.toLocaleDateString('pt-BR')}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <ContentProtector visibility="subscribers">
            <Tabs defaultValue="fotos" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-background/50 border border-primary/20">
                <TabsTrigger value="fotos" className="data-[state=active]:bg-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon-red-light">
                  <ImageIcon className="h-4 w-4 mr-2"/>Fotos Exclusivas
                </TabsTrigger>
                <TabsTrigger value="videos" className="data-[state=active]:bg-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon-red-light">
                  <Video className="h-4 w-4 mr-2"/>Vídeos Exclusivos
                </TabsTrigger>
                <TabsTrigger value="todos" className="data-[state=active]:bg-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon-red-light">
                  <FileText className="h-4 w-4 mr-2"/>Todo Conteúdo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="fotos" className="pt-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-primary">Fotos Exclusivas para Assinantes</h3>
                    <p className="text-sm text-muted-foreground">
                      Conteúdo premium disponível apenas para assinantes ativos
                    </p>
                  </div>
                  <ProtectedGallery 
                    folderPath="general-uploads" 
                    mediaType="images" 
                    showMetadata={true}
                  />
                </div>
              </TabsContent>

              <TabsContent value="videos" className="pt-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-primary">Vídeos Exclusivos para Assinantes</h3>
                    <p className="text-sm text-muted-foreground">
                      Conteúdo premium disponível apenas para assinantes ativos
                    </p>
                  </div>
                  <ProtectedGallery 
                    folderPath="general-uploads" 
                    mediaType="videos" 
                    showMetadata={true}
                  />
                </div>
              </TabsContent>

              <TabsContent value="todos" className="pt-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-primary">Todo Conteúdo Exclusivo</h3>
                    <p className="text-sm text-muted-foreground">
                      Todos os arquivos enviados com controle de acesso
                    </p>
                  </div>
                  <ProtectedGallery 
                    folderPath="general-uploads" 
                    mediaType="all" 
                    showMetadata={true}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </ContentProtector>
        </CardContent>
      </Card>
    </main>
  );
}
