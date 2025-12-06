import { NextRequest, NextResponse } from 'next/server';
import { parseWhatsAppConversation } from '@/lib/whatsapp-parser';
import { RelationType } from '@/types/story';

/**
 * API Route para gerar história a partir de conversa do WhatsApp
 * 
 * TODO: INTEGRAR COM OPENAI AQUI
 * Quando integrar:
 * 1. Adicionar variável de ambiente OPENAI_API_KEY
 * 2. Substituir generatePreviewStory por chamada real à OpenAI
 * 3. Processar imagens com Vision API (se necessário)
 * 
 * TODO: INTEGRAR COM SUPABASE
 * Quando integrar:
 * 1. Salvar story no banco com ID único
 * 2. Fazer upload das fotos no Storage
 * 3. Retornar slug permanente em vez de ID em memória
 */

// Armazenamento temporário em memória (substituir por banco depois)
// Usar global para persistir entre hot reloads em desenvolvimento
const globalForStories = global as typeof global & {
  storiesInMemory?: Map<string, any>;
};

const storiesInMemory = globalForStories.storiesInMemory ?? new Map<string, any>();
if (!globalForStories.storiesInMemory) {
  globalForStories.storiesInMemory = storiesInMemory;
}

export async function POST(request: NextRequest) {
  try {
    // Parse FormData
    const formData = await request.formData();
    
    const file = formData.get('file') as File | null;
    const relationType = formData.get('relationType') as RelationType;
    const person1Name = formData.get('person1Name') as string;
    const person2Name = formData.get('person2Name') as string;
    const person1Photo = formData.get('person1Photo') as File | null;
    const person2Photo = formData.get('person2Photo') as File | null;
    const isPremium = formData.get('isPremium') === 'true';
    const email = formData.get('email') as string | null;

    // Validações
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Arquivo não enviado' },
        { status: 400 }
      );
    }

    if (!person1Name || !person2Name) {
      return NextResponse.json(
        { success: false, error: 'Nomes das pessoas são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['casal', 'amizade', 'familia', 'outro'].includes(relationType)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de relação inválido' },
        { status: 400 }
      );
    }

    // Ler conteúdo do arquivo
    const fileContent = await file.text();

    if (fileContent.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito pequeno ou vazio' },
        { status: 400 }
      );
    }

    console.log('[API Generate] Processando conversa...');
    console.log('[API Generate] Relação:', relationType);
    console.log('[API Generate] Pessoas:', person1Name, person2Name);
    console.log('[API Generate] Tamanho do arquivo:', fileContent.length, 'caracteres');

    // TODO: PROCESSAR FOTOS E FAZER UPLOAD NO SUPABASE STORAGE
    // Por enquanto, apenas logando se foram enviadas
    let person1PhotoUrl: string | undefined;
    let person2PhotoUrl: string | undefined;

    if (person1Photo) {
      console.log('[API Generate] Foto 1 recebida:', person1Photo.name, person1Photo.size);
      // TODO: Upload para storage e obter URL
      // person1PhotoUrl = await uploadToStorage(person1Photo);
      person1PhotoUrl = undefined; // Mock por enquanto
    }

    if (person2Photo) {
      console.log('[API Generate] Foto 2 recebida:', person2Photo.name, person2Photo.size);
      // TODO: Upload para storage e obter URL
      // person2PhotoUrl = await uploadToStorage(person2Photo);
      person2PhotoUrl = undefined; // Mock por enquanto
    }


    // Parsear conversa do WhatsApp
    const parsedConversation = parseWhatsAppConversation(fileContent);
    const totalMessages = parsedConversation.messages.length;

    // Regex e Gemini: gerar apenas os 5 cards
    const messageSample = parsedConversation.messages
      .slice(0, 500)
      .map(m => `[${m.timestamp.toLocaleString()}] ${m.sender}: ${m.content}`)
      .join('\n');

    const { analyzeFiveCards, analyzeFullTimeline } = await import('@/lib/gemini-service');
    
    // Se premium, gerar 20-25 cards; senão, gerar 5 cards
    const cardsAnalysis = isPremium
      ? await analyzeFullTimeline(
          messageSample,
          person1Name,
          person2Name,
          relationType === 'casal' || relationType === 'amizade' ? relationType : 'casal'
        )
      : await analyzeFiveCards(
          messageSample,
          person1Name,
          person2Name,
          relationType === 'casal' || relationType === 'amizade' ? relationType : 'casal'
        );

    // Gerar ID único para esta preview
    const previewId = `preview-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Preparar dados da preview
    const previewData = {
      id: previewId,
      relationType,
      person1Name,
      person2Name,
      totalMessages,
      conversationText: fileContent,
      cards: cardsAnalysis.cards.map((card: any) => ({
        id: card.id,
        title: card.title,
        winner: card.winner,
        stat: card.stat,
        statLabel: card.statLabel || '',
        confidence: card.confidence || 0,
        icon: card.icon || '🎯'
      })),
      moments: cardsAnalysis.moments || [],
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // Expira em 10 min
    };
    
    // Salvar em memória (funciona local, não na Vercel)
    storiesInMemory.set(previewId, previewData);
    
    console.log('[API Generate] ✅ Preview criada:', previewId);
    console.log('[API Generate] Cards gerados:', previewData.cards.length);
    
    // Retornar dados completos diretamente (não precisa de GET)
    return NextResponse.json({
      success: true,
      previewId,
      data: previewData
    });

  } catch (error) {
    console.error('[API Generate] Erro ao processar:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno ao processar conversa' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET para recuperar uma preview pelo ID (usado pela página de preview)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const previewId = searchParams.get('id');

  if (!previewId) {
    return NextResponse.json(
      { success: false, error: 'ID não fornecido' },
      { status: 400 }
    );
  }

  // TODO: BUSCAR DO SUPABASE
  // const { data, error } = await supabase
  //   .from('stories')
  //   .select('*')
  //   .eq('id', previewId)
  //   .single();

  const previewStory = storiesInMemory.get(previewId);

  if (!previewStory) {
    return NextResponse.json(
      { success: false, error: 'História não encontrada ou expirada' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: previewStory,
  });
}
