param(
  [string]$SourceBranch = "v2",
  [string]$Message = "Update main from $SourceBranch"
)

Write-Host "🚀 Parrillero Pro deploy helper" -ForegroundColor Cyan

# 1. Ver estado
Write-Host "`n📊 Estado actual:" -ForegroundColor Yellow
git status

# 2. Cambiar a rama
Write-Host "`n🌿 Cambiando a $SourceBranch..." -ForegroundColor Yellow
git checkout $SourceBranch

# 3. Añadir cambios
git add .

# 4. Comprobar si hay cambios para commit
$changes = git status --porcelain
if ($changes) {
    Write-Host "`n💾 Guardando cambios..." -ForegroundColor Yellow
    git commit -m "$Message"
} else {
    Write-Host "`nℹ️ No hay cambios para commit" -ForegroundColor DarkYellow
}

# 5. Push rama origen
Write-Host "`n⬆️ Subiendo $SourceBranch..." -ForegroundColor Yellow
git push origin $SourceBranch

# 6. Merge a main
Write-Host "`n🔁 Actualizando main..." -ForegroundColor Yellow
git checkout main
git pull origin main
git merge $SourceBranch

if ($LASTEXITCODE -ne 0) {
  Write-Host "⚠️ Conflictos detectados. Resuélvelos manualmente." -ForegroundColor Red
  exit 1
}

# 7. Push main
Write-Host "`n⬆️ Subiendo main..." -ForegroundColor Yellow
git push origin main

Write-Host "`n✅ Deploy completado. Vercel debería estar construyendo." -ForegroundColor Green