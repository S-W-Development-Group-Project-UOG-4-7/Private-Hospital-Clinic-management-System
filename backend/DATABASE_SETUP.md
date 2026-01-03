# PostgreSQL Database Setup Guide

This guide will help you set up PostgreSQL database for the Clinic Management System.

## Prerequisites

1. **PostgreSQL installed** on your system
   - Download from: https://www.postgresql.org/download/windows/
   - During installation, remember the password you set for the `postgres` user

2. **PHP PostgreSQL extension (pgsql)**
   - Usually comes with PHP, but verify it's enabled in your `php.ini`
   - Look for: `extension=pgsql` and `extension=pdo_pgsql`

## Step 1: Create the Database

You have three options to create the database:

### Option A: Using PowerShell Script (Recommended for Windows)

```powershell
cd backend
.\setup-database.ps1
```

The script will:
- Check if PostgreSQL is installed
- Prompt for your PostgreSQL username and password
- Create the `clinic_management` database

### Option B: Using psql Command Line

```powershell
# Connect to PostgreSQL
psql -U postgres

# Enter your password when prompted, then run:
CREATE DATABASE clinic_management;

# Exit psql
\q
```

### Option C: Using SQL File

```powershell
psql -U postgres -f setup-database.sql
```

## Step 2: Configure Laravel

1. **Update `.env` file** (already created in `backend/.env`):
   - Set `DB_USERNAME` to your PostgreSQL username (usually `postgres`)
   - Set `DB_PASSWORD` to your PostgreSQL password
   - Verify these settings:
     ```
     DB_CONNECTION=pgsql
     DB_HOST=127.0.0.1
     DB_PORT=5432
     DB_DATABASE=clinic_management
     DB_USERNAME=postgres
     DB_PASSWORD=your_password_here
     ```

2. **Install Composer Dependencies**:
   ```powershell
   composer install
   ```

3. **Generate Application Key**:
   ```powershell
   php artisan key:generate
   ```

4. **Run Migrations**:
   ```powershell
   php artisan migrate
   ```

## Step 3: Verify Connection

Test the database connection:

```powershell
php artisan tinker
```

Then in tinker:
```php
DB::connection()->getPdo();
// Should return: PDO object without errors
```

Or run:
```powershell
php artisan db:show
```

## Troubleshooting

### Error: "could not connect to server"
- Make sure PostgreSQL service is running
- Check if PostgreSQL is running on port 5432
- Verify `DB_HOST` in `.env` is correct (usually `127.0.0.1`)

### Error: "password authentication failed"
- Double-check your `DB_USERNAME` and `DB_PASSWORD` in `.env`
- Try connecting with psql to verify credentials:
  ```powershell
  psql -U postgres -d clinic_management
  ```

### Error: "database does not exist"
- Make sure you created the database (Step 1)
- Verify `DB_DATABASE=clinic_management` in `.env`

### Error: "extension pgsql not found"
- Enable PostgreSQL extensions in `php.ini`:
  - Uncomment: `extension=pgsql`
  - Uncomment: `extension=pdo_pgsql`
- Restart your web server/PHP-FPM

## Quick Setup Commands (All-in-One)

```powershell
# Navigate to backend directory
cd backend

# Create database (choose one method above)

# Install dependencies
composer install

# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate

# (Optional) Seed database
php artisan db:seed
```

## Group Project Notes

For group members:
1. Each member should have PostgreSQL installed locally
2. Each member should create their own `clinic_management` database
3. Each member should have their own `.env` file (not committed to git)
4. Share database schema/migrations via Git, not the actual database

