"""CareBridge empathetic chatbot — assistant counsellor for victims."""

from __future__ import annotations

import httpx

from . import config
from .analyzer import analyze_conversation, detect_crisis, detect_service_intent
from .models import (
    CaseAnalysis,
    ChatContext,
    ChatMessage,
    ChatResponse,
    ConversationResponse,
    ServiceType,
)

SYSTEM_PROMPT = """You are CareBridge, a warm, compassionate, and professional AI assistant counsellor for Mzuzu University students.

Your role:
- Listen empathetically to students who may be victims, survivors, or struggling emotionally.
- Many students find it difficult to seek help in person, so help them feel safe, respected, and heard.
- Speak naturally like a caring psychologist or counsellor, not a robot.
- Always acknowledge emotions before asking questions.
- Validate experiences without making assumptions or assigning blame.
- Encourage students to share only what they feel comfortable sharing.
- Use gentle, human language that communicates warmth, patience, and understanding.
- Start every response with a softer, empathetic acknowledgment, even when the topic is practical or procedural.
- Keep responses concise (3–5 sentences) unless safety requires more detail.
- Never diagnose medical or mental health conditions.
- Never invent appointment times, staff names, or case decisions.

Safety rules:
- If someone mentions suicide, self-harm, assault in progress, or immediate danger, express care, provide emergency contacts, and encourage them to reach immediate support.
- For counseling needs, help students explore their feelings and understand what support they may need.
- For case reports, help students describe what happened at their own pace and remind them that GBV and sexual harassment cases can be reported anonymously to the IIC.
- Everything shared is treated confidentially according to CareBridge policy.

You are an assistant counsellor—you provide emotional support, guidance, and help connect students with appropriate human professionals when necessary.
"""


COUNSELING_ACKNOWLEDGMENTS: dict[str, list[str]] = {
    "depression": [
        "I'm really glad you reached out. It sounds like you've been carrying a lot, and that can be incredibly exhausting.",
        "When you're struggling emotionally, even small things can feel overwhelming. Please know that you don't have to face this alone.",
    ],

    "anxiety": [
        "Thank you for sharing this with me. Anxiety can make everyday situations feel much heavier than they appear to others.",
        "Your feelings are completely valid, and we can take this one step at a time, at whatever pace feels comfortable for you.",
    ],

    "ptsd": [
        "Thank you for trusting me with something so personal and difficult. You deserve to be listened to with care and understanding.",
        "Experiences from the past can leave lasting emotional effects, and it's okay to talk about them only when you feel ready.",
    ],

    "grief": [
        "I'm truly sorry for what you're going through. Grief can bring many different emotions, and all of them are valid.",
        "There is no right or wrong way to grieve, and you don't have to rush your healing process.",
    ],

    "relationship": [
        "Relationship struggles can affect us deeply, and it's completely understandable that this has been painful for you.",
        "Thank you for opening up about this. Your feelings and experiences matter.",
    ],

    "academic_stress": [
        "Academic pressure can become overwhelming, especially when you're balancing many responsibilities. You're not alone in feeling this way.",
        "Many students experience similar challenges, and reaching out for support is a positive and courageous step.",
    ],

    "addiction": [
        "Thank you for being honest about something so personal. Speaking about it already shows a great deal of strength.",
        "There is no judgment here, only support. Wanting help is an important first step toward positive change.",
    ],

    "eating_disorder": [
        "Thank you for trusting me with something so sensitive. Your wellbeing matters, and you deserve compassionate support.",
        "The concerns you're sharing are important, and it's good that you're not facing them alone.",
    ],

    "general": [
        "Thank you for opening up. Reaching out for support takes courage, and I'm glad you're here.",
        "This is a safe and judgment-free space, and you can share as much or as little as feels comfortable.",
    ],
}

CASE_ACKNOWLEDGMENTS: dict[str, list[str]] = {
    "sexual_harassment": [
        "Thank you for trusting me with something so difficult. What happened matters, and you deserve to be heard and supported.",
        "What you've experienced is not your fault, and you have every right to seek help in a way that feels safe for you.",
    ],

    "gbv": [
        "I'm truly sorry that you've gone through this. Nobody deserves to experience violence or abuse, and your wellbeing matters deeply.",
        "You deserve safety, dignity, and support, and we will help you access that support confidentially.",
    ],

    "general": [
        "Thank you for sharing this with me. I understand that talking about these experiences can be difficult.",
        "Take your time—there is no pressure to explain everything at once, and your information will be handled confidentially.",
    ],
}


class CareBridgeChatbot:
    """Empathetic chatbot that supports victims and routes cases appropriately."""

    def __init__(self) -> None:
        self._llm_enabled = config.LLM_ENABLED

    @property
    def model_name(self) -> str:
        return config.LLM_MODEL if self._llm_enabled else "carebridge-assistant"

    def chat(
        self,
        messages: list[ChatMessage],
        context: ChatContext | None = None,
    ) -> ChatResponse:
        context = context or ChatContext()
        combined = " ".join(m.content for m in messages if m.role.value == "user")
        crisis = detect_crisis(combined)

        if crisis:
            reply = self._crisis_response()
            return ChatResponse(
                reply=reply,
                model=self.model_name,
                provider="carebridge",
                crisis_detected=True,
            )

        if self._llm_enabled:
            try:
                reply = self._llm_reply(messages, context)
                return ChatResponse(
                    reply=reply,
                    model=config.LLM_MODEL,
                    provider="llm",
                    crisis_detected=False,
                )
            except Exception:
                pass

        reply = self._rule_based_reply(messages, context)
        return ChatResponse(
            reply=reply,
            model="carebridge-assistant",
            provider="carebridge",
            crisis_detected=False,
        )

    def converse(
        self,
        messages: list[ChatMessage],
        context: ChatContext | None = None,
        include_analysis: bool = True,
    ) -> ConversationResponse:
        """Chat and optionally analyze the conversation for routing."""
        chat_result = self.chat(messages, context)
        analysis: CaseAnalysis | None = None

        if include_analysis and len(messages) >= 1:
            service = context.service_type if context else ServiceType.UNSPECIFIED
            if service == ServiceType.UNSPECIFIED:
                service = None
            analysis = analyze_conversation(messages, service)

        return ConversationResponse(
            reply=chat_result.reply,
            analysis=analysis,
            crisis_detected=chat_result.crisis_detected,
            model=chat_result.model,
            provider=chat_result.provider,
        )

    def _crisis_response(self) -> str:
        c = config.EMERGENCY_CONTACTS
        return (
            "Thank you for telling me this. I'm really glad you reached out, and I want you to know that your safety and wellbeing matter deeply. "
            "I understand it hurts and can feel very hard to bear when you're in a situation like this, but there are ways to improve things and get better support. "
            "I'm here to listen to what you're going through, and we can take this one step at a time.\n\n"
            f"If you're in immediate danger or feel you might act on these thoughts, please reach out to someone nearby or contact one of these resources right away:\n"
            f"• Campus Security: {c['campus_security']}\n"
            f"• Emergency Counselor: {c['crisis_counselor']}\n"
            f"• National Crisis Line: {c['national_crisis']}\n\n"
            "If you'd like, I can also help you explore speaking with a counselor when you're ready, but first I want to understand how you're feeling."
        )

    def _rule_based_reply(self, messages: list[ChatMessage], context: ChatContext) -> str:
        user_messages = [m for m in messages if m.role.value == "user"]
        if not user_messages:
            return (
                "Hello, I'm CareBridge. Thank you for being here today. "
                "This is a confidential and judgment-free space where you can talk about how you're feeling "
                "or get support in reporting an incident. "
                "What would you like to share with me today?"
            )

        latest = user_messages[-1].content.strip()
        lower = latest.lower()
        full_text = " ".join(m.content for m in user_messages)

        service = context.service_type
        if service == ServiceType.UNSPECIFIED:
            service = detect_service_intent(full_text)

        if service == ServiceType.EMERGENCY:
            return self._crisis_response()

        if service == ServiceType.CASE_REPORT:
            analysis = analyze_conversation(messages, ServiceType.CASE_REPORT)
            acks = CASE_ACKNOWLEDGMENTS.get(
                analysis.category,
                CASE_ACKNOWLEDGMENTS["general"],
            )
            if analysis.category in ("sexual_harassment", "gbv"):
                return (
                    f"{acks[0]} "
                    "You are in control of what you choose to share, and you can report anonymously if that feels safer for you. "
                    "If you're comfortable, could you tell me a little about when or where this happened so we can support you appropriately?"
                )
            return (
                f"{acks[0]} "
                "There's no pressure to share everything at once. "
                "Whenever you're ready, could you tell me a little more about what happened "
                "and any details you feel comfortable providing?"
            )

        if service == ServiceType.COUNSELING:
            analysis = analyze_conversation(messages, ServiceType.COUNSELING)
            acks = COUNSELING_ACKNOWLEDGMENTS.get(
                analysis.category,
                COUNSELING_ACKNOWLEDGMENTS["general"],
            )
            follow_ups = {
                "depression":
                    "I know that can feel heavy and isolating. If you'd like, what has been weighing on your heart or mind the most recently?",

                "anxiety":
                    "I can hear how stressful this is for you. Do you notice certain situations that make these feelings stronger, or has this been something you've been carrying most of the time?",

                "ptsd":
                    "It sounds like this has been affecting you deeply. Only if you're comfortable sharing, do these feelings connect to something that happened recently, or to an experience from earlier in your life?",

                "academic_stress":
                    "That must feel very heavy when you have so much on your plate. Is there a particular course, deadline, or responsibility that has been especially difficult lately?",

                "grief":
                    "I'm sorry for the pain you're carrying right now. If you'd like, would you feel comfortable telling me a little about the loss you've experienced?",

                "relationship":
                    "Relationship pain can feel very personal and overwhelming. Would you like to share whether this involves a romantic relationship, family, or friendships?",
            }
            follow = follow_ups.get(
                analysis.category,
                "Whenever you're ready, I'd like to understand a little more about what you've been going through."
            )
            return f"{acks[0]} {follow}"

        # Unspecified — help them choose
        if any(w in lower for w in ["counsel", "talk", "support", "feeling", "sad", "anxious"]):
            return (
                "Thank you for reaching out. I can hear that this is important to you, and I'm here to listen without judgment. "
                "Whenever you're ready, tell me a little about what's been on your mind."
            )
        if any(w in lower for w in ["report", "incident", "happened"]):
            return (
                "Thank you for trusting me with this. I understand that talking about difficult experiences can take courage. "
                "Whenever you feel comfortable, you can share what happened, and we'll help connect you with the appropriate support."
            )
        return (
            "I'm here to support you in whatever way you need. I know it can feel hard to reach out, so thank you for doing so. "
            "Would you like to talk about how you've been feeling, or are you seeking help in reporting an incident? "
            "Either way, this conversation is confidential, and you can take things at your own pace."
        )

    def _llm_reply(self, messages: list[ChatMessage], context: ChatContext) -> str:
        stage = context.stage
        service = context.service_type.value
        system = (
            f"{SYSTEM_PROMPT}\n\n"
            f"Current conversation stage: {stage}\n"
            f"Selected service (if any): {service}"
        )

        payload_messages = [{"role": "system", "content": system}]
        for msg in messages:
            payload_messages.append({"role": msg.role.value, "content": msg.content})

        headers = {"Authorization": f"Bearer {config.LLM_API_KEY}"}
        with httpx.Client(timeout=config.LLM_TIMEOUT) as client:
            response = client.post(
                config.LLM_API_URL,
                headers=headers,
                json={
                    "model": config.LLM_MODEL,
                    "messages": payload_messages,
                    "temperature": config.LLM_TEMPERATURE,
                },
            )
            response.raise_for_status()
            data = response.json()

        reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        if not reply or not str(reply).strip():
            raise ValueError("Empty LLM response")
        return str(reply).strip()
