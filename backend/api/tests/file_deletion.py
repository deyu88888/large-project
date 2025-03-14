import os
import time

def delete_file(file_path):
    # Wait a bit for the file handle to be released
    time.sleep(0.5)
    try:
        os.remove(file_path)
    except PermissionError as e:
        print(f"PermissionError while deleting {file_path}: {e}")
    except FileNotFoundError as e:
        print(f"FileNotFoundError while deleting {file_path}: {e}")
