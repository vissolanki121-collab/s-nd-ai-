export interface EmbeddingData {
  text: string;
  dimensions: number;
  embedding: number[];
  projection_3d: [number, number, number];
}

export interface TokenizeData {
  text: string;
  tokens: string[];
  token_ids: number[];
  token_count: number;
  char_count: number;
  dimensions: number;
  embedding: number[];
  projection_3d: [number, number, number];
}

export interface SimilarityData {
  similarity: number;
  percentage: number;
  dimensions: number;
  explanation: string;
}

export interface GraphPoint {
  id: string;
  text: string;
  type: 'sentence1' | 'sentence2' | 'custom';
  color: string;
  coordinates: [number, number, number];
  rawEmbedding: number[];
  label: string;
}
