import React, { useState, useEffect, useMemo } from 'react';
import { Section1Embedding } from './components/Section1Embedding';
import { Section2Tokens } from './components/Section2Tokens';
import { Section3Visualization } from './components/Section3Visualization';
import { Section4AddSentences } from './components/Section4AddSentences';
import { EmbeddingData, TokenizeData, SimilarityData, GraphPoint } from './types';
import {
  fetchHealth,
  generateEmbedding,
  tokenizeSentence,
  calculateSimilarity,
} from './api';
import {
  Sparkles,
  Cpu,
  Compass,
} from 'lucide-react';

export const App: React.FC = () => {
  // State
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [modelInfo, setModelInfo] = useState<{ model: string; dims: number }>({
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    dims: 384,
  });

  // Section 1 State
  const [sentence1Data, setSentence1Data] = useState<EmbeddingData | null>(null);
  const [loading1, setLoading1] = useState<boolean>(false);
  const [error1, setError1] = useState<string | null>(null);

  // Section 2 State
  const [sentence2Data, setSentence2Data] = useState<TokenizeData | null>(null);
  const [loading2, setLoading2] = useState<boolean>(false);
  const [error2, setError2] = useState<string | null>(null);

  // Similarity State
  const [similarityData, setSimilarityData] = useState<SimilarityData | null>(null);

  // Section 4 State: Custom Points
  const [customPoints, setCustomPoints] = useState<GraphPoint[]>([]);
  const [loading4, setLoading4] = useState<boolean>(false);
  const [error4, setError4] = useState<string | null>(null);

  // Check Backend Health on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetchHealth();
        setBackendOnline(true);
        setModelInfo({ model: res.model, dims: res.embedding_dimensions });
      } catch (err) {
        console.warn('Backend not yet reachable:', err);
        setBackendOnline(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Recalculate cosine similarity whenever both sentence 1 and sentence 2 embeddings are updated
  const triggerSimilarity = async (
    emb1: number[],
    emb2: number[],
    t1?: string,
    t2?: string
  ) => {
    try {
      const sim = await calculateSimilarity(emb1, emb2, t1, t2);
      setSimilarityData(sim);
    } catch (err: any) {
      console.error('Failed to compute similarity:', err);
    }
  };

  // Handler for Section 1
  const handleGenerateSentence1 = async (text: string) => {
    setLoading1(true);
    setError1(null);
    try {
      const data = await generateEmbedding(text);
      setSentence1Data(data);

      // If sentence 2 already exists, recalculate cosine similarity
      if (sentence2Data?.embedding) {
        await triggerSimilarity(data.embedding, sentence2Data.embedding, data.text, sentence2Data.text);
      }
    } catch (err: any) {
      setError1(err.message || 'Error generating embedding');
    } finally {
      setLoading1(false);
    }
  };

  // Handler for Section 2
  const handleTokenizeSentence2 = async (text: string) => {
    setLoading2(true);
    setError2(null);
    try {
      const data = await tokenizeSentence(text);
      setSentence2Data(data);

      // If sentence 1 exists, calculate similarity
      if (sentence1Data?.embedding) {
        await triggerSimilarity(sentence1Data.embedding, data.embedding, sentence1Data.text, data.text);
      }
    } catch (err: any) {
      setError2(err.message || 'Error tokenizing sentence');
    } finally {
      setLoading2(false);
    }
  };

  // Handler for Section 4: Add New Words or Sentences
  const handleAddCustomPoint = async (text: string) => {
    setLoading4(true);
    setError4(null);
    try {
      const data = await generateEmbedding(text);
      const newPoint: GraphPoint = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        text: data.text,
        type: 'custom',
        color: '#f43f5e',
        coordinates: data.projection_3d,
        rawEmbedding: data.embedding,
        label: data.text,
      };

      setCustomPoints((prev) => [...prev, newPoint]);
    } catch (err: any) {
      setError4(err.message || 'Error generating point');
    } finally {
      setLoading4(false);
    }
  };

  const handleRemovePoint = (id: string) => {
    setCustomPoints((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearCustomPoints = () => {
    setCustomPoints([]);
  };

  // Construct consolidated points array for Section 3
  const sentence1Point = useMemo<GraphPoint | undefined>(() => {
    if (!sentence1Data) return undefined;
    return {
      id: 'sentence-1',
      text: sentence1Data.text,
      type: 'sentence1',
      color: '#3b82f6',
      coordinates: sentence1Data.projection_3d,
      rawEmbedding: sentence1Data.embedding,
      label: sentence1Data.text,
    };
  }, [sentence1Data]);

  const sentence2Point = useMemo<GraphPoint | undefined>(() => {
    if (!sentence2Data) return undefined;
    return {
      id: 'sentence-2',
      text: sentence2Data.text,
      type: 'sentence2',
      color: '#10b981',
      coordinates: sentence2Data.projection_3d,
      rawEmbedding: sentence2Data.embedding,
      label: sentence2Data.text,
    };
  }, [sentence2Data]);

  const allGraphPoints = useMemo<GraphPoint[]>(() => {
    const list: GraphPoint[] = [];
    if (sentence1Point) list.push(sentence1Point);
    if (sentence2Point) list.push(sentence2Point);
    return [...list, ...customPoints];
  }, [sentence1Point, sentence2Point, customPoints]);

  const bothEmbeddingsExist = Boolean(sentence1Point && sentence2Point);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 sm:px-8 py-3.5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 p-0.5 shadow-glow-blue flex items-center justify-center">
              <div className="w-full h-full bg-[#070b14] rounded-[10px] flex items-center justify-center">
                <Compass className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                AI Sentence Embedding Visualizer
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  v1.0
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Real-time 384D Transformer Vector Embeddings &amp; 3D Projection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Model Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Model:</span>
              <span className="text-white font-semibold">all-MiniLM-L6-v2</span>
              <span className="text-cyan-400 font-bold">(384D)</span>
            </div>

            {/* Backend Health Status */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium font-mono ${
                backendOnline === true
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                  : backendOnline === false
                  ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOnline === true
                    ? 'bg-emerald-400 animate-pulse'
                    : backendOnline === false
                    ? 'bg-rose-500'
                    : 'bg-amber-400'
                }`}
              />
              <span>{backendOnline ? 'Inference Engine Online' : 'Connecting to Backend...'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content: Single vertically scrolling page with 4 distinct sections */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Hero Banner / Educational Summary */}
        <div className="text-center py-4 max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs font-medium mb-1 shadow-glow-blue">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Educational Research Dashboard</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Explore How AI Embeds and Understands Sentences
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Witness how raw natural language is tokenized into vocabulary indices, mapped into a 384-dimensional continuous semantic space, and projected into an interactive 3D scatter plot without losing geometric integrity.
          </p>

          {/* Quick jump navigation pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
            <a
              href="#section-1"
              className="px-3 py-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/80 text-blue-300 flex items-center gap-1.5 transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Section 1: Sentence 1</span>
            </a>
            <a
              href="#section-2"
              className="px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/80 text-emerald-300 flex items-center gap-1.5 transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Section 2: Sentence 2 & Tokens</span>
            </a>
            <a
              href="#section-3"
              className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 text-cyan-300 flex items-center gap-1.5 transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Section 3: Interactive 3D Graph</span>
            </a>
            <a
              href="#section-4"
              className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/80 text-rose-300 flex items-center gap-1.5 transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Section 4: Add More Words</span>
            </a>
          </div>
        </div>

        {/* SECTION 1 — Sentence 1: Generate Embedding */}
        <Section1Embedding
          onGenerate={handleGenerateSentence1}
          loading={loading1}
          data={sentence1Data}
          error={error1}
        />

        {/* SECTION 2 — Sentence 2: Generate Tokens */}
        <Section2Tokens
          onTokenize={handleTokenizeSentence2}
          loading={loading2}
          tokenData={sentence2Data}
          sentence1Exists={Boolean(sentence1Data)}
          similarityData={similarityData}
          error={error2}
        />

        {/* SECTION 3 — Interactive 3D Embedding Visualization */}
        <Section3Visualization
          points={allGraphPoints}
          sentence1Point={sentence1Point}
          sentence2Point={sentence2Point}
          similarityData={similarityData}
          bothEmbeddingsExist={bothEmbeddingsExist}
        />

        {/* SECTION 4 — Add More Words or Sentences */}
        <Section4AddSentences
          onAddPoint={handleAddCustomPoint}
          loading={loading4}
          customPoints={customPoints}
          onRemovePoint={handleRemovePoint}
          onClearCustomPoints={handleClearCustomPoints}
          bothEmbeddingsExist={bothEmbeddingsExist}
          error={error4}
        />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-900 bg-[#050811] py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="font-semibold text-slate-400">AI Sentence Embedding Visualizer</span>
            <span>&bull; Powered by sentence-transformers, PyTorch, FastAPI, React & Three.js</span>
          </div>
          <div className="text-slate-600 font-mono text-[11px]">
            Model: all-MiniLM-L6-v2 | 384-dimensional dense vectors
          </div>
        </div>
      </footer>
    </div>
  );
};
