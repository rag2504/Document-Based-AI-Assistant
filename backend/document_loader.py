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

def load_pdf_from_bytes(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    """
    Extracts text page-by-page from PDF bytes in memory.
    """
    pages_data = []
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text()
            pages_data.append({
                "text": text,
                "page_number": page_num + 1,
                "filename": filename
            })
    except Exception as e:
        print(f"Error loading PDF from bytes: {e}")
        raise e
    return pages_data

def load_txt_from_bytes(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    """
    Reads text content from TXT bytes in memory.
    """
    try:
        text = file_bytes.decode("utf-8", errors="ignore")
        return [{
            "text": text,
            "page_number": 1,
            "filename": filename
        }]
    except Exception as e:
        print(f"Error loading TXT from bytes: {e}")
        raise e

def chunk_document(pages_data: List[Dict[str, Any]], chunk_size: int = 700, chunk_overlap: int = 150) -> List[Dict[str, Any]]:
    """
    Splits text from pages into chunks with specified size and overlap.
    Snaps split points to the nearest whitespace to prevent word clipping.
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
            
            # Snap to nearest whitespace backwards if we aren't at the end of the text
            if end < len(text):
                search_limit = max(start, end - 100)
                space_idx = end
                while space_idx > search_limit:
                    if text[space_idx].isspace():
                        end = space_idx
                        break
                    space_idx -= 1
            
            chunk_text = text[start:end].strip()
            if chunk_text:
                page_chunks.append(chunk_text)
                
            if end >= len(text):
                break
                
            # Advance start by (chunk_size - chunk_overlap)
            next_start = end - chunk_overlap
            # Safety checks to prevent infinite loops if chunk size / overlap values are invalid
            if next_start <= start:
                next_start = start + 1
            start = next_start
            
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

def load_and_chunk_bytes(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    """
    Helper function to load document bytes from memory and chunk it.
    """
    _, ext = os.path.splitext(filename.lower())
    if ext == ".pdf":
        pages_data = load_pdf_from_bytes(file_bytes, filename)
    elif ext == ".txt":
        pages_data = load_txt_from_bytes(file_bytes, filename)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")
        
    return chunk_document(pages_data)
