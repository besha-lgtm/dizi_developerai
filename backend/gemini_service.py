import os

from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)


GEMINI_MODEL = "gemini-3.1-flash-lite"


def generate_response(prompt: str) -> str:
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt
    )
    return response.text
