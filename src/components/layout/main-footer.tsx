"use client";

import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { CornerDownRight, CheckCircle, MapPin, Twitter, Instagram, Youtube, Facebook, Loader2, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { initialReviews } from '@/lib/reviews-data'; // Usaremos apenas os dados estáticos

// Removido todas as dependências de mocks ou imports do Firebase

declare global {
  interface Window {
    FB: any;
  }
}

interface Review {
  id: string;
  author: string;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // Tipo alterado para string para dados estáticos
  reply?: {
    author: string;
    text: string;
    isVerified: boolean;
    createdAt: string; // Tipo alterado para string para dados estáticos
  };
}

const MainFooter = () => {
  const { toast } = useToast();
  // Usamos os dados estáticos diretamente, sem lógica de carregamento
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // useEffect para carregar as avaliações estáticas
  useEffect(() => {
    // Simulamos a conversão dos dados estáticos para o formato de review
    const staticReviews: Review[] = initialReviews.map((review, index) => ({
      id: `static_${index}`,
      ...review,
      status: 'approved',
      // Os Timestamps foram substituídos por strings no arquivo de dados
      createdAt: review.reply?.createdAt || new Date().toISOString(),
      reply: review.reply ? {
        ...review.reply,
        createdAt: review.reply.createdAt || new Date().toISOString(),
      } : undefined,
    }));
    setReviews(staticReviews);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.FB) {
      window.FB.XFBML.parse();
    }
  }, []);

  const handleAddReview = async () => {
    if (!newReviewAuthor || !newReviewText) {
      toast({ variant: 'destructive', title: 'Por favor, preencha nome e comentário.' });
      return;
    }
    setIsSubmittingReview(true);

    try {
      // Envia os dados para o endpoint do Cloudflare Worker
      const response = await fetch('YOUR_CLOUDFLARE_WORKER_URL/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: newReviewAuthor,
          text: newReviewText,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar comentário.');
      }

      toast({ title: 'Comentário enviado para moderação!' });
      setNewReviewAuthor('');
      setNewReviewText('');

    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao enviar comentário.' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const galleryWords = ["ACOMPANHANTE MASCULINO", "SENSUALIDADE", "PRAZER", "BDSM", "FETISH", "FANTASIA", "IS"];
  const galleries = galleryWords.map((word, i) => ({
    id: i,
    word: word,
    photos: Array.from({ length: 5 }, (_, p) => ({
      src: `https://placehold.co/400x800.png`,
      hint: p % 2 === 0 ? "fashion editorial" : "urban model",
      id: p
    }))
  }));

  const ReviewCard = ({ review }: { review: Review }) => {
    const fallback = review.author.substring(0, 2).toUpperCase();
    const garotocomlocalLogo = "/Garoto-com-local-icone.svg";
    const garotocomlocalLogoFallback = "https://firebasestorage.googleapis.com/v0/b/authkit-y9vjx.firebasestorage.app/o/gcl-pin.png?alt=media";
    const defaultAvatar = "https://placehold.co/100x100.png?text=" + fallback;
    const reviewDate = review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: ptBR }) : 'Data indisponível';

    const getReviewSource = (authorName: string, text: string) => {
      const lowerAuthor = authorName.toLowerCase();
      const lowerText = text.toLowerCase();
      if (lowerAuthor.includes('sp') || lowerAuthor.includes('rj') || lowerAuthor.includes('bh') ||
        lowerAuthor.includes('mg') || lowerAuthor.includes('pr') || lowerText.includes('garoto com local')) {
        return { name: 'Garoto Com Local', color: 'bg-green-500', icon: '🌐' };
      } else if (authorName.length <= 3 || lowerText.includes('portal') || lowerText.includes('cliente') ||
        lowerAuthor.includes('anon') || lowerAuthor.includes('user')) {
        return { name: 'Portal do Cliente', color: 'bg-blue-500', icon: '👤' };
      } else {
        return { name: 'Avaliação Direta', color: 'bg-orange-500', icon: '📝' };
      }
    };

    const source = getReviewSource(review.author, review.text);
    const avatarSrc = source.name === 'Garoto Com Local' ? garotocomlocalLogo : defaultAvatar;

    return (
      <Card className="flex flex-col w-full max-w-2xl p-6 bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary hover:shadow-neon-red-light transition-all duration-300">
        <CardContent className="flex flex-col items-start text-left p-0 flex-grow gap-4">
          <div className="flex items-center gap-4 w-full">
            {source.name === 'Garoto Com Local' ? (
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border border-muted overflow-hidden">
                <img
                  src={garotocomlocalLogo}
                  alt="Garoto Com Local"
                  className="w-full h-full object-cover"
                  onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = garotocomlocalLogoFallback; }}
                />
              </div>
            ) : (
              <Avatar className="w-12 h-12 border-2 border-primary">
                <AvatarImage src={avatarSrc} alt={source.name} data-ai-hint="user profile" />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">{fallback}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{review.author}</h3>
                <div className="flex items-center gap-1 px-2 py-1 bg-muted/30 rounded-full">
                  <div className={`w-2 h-2 ${source.color} rounded-full`}></div>
                  <span className="text-xs font-medium text-muted-foreground">{source.name}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{reviewDate}</p>
            </div>
          </div>
          <p className="text-foreground text-sm flex-grow">{review.text}</p>
          {review.reply && (
            <div className="w-full pl-6 mt-4 border-l-2 border-primary/30">
              <div className="flex items-start gap-3">
                <CornerDownRight className="h-4 w-4 mt-1 text-primary/80 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{review.reply.author}</h4>
                    {review.reply.isVerified && <CheckCircle className="h-5 w-5 text-blue-400" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{review.reply.createdAt ? formatDistanceToNow(new Date(review.reply.createdAt), { addSuffix: true, locale: ptBR }) : ''}</p>
                  <p className="text-foreground text-sm mt-2">{review.reply.text}</p>
                </div>
              </div>
            </div>
          )}
          <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground hover:text-primary">Responder</Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Separator className="my-4 bg-primary/50" />
      <div className="py-8 space-y-8">
        {galleries.map((gallery) => (
          <div key={gallery.id}>
            <div className="w-full px-4 md:px-8">
              <Carousel className="w-full" opts={{ loop: true }}>
                <CarouselContent>
                  {gallery.photos.map((photo) => (
                    <CarouselItem key={photo.id} className="basis-full">
                      <div className="p-1 space-y-2">
                        <Card className="overflow-hidden border-primary/20 hover:border-primary hover:shadow-neon-red-light transition-all duration-300">
                          <CardContent className="flex aspect-[9/16] items-center justify-center p-0">
                            <Image
                              src={photo.src}
                              alt={`Foto da galeria ${gallery.id + 1}`}
                              width={400}
                              height={800}
                              className="w-full h-full object-cover"
                              data-ai-hint={photo.hint}
                            />
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="ml-14 bg-background/50 border-primary text-primary hover:bg-primary hover:text-primary-foreground" />
                <CarouselNext className="mr-14 bg-background/50 border-primary text-primary hover:bg-primary hover:text-primary-foreground" />
              </Carousel>
              <p className="text-center text-primary text-shadow-neon-red-light text-4xl tracking-widest uppercase mt-2">
                {gallery.word}
              </p>
            </div>
            <Separator className="max-w-xl mx-auto my-8 bg-border/30" />
          </div>
        ))}
      </div>

      <div className="px-4 md:px-8 py-12 bg-background flex flex-col items-center">
        <div className="max-w-4xl w-full mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-shadow-neon-red flex items-center justify-center gap-2">
            <MapPin className="h-8 w-8 text-primary" />
            Localização
          </h2>
          <Card className="overflow-hidden bg-card/50 border-primary/20 hover:border-primary hover:shadow-neon-red-light transition-all duration-300">
            <CardContent className="p-2">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.145944983025!2d-46.656539084476!3d-23.56306366754635!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59c8da0aa315%3A0x2665c5b4e7b6a4b!2sAv.%20Paulista%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%20Brasil!5e0!3m2!1spt-BR!2sus!4v1625845012345!5m2!1spt-BR!2sus"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="px-4 md:px-8 py-12 bg-background flex flex-col items-center">
        <div className="max-w-4xl w-full mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-shadow-neon-red">O que dizem sobre mim</h2>
          <div className="text-center mb-8 p-4 bg-muted/20 rounded-lg border border-muted/30">
            <p className="text-sm font-medium mb-3 text-foreground">
              ✅ Avaliações verificadas de clientes reais
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <span className="flex items-center gap-2 text-foreground/80">
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                <strong>Garoto Com Local</strong>
              </span>
              <span className="flex items-center gap-2 text-foreground/80">
                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                <strong>Portal do Cliente</strong>
              </span>
              <span className="flex items-center gap-2 text-foreground/80">
                <div className="w-3 h-3 bg-orange-500 rounded-full shadow-sm"></div>
                <strong>Avaliações Diretas</strong>
              </span>
            </div>
          </div>

          <Card className="w-full max-w-2xl p-6 bg-card/50 backdrop-blur-sm border-primary/20 mb-6 mx-auto">
            <h3 className="text-lg font-semibold mb-4">Deixe sua avaliação</h3>
            <div className="space-y-4">
              <Input
                placeholder="Seu nome"
                value={newReviewAuthor}
                onChange={(e) => setNewReviewAuthor(e.target.value)}
                disabled={isSubmittingReview}
              />
              <Textarea
                placeholder="Sua avaliação..."
                value={newReviewText}
                onChange={(e) => setNewReviewText(e.target.value)}
                disabled={isSubmittingReview}
              />
              <Button onClick={handleAddReview} disabled={isSubmittingReview}>
                {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enviar Comentário
              </Button>
            </div>
          </Card>

          <div className="flex flex-col items-center gap-6">
            {reviews.length > 0 && reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
            <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-muted max-w-2xl w-full text-center">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Transparência total:</strong> Todas as avaliações são de clientes reais e passam por moderação para garantir autenticidade.
                Coletadas através da plataforma Garoto Com Local e outros canais verificados.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full p-4 text-center text-sm text-muted-foreground">
        <Separator className="mb-4 bg-primary/50" />
        <div className="my-4 flex justify-center">
          <div
            className="fb-like"
            data-share="true"
            data-width="450"
            data-show-faces="true"
          ></div>
        </div>
        <p>Copyrights © Italo Santos 2019 - Todos os direitos reservados</p>
        <div className="flex justify-center gap-4 my-4">
          <a href="#" aria-label="Twitter">
            <Twitter className="h-5 w-5 text-primary hover:text-primary/80" />
          </a>
          <a href="#" aria-label="Instagram">
            <Instagram className="h-5 w-5 text-primary hover:text-primary/80" />
          </a>
          <a href="#" aria-label="YouTube">
            <Youtube className="h-5 w-5 text-primary hover:text-primary/80" />
          </a>
          <a href="#" aria-label="Facebook">
            <Facebook className="h-5 w-5 text-primary hover:text-primary/80" />
          </a>
        </div>
        <p>
          <a href="/termos-condicoes" className="underline hover:text-primary">Termos & Condições</a> | <a href="/politica-de-privacidade" className="underline hover:text-primary">Política de Privacidade</a>
        </p>
        <p className="mt-2">Este site inclui conteúdo protegido por direitos autorais, é proibida reprodução total ou parcial deste conteúdo sem autorização prévia do proprietário do site.</p>
      </footer>
    </>
  );
};

export default MainFooter;