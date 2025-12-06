'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, CheckCircle2 } from 'lucide-react';

export default function PremiumPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateEmail = async () => {
    if (!email) {
      setValidationError('Digite seu email');
      return;
    }

    setIsValidating(true);
    setValidationError('');

    try {
      const response = await fetch(`/api/payment/verify?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (data.success && data.status === 'approved') {
        setIsValidated(true);
        setValidationError('');
      } else if (data.status === 'pending') {
        setValidationError('⏳ Pagamento em processamento. Aguarde alguns instantes e tente novamente.');
      } else if (data.status === 'not_found') {
        setValidationError('❌ Nenhum pagamento encontrado para este email. Verifique se digitou corretamente.');
      } else {
        setValidationError('❌ Pagamento não aprovado. Entre em contato com o suporte.');
      }
    } catch (error) {
      setValidationError('Erro ao verificar pagamento. Tente novamente.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      alert('Selecione um arquivo');
      return;
    }

    setIsProcessing(true);

    try {
      // Preparar FormData (igual página gratuita)
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('relationType', 'casal'); // Default para premium
      formDataToSend.append('person1Name', 'Pessoa 1'); // Placeholder
      formDataToSend.append('person2Name', 'Pessoa 2'); // Placeholder
      formDataToSend.append('isPremium', 'true'); // Flag premium
      formDataToSend.append('email', email); // Email validado
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar');
      }

      if (data.success && data.previewId) {
        router.push(`/h/${data.previewId}`);
      } else {
        throw new Error('Erro ao gerar timeline');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao processar arquivo');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            ✨ Área Premium
          </h1>
          <p className="text-gray-600">
            Gere sua timeline completa sem limitações!
          </p>
        </div>

        {/* Card de validação */}
        {!isValidated ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Validar Acesso</h2>
              <p className="text-gray-600">Digite o email que você usou no pagamento</p>
            </div>

            <div className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 outline-none"
                disabled={isValidating}
              />

              {validationError && (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
                  <p className="text-red-800 text-sm">{validationError}</p>
                </div>
              )}

              <button
                onClick={validateEmail}
                disabled={isValidating}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Validar e Continuar
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                💡 Não lembra qual email usou? Verifique o comprovante do PIX.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Sucesso na validação */}
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-semibold">✅ Pagamento confirmado! Você tem acesso premium.</p>
              </div>
            </div>

            {/* Formulário de upload */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  📱 Envie sua conversa do WhatsApp:
                </label>
                <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    disabled={isProcessing}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-purple-500 mx-auto mb-2" />
                    <p className="text-gray-700 font-medium">
                      {file ? file.name : 'Clique para selecionar o arquivo'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Apenas arquivos .txt</p>
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
                <p className="text-blue-800 text-sm">
                  <strong>✨ Versão Premium:</strong> Sua timeline será gerada completa com 15-20 momentos especiais!
                </p>
              </div>

              <button
                type="submit"
                disabled={!file || isProcessing}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando sua timeline...
                  </>
                ) : (
                  <>
                    ✨ Gerar Timeline Completa
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6">
          <a href="/" className="text-purple-600 hover:text-purple-700 font-medium">
            ← Voltar para página inicial
          </a>
        </div>
      </div>
    </div>
  );
}
