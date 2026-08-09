#!/usr/bin/env bash
# Черновая проверка на признаки генерации. Ложные срабатывания ожидаемы.
# Запуск: ./scripts/slop-check.sh [каталог]   (по умолчанию apps/web)
set -u

SRC="${1:-apps/web}"
FAIL=0

section() { printf "\n== %s ==\n" "$1"; }

# Ищем только в исходниках интерфейса, без сборки и зависимостей
find_src() {
  find "$SRC" -type d \( -name node_modules -o -name .next \) -prune -o \
    -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \) -print
}

report() {
  local title="$1" pattern="$2" flags="${3:-}"
  section "$title"
  local hits
  hits=$(find_src | xargs grep -n $flags -E "$pattern" 2>/dev/null)
  if [ -n "$hits" ]; then
    echo "$hits"
    FAIL=1
  else
    echo "чисто"
  fi
}

section "Длинные тире (норма: не больше одного на абзац)"
find_src | xargs grep -c "—" 2>/dev/null | grep -v ":0$" || echo "нет"

report "Стоп-слова RU" "не просто|важно отметить|в современном мире|ключевую роль|позволяет оптимизировать|инновацион|уникальн|по-настоящему|комплексный подход|на новый уровень|стоит отметить|таким образом" "-i"

report "Стоп-слова EN" "seamless|leverage|robust|elevate|unlock|empower|streamline|supercharge|world-class|enterprise-grade|cutting-edge|game-chang" "-i"

section "Дизайн-признаки"
DESIGN_HITS=$(find_src | xargs grep -nE "border-l-4|border-left: *[2-9]px|linear-gradient|radial-gradient|box-shadow|text-transparent|rounded-2xl|tracking-widest" 2>/dev/null | grep -v "mask-image")
if [ -n "$DESIGN_HITS" ]; then echo "$DESIGN_HITS"; FAIL=1; else echo "чисто (маска орнамента не в счёт)"; fi

report "Шрифты из дефолтного набора" "Inter|Geist|Space Grotesk|Poppins|Instrument Serif|Playfair"

section "Эмодзи в вёрстке"
if find_src | xargs grep -nP "[\x{1F300}-\x{1FAFF}\x{2700}-\x{27BF}\x{2600}-\x{26FF}]" 2>/dev/null | grep -q .; then
  find_src | xargs grep -nP "[\x{1F300}-\x{1FAFF}\x{2700}-\x{27BF}\x{2600}-\x{26FF}]" 2>/dev/null
  FAIL=1
else
  echo "чисто"
fi

section "Значения вне токенов DESIGN.md"
OFF_SIZE=$(grep -oE "font-size: [0-9.]+rem" "$SRC/app/globals.css" | grep -vE "var\(" | sort -u)
if [ -n "$OFF_SIZE" ]; then
  echo "кегль мимо шкалы: $OFF_SIZE"
  FAIL=1
else
  echo "кегль: только токены"
fi

OFF_SPACE=$(grep -oE "(padding|margin|gap): [0-9]+px" "$SRC/app/globals.css" | sort -u)
if [ -n "$OFF_SPACE" ]; then
  echo "отступы мимо шкалы: $OFF_SPACE"
  FAIL=1
else
  echo "отступы: только токены"
fi

printf "\n"
if [ "$FAIL" -eq 0 ]; then
  echo "Проверка пройдена."
else
  echo "Есть срабатывания, проверьте список выше."
fi
exit 0
