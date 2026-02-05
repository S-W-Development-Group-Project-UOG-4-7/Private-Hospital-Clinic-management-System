<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Admin
            'admin.access',
            'admin.users.manage',
            'admin.departments.manage',
            'admin.appointments.manage',
            'admin.inventory.manage',
            'admin.billing.manage',
            'admin.settings.manage',
            'admin.reports.view',
            'admin.audit.view',

            // Receptionist
            'receptionist.access',
            'receptionist.patients.manage',
            'receptionist.appointments.manage',
            'receptionist.queue.manage',
            'receptionist.billing.manage',

            // Doctor
            'doctor.access',
            'doctor.consult.manage',
            'doctor.prescriptions.manage',
            'doctor.labs.manage',
            'doctor.referrals.manage',
            'doctor.queue.view',

            // Pharmacist
            'pharmacist.access',
            'pharmacist.inventory.manage',
            'pharmacist.dispense.manage',
            'pharmacist.reports.view',

            // Patient
            'patient.access',
            'patient.appointments.manage',
            'patient.records.view',
            'patient.billing.view',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'sanctum');
        }

        $rolePermissions = [
            'admin' => [
                'admin.access',
                'admin.users.manage',
                'admin.departments.manage',
            'admin.appointments.manage',
            'admin.inventory.manage',
            'admin.billing.manage',
            'admin.settings.manage',
            'admin.reports.view',
            'admin.audit.view',
            ],
            'receptionist' => [
                'receptionist.access',
                'receptionist.patients.manage',
                'receptionist.appointments.manage',
                'receptionist.queue.manage',
                'receptionist.billing.manage',
            ],
            'doctor' => [
                'doctor.access',
                'doctor.consult.manage',
                'doctor.prescriptions.manage',
                'doctor.labs.manage',
                'doctor.referrals.manage',
                'doctor.queue.view',
            ],
            'pharmacist' => [
                'pharmacist.access',
                'pharmacist.inventory.manage',
                'pharmacist.dispense.manage',
                'pharmacist.reports.view',
            ],
            'patient' => [
                'patient.access',
                'patient.appointments.manage',
                'patient.records.view',
                'patient.billing.view',
            ],
        ];

        foreach ($rolePermissions as $roleName => $permissionsForRole) {
            $role = Role::findByName($roleName, 'sanctum');
            $role->syncPermissions($permissionsForRole);
        }
    }
}
