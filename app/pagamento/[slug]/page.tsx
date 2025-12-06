'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Força renderização dinâmica
export const dynamic = 'force-dynamic';
import { Copy, CheckCircle2, Loader2, QrCode, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function PagamentoPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (slug) {
      loadPaymentData();
      // Poll a cada 5 segundos
      const interval = setInterval(checkPaymentStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [slug]);

  const loadPaymentData = async () => {
    try {
      const response = await fetch(`/api/payment/status?slug=${slug}`);
      const data = await response.json();
      
      if (data.success) {
        setPayment(data.payment);
        
        // Se já foi pago, redirecionar
        if (data.payment.status === 'confirmed') {
          router.push(`/h/${slug}`);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pagamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (checking) return;
    setChecking(true);
    
    try {
      const response = await fetch(`/api/payment/status?slug=${slug}`);
      const data = await response.json();
      
      if (data.success && data.payment.status === 'confirmed') {
        router.push(`/h/${slug}`);
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
    } finally {
      setChecking(false);
    }
  };

  const copyPix = () => {
    if (payment?.pix_copy_paste) {
      navigator.clipboard.writeText(payment.pix_copy_paste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-purple-600" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pagamento não encontrado</h1>
          <Link href="/" className="text-purple-600 hover:underline">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pague com PIX
          </h1>
          <p className="text-gray-600">
            Escaneie o QR Code ou copie o código para pagar
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          {/* QR Code */}
          {payment.pix_qr_code && (
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-xl border-4 border-purple-200">
                <Image
                  src={`data:image/png;base64,${payment.pix_qr_code}`}
                  alt="QR Code PIX"
                  width={250}
                  height={250}
                  className="rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Valor */}
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-2">Valor a pagar</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              R$ {payment.amount.toFixed(2)}
            </p>
          </div>

          {/* Código PIX */}
          {payment.pix_copy_paste && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Código PIX Copia e Cola
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={payment.pix_copy_paste}
                  readOnly
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-sm font-mono"
                />
                <button
                  onClick={copyPix}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 size={20} />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={20} />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <Loader2 size={20} className="animate-spin text-yellow-600" />
            <p className="text-yellow-700 font-medium">
              Aguardando pagamento...
            </p>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <QrCode size={20} className="text-purple-600" />
            Como pagar
          </h3>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Abra o app do seu banco</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Escolha pagar com PIX QR Code ou Copia e Cola</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Escaneie o código ou cole o texto</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>Confirme o pagamento de R$ 9,90</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
              <span>Pronto! Em poucos segundos você será redirecionado automaticamente</span>
            </li>
          </ol>
        </div>

        {/* Botão manual */}
        <div className="text-center">
          <button
            onClick={checkPaymentStatus}
            disabled={checking}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all disabled:opacity-50"
          >
            {checking ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Verificando...
              </>
            ) : (
              'Já paguei, verificar agora'
            )}
          </button>
        </div>

        {/* Link fatura */}
        {payment.asaas_invoice_url && (
          <div className="text-center mt-4">
            <a
              href={payment.asaas_invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
            >
              Ver fatura completa
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
