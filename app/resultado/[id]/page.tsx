'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Força renderização dinâmica
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Loader2, ArrowLeft, Trophy, TrendingUp, Share2 } from 'lucide-react';

interface Card {
  id: string;
  title: string;
  winner: string;
  stat: string;
  statLabel: string;
  confidence: number;
}

interface ResultData {
  id: string;
  relationType: string;
  person1Name: string;
  person2Name: string;
  cards: Card[];
  createdAt: string;
}

export default function ResultadoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<ResultData | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/generate?id=${params.id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Erro ao carregar resultado');
        }

        setResultData(data.data);
      } catch (err) {
        console.error('Erro ao carregar resultado:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar resultado');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Carregando resultados...</p>
        </div>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ops!</h2>
          <p className="text-gray-600 mb-6">
            {error || 'Não foi possível carregar o resultado.'}
          </p>
          <Link
            href="/criar"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
          >
            Criar nova análise
          </Link>
        </div>
      </div>
    );
  }

  const cardEmojis: Record<string, string> = {
    brigas: '⚔️',
    ciume: '😠',
    demora: '⏰',
    orgulho: '👑',
    vacuo: '👻'
  };

  const cardColors: Record<string, string> = {
    brigas: 'from-red-400 to-orange-400',
    ciume: 'from-purple-400 to-pink-400',
    demora: 'from-blue-400 to-cyan-400',
    orgulho: 'from-yellow-400 to-orange-400',
    vacuo: 'from-gray-400 to-slate-400'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Início</span>
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-transparent bg-clip-text">
            Nosso Timeline
          </h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header com nomes */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg">
              <span className="text-2xl font-bold text-pink-500">{resultData.person1Name}</span>
              <span className="text-2xl">💕</span>
              <span className="text-2xl font-bold text-blue-500">{resultData.person2Name}</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900">
              Análise da Conversa
            </h2>
            <p className="text-lg text-gray-600">
              {resultData.relationType === 'casal' ? 'Relacionamento' : 'Amizade'}
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resultData.cards.map((card, index) => (
              <div
                key={card.id}
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <div className={`bg-gradient-to-r ${cardColors[card.id] || 'from-gray-400 to-gray-500'} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-4xl">{cardEmojis[card.id] || '🎯'}</span>
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-sm font-semibold">{card.confidence}% certo</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{card.title}</h3>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-semibold text-gray-600">Vencedor</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-4">
                    <p className="text-2xl font-bold text-gray-900 text-center mb-1">
                      {card.winner}
                    </p>
                    <p className="text-center text-gray-600 text-sm">
                      levou essa! 🏆
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-gray-700">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <span className="font-semibold text-lg">{card.stat}</span>
                    <span className="text-sm text-gray-500">{card.statLabel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA para compartilhar */}
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl p-8 text-white text-center shadow-xl">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Share2 className="w-6 h-6" />
              <h3 className="text-2xl font-bold">Gostou do resultado?</h3>
            </div>
            <p className="text-lg opacity-90 mb-6">
              Compartilhe com seus amigos e descubra os segredos das conversas deles!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  const text = `Analisei minha conversa no Nosso Timeline! 💕\n\nResultados:\n${resultData.cards.map(c => `${cardEmojis[c.id]} ${c.title}: ${c.winner} (${c.stat} ${c.statLabel})`).join('\n')}`;
                  const url = window.location.href;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n\n' + url)}`, '_blank');
                }}
                className="bg-white text-purple-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Compartilhar no WhatsApp
              </button>
              <Link
                href="/criar"
                className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-semibold hover:bg-white/30 transition-all"
              >
                Criar nova análise
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
