import os

def delete_file(file_path):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except PermissionError as e:
        print(f"PermissionError while deleting {file_path}: {e}")
    except FileNotFoundError as e:
        print(f"FileNotFoundError while deleting {file_path}: {e}")
