import os
import logging
from typing import List
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "all-MiniLM-L6-v2"


class EmbeddingModel:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            instance = super(EmbeddingModel, cls).__new__(cls)
            logger.info(f"Loading local SentenceTransformer model '{EMBEDDING_MODEL}' (384 dimensions) ...")
            instance.model = SentenceTransformer(EMBEDDING_MODEL)
            logger.info("Local SentenceTransformer model loaded successfully.")
            cls._instance = instance
        return cls._instance

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()

    def embed_query(self, text: str) -> List[float]:
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()


_embedding_model = None


def get_embedding_model() -> EmbeddingModel:
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = EmbeddingModel()
    return _embedding_model
