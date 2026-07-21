"""
controller/app.py

Small always-on control-plane service. Separate from the 4 Django backends
so it can start/stop them without stopping itself. Owns the Docker socket
(mounted read-write) and proxies Prometheus queries so React never needs
direct access to either.

Endpoints:
  GET  /status              -> { containers: {name: "running"/"exited"/...}, strategy: "round_robin" }
  POST /start                -> starts backend1-4 + nginx
  POST /stop                 -> stops backend1-4 + nginx
  POST /strategy {strategy}  -> swaps active_upstream.conf + reloads nginx
  GET  /metrics/query?q=...  -> proxies to Prometheus /api/v1/query
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import docker
import shutil
import requests
from pathlib import Path

app = Flask(__name__)
CORS(app)  # dev-only; restrict origins in production

client = docker.from_env()

STACK_CONTAINERS = ["backend1", "backend2", "backend3", "backend4", "nginx"]
VALID_STRATEGIES = {"round_robin", "least_conn", "ip_hash", "weighted_round_robin"}

STRATEGIES_DIR = Path("/nginx_conf/strategies")
ACTIVE_CONF = Path("/nginx_conf/active_upstream.conf")

PROMETHEUS_URL = "http://prometheus:9090"


def current_strategy():
    if not ACTIVE_CONF.exists():
        return "unknown"
    text = ACTIVE_CONF.read_text()
    if "weight=" in text:
        return "weighted_round_robin"
    if "least_conn" in text:
        return "least_conn"
    if "ip_hash" in text:
        return "ip_hash"
    return "round_robin"


@app.get("/status")
def status():
    states = {}
    for name in STACK_CONTAINERS:
        try:
            c = client.containers.get(name)
            states[name] = c.status
        except docker.errors.NotFound:
            states[name] = "not_found"
    return jsonify({"containers": states, "strategy": current_strategy()})


@app.post("/start")
def start():
    results = {}
    for name in STACK_CONTAINERS:
        try:
            c = client.containers.get(name)
            c.start()
            results[name] = "started"
        except docker.errors.NotFound:
            results[name] = "not_found"
        except Exception as e:
            results[name] = f"error: {e}"
    return jsonify(results)


@app.post("/stop")
def stop():
    results = {}
    for name in STACK_CONTAINERS:
        try:
            c = client.containers.get(name)
            c.stop(timeout=5)
            results[name] = "stopped"
        except docker.errors.NotFound:
            results[name] = "not_found"
        except Exception as e:
            results[name] = f"error: {e}"
    return jsonify(results)


@app.post("/strategy")
def switch_strategy():
    body = request.get_json(force=True, silent=True) or {}
    strategy = body.get("strategy")
    if strategy not in VALID_STRATEGIES:
        return jsonify({"ok": False, "error": f"strategy must be one of {sorted(VALID_STRATEGIES)}"}), 400

    src = STRATEGIES_DIR / f"{strategy}.conf"
    if not src.exists():
        return jsonify({"ok": False, "error": f"template missing: {src}"}), 500

    shutil.copyfile(src, ACTIVE_CONF)

    try:
        nginx_container = client.containers.get("nginx")
        nginx_container.exec_run("nginx -s reload")
    except docker.errors.NotFound:
        return jsonify({"ok": False, "error": "nginx container not found"}), 500

    return jsonify({"ok": True, "strategy": strategy})


@app.get("/metrics/query")
def metrics_query():
    q = request.args.get("q")
    if not q:
        return jsonify({"ok": False, "error": "missing query param 'q'"}), 400
    try:
        resp = requests.get(f"{PROMETHEUS_URL}/api/v1/query", params={"query": q}, timeout=5)
        return jsonify(resp.json())
    except requests.RequestException as e:
        return jsonify({"ok": False, "error": str(e)}), 502


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)