# Run Database Migration for Multi-Agent Collaboration Feature
# This script executes the SQL schema to create the necessary tables

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Multi-Agent Collaboration - Database Migration" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# SQL Server connection details (modify if needed)
$ServerInstance = "Rizwan\SQLEXPRESS"  # Your SQL Server instance
$Database = "FSDP"
$SqlFile = ".\schemas\create-app-tables-FSDP.sql"

Write-Host "Server: $ServerInstance" -ForegroundColor Yellow
Write-Host "Database: $Database" -ForegroundColor Yellow
Write-Host "SQL File: $SqlFile" -ForegroundColor Yellow
Write-Host ""

# Check if SQL file exists
if (-not (Test-Path $SqlFile)) {
    Write-Host "ERROR: SQL file not found at: $SqlFile" -ForegroundColor Red
    Write-Host "Make sure you're running this from the backend directory" -ForegroundColor Red
    exit 1
}

Write-Host "Executing SQL schema..." -ForegroundColor Green

try {
    # Execute the SQL file using sqlcmd
    sqlcmd -S $ServerInstance -d $Database -i $SqlFile -b
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Database migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "The following tables have been created/updated:" -ForegroundColor Cyan
        Write-Host "  - Teams" -ForegroundColor White
        Write-Host "  - TeamMembers" -ForegroundColor White
        Write-Host "  - CollaborativeTasks" -ForegroundColor White
        Write-Host "  - TaskAssignments" -ForegroundColor White
        Write-Host "  - AgentContributions" -ForegroundColor White
        Write-Host ""
        Write-Host "You can now restart your backend server!" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "ERROR: Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to execute SQL migration" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  1. SQL Server is running" -ForegroundColor White
    Write-Host "  2. You have permissions to create tables" -ForegroundColor White
    Write-Host "  3. The FSDP database exists" -ForegroundColor White
    Write-Host "  4. sqlcmd is installed and in your PATH" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
