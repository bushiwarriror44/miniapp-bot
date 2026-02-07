# Убирает сабмодули: один репозиторий, backend/frontend/bot — обычные папки.
# Запуск из корня проекта: .\deploy\remove-submodules.ps1

$ErrorActionPreference = "Stop"
$root = (Get-Item $PSScriptRoot).Parent.FullName
Set-Location $root

Write-Host "Корень репозитория: $root"

# 1. Удалить .gitmodules, если есть
if (Test-Path ".gitmodules") {
    git submodule deinit -f -- backend 2>$null
    git submodule deinit -f -- frontend 2>$null
    git submodule deinit -f -- bot 2>$null
    git rm --cached backend 2>$null
    git rm --cached frontend 2>$null
    git rm --cached bot 2>$null
    Remove-Item -Force ".gitmodules" -ErrorAction SilentlyContinue
    Write-Host "Удалён .gitmodules и снята регистрация сабмодулей."
}

# 2. Удалить кэш сабмодулей в .git/modules
$modulesPath = Join-Path $root ".git\modules"
if (Test-Path $modulesPath) {
    @("backend", "frontend", "bot") | ForEach-Object {
        $p = Join-Path $modulesPath $_
        if (Test-Path $p) {
            Remove-Item -Recurse -Force $p
            Write-Host "Удалено: .git/modules/$_"
        }
    }
}

# 3. Удалить вложенные .git в папках (чтобы это были не отдельные репо)
@("backend", "frontend", "bot") | ForEach-Object {
    $gitPath = Join-Path $root "$_\.git"
    if (Test-Path $gitPath) {
        Remove-Item -Recurse -Force $gitPath
        Write-Host "Удалено: $_/.git"
    }
}

# 4. Добавить папки в индекс как обычные файлы (если ещё не добавлены)
git add backend frontend bot 2>$null
Write-Host "Готово. backend, frontend, bot теперь часть одного репозитория."
Write-Host "Выполни коммит при необходимости: git commit -m 'Convert to single repo'"
