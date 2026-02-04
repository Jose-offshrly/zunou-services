import os
import time
import boto3
import urllib.parse
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from typing import Optional

# Load environment variables
load_dotenv()

dynamodb = boto3.client('dynamodb', region_name='ap-northeast-1')

# Retrieve the API key
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
AWS_ACCESS_KEY_ID=os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY=os.getenv("AWS_SECRET_ACCESS_KEY")
ENVIRONMENT=os.getenv("ENVIRONMENT")

if not (ELEVENLABS_API_KEY and AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY):
    raise ValueError(
        "One or more environment variables not found. "
        "Please set the API key in your environment variables."
    )

client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

def download_dubbed_file(dubbing_id: str, language_code: str) -> str:
    """
    Downloads the dubbed file for a given dubbing ID and language code.

    Args:
        dubbing_id: The ID of the dubbing project.
        language_code: The language code for the dubbing.

    Returns:
        The file path to the downloaded dubbed file.
    """
    dir_path = f"data/{dubbing_id}"
    os.makedirs(dir_path, exist_ok=True)

    file_path = f"{dir_path}/{language_code}.mp4"
    with open(file_path, "wb") as file:
        for chunk in client.dubbing.get_dubbed_file(dubbing_id, language_code):
            file.write(chunk)

    return file_path

def download_s3_video(s3_url, local_directory_path, aws_access_key=AWS_ACCESS_KEY_ID, aws_secret_key=AWS_SECRET_ACCESS_KEY):
    """
    Downloads a video from an S3 URL to a local directory.

    Args:
        s3_url: The S3 URL of the file to download.
        local_directory_path: The local directory where the file will be saved.
        aws_access_key: AWS access key (optional).
        aws_secret_key: AWS secret key (optional).

    Returns:
        The local file path to the downloaded video.
    """
    # Parse the S3 URL to get the bucket name and key
    parsed_url = urllib.parse.urlparse(s3_url)
    bucket_name = parsed_url.netloc.split('.')[0]
    key = urllib.parse.unquote_plus(parsed_url.path.lstrip('/'))

    # Initialize the S3 client
    s3_client = boto3.client(
        's3',
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key
    )
    
    # Construct the local file path
    local_file_path = os.path.join(local_directory_path, key)

    # Ensure the full directory path exists
    os.makedirs(os.path.dirname(local_file_path), exist_ok=True)

    # Download the file
    s3_client.download_file(bucket_name, key, local_file_path)
    print(f"Downloaded {s3_url} to {local_file_path}")
    return local_file_path

def download_s3_video_as_temp(s3_url, local_file_path, aws_access_key=AWS_ACCESS_KEY_ID, aws_secret_key=AWS_SECRET_ACCESS_KEY):
    """
    Downloads a video from an S3 URL to a specified local file path.

    Args:
        s3_url (str): The S3 URL of the file to download.
        local_file_path (str): The local file path where the file will be saved (including filename).
        aws_access_key (str): AWS access key (optional).
        aws_secret_key (str): AWS secret key (optional).

    Returns:
        str: The local file path to the downloaded video.
    """
    # Parse the S3 URL to get the bucket name and key
    parsed_url = urllib.parse.urlparse(s3_url)
    bucket_name = parsed_url.netloc.split('.')[0]
    key = urllib.parse.unquote_plus(parsed_url.path.lstrip('/'))

    # Initialize the S3 client
    s3_client = boto3.client(
        's3',
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key
    )
    
    # Ensure the full directory path exists
    os.makedirs(os.path.dirname(local_file_path), exist_ok=True)

    # Download the file
    s3_client.download_file(bucket_name, key, local_file_path)
    print(f"Downloaded {s3_url} to {local_file_path}")
    return local_file_path

def upload_dubbed_file_to_s3(dubbing_id: str, language_code: str, bucket_name: str, s3_key: str) -> str:
    """
    Downloads the dubbed file for a given dubbing ID and language code
    and uploads it to an S3 bucket with correct metadata.

    Args:
        dubbing_id: The ID of the dubbing project.
        language_code: The language code for the dubbing.
        bucket_name: The name of the S3 bucket.
        s3_key: The full S3 object key (including file name).

    Returns:
        The S3 object URL of the uploaded file.
    """
    # Create the S3 client using the provided credentials
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )

    # Temporary local file path
    temp_file_path = f"/tmp/{language_code}.mp4"

    # Download the dubbed file locally
    with open(temp_file_path, "wb") as file:
        for chunk in client.dubbing.get_dubbed_file(dubbing_id, language_code):
            file.write(chunk)

    # Verify file type before upload
    import mimetypes
    mime_type = mimetypes.guess_type(temp_file_path)[0]
    if mime_type != 'video/mp4':
        print(f"Warning: MIME type mismatch. Detected: {mime_type}, expected: video/mp4.")

    # Upload the file to S3 with the correct MIME type
    s3_client.upload_file(
        temp_file_path,
        bucket_name,
        s3_key,
        ExtraArgs={'ContentType': 'video/mp4'}
    )

    # Remove the temporary file
    os.remove(temp_file_path)

    # Generate the S3 URL for the uploaded file
    s3_url = f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"
    
    return s3_url


import urllib.parse

def create_dub_from_file(
    input_file_path: str,
    file_format: str,
    source_language: str,
    target_language: str,
    target_file_path: str,
) -> Optional[str]:
    """
    Dubs an audio or video file from one language to another and saves the output.

    Args:
        input_file_path (str): The file path of the audio or video to dub.
        file_format (str): The file format of the input file.
        source_language (str): The language of the input file.
        target_language (str): The target language to dub into.
        target_file_path (str): The S3 URI (e.g., "s3://bucket-name/path/to/file.mp4") to store the dub.

    Returns:
        Optional[str]: The S3 URL of the dubbed file or None if operation failed.
    """
    if not os.path.isfile(input_file_path):
        raise FileNotFoundError(f"The input file does not exist: {input_file_path}")

    # Parse the S3 URI
    if not target_file_path.startswith("s3://"):
        raise ValueError(f"Invalid S3 path: {target_file_path}")
    
    parsed_s3_url = urllib.parse.urlparse(target_file_path)
    bucket_name = parsed_s3_url.netloc
    s3_key = parsed_s3_url.path.lstrip('/')

    with open(input_file_path, "rb") as audio_file:
        response = client.dubbing.dub_a_video_or_an_audio_file(
            file=(os.path.basename(input_file_path), audio_file, file_format),
            target_lang=target_language,
            source_lang=source_language,
            num_speakers=1,
            watermark=False,  # reduces the characters used if enabled, only works for videos not audio
        )

    dubbing_id = response.dubbing_id
    if wait_for_dubbing_completion(dubbing_id):
        # Upload the dubbed file to the specified S3 location
        s3_url = upload_dubbed_file_to_s3(
            dubbing_id=dubbing_id,
            language_code=target_language,
            bucket_name=bucket_name,
            s3_key=s3_key
        )
        return s3_url
    else:
        return None

def wait_for_dubbing_completion(dubbing_id: str, job_id: str) -> bool:
    """
    Waits for the dubbing process to complete by periodically checking the status.

    Args:
        dubbing_id (str): The dubbing project id.
        job_id (str): The job ID associated with this process.

    Returns:
        bool: True if the dubbing is successful, False otherwise.
    """
    MAX_ATTEMPTS = 120
    CHECK_INTERVAL = 10  # In seconds

    for _ in range(MAX_ATTEMPTS):
        try:
            metadata = client.dubbing.get_dubbing_project_metadata(dubbing_id)
            if metadata.status == "dubbed":
                # Update job status to completed
                set_job_status(job_id, "completed", "Dubbing successful.")
                return True
            elif metadata.status == "dubbing":
                # Update job status while still in progress
                set_job_status(job_id, "in_progress", "Dubbing in progress.")
                print(
                    "Dubbing in progress... Will check status again in",
                    CHECK_INTERVAL,
                    "seconds.",
                )
                time.sleep(CHECK_INTERVAL)
            else:
                print(f"Metadata: {metadata}")
                error_message = getattr(metadata, "message", "Unknown error occurred.")
                set_job_status(job_id, "failed", f"Dubbing failed: {error_message}")
                return False
        except Exception as e:
            # Log error and update job status
            set_job_status(job_id, "failed", f"Error during dubbing: {str(e)}")
            print("Error during dubbing:", str(e))
            return False

    # If the loop completes without success, update the status to timeout
    set_job_status(job_id, "failed", "Dubbing process timed out.")
    print("Dubbing timed out")
    return False

def get_table_name():
    """
    Construct the DynamoDB table name based on the environment.
    """
    return f"zunou-pulse-dubbing-{ENVIRONMENT}"

def set_job_status(job_id, status, message=None, url=None):
    """
    Store job status in DynamoDB.
    """
    table_name = get_table_name()
    item = {
        'job_id': {'S': job_id},
        'status': {'S': status},
        'message': {'S': message or ""},
        'url': {'S': url or ""},
    }
    dynamodb.put_item(TableName=table_name, Item=item)


def get_job_status(job_id):
    """
    Retrieve job status from DynamoDB.
    """
    table_name = get_table_name()
    response = dynamodb.get_item(
        TableName=table_name,
        Key={'job_id': {'S': job_id}}
    )
    if 'Item' in response:
        return {
            'status': response['Item']['status']['S'],
            'message': response['Item']['message']['S'],
            'url': response['Item']['url']['S'],
        }
    return None

#bump