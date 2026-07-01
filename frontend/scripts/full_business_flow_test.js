const base = 'http://127.0.0.1:8000/api';
async function request(path, options = {}) {
  const url = `${base}${path}`;
  const opts = { headers: { 'Content-Type': 'application/json' }, ...options };
  if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch (e) { throw new Error(`Invalid JSON response from ${path}: ${text}`); }
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${JSON.stringify(json)}`);
  }
  return json;
}
async function post(path, body, token) {
  return request(path, { method: 'POST', headers: { ...{ 'Content-Type': 'application/json' }, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body });
}
async function patch(path, body, token) {
  return request(path, { method: 'PATCH', headers: { ...{ 'Content-Type': 'application/json' }, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body });
}
(async () => {
  console.log('=== Starting business workflow test ===');
  const ts = Math.floor(Date.now() / 1000);
  const studentEmail = `student_test_${ts}@mzuni.ac.mw`;
  const studentPhone = `0999000${100 + (ts % 900)}`;
  console.log('Register student', studentEmail);
  const studentRegister = await post('/register', {
    name: 'Test Student',
    email: studentEmail,
    phone: studentPhone,
    location: 'oncampus',
    has_ongoing_case: false,
    password: 'student01',
    password_confirmation: 'student01',
  });
  const studentToken = studentRegister.token;
  const studentId = studentRegister.user.id;
  console.log('Registered student id=', studentId);
  const counseling = await post('/counseling-requests', {
    student_id: studentId,
    concern: 'I am very anxious and depressed due to exams and need someone to talk to.',
    category: 'anxiety',
    urgency_level: 'medium',
    preferred_time: 'afternoon',
    status: 'pending_review',
    requires_immediate_attention: false,
    matched_keywords: ['anxiety', 'depression', 'exams'],
    auto_schedule: false,
  }, studentToken);
  console.log('Created counseling request', counseling.id, counseling.status);
  const counselorLogin = await post('/login', { email: 'universitycounsellor@mzuni.ac.mw', password: 'counsellor01' });
  const counselorToken = counselorLogin.token;
  console.log('Counselor login ok');
  const today = new Date().toISOString().slice(0, 10);
  const counselorUpdated = await patch(`/counseling-requests/${counseling.id}`, {
    counselor_id: counselorLogin.user.id,
    proposed_date: today,
    proposed_time: '14:00',
    counselor_approved: true,
  }, counselorToken);
  console.log('Counselor approved schedule status=', counselorUpdated.status);
  const studentApproved = await post(`/counseling-requests/${counseling.id}/approve-student`, {}, studentToken);
  console.log('Student approved schedule:', studentApproved.status, studentApproved.scheduled_date, studentApproved.scheduled_time);
  let session;
  for (let i = 1; i <= 6; i += 1) {
    const score = 80 + (i % 5);
    console.log(`Logging session ${i} score=${score}`);
    session = await post(`/counseling-requests/${counseling.id}/log-session`, {
      notes: `Session ${i} notes.`, score, completed_sessions: i,
    }, counselorToken);
    console.log(`Session ${i} saved: completed=${session.completed_sessions}, overall_score=${session.overall_score}, status=${session.status}`);
  }
  if (session.overall_score >= 70) {
    console.log('Closing successful counseling case');
    const closed = await patch(`/counseling-requests/${counseling.id}`, { status: 'completed' }, counselorToken);
    console.log('Counseling final status=', closed.status);
  } else {
    console.log('Case referred to external counselor at score', session.overall_score);
  }
  console.log('Submitting GBV case report');
  const caseReport = await post('/case-reports', {
    category: 'sexual_harassment_gbv',
    detailed_category: 'sexual_harassment',
    description: 'Someone sexually harassed me in the hostel last week and I am afraid to report in person.',
    urgency_level: 'high',
    requires_location_sharing: false,
    matched_keywords: ['sexual harassment', 'hostel'],
    incident_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    incident_location: 'Hostel Block C',
  }, studentToken);
  console.log('Anonymous case report id=', caseReport.id, 'assigned_role=', caseReport.assigned_role, 'workflow_stage=', caseReport.workflow_stage);
  const iicLogin = await post('/login', { email: 'iic@mzuni.ac.mw', password: 'iic01' });
  const iicToken = iicLogin.token;
  const requestPermission = await post(`/case-reports/${caseReport.id}/workflow/request-permission`, { permission_request: 'Please approve investigation of this anonymous report.' }, iicToken);
  console.log('Permission request stage=', requestPermission.workflow_stage, requestPermission.assigned_role);
  const registrarLogin = await post('/login', { email: 'registrar@university.edu', password: 'registrar01' });
  const registrarToken = registrarLogin.token;
  const approvePermission = await post(`/case-reports/${caseReport.id}/workflow/approve-permission`, { response_notes: 'Permission approved for IIC investigation.' }, registrarToken);
  console.log('Permission approved stage=', approvePermission.workflow_stage, approvePermission.assigned_role);
  const startInvestigation = await post(`/case-reports/${caseReport.id}/workflow/start-investigation`, {}, iicToken);
  console.log('Investigation stage=', startInvestigation.workflow_stage);
  const submitFindings = await post(`/case-reports/${caseReport.id}/workflow/submit-findings`, { findings_report: 'Investigation completed. Findings forwarded to Registrar.' }, iicToken);
  console.log('Findings submitted stage=', submitFindings.workflow_stage, submitFindings.assigned_role);
  const forwardToDisciplinary = await post(`/case-reports/${caseReport.id}/workflow/forward-to-disciplinary`, { response_notes: 'Forwarding to disciplinary committee for review.' }, registrarToken);
  console.log('Forwarded stage=', forwardToDisciplinary.workflow_stage, forwardToDisciplinary.assigned_role);
  const disciplinaryLogin = await post('/login', { email: 'disciplinary@university.edu', password: 'disciplinary01' });
  const disciplinaryToken = disciplinaryLogin.token;
  const meetingNotice = await post(`/case-reports/${caseReport.id}/workflow/send-meeting-notice`, { meeting_notice: 'Meeting scheduled for case review.', meeting_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) }, disciplinaryToken);
  console.log('Meeting notice stage=', meetingNotice.workflow_stage, meetingNotice.meeting_date);
  const verdict = await post(`/case-reports/${caseReport.id}/workflow/record-verdict`, { verdict: 'Closed with no further action after disciplinary review.', response_notes: 'Verdict recorded after offline committee review.' }, disciplinaryToken);
  console.log('Final case stage=', verdict.workflow_stage, 'status=', verdict.status, 'verdict=', verdict.verdict);
  console.log('=== Business workflow test completed ===');
  console.log('Counseling request id=', counseling.id, 'final_status=', session.overall_score >= 70 ? 'completed' : 'referred');
  console.log('Case report id=', caseReport.id, 'final_status=', verdict.status);
})().catch((err) => { console.error(err); process.exit(1); });