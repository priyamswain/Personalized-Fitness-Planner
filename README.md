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

<img width="1064" height="630" alt="workout-meals" src="https://github.com/user-attachments/assets/0e82df02-df94-4f9f-a97b-b767ecfcf6b6" />
<img width="1434" height="654" alt="dashboard-overview" src="https://github.com/user-attachments/assets/43dd4f11-bbb9-4a9a-ac74-5a2317b81f3e" />
<img width="1059" height="636" alt="nutrients" src="https://github.com/user-attachments/assets/b4345bb7-e0af-4d53-901a-5fe3bc32fed7" />


## Test the logic
```bash
python test_planner.py
```

## Files
- `planner.py`  : all calculations (BMR, calories, macros, water, nutrients, workouts)
- `app.py`      : Flask server with POST /api/plan
- `static/`     : index.html, style.css, script.js



https://github.com/user-attachments/assets/a34a7e59-0e06-47b7-a7b5-dff972fe914e



## Live demo
Try it in your browser: https://priyamswain.github.io/Personalized-Fitness-Planner/
