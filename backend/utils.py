import os

ALLOWED_EXTENSIONS = {".pdf", ".txt"}
ALLOWED_MIME_TYPES = {"application/pdf", "text/plain"}

def allowed_file(filename: str) -> bool:
    """
    Checks if the filename has an allowed extension.
    """
    _, ext = os.path.splitext(filename.lower())
    return ext in ALLOWED_EXTENSIONS

def validate_file_content(filename: str, content_type: str, first_bytes: bytes) -> bool:
    """
    Validates file extension, MIME type, and magic bytes.
    """
    _, ext = os.path.splitext(filename.lower())
    ext = ext.lower()
    
    # 1. Validate extension
    if ext not in ALLOWED_EXTENSIONS:
        return False
        
    # 2. Validate MIME type (if provided)
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        return False
        
    # 3. Validate Magic Bytes
    if ext == ".pdf":
        # PDFs must start with %PDF- (hex: 25 50 44 46 2d)
        if not first_bytes.startswith(b"%PDF-"):
            return False
    elif ext == ".txt":
        # TXT files should be decodable as UTF-8 text (or at least ASCII)
        try:
            first_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return False
            
    return True

def ensure_directory(directory_path: str):
    """
    Ensures that a directory exists, creating it if necessary.
    """
    if not os.path.exists(directory_path):
        os.makedirs(directory_path, exist_ok=True)

class InvalidAPIKeyError(ValueError):
    """Raised when the GROQ_API_KEY has an invalid format (e.g. doesn't start with gsk_)."""
    pass

def validate_groq_api_key(api_key: str):
    if not api_key:
        raise InvalidAPIKeyError("GROQ_API_KEY is not set. Add it to backend/.env and restart.")
    
    api_key_stripped = api_key.strip()
    if not api_key_stripped.startswith("gsk_"):
        raise InvalidAPIKeyError(
            "GROQ_API_KEY must start with 'gsk_'. Please generate a valid Groq API key "
            "at https://console.groq.com/keys and update your backend/.env file."
        )

