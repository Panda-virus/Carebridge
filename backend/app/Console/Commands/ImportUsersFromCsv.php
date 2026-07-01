<?php

namespace App\Console\Commands;

use App\Services\UserProvisioningService;
use Illuminate\Console\Command;

class ImportUsersFromCsv extends Command
{
    protected $signature = 'carebridge:import-users {file : Path to CSV file} {--no-welcome : Skip welcome emails}';

    protected $description = 'Bulk import users from a CSV file (name,email,role,phone,location,password)';

    public function handle(UserProvisioningService $provisioning): int
    {
        $path = $this->argument('file');
        if (! is_readable($path)) {
            $this->error("Cannot read file: {$path}");

            return self::FAILURE;
        }

        $handle = fopen($path, 'r');
        if ($handle === false) {
            $this->error('Failed to open CSV file.');

            return self::FAILURE;
        }

        $headers = array_map('strtolower', array_map('trim', fgetcsv($handle) ?: []));
        $rows = [];

        while (($line = fgetcsv($handle)) !== false) {
            if (count(array_filter($line)) === 0) {
                continue;
            }
            $row = [];
            foreach ($headers as $i => $header) {
                $row[$header] = $line[$i] ?? null;
            }
            $rows[] = $row;
        }
        fclose($handle);

        $result = $provisioning->importFromRows($rows, ! $this->option('no-welcome'));

        $this->info("Created: {$result['created']}, Skipped: {$result['skipped']}");
        foreach ($result['errors'] as $line => $message) {
            $this->warn("Line {$line}: {$message}");
        }

        return $result['skipped'] > 0 && $result['created'] === 0 ? self::FAILURE : self::SUCCESS;
    }
}
