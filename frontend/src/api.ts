import { EmbeddingData, TokenizeData, SimilarityData } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchHealth(): Promise<{ status: string; model: string; embedding_dimensions: number }> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`Backend health check failed: ${res.statusText}`);
  }
  return res.json();
}

export async function generateEmbedding(text: string): Promise<EmbeddingData> {
  const res = await fetch(`${API_BASE_URL}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to generate embedding (${res.status})`);
  }

  return res.json();
}

export async function tokenizeSentence(text: string): Promise<TokenizeData> {
  const res = await fetch(`${API_BASE_URL}/tokenize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to tokenize sentence (${res.status})`);
  }

  return res.json();
}

export async function calculateSimilarity(
  embedding1: number[],
  embedding2: number[],
  text1?: string,
  text2?: string
): Promise<SimilarityData> {
  const res = await fetch(`${API_BASE_URL}/similarity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embedding1,
      embedding2,
      text1,
      text2,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to calculate similarity (${res.status})`);
  }

  return res.json();
}
