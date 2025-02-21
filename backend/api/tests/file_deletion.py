import os

def delete_file(file_path):
    """Deletes the file specified by file_path"""
    if os.path.exists(file_path):
        os.remove(file_path)
