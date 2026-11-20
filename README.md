# AI Sentence Embedding Visualizer

An interactive, full-stack educational AI web application that demonstrates:
- How LLM sentence embeddings work under the hood.
- How text is converted into high-dimensional numerical vectors (384 dimensions).
- How real model tokenization and subword token vocabulary IDs function.
- How semantic cosine similarity is calculated in high-dimensional vector space.
- How high-dimensional sentence representations are projected into an interactive 3D WebGL space using a mathematically stable, frozen PCA projection system.

Built from scratch with **React, TypeScript, Vite, Tailwind CSS, Three.js, Python, FastAPI, PyTorch, and sentence-transformers (`all-MiniLM-L6-v2`)**.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |       Input Sentence / Words         |
                      +-------------------+-------------------+
                                          |
                        [ HuggingFace AutoTokenizer ]
                                          |
                      +-------------------+-------------------+
                      | Tokens & IDs ([CLS], subwords, [SEP]) |
                      +-------------------+-------------------+
                                          |
                       [ all-MiniLM-L6-v2 Transformer ]
                                          |
                      +-------------------+-------------------+
                      |  High-Dimensional Vector (384-D)     |
                      +-------------------+-------------------+
                                          |
                 +------------------------+------------------------+
                 |                                                 |
                 v                                                 v
   [ Cosine Similarity in 384D ]                 [ Frozen Deterministic PCA Projection ]
   cos(θ) = (u · v) / (||u|| ||v||)              W ∈ ℝ^(3×384), μ ∈ ℝ^384
                 |                                                 |
                 v                                                 v
  Semantic Overlap Score & Meaning              [ Three.js Interactive 3D Scatter Plot ]
                                                 - Blue: Sentence 1
                                                 - Green: Sentence 2
                                                 - Red: Added Words / Sentences
```

### Key Technical & Mathematical Highlights

1. **Real Model Inference (No Mockups or Placeholders)**:
   - Uses `sentence-transformers/all-MiniLM-L6-v2` loaded once on startup.
   - Generates authentic 384-dimensional dense vectors with unit L2 normalization.
   - Real tokenization using WordPiece tokenizer (`AutoTokenizer.from_pretrained('sentence-transformers/all-MiniLM-L6-v2')`).

2. **Stable, Frozen 3D Projection**:
   - Reduces 384 dimensions to 3D via Principal Component Analysis (PCA) fitted on a curated, diverse reference semantic corpus (spanning tech, science, animals, emotion, culinary, literature, athletics, and economics).
   - The projection matrix $W \in \mathbb{R}^{3 \times 384}$ and mean vector $\mu \in \mathbb{R}^{384}$ are **frozen at startup**.
   - Every subsequent sentence is projected using the exact same basis eigenvectors:
     $$\mathbf{x}_{3D} = (\mathbf{v}_{384D} - \boldsymbol{\mu}) \cdot W^T \cdot \text{scale}$$
   - **Guarantees that existing points never move or shift when new points are added.**

3. **High-Dimensional Cosine Similarity**:
   - Cosine similarity is computed directly on the **original 384-dimensional vector space** using `scikit-learn` and `NumPy`, NOT on the lossy 3D coordinates.

4. **Rich 3D WebGL Visualization**:
   - Built with Three.js and OrbitControls.
   - Full 360° camera rotation, damping, pan, and smooth zoom.
   - Dual 3D coordinate grids with customized X, Y, Z axes.
   - Dynamic 3D billboard canvas text labels.
   - Interactive hover raycasting and click-to-inspect 384D vector drawer.
   - Dashed distance indicator between Sentence 1 and Sentence 2.

---

## Directory Structure

```
.
├── backend/
│   ├── main.py              # FastAPI app, model loading, endpoints, and frozen PCA projection
│   ├── requirements.txt     # Python dependencies
│   └── venv/                # Python virtual environment
├── frontend/
│   ├── index.html           # HTML entry point with dark theme
│   ├── package.json         # Node.js dependencies and scripts
│   ├── vite.config.ts       # Vite bundler configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration with glowing accents
│   ├── postcss.config.js    # PostCSS configuration
│   ├── tsconfig.json        # TypeScript configuration
│   └── src/
│       ├── main.tsx         # React root
│       ├── App.tsx          # Full dashboard state management and 4 sections layout
│       ├── api.ts           # REST API client
│       ├── types.ts         # TypeScript data contracts
│       ├── index.css        # Tailwind directives and glassmorphism styling
│       └── components/
│           ├── Section1Embedding.tsx      # Sentence 1 embedding & 384D vector viewer
│           ├── Section2Tokens.tsx         # Sentence 2 tokenization & similarity calculator
│           ├── Section3Visualization.tsx  # 3D interactive scatter plot container
│           ├── Section4AddSentences.tsx   # Add custom words/sentences (Red points)
│           └── EmbeddingVisualizer3D.tsx  # Three.js 3D canvas and OrbitControls scene
└── README.md
```

---

## Setup & Running Instructions

### Prerequisites
- Python 3.10+ (tested with Python 3.10, 3.11, 3.12, 3.14)
- Node.js 18+ and npm

### 1. Start the Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```
Backend runs on `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

### 2. Start the Frontend

Open another terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## Backend API Endpoints

- `GET /health` — Health check, active model name, and embedding dimensions.
- `POST /embed` — Generates 384-dimensional embedding and 3D projection for a sentence.
- `POST /tokenize` — Tokenizes sentence with actual tokenizer, returns token strings, IDs, char count, embedding, and 3D projection.
- `POST /similarity` — Computes cosine similarity between two 384D embeddings and returns score, percentage, and semantic interpretation.
- `POST /project` — Projects any 384D embedding into the frozen 3D coordinate space.
