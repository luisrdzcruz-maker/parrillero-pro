param(
  [string]$SourceBranch = "v2",
  [string]$Message = "Update main from $SourceBranch"
)

Write-Host "🚀 Parrillero Pro deploy helper" -ForegroundColor Cyan

# 1. Check current status
Write-Host "`n📊 Current status:" -ForegroundColor Yellow
git status

# 2. Switch branch
Write-Host "`n🌿 Switching to $SourceBranch..." -ForegroundColor Yellow
git checkout $SourceBranch

# 3. Stage changes
git add .

# 4. Check whether there are changes to commit
$changes = git status --porcelain
if ($changes) {
    Write-Host "`n💾 Saving changes..." -ForegroundColor Yellow
    git commit -m "$Message"
} else {
    Write-Host "`nℹ️ No changes to commit" -ForegroundColor DarkYellow
}

# 5. Push source branch
Write-Host "`n⬆️ Pushing $SourceBranch..." -ForegroundColor Yellow
git push origin $SourceBranch

# 6. Merge into main
Write-Host "`n🔁 Updating main..." -ForegroundColor Yellow
git checkout main
git pull origin main
git merge $SourceBranch

if ($LASTEXITCODE -ne 0) {
  Write-Host "⚠️ Conflicts detected. Resolve them manually." -ForegroundColor Red
  exit 1
}

# 7. Push main
Write-Host "`n⬆️ Pushing main..." -ForegroundColor Yellow
git push origin main

Write-Host "`n✅ Deploy completed. Vercel should be building." -ForegroundColor Green