from unstructured.staging.base import elements_from_dicts
from unstructured.chunking import dispatch
from unstructured_ingest.utils.chunking import assign_and_map_hash_ids
from unstructured.chunking import dispatch
from pathlib import Path
import json
import re

class Chunker:
    def __init__(self, output_dir: Path, chunking_strategy: str, chunk_max_characters: int, **kwargs):
        self.config = {
            "chunking_strategy": chunking_strategy,
            "chunk_max_characters": chunk_max_characters,
            **kwargs
        }
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def run(self, elements_filepath: Path):
        # elements_dict = elements_from_json(elements_filepath)
        encoding = "utf-8"

        with open(elements_filepath, encoding=encoding) as f:
            elements_dict = json.load(f)

        self._split_into_pages(elements_dict)

        page_files = sorted(self.output_dir.glob("page_*.json"))
        
        documents = []
        for page_file in page_files:
            with open(page_file, "r", encoding="utf-8") as f:
                page_data = json.load(f)

                elements_dict = elements_from_dicts(page_data)

                chunked_elements_dicts = self.chunk(elements_dict);

                for chunk in chunked_elements_dicts:
                    documents.append(chunk)

        # Replace original file
        with open(elements_filepath, "w", encoding="utf-8") as mf:
            json.dump(documents, mf, ensure_ascii=False, indent=2)

    def chunk(self, elements_dict: list):
        chunked_elements = dispatch.chunk(
            elements=elements_dict, 
            **self.config
        )

        chunked_elements_dicts = [e.to_dict() for e in chunked_elements]
        return assign_and_map_hash_ids(elements=chunked_elements_dicts)

    def _split_into_pages(self, elements_dict):
        current_page_number = 1
        page_data = []

        for index, element in enumerate(elements_dict):
            element.setdefault("metadata", {})
            has_page_number = self._check_page_number(element)

            if index == 0:
                # Always start with page 1
                current_page_number = 1
                element["metadata"]["page_number"] = current_page_number
                page_data = [element]
                continue

            if has_page_number:
                # Write previous page
                if page_data:
                    zero_padded_page_number = str(current_page_number).zfill(6)
                    filename = f"page_{zero_padded_page_number}.json"
                    file_path = self.output_dir / filename
                    with open(file_path, 'w', encoding='utf-8') as f:
                        json.dump(page_data, f, indent=2, ensure_ascii=False)

                # Start new page
                current_page_number += 1
                element["metadata"]["page_number"] = current_page_number
                page_data = [element]
            else:
                element["metadata"]["page_number"] = current_page_number
                page_data.append(element)

        # Write the last page
        if page_data:
            zero_padded_page_number = str(current_page_number).zfill(6)
            filename = f"page_{zero_padded_page_number}.json"
            file_path = self.output_dir / filename
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(page_data, f, indent=2, ensure_ascii=False)
    

    def _check_page_number(self, element_dict):
        if element_dict["metadata"].get("text_as_html") is None:
            return Exception("text_as_html is None")
        
        html = element_dict["metadata"]["text_as_html"]

        return re.search(r'class=["\'][^"\']*\bPage\b[^"\']*["\']', html)
