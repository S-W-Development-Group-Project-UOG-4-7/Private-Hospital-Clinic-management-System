# Quick Start Guide - PostgreSQL Database Setup

## ✅ Completed Steps
1. ✓ Composer dependencies installed
2. ✓ Laravel application key generated
3. ✓ PostgreSQL PHP extensions enabled
4. ✓ .env file configured for PostgreSQL

## 🔴 Next Step: Create the Database

You need to create the PostgreSQL database. Choose one of these methods:

### Method 1: Using PHP Script (Easiest)

```powershell
# Option A: Pass password as argument
php create-database.php your_postgres_password

# Option B: Set environment variable first
$env:PGPASSWORD='your_postgres_password'
php create-database.php
```

### Method 2: Using pgAdmin (GUI)

1. Open **pgAdmin** (usually installed with PostgreSQL)
2. Connect to your PostgreSQL server
3. Right-click on "Databases" → "Create" → "Database"
4. Name: `clinic_management`
5. Click "Save"

### Method 3: Using Command Line (if psql is in PATH)

```powershell
# Add PostgreSQL bin to PATH (adjust version number)
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"

# Create database
psql -U postgres -c "CREATE DATABASE clinic_management;"
```

### Method 4: Find PostgreSQL Installation

If you don't know where PostgreSQL is installed, try:

```powershell
# Common locations
Get-ChildItem "C:\Program Files\PostgreSQL" -ErrorAction SilentlyContinue
Get-ChildItem "C:\Program Files (x86)\PostgreSQL" -ErrorAction SilentlyContinue
```

Then add the `bin` folder to your PATH or use the full path:
```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE clinic_management;"
```

## After Creating the Database

1. **Update `.env` file** with your PostgreSQL password:
   ```
   DB_PASSWORD=your_actual_password_here
   ```

2. **Run migrations**:
   ```powershell
   php artisan migrate
   ```

3. **Verify connection**:
   ```powershell
   php artisan db:show
   ```

## Troubleshooting

### "database does not exist"
- Make sure you created the database using one of the methods above

### "password authentication failed"
- Double-check your PostgreSQL password in `.env`
- Try connecting with pgAdmin to verify credentials

### "could not connect to server"
- Make sure PostgreSQL service is running:
  ```powershell
  Get-Service -Name postgresql*
  ```
- Start it if needed:
  ```powershell
  Start-Service postgresql-x64-16  # Adjust version number
  ```

