"""Analyze chat conversations to categorize cases and detect urgency."""

from __future__ import annotations

import re

from .models import (
    CaseAnalysis,
    ChatMessage,
    ReferralTarget,
    ServiceType,
    UrgencyLevel,
)
from .referral import get_referral

# Counseling keyword patterns (aligned with frontend categorization.ts)
COUNSELING_KEYWORDS: dict[str, list[str]] = {
    "suicide": [
        "suicide", "suicidal", "kill myself", "end my life", "want to die",
        "life not worth", "better off dead", "no reason to live",
    ],
    "self_harm": [
        "self harm", "self-harm", "cutting", "hurt myself", "self injury",
        "self-injury", "burning myself", "harming myself",
    ],
    "depression": [
        "depressed", "depression", "hopeless", "worthless", "empty",
        "sad all the time", "no energy", "cant get out of bed", "lost interest",
    ],
    "anxiety": [
        "anxiety", "anxious", "panic attack", "panic", "worry constantly",
        "cant stop worrying", "nervous", "fear", "phobia", "scared",
    ],
    "ptsd": [
        "ptsd", "trauma", "traumatic", "flashback", "nightmare",
        "cant sleep", "hypervigilant", "triggered", "assault", "abuse",
    ],
    "addiction": [
        "addiction", "addicted", "substance abuse", "alcohol", "drinking problem",
        "drug", "cant stop", "dependency", "gambling", "gaming addiction",
    ],
    "eating_disorder": [
        "eating disorder", "anorexia", "bulimia", "binge eating",
        "purging", "food obsession", "body image", "weight obsession",
    ],
    "grief": [
        "grief", "grieving", "loss", "died", "death", "mourning",
        "bereavement", "passed away", "funeral",
    ],
    "relationship": [
        "relationship", "breakup", "divorce", "partner", "marriage",
        "family conflict", "family issues", "dating", "romance",
    ],
    "academic_stress": [
        "academic stress", "coursework", "exams", "failing", "grades",
        "study", "homework", "assignment", "thesis", "dissertation",
        "time management", "procrastination", "academic pressure",
    ],
    "general": [],
}

CASE_KEYWORDS: dict[str, list[str]] = {
    "sexual_harassment": [
        "sexual harassment", "sexually harassed", "sexually harass", "harassed me",
        "inappropriate touching", "unwanted advances",
        "sexual comments", "groping", "sexual favors", "quid pro quo",
        "sexual pressure", "inappropriate comments about appearance",
    ],
    "gbv": [
        "gender based violence", "gbv", "domestic violence", "intimate partner violence",
        "rape", "sexual assault", "forced", "coerced", "violence",
        "physical abuse", "hitting", "beating", "threatening", "threatened me",
    ],
    "financial_aid": [
        "financial aid", "tuition", "fees", "bursary", "scholarship",
        "payment plan", "cant afford", "financial emergency", "money problems",
        "financial difficulty", "struggling to pay",
    ],
    "academic_misconduct": [
        "academic misconduct", "cheating", "cheated", "plagiarism", "plagiarized", "fraud",
        "unfair grading", "grade dispute", "exam irregularity",
    ],
    "discrimination": [
        "discrimination", "racism", "sexism", "homophobia", "transphobia",
        "bias", "prejudice", "unfair treatment", "excluded because",
    ],
    "health_services": [
        "health", "medical", "sick", "illness", "medication",
        "clinic", "hospital", "doctor", "mental health services",
    ],
    "housing": [
        "housing", "accommodation", "dormitory", "hostel", "room",
        "roommate", "living situation", "homeless",
    ],
    "general": [],
}

URGENCY_INDICATORS: dict[str, list[str]] = {
    "immediate": [
        "right now", "immediately", "emergency", "urgent", "crisis",
        "suicide", "kill myself", "end my life", "hurt myself",
        "happening now", "need help now", "cant wait",
    ],
    "critical": [
        "very urgent", "severe", "serious", "critical", "dangerous",
        "unsafe", "at risk", "in danger", "scared for my safety",
        "cant cope", "breaking down",
    ],
    "high": [
        "urgent", "soon as possible", "asap", "important",
        "struggling badly", "getting worse", "cant handle",
    ],
    "medium": [
        "would like to discuss", "need support", "help with",
        "concerned about", "dealing with",
    ],
    "low": [
        "general", "question", "information", "advice",
        "curious about", "wondering",
    ],
}

DANGER_INDICATORS = [
    "happening now", "right now", "currently", "at this moment",
    "being attacked", "being harassed", "being hurt", "in danger",
    "help me", "need help immediately", "emergency",
]

EMERGENCY_TRIGGERS = [
    "suicide", "suicidal", "kill myself", "end my life", "want to die",
    "better off dead", "no reason to live", "hurt myself", "self harm",
    "self-harm", "cutting myself", "being attacked", "being raped",
    "in danger right now", "help me now", "emergency",
]

CATEGORY_LABELS: dict[str, str] = {
    "depression": "Depression & Low Mood",
    "anxiety": "Anxiety & Stress",
    "ptsd": "Trauma & PTSD",
    "addiction": "Addiction & Substance Use",
    "relationship": "Relationship Issues",
    "academic_stress": "Academic Stress",
    "grief": "Grief & Loss",
    "self_harm": "Self-Harm",
    "suicide": "Crisis Support",
    "eating_disorder": "Eating Disorder",
    "general": "General Counseling",
    "financial_aid": "Financial Aid",
    "sexual_harassment": "Sexual Harassment",
    "gbv": "Gender-Based Violence",
    "academic_misconduct": "Academic Misconduct",
    "discrimination": "Discrimination",
    "health_services": "Health Services",
    "housing": "Housing Issues",
}

COUNSELING_CATEGORIES = set(COUNSELING_KEYWORDS.keys())
CASE_CATEGORIES = set(CASE_KEYWORDS.keys())


def _combine_user_text(messages: list[ChatMessage]) -> str:
    return "\n".join(m.content for m in messages if m.role.value == "user")


def _best_category(text: str, keywords_map: dict[str, list[str]]) -> tuple[str, list[str]]:
    lower = text.lower()
    best = "general"
    max_matches = 0
    matched: list[str] = []

    for category, keywords in keywords_map.items():
        hits = [kw for kw in keywords if kw.lower() in lower]
        if len(hits) > max_matches:
            max_matches = len(hits)
            best = category
            matched = hits

    return best, matched


def _detect_urgency(text: str, critical_categories: list[str] | None = None) -> tuple[UrgencyLevel, bool]:
    lower = text.lower()
    critical_categories = critical_categories or []

    for keyword in URGENCY_INDICATORS["immediate"]:
        if keyword in lower:
            return UrgencyLevel.IMMEDIATE, True

    for keyword in URGENCY_INDICATORS["critical"]:
        if keyword in lower:
            return UrgencyLevel.CRITICAL, False

    for keyword in URGENCY_INDICATORS["high"]:
        if keyword in lower:
            return UrgencyLevel.HIGH, False

    for keyword in URGENCY_INDICATORS["low"]:
        if keyword in lower:
            return UrgencyLevel.LOW, False

    if any(cat in critical_categories for cat in ["suicide", "self_harm"]):
        return UrgencyLevel.IMMEDIATE, True

    return UrgencyLevel.MEDIUM, False


def detect_crisis(text: str) -> bool:
    lower = text.lower()
    return any(trigger in lower for trigger in EMERGENCY_TRIGGERS)


def detect_service_intent(text: str) -> ServiceType:
    lower = text.lower()
    if detect_crisis(text):
        return ServiceType.EMERGENCY

    case_signals = [
        "report", "incident", "happened to me", "happened", "case", "complaint",
        "harass", "assault", "abuse", "violence", "raped", "rapist", "stole",
        "discriminat", "misconduct", "bully", "threaten",
    ]
    if any(signal in lower for signal in case_signals):
        return ServiceType.CASE_REPORT

    counseling_signals = [
        "counsel", "talk", "support", "session", "feeling", "stressed",
        "anxious", "depressed", "overwhelmed", "lonely", "grief", "panic",
    ]
    if any(signal in lower for signal in counseling_signals):
        return ServiceType.COUNSELING

    # Fall back to keyword category match
    _, case_matches = _best_category(text, CASE_KEYWORDS)
    _, counseling_matches = _best_category(text, COUNSELING_KEYWORDS)
    if len(case_matches) > len(counseling_matches):
        return ServiceType.CASE_REPORT
    if counseling_matches:
        return ServiceType.COUNSELING

    return ServiceType.UNSPECIFIED


def categorize_counseling(description: str) -> dict:
    category, matched = _best_category(description, COUNSELING_KEYWORDS)
    urgency, immediate = _detect_urgency(description, [category])

    if category in ("suicide", "self_harm"):
        immediate = True
        if urgency in (UrgencyLevel.LOW, UrgencyLevel.MEDIUM):
            urgency = UrgencyLevel.IMMEDIATE

    return {
        "category": category,
        "urgency": urgency,
        "requires_immediate_attention": immediate,
        "matched_keywords": matched,
    }


def categorize_case(description: str) -> dict:
    category, matched = _best_category(description, CASE_KEYWORDS)
    lower = description.lower()
    requires_location = False
    urgency = UrgencyLevel.MEDIUM

    for keyword in DANGER_INDICATORS:
        if keyword in lower:
            requires_location = True
            urgency = UrgencyLevel.IMMEDIATE
            break

    if category in ("gbv", "sexual_harassment") and not requires_location:
        if urgency in (UrgencyLevel.LOW, UrgencyLevel.MEDIUM):
            urgency = UrgencyLevel.HIGH

    return {
        "category": category,
        "urgency": urgency,
        "requires_location_sharing": requires_location,
        "matched_keywords": matched,
    }


def _extract_incident_date(text: str) -> str | None:
    patterns = [
        r"\b(?:on\s+)?(today|yesterday|tomorrow|last\s+\w+|this\s+\w+|\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December))\b",
    ]
    lower = text.lower()
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    return None


def _extract_incident_time(text: str) -> str | None:
    patterns = [
        r"\b(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b",
        r"\b(?:around|about|approximately|approx\.?|early|late)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b",
        r"\b(?:early morning|late morning|afternoon|evening|night|midnight|noon|early evening|late afternoon)\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    return None


def _extract_location(text: str) -> str | None:
    patterns = [
        r"\b(?:at|in|near|outside|inside|on)\s+([A-Z][A-Za-z0-9 '\-]{3,80})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            location = match.group(1).strip()
            return location
    return None


def _extract_reported_by(text: str) -> tuple[str | None, str | None]:
    lower = text.lower()
    reported_by_type = None
    if "witness" in lower:
        reported_by_type = "witness"
    elif "friend" in lower:
        reported_by_type = "friend"
    elif "victim" in lower or "i am" in lower or "i'm" in lower:
        reported_by_type = "victim"
    elif "other" in lower:
        reported_by_type = "other"

    name_match = re.search(r"(?:my name is|i am|i'm|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})", text)
    reported_by_name = name_match.group(1) if name_match else None
    return reported_by_type, reported_by_name


def _extract_defendant_name(text: str) -> str | None:
    match = re.search(r"(?:by|from|named|called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})", text)
    return match.group(1) if match else None


def _extract_subject(text: str) -> str:
    sentence = text.strip().split(". ")[0]
    headline = sentence.strip()[:120]
    return headline or "Case report"


def extract_case_details(messages: list[ChatMessage], service_type: ServiceType) -> CaseExtraction:
    text = _combine_user_text(messages)
    category, matched_keywords = _best_category(text, CASE_KEYWORDS)
    urgency, immediate = _detect_urgency(text, [category])
    is_anonymous = "anonymous" in text.lower() or "keep me anonymous" in text.lower()
    incident_date = _extract_incident_date(text)
    incident_time = _extract_incident_time(text)
    incident_location = _extract_location(text)
    reported_by_type, reported_by_name = _extract_reported_by(text)
    defendant_name = _extract_defendant_name(text)
    subject = _extract_subject(text)

    return CaseExtraction(
        service_type=service_type,
        category=category,
        category_label=CATEGORY_LABELS.get(category, category.replace("_", " ").title()),
        urgency=urgency,
        requires_immediate_attention=immediate,
        requires_location_sharing="anonymous" not in text.lower() and urgency == UrgencyLevel.IMMEDIATE,
        is_anonymous=is_anonymous,
        description=text,
        subject=subject,
        incident_date=incident_date,
        incident_time=incident_time,
        incident_location=incident_location,
        reported_by_type=reported_by_type,
        reported_by_name=reported_by_name,
        defendant_name=defendant_name,
        matched_keywords=matched_keywords,
        summary=_build_summary(text, service_type, category, urgency),
    )


def _confidence(matched_keywords: list[str], category: str) -> str:
    if category == "general" or not matched_keywords:
        return "low"
    if len(matched_keywords) >= 2:
        return "high"
    return "medium"


def _build_summary(text: str, service_type: ServiceType, category: str, urgency: UrgencyLevel) -> str:
    label = CATEGORY_LABELS.get(category, category.replace("_", " ").title())
    snippet = text.strip()[:200]
    if len(text) > 200:
        snippet += "..."
    return (
        f"Service: {service_type.value.replace('_', ' ')}. "
        f"Category: {label}. Urgency: {urgency.value}. "
        f"Patient concern: {snippet}"
    )


def analyze_conversation(
    messages: list[ChatMessage],
    service_type: ServiceType | None = None,
) -> CaseAnalysis:
    """Analyze full conversation and produce categorization with referral."""
    text = _combine_user_text(messages)

    if service_type is None or service_type == ServiceType.UNSPECIFIED:
        service_type = detect_service_intent(text)

    # Re-check case keywords when intent is still unclear
    if service_type == ServiceType.UNSPECIFIED:
        case_cat, case_kw = _best_category(text, CASE_KEYWORDS)
        counsel_cat, counsel_kw = _best_category(text, COUNSELING_KEYWORDS)
        if case_cat != "general" and len(case_kw) >= len(counsel_kw):
            service_type = ServiceType.CASE_REPORT
        elif counsel_cat != "general":
            service_type = ServiceType.COUNSELING

    if service_type == ServiceType.EMERGENCY or detect_crisis(text):
        referral = get_referral("suicide", ServiceType.EMERGENCY, UrgencyLevel.IMMEDIATE)
        return CaseAnalysis(
            service_type=ServiceType.EMERGENCY,
            category="suicide",
            category_label=CATEGORY_LABELS["suicide"],
            urgency=UrgencyLevel.IMMEDIATE,
            requires_immediate_attention=True,
            requires_location_sharing=True,
            matched_keywords=[kw for kw in EMERGENCY_TRIGGERS if kw in text.lower()],
            referral_target=referral.target,
            referral_description=referral.description,
            confidence="high",
            summary=_build_summary(text, ServiceType.EMERGENCY, "suicide", UrgencyLevel.IMMEDIATE),
        )

    if service_type == ServiceType.CASE_REPORT:
        result = categorize_case(text)
        referral = get_referral(
            result["category"],
            ServiceType.CASE_REPORT,
            result["urgency"],
        )
        return CaseAnalysis(
            service_type=ServiceType.CASE_REPORT,
            category=result["category"],
            category_label=CATEGORY_LABELS.get(result["category"], result["category"]),
            urgency=result["urgency"],
            requires_immediate_attention=result["urgency"] == UrgencyLevel.IMMEDIATE,
            requires_location_sharing=result["requires_location_sharing"],
            matched_keywords=result["matched_keywords"],
            referral_target=referral.target,
            referral_description=referral.description,
            confidence=_confidence(result["matched_keywords"], result["category"]),
            summary=_build_summary(text, ServiceType.CASE_REPORT, result["category"], result["urgency"]),
        )

    # Default: counseling
    result = categorize_counseling(text)
    referral = get_referral(
        result["category"],
        ServiceType.COUNSELING,
        result["urgency"],
    )
    return CaseAnalysis(
        service_type=ServiceType.COUNSELING,
        category=result["category"],
        category_label=CATEGORY_LABELS.get(result["category"], result["category"]),
        urgency=result["urgency"],
        requires_immediate_attention=result["requires_immediate_attention"],
        requires_location_sharing=False,
        matched_keywords=result["matched_keywords"],
        referral_target=referral.target,
        referral_description=referral.description,
        confidence=_confidence(result["matched_keywords"], result["category"]),
        summary=_build_summary(text, ServiceType.COUNSELING, result["category"], result["urgency"]),
    )
