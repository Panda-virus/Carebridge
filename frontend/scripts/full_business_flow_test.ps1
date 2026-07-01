$base = 'http://127.0.0.1:8000/api'
function ToJson($obj) {
    if ($null -eq $obj) { return $null }
    return $obj | ConvertTo-Json -Depth 10
}
function Headers($token) {
    $headers = @{ 'Content-Type' = 'application/json' }
    if ($token) { $headers.Authorization = "Bearer $token" }
    return $headers
}
function Post($uri, $token, $body) {
    Write-Host "POST $uri"
    return Invoke-RestMethod -Method Post -Uri "$base$uri" -Headers (Headers $token) -Body (ToJson $body) -TimeoutSec 30
}
function Patch($uri, $token, $body) {
    Write-Host "PATCH $uri"
    return Invoke-RestMethod -Method Patch -Uri "$base$uri" -Headers (Headers $token) -Body (ToJson $body) -TimeoutSec 30
}
function Login($email,$password) {
    Write-Host "LOGIN $email"
    return Post '/login' $null @{ email = $email; password = $password }
}
try {
    $timestamp = [int][double]::Parse((Get-Date -UFormat %s))
    $studentEmail = "student_test_${timestamp}@mzuni.ac.mw"
    $studentPhone = "0999000$([string]((($timestamp % 900) + 100)))"
    Write-Host "Register student $studentEmail"
    $register = Post '/register' $null @{ name = 'Test Student'; email = $studentEmail; phone = $studentPhone; location = 'oncampus'; has_ongoing_case = $false; password = 'student01'; password_confirmation = 'student01' }
    Write-Host "Registered student id=$($register.user.id)"
    $studentToken = $register.token
    Write-Host 'Creating counseling request'
    $counselReq = Post '/counseling-requests' $studentToken @{ student_id = $register.user.id; concern = 'I am very anxious and depressed due to exams and need someone to talk to.'; category = 'anxiety'; urgency_level = 'medium'; preferred_time = 'afternoon'; status = 'pending_review'; requires_immediate_attention = $false; matched_keywords = @('anxiety','depression','exams'); auto_schedule = $false }
    $requestId = $counselReq.id
    Write-Host "Counseling request id=$requestId status=$($counselReq.status)"
    $counselor = Login 'universitycounsellor@mzuni.ac.mw' 'counsellor01'
    $counselorToken = $counselor.token
    $proposedDate = (Get-Date).ToString('yyyy-MM-dd')
    $schedule = Patch "/counseling-requests/$requestId" $counselorToken @{ counselor_id = $counselor.user.id; proposed_date = $proposedDate; proposed_time = '14:00'; counselor_approved = $true }
    Write-Host "Counselor approved request status=$($schedule.status)"
    $approved = Post "/counseling-requests/$requestId/approve-student" $studentToken @{}
    Write-Host "Student approved schedule status=$($approved.status) scheduled_date=$($approved.scheduled_date) scheduled_time=$($approved.scheduled_time)"
    for ($i = 1; $i -le 6; $i++) {
        $score = 80 + ($i % 5)
        Write-Host "Logging session $i score=$score"
        $session = Post "/counseling-requests/$requestId/log-session" $counselorToken @{ notes = "Session $i notes."; score = $score; completed_sessions = $i }
        Write-Host "Completed sessions = $($session.completed_sessions), overall_score = $($session.overall_score), status = $($session.status)"
    }
    if ($session.overall_score -ge 70) {
        Write-Host 'Closing successful counseling case'
        $closed = Patch "/counseling-requests/$requestId" $counselorToken @{ status = 'completed' }
        Write-Host "Counseling final status = $($closed.status)"
    } else {
        Write-Host 'Case referred to external counselor due low score'
        Write-Host "Referral reason = $($session.referral_reason)"
    }
    Write-Host 'Creating anonymous case report'
    $case = Post '/case-reports' $studentToken @{ category = 'sexual_harassment_gbv'; detailed_category = 'sexual_harassment'; description = 'Someone sexually harassed me in the hostel last week and I am afraid to report in person.'; urgency_level = 'high'; requires_location_sharing = $false; matched_keywords = @('sexual harassment','hostel'); is_anonymous = $true; incident_date = (Get-Date).AddDays(-5).ToString('yyyy-MM-dd'); incident_location = 'Hostel Block C' }
    $caseId = $case.id
    Write-Host "Anonymous case report id=$caseId assigned_role=$($case.assigned_role) workflow_stage=$($case.workflow_stage)"
    $iic = Login 'iic@mzuni.ac.mw' 'iic01'
    $iicToken = $iic.token
    $perm = Post "/case-reports/$caseId/workflow/request-permission" $iicToken @{ permission_request = 'Please approve investigation of this anonymous report.' }
    Write-Host "Permission request stage=$($perm.workflow_stage) assigned_role=$($perm.assigned_role)"
    $registrar = Login 'registrar@university.edu' 'registrar01'
    $registrarToken = $registrar.token
    $approve = Post "/case-reports/$caseId/workflow/approve-permission" $registrarToken @{ response_notes = 'Permission approved for IIC investigation.' }
    Write-Host "Permission approved stage=$($approve.workflow_stage) assigned_role=$($approve.assigned_role)"
    $investigation = Post "/case-reports/$caseId/workflow/start-investigation" $iicToken @{}
    Write-Host "Investigation stage=$($investigation.workflow_stage)"
    $findings = Post "/case-reports/$caseId/workflow/submit-findings" $iicToken @{ findings_report = 'Investigation completed. Enough evidence to forward to disciplinary committee.' }
    Write-Host "Findings stage=$($findings.workflow_stage) assigned_role=$($findings.assigned_role)"
    $forward = Post "/case-reports/$caseId/workflow/forward-to-disciplinary" $registrarToken @{ response_notes = 'Forwarding to disciplinary committee for review.' }
    Write-Host "Forwarded stage=$($forward.workflow_stage) assigned_role=$($forward.assigned_role)"
    $disciplinary = Login 'disciplinary@university.edu' 'disciplinary01'
    $disciplinaryToken = $disciplinary.token
    $meetingDate = (Get-Date).AddDays(7).ToString('yyyy-MM-dd')
    $meeting = Post "/case-reports/$caseId/workflow/send-meeting-notice" $disciplinaryToken @{ meeting_notice = 'Meeting scheduled for case review.'; meeting_date = $meetingDate }
    Write-Host "Meeting stage=$($meeting.workflow_stage) meeting_date=$($meeting.meeting_date)"
    $verdict = Post "/case-reports/$caseId/workflow/record-verdict" $disciplinaryToken @{ verdict = 'Closed with no further action after disciplinary review.'; response_notes = 'Verdict recorded after offline committee review.' }
    Write-Host "Final case stage=$($verdict.workflow_stage) status=$($verdict.status) verdict=$($verdict.verdict)"
    Write-Host '=== Business flow test complete ==='
    Write-Host "Counseling request id=$requestId final_status=$($closed.status)"
    Write-Host "Case report id=$caseId final_status=$($verdict.status)"
} catch {
    Write-Host 'ERROR:' $_.Exception.Message
    if ($_.Exception.Response) {
        try { $resp = $_.Exception.Response.GetResponseStream(); $reader = New-Object System.IO.StreamReader($resp); Write-Host ($reader.ReadToEnd()) } catch {}
    }
    exit 1
}
