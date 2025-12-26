# Test Anthropic API locally
# Set your API key (or it will prompt you)
if (-not $env:ANTHROPIC_API_KEY) {
    $env:ANTHROPIC_API_KEY = Read-Host "Enter your Anthropic API key"
}

Write-Host "Testing Anthropic API..." -ForegroundColor Cyan

# Test 1: Simple message with different models
$models = @(
    "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet-20240620", 
    "claude-3-sonnet-20240229",
    "claude-3-opus-20240229",
    "claude-3-haiku-20240307"
)

foreach ($model in $models) {
    Write-Host "`nTesting model: $model" -ForegroundColor Yellow
    
    $body = @{
        model = $model
        max_tokens = 100
        messages = @(
            @{
                role = "user"
                content = "Say hello in one word"
            }
        )
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri "https://api.anthropic.com/v1/messages" `
            -Method Post `
            -Headers @{
                "x-api-key" = $env:ANTHROPIC_API_KEY
                "anthropic-version" = "2023-06-01"
                "content-type" = "application/json"
            } `
            -Body $body `
            -ErrorAction Stop

        Write-Host "✅ SUCCESS with $model" -ForegroundColor Green
        Write-Host "Response: $($response.content[0].text)"
        break  # Stop on first success
    }
    catch {
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "❌ FAILED: $($errorResponse.error.type) - $($errorResponse.error.message)" -ForegroundColor Red
    }
}

Write-Host "`n" -NoNewline
Write-Host "If all models failed, check:" -ForegroundColor Cyan
Write-Host "1. API key is valid at https://console.anthropic.com/settings/keys"
Write-Host "2. Billing is enabled at https://console.anthropic.com/settings/billing"
Write-Host "3. You have credits or payment method added"
