"""CareBridge AI configuration."""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# LLM provider (optional — rule-based responses work without this)
LLM_ENABLED = os.getenv("AI_LLM_ENABLED", "false").lower() == "true"
LLM_API_URL = os.getenv("AI_LLM_API_URL", "http://127.0.0.1:11434/v1/chat/completions")
LLM_API_KEY = os.getenv("AI_LLM_API_KEY", "ollama")
LLM_MODEL = os.getenv("AI_LLM_MODEL", "llama3.2")
LLM_TEMPERATURE = float(os.getenv("AI_LLM_TEMPERATURE", "0.5"))
LLM_TIMEOUT = int(os.getenv("AI_LLM_TIMEOUT", "60"))

# Server
HOST = os.getenv("AI_HOST", "127.0.0.1")
PORT = int(os.getenv("AI_PORT", "8100"))

# Emergency contacts shown in crisis responses
EMERGENCY_CONTACTS = {
    "campus_security": os.getenv("AI_CAMPUS_SECURITY", "0999 100 000"),
    "crisis_counselor": os.getenv("AI_CRISIS_COUNSELOR", "0882 200 000"),
    "national_crisis_line": os.getenv("AI_NATIONAL_CRISIS", "116"),
}
