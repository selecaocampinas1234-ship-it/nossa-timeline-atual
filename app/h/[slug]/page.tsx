'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Força renderização dinâmica
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { 
  Share2, 
  Heart, 
  Sparkles, 
  Home as HomeIcon,
  Loader2,
  Lock,
  MessageCircle,
  Clock,
  Twitter,
  TrendingUp,
  EyeOff,
  Eye,
  Ban,
  Instagram,
  Download,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import PaymentModal from '@/components/PaymentModal';

export default function PublicStoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hiddenMoments, setHiddenMoments] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (slug) {
      loadStory();
      // Carregar momentos ocultados do localStorage
      const saved = localStorage.getItem(`hidden_moments_${slug}`);
      if (saved) {
        setHiddenMoments(JSON.parse(saved));
      }
    }
  }, [slug]);

  const loadStory = async () => {
    try {
      const response = await fetch(`/api/stories/${slug}`);
      const data = await response.json();
      
      if (data.success) {
        setStory(data.story);
        
        // Verificar se expirou
        if (data.story.expires_at) {
          const now = new Date().getTime();
          const expiresAt = new Date(data.story.expires_at).getTime();
          setIsExpired(now > expiresAt);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar história:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHideMoment = (index: number) => {
    const newHidden = hiddenMoments.includes(index)
      ? hiddenMoments.filter(i => i !== index)
      : [...hiddenMoments, index];
    
    setHiddenMoments(newHidden);
    localStorage.setItem(`hidden_moments_${slug}`, JSON.stringify(newHidden));
  };

  const shareCardToInstagram = async (momentIndex: number) => {
    try {
      const element = document.getElementById(`moment-card-${momentIndex}`);
      if (!element) return;

      // Gerar imagem do card
      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      // Converter para blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `momento-${momentIndex}.png`, { type: 'image/png' });

      // Tentar usar Web Share API (funciona em mobile)
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Momento ${momentIndex + 1}`,
          text: 'Confira esse momento especial!',
        });
      } else {
        // Fallback: fazer download da imagem
        const link = document.createElement('a');
        link.download = `momento-${momentIndex + 1}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error('Erro ao compartilhar card:', error);
      alert('Não foi possível compartilhar. A imagem foi salva no seu dispositivo.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-purple-600" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">História não encontrada</h1>
          <Link href="/" className="text-purple-600 hover:underline">Criar minha história</Link>
        </div>
      </div>
    );
  }

  // Se expirou, mostrar mensagem
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-md">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">História Expirada</h1>
          <p className="text-gray-600 mb-6">
            Esta história ficou disponível por 48 horas e agora foi arquivada para proteger a privacidade dos participantes.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
          >
            <HomeIcon className="w-5 h-5" />
            Criar Minha História
          </Link>
        </div>
      </div>
    );
  }

  const displayedMoments = story.is_premium ? (story.timeline || story.moments || []) : (story.timeline || story.moments || []).slice(0, 4);

  const handleShare = async (platform: 'whatsapp' | 'twitter') => {
    const url = window.location.href;
    const text = `Veja a história de ${story.person1_name} e ${story.person2_name}! 💕`;

    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    };

    window.open(shareUrls[platform], '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          previewId={story.preview_id || ''}
          onSuccess={(newSlug) => router.push(`/pagamento/${newSlug}`)}
        />
      )}
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <HomeIcon className="w-5 h-5" />
            <span className="font-medium">Nosso Timeline</span>
          </Link>
          
          <div className="flex items-center gap-3">
            {/* Contador de expiração */}
            {story.is_premium && timeRemaining && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                <Clock className="w-4 h-4" />
                Expira em {timeRemaining}
              </div>
            )}
            
            <button
              onClick={() => handleShare('whatsapp')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Compartilhar"
            >
              <Share2 className="w-5 h-5 text-purple-600" />
            </button>
            
            {!story.is_premium && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-semibold hover:shadow-lg transition-all text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Desbloquear Premium
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-3xl p-10 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-300 rounded-full blur-3xl opacity-20 -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-300 rounded-full blur-3xl opacity-20 -ml-32 -mb-32"></div>
            
            <div className="relative text-center">
              <div className="mb-6">
                <span className="inline-block px-5 py-2 bg-white/80 backdrop-blur-sm text-purple-700 rounded-full text-sm font-bold shadow-lg">
                  {story.relationship_type === 'casal' ? '💕 História de Amor' : '🤝 História de Amizade'}
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-8 tracking-tight">
                {story.person1_name} <span className="text-purple-600">{story.relationship_type === 'casal' ? '&' : 'e'}</span> {story.person2_name}
              </h1>

              <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg">
                  <span className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {story.total_messages.toLocaleString()}
                  </span>
                  <p className="text-sm text-gray-700 font-semibold mt-1">mensagens trocadas</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg">
                  <span className="text-4xl font-black bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                    {story.cards?.length || 0}
                  </span>
                  <p className="text-sm text-gray-700 font-semibold mt-1">análises</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg">
                  <span className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {displayedMoments.length}
                  </span>
                  <p className="text-sm text-gray-700 font-semibold mt-1">momentos especiais</p>
                </div>
              </div>

              {story.is_premium && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white px-6 py-3 rounded-full font-black text-sm shadow-xl">
                  <Sparkles size={18} className="animate-pulse" />
                  PREMIUM ATIVO
                </div>
              )}
            </div>
          </div>

          {/* Cards Section - Modo Disputa */}
          {story.cards && story.cards.length > 0 && (
            <div className="bg-white rounded-3xl p-10 shadow-2xl border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-black text-gray-900">Modo Disputa</h2>
                {story.is_premium && (
                  <span className="ml-auto text-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-1.5 shadow-md">
                    <Sparkles className="w-4 h-4" />
                    Premium
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {story.cards.map((card: any, index: number) => (
                  <div 
                    key={index}
                    className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-7 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-purple-100 hover:border-purple-300 group"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-4xl">{card.icon}</span>
                        <h3 className="text-xl font-black text-gray-900">{card.title}</h3>
                      </div>
                      <p className="text-gray-700 leading-relaxed font-medium">{card.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Section */}
          <div className="bg-white rounded-3xl p-10 shadow-2xl relative border border-gray-100">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900">
                {story.is_premium ? 'Linha do Tempo Completa' : 'Prévia da Linha do Tempo'}
              </h2>
            </div>
            
            <div className="space-y-6">
              {displayedMoments.map((moment: any, index: number) => {
                const isHidden = hiddenMoments.includes(index);
                
                return (
                  <div
                    key={index}
                    className="relative pl-8 pb-8 border-l-2 border-gray-200 last:border-l-0 last:pb-0 group hover:border-purple-300 transition-colors"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 group-hover:scale-125 transition-transform shadow-xl flex items-center justify-center">
                      <span className="text-base">{moment.emoji}</span>
                    </div>

                    {/* Content */}
                    <div 
                      id={`moment-card-${index}`}
                      className={`bg-white rounded-2xl p-7 shadow-lg hover:shadow-2xl transition-all border border-gray-200 ${isHidden ? 'blur-md' : ''}`}
                    >
                      {/* Header com Calendário */}
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="text-2xl">{moment.emoji}</span>
                            {moment.title}
                          </h3>
                          {moment.date && (
                            <p className="text-sm text-gray-600 font-medium">{moment.date}</p>
                          )}
                        </div>
                        {moment.category && (
                          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                            {moment.category}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 leading-relaxed mb-6 font-medium">
                        {moment.description}
                      </p>

                      {/* Messages (WhatsApp style) */}
                      {moment.snippet && (
                        <div className="space-y-3 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl">
                          {moment.snippet.split('\n').map((line: string, idx: number) => {
                            if (!line.trim()) return null;
                            
                            // Detectar quem está falando
                            const isPerson1 = line.includes(story.person1_name);
                            const isPerson2 = line.includes(story.person2_name);
                            
                            // Extrair nome e mensagem
                            const senderName = line.split(':')[0];
                            const message = line.replace(/^[^:]+:\s*/, '');
                            
                            if (isPerson1 || isPerson2) {
                              return (
                                <div
                                  key={idx}
                                  className={`flex flex-col ${isPerson1 ? 'items-start' : 'items-end'}`}
                                >
                                  <span className="text-xs font-bold text-gray-600 mb-1 px-2">
                                    {senderName}
                                  </span>
                                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                                    isPerson1 
                                      ? 'bg-white text-gray-800 rounded-tl-sm' 
                                      : 'bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-tr-sm'
                                  }`}>
                                    <p className="text-sm font-medium leading-relaxed">{message}</p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}

                      {/* Action Buttons - Only for premium */}
                      {story.is_premium && !isHidden && (
                        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                          <button
                            onClick={() => toggleHideMoment(index)}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
                          >
                            <EyeOff className="w-4 h-4" />
                            Ocultar momento
                          </button>
                          <button
                            onClick={() => shareCardToInstagram(index)}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:shadow-lg transform hover:scale-105 transition-all"
                          >
                            <Instagram className="w-4 h-4" />
                            Compartilhar no Instagram
                          </button>
                        </div>
                      )}
                      {story.is_premium && isHidden && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => toggleHideMoment(index)}
                            className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition-colors font-bold"
                          >
                            <Eye className="w-4 h-4" />
                            Mostrar momento
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Premium Overlay */}
            {!story.is_premium && (
              <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-white via-white to-transparent flex items-end justify-center pb-8">
                <div className="text-center">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto border-2 border-purple-200">
                    <Lock className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Desbloqueie a História Completa
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Você está vendo apenas 4 momentos. Libere todos os momentos especiais por apenas <span className="font-bold text-purple-600">R$ 9,90</span>!
                    </p>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all"
                    >
                      <Sparkles className="w-5 h-5" />
                      Desbloquear por R$ 9,90
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Share Section */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-10 shadow-xl text-center border border-gray-200">
            <Share2 className="w-12 h-12 mx-auto mb-4 text-purple-600" />
            <h3 className="text-2xl font-black text-gray-900 mb-6">
              Compartilhe essa história
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex items-center gap-2 bg-green-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-600 hover:shadow-xl transform hover:scale-105 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="flex items-center gap-2 bg-blue-400 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-500 hover:shadow-xl transform hover:scale-105 transition-all"
              >
                <Twitter className="w-5 h-5" />
                Twitter
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copiado!');
                }}
                className="flex items-center gap-2 bg-gray-700 text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 hover:shadow-xl transform hover:scale-105 transition-all"
              >
                <Share2 className="w-5 h-5" />
                Copiar link
              </button>
            </div>
          </div>

          {/* CTA Final */}
          <div className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-3xl p-12 text-center shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl opacity-10 -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl opacity-10 -ml-32 -mb-32"></div>
            
            <div className="relative">
              <Heart className="w-16 h-16 mx-auto mb-6 animate-pulse" />
              <h3 className="text-4xl font-black mb-4">
                Crie sua própria história
              </h3>
              <p className="text-xl mb-8 opacity-95 font-medium max-w-2xl mx-auto">
                Transforme suas conversas em uma linda linha do tempo repleta de momentos especiais!
              </p>
              <Link
                href="/criar"
                className="inline-flex items-center gap-3 bg-white text-purple-600 px-10 py-5 rounded-2xl text-xl font-black hover:shadow-2xl transform hover:scale-110 transition-all"
              >
                <Sparkles className="w-6 h-6" />
                Criar minha história
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 mb-2">
            © 2024 Nosso Timeline. Feito com 💕 para eternizar suas memórias.
          </p>
          <Link 
            href="/criar"
            className="text-purple-400 hover:text-purple-300 transition-colors font-semibold"
          >
            Crie sua própria história →
          </Link>
        </div>
      </footer>
    </div>
  );
}
