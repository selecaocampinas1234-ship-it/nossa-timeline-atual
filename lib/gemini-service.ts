import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY não configurada no .env.local');
}

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export interface GeminiAnalysisResult {
  winner: string;
  confidence: number;
  result: string;
  evidence: string[];
}

/**
 * Analisa texto usando Gemini 1.5 Flash
 * Retorna JSON estruturado
 */
export async function analyzeWithGemini(prompt: string): Promise<GeminiAnalysisResult> {
  if (!genAI) {
    throw new Error('Gemini não configurado. Adicione GEMINI_API_KEY ao .env.local');
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json',
      },
    });

    console.log('[Gemini] Enviando prompt para análise...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('[Gemini] ✅ Resposta recebida:', text.substring(0, 200) + '...');
    
    return JSON.parse(text);
  } catch (error) {
    console.error('[Gemini] Erro na análise:', error);
    throw error;
  }
}

/**
 * Analisa os 5 cards principais da história
 */
export async function analyzeFiveCards(
  messages: string,
  person1: string,
  person2: string,
  relationType: 'casal' | 'amizade'
): Promise<any> {
  const prompt = `
Você é um especialista em análise de conversas do WhatsApp. Analise a conversa abaixo e preencha os 5 cards de análise comportamental.

**PESSOAS:**
- ${person1}
- ${person2}

**TIPO DE RELAÇÃO:** ${relationType === 'casal' ? 'Namoro/Relacionamento Romântico' : 'Amizade'}

**CONVERSA:**
${messages}

**TAREFA:**
Analise a conversa e determine o VENCEDOR de cada uma das 5 categorias abaixo. Use evidências concretas das mensagens e encontre também 2 MOMENTOS INTRIGANTES da conversa.

**OS 5 CARDS COM FORMATOS ESPECÍFICOS:**

1. **BRIGAS** - Quem começou mais brigas/discussões?
   - Format: NÚMERO (ex: "12", "8", "25")
   - Representa: quantidade de brigas iniciadas

2. **CIÚME** - Quem demonstrou mais ciúmes/insegurança?
   - Format: PORCENTAGEM (ex: "73%", "89%", "65%")
   - Representa: nível de ciúme detectado

3. **DEMORA** - Quem demorou mais tempo para responder mensagens?
   - Format: TEMPO em horas (ex: "2h", "5h", "12h", "1h 30min")
   - Representa: tempo médio de resposta ou maior demora

4. **ORGULHO** - Quem teve mais orgulho/teimosia em admitir erros?
   - Format: PORCENTAGEM (ex: "81%", "92%", "67%")
   - Representa: nível de orgulho/teimosia detectado

5. **VÁCUO** - Quem deixou o outro no vácuo mais vezes (não respondeu)?
   - Format: NÚMERO (ex: "18", "7", "34")
   - Representa: quantidade de vezes que deu vácuo

**IMPORTANTE:**
- Seja objetivo e use evidências da conversa
- Use linguagem descontraída e engraçada
- Confidence de 0-100 baseado na certeza da análise
- SIGA RIGOROSAMENTE O FORMATO ESPECIFICADO PARA CADA CARD

Retorne APENAS um JSON válido no formato:
{
  "cards": [
    {
      "id": "brigas",
      "title": "Brigas",
      "winner": "${person1}",
      "confidence": 85,
      "stat": "12",
      "statLabel": ""
    },
    {
      "id": "ciume",
      "title": "Ciúme",
      "winner": "${person2}",
      "confidence": 90,
      "stat": "73%",
      "statLabel": ""
    },
    {
      "id": "demora",
      "title": "Demora",
      "winner": "${person1}",
      "confidence": 75,
      "stat": "2h 30min",
      "statLabel": ""
    },
    {
      "id": "orgulho",
      "title": "Orgulho",
      "winner": "${person2}",
      "confidence": 80,
      "stat": "81%",
      "statLabel": ""
    },
    {
      "id": "vacuo",
      "title": "Vácuo",
      "winner": "${person1}",
      "confidence": 70,
      "stat": "18",
      "statLabel": ""
    }
  ]
}

**REGRAS FINAIS:**
- brigas: apenas NÚMERO
- ciume: apenas PORCENTAGEM com %
- demora: apenas HORAS (ex: "1h", "2h 15min", "5h 30min", "12h")
- orgulho: apenas PORCENTAGEM com %
- vacuo: apenas NÚMERO
- statLabel: sempre vazio ""

**IMPORTANTE: ADICIONE 4 MOMENTOS INTRIGANTES:**
Analise a conversa e encontre 4 momentos que gerem curiosidade, mas mantenha o tom leve e respeitoso.

${relationType === 'casal' ? `
**PARA CASAIS, FOQUE EM:**
- Momentos românticos ou declarações de amor
- Pequenas brigas ou ciúmes (tom leve)
- Surpresas ou presentes mencionados
- Planos de encontro ou viagens românticas
- Apelidos carinhosos ou elogios
- Conversas sobre o futuro juntos
- Saudade ou "te amo" especiais
- Conquistas compartilhadas como casal
` : `
**PARA AMIGOS, FOQUE EM:**
- Zoações ou brincadeiras engraçadas entre amigos
- Planos de rolê, festa ou balada
- Piadas internas ou memes compartilhados
- Aventuras ou histórias engraçadas
- Desabafos ou conselhos de amizade
- Games, esportes ou hobbies em comum
- Resenha ou conversas aleatórias divertidas
- Combinações de encontro ou confraternizações
`}

**IMPORTANTE - EVITE:**
- Conteúdo extremamente agressivo ou violento
- Discussões muito sérias ou ofensivas
- Assuntos muito íntimos ou sensíveis
- Traições ou traumas graves
- Conteúdo que possa constranger as pessoas

Escolha momentos INTRIGANTES mas LEVES, que gerem curiosidade positiva e sejam ADEQUADOS ao tipo de relação (${relationType}).

**IMPORTANTE - EXTRAÇÃO DE DATAS:**
- Formato nas mensagens: [DD/MM/YYYY HH:MM] Nome: mensagem
- Extraia a data REAL do timestamp da mensagem relacionada ao momento
- Converta para formato: "DD MÊS AAAA" (mês abreviado em maiúsculas com 3 letras)
- Exemplos: [15/01/2024] → "15 JAN 2024", [03/03/2023] → "03 MAR 2023", [22/11/2024] → "22 NOV 2024"

Retorne no formato:
{
  "cards": [...],
  "moments": [
    {
      "title": "Título curto e impactante",
      "emoji": "😱",
      "category": "BRIGA",
      "description": "Breve contexto do que aconteceu",
      "snippet": "Trecho real da conversa (1-2 mensagens)",
      "date": "15 JAN 2024"
    },
    {
      "title": "Segundo momento intrigante",
      "emoji": "🎉",
      "category": "VIAGEM",
      "description": "Breve contexto",
      "snippet": "Trecho da conversa",
      "date": "20 FEV 2024"
    },
    {
      "title": "Terceiro momento marcante",
      "emoji": "💕",
      "category": "ROMANCE",
      "description": "Breve contexto",
      "snippet": "Trecho da conversa",
      "date": "14 MAR 2024"
    },
    {
      "title": "Quarto momento especial",
      "emoji": "🤣",
      "category": "ENGRAÇADO",
      "description": "Breve contexto",
      "snippet": "Trecho da conversa",
      "date": "05 ABR 2024"
    }
  ]
}
`;

  return analyzeWithGemini(prompt);
}

/**
 * Analisa os 20-25 cards principais da história (VERSÃO PREMIUM)
 */
export async function analyzeFullTimeline(
  messages: string,
  person1: string,
  person2: string,
  relationType: 'casal' | 'amizade'
): Promise<any> {
  const prompt = `
Você é um especialista em análise de conversas do WhatsApp. Analise a conversa abaixo e crie uma timeline COMPLETA com 20-25 momentos marcantes.

**PESSOAS:**
- ${person1}
- ${person2}

**TIPO DE RELAÇÃO:** ${relationType === 'casal' ? 'Namoro/Relacionamento Romântico' : 'Amizade'}

**CONVERSA:**
${messages}

**TAREFA:**
Crie uma timeline com 20-25 momentos especiais que contam a história completa dessa relação. Para cada momento:

1. **title**: Nome do momento (criativo e emocional)
2. **emoji**: Emoji que representa o momento
3. **category**: Tipo do momento (positive, negative, neutral, funny, romantic, etc)
4. **description**: Descrição envolvente (2-3 frases)
5. **snippet**: Trecho real da conversa que exemplifica
6. **date**: Data aproximada (formato: "DD MÊS AAAA")

**IMPORTANTE:**
- Conte a história cronologicamente
- Misture momentos positivos, negativos, engraçados e românticos
- Use linguagem emocional e envolvente
- Priorize momentos com carga emocional forte
- Inclua pequenas vitórias e grandes conquistas
- Mostre a evolução da relação

Retorne APENAS JSON válido no formato:
{
  "cards": [
    {
      "id": "1",
      "title": "Como Tudo Começou",
      "winner": "${person1}",
      "stat": "primeiro contato",
      "statLabel": "15 JAN 2024",
      "confidence": 100,
      "icon": "✨"
    }
  ],
  "moments": [
    {
      "title": "O Primeiro Oi",
      "emoji": "💫",
      "category": "positive",
      "description": "O momento em que tudo começou...",
      "snippet": "Oi! Tudo bem?",
      "date": "15 JAN 2024"
    }
  ]
}
`;

  return analyzeWithGemini(prompt);
}

/**
 * Gera timeline de momentos marcantes usando Gemini
 */
export async function generateTimelineWithGemini(
  messages: string,
  person1: string,
  person2: string,
  relationType: 'casal' | 'amizade'
): Promise<any> {
  const prompt = `
Você é um especialista em análise de conversas do WhatsApp. Analise a conversa abaixo e identifique os momentos mais marcantes para criar uma timeline emocionante.

**PESSOAS:**
- ${person1}
- ${person2}

**TIPO DE RELAÇÃO:** ${relationType === 'casal' ? 'Namoro/Relacionamento Romântico' : 'Amizade'}

**CONVERSA (últimas 500 mensagens mais relevantes):**
${messages}

**TAREFA:**
Identifique 8-12 momentos marcantes que contam a história dessa relação. Para cada momento, forneça:

1. **título**: Nome do momento (ex: "Primeiro Oi", "Declaração Inesperada", "A Grande Briga")
2. **date**: Data REAL extraída do timestamp da mensagem (formato: "DD MÊS AAAA" ex: "15 JAN 2024", "03 MAR 2023")
3. **description**: Descrição breve e envolvente (1-2 frases)
4. **emoji**: Emoji que representa o momento
5. **type**: "positive", "negative" ou "neutral"
6. **messages**: Array com 2-3 mensagens reais que exemplificam o momento

**IMPORTANTE - EXTRAÇÃO DE DATAS:**
- Formato nas mensagens: [DD/MM/YYYY HH:MM] Nome: mensagem
- Extraia o DD/MM/YYYY e converta para "DD MÊS AAAA" (mês em maiúsculas e abreviado com 3 letras)
- Exemplos: [15/01/2024] → "15 JAN 2024", [03/03/2023] → "03 MAR 2023"

**IMPORTANTE:**
- Use linguagem emocional e envolvente
- Priorize momentos com carga emocional forte
- Inclua momentos positivos E negativos (storytelling real)
- Use emojis apropriados
- As mensagens devem ser EXATAMENTE como aparecem na conversa
- A DATA DEVE SER EXTRAÍDA DO TIMESTAMP REAL DA MENSAGEM

Retorne APENAS um JSON válido no formato:
{
  "timeline": [
    {
      "title": "Como Tudo Começou",
      "date": "15 JAN 2024",
      "description": "O primeiro 'oi' que mudou tudo...",
      "emoji": "✨",
      "type": "positive",
      "messages": [
        "[15/01/2024 18:30] ${person1}: Oi! Tudo bem?",
        "[15/01/2024 18:35] ${person2}: Oiii! Tudo sim!"
      ]
    }
  ]
}
`;

  return analyzeWithGemini(prompt);
}
