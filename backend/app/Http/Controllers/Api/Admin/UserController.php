<?php

namespace App\Http\Controllers\Api\Admin; // ✅ CORRECT // Adjusted to match your folder structure

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class UserController extends Controller
{
    /**
     * 1. List users
     * Supports filtering: /api/admin/users?role=doctor&department_id=1
     */
    public function index(Request $request)
    {
        // Start query and eager load relationships for Frontend
        $query = User::with(['roles', 'department']);

        // Filter by Role (Uses Spatie's "role" scope)
        if ($request->has('role') && $request->role) {
            $query->role($request->role);
        }

        // Filter by Department
        if ($request->has('department_id') && $request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        return response()->json($query->get());
    }

    /**
     * 2. Create a new User
     */
    public function store(Request $request)
    {
        // 1. Validate inputs matches your DB columns
        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name'  => ['required', 'string', 'max:255'],
            'username'   => ['required', 'string', 'max:255', 'unique:users'], // specific to your setup
            'email'      => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'role'       => ['required', 'exists:roles,name'], // Validate against Spatie roles table
            'department_id' => ['nullable', 'exists:departments,id'], 
            'password'   => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // 2. Create the user
        $user = User::create([
            'first_name' => $request->first_name,
            'last_name'  => $request->last_name,
            'username'   => $request->username,
            'email'      => $request->email,
            'department_id' => $request->department_id, // Ensure this column exists in migration
            'password'   => Hash::make($request->password),
        ]);

        // 3. Assign Role using Spatie
        $user->assignRole($request->role);

        // 4. Return response with role data loaded
        return response()->json([
            'message' => 'User created successfully',
            'user' => $user->load('roles')
        ], 201);
    }

    /**
     * 3. Show a specific user
     */
    public function show($id)
    {
        $user = User::with(['roles', 'department'])->findOrFail($id);
        return response()->json($user);
    }

    /**
     * 4. Update a user
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name'  => ['required', 'string', 'max:255'],
            'username'   => ['required', 'string', 'max:255', 'unique:users,username,' . $id],
            'email'      => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $id],
            'role'       => ['required', 'exists:roles,name'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'password'   => ['nullable', 'confirmed', Rules\Password::defaults()],
        ]);

        // Update user data
        $user->update([
            'first_name' => $request->first_name,
            'last_name'  => $request->last_name,
            'username'   => $request->username,
            'email'      => $request->email,
            'department_id' => $request->department_id,
        ]);

        // Update password if provided
        if ($request->filled('password')) {
            $user->update(['password' => Hash::make($request->password)]);
        }

        // Update role
        $user->syncRoles([$request->role]);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user->load('roles', 'department')
        ]);
    }

    /**
     * 5. Delete a user
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        
        // Prevent deletion of the last admin
        if ($user->hasRole('admin')) {
            $adminCount = User::role('admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'Cannot delete the last admin user'
                ], 422);
            }
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }
}