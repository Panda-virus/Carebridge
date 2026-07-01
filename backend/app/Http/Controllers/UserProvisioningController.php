<?php

namespace App\Http\Controllers;

use App\Services\UserProvisioningService;
use Illuminate\Http\Request;

class UserProvisioningController extends Controller
{
    public function __construct(private readonly UserProvisioningService $provisioning) {}

    public function import(Request $request)
    {
        $request->validate([
            'users' => 'required|array|min:1',
            'users.*.name' => 'required|string',
            'users.*.email' => 'required|email',
            'users.*.role' => 'nullable|string',
            'users.*.phone' => 'nullable|string',
            'users.*.location' => 'nullable|string',
            'users.*.password' => 'nullable|string',
            'send_welcome' => 'nullable|boolean',
        ]);

        $result = $this->provisioning->importFromRows(
            $request->input('users'),
            $request->boolean('send_welcome', true)
        );

        return response()->json($result);
    }
}
