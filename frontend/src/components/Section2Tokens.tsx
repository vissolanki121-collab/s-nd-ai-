import React, { useState } from 'react';
import { TokenizeData, SimilarityData } from '../types';
import { Binary, Scale, Info } from 'lucide-react';

interface Props {
  onTokenize: (text: string) => Promise<void>;
  loading: boolean;
  tokenData: TokenizeData | null;
  sentence1Exists: boolean;
  similarityData: SimilarityData | null;
  error: string | null;
}

const PRESETS = [
  "Machine learning algorithms extract semantic features from natural language data.",
  "Cats and dogs are beloved domestic pets that love outdoor activities.",
  "Quantum supercomputers process complex quantum states at cryogenic temperatures.",
  "A delicious homemade Italian pizza topped with fresh basil and mozzarella."
];

export const Section2Tokens: React.FC<Props> = ({
  onTokenize,
  loading,
  tokenData,
  sentence1Exists,
  similarityData,
  error,
}) => {
  const [text, setText] = useState<string>("Machine learning algorithms extract semantic features from natural language data.");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onTokenize(text.trim());
  };

  return (
    <section id="section-2" className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/30 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold shadow-glow-green">
            2
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              Sentence 2: Generate Tokens & Compute Similarity
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                Target: Green Point
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Inspects actual model tokens & IDs, generates 384D embedding, and evaluates cosine similarity against Sentence 1.
            </p>
          </div>
        </div>

        {tokenData && (
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300">
              Tokens: <strong className="text-white">{tokenData.token_count}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300">
              Chars: <strong className="text-white">{tokenData.char_count}</strong>
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
            placeholder="Enter your second sentence..."
            className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-4 text-white text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-sans resize-none"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              {text.length} characters
            </span>
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl flex items-center gap-2 shadow-glow-green transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Tokenizing & Embedding...</span>
                </>
              ) : (
                <>
                  <Binary className="w-4 h-4" />
                  <span>Generate Tokens</span>
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

      {/* Tokenization Results */}
      {tokenData && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 rounded-2xl p-5 border border-emerald-500/30">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                <h3 className="text-sm font-semibold text-white">
                  Real Token Breakdown & Vocabulary IDs
                </h3>
                <span className="text-xs text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  WordPiece Tokenizer
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Total Tokens: <span className="text-white font-bold">{tokenData.token_count}</span> | Total Chars: <span className="text-white font-bold">{tokenData.char_count}</span>
              </div>
            </div>

            {/* Individual Tokens and Token IDs visual chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {tokenData.tokens.map((token, idx) => {
                const tokenId = tokenData.token_ids[idx];
                const isSpecial = token.startsWith('[') && token.endsWith(']');
                const isSubword = token.startsWith('##');

                return (
                  <div
                    key={idx}
                    className={`flex flex-col items-center px-3 py-2 rounded-xl border transition-all hover:scale-105 ${
                      isSpecial
                        ? 'bg-purple-950/60 border-purple-700/60 text-purple-300'
                        : isSubword
                        ? 'bg-amber-950/50 border-amber-700/60 text-amber-300'
                        : 'bg-slate-900 border-slate-700/80 text-white'
                    }`}
                  >
                    <span className="font-mono text-sm font-semibold mb-1">
                      {token}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-slate-400">
                      ID: {tokenId}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 border-t border-slate-800 pt-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-purple-500" />
                <span>Special Tokens ([CLS], [SEP])</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                <span>Subwords (## prefix)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-600" />
                <span>Whole Words</span>
              </div>
            </div>
          </div>

          {/* Cosine Similarity Card */}
          {similarityData ? (
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl p-6 border border-cyan-500/40 shadow-2xl relative">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Cosine Semantic Similarity
                      <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                        384-Dimensional Space
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Calculated on original high-dimensional vectors: <code className="text-slate-300">cos(&theta;) = (u &middot; v) / (||u|| ||v||)</code>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 font-mono">
                    {similarityData.similarity.toFixed(4)}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    Raw Cosine Score: [-1.0 to +1.0]
                  </div>
                </div>
              </div>

              {/* Similarity Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-1000 shadow-glow-blue"
                    style={{ width: `${Math.max(4, Math.min(100, (similarityData.similarity + 1) / 2 * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                  <span>-1.0 (Opposite)</span>
                  <span>0.0 (Orthogonal)</span>
                  <span>+1.0 (Identical)</span>
                </div>
              </div>

              {/* Explanation Card */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm leading-relaxed text-slate-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-1">Semantic Interpretation:</strong>
                  {similarityData.explanation}
                </div>
              </div>

              {/* Dimensions comparison footer */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Sentence 1: <strong className="text-slate-200">384 dimensions</strong></span>
                  <span className="text-slate-600 mx-1">&bull;</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Sentence 2: <strong className="text-slate-200">384 dimensions</strong></span>
                </div>
                <div className="text-cyan-400 font-medium">
                  &check; True 384D dot product (not reduced 3D coordinates)
                </div>
              </div>
            </div>
          ) : sentence1Exists ? (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
              Sentence 2 embedding ready. Calculating similarity...
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-xs text-amber-300 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>Please generate an embedding for <strong>Sentence 1</strong> above to compute pairwise cosine similarity.</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
