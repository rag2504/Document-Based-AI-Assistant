import os

ALLOWED_EXTENSIONS = {".pdf", ".txt"}

def allowed_file(filename: str) -> bool:
    """
    Checks if the filename has an allowed extension.
    """
    _, ext = os.path.splitext(filename.lower())
    return ext in ALLOWED_EXTENSIONS

def ensure_directory(directory_path: str):
    """
    Ensures that a directory exists, creating it if necessary.
    """
    if not os.path.exists(directory_path):
        os.makedirs(directory_path, exist_ok=True)
