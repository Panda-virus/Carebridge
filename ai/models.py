"""Pydantic models for CareBridge AI API."""

from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ServiceType(str, Enum):
    COUNSELING = "counseling"
    CASE_REPORT = "case_report"
    EMERGENCY = "emergency"
    UNSPECIFIED = "unspecified"


class UrgencyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    IMMEDIATE = "immediate"


class ReferralTarget(str, Enum):
    COUNSELOR = "counselor"
    IIC = "iic"
    DEAN_OF_STUDENTS = "dean_of_students"
    REGISTRAR = "registrar"
    DISCIPLINARY_COMMITTEE = "disciplinary_committee"
    EMERGENCY_TEAM = "emergency_team"
    GENERAL_SUPPORT = "general_support"


class ChatMessage(BaseModel):
    role: MessageRole
    content: str = Field(..., min_length=1, max_length=4000)


class ChatContext(BaseModel):
    stage: str = "general"
    service_type: ServiceType = ServiceType.UNSPECIFIED


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1)
    context: ChatContext | None = None


class ChatResponse(BaseModel):
    reply: str
    model: str = "carebridge-rule-based"
    provider: str = "carebridge"
    fallback: bool = False
    crisis_detected: bool = False


class AnalysisRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1)
    service_type: ServiceType | None = None


class CaseAnalysis(BaseModel):
    service_type: ServiceType
    category: str
    category_label: str
    urgency: UrgencyLevel
    requires_immediate_attention: bool = False
    requires_location_sharing: bool = False
    matched_keywords: list[str] = Field(default_factory=list)
    referral_target: ReferralTarget
    referral_description: str
    confidence: Literal["low", "medium", "high"] = "medium"
    summary: str = ""


class CaseExtraction(BaseModel):
    service_type: ServiceType
    category: str
    category_label: str
    urgency: UrgencyLevel
    requires_immediate_attention: bool = False
    requires_location_sharing: bool = False
    is_anonymous: bool = False
    description: str
    subject: Optional[str] = None
    incident_date: Optional[str] = None
    incident_time: Optional[str] = None
    incident_location: Optional[str] = None
    reported_by_type: Optional[str] = None
    reported_by_name: Optional[str] = None
    defendant_name: Optional[str] = None
    matched_keywords: list[str] = Field(default_factory=list)
    summary: str = ""


class ConversationResponse(BaseModel):
    reply: str
    analysis: CaseAnalysis | None = None
    extracted_case: CaseExtraction | None = None
    crisis_detected: bool = False
    model: str = "carebridge-rule-based"
    provider: str = "carebridge"


class StatusResponse(BaseModel):
    enabled: bool
    model: str
    llm_enabled: bool
    version: str = "1.0.0"
