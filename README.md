# Personal Fitness Planner

Python (Flask) backend + plain HTML/CSS/JS frontend. No Node.js, no database,
no heavy libraries, so it runs smoothly on an older MacBook Air.

## Run it
```bash
cd fitness-planner
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000 in your browser.

## Test the logic
```bash
python test_planner.py
```

## Files
- `planner.py`  : all calculations (BMR, calories, macros, water, nutrients, workouts)
- `app.py`      : Flask server with POST /api/plan
- `static/`     : index.html, style.css, script.js

## Demo video
[Watch the 30-second explainer](docs/fitness-planner-explainer.mp4)
