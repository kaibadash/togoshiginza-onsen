#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
fail=0

ok() { printf 'ok: %s\n' "$1"; }
ng() { printf 'ng: %s\n' "$1"; fail=1; }

need_file() {
  if [[ -f "$root/$1" ]]; then
    ok "file $1"
  else
    ng "missing $1"
  fi
}

need_text() {
  local file="$1"
  local text="$2"
  if grep -F -q -- "$text" "$root/$file"; then
    ok "$file has: $text"
  else
    ng "$file missing: $text"
  fi
}

forbid_text() {
  local file="$1"
  local text="$2"
  if grep -F -q -- "$text" "$root/$file"; then
    ng "$file must not contain: $text"
  else
    ok "$file forbids: $text"
  fi
}

need_file "index.html"
need_file "styles.css"

need_text "index.html" 'lang="ja"'
need_text "index.html" "これは非公式の案内です。最新情報は店舗へご確認ください。"
need_text "index.html" "戸越銀座温泉"
need_text "index.html" "非公式"
need_text "index.html" "15:00"
need_text "index.html" "25:00"
need_text "index.html" "8:00"
need_text "index.html" "12:00"
need_text "index.html" "金曜"
need_text "index.html" "臨時休業あり"
need_text "index.html" "東京都品川区戸越2-1-6"
need_text "index.html" 'href="tel:03-3782-7400"'
need_text "index.html" "都営浅草線"
need_text "index.html" "戸越駅"
need_text "index.html" "東急池上線"
need_text "index.html" "戸越銀座駅"
need_text "index.html" "Google マップで開く"
need_text "index.html" "https://www.google.com/maps/search/?api=1&query=戸越銀座温泉+東京都品川区戸越2-1-6"
need_text "index.html" "https://shinagawa1010.jp/list/togoshiginza/"
need_text "index.html" "https://shinagawa-kanko.or.jp/spot/togoshiginzaonsen/"
need_text "index.html" 'href="styles.css"'
need_text "index.html" 'class="notice"'
need_text "index.html" 'class="hours"'
need_text "index.html" 'src="images/hero.jpg"'

forbid_text "index.html" "円"
forbid_text "index.html" "サウナ"
forbid_text "index.html" "炭酸水素塩"
forbid_text "index.html" "<iframe"
forbid_text "index.html" "<script"
forbid_text "index.html" "fonts.googleapis.com"
forbid_text "index.html" "cdn.jsdelivr.net"
forbid_text "styles.css" "@import"
forbid_text "styles.css" "fonts.googleapis.com"
forbid_text "styles.css" "cdn.jsdelivr.net"

if grep -E -q 'url\([\"'\'']?https?:' "$root/styles.css" 2>/dev/null; then
  ng "styles.css must not load remote urls"
else
  ok "styles.css has no remote url()"
fi

if [[ "$fail" -ne 0 ]]; then
  printf '\nverify failed\n'
  exit 1
fi

printf '\nverify passed\n'
