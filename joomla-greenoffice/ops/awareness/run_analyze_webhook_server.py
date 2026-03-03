#!/usr/bin/env python3
"""
Minimal HTTP server on host: GET /analyze?session=XXX runs run_analyze.sh and returns JSON.
Used when n8n runs in Docker (no Python in container). n8n calls this via host.docker.internal:9765.
Usage: python3 run_analyze_webhook_server.py [--port 9765]
Bind: 0.0.0.0 so Docker can reach via host gateway.
"""
import argparse
import json
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

SCRIPT_DIR = __import__("pathlib").Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
RUN_ANALYZE = SCRIPT_DIR / "run_analyze.sh"


class AnalyzeHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path != "/analyze" and parsed.path != "/":
            self.send_error(404)
            return
        q = parse_qs(parsed.query)
        session = (q.get("session") or [""])[0].strip()
        if not session:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": False, "error": "session required"}).encode())
            return
        try:
            subprocess.run(
                [str(RUN_ANALYZE), session],
                cwd=str(REPO_ROOT),
                check=True,
                capture_output=True,
                timeout=120,
            )
            out = {"ok": True, "session": session}
        except subprocess.CalledProcessError as e:
            out = {"ok": False, "session": session, "error": str(e)}
        except Exception as e:
            out = {"ok": False, "session": session, "error": str(e)}
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(out).encode())

    def log_message(self, format, *args):
        sys.stderr.write("[run_analyze_webhook] %s\n" % (format % args))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=9765)
    ap.add_argument("--bind", default="0.0.0.0")
    args = ap.parse_args()
    server = HTTPServer((args.bind, args.port), AnalyzeHandler)
    print("Listening on %s:%d (GET /analyze?session=XXX)" % (args.bind, args.port))
    server.serve_forever()


if __name__ == "__main__":
    main()
