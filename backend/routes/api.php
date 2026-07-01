<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\CounselingRequestController;
use App\Http\Controllers\CounselingSessionController;
use App\Http\Controllers\CaseReportController;
use App\Http\Controllers\CounselorScheduleController;
use App\Http\Controllers\ExternalCounselorController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\CaseWorkflowController;
use App\Http\Controllers\CaseTimelineController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\UserProvisioningController;

// Public routes
Route::get('/health', HealthController::class);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [RegisterController::class, 'register']);
Route::post('/case-reports', [CaseReportController::class, 'store']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Bulk user provisioning
    Route::post('/users/import', [UserProvisioningController::class, 'import']);

    // Users
    Route::apiResource('users', UserController::class);

    // Counseling requests and sessions
    Route::apiResource('counseling-requests', CounselingRequestController::class);
    Route::get('counseling-requests/{id}/sessions', [CounselingRequestController::class, 'sessions']);
    Route::post('counseling-requests/{id}/approve', [CounselingRequestController::class, 'approve']);
    Route::post('counseling-requests/{id}/approve-student', [CounselingRequestController::class, 'approveStudent']);
    Route::post('counseling-requests/{id}/approve-counselor', [CounselingRequestController::class, 'approveCounselor']);
    Route::post('counseling-requests/{id}/reject-approval', [CounselingRequestController::class, 'rejectApproval']);
    Route::post('counseling-requests/{id}/schedule', [CounselingRequestController::class, 'schedule']);
    Route::apiResource('counseling-sessions', CounselingSessionController::class);

    Route::post('counseling-requests/{id}/log-session', [App\Http\Controllers\CounselingSessionLogController::class, 'logSession']);
    Route::post('counseling-requests/{id}/external-records', [App\Http\Controllers\CounselingSessionLogController::class, 'addExternalRecord']);

    // Case reports
    Route::apiResource('case-reports', CaseReportController::class)->except(['store']);

    // Counselor schedule and availability
    Route::apiResource('counselor-schedules', CounselorScheduleController::class);

    // External counselors (added by counselors)
    Route::apiResource('external-counselors', ExternalCounselorController::class);

    // Case workflow pipeline: IIC → Registrar → Disciplinary Committee
    Route::post('case-reports/{caseReport}/workflow/acknowledge', [CaseWorkflowController::class, 'acknowledge']);
    Route::post('case-reports/{caseReport}/workflow/request-permission', [CaseWorkflowController::class, 'requestPermission']);
    Route::post('case-reports/{caseReport}/workflow/approve-permission', [CaseWorkflowController::class, 'approvePermission']);
    Route::post('case-reports/{caseReport}/workflow/start-investigation', [CaseWorkflowController::class, 'startInvestigation']);
    Route::post('case-reports/{caseReport}/workflow/submit-findings', [CaseWorkflowController::class, 'submitFindings']);
    Route::get('case-reports/{caseReport}/findings-file', [CaseWorkflowController::class, 'downloadFindingFile']);
    Route::post('case-reports/{caseReport}/workflow/forward-to-disciplinary', [CaseWorkflowController::class, 'forwardToDisciplinary']);
    Route::post('case-reports/{caseReport}/workflow/dismiss-case', [CaseWorkflowController::class, 'dismissCase']);
    Route::post('case-reports/{caseReport}/workflow/send-meeting-notice', [CaseWorkflowController::class, 'sendMeetingNotice']);
    Route::post('case-reports/{caseReport}/workflow/record-verdict', [CaseWorkflowController::class, 'recordVerdict']);
    Route::post('case-reports/{caseReport}/workflow/approve-verdict', [CaseWorkflowController::class, 'approveVerdict']);

    // Case timeline
    Route::get('case-reports/{id}/timeline', [CaseTimelineController::class, 'show']);
    Route::get('case-reports/{id}/timeline/current', [CaseTimelineController::class, 'currentStage']);
    Route::get('case-reports/{id}/timeline/pending', [CaseTimelineController::class, 'pendingStages']);
    Route::get('case-reports/{id}/timeline/overdue', [CaseTimelineController::class, 'overdueStages']);
    Route::post('case-reports/{id}/timeline/check-overdue', [CaseTimelineController::class, 'checkOverdue']);
});
