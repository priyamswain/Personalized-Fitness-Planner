from flask import Flask, jsonify, request, send_from_directory

from planner import InputError, build_plan

app = Flask(__name__, static_folder="static", static_url_path="/static")


@app.get("/")
def home():
    return send_from_directory("static", "index.html")


@app.post("/api/plan")
def plan():
    data = request.get_json(silent=True) or {}
    try:
        return jsonify(build_plan(data))
    except InputError as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
