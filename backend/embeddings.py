import logging
from typing import List
from fastembed import TextEmbedding

logger = logging.getLogger(__name__)

# BAAI/bge-small-en-v1.5 — 384 dims, ~25MB, no torch/CUDA needed
EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"


class EmbeddingModel:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            instance = super(EmbeddingModel, cls).__new__(cls)
            logger.info(f"Loading fastembed model '{EMBEDDING_MODEL}' (~25MB, no torch required) ...")
            instance.model = TextEmbedding(model_name=EMBEDDING_MODEL)
            logger.info("Embedding model loaded successfully.")
            cls._instance = instance
        return cls._instance

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = list(self.model.embed(texts))
        return [e.tolist() for e in embeddings]

    def embed_query(self, text: str) -> List[float]:
        embeddings = list(self.model.embed([text]))
        return embeddings[0].tolist()


_embedding_model = None


def get_embedding_model() -> EmbeddingModel:
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = EmbeddingModel()
    return _embedding_model
