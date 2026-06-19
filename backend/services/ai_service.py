from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import os
from dotenv import load_dotenv

load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME", "all-MiniLM-L6-v2")
model = None

def get_model():
    global model
    if model is None:
        print(f"Loading AI Model: {MODEL_NAME}...")
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(MODEL_NAME)
        print("AI Model loaded successfully.")
    return model

def encode_text(text: str) -> list[float]:
    m = get_model()
    embedding = m.encode(text)
    return embedding.tolist()

def calculate_similarity(vec1: list[float], vec2: list[float]) -> float:
    # reshape to 2D arrays for sklearn
    v1 = np.array(vec1).reshape(1, -1)
    v2 = np.array(vec2).reshape(1, -1)
    sim = cosine_similarity(v1, v2)
    return float(sim[0][0])

def update_centroid(old_centroid: list[float], n: int, new_vector: list[float]) -> list[float]:
    # Running mean: (old_mean * n + new_val) / (n + 1)
    old_np = np.array(old_centroid)
    new_np = np.array(new_vector)
    updated_np = (old_np * n + new_np) / (n + 1)
    return updated_np.tolist()
