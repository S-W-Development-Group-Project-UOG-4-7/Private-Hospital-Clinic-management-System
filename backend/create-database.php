<?php
/**
 * Script to create PostgreSQL database for Clinic Management System
 * Run: php create-database.php
 */

// Database configuration
$host = '127.0.0.1';
$port = '5432';
$database = 'clinic_management';
$username = 'postgres';

// Get password from command line argument or environment variable
$password = $argv[1] ?? getenv('PGPASSWORD') ?? '';

echo "========================================\n";
echo "Creating PostgreSQL Database\n";
echo "========================================\n\n";

// If password is empty, prompt for it
if (empty($password)) {
    echo "Usage: php create-database.php [password]\n";
    echo "Or set environment variable: \$env:PGPASSWORD='your_password'\n\n";
    echo "Enter PostgreSQL password for user '$username': ";
    $password = trim(fgets(STDIN));
    echo "\n";
}

try {
    // Connect to PostgreSQL server (not to a specific database)
    $pdo = new PDO(
        "pgsql:host=$host;port=$port",
        $username,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    echo "✓ Connected to PostgreSQL server\n";
    
    // Check if database exists
    $stmt = $pdo->query("SELECT 1 FROM pg_database WHERE datname = '$database'");
    $exists = $stmt->fetch();
    
    if ($exists) {
        echo "⚠ Database '$database' already exists!\n";
    } else {
        // Create database
        $pdo->exec("CREATE DATABASE $database");
        echo "✓ Database '$database' created successfully!\n";
    }
    
    // Test connection to the new database
    $pdo = new PDO(
        "pgsql:host=$host;port=$port;dbname=$database",
        $username,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    echo "✓ Successfully connected to database '$database'\n";
    echo "\n";
    echo "Next steps:\n";
    echo "1. Update your .env file with your PostgreSQL password:\n";
    echo "   DB_PASSWORD=$password\n";
    echo "\n";
    echo "2. Run migrations:\n";
    echo "   php artisan migrate\n";
    
} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "\n";
    echo "Troubleshooting:\n";
    echo "- Make sure PostgreSQL service is running\n";
    echo "- Verify your username and password are correct\n";
    echo "- Check if PostgreSQL is running on port $port\n";
    exit(1);
}

