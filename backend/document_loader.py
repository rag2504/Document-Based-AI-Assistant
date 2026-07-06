import os
import fitz  # PyMuPDF
from typing import List, Dict, Any

def load_pdf(file_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text page-by-page from a PDF using PyMuPDF.
    """
    pages_data = []
    filename = os.path.basename(file_path)
    
    try:
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text()
            # Clean up whitespace slightly but keep formatting
            pages_data.append({
                "text": text,
                "page_number": page_num + 1,
                "filename": filename
            })
    except Exception as e:
        print(f"Error loading PDF {file_path}: {e}")
        raise e
        
    return pages_data

def load_txt(file_path: str) -> List[Dict[str, Any]]:
    """
    Reads text content from a TXT file.
    """
    filename = os.path.basename(file_path)
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        return [{
            "text": text,
            "page_number": 1,
            "filename": filename
        }]
    except Exception as e:
        print(f"Error loading TXT {file_path}: {e}")
        raise e

def chunk_document(pages_data: List[Dict[str, Any]], chunk_size: int = 700, chunk_overlap: int = 150) -> List[Dict[str, Any]]:
    """
    Splits text from pages into chunks with specified size and overlap.
    Retains page number and filename in metadata.
    """
    chunks = []
    global_chunk_count = 0
    
    for page in pages_data:
        text = page["text"].strip()
        if not text:
            continue
            
        page_num = page["page_number"]
        filename = page["filename"]
        
        # Slide window across the page text
        start = 0
        page_chunks = []
        
        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end]
            
            # Save chunk text and metadata
            page_chunks.append(chunk_text)
            
            if end >= len(text):
                break
            # Advance start by step size (chunk_size - chunk_overlap)
            start += (chunk_size - chunk_overlap)
            
        # Add to global chunks list with unique chunk IDs
        for idx, chunk_text in enumerate(page_chunks):
            global_chunk_count += 1
            chunks.append({
                "chunk_id": f"{filename}_chunk_{global_chunk_count}",
                "page_number": page_num,
                "filename": filename,
                "chunk_text": chunk_text
            })
            
    return chunks

def load_and_chunk_file(file_path: str) -> List[Dict[str, Any]]:
    """
    Helper function to load a document by extension and chunk it.
    """
    _, ext = os.path.splitext(file_path.lower())
    if ext == ".pdf":
        pages_data = load_pdf(file_path)
    elif ext == ".txt":
        pages_data = load_txt(file_path)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")
        
    return chunk_document(pages_data)
