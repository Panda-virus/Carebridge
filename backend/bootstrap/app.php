<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Database\QueryException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $message = str_contains($e->getMessage(), '2002') || str_contains($e->getMessage(), 'actively refused')
                    ? 'Unable to connect to database. Start XAMPP MySQL, then run start.ps1 from the project root.'
                    : 'Database error. Check backend logs or run php artisan migrate.';

                return response()->json(['message' => $message], 503);
            }
        });
    })->create();
