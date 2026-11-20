import React from 'react';
import { EmbeddingVisualizer3D } from './EmbeddingVisualizer3D';
import { GraphPoint, SimilarityData } from '../types';
import { Box, Orbit, Layers, ShieldCheck } from 'lucide-react';

interface Props {
  points: GraphPoint[];
  sentence1Point?: GraphPoint;
  sentence2Point?: GraphPoint;
  similarityData: SimilarityData | null;
  bothEmbeddingsExist: boolean;
}

export const Section3Visualization: React.FC<Props> = ({
  points,
  sentence1Point,
  sentence2Point,
  similarityData,
  bothEmbeddingsExist,
}) => {
  return (
    <section id="section-3" className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/40 shadow-2xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 font-bold shadow-glow-blue">
            3
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              Interactive 3D Embedding Visualization
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium flex items-center gap-1">
                <Box className="w-3 h-3" /> Real WebGL Three.js Scene
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Interactive 3D vector space displaying projected high-dimensional embeddings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Points: <strong className="text-white">{points.length}</strong>
          </span>
        </div>
      </div>

      {bothEmbeddingsExist ? (
        <div className="space-y-6 relative z-10">
          {/* Main 3D Canvas */}
          <EmbeddingVisualizer3D
            points={points}
            sentence1Point={sentence1Point}
            sentence2Point={sentence2Point}
            similarityScore={similarityData?.similarity}
          />

          {/* Educational Mathematical Architecture Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2 text-cyan-400">
                <Layers className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">384-Dimensional Reality</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The embedding model <code className="text-slate-300">all-MiniLM-L6-v2</code> maps sentences into a 384-dimensional hypersphere. Every dimension represents nuanced linguistic abstractions.
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Frozen Deterministic PCA</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                We project from 384D to 3D using a mathematically fixed PCA projection matrix fitted once on a diverse reference corpus. Existing points never shift or warp when new words are added.
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 hover:border-rose-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2 text-rose-400">
                <Orbit className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Similarity Calculation</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cosine similarity is calculated strictly on the original high-dimensional 384-dimensional vectors. The 3D view provides spatial intuition without compromising mathematical integrity.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-cyan-950/50 border border-cyan-800 flex items-center justify-center text-cyan-400 mb-4 shadow-glow-blue">
            <Orbit className="w-8 h-8 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            3D Graph Awaiting Embeddings
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Generate embeddings for both <strong>Sentence 1</strong> (Blue) and <strong>Sentence 2</strong> (Green) above to initialize the interactive 3D coordinate space.
          </p>
          <div className="inline-flex items-center gap-4 text-xs text-slate-500 font-mono">
            <span className={sentence1Point ? "text-blue-400 font-semibold" : ""}>
              Sentence 1: {sentence1Point ? "Ready" : "Pending"}
            </span>
            <span>&bull;</span>
            <span className={sentence2Point ? "text-emerald-400 font-semibold" : ""}>
              Sentence 2: {sentence2Point ? "Ready" : "Pending"}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
