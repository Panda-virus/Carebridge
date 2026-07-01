<?php

namespace App\Http\Controllers;

use App\Models\CaseReport;
use App\Services\CaseTimelineService;
use Illuminate\Http\Request;

class CaseTimelineController extends Controller
{
    public function show(CaseReport $caseReport)
    {
        return response()->json(CaseTimelineService::getTimelineSummary($caseReport));
    }

    public function currentStage(CaseReport $caseReport)
    {
        return response()->json(CaseTimelineService::getCurrentStage($caseReport));
    }

    public function pendingStages(CaseReport $caseReport)
    {
        return response()->json(CaseTimelineService::getPendingStages($caseReport));
    }

    public function overdueStages(CaseReport $caseReport)
    {
        return response()->json(CaseTimelineService::getOverdueStages($caseReport));
    }

    public function checkOverdue(Request $request, CaseReport $caseReport)
    {
        $count = CaseTimelineService::checkOverdueStagesAndNotify();

        return response()->json([
            'message' => 'Overdue stage check completed.',
            'notifications_sent' => $count,
        ]);
    }
}
