import json
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from gemini_service import generate_response, generate_response_with_usage
from classifier import classify_requirement

load_dotenv()


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
    # File doesn't exist yet: create it initialized as an empty dictionary
    try:
        with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
            json.dump({}, f, indent=2, ensure_ascii=False)
        print(f"[Sessions] Created new sessions file at {SESSIONS_FILE}")
    except Exception as e:
        print(f"[Sessions] Error creating {SESSIONS_FILE}: {e}")
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
# Daily Usage Tracking  (persists across session deletes)
# ---------------------------------------------------------------------------
# Stores: { "YYYY-MM-DD": { "requests": N, "tokens": T }, ... }
DAILY_USAGE_FILE = os.path.join(os.path.dirname(__file__), "daily_usage.json")


def load_daily_usage() -> Dict[str, Any]:
    if os.path.exists(DAILY_USAGE_FILE):
        try:
            with open(DAILY_USAGE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[DailyUsage] Error reading {DAILY_USAGE_FILE}: {e}")
            return {}
    # File doesn't exist yet: create it initialized as an empty dictionary
    try:
        with open(DAILY_USAGE_FILE, "w", encoding="utf-8") as f:
            json.dump({}, f, indent=2, ensure_ascii=False)
        print(f"[DailyUsage] Created new daily usage file at {DAILY_USAGE_FILE}")
    except Exception as e:
        print(f"[DailyUsage] Error creating {DAILY_USAGE_FILE}: {e}")
    return {}


def save_daily_usage(data: Dict[str, Any]) -> None:
    try:
        with open(DAILY_USAGE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[DailyUsage] Error writing {DAILY_USAGE_FILE}: {e}")


def increment_daily_usage(tokens_used: int = 0) -> None:
    """Increment today's request count and token count. Never decrements."""
    today = datetime.now(timezone.utc).date().isoformat()  # e.g. '2026-10-05'
    data = load_daily_usage()
    if today not in data:
        data[today] = {"requests": 0, "tokens": 0}
    data[today]["requests"] += 1
    data[today]["tokens"] = data[today].get("tokens", 0) + tokens_used
    save_daily_usage(data)


def get_today_requests() -> int:
    """Return the number of API requests made today (never resets on delete)."""
    today = datetime.now(timezone.utc).date().isoformat()
    data = load_daily_usage()
    return data.get(today, {}).get("requests", 0)

CATEGORY_RULES = {
    "Frontend": """
Focus on UI, client-side logic, components, styling, state, and user interaction.
Follow the existing frontend framework and project structure when provided.
Prefer reusable, modular, responsive, and maintainable solutions.
Do not modify backend or database logic unless explicitly requested.
""",

    "Backend": """
Focus on APIs, server-side logic, business logic, validation, authentication,
error handling, and backend architecture.
Write modular, maintainable, and secure code.
Do not modify unrelated frontend or database logic unless explicitly requested.
""",

    "MySQL": """
Focus on SQL, database queries, schema, constraints, joins, and database performance.
Use valid MySQL syntax and efficient queries.
Preserve the intended result and handle relevant NULL, duplicate, and edge cases.
Do not modify the database schema unless explicitly requested.
""",

    "Other": """
Determine the appropriate technical approach from the user's requirement.
Do not make unsupported assumptions.
Ask for clarification only when essential.
"""
}


TASK_RULES = {
    "Code Generation": """
Generate clean, reusable, modular, and maintainable code.
Preserve existing functionality unless changes are requested.
Avoid unnecessary dependencies and handle relevant validation and edge cases.
""",

    "Debugging": """
Identify the likely root cause before providing the fix.
Make the smallest appropriate change and avoid rewriting unrelated code.
Explain why the problem occurs and how the fix resolves it.
""",

    "Code Explanation": """
Explain the existing code clearly and step by step.
Describe its purpose, flow, and important parts.
Do not modify the code unless explicitly requested.
""",

    "Code Optimization": """
Identify the performance, readability, or maintainability issue.
Provide an optimized solution while preserving expected behavior.
Explain the important improvements and relevant trade-offs.
Avoid unnecessary optimization.
""",

    "Code Conversion": """
Convert the implementation while preserving its functionality and important
business logic.
Explain important differences in the converted implementation.
Avoid unrelated changes.
""",

    "Other": """
Follow the user's specific requirement and use the selected category
to guide the response.
"""
}

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



# ---------------------------------------------------------------------------
# Dashboard Stats Endpoint
# ---------------------------------------------------------------------------
# gemini-3.1-flash-lite rate limits:
# Google AI Studio Free Tier limit for gemini-3.1-flash-lite is 500 Requests Per Day (RPD).
# Paid tier supports up to 10,000,000 RPD. Can be overridden via GEMINI_DAILY_REQUEST_LIMIT in .env.
DAILY_REQUEST_LIMIT = int(os.getenv("GEMINI_DAILY_REQUEST_LIMIT", 500))   # requests per day (RPD)
MONTHLY_TOKEN_LIMIT = int(os.getenv("GEMINI_MONTHLY_TOKEN_LIMIT", 1_000_000))  # tokens per month (1M)


@app.get("/dashboard")
def get_dashboard_stats():
    """
    Returns aggregated stats for the token usage dashboard.
    Accurately tracks tokens per day and month based on actual usage timestamps.
    """
    now = datetime.now(timezone.utc)
    current_year = now.year

    total_conversations = len(sessions_db)

    # ── Accurate Daily and Monthly Breakdown ──
    daily_data = load_daily_usage()

    # Calculate total tokens directly from sessions & daily usage
    total_tokens = sum(
        (s.get("token_usage", {}).get("total_tokens", 0) or 0)
        for s in sessions_db.values()
    )
    if total_tokens == 0:
        total_tokens = sum(v.get("tokens", 0) for v in daily_data.values())

    monthly_tokens: Dict[int, int] = {i: 0 for i in range(12)}
    daily_usage_list = []
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    for date_str in sorted(daily_data.keys()):
        entry = daily_data[date_str]
        t_count = entry.get("tokens", 0)
        r_count = entry.get("requests", 0)
        try:
            dt = datetime.fromisoformat(date_str)
            if dt.year == current_year:
                monthly_tokens[dt.month - 1] += t_count
            formatted_date = f"{month_names[dt.month - 1]} {dt.day:02d}"
        except Exception:
            formatted_date = date_str

        daily_usage_list.append({
            "date": formatted_date,
            "full_date": date_str,
            "tokens": t_count,
            "requests": r_count
        })

    # ── Daily requests: read from persistent daily_usage.json ──
    requests_made_today = get_today_requests()
    daily_requests_left = max(0, DAILY_REQUEST_LIMIT - requests_made_today)

    monthly_usage = [
        {"month": month_names[i], "tokens": monthly_tokens[i]}
        for i in range(12)
    ]

    return {
        "total_conversations": total_conversations,
        "total_tokens_used": total_tokens,
        "daily_requests_left": daily_requests_left,
        "daily_request_limit": DAILY_REQUEST_LIMIT,
        "requests_made_today": requests_made_today,
        "monthly_token_limit": MONTHLY_TOKEN_LIMIT,
        "model": "gemini-3.1-flash-lite",
        "current_year": current_year,
        "monthly_usage": monthly_usage,
        "daily_usage": daily_usage_list
    }


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
        category_rules = CATEGORY_RULES.get(
            category,
            CATEGORY_RULES["Other"]
        )

        task_rules = TASK_RULES.get(
            task_type,
            TASK_RULES["Other"]
        )

        prompt = f"""
You are an AI Development Assistant.

Category:
{category}

Task Type:
{task_type}

Category-specific instructions:
{category_rules}

Task-specific instructions:
{task_rules}

User Requirement:
{request.requirement}

Provide:
1. A clear solution
2. Working code or the required technical solution
3. A short explanation
4. Important considerations if applicable
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
            "timestamp": assistant_now,
            "token_usage": usage
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

        # ── Increment daily request counter (survives session deletes) ──
        increment_daily_usage(tokens_used=usage.get("total_tokens", 0) or 0)

        return {
            "response": response_text,
            "session_id": session_id,
            "token_usage": usage,
            "session": session
        }

    except HTTPException:
        # Roll back unanswered user message so it does not persist on failure
        if session.get("messages") and session["messages"][-1].get("id") == user_msg_id:
            session["messages"].pop()
            save_sessions(sessions_db)
        raise

    except Exception as e:
        # Roll back unanswered user message so it does not persist on failure
        if session.get("messages") and session["messages"][-1].get("id") == user_msg_id:
            session["messages"].pop()
            save_sessions(sessions_db)

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