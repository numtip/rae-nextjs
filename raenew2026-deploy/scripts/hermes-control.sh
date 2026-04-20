#!/usr/bin/env bash
set -euo pipefail

HERMES_HOME="$HOME/.hermes"
CONFIG="$HERMES_HOME/config.yaml"
SERVICE="hermes-gateway"

usage() {
  cat <<EOF
Usage: $0 {backup|start|stop|restart|status|logs|tail}

Commands:
  backup   Backup current config to timestamped .bak
  start    Enable & start hermes-gateway (systemd --user)
  stop     Stop hermes-gateway (systemd --user)
  restart  Restart hermes-gateway and show status
  status   Show systemd --user status for hermes-gateway
  logs     Follow journal logs for hermes-gateway
  tail     Tail hermes log files in ~/.hermes/logs
EOF
}

if [ $# -lt 1 ]; then
  usage
  exit 1
fi

cmd="$1"
case "$cmd" in
  backup)
    if [ -f "$CONFIG" ]; then
      BACKUP="$CONFIG.$(date +%Y%m%d%H%M%S).bak"
      cp "$CONFIG" "$BACKUP"
      echo "Backed up $CONFIG -> $BACKUP"
    else
      echo "No config file at $CONFIG" >&2
      exit 2
    fi
    ;;
  start)
    systemctl --user enable --now "$SERVICE"
    systemctl --user status "$SERVICE" --no-pager
    ;;
  stop)
    systemctl --user stop "$SERVICE"
    ;;
  restart)
    systemctl --user restart "$SERVICE"
    systemctl --user status "$SERVICE" --no-pager
    ;;
  status)
    systemctl --user status "$SERVICE" --no-pager
    ;;
  logs)
    journalctl --user -u "$SERVICE" -f
    ;;
  tail)
    tail -n 200 -f "$HERMES_HOME/logs/"*.log
    ;;
  *)
    usage
    exit 1
    ;;
esac
