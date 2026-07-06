import os
import chromadb
from typing import List, Dict, Any

CHROMA_DB_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
COLLECTION_NAME = "documents"

class VectorStore:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(VectorStore, cls).__new__(cls)
            os.makedirs(CHROMA_DB_DIR, exist_ok=True)
            # Initialize persistent client
            cls._instance.client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
            # Get or create collection
            cls._instance.collection = cls._instance.client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"} # Use cosine similarity
            )
        return cls._instance

    def is_file_indexed(self, filename: str) -> bool:
        """
        Checks if the file is already indexed in ChromaDB.
        """
        results = self.collection.get(
            where={"filename": filename},
            limit=1
        )
        return len(results.get("ids", [])) > 0

    def add_chunks(self, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
        """
        Adds document chunks and their pre-computed embeddings to the vector database.
        """
        if not chunks:
            return
            
        ids = [chunk["chunk_id"] for chunk in chunks]
        documents = [chunk["chunk_text"] for chunk in chunks]
        metadatas = [
            {
                "page_number": chunk["page_number"],
                "filename": chunk["filename"]
            }
            for chunk in chunks
        ]
        
        # Add to ChromaDB
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )

    def query_similarity(self, query_embedding: List[float], filename: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Queries the vector store for the top_k most similar chunks, filtered by filename.
        """
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where={"filename": filename}
        )
        
        chunks = []
        if not results or not results["ids"] or len(results["ids"][0]) == 0:
            return chunks
            
        ids = results["ids"][0]
        documents = results["documents"][0]
        metadatas = results["metadatas"][0]
        
        for i in range(len(ids)):
            chunks.append({
                "chunk_id": ids[i],
                "text": documents[i],
                "page_number": metadatas[i]["page_number"],
                "filename": metadatas[i]["filename"]
            })
            
        return chunks

    def count_chunks_for_file(self, filename: str) -> int:
        """
        Returns the number of indexed chunks for a given filename.
        """
        results = self.collection.get(where={"filename": filename})
        return len(results.get("ids", []))

    def delete_file(self, filename: str):
        """
        Deletes all chunks associated with a filename.
        """
        self.collection.delete(where={"filename": filename})

# Global singleton client
_vector_store = None

def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store
