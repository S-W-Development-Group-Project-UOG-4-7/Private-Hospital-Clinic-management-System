# PostgreSQL Database Setup Script for Clinic Management System
# This script creates the PostgreSQL database 'clinic_management'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "ERROR: PostgreSQL is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installation, make sure PostgreSQL bin directory is in your PATH." -ForegroundColor Yellow
    Write-Host "Default location: C:\Program Files\PostgreSQL\<version>\bin" -ForegroundColor Yellow
    exit 1
}

Write-Host "PostgreSQL found at: $($psqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Prompt for PostgreSQL username (default: postgres)
$dbUsername = Read-Host "Enter PostgreSQL username (default: postgres)"
if ([string]::IsNullOrWhiteSpace($dbUsername)) {
    $dbUsername = "postgres"
}

# Prompt for PostgreSQL password
$securePassword = Read-Host "Enter PostgreSQL password" -AsSecureString
$dbPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
)

# Database name
$dbName = "clinic_management"

Write-Host ""
Write-Host "Creating database '$dbName'..." -ForegroundColor Yellow

# Set PGPASSWORD environment variable for psql
$env:PGPASSWORD = $dbPassword

# Create database using psql
$createDbQuery = "CREATE DATABASE $dbName;"
$psqlCommand = "psql -U $dbUsername -d postgres -c `"$createDbQuery`""

try {
    $result = Invoke-Expression $psqlCommand 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database '$dbName' created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Update your .env file with your PostgreSQL credentials:" -ForegroundColor White
        Write-Host "   DB_USERNAME=$dbUsername" -ForegroundColor Gray
        Write-Host "   DB_PASSWORD=<your_password>" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Run: composer install" -ForegroundColor White
        Write-Host "3. Run: php artisan key:generate" -ForegroundColor White
        Write-Host "4. Run: php artisan migrate" -ForegroundColor White
    } else {
        if ($result -match "already exists") {
            Write-Host "✓ Database '$dbName' already exists!" -ForegroundColor Yellow
        } else {
            Write-Host "ERROR: Failed to create database" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
        }
    }
} catch {
    Write-Host "ERROR: Failed to execute psql command" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: You can create the database manually using pgAdmin or:" -ForegroundColor Yellow
    Write-Host "psql -U $dbUsername -d postgres" -ForegroundColor Gray
    Write-Host "CREATE DATABASE $dbName;" -ForegroundColor Gray
}

# Clear password from environment
$env:PGPASSWORD = $null

