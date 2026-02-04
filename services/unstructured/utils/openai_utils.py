import tiktoken, os
from openai import OpenAI

client = OpenAI()

def get_encoding():
    model = os.getenv("OPENAI_MODEL")
    if model is None:
        model = "gpt-4o-2024-08-06"

    encoding = tiktoken.encoding_for_model(model)

    return encoding

def count_tokens(text):
    econding = get_encoding()
    return len(econding.encode(text))

def create_embeddings(texts):
    res = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
        encoding_format="float"
    )
    return res