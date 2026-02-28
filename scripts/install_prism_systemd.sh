#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
UNIT_SRC_DIR="$PROJECT_DIR/deploy/systemd"
UNIT_DST_DIR="/etc/systemd/system"

install -m 644 "$UNIT_SRC_DIR/prism-aiads-api.service" "$UNIT_DST_DIR/prism-aiads-api.service"
install -m 644 "$UNIT_SRC_DIR/prism-aiads-web.service" "$UNIT_DST_DIR/prism-aiads-web.service"
install -m 644 "$UNIT_SRC_DIR/prism-aiads-tunnel.service" "$UNIT_DST_DIR/prism-aiads-tunnel.service"
install -m 644 "$UNIT_SRC_DIR/prism-aiads.target" "$UNIT_DST_DIR/prism-aiads.target"

systemctl daemon-reload
systemctl enable --now prism-aiads.target
systemctl status prism-aiads-api.service --no-pager
systemctl status prism-aiads-web.service --no-pager
systemctl status prism-aiads-tunnel.service --no-pager
