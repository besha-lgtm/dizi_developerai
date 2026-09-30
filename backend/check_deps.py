import sys
try:
    import torch
    print("torch OK:", torch.__version__)
except ImportError as e:
    print("torch MISSING:", e)

try:
    import transformers
    print("transformers OK:", transformers.__version__)
except ImportError as e:
    print("transformers MISSING:", e)
