$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🚀 STARTING LORE LIVE DEMO ENVIRONMENT 🚀" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Check for .env file
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file is missing! Please copy .env.example to .env and add your ANTHROPIC_API_KEY and GITHUB_TOKEN." -ForegroundColor Red
    exit 1
}

# 2. Get Smee URL
$smeeUrl = Read-Host "Enter your Smee.io webhook URL (Go to https://smee.io/ to generate one)"
if ([string]::IsNullOrWhiteSpace($smeeUrl)) {
    Write-Host "❌ Smee URL is required for live GitHub webhooks." -ForegroundColor Red
    exit 1
}

Write-Host "`n[1/3] Starting FastAPI Server on port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"uvicorn apps.api.main:app --port 3000 --reload`"" -WindowStyle Normal

Write-Host "[2/3] Starting Celery Worker..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"celery -A apps.api.tasks worker --loglevel=info --pool=solo`"" -WindowStyle Normal

Write-Host "[3/3] Starting Smee Webhook Forwarding..." -ForegroundColor Yellow
Write-Host "Forwarding webhooks from $smeeUrl to http://127.0.0.1:3000/webhooks/github" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"npx smee-client --url $smeeUrl --path /webhooks/github --port 3000`"" -WindowStyle Normal

Write-Host "`n✅ All services started in separate windows!" -ForegroundColor Green
Write-Host "`nNEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Go to your GitHub Repository -> Settings -> Webhooks"
Write-Host "2. Add a new webhook:"
Write-Host "   - Payload URL: $smeeUrl"
Write-Host "   - Content type: application/json"
Write-Host "   - Events: Select 'Pull requests'"
Write-Host "3. Create a test PR in GitHub to see the AI Historian in action!"
