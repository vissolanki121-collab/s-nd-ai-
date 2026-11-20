import logging
from typing import List, Optional
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer
from sklearn.decomposition import PCA
from sklearn.metrics.pairwise import cosine_similarity

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sentence-embedding-app")

app = FastAPI(
    title="AI Sentence Embedding Visualizer API",
    description="Backend for real-time sentence embeddings, tokenization, cosine similarity, and 3D projections",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# Global references loaded at startup
model: Optional[SentenceTransformer] = None
tokenizer = None
pca_projector: Optional[PCA] = None
coord_scale: float = 1.0

# Curated reference semantic dataset used once to fit the fixed 3D PCA projection
REFERENCE_CORPUS = [
    # Technology, AI, Computer Science
    "Artificial intelligence and deep learning are transforming modern computing.",
    "Quantum computing utilizes qubits and quantum superposition.",
    "The software developer wrote clean and modular code in Python.",
    "The neural network was trained on millions of labeled images.",
    "Database indexing significantly accelerates SQL query execution.",
    # Biology, Nature, Animals
    "The golden retriever ran across the open grassy park.",
    "Dolphins are highly intelligent aquatic mammals that communicate with clicks.",
    "Dense tropical rainforests harbor extraordinary biological diversity.",
    "Photosynthesis converts sunlight, water, and carbon dioxide into glucose.",
    "The eagle soared gracefully high above the mountain ridges.",
    # Space, Astronomy, Physics
    "Stars and galaxies formed billions of years ago in the cosmic dawn.",
    "Gravitational waves ripple across spacetime following black hole mergers.",
    "The solar system consists of eight planets orbiting the Sun.",
    "Telescopes observe distant celestial bodies and cosmological phenomena.",
    "Thermodynamics dictates that entropy in an isolated system always increases.",
    # Emotion, Psychology, Human Experience
    "She felt an overwhelming sense of joy, gratitude, and inner peace.",
    "Grief and sorrow can take a long time to heal after a tragic loss.",
    "The intense anxiety subsided as he took slow, calming breaths.",
    "Empathy enables humans to connect deeply and understand others' perspectives.",
    "Laughter and humor bring warmth to social relationships.",
    # Food, Culinary Arts
    "Freshly baked sourdough bread has a crispy crust and chewy texture.",
    "The Italian chef prepared homemade pasta with aromatic basil and tomatoes.",
    "A hot cup of freshly brewed dark roast coffee energized the morning.",
    "Spicy street tacos served with fresh cilantro and lime wedges.",
    "Rich Belgian chocolate melts smoothly at room temperature.",
    # Music, Art, Literature
    "The symphony orchestra played Beethoven's fifth symphony with thunderous passion.",
    "The abstract oil painting featured bold strokes of cobalt and gold.",
    "Classical poetry employs rhyme, rhythm, and vivid metaphors.",
    "The jazz pianist improvised complex chord progressions.",
    "Sculptors shape raw marble into lifelike human figures.",
    # Sports, Fitness, Athletics
    "The marathon runner crossed the finish line after exhausting miles.",
    "Basketball players execute rapid passes and three-point shots.",
    "Swimming laps in an Olympic pool builds endurance and core strength.",
    "The gymnast executed a flawless dismount from the balance beam.",
    "Soccer is celebrated worldwide as the beautiful game.",
    # Economics, Finance, Business
    "Inflation rates and interest rate policies influence global currency markets.",
    "The startup venture raised capital from prominent investment funds.",
    "Stock market volatility fluctuates based on macroeconomic indicators.",
    "Supply chain bottlenecks created shortages across international trade.",
    "Corporate governance ensures fiduciary accountability to shareholders."
]


def init_projection(model_instance: SentenceTransformer):
    """
    Fits a mathematically valid 3D PCA projection once on a diverse reference corpus.
    This projection matrix and mean vector are then frozen for all future inference.
    """
    global pca_projector, coord_scale
    logger.info(f"Computing embeddings for {len(REFERENCE_CORPUS)} reference sentences...")
    ref_embeddings = model_instance.encode(REFERENCE_CORPUS, normalize_embeddings=True)
    
    logger.info("Fitting PCA(n_components=3) on reference embeddings...")
    pca = PCA(n_components=3, random_state=42)
    transformed = pca.fit_transform(ref_embeddings)
    
    # Calculate scale factor to comfortably place coordinates in a ~[-8, 8] box
    stds = np.std(transformed, axis=0)
    avg_std = float(np.mean(stds))
    scale = 4.0 / avg_std if avg_std > 0 else 1.0
    
    pca_projector = pca
    coord_scale = scale
    
    explained_var = pca.explained_variance_ratio_
    logger.info(
        f"Projection frozen. Explained variance ratio by 3 components: "
        f"{explained_var[0]:.3f}, {explained_var[1]:.3f}, {explained_var[2]:.3f} "
        f"(Total: {float(np.sum(explained_var))*100:.1f}%)"
    )


def project_embedding_to_3d(embedding: np.ndarray) -> List[float]:
    """
    Projects a single 384-dimensional embedding into 3D space using the frozen PCA.
    """
    if pca_projector is None:
        raise RuntimeError("PCA projector is not initialized.")
    
    emb_2d = np.array(embedding).reshape(1, -1)
    # Project using fixed PCA transformation
    proj_3d = pca_projector.transform(emb_2d)[0] * coord_scale
    # Return as standard Python floats rounded to 4 decimals
    return [round(float(c), 4) for c in proj_3d]


@app.on_event("startup")
def startup_event():
    """Load model, tokenizer, and initialize fixed projection on startup."""
    global model, tokenizer
    logger.info(f"Loading SentenceTransformer: {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    
    logger.info(f"Loading AutoTokenizer: {MODEL_NAME}...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    
    logger.info("Initializing stable 3D projection...")
    init_projection(model)
    logger.info("Startup complete. Backend ready for requests.")


# Request / Response Schemas
class EmbedRequest(BaseModel):
    text: str = Field(..., description="Sentence or text to embed")

class EmbedResponse(BaseModel):
    text: str
    dimensions: int
    embedding: List[float]
    projection_3d: List[float]

class TokenizeRequest(BaseModel):
    text: str = Field(..., description="Sentence or text to tokenize")

class TokenizeResponse(BaseModel):
    text: str
    tokens: List[str]
    token_ids: List[int]
    token_count: int
    char_count: int
    dimensions: int
    embedding: List[float]
    projection_3d: List[float]

class SimilarityRequest(BaseModel):
    embedding1: List[float]
    embedding2: List[float]
    text1: Optional[str] = None
    text2: Optional[str] = None

class SimilarityResponse(BaseModel):
    similarity: float
    percentage: float
    dimensions: int
    explanation: str

class ProjectRequest(BaseModel):
    embedding: List[float]

class ProjectResponse(BaseModel):
    projection_3d: List[float]


def get_similarity_explanation(score: float, text1: Optional[str] = None, text2: Optional[str] = None) -> str:
    """Provides an intuitive human-readable explanation of the cosine similarity score."""
    if score >= 0.85:
        return (
            f"Extremely high semantic similarity ({score:.3f}). "
            "These sentences convey nearly identical or very closely related concepts and contexts in 384-dimensional space."
        )
    elif score >= 0.70:
        return (
            f"Strong semantic alignment ({score:.3f}). "
            "The sentences share significant topical overlap, key themes, or direct contextual relationships."
        )
    elif score >= 0.50:
        return (
            f"Moderate semantic similarity ({score:.3f}). "
            "There are common thematic threads or shared conceptual categories, but distinct specific focuses or expressions."
        )
    elif score >= 0.30:
        return (
            f"Weak semantic correlation ({score:.3f}). "
            "The sentences come from loosely related domains or share minor vocabulary, but express mostly different ideas."
        )
    elif score >= 0.0:
        return (
            f"Low or negligible semantic similarity ({score:.3f}). "
            "These sentences refer to completely distinct domains, concepts, or vocabularies with virtually orthogonal vectors."
        )
    else:
        return (
            f"Negative semantic correlation ({score:.3f}). "
            "The vector angles diverge past 90 degrees in high-dimensional space, indicating opposing directions."
        )


@app.get("/health")
def health():
    return {
        "status": "online",
        "model": MODEL_NAME,
        "embedding_dimensions": 384,
        "projection_initialized": pca_projector is not None,
    }


@app.post("/embed", response_model=EmbedResponse)
def embed_text(req: EmbedRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Sentence text cannot be empty.")
    
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded.")
    
    try:
        # Generate real 384-d normalized embedding
        raw_embedding = model.encode(text, normalize_embeddings=True)
        embedding_list = [round(float(x), 6) for x in raw_embedding]
        
        # Project into 3D using frozen projection
        projection = project_embedding_to_3d(raw_embedding)
        
        return EmbedResponse(
            text=text,
            dimensions=len(embedding_list),
            embedding=embedding_list,
            projection_3d=projection,
        )
    except Exception as e:
        logger.error(f"Error generating embedding: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")


@app.post("/tokenize", response_model=TokenizeResponse)
def tokenize_text(req: TokenizeRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Sentence text cannot be empty.")
    
    if tokenizer is None or model is None:
        raise HTTPException(status_code=500, detail="Tokenizer or Model is not loaded.")
    
    try:
        # Actual model tokenization
        encoding = tokenizer(text, add_special_tokens=True)
        token_ids = encoding["input_ids"]
        tokens = tokenizer.convert_ids_to_tokens(token_ids)
        
        # Generate real 384-d normalized embedding for Sentence 2
        raw_embedding = model.encode(text, normalize_embeddings=True)
        embedding_list = [round(float(x), 6) for x in raw_embedding]
        
        # Project into 3D using frozen projection
        projection = project_embedding_to_3d(raw_embedding)
        
        return TokenizeResponse(
            text=text,
            tokens=tokens,
            token_ids=token_ids,
            token_count=len(token_ids),
            char_count=len(text),
            dimensions=len(embedding_list),
            embedding=embedding_list,
            projection_3d=projection,
        )
    except Exception as e:
        logger.error(f"Error in tokenization: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to tokenize sentence: {str(e)}")


@app.post("/similarity", response_model=SimilarityResponse)
def compute_similarity(req: SimilarityRequest):
    if not req.embedding1 or not req.embedding2:
        raise HTTPException(status_code=400, detail="Both embeddings must be provided.")
    
    if len(req.embedding1) != len(req.embedding2):
        raise HTTPException(
            status_code=400,
            detail=f"Embedding dimensions must match: got {len(req.embedding1)} and {len(req.embedding2)}."
        )
    
    try:
        vec1 = np.array(req.embedding1, dtype=np.float32).reshape(1, -1)
        vec2 = np.array(req.embedding2, dtype=np.float32).reshape(1, -1)
        
        # Calculate cosine similarity using scikit-learn in the ORIGINAL high-dimensional vector space
        sim_matrix = cosine_similarity(vec1, vec2)
        score = float(sim_matrix[0][0])
        # Clamp to [-1.0, 1.0] in case of floating point precision
        score = max(-1.0, min(1.0, score))
        
        percentage = round((score + 1.0) / 2.0 * 100, 2)  # Normalized percentage
        explanation = get_similarity_explanation(score, req.text1, req.text2)
        
        return SimilarityResponse(
            similarity=round(score, 4),
            percentage=percentage,
            dimensions=len(req.embedding1),
            explanation=explanation,
        )
    except Exception as e:
        logger.error(f"Error computing cosine similarity: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to compute similarity: {str(e)}")


@app.post("/project", response_model=ProjectResponse)
def project_vector(req: ProjectRequest):
    if not req.embedding or len(req.embedding) != 384:
        raise HTTPException(status_code=400, detail="Embedding must be a 384-dimensional vector.")
    
    try:
        arr = np.array(req.embedding, dtype=np.float32)
        proj = project_embedding_to_3d(arr)
        return ProjectResponse(projection_3d=proj)
    except Exception as e:
        logger.error(f"Error projecting embedding: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to project embedding: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
