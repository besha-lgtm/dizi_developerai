from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from gemini_service import generate_response


app = FastAPI()

# Allow the Angular dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeHelpRequest(BaseModel):
    requirement: str


@app.get("/")
def home():
    return {
        "message": "AI Development Companion is running"
    }


@app.post("/help/code")
def help_with_code(request: CodeHelpRequest):

    prompt = f"""
You are an AI Development Assistant.

Help the user with the following coding requirement.

Requirement:
{request.requirement}

Provide:
1. A clear solution
2. Working code
3. A short explanation
4. Important considerations if applicable
"""

    try:
        response = generate_response(prompt)
        return {"response": response}

    except Exception as e:
        error_message = str(e)
        print(f"[Gemini Error] {error_message}")

        # Detect 503 / availability errors from the Gemini API
        if "503" in error_message or "UNAVAILABLE" in error_message:
            raise HTTPException(
                status_code=503,
                detail="The AI service is currently experiencing high demand. Please try again in a moment."
            )

        # Catch-all for any other Gemini/API error
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while contacting the AI service."
        )