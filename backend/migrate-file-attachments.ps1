# Run this script to add file attachment tables to the database
# Execute from PowerShell: .\migrate-file-attachments.ps1

$serverName = "Rizwan\SQLEXPRESS"
$databaseName = "FSDP"
$sqlFile = ".\schemas\create-app-tables-FSDP.sql"

Write-Host "🔄 Adding file attachment tables to $databaseName database..." -ForegroundColor Cyan

try {
    # Execute the SQL file
    sqlcmd -S $serverName -d $databaseName -i $sqlFile -E
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ File attachment tables added successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "New tables created:" -ForegroundColor Yellow
        Write-Host "  - MessageAttachments (for conversation file uploads)" -ForegroundColor White
        Write-Host "  - TaskAttachments (for team task file uploads)" -ForegroundColor White
        Write-Host ""
        Write-Host "Supported file types:" -ForegroundColor Yellow
        Write-Host "  - Images: JPG, PNG, GIF, WebP" -ForegroundColor White
        Write-Host "  - Documents: PDF, Word, Excel, PowerPoint" -ForegroundColor White
        Write-Host "  - Text: TXT, CSV" -ForegroundColor White
        Write-Host "  - Max file size: 10MB" -ForegroundColor White
    } else {
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
