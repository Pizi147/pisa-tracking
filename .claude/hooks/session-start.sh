#!/bin/bash
# Cài marketplace và plugin đã khai báo trong .claude/settings.json cho session cloud.
# Chạy lại an toàn: marketplace/plugin đã có thì bỏ qua.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

MARKETPLACES=(
  "anthropics/claude-plugins-official"
  "DietrichGebert/ponytail"
  "https://github.com/affaan-m/ECC.git"
)
PLUGINS=(
  "superpowers@claude-plugins-official"
  "ponytail@ponytail"
  "ecc@ecc"
)

installed_marketplaces=$(claude plugin marketplace list 2>&1 || true)
for source in "${MARKETPLACES[@]}"; do
  if ! grep -q "$source" <<< "$installed_marketplaces"; then
    claude plugin marketplace add "$source"
  fi
done

installed_plugins=$(claude plugin list 2>&1 || true)
for plugin in "${PLUGINS[@]}"; do
  if ! grep -q "> $plugin" <<< "$installed_plugins"; then
    claude plugin install -y "$plugin"
  fi
done

# Đặt giá trị mặc định cho cấu hình plugin còn trống (không ghi đè giá trị đã đặt).
configure_defaults() {
  local plugin=$1 values=$2
  if claude plugin configure "$plugin" 2>&1 | grep -q "not set"; then
    echo "$values" | claude plugin configure --values-stdin "$plugin" >/dev/null 2>&1 || true
  fi
}
configure_defaults "ponytail@ponytail" '{"ledger":"true","sendNames":"true"}'
configure_defaults "ecc@ecc" '{"hooks_enabled":"true","hook_profile":"standard"}'
