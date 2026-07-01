"""Route analyzed cases to the appropriate CareBridge department."""

from dataclasses import dataclass

from .models import ReferralTarget, ServiceType, UrgencyLevel


@dataclass(frozen=True)
class Referral:
    target: ReferralTarget
    description: str
    department_name: str
    priority_note: str = ""


def get_referral(
    category: str,
    service_type: ServiceType,
    urgency: UrgencyLevel,
) -> Referral:
    """Determine where a case should be referred based on type and urgency."""

    if service_type == ServiceType.EMERGENCY or category in ("suicide", "self_harm"):
        priority = (
            "Contact within the hour."
            if urgency in (UrgencyLevel.IMMEDIATE, UrgencyLevel.CRITICAL)
            else "Prioritize as soon as possible."
        )
        return Referral(
            target=ReferralTarget.EMERGENCY_TEAM,
            department_name="Emergency Counseling Team",
            description=(
                "Refer to the on-call counselor with URGENT priority. "
                "Alert campus security if the student is in immediate danger."
            ),
            priority_note=priority,
        )

    if service_type == ServiceType.CASE_REPORT:
        if category in ("sexual_harassment", "gbv"):
            return Referral(
                target=ReferralTarget.IIC,
                department_name="IIC (Investigating & Intervention Committee)",
                description=(
                    "Refer to the IIC for confidential handling of sexual harassment "
                    "or gender-based violence. Anonymous reporting is available."
                ),
                priority_note=_urgency_note(urgency),
            )
        if category == "financial_aid":
            return Referral(
                target=ReferralTarget.REGISTRAR,
                department_name="Registrar's Office",
                description=(
                    "Refer to the Registrar for fees, bursary, scholarship, "
                    "and enrollment support."
                ),
                priority_note=_urgency_note(urgency),
            )
        if category == "academic_misconduct":
            return Referral(
                target=ReferralTarget.DISCIPLINARY_COMMITTEE,
                department_name="Disciplinary Committee",
                description=(
                    "Refer to the Disciplinary Committee for academic misconduct "
                    "and integrity violations."
                ),
                priority_note=_urgency_note(urgency),
            )
        return Referral(
            target=ReferralTarget.DEAN_OF_STUDENTS,
            department_name="Dean of Students Office",
            description=(
                "Refer to the Dean of Students for review and appropriate action "
                f"on {category.replace('_', ' ')} matters."
            ),
            priority_note=_urgency_note(urgency),
        )

    # Counseling cases
    counseling_routes: dict[str, Referral] = {
        "depression": Referral(
            target=ReferralTarget.COUNSELOR,
            department_name="University Counsellor",
            description="Refer to the University Counsellor for professional mental health support.",
        ),
        "anxiety": Referral(
            target=ReferralTarget.COUNSELOR,
            department_name="University Counsellor",
            description="Refer to the University Counsellor for anxiety and stress management.",
        ),
        "ptsd": Referral(
            target=ReferralTarget.COUNSELOR,
            department_name="University Counsellor",
            description="Refer to the University Counsellor for trauma-informed support.",
        ),
        "grief": Referral(
            target=ReferralTarget.COUNSELOR,
            department_name="University Counsellor",
            description="Refer to the University Counsellor for grief and loss counseling.",
        ),
        "eating_disorder": Referral(
            target=ReferralTarget.COUNSELOR,
            department_name="University Counsellor",
            description="Refer to the University Counsellor for eating disorder support.",
        ),
        "addiction": Referral(
            target=ReferralTarget.COUNSELOR,
            department_name="University Counsellor",
            description="Refer to the University Counsellor for addiction and substance use support.",
        ),
        "relationship": Referral(
            target=ReferralTarget.COUNSELOR,
            department_name="University Counsellor",
            description="Refer to the University Counsellor for a supportive relationship counseling session.",
        ),
        "academic_stress": Referral(
            target=ReferralTarget.COUNSELOR,
            department_name="University Counsellor",
            description="Refer to the University Counsellor for academic stress and coping strategies.",
        ),
    }

    referral = counseling_routes.get(
        category,
        Referral(
            target=ReferralTarget.COUNSELOR,
            department_name="University Counsellor",
            description="Refer to the University Counsellor for general supportive counseling.",
        ),
    )
    return Referral(
        target=referral.target,
        department_name=referral.department_name,
        description=referral.description,
        priority_note=_urgency_note(urgency),
    )


def _urgency_note(urgency: UrgencyLevel) -> str:
    notes = {
        UrgencyLevel.IMMEDIATE: "IMMEDIATE — respond within the hour.",
        UrgencyLevel.CRITICAL: "CRITICAL — respond same day.",
        UrgencyLevel.HIGH: "HIGH — respond within 24–48 hours.",
        UrgencyLevel.MEDIUM: "MEDIUM — schedule within one week.",
        UrgencyLevel.LOW: "LOW — schedule at next available slot.",
    }
    return notes.get(urgency, "MEDIUM — schedule within one week.")
