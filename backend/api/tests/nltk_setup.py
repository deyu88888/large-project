import nltk
import os

def ensure_punkt_downloaded():
    nltk_data_path = os.environ.get("NLTK_DATA", "/home/runner/nltk_data")
    if nltk_data_path not in nltk.data.path:
        nltk.data.path.append(nltk_data_path)

    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt', download_dir=nltk_data_path, quiet=True)