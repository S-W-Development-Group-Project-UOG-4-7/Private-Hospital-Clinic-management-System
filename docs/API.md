# API Reference (PCMS)

Base URL: `http://localhost:8000/api`

All protected endpoints require `Authorization: Bearer <token>`.

## Roles & Permissions
- **Admin**: `admin.access` + specific permissions per module.
- **Receptionist**: patient/appointment/queue/billing operations.
- **Doctor**: consult, prescriptions, labs, queue.
- **Pharmacist**: inventory, dispensing, reports.
- **Patient**: appointments, records, billing.

## Auth
- `POST /auth/register` (throttle)
- `POST /auth/login` (throttle)
- `POST /auth/logout`
- `GET /auth/me`

## Health
- `GET /health`

## Admin (requires `admin.access`)
- Users: `GET/POST /admin/users`, `PUT /admin/users/{id}`, `PATCH /admin/users/{id}/toggle-status`
- Departments: `GET/POST /admin/departments`, `PUT /admin/departments/{id}`, `DELETE /admin/departments/{id}`
- Inventory: `GET/POST /admin/inventory`, `PUT /admin/inventory/{id}`, `DELETE /admin/inventory/{id}`
- Appointments: `GET /admin/appointments`, `PUT /admin/appointments/{id}`, `DELETE /admin/appointments/{id}`
- Reports:
  - `GET /admin/reports/appointments`
  - `GET /admin/reports/revenue`
  - `GET /admin/reports/no-show`
  - `GET /admin/reports/inventory-valuation`
  - `GET /admin/reports/stock-movement`
  - Add `?format=csv` to export CSV.
- Billing:
  - `GET/POST /admin/billing/invoices`
  - `GET/PUT/DELETE /admin/billing/invoices/{id}`
  - `POST /admin/billing/payments`
- Settings:
  - `GET /admin/settings`
  - `PUT /admin/settings`

## Receptionist
- Patients CRUD: `/receptionist/patients`
- Appointments CRUD: `/receptionist/appointments`
- Queue: `/receptionist/queue/*`
- Invoices/Payments: `/receptionist/invoices`, `/receptionist/payments`

## Doctor
- Appointments: `/doctor/appointments`
- Consultation: `/doctor/appointments/{id}/consultation`
- Diagnosis/Vitals/Prescriptions/Labs/Referrals
- Queue: `/doctor/queue/*`

## Pharmacist
- Inventory: `/pharmacist/inventory`
- Prescriptions: `/pharmacist/prescriptions`
- Dispense: `/pharmacist/prescriptions/{id}/dispense`
- Reports: `/pharmacist/reports/*`

## Patient
- Profile: `/patient/me`, `/patient/profile`
- Appointments & Slots: `/patient/appointments`, `/patient/slots`
- Billing: `/patient/invoices`, `/patient/payments`
- Records: `/patient/prescriptions`, `/patient/lab-results`, `/patient/ehr`

