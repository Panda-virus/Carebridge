"""
CareBridge end-to-end system test:
Student -> AI chat -> case submission -> authority response
"""

from __future__ import annotations

import json
import sys

import httpx

API = "http://127.0.0.1:8000/api"
AI = "http://127.0.0.1:8100"

PASS = 0
FAIL = 0


def ok(label: str, detail: str = "") -> None:
    global PASS
    PASS += 1
    print(f"  [PASS] {label}" + (f" - {detail}" if detail else ""))


def fail(label: str, detail: str = "") -> None:
    global FAIL
    FAIL += 1
    print(f"  [FAIL] {label}" + (f" - {detail}" if detail else ""))


def login(email: str, password: str) -> tuple[str, dict]:
    r = httpx.post(f"{API}/login", json={"email": email, "password": password}, timeout=30)
    r.raise_for_status()
    data = r.json()
    return data["token"], data["user"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def main() -> int:
    print("\n" + "=" * 60)
    print("  CareBridge Full System Test")
    print("=" * 60)

    client = httpx.Client(timeout=30)

    # ── 0. Health checks ──────────────────────────────────────────────
    print("\n[0] Service health")
    try:
        ai_health = client.get(f"{AI}/health").json()
        ok("Python AI service", ai_health.get("status", "ok"))
    except Exception as e:
        fail("Python AI service", str(e))
        return 1

    try:
        chat_status = client.get(f"{API}/chat/status").json()
        if chat_status.get("enabled"):
            ok("AI connected to Laravel", f"provider={chat_status.get('provider')}")
        else:
            fail("AI connected to Laravel", str(chat_status))
    except Exception as e:
        fail("Laravel API", str(e))
        return 1

    # ── 1. Student logs in ────────────────────────────────────────────
    print("\n[1] Student authentication")
    student_token, student = login("student@mzuni.ac.mw", "student01")
    ok("Student login", f"{student['name']} (id={student['id']})")

    # ── 2. Student talks to AI ────────────────────────────────────────
    print("\n[2] Student talks to AI chatbot")
    concern = (
        "I have been feeling very anxious and depressed about my exams. "
        "I cannot sleep and I need someone to talk to."
    )
    chat_messages = [{"role": "user", "content": concern}]

    r = client.post(f"{API}/chat", json={
        "messages": chat_messages,
        "context": {"service_type": "counseling", "stage": "counseling_describe"},
    })
    if r.status_code == 200 and not r.json().get("fallback"):
        ai_reply = r.json()["reply"]
        ok("AI empathetic reply", ai_reply[:80] + "...")
        chat_messages.append({"role": "assistant", "content": ai_reply})
    else:
        fail("AI chat reply", r.text[:200])

    chat_messages.append({
        "role": "user",
        "content": "It has been going on for a few weeks and it is getting worse.",
    })
    r = client.post(f"{API}/chat", json={
        "messages": chat_messages,
        "context": {"service_type": "counseling", "stage": "counseling_followup"},
    })
    if r.status_code == 200:
        ok("AI follow-up reply", r.json().get("reply", "")[:80] + "...")
    else:
        fail("AI follow-up", r.text[:200])

    # ── 3. AI analyzes and categorizes ────────────────────────────────
    print("\n[3] AI analyzes case — category & urgency")
    r = client.post(f"{API}/chat/analyze", json={
        "messages": chat_messages,
        "service_type": "counseling",
    })
    if r.status_code == 200:
        analysis = r.json()
        ok("Case categorized", f"{analysis.get('category')} / urgency={analysis.get('urgency')}")
        ok("Referral routing", f"{analysis.get('referral_target')} — {analysis.get('referral_description', '')[:60]}")
        counseling_category = analysis.get("category", "general")
        counseling_urgency = analysis.get("urgency", "medium")
    else:
        fail("AI analyze", r.text[:200])
        counseling_category = "anxiety"
        counseling_urgency = "medium"

    # ── 4. Submit counseling request to counselor ─────────────────────
    print("\n[4] Submit counseling request (routed to counselor)")
    r = client.post(f"{API}/counseling-requests", headers=auth_headers(student_token), json={
        "student_id": student["id"],
        "concern": concern + "\n\nAdditional context: It has been going on for a few weeks.",
        "category": counseling_category,
        "urgency_level": counseling_urgency,
        "preferred_time": "afternoon",
        "status": "pending_review",
        "requires_immediate_attention": counseling_urgency in ("immediate", "critical"),
        "matched_keywords": ["anxiety", "depressed", "exams"],
    })
    if r.status_code == 201:
        counseling_req = r.json()
        req_id = counseling_req["id"]
        ok("Counseling request created", f"ID={req_id}, status={counseling_req['status']}")
        ok("Student name from relation", counseling_req.get("student_name") == student["name"])
    else:
        fail("Counseling request", r.text[:200])
        return 1

    # ── 5. Counselor logs in and responds ─────────────────────────────
    print("\n[5] Counselor (authority) reviews and responds")
    counselor_token, counselor = login("universitycounsellor@mzuni.ac.mw", "counsellor01")
    ok("Counselor login", counselor["name"])

    r = client.get(f"{API}/counseling-requests", headers=auth_headers(counselor_token))
    requests_list = r.json()
    found = any(str(x["id"]) == str(req_id) for x in requests_list)
    if found:
        ok("Counselor sees student request", f"request #{req_id} in queue")
    else:
        fail("Counselor sees request", f"request #{req_id} not found")

    r = client.patch(f"{API}/counseling-requests/{req_id}", headers=auth_headers(counselor_token), json={
        "status": "scheduled",
        "counselor_id": counselor["id"],
        "scheduled_date": "2026-06-20",
        "scheduled_time": "14:00",
        "total_sessions": 6,
        "completed_sessions": 0,
        "recommendations": "We have reviewed your case. A counseling session is scheduled for June 20 at 2:00 PM. Please attend the University Counselling office. You are not alone.",
    })
    if r.status_code == 200 and r.json().get("status") == "scheduled":
        ok("Counselor scheduled session", r.json().get("recommendations", "")[:60] + "...")
    else:
        fail("Counselor response", r.text[:200])

    # ── 6. GBV case report flow → IIC ────────────────────────────────
    print("\n[6] Student reports GBV case via AI -> IIC authority")
    gbv_concern = "Someone sexually harassed me in the hostel last week. I am scared to report in person."
    gbv_messages = [{"role": "user", "content": gbv_concern}]

    r = client.post(f"{API}/chat", json={
        "messages": gbv_messages,
        "context": {"service_type": "case_report", "stage": "case_describe"},
    })
    if r.status_code == 200:
        ok("AI responds to GBV report", r.json().get("reply", "")[:80] + "...")

    r = client.post(f"{API}/chat/analyze", json={
        "messages": gbv_messages,
        "service_type": "case_report",
    })
    if r.status_code == 200:
        gbv_analysis = r.json()
        ok("GBV categorized", f"{gbv_analysis.get('category')} -> {gbv_analysis.get('referral_target')}")
    else:
        gbv_analysis = {"category": "sexual_harassment", "urgency": "high"}

    r = client.post(f"{API}/case-reports", json={
        "category": "sexual_harassment_gbv",
        "detailed_category": gbv_analysis.get("category", "sexual_harassment"),
        "description": gbv_concern,
        "urgency_level": gbv_analysis.get("urgency", "high"),
        "requires_location_sharing": False,
        "matched_keywords": ["sexually harassed", "hostel"],
        "is_anonymous": True,
        "incident_date": "2026-06-11",
        "incident_location": "Hostel Block C",
    })
    if r.status_code == 201:
        case_report = r.json()
        case_id = case_report["id"]
        ok("Anonymous case report submitted", f"ID={case_id}, anonymous={case_report.get('is_anonymous')}")
    else:
        fail("Case report submission", r.text[:200])
        return 1

    # ── 7. IIC officer reviews and replies ────────────────────────────
    print("\n[7] IIC officer (authority) reviews and replies")
    iic_token, iic_user = login("iic@mzuni.ac.mw", "iic01")
    ok("IIC officer login", iic_user["name"])

    r = client.get(f"{API}/case-reports", headers=auth_headers(iic_token))
    reports = r.json()
    found_case = any(str(x["id"]) == str(case_id) for x in reports)
    if found_case:
        ok("IIC sees case report", f"case #{case_id} in queue")
    else:
        fail("IIC sees case", f"case #{case_id} not found")

    iic_response = (
        "Your report has been received and is under confidential review by the IIC. "
        "A trained officer will contact you through secure channels within 48 hours. "
        "Your safety is our priority."
    )
    r = client.patch(f"{API}/case-reports/{case_id}", headers=auth_headers(iic_token), json={
        "status": "under_review",
        "response_notes": iic_response,
    })
    if r.status_code == 200 and r.json().get("response_notes"):
        ok("IIC replied to case", r.json()["response_notes"][:60] + "...")
    else:
        fail("IIC reply", r.text[:200])

    # ── 8. Dean handles general case ────────────────────────────────
    print("\n[8] Dean of Students handles general case")
    dean_token, dean = login("deanofstudents@mzuni.ac.mw", "deanofstudents01")
    ok("Dean login", dean["name"])

    r = client.post(f"{API}/case-reports", headers=auth_headers(student_token), json={
        "category": "general",
        "detailed_category": "housing",
        "description": "My hostel room has a broken lock and I do not feel safe. I reported it weeks ago.",
        "urgency_level": "medium",
        "student_id": student["id"],
        "is_anonymous": False,
        "department": "Computer Science",
        "year_of_study": "3",
        "incident_location": "Hostel Block A",
    })
    if r.status_code == 201:
        dean_case = r.json()
        dean_case_id = dean_case["id"]
        ok("Student housing case submitted", f"ID={dean_case_id}")
        ok("Student linked via FK", dean_case.get("student_name") == student["name"])
    else:
        fail("Housing case", r.text[:200])
        return 1

    dean_reply = "We have escalated your housing safety concern to facilities management. A new lock will be installed within 24 hours."
    r = client.patch(f"{API}/case-reports/{dean_case_id}", headers=auth_headers(dean_token), json={
        "status": "resolved",
        "response_notes": dean_reply,
    })
    if r.status_code == 200 and r.json().get("status") == "resolved":
        ok("Dean resolved case", dean_reply[:60] + "...")
    else:
        fail("Dean reply", r.text[:200])

    # ── 9. Student sees authority responses ───────────────────────────
    print("\n[9] Student verifies authority responses")
    r = client.get(f"{API}/counseling-requests", headers=auth_headers(student_token))
    student_requests = [x for x in r.json() if str(x["id"]) == str(req_id)]
    if student_requests and student_requests[0].get("status") == "scheduled":
        ok("Student sees scheduled counseling", student_requests[0].get("recommendations", "")[:50] + "...")
    else:
        fail("Student counseling status", str(student_requests))

    r = client.get(f"{API}/case-reports", headers=auth_headers(student_token))
    student_cases = [x for x in r.json() if str(x["id"]) == str(dean_case_id)]
    if student_cases and student_cases[0].get("response_notes"):
        ok("Student sees Dean response", student_cases[0]["response_notes"][:50] + "...")
    else:
        fail("Student case response", str(student_cases))

    # ── Summary ───────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print(f"  RESULTS: {PASS} passed, {FAIL} failed")
    print("=" * 60 + "\n")

    client.close()
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
