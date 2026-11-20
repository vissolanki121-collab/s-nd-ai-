import React, { useState } from 'react';
import { GraphPoint } from '../types';
import { PlusCircle, Trash2, Tag, AlertCircle } from 'lucide-react';

interface Props {
  onAddPoint: (text: string) => Promise<void>;
  loading: boolean;
  customPoints: GraphPoint[];
  onRemovePoint: (id: string) => void;
  onClearCustomPoints: () => void;
  bothEmbeddingsExist: boolean;
  error: string | null;
}

const PRESET_ADDITIONS = [
  "A fluffy kitten napping in the warm sun",
  "Telescopes searching for distant exoplanets",
  "Python programming and backend API development",
  "Delicious homemade chocolate chip cookies",
  "The philosophical nature of human consciousness"
];

export const Section4AddSentences: React.FC<Props> = ({
  onAddPoint,
  loading,
  customPoints,
  onRemovePoint,
  onClearCustomPoints,
  bothEmbeddingsExist,
  error,
}) => {
  const [text, setText] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onAddPoint(text.trim());
    setText("");
  };

  const handleAddPreset = (preset: string) => {
    if (loading) return;
    onAddPoint(preset);
  };

  return (
    <section id="section-4" className="glass-panel p-6 sm:p-8 rounded-3xl border border-rose-500/30 shadow-2xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 font-bold shadow-glow-red">
            4
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              Add More Words or Sentences
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                Target: Red Points
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Project additional words or sentences using the SAME frozen 3D projection without moving existing points.
            </p>
          </div>
        </div>

        {customPoints.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={onClearCustomPoints}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700 text-xs transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Added ({customPoints.length})</span>
            </button>
          </div>
        )}
      </div>

      {!bothEmbeddingsExist && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-800 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Note: You can add sentences now, but they will appear in the 3D graph once both Sentence 1 (Blue) and Sentence 2 (Green) are initialized above.
          </span>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Enter another word or sentence..."
            className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-rose-500 rounded-2xl p-4 text-white text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all font-sans resize-none"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="px-5 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl flex items-center gap-2 shadow-glow-red transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Projecting...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Add to Graph</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Click to add quickly:</span>
          {PRESET_ADDITIONS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddPreset(preset)}
              disabled={loading}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center gap-1.5"
            >
              <Tag className="w-3 h-3 text-rose-400" />
              <span>"{preset.slice(0, 30)}…"</span>
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="p-4 mb-6 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Added Points Table / List */}
      {customPoints.length > 0 ? (
        <div className="bg-slate-950/90 rounded-2xl p-4 border border-rose-500/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
              Currently Plotted Added Points ({customPoints.length})
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">
              Preserved across updates
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {customPoints.map((point) => (
              <div
                key={point.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-white font-medium truncate">"{point.text}"</span>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono text-[11px] text-slate-400">
                  <span className="hidden sm:inline bg-black/50 px-2 py-0.5 rounded border border-slate-800 text-cyan-300">
                    [{point.coordinates[0].toFixed(2)}, {point.coordinates[1].toFixed(2)}, {point.coordinates[2].toFixed(2)}]
                  </span>
                  <button
                    onClick={() => onRemovePoint(point.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all"
                    title="Remove point from 3D space"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-500 text-center">
          No additional points added yet. Type a sentence above or click any preset to plot red points onto the 3D visualization.
        </div>
      )}
    </section>
  );
};
