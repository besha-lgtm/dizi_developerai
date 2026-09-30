import json
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from gemini_service import generate_response, generate_response_with_usage
from classifier import classify_requirement


app = FastAPI(title="Developer AI API")

# Allow the Angular dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Session Storage & Persistence
# ---------------------------------------------------------------------------
SESSIONS_FILE = os.path.join(os.path.dirname(__file__), "sessions.json")


def load_sessions() -> Dict[str, Any]:
    if os.path.exists(SESSIONS_FILE):
        try:
            with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[Sessions] Error reading {SESSIONS_FILE}: {e}")
    return {}


def save_sessions(sessions: Dict[str, Any]) -> None:
    try:
        with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(sessions, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[Sessions] Error writing {SESSIONS_FILE}: {e}")


# In-memory dictionary backed by sessions.json
sessions_db: Dict[str, Any] = load_sessions()


def get_current_time_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------
class CreateSessionRequest(BaseModel):
    title: Optional[str] = None


class CodeHelpRequest(BaseModel):
    requirement: str
    session_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/")
def home():
    return {
        "message": "AI Development Companion is running",
        "total_sessions": len(sessions_db)
    }


@app.get("/sessions")
def list_sessions():
    """Returns a list of all active sessions sorted by last updated time."""
    summaries = []
    for s_id, s_data in sessions_db.items():
        summaries.append({
            "id": s_id,
            "title": s_data.get("title", "New Conversation"),
            "created_at": s_data.get("created_at"),
            "updated_at": s_data.get("updated_at"),
            "message_count": len(s_data.get("messages", [])),
            "token_usage": s_data.get("token_usage", {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0
            })
        })

    # Sort newest first
    summaries.sort(key=lambda s: s.get("updated_at") or "", reverse=True)
    return summaries


@app.post("/sessions")
def create_session(request: Optional[CreateSessionRequest] = None):
    """Creates a new empty conversation session."""
    session_id = f"session_{uuid.uuid4().hex[:10]}"
    now = get_current_time_iso()
    title = (request.title if request and request.title else "New Conversation").strip()

    new_session = {
        "id": session_id,
        "title": title,
        "created_at": now,
        "updated_at": now,
        "messages": [],
        "token_usage": {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0
        }
    }

    sessions_db[session_id] = new_session
    save_sessions(sessions_db)
    return new_session


@app.get("/sessions/{session_id}")
def get_session(session_id: str):
    """Returns full session details including all messages."""
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")
    return sessions_db[session_id]


@app.delete("/sessions/{session_id}")
def delete_session(session_id: str):
    """Deletes a session."""
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")
    del sessions_db[session_id]
    save_sessions(sessions_db)
    return {"deleted": True, "session_id": session_id}


@app.post("/help/code")
def help_with_code(request: CodeHelpRequest):
    """
    Main code assistance endpoint with multi-turn session tracking
    and automatic requirement classification.
    """
    if not request.requirement.strip():
        raise HTTPException(
            status_code=400,
            detail="Requirement cannot be empty."
        )

    session_id = request.session_id
    now = get_current_time_iso()

    # Find or auto-create session
    if not session_id or session_id not in sessions_db:
        session_id = f"session_{uuid.uuid4().hex[:10]}"
        # Derive an initial title from the first requirement
        req_clean = request.requirement.strip()
        derived_title = req_clean[:35] + ("..." if len(req_clean) > 35 else "")

        session = {
            "id": session_id,
            "title": derived_title or "New Conversation",
            "created_at": now,
            "updated_at": now,
            "messages": [],
            "token_usage": {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0
            }
        }
        sessions_db[session_id] = session
    else:
        session = sessions_db[session_id]
        # Update title if it is still generic
        if session.get("title") == "New Conversation" and request.requirement.strip():
            req_clean = request.requirement.strip()
            session["title"] = req_clean[:35] + ("..." if len(req_clean) > 35 else "")

    # Record User Message
    user_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
    user_msg = {
        "id": user_msg_id,
        "role": "user",
        "content": request.requirement,
        "timestamp": now
    }
    session["messages"].append(user_msg)

    try:
        # Step 1: Automatically classify the requirement
        classification = classify_requirement(request.requirement)

        category = classification["category"]
        task_type = classification["task_type"]

        print(f"[Classifier] Category: {category}")
        print(f"[Classifier] Task Type: {task_type}")

        # Step 2: Build conversation context from prior messages in this session
        history_str = ""
        prior_messages = session["messages"][:-1]  # exclude the message just added
        if prior_messages:
            history_str = "Conversation context from this session:\n"
            for msg in prior_messages[-4:]:  # last 4 messages for context
                role_label = "User" if msg.get("role") == "user" else "Assistant"
                history_str += f"{role_label}: {msg.get('content')}\n"
            history_str += "\n"

        # Step 3: Build the Gemini prompt (preserving teammate's detailed classifier prompt)
        prompt = f"""You are an AI Development Assistant.

{history_str}Your task is to solve the user's development requirement using the
provided Category and Task Type.

==================================================
CATEGORY
==================================================

Category: {category}

Use the category to determine the relevant technical domain.

Category-specific instructions:

Frontend:
- Focus on UI, client-side logic, components, styling, state management,
  user interaction, and frontend behavior.
- Follow the existing frontend framework and project structure when provided.
- Prefer reusable and modular components.
- Use clean, maintainable, and accessible implementation.
- Make UI changes responsive when relevant.
- Do not introduce unnecessary libraries or dependencies.
- Do not modify backend or database logic unless explicitly requested.

Backend:
- Focus on APIs, server-side logic, business logic, validation,
  authentication, error handling, and backend architecture.
- Follow the existing backend framework and project structure when provided.
- Use appropriate request and response models where applicable.
- Write reusable, modular, and maintainable backend code.
- Follow secure coding practices.
- Never hardcode passwords, API keys, tokens, or other secrets.
- Handle relevant errors and edge cases.
- Do not modify unrelated frontend or database logic unless explicitly requested.

MySQL:
- Focus on SQL queries, database operations, schema-related requirements,
  data retrieval, and query performance.
- Use valid MySQL syntax.
- Preserve the intended result of existing queries.
- Prefer clear, efficient, and maintainable SQL.
- Consider indexes and query performance when relevant.
- Handle duplicate values, NULL values, and relevant edge cases when applicable.
- Do not modify the database schema unless explicitly requested.
- Do not introduce unnecessary database operations.

Other:
- Determine the appropriate technical approach from the user's requirement.
- Do not make unsupported assumptions.
- Ask for clarification only when essential information is missing.

==================================================
TASK TYPE
==================================================

Task Type: {task_type}

Use the task type to determine HOW the requirement should be handled.

Task-specific instructions:

Code Generation:
- Generate clean, reusable, modular, and maintainable code.
- Follow the existing project structure when relevant.
- Preserve existing functionality unless changes are requested.
- Avoid unnecessary dependencies.
- Handle relevant validation and edge cases.
- Include appropriate tests or verification steps when useful.

Debugging:
- First identify the likely problem and root cause.
- Analyze the provided code, error message, or behavior before proposing changes.
- Provide the smallest appropriate fix.
- Do not rewrite unrelated code.
- Preserve the intended functionality.
- Explain why the problem occurs.
- Provide verification steps to confirm that the fix works.
- If the provided information is insufficient, clearly state what is missing
  instead of inventing details.

Code Explanation:
- Explain the existing code clearly and step by step.
- Explain the purpose and flow of important sections.
- Keep the explanation appropriate for the user's requirement.
- Do not modify or rewrite the code unless explicitly requested.
- Use simple examples when they improve understanding.

Code Optimization:
- Identify the current performance, readability, or maintainability issue.
- Provide an optimized solution while preserving expected behavior.
- Explain what was changed and why.
- Consider time complexity, memory usage, query efficiency, or unnecessary
  operations when relevant to the category.
- Do not perform unnecessary optimization.
- Mention important trade-offs when applicable.

Code Conversion:
- Convert the implementation to the requested language, framework,
  technology, or format.
- Preserve the original functionality and important business logic.
- Maintain equivalent behavior wherever possible.
- Explain important differences between the original and converted version.
- Do not introduce unrelated changes.

Other:
- Follow the user's specific development requirement.
- Use the category and requirement to determine the appropriate response.
- Ask for clarification only when essential information is missing.

==================================================
USER REQUIREMENT
==================================================

{request.requirement}

==================================================
IMPORTANT RULES
==================================================

- Use ONLY the information relevant to the selected category and task type.
- Do not add unrelated technologies, frameworks, libraries, or database
  instructions.
- Preserve existing functionality unless the user explicitly requests changes.
- Prefer simple, reusable, modular, and maintainable solutions.
- Do not invent missing project details, code, schemas, or error messages.
- If important information is missing, clearly state the assumption or ask
  for the required information.
- Follow secure coding practices and never expose secrets or credentials.
- Tailor the response to the actual requirement instead of giving a generic
  answer.

==================================================
EXPECTED OUTPUT
==================================================

Provide the response in the following structure where applicable:

1. Approach / Problem
2. Solution / Implementation
3. Explanation
4. Verification / Tests
5. Important Notes or Considerations

Adapt the output structure when the selected Task Type requires a different
format, such as debugging, explanation, optimization, or conversion.

Now solve the user's requirement.
"""

        # Step 4: Send prompt to Gemini (with usage tracking)
        response_text, usage = generate_response_with_usage(prompt)

        # Record Assistant Message
        assistant_now = get_current_time_iso()
        assistant_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
        assistant_msg = {
            "id": assistant_msg_id,
            "role": "assistant",
            "content": response_text,
            "timestamp": assistant_now
        }
        session["messages"].append(assistant_msg)

        # Update session metadata & token usage
        session["updated_at"] = assistant_now
        current_usage = session.setdefault("token_usage", {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0
        })
        current_usage["prompt_tokens"] = (current_usage.get("prompt_tokens") or 0) + (usage.get("prompt_tokens") or 0)
        current_usage["completion_tokens"] = (current_usage.get("completion_tokens") or 0) + (usage.get("completion_tokens") or 0)
        current_usage["total_tokens"] = (current_usage.get("total_tokens") or 0) + (usage.get("total_tokens") or 0)

        # Persist session updates
        save_sessions(sessions_db)

        return {
            "response": response_text,
            "session_id": session_id,
            "token_usage": usage,
            "session": session
        }

    except HTTPException:
        raise

    except Exception as e:
        error_message = str(e)
        print(f"[AI Error] {error_message}")

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