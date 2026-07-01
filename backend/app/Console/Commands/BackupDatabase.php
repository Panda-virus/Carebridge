<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class BackupDatabase extends Command
{
    protected $signature = 'carebridge:backup-database';

    protected $description = 'Create a MySQL database backup using mysqldump';

    public function handle(): int
    {
        $connection = config('database.connections.'.config('database.default'));
        if (($connection['driver'] ?? '') !== 'mysql') {
            $this->warn('Database backup only supports MySQL. Skipping.');

            return self::SUCCESS;
        }

        $database = $connection['database'] ?? '';
        $host = $connection['host'] ?? '127.0.0.1';
        $port = $connection['port'] ?? '3306';
        $username = $connection['username'] ?? 'root';
        $password = $connection['password'] ?? '';

        $backupDir = storage_path('backups');
        File::ensureDirectoryExists($backupDir);

        $filename = 'carebridge_'.Carbon::now()->format('Y-m-d_His').'.sql';
        $filepath = $backupDir.DIRECTORY_SEPARATOR.$filename;

        $mysqldump = $this->findMysqldump();
        if (! $mysqldump) {
            $this->error('mysqldump not found. Install XAMPP MySQL or add mysqldump to PATH.');

            return self::FAILURE;
        }

        $passwordArg = $password !== '' ? '-p'.escapeshellarg($password) : '';
        $command = sprintf(
            '%s --host=%s --port=%s --user=%s %s --single-transaction --routines --triggers %s > %s',
            escapeshellarg($mysqldump),
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            $passwordArg,
            escapeshellarg($database),
            escapeshellarg($filepath)
        );

        $result = null;
        system($command, $result);

        if ($result !== 0 || ! File::exists($filepath) || File::size($filepath) === 0) {
            $this->error('Database backup failed.');
            if (File::exists($filepath)) {
                File::delete($filepath);
            }

            return self::FAILURE;
        }

        $this->info("Backup saved: {$filepath}");
        $this->pruneOldBackups($backupDir);

        return self::SUCCESS;
    }

    private function findMysqldump(): ?string
    {
        $candidates = [
            'C:\\xampp\\mysql\\bin\\mysqldump.exe',
            'mysqldump',
        ];

        foreach ($candidates as $candidate) {
            if ($candidate === 'mysqldump') {
                $which = shell_exec('where mysqldump 2>nul');
                if ($which) {
                    return trim(explode("\n", $which)[0]);
                }
            } elseif (file_exists($candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    private function pruneOldBackups(string $backupDir): void
    {
        $retentionDays = (int) config('carebridge.backup_retention_days', 14);
        $cutoff = Carbon::now()->subDays($retentionDays)->getTimestamp();

        foreach (File::files($backupDir) as $file) {
            if ($file->getExtension() !== 'sql') {
                continue;
            }
            if ($file->getMTime() < $cutoff) {
                File::delete($file->getPathname());
                $this->line('Pruned old backup: '.$file->getFilename());
            }
        }
    }
}
