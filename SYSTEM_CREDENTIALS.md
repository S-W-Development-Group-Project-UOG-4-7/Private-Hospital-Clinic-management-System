# System Login Credentials

This document contains all the default login credentials for the Hospital Clinic Management System.

## Important Notes

- **Login Method**: Use **email** as the login identifier (not username)
- All passwords are case-sensitive
- These are default credentials - change them in production!

## Default User Accounts

### 1. Administrator Account
- **Role**: Admin
- **Email**: `admin@example.com`
- **Username**: `admin`
- **Password**: `Admin@123`
- **Full Name**: System Admin
- **Access Level**: Full system access

### 2. Doctor Account
- **Role**: Doctor
- **Email**: `doctor@example.com`
- **Username**: `doctor`
- **Password**: `Doctor@123`
- **Full Name**: Dr. John Smith
- **Access Level**: Medical records, appointments, prescriptions

### 3. Pharmacist Account
- **Role**: Pharmacist
- **Email**: `pharmacist@example.com`
- **Username**: `pharmacist`
- **Password**: `Pharmacist@123`
- **Full Name**: Pharmacy Manager
- **Access Level**: Inventory, prescriptions, drug purchases

### 4. Receptionist Account
- **Role**: Receptionist
- **Email**: `receptionist@example.com`
- **Username**: `receptionist`
- **Password**: `Receptionist@123`
- **Full Name**: Reception Staff
- **Access Level**: Appointments, patient registration, scheduling

### 5. Patient Account
- **Role**: Patient
- **Email**: `patient@example.com`
- **Username**: `patient`
- **Password**: `Patient@123`
- **Full Name**: Test Patient
- **Access Level**: View own records, appointments, prescriptions

## Quick Reference Table

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin@123 |
| Doctor | doctor@example.com | Doctor@123 |
| Pharmacist | pharmacist@example.com | Pharmacist@123 |
| Receptionist | receptionist@example.com | Receptionist@123 |
| Patient | patient@example.com | Patient@123 |

## Login Instructions

1. Navigate to the login page
2. Enter the **email address** (not username) in the login field
3. Enter the corresponding password
4. Click Login

## Troubleshooting

If you're getting "The provided credentials are incorrect" error:

1. **Verify you're using the email address** (not username) in the login field
2. **Check password is case-sensitive** - ensure proper capitalization
3. **Ensure database has been seeded** - Run `php artisan db:seed --class=DatabaseSeeder`
4. **Clear cache** - Run `php artisan cache:clear` and `php artisan config:clear`

## Security Warning

⚠️ **These are default development credentials. Always change passwords in production environments!**

## Resetting/Regenerating Users

To reset users and passwords, run:

```bash
cd backend
php artisan db:seed --class=DatabaseSeeder --force
```

This will recreate all users with the default passwords listed above.

