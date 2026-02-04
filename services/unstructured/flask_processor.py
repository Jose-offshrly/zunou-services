import os
import json
import logging
import uuid
import shutil
import psycopg2
import threading
import boto3
import json
from html.parser import HTMLParser

from flask import Flask, request, jsonify
from unstructured_ingest.v2.pipeline.pipeline import Pipeline
from unstructured_ingest.v2.interfaces import ProcessorConfig
from unstructured_ingest.v2.processes.connectors.fsspec.s3 import (
    S3IndexerConfig,
    S3DownloaderConfig,
    S3ConnectionConfig,
    S3AccessConfig
)
from unstructured_ingest.v2.processes.partitioner import PartitionerConfig
from unstructured_ingest.v2.processes.chunker import ChunkerConfig
from unstructured_ingest.v2.processes.embedder import EmbedderConfig
from unstructured_ingest.v2.processes.connectors.local import LocalUploaderConfig
from chunker import Chunker
from pathlib import Path
from pinecone import Pinecone
from cachetools import TTLCache
import openai 
from openai import OpenAI
from utils.dub_utils import *
from utils.openai_utils import *
from utils import utils
from datetime import datetime

# Versioning
development_version = 'unknown'
production_version = '0.0.0'
staging_version = '70.0.0-staging.1'

current_version = staging_version

WORK_DIR = '/app/working'  # Adjust this to your local working directory

# Cache for storing index descriptions (TTL set to 1 hour)
index_description_cache = TTLCache(maxsize=100, ttl=3600)

# Initialize Flask app
app = Flask(__name__)

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logging.info('Flask Processor with S3 integration running.')

# Database connection details from environment variables
POSTGRES_DB_HOST = os.getenv('POSTGRES_DB_HOST')
POSTGRES_DB_PORT = os.getenv('POSTGRES_DB_PORT', 5432)
POSTGRES_DB_DATABASE = os.getenv('POSTGRES_DB_DATABASE')
POSTGRES_DB_USERNAME = os.getenv('POSTGRES_DB_USERNAME')
POSTGRES_DB_PASSWORD = os.getenv('POSTGRES_DB_PASSWORD')

# OpenAI model from environment variables
OPENAI_EMBEDDING_MODEL = os.getenv('OPENAI_EMBEDDING_MODEL')

# Function to create a directory for the data_source_id
def create_data_source_directory(base_dir, data_source_id):
    dir_path = os.path.join(base_dir, data_source_id)
    os.makedirs(dir_path, exist_ok=True)
    return dir_path

# Function to ensure metadata values are in Pinecone-compatible format and clean up unnecessary fields
def sanitize_metadata(entry):
    # Remove fields we don't need
    entry["metadata"].pop("data_source", None)
    entry["metadata"].pop("filetype", None)
    entry["metadata"].pop("orig_elements", None)

    # Ensure text field is retained
    entry["metadata"]["text"] = entry["text"]

    sanitized_metadata = {}
    for key, value in entry["metadata"].items():
        if isinstance(value, (str, int, float, bool)):
            sanitized_metadata[key] = value
        elif isinstance(value, list) and all(isinstance(i, str) for i in value):
            sanitized_metadata[key] = value
        else:
            # Convert non-compatible types to string
            sanitized_metadata[key] = str(value)
    return sanitized_metadata

# Function to clean up local files and directories
def cleanup_local_files(dir_path):
    try:
        shutil.rmtree(dir_path)
        logging.info(f"Successfully cleaned up local directory: {dir_path}")
    except Exception as e:
        logging.error(f"Error during cleanup: {e}")

def get_first_json_file(directory):
    for root, dirs, files in os.walk(directory):
        for filename in files:
            if filename.endswith(".json"):
                return os.path.join(root, filename)
    raise Exception("No chunks")

# Function to set Pinecone index host
def set_index_host(pc, index_name):
    """
    Set the Pinecone index host dynamically based on the index name.
    The function caches the index description to avoid repeated API calls.
    """
    if index_name in index_description_cache:
        index_desc = index_description_cache[index_name]
        logging.info(f"Using cached index description for: {index_name}")
    else:
        try:
            # Fetch the index description
            index_desc = pc.describe_index(index_name)
            logging.info(f"Retrieved index description for: {index_name}")
            
            # Cache the index description
            index_description_cache[index_name] = index_desc
        except Exception as e:
            logging.error(f"Error retrieving index description for {index_name}: {e}")
            raise Exception(f"Failed to describe index: {index_name}")
    
    # Access the host directly from the root of the index description
    index_host = index_desc.get('host')
    if not index_host:
        raise Exception(f"Index host not found in index description for {index_name}")
    
    full_index_host = f"https://{index_host}"
    logging.info(f"Setting index host to: {full_index_host}")
    
    # Set the index host for the Pinecone client
    pc.Index(host=full_index_host)
    return pc

# Function to get summary using OpenAI
def generate_summary(full_text):
    client = OpenAI(
      api_key=os.environ.get("OPENAI_API_KEY"),  # This is the default and can be omitted
    )
    try:
        model = os.getenv("OPENAI_SUMMARY_MODEL")
        if not model:
            raise ValueError("The OPENAI_SUMMARY_MODEL environment variable is not set.")

        # handle data source content that is not meaningful
        prompt = f"""
        Generate a summary of the given text below. Maintain the original structure and flow while condensing the information into a clear, concise overview. Do NOT use bullet points or MARKDOWN formatting - present the summary in less than 5 sentences. Return the summary only without any other text. 

        If text is a meeting transcript, Include all key details such as project names, dates, timelines, participants, decisions, and action items.

        If the text has little or no meaningful content, still provide a brief summary that reflects exactly what is written. Summarize ONLY the information explicitly found in the user's text. Do not add or assume any details not present in the text. DO not add or mention your training data. Focus only the text provided to you below.

        Text:
        {full_text}
        """
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": prompt}
            ],
        )
        summary = response.choices[0].message.content.strip()
        print("Generated summary:", summary)  # Optional debug print
        return summary
    except Exception as e:
        logging.error(f"Error generating summary with OpenAI: {e}")
        raise Exception("Failed to generate summary.")

# Function to store summary in the database
def set_fields_in_db(data_source_id, token_count, summary=None):
    try:
        conn = psycopg2.connect(
            dbname=POSTGRES_DB_DATABASE,
            user=POSTGRES_DB_USERNAME,
            password=POSTGRES_DB_PASSWORD,
            host=POSTGRES_DB_HOST,
            port=POSTGRES_DB_PORT
        )
        cursor = conn.cursor()

        if summary is not None:
            update_query = """
                UPDATE public.data_sources
                SET token_count = %s, summary = %s
                WHERE id = %s;
            """
            cursor.execute(update_query, (token_count, summary, data_source_id))
        else:
            update_query = """
                UPDATE public.data_sources
                SET token_count = %s
                WHERE id = %s;
            """
            cursor.execute(update_query, (token_count, data_source_id))
        conn.commit()
        cursor.close()
        conn.close()
        logging.info(f"Summary stored successfully for data_source_id: {data_source_id}")
    except Exception as e:
        logging.error(f"Error storing summary in the database: {e}")
        raise Exception("Failed to store summary in the database.")

def get_datasource_by_id(data_source_id):
    try:
        # Connect to the PostgreSQL database
        conn = psycopg2.connect(
            dbname=POSTGRES_DB_DATABASE,
            user=POSTGRES_DB_USERNAME,
            password=POSTGRES_DB_PASSWORD,
            host=POSTGRES_DB_HOST,
            port=POSTGRES_DB_PORT
        )
        cursor = conn.cursor()

        # Define the query to retrieve the data source by ID
        select_query = """
            SELECT id, name, origin
            FROM public.data_sources
            WHERE id = %s;
        """
        
        # Execute the query with the provided data_source_id
        cursor.execute(select_query, (data_source_id,))
        
        # Fetch the result
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()

        if result:
            # Return a dictionary with the data source details
            return {
                'id': result[0],
                'name': result[1],
                'origin': result[2]
            }
        else:
            logging.warning(f"No data source found with id: {data_source_id}")
            return None

    except Exception as e:
        logging.error(f"Error retrieving data source by id {data_source_id}: {e}")
        raise Exception("Failed to retrieve data source.")

def get_meeting_by_datasource(data_source_id):
    try:
        # Connect to the PostgreSQL database
        conn = psycopg2.connect(
            dbname=POSTGRES_DB_DATABASE,
            user=POSTGRES_DB_USERNAME,
            password=POSTGRES_DB_PASSWORD,
            host=POSTGRES_DB_HOST,
            port=POSTGRES_DB_PORT
        )
        cursor = conn.cursor()

        # Define the query to retrieve the data source by ID
        select_query = """
            SELECT id, date, source
            FROM public.meetings
            WHERE data_source_id = %s;
        """
        
        # Execute the query with the provided data_source_id
        cursor.execute(select_query, (data_source_id,))
        
        # Fetch the result
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()

        if result:
            # Return a dictionary with the data source details
            return {
                'id': result[0],
                'date': result[1],
                'source': result[2]
            }
        else:
            logging.warning(f"No meeting found with id: {data_source_id}")
            return None

    except Exception as e:
        logging.error(f"Error retrieving meeting by id {data_source_id}: {e}")
        raise Exception("Failed to retrieve meeting.")

def strip_tags(text: str):
    parser = HTMLParser()
    result = []
    parser.handle_data = result.append
    parser.feed(text)
    return ''.join(result)

def add_embeddings_to_chunks(file_path):
    try:
        token_limit = 8000
        with open(file_path, "r") as file:
            data = json.load(file)
        
            batches = []
            current_batch = []
            current_tokens = 0

            # Accumulate text until the batch is under the token limit
            for item in data:
                if item["text"] == "":
                    html_text = item["metadata"].get("text_as_html", "")
                    stripped = strip_tags(html_text) if html_text else ""
                    if stripped:
                        item["text"] = stripped
                    else:
                        continue

                text = item["text"]
                text_tokens = count_tokens(text)
                if current_tokens + text_tokens > token_limit:
                    batches.append(current_batch)
                    current_batch = []
                    current_tokens = 0

                current_batch.append(item)
                current_tokens += text_tokens

            if current_batch:
                logging.info("saving the remainder batch")
                batches.append(current_batch)

            # Process batches
            for batch in batches:
                texts = [item["text"] for item in batch]
                response = create_embeddings(texts)

                embeddings = [res.embedding for res in response.data]

                # Assign embeddings back to respective items
                for item, embedding in zip(batch, embeddings):
                    item["embeddings"] = embedding
        
        with open(file_path, "w") as file:
            json.dump(data, file, indent=2)
    except BaseException as e:
        logging.error(str(e))
    
# Define an endpoint to trigger the full pipeline process
@app.route('/process', methods=['POST'])
def process_and_upload():
    try:
        logging.info("Starting full pipeline process...")

        # Get parameters from the request
        s3_url = request.json.get("s3_url")
        pinecone_index_name = request.json.get("pinecone_index_name")
        data_source_id = request.json.get("data_source_id")
        data_source_type = request.json.get("data_source_type")
        pulse_id = request.json.get("pulse_id")  # New parameter for namespace

        # Check if all required parameters are provided
        if not s3_url:
            raise ValueError("Missing s3_url in request")
        if not pinecone_index_name:
            raise ValueError("Missing pinecone_index_name in request")
        if not data_source_id:
            raise ValueError("Missing data_source_id in request")
        if not data_source_type:
            raise ValueError("Missing data_source_type in request")    
        if not pulse_id:
            raise ValueError("Missing pulse_id in request")

        logging.info(f"Received S3 URL: {s3_url}")
        logging.info(f"Received Pinecone Index Name: {pinecone_index_name}")
        logging.info(f"Received Data Source ID: {data_source_id}")
        logging.info(f"Received Pulse ID: {pulse_id}")

        # Create a directory for the data_source_id
        logging.info("Creating directory for data_source_id...")
        output_dir = create_data_source_directory(WORK_DIR, data_source_id)
        chunk_dir = os.path.join(output_dir, 'chunks')  # Directory for storing chunked files
        os.makedirs(chunk_dir, exist_ok=True)

        # Stage 1: Download, chunk, and embed the file
        logging.info("Stage 1: Downloading, chunking, and embedding the file...")

        file_type = utils.get_file_extension(s3_url=s3_url)
        strategy = "vlm" if file_type in [".pdf", ".pptx", ".ppt"] else "auto"
        logging.info(f"Type {file_type} received, using {strategy} strategy")

        if strategy is "vlm":
            chunkerConfig = None
        else:
            chunkerConfig = ChunkerConfig(
                chunking_strategy="by_title",
                chunk_max_characters=1500,
                chunk_overlap=150,
            )

        Pipeline.from_configs(
            context=ProcessorConfig(
                verbose=True, tqdm=True, num_processes=5, work_dir=output_dir
            ),
            indexer_config=S3IndexerConfig(remote_url=s3_url),
            downloader_config=S3DownloaderConfig(),
            source_connection_config=S3ConnectionConfig(
                access_config=S3AccessConfig(
                    key=os.getenv("AWS_ACCESS_KEY_ID"),
                    secret=os.getenv("AWS_SECRET_ACCESS_KEY")
                )
            ),
            partitioner_config=PartitionerConfig(
                partition_by_api=True,
                api_key=os.getenv("UNSTRUCTURED_API_KEY"),
                partition_endpoint=os.getenv("UNSTRUCTURED_API_URL"),
                strategy=strategy,
                additional_partition_args={
                    "split_pdf_page": True,
                    "split_pdf_allow_failed": True,
                    "split_pdf_concurrency_level": 15,
                },
            ),
            chunker_config=chunkerConfig,
            # embedder_config=EmbedderConfig(
            #     embedding_provider="openai",
            #     embedding_model_name=OPENAI_EMBEDDING_MODEL,
            #     embedding_api_key=os.getenv("OPENAI_API_KEY")
            # ),
            uploader_config=LocalUploaderConfig(output_dir=chunk_dir)  # Save chunks locally in the directory
        ).run()

        if strategy == "vlm":
            logging.info("Running manual chunker")
            # do manual chunking if working with pdfs
            try:
                file = Path(get_first_json_file(chunk_dir))

                output_dir_path = Path(output_dir)
                pages_output_dir = output_dir_path / 'pages'

                _chunker = Chunker(output_dir=Path(pages_output_dir), chunking_strategy="by_title", chunk_max_characters=1500, chunk_overlap=150)
                _chunker.run(elements_filepath=file)
            except BaseException as e:
                logging.error(f"manual chunker fails: {str(e)}")
        
        logging.info("Stage 1 completed: File processed, chunked, and embedded.")

        # Stage 1.5: Generate and store summary
        logging.info("Stage 1.5: Generating and storing summary...")
        full_text = ""
        for root, dirs, files in os.walk(chunk_dir):
            for filename in files:
                if filename.endswith(".json"):
                    file_path = os.path.join(root, filename)
                    with open(file_path, "r") as file:
                        data = json.load(file)
                        full_text += " ".join(entry["text"] for entry in data)

        token_count = count_tokens(full_text)
        logging.info(f"Total tokens {token_count}")
        
        datasource_record = get_datasource_by_id(data_source_id)
        if datasource_record is None:
            logging.error(f"Bad request: Data source not found")
            return jsonify({"error": "Data source not found"}), 400
        
        meeting_record = get_meeting_by_datasource(data_source_id)


        token_limit = 128_000
        if datasource_record and datasource_record.get("origin") != "meeting":
            if token_count > token_limit:
                full_text = full_text[:2000] # incase file is too large
            summary = generate_summary(full_text)
            set_fields_in_db(data_source_id, token_count, summary)
        else:
            set_fields_in_db(data_source_id, token_count, summary=None)

        logging.info("Summary generation and storage completed.")


        # Stage 2: Add metadata and upload to Pinecone
        logging.info("Stage 2: Adding metadata and uploading to Pinecone...")
        
        # Initialize list to store generated vector IDs
        vector_ids = []

        def add_metadata_to_chunks(file_path):
            with open(file_path, "r") as file:
                data = json.load(file)
            previous_page_number = None
            previous_chunk_number = -1
            # Add custom metadata and generate a unique ID for each chunk
            for entry in data:
                if entry["metadata"].get("page_number"):
                    current_page_number = entry["metadata"]["page_number"]
                else:
                    current_page_number = 1
                    entry["metadata"]["page_number"] = current_page_number
                if previous_page_number is None:
                    previous_page_number = current_page_number
                if current_page_number != previous_page_number:
                    previous_page_number = current_page_number
                    previous_chunk_number = 0
                else:
                    previous_chunk_number += 1
                if datasource_record.get("name"):
                    entry["metadata"]["filename"] = datasource_record.get("name") + file_type
                entry["metadata"]["chunk_number"] = previous_chunk_number
                entry["metadata"]["data_source_id"] = data_source_id
                entry["metadata"]["data_source_type"] = data_source_type
                entry["metadata"]["data_source_origin"] = datasource_record.get("origin")
                entry["metadata"]["document_token_count"] = token_count
                # meeting specific metadata
                if (meeting_record and meeting_record.get("date")):
                    entry["metadata"]["datetime"] = meeting_record.get("date").timestamp()
                    entry["metadata"]["date"] = datetime(
                        meeting_record["date"].year,
                        meeting_record["date"].month,
                        meeting_record["date"].day
                    ).timestamp()
                # Sanitize metadata and retain the text field
                entry["metadata"] = sanitize_metadata(entry)
                # Generate a unique ID for each chunk
                entry["id"] = str(uuid.uuid4())
            with open(file_path, "w") as file:
                json.dump(data, file, indent=2)

        # Process all JSON files and add metadata to each chunk
        for root, dirs, files in os.walk(chunk_dir):
            for filename in files:
                if filename.endswith(".json"):
                    file_path = os.path.join(root, filename)
                    logging.info(f"Processing file {filename} for metadata addition")
                    add_metadata_to_chunks(file_path)
                    add_embeddings_to_chunks(file_path)
       
        # Initialize Pinecone and upload the updated chunks
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        pc = set_index_host(pc, pinecone_index_name)
        pinecone_index = pc.Index(pinecone_index_name)

        for root, dirs, files in os.walk(chunk_dir):
            for filename in files:
                if filename.endswith(".json"):
                    file_path = os.path.join(root, filename)
                    with open(file_path, "r") as file:
                        data = json.load(file)
                    upserts = []
                    temp_ids = []
                    for entry in data:
                        upsert_item = {
                            "id": entry["id"],
                            "values": entry["embeddings"],
                            "metadata": entry["metadata"]
                        }
                        upserts.append(upsert_item)
                        temp_ids.append(entry["id"])
                    # Upload to Pinecone with the namespace set as pulse_id
                    batch_size = 100

                    for i in range(0, len(upserts), batch_size):
                        batch = upserts[i:i + batch_size]
                        pinecone_index.upsert(vectors=batch, namespace=pulse_id)
                    # Collect the vector IDs for this JSON file
                    vector_ids.extend(temp_ids)
                    logging.info(f"Uploaded {filename} to Pinecone with namespace: {pulse_id}")

        logging.info("Stage 2 completed: Metadata added and uploaded to Pinecone.")

        # Return the vector IDs along with a success message
        return jsonify({
            "message": "File processed, metadata added, and uploaded to Pinecone successfully",
            "vector_ids": vector_ids
        }), 200

    except ValueError as e:
        logging.error(f"Bad request: {e}")
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        logging.error(f"An error occurred: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500
    
    finally:
        # Cleanup local files, make to cleanup even if the request fail
        logging.info("Cleaning up local files...")
        cleanup_local_files(output_dir)

# Endpoint for Elevenlabs dubbing
def async_dub_process(job_id, source_s3_url, target_s3_url, source_language, target_language):
    try:
        set_job_status(job_id, "in_progress", "Dubbing started.")

        file_path = download_s3_video_as_temp(source_s3_url, 'temp/temp.mp4')

        response = client.dubbing.dub_a_video_or_an_audio_file(
            file=(os.path.basename(file_path), open(file_path, "rb"), "video/mp4"),
            target_lang=target_language,
            source_lang=source_language,
        )

        dubbing_id = response.dubbing_id

        if wait_for_dubbing_completion(dubbing_id, job_id):
            s3_url = upload_dubbed_file_to_s3(
                dubbing_id=dubbing_id,
                language_code=target_language,
                bucket_name=target_s3_url.split('/')[2],
                s3_key=target_s3_url.split('/', 3)[-1],
            )
            set_job_status(job_id, "completed", "Dubbing successful.", s3_url)
        else:
            set_job_status(job_id, "failed", "Dubbing process failed.")
    except Exception as e:
        set_job_status(job_id, "failed", str(e))

@app.route('/dub', methods=['POST'])
def dub_file():
    try:
        source_s3_url = request.json.get("source_s3_url")
        target_s3_url = request.json.get("target_s3_url")
        source_language = request.json.get("source_language")
        target_language = request.json.get("target_language")

        if not all([source_s3_url, target_s3_url, source_language, target_language]):
            raise ValueError("Missing required parameters.")
        logging.info("Starting full pipeline process with parameters:")
        logging.info(f"Source S3 URL: {source_s3_url}")
        logging.info(f"Source language: {source_language}")
        logging.info(f"Target S3 URL: {target_s3_url}")
        logging.info(f"Target language: {target_language}")
        # Generate a unique job ID
        job_id = str(uuid.uuid4())

        # Initialize job status in DynamoDB
        set_job_status(job_id, "queued", "Job created.")

        # Start the dubbing process in a separate thread
        threading.Thread(
            target=async_dub_process,
            args=(job_id, source_s3_url, target_s3_url, source_language, target_language),
            daemon=True
        ).start()

        return jsonify({"job_id": job_id}), 202

    except Exception as e:
        logging.error(f"An error occurred: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/dub/status/<job_id>', methods=['GET'])
def get_job_status_endpoint(job_id):
    job_data = get_job_status(job_id)
    if not job_data:
        return jsonify({"error": "Job ID not found"}), 404
    return jsonify(job_data), 200

@app.route('/mark_deleted', methods=['POST'])
def mark_deleted():
    """
    Endpoint to mark the Pinecone vectors of a deleted datasource as deleted.
    Expects a JSON payload with:
      - pinecone_index_name: The Pinecone index name (organization id).
      - pulse_id: The namespace used in Pinecone.
      - vector_ids: A list of vector ID strings for the datasource.
    """
    try:
        # Retrieve parameters from the request
        pinecone_index_name = request.json.get("pinecone_index_name")
        pulse_id = request.json.get("pulse_id")
        vector_ids = request.json.get("vector_ids")
        
        if not pinecone_index_name:
            raise ValueError("Missing pinecone_index_name in request")
        if not pulse_id:
            raise ValueError("Missing pulse_id in request")
        if not vector_ids or not isinstance(vector_ids, list):
            raise ValueError("Missing or invalid vector_ids in request")
        
        # Initialize the Pinecone client
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        pc = set_index_host(pc, pinecone_index_name)
        pinecone_index = pc.Index(pinecone_index_name)
        
        updated_vector_ids = []
        errors = []
        
        # Process each vector id
        for vid in vector_ids:
            try:
                # Fetch the vector details from Pinecone.
                fetched = pinecone_index.fetch(ids=[vid], namespace=pulse_id)
                # Access the vectors attribute directly, since `fetched` is a FetchResponse object.
                vectors = fetched.vectors  
                
                if vid not in vectors:
                    raise Exception(f"Vector ID {vid} not found in index.")
                
                vector_data = vectors[vid]
                # Use attribute access to retrieve metadata and values.
                metadata = vector_data.metadata if hasattr(vector_data, "metadata") and vector_data.metadata is not None else {}
                metadata["isDeleted"] = True
                
                updated_vector = {
                    "id": vid,
                    "values": vector_data.values if hasattr(vector_data, "values") else None,
                    "metadata": metadata
                }
                
                # Upsert the updated vector back into Pinecone.
                pinecone_index.upsert(vectors=[updated_vector], namespace=pulse_id)
                updated_vector_ids.append(vid)
                logging.info(f"Vector {vid} successfully marked as deleted.")
            except Exception as e:
                errors.append(f"Error updating {vid}: {str(e)}")
                logging.error(f"Error updating vector {vid} as deleted: {str(e)}")
        
        response = {
            "message": "Operation completed.",
            "updated_vector_ids": updated_vector_ids
        }
        if errors:
            response["errors"] = errors
        
        return jsonify(response), 200

    except ValueError as e:
        logging.error(f"Bad request: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logging.error(f"Operation failed: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/')
def health_check():
    return 'OK', 200