#!/bin/bash
# Убирает сабмодули: один репозиторий, backend/frontend/bot — обычные папки.
# Запуск из корня проекта: ./deploy/remove-submodules.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Корень репозитория: $ROOT"

# 1. Если есть .gitmodules — деинициализация и удаление
if [ -f .gitmodules ]; then
  git submodule deinit -f -- backend 2>/dev/null || true
  git submodule deinit -f -- frontend 2>/dev/null || true
  git submodule deinit -f -- bot 2>/dev/null || true
  git rm --cached backend 2>/dev/null || true
  git rm --cached frontend 2>/dev/null || true
  git rm --cached bot 2>/dev/null || true
  rm -f .gitmodules
  echo "Удалён .gitmodules и снята регистрация сабмодулей."
fi

# 2. Удалить кэш сабмодулей
for dir in backend frontend bot; do
  if [ -d ".git/modules/$dir" ]; then
    rm -rf ".git/modules/$dir"
    echo "Удалено: .git/modules/$dir"
  fi
done

# 3. Удалить вложенные .git (чтобы папки не были отдельными репо)
for dir in backend frontend bot; do
  if [ -d "$dir/.git" ]; then
    rm -rf "$dir/.git"
    echo "Удалено: $dir/.git"
  fi
done

# 4. Добавить папки в индекс как обычные
git add backend frontend bot 2>/dev/null || true
echo "Готово. backend, frontend, bot теперь часть одного репозитория."
echo "Выполни коммит при необходимости: git commit -m 'Convert to single repo'"
