# CareBridge API smoke test — run while backend is on http://127.0.0.1:8000
$Base = "http://127.0.0.1:8000/api"
$Results = @()
$Token = $null
$StudentToken = $null
$CounselorToken = $null
$IicToken = $null
$RegistrarToken = $null
$DisciplinaryToken = $null

function Test-Api {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Path,
        [object]$Body = $null,
        [string]$TokenOverride = $null,
        [int[]]$ExpectStatus = @(200, 201)
    )
    $headers = @{ "Accept" = "application/json" }
    $tok = if ($TokenOverride) { $TokenOverride } elseif ($Token) { $Token }
    if ($tok) { $headers["Authorization"] = "Bearer $tok" }

    $uri = if ($Path.StartsWith("http")) { $Path } else { "$Base$Path" }
    try {
        $params = @{
            Uri             = $uri
            Method          = $Method
            Headers         = $headers
            UseBasicParsing = $true
            TimeoutSec      = 30
        }
        if ($Body -ne $null) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10 -Compress)
            $params["ContentType"] = "application/json"
        }
        $r = Invoke-WebRequest @params
        $ok = $ExpectStatus -contains $r.StatusCode
        $script:Results += [PSCustomObject]@{
            Name   = $Name
            Method = $Method
            Path   = $Path
            Status = $r.StatusCode
            Pass   = $ok
            Note   = if ($ok) { "OK" } else { "Unexpected status" }
        }
        return $r.Content
    }
    catch {
        $status = $null
        if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
        $detail = $_.ErrorDetails.Message
        if (-not $detail -and $_.Exception.Response) {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $detail = $reader.ReadToEnd()
        }
        $ok = $status -and ($ExpectStatus -contains $status)
        $script:Results += [PSCustomObject]@{
            Name   = $Name
            Method = $Method
            Path   = $Path
            Status = if ($status) { $status } else { "ERR" }
            Pass   = $ok
            Note   = ($detail | Select-Object -First 120)
        }
        return $null
    }
}

Write-Host "=== CareBridge API Tests ===" -ForegroundColor Cyan

# Public
Test-Api "Health" GET "/health"
Test-Api "Chat status" GET "/chat/status"
Test-Api "Login (student)" POST "/login" @{ email = "student@mzuni.ac.mw"; password = "student01" } | Out-Null
$loginJson = Test-Api "Login (counselor)" POST "/login" @{ email = "universitycounsellor@mzuni.ac.mw"; password = "counsellor01" }
if ($loginJson) {
    $CounselorToken = ($loginJson | ConvertFrom-Json).token
    $StudentToken = (Test-Api "Login student token" POST "/login" @{ email = "student@mzuni.ac.mw"; password = "student01" } | ConvertFrom-Json).token
    $IicToken = (Test-Api "Login iic" POST "/login" @{ email = "iic@mzuni.ac.mw"; password = "iic01" } | ConvertFrom-Json).token
    $RegistrarToken = (Test-Api "Login registrar" POST "/login" @{ email = "registrar@university.edu"; password = "registrar01" } | ConvertFrom-Json).token
    $DisciplinaryToken = (Test-Api "Login disciplinary" POST "/login" @{ email = "disciplinary@university.edu"; password = "disciplinary01" } | ConvertFrom-Json).token
}
$Token = $StudentToken

Test-Api "Anonymous case report" POST "/case-reports" @{
    description = "API test anonymous report"
    is_anonymous = $true
    category = "general"
} -TokenOverride $null

Test-Api "Chat" POST "/chat" @{
    messages = @(@{ role = "user"; content = "Hello" })
} -ExpectStatus @(200, 503)

Test-Api "Chat analyze" POST "/chat/analyze" @{
    messages = @(@{ role = "user"; content = "I need counseling support" })
} -ExpectStatus @(200, 503)

# Auth (student)
Test-Api "Me" GET "/me"
Test-Api "Users list" GET "/users"
Test-Api "Counseling requests" GET "/counseling-requests"
Test-Api "Counseling sessions" GET "/counseling-sessions"
Test-Api "Case reports" GET "/case-reports"
Test-Api "Counselor schedules" GET "/counselor-schedules"
Test-Api "External counselors" GET "/external-counselors"
Test-Api "Disciplinary referred" GET "/disciplinary/referred"

# Create counseling request (student)
$crJson = Test-Api "Create counseling request" POST "/counseling-requests" @{
    student_id = 6
    concern = "API test concern"
    category = "academic"
    urgency_level = "medium"
}
$crId = $null
if ($crJson) { $crId = (($crJson | ConvertFrom-Json).id) }

if ($crId) {
    Test-Api "Get counseling request" GET "/counseling-requests/$crId"
    Test-Api "Counseling request sessions" GET "/counseling-requests/$crId/sessions"
    Test-Api "Update counseling request" PATCH "/counseling-requests/$crId" @{ status = "pending_review" }
}

# Counselor actions
if ($crId -and $CounselorToken) {
    Test-Api "Counselor approve" POST "/counseling-requests/$crId/approve-counselor" @{} -TokenOverride $CounselorToken
    Test-Api "Schedule request" POST "/counseling-requests/$crId/schedule" @{
        scheduled_date = (Get-Date).AddDays(3).ToString("yyyy-MM-dd")
        scheduled_time = "10:00"
    } -TokenOverride $CounselorToken
    Test-Api "Log session" POST "/counseling-requests/$crId/log-session" @{
        notes = "Test session notes"
        score = 80
        completed_sessions = 1
    } -TokenOverride $CounselorToken
}

# Case report workflow
$caseJson = Test-Api "Create case report" POST "/case-reports" @{
    description = "API test case for workflow"
    student_id = 6
    category = "gbv"
} -TokenOverride $StudentToken
$caseId = $null
if ($caseJson) { $caseId = (($caseJson | ConvertFrom-Json).id) }

if ($caseId -and $IicToken) {
    Test-Api "Workflow request permission" POST "/case-reports/$caseId/workflow/request-permission" @{
        permission_request = "Request permission to investigate this case"
    } -TokenOverride $IicToken
}
if ($caseId -and $RegistrarToken) {
    Test-Api "Workflow approve permission" POST "/case-reports/$caseId/workflow/approve-permission" @{} -TokenOverride $RegistrarToken
}
if ($caseId -and $IicToken) {
    Test-Api "Workflow start investigation" POST "/case-reports/$caseId/workflow/start-investigation" @{} -TokenOverride $IicToken
    Test-Api "Workflow submit findings" POST "/case-reports/$caseId/workflow/submit-findings" @{
        findings_report = "Test investigation findings"
    } -TokenOverride $IicToken
}
if ($caseId -and $RegistrarToken) {
    Test-Api "Workflow forward disciplinary" POST "/case-reports/$caseId/workflow/forward-to-disciplinary" @{} -TokenOverride $RegistrarToken
}
if ($caseId -and $DisciplinaryToken) {
    Test-Api "Workflow meeting notice" POST "/case-reports/$caseId/workflow/send-meeting-notice" @{
        meeting_notice = "Disciplinary committee meeting scheduled"
        meeting_date = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
    } -TokenOverride $DisciplinaryToken
    Test-Api "Workflow record verdict" POST "/case-reports/$caseId/workflow/record-verdict" @{
        verdict = "warning"
    } -TokenOverride $DisciplinaryToken
}

Test-Api "Logout" POST "/logout"

Write-Host ""
$pass = ($Results | Where-Object { $_.Pass }).Count
$fail = ($Results | Where-Object { -not $_.Pass }).Count
$Results | Format-Table Name, Method, Path, Status, Pass, Note -AutoSize
Write-Host "Passed: $pass  Failed: $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Yellow" })
if ($fail -gt 0) { exit 1 }
