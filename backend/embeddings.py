from sentence_transformers import SentenceTransformer
from typing import List

class EmbeddingModel:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(EmbeddingModel, cls).__new__(cls)
            # Load the model lazily on first instantiation
            cls._instance.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        return cls._instance

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of document chunks.
        """
        embeddings = self.model.encode(texts, show_progress_bar=False)
        return embeddings.tolist()

    def embed_query(self, text: str) -> List[float]:
        """
        Generate embedding for a single user query.
        """
        embedding = self.model.encode([text], show_progress_bar=False)
        return embedding[0].tolist()

# Global instance for ease of use
_embedding_model = None

def get_embedding_model() -> EmbeddingModel:
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = EmbeddingModel()
    return _embedding_model
