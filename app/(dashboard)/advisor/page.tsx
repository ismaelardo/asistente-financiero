'use client';
import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { Bot, ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react';
import type { AiUsage } from '@/types';

interface AnalysisResult { text: string; usage: AiUsage }

function formatAnalysis(text: string) {
  // Split on bold section headers and render as structured blocks
  const sections = text.split(/(?=\*\*\d\.)/);
  return sections.map((section, i) => {
    const cleaned = section.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong>${m}</strong>`);
    return (
      <div key={i} className="mb-4 last:mb-0">
        <div
          className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: cleaned }}
        />
      </div>
    );
  });
}

function AnalysisCard({ analysis, index }: { analysis: AiUsage; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const date = new Date(analysis.timestamp).toLocaleString('es-CL', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <Card className={index > 0 ? 'opacity-80' : ''}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center text-left"
      >
        <div>
          <p className="text-sm font-medium text-gray-900">Análisis financiero</p>
          <p className="text-xs text-gray-400 mt-0.5">{date}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">${analysis.cost_usd.toFixed(4)} USD</span>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {open && analysis.response_text && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {formatAnalysis(analysis.response_text)}
        </div>
      )}
    </Card>
  );
}

export default function AdvisorPage() {
  const [history,  setHistory]  = useState<AiUsage[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [latest,   setLatest]   = useState<AnalysisResult | null>(null);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/advisor');
      if (res.ok) setHistory(await res.json());
    } catch { /* silently ignore */ }
  };

  useEffect(() => { loadHistory(); }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/advisor', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al analizar');
      setLatest(data);
      loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Asesor IA</h1>
        <p className="text-sm text-gray-500 mt-1">
          Análisis personalizado basado en tus datos reales
        </p>
      </div>

      {/* Main CTA */}
      <Card>
        <div className="flex flex-col items-center py-6 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <Bot size={24} className="text-blue-600" />
          </div>
          <h2 className="font-medium text-gray-900 mb-2">Analiza tu situación financiera</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md">
            Claude revisará tus últimos 3 meses de transacciones, deudas y metas para darte
            un diagnóstico y prioridades concretas.
          </p>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Analizar mis finanzas
              </>
            )}
          </button>
        </div>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Latest result — shown immediately after fetch */}
      {latest && (
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-3">Último análisis</h2>
          <Card className="border-blue-200 bg-blue-50/30">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-100">
              <Sparkles size={14} className="text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Análisis completado</span>
              <span className="text-xs text-blue-400 ml-auto">${latest.usage.cost_usd.toFixed(4)} USD</span>
            </div>
            {formatAnalysis(latest.text)}
          </Card>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Historial de análisis
          </h2>
          <div className="space-y-3">
            {history.map((analysis, i) => (
              <AnalysisCard key={analysis.id} analysis={analysis} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
