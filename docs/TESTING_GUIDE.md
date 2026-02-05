# Testing Guide

## 1) Setup From Scratch
1. Clone repo and install dependencies:
   - `cd backend && composer install`
   - `cd ../frontend && npm install`
2. Configure `.env` in `backend`:
   - Set DB credentials, `APP_KEY`, `APP_URL`, `CORS_ALLOWED_ORIGINS` if needed.
3. Generate app key:
   - `php artisan key:generate`

## 2) Migrate and Seed
1. `php artisan migrate`
2. `php artisan db:seed`
3. `php artisan permission:cache-reset`

## 3) Demo Accounts (Default)
- Admin: `admin@mediclinic.com` / `admin123`
- Doctor: `doctor@mediclinic.com` / `doctor123`
- Receptionist: `receptionist@mediclinic.com` / `receptionist123`
- Pharmacist: `pharmacist@mediclinic.com` / `pharmacist123`
- Patient: `patient@mediclinic.com` / `patient123`

## 4) Role-by-Role Verification Steps

### Admin
1. Login as admin.
2. Dashboard: confirm stats load.
3. Reports: run reports and export CSV.
4. Inventory: add a medicine, check stock movement export.
5. Billing: create invoice, record payment.
6. Settings: update rules/fees and save.

Expected:
- No 403 on admin routes.
- Audit logs created for admin changes.

### Receptionist
1. Login as receptionist.
2. Create patient.
3. Book appointment and check-in.
4. Create invoice + payment.

Expected:
- Queue entry on check-in.
- Invoice status updates with payments.

### Doctor
1. Login as doctor.
2. Start consultation, add SOAP notes.
3. Add prescription and lab order.
4. Complete consultation.

Expected:
- Appointment status moves to IN_PROGRESS/COMPLETED.

### Pharmacist
1. Login as pharmacist.
2. View prescriptions.
3. Dispense partially and fully.

Expected:
- Stock can’t go negative.
- Stock ledger entry created.

### Patient
1. Login as patient.
2. Book appointment (slot hold/confirm).
3. View prescriptions, lab results, invoices.

Expected:
- Double-booking prevented.
- Only own data visible.

## 5) Automated Tests
Backend:
- `cd backend && php artisan test`

Frontend:
- `cd frontend && npm test`

