import json
import re

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM


MODEL_NAME = "Qwen/Qwen3-0.6B"

print("Loading requirement classifier...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    torch_dtype="auto",
    device_map="auto"
)

print("Requirement classifier loaded.")


CATEGORIES = {
    "Frontend",
    "Backend",
    "MySQL",
    "Other"
}

TASK_TYPES = {
    "Code Generation",
    "Debugging",
    "Code Explanation",
    "Code Optimization",
    "Code Conversion",
    "Other"
}


def classify_requirement(requirement: str):

    prompt = f"""
You are a software development requirement classifier.

Classify the user's requirement into exactly ONE category and exactly ONE task type.

Categories:
- Frontend
- Backend
- MySQL
- Other

Task Types:
- Code Generation
- Debugging
- Code Explanation
- Code Optimization
- Code Conversion
- Other

Category means WHERE the requirement belongs.

Task Type means WHAT the user wants to do.

Examples:

Create a FastAPI login API
-> Backend, Code Generation

Fix my React login button because it is not working
-> Frontend, Debugging

Explain this SQL JOIN query
-> MySQL, Code Explanation

Optimize this MySQL query because it is slow
-> MySQL, Code Optimization

Convert this Python API to Java
-> Backend, Code Conversion

Create a responsive Angular registration page
-> Frontend, Code Generation

IMPORTANT:
Return ONLY this JSON format:

{{"category":"Backend","task_type":"Code Generation"}}

Do NOT explain your answer.
Do NOT use Markdown.
Do NOT include <think>.
Do NOT include any other text.

Requirement:
{requirement}

JSON:
"""

    messages = [
        {
            "role": "user",
            "content": prompt
        }
    ]

    # Disable Qwen3 thinking mode.
    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
        enable_thinking=False
    )

    inputs = tokenizer(
        text,
        return_tensors="pt"
    ).to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=50,
            do_sample=False
        )

    generated_tokens = outputs[0][inputs["input_ids"].shape[-1]:]

    result = tokenizer.decode(
        generated_tokens,
        skip_special_tokens=True
    ).strip()

    print(f"[Classifier Raw Output] {result}")

    # Extract JSON from the model output.
    match = re.search(r'\{.*?\}', result, re.DOTALL)

    if not match:
        raise ValueError(
            f"Classifier did not return valid JSON: {result}"
        )

    try:
        classification = json.loads(match.group())
    except json.JSONDecodeError:
        raise ValueError(
            f"Classifier returned invalid JSON: {result}"
        )

    category = classification.get("category")
    task_type = classification.get("task_type")

    if category not in CATEGORIES:
        category = "Other"

    if task_type not in TASK_TYPES:
        task_type = "Other"

    return {
        "category": category,
        "task_type": task_type
    }