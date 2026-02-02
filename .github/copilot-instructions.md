**Purpose**
- **Goal**: Help AI coding agents be immediately productive in this repo by summarizing architecture, workflows, conventions, and concrete examples.

**Big Picture**
- **Architecture**: Monorepo with a Laravel backend and a React frontend. Backend is in [backend](../backend) (Laravel, PHP, Sanctum). Frontend is in [frontend](../frontend) (Create React App, TypeScript).
- **Data flows**: Frontend calls REST APIs under `/api/*` implemented in [backend/routes/api.php](../backend/routes/api.php). Backend enforces `auth:sanctum` and role middleware (e.g., `role:pharmacist`) before returning data.

**Key Areas & Files**
- **API routes**: [backend/routes/api.php](../backend/routes/api.php)
- **Backend models/controllers**: [backend/app/Models](../backend/app/Models) and [backend/app/Http/Controllers/Api](../backend/app/Http/Controllers/Api)
- **Scheduled jobs / commands**: [backend/app/Console/Commands/CheckReorderLevels.php](../backend/app/Console/Commands/CheckReorderLevels.php)
- **Frontend API client**: [frontend/src/api/pharmacy.ts](../frontend/src/api/pharmacy.ts)
- **Frontend config**: [frontend/src/config/api.ts](../frontend/src/config/api.ts)

**Critical Workflows / Commands**
- Backend install & run:
  - `composer install`
  - Copy `.env.example` → `.env` and set DB credentials (Postgres) and `DB_PASSWORD`
  - Create DB: use [backend/create-database.php](../backend/create-database.php) or follow [backend/QUICK_START.md](../backend/QUICK_START.md)
  - `php artisan migrate`
  - `php artisan serve` (dev)
  - Scheduler (dev): `php artisan schedule:work` — production should use cron
  - Useful artisan: `php artisan inventory:check-reorder-levels` (manual run), `php artisan db:show`
- Frontend install & run:
  - `npm install` (in `frontend`)
  - `npm start` (dev server at http://localhost:3000)

**Project-Specific Conventions & Patterns**
- **Auth & Roles**: All pharmacy APIs are protected using Laravel Sanctum and a `role:pharmacist` middleware. Search for `auth:sanctum` or `role:` in controllers and routes.
- **Automated checks**: Inventory reorder checks run daily at 9:00 UTC via Laravel scheduler. The logic lives in `CheckReorderLevels.php` and logs results; use the artisan command when testing.
- **DB & env**: Project targets PostgreSQL in the backend; the repo includes `create-database.php` and [backend/QUICK_START.md](../backend/QUICK_START.md) with OS-specific steps (PowerShell examples on Windows).
- **Frontend <> Backend contract**: The frontend `pharmacy.ts` client uses endpoints configured in [frontend/src/config/api.ts](../frontend/src/config/api.ts). When changing routes, update both files.

**Integration Points & External Dependencies**
- Authentication: Laravel Sanctum (cookie/token flow) — review middleware in [backend/config/sanctum.php](../backend/config/sanctum.php) and `cors.php`.
- Scheduling: Laravel scheduler; cron or `schedule:work` is required for periodic tasks.
- Data storage: PostgreSQL expected by default; migrations live in [backend/database/migrations](../backend/database/migrations).

**Examples for Common Tasks**
- Add an API endpoint: update [backend/routes/api.php](../backend/routes/api.php) → implement controller under [backend/app/Http/Controllers/Api](../backend/app/Http/Controllers/Api) → apply `auth:sanctum` & `role:pharmacist` as needed → update frontend client in [frontend/src/api/pharmacy.ts](../frontend/src/api/pharmacy.ts).
- Run the daily reorder check locally:
  - `php artisan inventory:check-reorder-levels`
- Create DB on Windows (PowerShell example): see [backend/QUICK_START.md](../backend/QUICK_START.md)

**What to avoid / notes**
- Do not assume an existing `.env` or DB — creation scripts and QUICK_START exist and should be followed.
- There are merge markers in the root README; be cautious when using it as authoritative. See [README.md](../README.md).

**If unsure, check these first**
- [backend/README.md](../backend/README.md) — Laravel baseline guidance
- [frontend/README.md](../frontend/README.md) — Create React App guidance
- [PHARMACY_SYSTEM_SUMMARY.md](../PHARMACY_SYSTEM_SUMMARY.md) — concise domain overview and file map

Please review and tell me if any sections need more detail or examples.
