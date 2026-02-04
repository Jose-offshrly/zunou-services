from urllib.parse import urlparse
import os

def get_file_extension(s3_url: str):
    parsed_url = urlparse(s3_url)
    file_name = os.path.basename(parsed_url.path)
    file_extension = os.path.splitext(file_name)[1]

    return file_extension