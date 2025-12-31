<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    // 1. Get all users (with their roles)
    public function index()
    {
        $users = User::with('roles')->get();
        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    // 2. Create a new User (Doctor, Pharmacist, etc.)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string',
            'last_name'  => 'required|string',
            'email'      => 'required|email|unique:users',
            'password'   => 'required|min:6',
            'role'       => 'required|exists:roles,name', // Must be a valid role
        ]);

        // Create User
        $user = User::create([
            'first_name' => $validated['first_name'],
            'last_name'  => $validated['last_name'],
            // Auto-generate a username (e.g., first.last)
            'username'   => strtolower($validated['first_name'] . '.' . $validated['last_name'] . rand(1, 999)),
            'email'      => $validated['email'],
            'password'   => Hash::make($validated['password']),
        ]);

        // Assign Role
        $user->assignRole($validated['role']);

        return response()->json(['success' => true, 'message' => 'User created successfully!']);
    }

    // 3. Delete a User
    public function destroy($id)
    {
        $user = User::find($id);
        if ($user) {
            $user->delete();
            return response()->json(['success' => true, 'message' => 'User deleted']);
        }
        return response()->json(['success' => false, 'message' => 'User not found'], 404);
    }
}