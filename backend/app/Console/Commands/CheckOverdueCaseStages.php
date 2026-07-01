<?php

namespace App\Console\Commands;

use App\Services\CaseTimelineService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckOverdueCaseStages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'carebridge:check-overdue-stages';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for overdue case stages and send notification reminders';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Checking for overdue case stages...');

        try {
            $notifiedCount = CaseTimelineService::checkOverdueStagesAndNotify();

            if ($notifiedCount > 0) {
                $this->info("Successfully sent {$notifiedCount} overdue stage notification(s).");
            } else {
                $this->info('No overdue stages found or all notifications already sent within the last 24 hours.');
            }

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Error checking overdue stages: ' . $e->getMessage());
            Log::error('Error in CheckOverdueCaseStages command: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            return self::FAILURE;
        }
    }
}
