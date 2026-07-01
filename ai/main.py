"""FastAPI server for CareBridge AI."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .analyzer import analyze_conversation
from .chatbot import CareBridgeChatbot
from .models import (
    AnalysisRequest,
    CaseAnalysis,
    ChatMessage,
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    StatusResponse,
)

app = FastAPI(
    title="CareBridge AI",
    description="Empathetic chatbot and case analysis for university counseling support",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chatbot = CareBridgeChatbot()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/status", response_model=StatusResponse)
@app.get("/chat/status", response_model=StatusResponse)
def status():
    return StatusResponse(
        enabled=True,
        model=chatbot.model_name,
        llm_enabled=config.LLM_ENABLED,
    )


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """Generate an empathetic chatbot reply."""
    try:
        return chatbot.chat(request.messages, request.context)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.post("/analyze", response_model=CaseAnalysis)
def analyze(request: AnalysisRequest):
    """Analyze conversation text and categorize case with referral."""
    try:
        return analyze_conversation(request.messages, request.service_type)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/conversation", response_model=ConversationResponse)
def conversation(request: ChatRequest):
    """Chat plus automatic case analysis and referral recommendation."""
    try:
        return chatbot.converse(request.messages, request.context, include_analysis=True)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.post("/v1/chat/completions")
def openai_compatible_chat(payload: dict):
    """
    OpenAI-compatible endpoint for Laravel backend integration.
    Set AI_CHAT_API_URL=http://127.0.0.1:8100/v1/chat/completions in backend .env
    """
    raw_messages = payload.get("messages", [])
    if not raw_messages:
        raise HTTPException(status_code=400, detail="messages required")

    messages = [
        ChatMessage(role=m["role"], content=m["content"])
        for m in raw_messages
        if m.get("role") in ("user", "assistant", "system") and m.get("content")
    ]
    user_only = [m for m in messages if m.role.value != "system"]
    if not user_only:
        raise HTTPException(status_code=400, detail="At least one user message required")

    result = chatbot.chat(user_only)
    model = payload.get("model", chatbot.model_name)

    return {
        "id": "carebridge-chat",
        "object": "chat.completion",
        "model": model,
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": result.reply},
                "finish_reason": "stop",
            }
        ],
    }


def run_server():
    import uvicorn

    uvicorn.run(
        "ai.main:app",
        host=config.HOST,
        port=config.PORT,
        reload=False,
    )


if __name__ == "__main__":
    run_server()
