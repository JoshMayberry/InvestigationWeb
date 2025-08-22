# save as: serve_switchboard.py
# usage:   python serve_switchboard.py
#          python serve_switchboard.py --port 8000 --dir ./

import argparse
import http.server
import os
import socket
import socketserver
import sys
import threading
import time
import webbrowser
from contextlib import closing
from pathlib import Path

DEFAULT_PORT = 8000

def find_open_port(start_port: int) -> int:
    port = start_port
    while True:
        with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
            try:
                s.bind(("", port))
                return port
            except OSError:
                port += 1
                if port > 65535:
                    raise RuntimeError("No open ports available")

class QuietHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    # Keep logs tidy
    def log_message(self, format, *args):
        sys.stderr.write("%s - - %s\n" % (self.address_string(), format%args))

def main():
    parser = argparse.ArgumentParser(description="Serve a folder locally and open switchboard.html")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"Port to start on (default: {DEFAULT_PORT})")
    parser.add_argument("--dir", default=".", help="Directory to serve (default: current directory)")
    args = parser.parse_args()

    serve_dir = Path(args.dir).resolve()
    if not serve_dir.exists() or not serve_dir.is_dir():
        print(f"❌ Directory not found: {serve_dir}")
        sys.exit(1)

    os.chdir(serve_dir)

    # Pick an available port starting from args.port
    port = find_open_port(args.port)

    Handler = QuietHTTPRequestHandler
    # Threaded server for better responsiveness
    class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
        daemon_threads = True
        allow_reuse_address = True

    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)

    url = f"http://localhost:{port}/switchboard.html"
    print("============================================================")
    print(f"📁 Serving directory: {serve_dir}")
    print(f"🌐 Local server:      http://localhost:{port}/")
    print(f"🧭 Opening:           {url}")
    print("⛔ Press Ctrl+C to stop")
    print("============================================================")

    # Open the browser after the server starts listening
    def open_browser():
        # tiny delay to ensure server is ready
        time.sleep(0.4)
        try:
            webbrowser.open(url, new=2)
        except Exception:
            pass

    threading.Thread(target=open_browser, daemon=True).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down…")
    finally:
        server.server_close()

if __name__ == "__main__":
    main()
