<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;

class ReceptionistDepartmentController extends Controller
{
    public function index(Request $request)
    {
        $departments = Department::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $departments,
        ]);
    }
}
