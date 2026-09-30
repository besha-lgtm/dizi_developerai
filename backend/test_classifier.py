from classifier import classify_requirement


tests = [
    "Create a FastAPI login API",
    "Fix my React login button because it is not working",
    "Explain this SQL JOIN query",
    "Optimize this MySQL query because it is slow",
    "Convert this Python API to Java",
    "Create a responsive Angular registration page"
]


for requirement in tests:

    print("\nRequirement:")
    print(requirement)

    result = classify_requirement(requirement)

    print("Classification:")
    print(result)