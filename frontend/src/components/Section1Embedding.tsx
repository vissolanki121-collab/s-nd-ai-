import React, { useState } from 'react';
import { EmbeddingData } from '../types';
import { Sparkles, Copy, Check, CornerDownLeft } from 'lucide-react';

interface Props {
  onGenerate: (text: string) => Promise<void>;
  loading: boolean;
  data: EmbeddingData | null;
  error: string | null;
}

const PRESETS = [
  "Artificial intelligence models learn complex linguistic representations.",
  "The golden retriever happily chased the tennis ball across the lawn.",
  "A majestic eagle flew above the snow-capped mountain peaks.",
  "Deep neural networks transform unstructured text into dense vector spaces."
];

export const Section1Embedding: React.FC<Props> = ({
  onGenerate,
  loading,
  data,
  error,
}) => {
  const [text, setText] = useState<string>("Artificial intelligence models learn complex linguistic representations.");
  const [copied, setCopied] = useState<boolean>(false);
  const [showFullVector, setShowFullVector] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onGenerate(text.trim());
  };

  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data.embedding));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="section-1" className="glass-panel p-6 sm:p-8 rounded-3xl border border-blue-500/30 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 font-bold shadow-glow-blue">
            1
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              Sentence 1: Generate Embedding
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                Target: Blue Point
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Transforms input text into a high-dimensional vector via the real <code className="text-blue-300 font-mono">all-MiniLM-L6-v2</code> model.
            </p>
          </div>
        </div>

        {data && (
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-800 text-blue-300">
              Dimensions: <strong className="text-white">{data.dimensions}D</strong>
            </span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Enter your first sentence..."
            className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-blue-500 rounded-2xl p-4 text-white text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-sans resize-none"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              {text.length} characters
            </span>
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl flex items-center gap-2 shadow-glow-blue transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Computing 384D Vector...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Embedding</span>
                  <CornerDownLeft className="w-3.5 h-3.5 opacity-70" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Try example:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setText(p)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all"
            >
              "{p.slice(0, 32)}…"
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="p-4 mb-6 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Embedding Result Card */}
      {data && (
        <div className="bg-slate-950/90 rounded-2xl p-5 border border-blue-500/30 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
              <h3 className="text-sm font-semibold text-white">
                Actual Numerical Embedding Vector
              </h3>
              <span className="text-xs text-blue-400 font-mono bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                L2-Normalized (384 dimensions)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFullVector(!showFullVector)}
                className="text-xs px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
              >
                {showFullVector ? 'Collapse Vector' : 'Show All 384 Dims'}
              </button>
              <button
                onClick={handleCopy}
                className="text-xs px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-all"
                title="Copy entire vector as JSON"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
          </div>

          {/* 3D Projected Coordinates Preview */}
          <div className="mb-3 p-3 rounded-xl bg-blue-950/30 border border-blue-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="text-slate-300">
              <span className="text-blue-400 font-semibold">Projected 3D Coordinates: </span>
              <span className="font-mono text-white">
                X: {data.projection_3d[0].toFixed(3)}, Y: {data.projection_3d[1].toFixed(3)}, Z: {data.projection_3d[2].toFixed(3)}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 italic">
              Computed via frozen PCA basis
            </span>
          </div>

          {/* Vector numerical display */}
          <div className="max-h-56 overflow-y-auto p-3.5 rounded-xl bg-black/60 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
              {(showFullVector ? data.embedding : data.embedding.slice(0, 32)).map((val, idx) => {
                // Color intensity based on positive/negative value
                const isPos = val >= 0;
                return (
                  <div
                    key={idx}
                    className="p-1 rounded bg-slate-900/90 border border-slate-800/80 flex justify-between items-center px-2 hover:border-blue-500/50 transition-all"
                  >
                    <span className="text-[10px] text-slate-500">[{idx}]</span>
                    <span className={`font-semibold ${isPos ? 'text-cyan-300' : 'text-blue-400'}`}>
                      {val.toFixed(4)}
                    </span>
                  </div>
                );
              })}
            </div>
            {!showFullVector && (
              <div className="text-center mt-3 pt-2 border-t border-slate-900 text-xs text-slate-500">
                Showing first 32 dimensions of 384. Click "Show All 384 Dims" to inspect the complete vector.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
