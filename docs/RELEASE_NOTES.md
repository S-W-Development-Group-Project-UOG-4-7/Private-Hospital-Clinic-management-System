# Release Notes

## Phase 6: Production Readiness

### Security
- Added secure headers middleware.
- Added request input sanitization.
- Added request context logging with request IDs.
- Added rate limiting on critical endpoints.
- Improved CORS configuration via `CORS_ALLOWED_ORIGINS`.

### Performance
- Added indexes for appointments, invoices, payments, stock ledgers.
- Added optional pagination for admin users and appointments.

### Operational Readiness
- Added `/api/health` with DB check.
- Added environment validation hooks.
- Added demo seed data (inventory, invoice, stock ledger, appointment).

### Admin UX
- Working Billing and Settings screens.
- Inventory tracking on Admin dashboard and inventory page.
- CSV export support for admin reports.

### Docs & Tests
- Added API docs and testing guide.
- Added minimal admin UI smoke tests.

