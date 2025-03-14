import os

def delete_file(file_path):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except PermissionError as e:
        print(f"Cannot delete {file_path}: {e}")
