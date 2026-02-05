<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules;
use Illuminate\View\View;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): View
    {
        return view('auth.register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        Log::info('Register request input', $request->all());

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Normalize name into first/last and generate a username if needed
        $fullName = trim($request->name);
        $parts = preg_split('/\s+/', $fullName) ?: [];
        $firstName = $parts[0] ?? $fullName;
        $lastName = count($parts) > 1 ? trim(implode(' ', array_slice($parts, 1))) : '';

        $usernameBase = \Illuminate\Support\Str::slug($firstName . ' ' . $lastName, '');
        if ($usernameBase === '') {
            $usernameBase = explode('@', $request->email)[0] ?? 'user';
        }
        $username = $usernameBase;
        $suffix = 1;
        while (User::where('username', $username)->exists()) {
            $username = $usernameBase . $suffix;
            $suffix++;
        }

        $userData = [
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ];

        // Some installs use a 'name' column, others use first_name/last_name - handle both
        if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'name')) {
            $userData['name'] = $fullName;
        } else {
            $userData['first_name'] = $firstName;
            $userData['last_name'] = $lastName ?: 'User';
            $userData['username'] = $username;
        }

        try {
            $user = User::create($userData);
        } catch (\Throwable $e) {
            Log::error('User creation failed: ' . $e->getMessage());
            throw $e;
        }

        // Log in before dispatching registration event to ensure session is active
        Auth::guard('web')->login($user, true);

        // Regenerate session to ensure authentication is persisted
        $request->session()->regenerate();

        // Debug log to verify authentication state during tests
        Log::info('After registration, Auth::check=' . (Auth::check() ? 'true' : 'false'));
        Log::info('Registered user id=' . $user->id);

        event(new Registered($user));

        return redirect(route('dashboard', absolute: false));
    }
}
