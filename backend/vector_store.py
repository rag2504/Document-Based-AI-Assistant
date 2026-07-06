import os
from typing import List, Dict, Any
from supabase import create_client, Client  # type: ignore

class VectorStore:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(VectorStore, cls).__new__(cls)
            # Initialize Supabase client
            supabase_url = os.environ.get("SUPABASE_URL")
            supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
            
            if not supabase_url or not supabase_key:
                raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set.")
                
            cls._instance.client: Client = create_client(supabase_url, supabase_key)
        return cls._instance

    def is_file_indexed(self, filename: str, session_id: str) -> bool:
        """
        Checks if the file is already indexed in Supabase for the given session.
        """
        response = self.client.table("documents").select("id").eq("filename", filename).eq("session_id", session_id).execute()
        return len(response.data) > 0

    def add_chunks(self, chunks: List[Dict[str, Any]], embeddings: List[List[float]], session_id: str):
        """
        Adds document chunks and their pre-computed embeddings to the vector database.
        """
        if not chunks:
            return
            
        filename = chunks[0]["filename"]
        
        # 1. First, insert the document to get the document_id
        doc_response = self.client.table("documents").insert({
            "session_id": session_id,
            "filename": filename,
            "pages": max([c["page_number"] for c in chunks]),
            "chunk_count": len(chunks)
        }).execute()
        
        if not doc_response.data:
            raise Exception("Failed to insert document metadata")
            
        document_id = doc_response.data[0]["id"]
        
        # 2. Insert chunks with embeddings
        records = []
        for chunk, embedding in zip(chunks, embeddings):
            records.append({
                "document_id": document_id,
                "session_id": session_id,
                "filename": filename,
                "chunk_id": chunk["chunk_id"],
                "page_number": chunk["page_number"],
                "content": chunk["chunk_text"],
                "embedding": embedding
            })
            
        # Supabase API limits insertions to somewhat reasonable batch sizes.
        # We'll insert in batches of 100 to be safe.
        batch_size = 100
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            self.client.table("document_chunks").insert(batch).execute()

    def query_similarity(self, query_embedding: List[float], filename: str, session_id: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Queries the vector store for the top_k most similar chunks, filtered by filename and session_id.
        """
        response = self.client.rpc(
            "match_document_chunks",
            {
                "query_embedding": query_embedding,
                "match_count": top_k,
                "p_session_id": session_id,
                "p_filename": filename
            }
        ).execute()
        
        chunks = []
        if not response.data:
            return chunks
            
        for row in response.data:
            chunks.append({
                "chunk_id": row["chunk_id"],
                "text": row["content"],
                "page_number": row["page_number"],
                "filename": row["filename"]
            })
            
        return chunks

    def count_chunks_for_file(self, filename: str, session_id: str) -> int:
        """
        Returns the number of indexed chunks for a given filename and session_id.
        """
        response = self.client.table("documents").select("chunk_count").eq("filename", filename).eq("session_id", session_id).execute()
        if response.data:
            return response.data[0]["chunk_count"]
        return 0

    def delete_file(self, filename: str, session_id: str):
        """
        Deletes all chunks associated with a filename and session_id.
        """
        self.client.table("documents").delete().eq("filename", filename).eq("session_id", session_id).execute()

# Global singleton client
_vector_store = None

def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store
