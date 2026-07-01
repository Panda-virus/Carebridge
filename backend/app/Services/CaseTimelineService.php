<?php

namespace App\Services;

use App\Models\CaseReport;
use App\Models\CaseTimeline;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CaseTimelineService
{
    /**
     * Stage definitions with their durations and responsible roles.
     */
    public const STAGES = [
        'case_report_submission' => [
            'label' => 'Case Report Submission',
            'duration_days' => 0,
            'duration_hours' => 0,
            'assigned_role' => null,
            'depends_on' => null,
        ],
        'acknowledgement' => [
            'label' => 'Acknowledgement of Report',
            'duration_days' => 3,
            'duration_hours' => 0,
            'assigned_role' => 'iic',
            'depends_on' => 'case_report_submission',
        ],
        'preliminary_review' => [
            'label' => 'Preliminary Review & Assignment to IIC',
            'duration_days' => 7,
            'duration_hours' => 0,
            'assigned_role' => 'iic',
            'depends_on' => 'acknowledgement',
        ],
        'formal_investigation' => [
            'label' => 'Formal Investigation',
            'duration_days' => 21,
            'duration_hours' => 0,
            'assigned_role' => 'iic',
            'depends_on' => 'preliminary_review',
        ],
        'investigation_report_submission' => [
            'label' => 'Investigation Report Submission',
            'duration_days' => 7,
            'duration_hours' => 0,
            'assigned_role' => 'iic',
            'depends_on' => 'formal_investigation',
        ],
        'disciplinary_hearing' => [
            'label' => 'Disciplinary Committee Hearing',
            'duration_days' => 7,
            'duration_hours' => 0,
            'assigned_role' => 'disciplinary_committee',
            'depends_on' => 'investigation_report_submission',
        ],
        'disciplinary_decision' => [
            'label' => 'Disciplinary Committee Decision',
            'duration_days' => 14,
            'duration_hours' => 0,
            'assigned_role' => 'disciplinary_committee',
            'depends_on' => 'disciplinary_hearing',
        ],
        'communication_of_verdict' => [
            'label' => 'Communication of Verdict to Parties',
            'duration_days' => 7,
            'duration_hours' => 0,
            'assigned_role' => 'disciplinary_committee',
            'depends_on' => 'disciplinary_decision',
        ],
        'appeal_submission' => [
            'label' => 'Appeal Submission (if allowed)',
            'duration_days' => 14,
            'duration_hours' => 0,
            'assigned_role' => 'student',
            'depends_on' => 'communication_of_verdict',
        ],
        'appeal_determination' => [
            'label' => 'Appeal Determination',
            'duration_days' => 30,
            'duration_hours' => 0,
            'assigned_role' => 'registrar',
            'depends_on' => 'appeal_submission',
        ],
    ];

    /**
     * Initialize timeline for a new case report.
     */
    public static function initializeTimeline(CaseReport $caseReport): void
    {
        $now = now();
        $previousStageEnd = $now;

        foreach (self::STAGES as $stageKey => $stageConfig) {
            $startedAt = $stageConfig['depends_on'] === null ? $now : $previousStageEnd;
            $dueAt = $startedAt->copy()->addDays($stageConfig['duration_days'])->addHours($stageConfig['duration_hours']);

            CaseTimeline::create([
                'case_report_id' => $caseReport->id,
                'stage' => $stageKey,
                'stage_label' => $stageConfig['label'],
                'started_at' => $startedAt,
                'due_at' => $dueAt,
                'completed_at' => $stageKey === 'case_report_submission' ? $now : null,
                'assigned_role' => $stageConfig['assigned_role'],
            ]);

            $previousStageEnd = $dueAt;
        }
    }

    /**
     * Mark a stage as completed and update subsequent stages.
     */
    public static function completeStage(CaseReport $caseReport, string $stageKey): ?CaseTimeline
    {
        $timelineEntry = CaseTimeline::where('case_report_id', $caseReport->id)
            ->where('stage', $stageKey)
            ->first();

        if (!$timelineEntry) {
            return null;
        }

        $timelineEntry->update([
            'completed_at' => now(),
        ]);

        $caseReport->update([
            'workflow_stage' => $stageKey,
        ]);

        $nextStageKey = self::getNextStage($stageKey);
        if ($nextStageKey) {
            $nextStage = CaseTimeline::where('case_report_id', $caseReport->id)
                ->where('stage', $nextStageKey)
                ->first();

            if ($nextStage && is_null($nextStage->started_at)) {
                $nextStage->update([
                    'started_at' => now(),
                    'due_at' => now()->addDays(self::STAGES[$nextStageKey]['duration_days'])
                        ->addHours(self::STAGES[$nextStageKey]['duration_hours']),
                ]);
            }
        }

        return $timelineEntry;
    }

    /**
     * Get the next stage in the workflow.
     */
    public static function getNextStage(string $currentStage): ?string
    {
        $stages = array_keys(self::STAGES);
        $currentIndex = array_search($currentStage, $stages);

        if ($currentIndex !== false && isset($stages[$currentIndex + 1])) {
            return $stages[$currentIndex + 1];
        }

        return null;
    }

    /**
     * Get all overdue stages for a case.
     */
    public static function getOverdueStages(CaseReport $caseReport): array
    {
        return CaseTimeline::where('case_report_id', $caseReport->id)
            ->whereNull('completed_at')
            ->where('due_at', '<', now())
            ->orderBy('due_at', 'asc')
            ->get()
            ->all();
    }

    /**
     * Get all pending (not completed) stages for a case.
     */
    public static function getPendingStages(CaseReport $caseReport): array
    {
        return CaseTimeline::where('case_report_id', $caseReport->id)
            ->whereNull('completed_at')
            ->orderBy('started_at', 'asc')
            ->get()
            ->all();
    }

    /**
     * Get the current active stage for a case.
     */
    public static function getCurrentStage(CaseReport $caseReport): ?CaseTimeline
    {
        return CaseTimeline::where('case_report_id', $caseReport->id)
            ->whereNull('completed_at')
            ->orderBy('started_at', 'asc')
            ->first();
    }

    /**
     * Get timeline summary for a case.
     */
    public static function getTimelineSummary(CaseReport $caseReport): array
    {
        $timeline = CaseTimeline::where('case_report_id', $caseReport->id)
            ->orderBy('started_at', 'asc')
            ->get();

        $summary = [
            'total_stages' => $timeline->count(),
            'completed_stages' => 0,
            'overdue_stages' => 0,
            'pending_stages' => 0,
            'current_stage' => null,
            'stages' => [],
        ];

        foreach ($timeline as $entry) {
            $status = $entry->isCompleted() ? 'completed' : ($entry->isOverdue() ? 'overdue' : 'pending');

            if ($status === 'completed') {
                $summary['completed_stages']++;
            } elseif ($status === 'overdue') {
                $summary['overdue_stages']++;
            } else {
                $summary['pending_stages']++;
                if (is_null($summary['current_stage'])) {
                    $summary['current_stage'] = [
                        'stage' => $entry->stage,
                        'label' => $entry->stage_label,
                        'due_at' => $entry->due_at->toDateTimeString(),
                        'assigned_role' => $entry->assigned_role,
                    ];
                }
            }

            $summary['stages'][] = [
                'stage' => $entry->stage,
                'label' => $entry->stage_label,
                'started_at' => $entry->started_at?->toDateTimeString(),
                'due_at' => $entry->due_at->toDateTimeString(),
                'completed_at' => $entry->completed_at?->toDateTimeString(),
                'assigned_role' => $entry->assigned_role,
                'status' => $status,
                'overdue_by' => $entry->overdue_by,
            ];
        }

        return $summary;
    }

    /**
     * Check all cases for overdue stages and send notifications.
     */
    public static function checkOverdueStagesAndNotify(): int
    {
        $notifiedCount = 0;

        $activeCases = CaseReport::whereIn('status', ['submitted', 'under_review', 'investigating', 'pending_hearing', 'pending_decision'])
            ->get();

        foreach ($activeCases as $caseReport) {
            $overdueStages = self::getOverdueStages($caseReport);

            foreach ($overdueStages as $stage) {
                $lastNotified = $stage->notes ? json_decode($stage->notes, true) : null;
                $lastNotifiedAt = $lastNotified['last_notified_at'] ?? null;

                if ($lastNotifiedAt && now()->parse($lastNotifiedAt)->lt(now()->subHours(24))) {
                    continue;
                }

                self::sendOverdueNotification($caseReport, $stage);

                $notes = is_string($stage->notes) ? json_decode($stage->notes, true) : ($stage->notes ?? []);
                $notes['last_notified_at'] = now()->toDateTimeString();
                $notes['notification_count'] = ($notes['notification_count'] ?? 0) + 1;

                $stage->update([
                    'notes' => json_encode($notes),
                ]);

                $notifiedCount++;
            }
        }

        if ($notifiedCount > 0) {
            Log::info("Sent {$notifiedCount} overdue stage notifications");
        }

        return $notifiedCount;
    }

    /**
     * Send notification for an overdue stage.
     */
    protected static function sendOverdueNotification(CaseReport $caseReport, CaseTimeline $stage): void
    {
        $assignedRole = $stage->assigned_role;

        if (!$assignedRole) {
            return;
        }

        $overdueBy = $stage->due_at->diffForHumans();
        $caseId = $caseReport->id;
        $stageLabel = $stage->stage_label;

        $subject = "CareBridge Alert: Overdue Case Stage - Case #{$caseId}";
        $body = "Dear {role},\n\n";
        $body .= "This is an automated reminder that the following case stage is overdue:\n\n";
        $body .= "Case ID: #{$caseId}\n";
        $body .= "Stage: {$stageLabel}\n";
        $body .= "Due Date: " . $stage->due_at->format('Y-m-d H:i') . "\n";
        $body .= "Overdue By: {$overdueBy}\n\n";
        $body .= "Please log in to the CareBridge dashboard to take immediate action and update the stage status.\n\n";
        $body .= "If you have already completed this stage, please mark it as completed in the system.\n\n";
        $body .= "This is an automated reminder. You will receive reminders every 24 hours until the stage is completed.\n\n";
        $body .= "Best regards,\nCareBridge System";

        $roleNames = [
            'iic' => 'IIC Officer',
            'dean' => 'Dean',
            'student' => 'Student',
            'counselor' => 'Counselor',
        ];
        $body = str_replace('{role}', $roleNames[$assignedRole] ?? ucfirst($assignedRole), $body);

        $users = User::where('role', $assignedRole)
            ->whereNotNull('email')
            ->get();

        foreach ($users as $user) {
            NotificationService::sendEmail(
                $user->email,
                $subject,
                $body,
                'Overdue Case Stage Alert',
                config('carebridge.frontend_url', config('app.url')) . '/cases/' . $caseId,
                'View Case'
            );
        }

        Log::info("Sent overdue notification for case #{$caseId}, stage: {$stageLabel}, to role: {$assignedRole}");
    }
}
