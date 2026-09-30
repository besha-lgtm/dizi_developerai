import os

from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)


GEMINI_MODEL = "gemini-3.1-flash-lite"


def generate_response(prompt: str) -> str:
    """Generate a response from Gemini (returns text only)."""
    text, _ = generate_response_with_usage(prompt)
    return text


def generate_response_with_usage(prompt: str):
    """Generate a response from Gemini and return (text, token_usage_dict)."""
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt
    )

    usage = {
        "prompt_tokens": (getattr(response.usage_metadata, "prompt_token_count", 0) or 0) if response.usage_metadata else 0,
        "completion_tokens": (getattr(response.usage_metadata, "candidates_token_count", 0) or 0) if response.usage_metadata else 0,
        "total_tokens": (getattr(response.usage_metadata, "total_token_count", 0) or 0) if response.usage_metadata else 0,
    }

    return response.text, usage
