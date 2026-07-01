<?php

namespace App\Services;

use App\Mail\CareBridgeNotificationMail;
use App\Models\CaseReport;
use App\Models\ChatConversation;
use App\Models\CounselingRequest;
use App\Models\ExternalCounselor;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    public const SCORE_REFERRAL_THRESHOLD = 70;

    public static function sendEmail(
        string $to,
        string $subject,
        string $body,
        string $headline = 'CareBridge Notification',
        ?string $actionUrl = null,
        ?string $actionLabel = null,
        string $priority = 'normal',
    ): void {
        if (empty($to)) {
            return;
        }

        try {
            Mail::to($to)->queue(new CareBridgeNotificationMail(
                headline: $headline,
                body: $body,
                actionUrl: $actionUrl ?? config('carebridge.frontend_url', config('app.url')),
                actionLabel: $actionLabel,
                priority: $priority,
            ));
        } catch (\Throwable $e) {
            Log::warning("CareBridge email failed [{$to}]: {$e->getMessage()}");
        }
    }

    public static function notifyRole(
        string $role,
        string $subject,
        string $body,
        string $headline = 'CareBridge Alert',
        string $priority = 'normal',
    ): void {
        User::where('role', $role)
            ->whereNotNull('email')
            ->pluck('email')
            ->each(fn (string $email) => self::sendEmail($email, $subject, $body, $headline, priority: $priority));
    }

    public static function notifyCaseAssignment(CaseReport $report, string $assignedRole, string $actionLabel): void
    {
        $brief = self::formatCaseBrief($report, $actionLabel);
        self::notifyRole($assignedRole, "CareBridge Case Alert: {$actionLabel}", $brief, $actionLabel);
    }

    public static function notifyNewCaseReport(CaseReport $report): void
    {
        $brief = self::formatCaseBrief($report, 'New case report submitted — review on your dashboard');
        $priority = in_array($report->urgency_level, ['immediate', 'critical', 'high'], true) ? 'urgent' : 'normal';
        $role = $report->assigned_role ?? 'iic';
        self::notifyRole($role, 'CareBridge: New Case Report', $brief, 'New Case Report', $priority);
    }

    public static function notifyPermissionRequest(CaseReport $report): void
    {
        $report->loadMissing(['student', 'user']);
        $reporter = $report->user?->name ?? $report->student?->name ?? 'Unknown reporter';
        $caseId = $report->ticket_number ?: $report->id;
        $location = $report->incident_location ?? 'Not specified';
        $date = $report->incident_date?->format('Y-m-d') ?? 'Not specified';
        $time = $report->incident_time ?? 'Not specified';
        $defendant = $report->defendant_name ?? 'Not specified';
        $requestText = trim($report->permission_request ?? 'No request details were provided.');

        $body = <<<TEXT
A new IIC permission request has been submitted and awaits your review.

Case: {$caseId}
Reporter: {$reporter}
Defendant: {$defendant}
Location: {$location}
Date: {$date}
Time: {$time}

Permission Request:
{$requestText}

Please log in to the CareBridge dashboard to approve or deny this request.
TEXT;

        self::notifyRole('registrar', 'CareBridge: Permission Request Submitted', $body, 'Permission Request');
    }

    public static function notifyGbvUrgentAlert(CaseReport $report): void
    {
        $label = 'GBV/SH case report';
        $brief = self::formatCaseBrief($report, "{$label} — priority triage required");
        $roles = ['iic'];
        if ($report->urgency_level === 'immediate') {
            $roles[] = 'dean';
        }

        foreach (array_unique($roles) as $role) {
            self::notifyRole($role, 'CareBridge: URGENT GBV Alert', $brief, 'Urgent GBV/SH Alert', 'urgent');
        }
    }

    public static function notifyAppointmentProposal(CounselingRequest $request): void
    {
        $request->loadMissing(['student', 'counselor']);
        $studentEmail = $request->student?->email;
        $counselorEmail = $request->counselor?->email;

        $slot = trim(($request->proposed_date?->format('Y-m-d') ?? $request->proposed_date).' at '.($request->proposed_time ?? 'TBD'));
        $body = <<<TEXT
A counseling appointment has been auto-scheduled and awaits approval.

Student: {$request->student_name}
Counselor: {$request->counselor_name}
Proposed slot: {$slot}
Urgency: {$request->urgency_level}
Concern:
{$request->concern}

Please log in to approve or reschedule.
TEXT;

        if ($studentEmail) {
            self::sendEmail($studentEmail, 'CareBridge: Counseling Appointment Proposed', $body, 'Appointment Proposed');
        }
        if ($counselorEmail) {
            self::sendEmail($counselorEmail, 'CareBridge: New Counseling Request', $body, 'New Counseling Request');
        }
    }

    public static function notifyWelcomeUser(User $user, ?string $temporaryPassword = null): void
    {
        $passwordLine = $temporaryPassword
            ? "Temporary password: {$temporaryPassword}\nPlease change it after your first login."
            : 'Use the password you registered with.';

        $body = <<<TEXT
Welcome to CareBridge, {$user->name}!

Your account has been created with the role: {$user->role}.

Email: {$user->email}
{$passwordLine}

Log in at the CareBridge portal to access counseling and support services.
TEXT;

        self::sendEmail($user->email, 'CareBridge: Welcome', $body, 'Welcome to CareBridge', actionLabel: 'Log in to CareBridge');
    }

    public static function notifyChatFollowUp(ChatConversation $conversation): void
    {
        $email = $conversation->user?->email;
        if (! $email) {
            return;
        }

        $service = $conversation->service_type ?? 'support request';
        $body = <<<TEXT
Hi {$conversation->user->name},

You started a {$service} conversation on CareBridge but did not finish submitting it.

We want to make sure you get the support you need. You can return to the CareBridge chatbot anytime to continue where you left off.

If you need immediate help, contact campus security or call 0882 200 000.
TEXT;

        self::sendEmail($email, 'CareBridge: Continue your support request', $body, 'We are here to help', actionLabel: 'Return to CareBridge');
    }

    public static function notifyExternalReferral(CounselingRequest $request, ExternalCounselor $counselor, string $reason): void
    {
        $email = $counselor->email;
        if (! $email) {
            return;
        }

        $studentName = $request->student_name ?? 'Student';
        $score = $request->overall_score !== null ? number_format((float) $request->overall_score, 1) : 'N/A';

        $body = <<<TEXT
A counseling case has been referred to you.

Student: {$studentName}
Category: {$request->category}
Urgency: {$request->urgency_level}
Overall Score: {$score}/100

Concern:
{$request->concern}

Referral Reason:
{$reason}

Please log in to the External Counselor Portal to accept the referral.
TEXT;

        self::sendEmail($email, 'CareBridge: New Counseling Referral', $body, 'External Referral');
    }

    private static function formatCaseBrief(CaseReport $report, string $headline): string
    {
        $report->loadMissing('student');
        $reporter = $report->student?->name ?? 'Identified student';
        $stage = $report->workflow_stage ?? 'at_iic';
        $description = mb_substr($report->description, 0, 500);

        return <<<TEXT
{$headline}

Case ID: #{$report->id}
Category: {$report->category}
Reporter: {$reporter}
Workflow Stage: {$stage}
Urgency: {$report->urgency_level}
Assigned Role: {$report->assigned_role}

Description:
{$description}

Please log in to your CareBridge dashboard to take action.
TEXT;
    }
}
