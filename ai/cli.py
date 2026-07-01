"""Interactive CLI for CareBridge AI chatbot."""

import sys
import uuid

from .analyzer import analyze_conversation
from .chatbot import CareBridgeChatbot
from .models import ChatContext, ChatMessage, MessageRole, ServiceType


def _print_analysis(messages: list[ChatMessage]) -> None:
    analysis = analyze_conversation(messages)
    urgency_icons = {
        "immediate": "🔴",
        "critical": "🟠",
        "high": "🟡",
        "medium": "🔵",
        "low": "🟢",
    }
    icon = urgency_icons.get(analysis.urgency.value, "🔵")
    print("\n" + "─" * 50)
    print("  CASE ANALYSIS")
    print("─" * 50)
    print(f"  Service type : {analysis.service_type.value}")
    print(f"  Category     : {analysis.category_label}")
    print(f"  Urgency      : {icon} {analysis.urgency.value.upper()}")
    print(f"  Refer to     : {analysis.referral_target.value}")
    print(f"  Routing      : {analysis.referral_description}")
    if analysis.requires_immediate_attention:
        print("  ⚠️  Requires immediate attention")
    print("─" * 50 + "\n")


def main() -> None:
    print("=" * 55)
    print("  CareBridge AI — Confidential Support Assistant")
    print("  Type 'quit' to exit | 'analyze' to see case routing")
    print("=" * 55)
    print("\nCareBridge: Hi! I'm here to listen and help connect you")
    print("with the right support. Everything you share is confidential.")
    print("What brings you here today?\n")

    bot = CareBridgeChatbot()
    messages: list[ChatMessage] = []
    context = ChatContext()

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nTake care. Remember, support is always available.")
            sys.exit(0)

        if not user_input:
            continue

        if user_input.lower() in ("quit", "exit", "bye"):
            if messages:
                _print_analysis(messages)
            print("CareBridge: Thank you for reaching out. You're not alone. 💙")
            break

        if user_input.lower() == "analyze":
            if messages:
                _print_analysis(messages)
            else:
                print("CareBridge: Share a bit about your situation first, then type 'analyze'.")
            continue

        messages.append(ChatMessage(role=MessageRole.USER, content=user_input))

        result = bot.converse(messages, context, include_analysis=False)
        messages.append(ChatMessage(role=MessageRole.ASSISTANT, content=result.reply))

        if result.crisis_detected:
            print(f"\nCareBridge: {result.reply}\n")
            analysis = analyze_conversation(messages, ServiceType.EMERGENCY)
            print(f"[URGENT] Referral: {analysis.referral_description}\n")
            continue

        print(f"\nCareBridge: {result.reply}\n")


if __name__ == "__main__":
    main()
