"""Test Registrar and Disciplinary Committee roles and dashboards."""

import httpx

API = "http://127.0.0.1:8000/api"

def login(email, password):
    r = httpx.post(f"{API}/login", json={"email": email, "password": password}, timeout=30)
    r.raise_for_status()
    data = r.json()
    return data["token"], data["user"]

def headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("=== Registrar & Disciplinary Role Test ===\n")

# 1. Login both roles
reg_token, reg_user = login("registrar@university.edu", "registrar01")
print(f"[OK] Registrar login: {reg_user['name']} (role={reg_user['role']})")

disc_token, disc_user = login("disciplinary@university.edu", "disciplinary01")
print(f"[OK] Disciplinary login: {disc_user['name']} (role={disc_user['role']})")

student_token, student = login("student@mzuni.ac.mw", "student01")

# 2. Submit financial aid case -> Registrar
r = httpx.post(f"{API}/case-reports", headers=headers(student_token), json={
    "category": "general",
    "detailed_category": "financial_aid",
    "description": "I cannot afford tuition this semester and need a payment plan or bursary support.",
    "urgency_level": "high",
    "student_id": student["id"],
    "is_anonymous": False,
    "department": "Business Administration",
    "year_of_study": "2",
    "sub_category": "fees_support",
})
assert r.status_code == 201, r.text
reg_case = r.json()
print(f"[OK] Financial aid case created (id={reg_case['id']}) -> detailed_category=financial_aid")

# 3. Submit academic misconduct case -> Disciplinary
r = httpx.post(f"{API}/case-reports", headers=headers(student_token), json={
    "category": "general",
    "detailed_category": "academic_misconduct",
    "description": "A classmate copied my exam answers and submitted them as their own work.",
    "urgency_level": "medium",
    "student_id": student["id"],
    "is_anonymous": False,
    "department": "Computer Science",
    "year_of_study": "3",
})
assert r.status_code == 201, r.text
disc_case = r.json()
print(f"[OK] Misconduct case created (id={disc_case['id']}) -> detailed_category=academic_misconduct")

# 4. Registrar sees and responds
r = httpx.get(f"{API}/case-reports", headers=headers(reg_token))
reg_reports = r.json()
reg_ids = [x["id"] for x in reg_reports]
assert reg_case["id"] in reg_ids, "Registrar should see financial aid case"
print(f"[OK] Registrar dashboard data: {len(reg_reports)} cases, includes financial aid case")

r = httpx.patch(f"{API}/case-reports/{reg_case['id']}", headers=headers(reg_token), json={
    "status": "resolved",
    "response_notes": "Approved a 3-month payment plan. Visit the Registrar office by Friday.",
})
assert r.status_code == 200 and r.json()["status"] == "resolved"
print(f"[OK] Registrar responded: {r.json()['response_notes'][:50]}...")

# 5. Disciplinary sees and responds
r = httpx.get(f"{API}/case-reports", headers=headers(disc_token))
disc_reports = r.json()
disc_ids = [x["id"] for x in disc_reports]
assert disc_case["id"] in disc_ids, "Disciplinary should see misconduct case"
print(f"[OK] Disciplinary dashboard data: {len(disc_reports)} cases, includes misconduct case")

r = httpx.patch(f"{API}/case-reports/{disc_case['id']}", headers=headers(disc_token), json={
    "status": "under_review",
    "response_notes": "Investigation opened. Both parties will be contacted for a hearing next week.",
})
assert r.status_code == 200
print(f"[OK] Disciplinary responded: {r.json()['response_notes'][:50]}...")

# 6. AI routes correctly
r = httpx.post(f"{API}/chat/analyze", json={
    "messages": [{"role": "user", "content": "I need help paying my tuition fees"}],
    "service_type": "case_report",
})
analysis = r.json()
assert analysis.get("referral_target") == "registrar", analysis
print(f"[OK] AI routes financial aid -> {analysis['referral_target']}")

r = httpx.post(f"{API}/chat/analyze", json={
    "messages": [{"role": "user", "content": "Someone cheated and plagiarized my assignment"}],
    "service_type": "case_report",
})
analysis = r.json()
assert analysis.get("referral_target") == "disciplinary_committee", analysis
print(f"[OK] AI routes misconduct -> {analysis['referral_target']}")

print("\n=== All registrar & disciplinary tests passed ===")
