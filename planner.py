"""Core logic: turns user inputs into a fitness + nutrition plan.
Pure Python, no heavy libraries, so it runs fast on any machine."""

LEVELS = ("beginner", "intermediate", "advanced")
GOALS = ("lose", "maintain", "gain")

ACTIVITY_FACTOR = {"beginner": 1.375, "intermediate": 1.55, "advanced": 1.725}
PROTEIN_G_PER_KG = {"beginner": 1.2, "intermediate": 1.6, "advanced": 1.8}
EXTRA_WATER_L = {"beginner": 0.3, "intermediate": 0.5, "advanced": 0.8}
GOAL_ADJUST = {"lose": -0.20, "maintain": 0.0, "gain": 0.15}

WORKOUTS = {
    "beginner": {
        "summary": "3 to 4 days a week, low impact, learn the movements.",
        "week": [
            ("Mon", "Full body strength", "Bodyweight squats 2x10, wall push-ups 2x10, glute bridges 2x12, plank 2x20s", 30),
            ("Tue", "Walk", "Brisk walk, steady pace", 30),
            ("Wed", "Rest or stretching", "Light stretching, yoga basics", 15),
            ("Thu", "Full body strength", "Step-ups 2x10, knee push-ups 2x8, dumbbell rows 2x10, dead bug 2x8", 30),
            ("Fri", "Walk or cycle", "Easy cycling or walking", 30),
            ("Sat", "Mobility", "Yoga flow, hip and shoulder mobility", 20),
            ("Sun", "Rest", "Full rest day", 0),
        ],
    },
    "intermediate": {
        "summary": "5 days a week, strength split plus cardio.",
        "week": [
            ("Mon", "Upper body", "Push-ups 3x12, dumbbell press 3x10, rows 3x10, shoulder press 3x10, curls 2x12", 45),
            ("Tue", "Lower body", "Squats 4x10, lunges 3x10, Romanian deadlift 3x10, calf raises 3x15", 45),
            ("Wed", "Cardio + core", "Jog or cycle 25 min, plank 3x40s, leg raises 3x12", 40),
            ("Thu", "Upper body", "Pull-ups or lat pulldown 3x8, dips 3x10, incline press 3x10, face pulls 3x15", 45),
            ("Fri", "Lower body + HIIT", "Goblet squats 4x12, hip thrust 3x12, then 8 rounds of 30s on and 30s off sprints", 50),
            ("Sat", "Active recovery", "Long walk, swim or yoga", 30),
            ("Sun", "Rest", "Full rest day", 0),
        ],
    },
    "advanced": {
        "summary": "6 days a week, push/pull/legs with progressive overload.",
        "week": [
            ("Mon", "Push", "Bench press 5x5, overhead press 4x6, incline dumbbell 3x10, triceps 3x12", 60),
            ("Tue", "Pull", "Deadlift 4x5, pull-ups 4x8, barbell row 4x8, hammer curls 3x12", 60),
            ("Wed", "Legs", "Back squat 5x5, leg press 3x12, Romanian deadlift 3x8, calves 4x15", 65),
            ("Thu", "HIIT + core", "Intervals 20 min (40s on, 20s off), hanging leg raises 4x12, ab wheel 3x10", 45),
            ("Fri", "Push + Pull", "Weighted dips 4x8, chin-ups 4x8, cable fly 3x12, face pulls 3x15", 60),
            ("Sat", "Legs + conditioning", "Front squat 4x6, lunges 3x12, sled push or hill sprints 6 rounds", 60),
            ("Sun", "Rest", "Full rest or easy mobility work", 0),
        ],
    },
}

MEAL_SPLIT = [("Breakfast", 0.25), ("Lunch", 0.35), ("Evening snack", 0.10), ("Dinner", 0.30)]

MEAL_IDEAS = {
    "veg": {
        "Breakfast": "Moong dal chilla with curd, or oats with milk, nuts and fruit",
        "Lunch": "2 rotis or 1 cup rice, dal, paneer or soya sabzi, salad",
        "Evening snack": "Roasted chana, sprouts chaat or a fruit with peanut butter",
        "Dinner": "Vegetable khichdi or tofu/paneer stir-fry with a bowl of curd",
    },
    "nonveg": {
        "Breakfast": "2 to 3 egg omelette with whole wheat toast and a fruit",
        "Lunch": "Grilled chicken or fish curry, rice or rotis, dal, salad",
        "Evening snack": "Boiled eggs, roasted chana or a protein smoothie",
        "Dinner": "Chicken or fish with sauteed vegetables and 1 to 2 rotis",
    },
}

NUTRIENT_SOURCES = {
    "veg": {
        "Protein": "dal, paneer, curd, milk, soya, tofu, sprouts",
        "Calcium": "milk, curd, paneer, ragi, sesame seeds",
        "Iron": "spinach, lentils, chickpeas, jaggery, pumpkin seeds (pair with vitamin C)",
        "Vitamin D": "morning sunlight, fortified milk; consider a supplement after a blood test",
        "Vitamin B12": "milk, curd, fortified foods; often needs a supplement",
        "Magnesium": "almonds, oats, banana, leafy greens",
        "Potassium": "banana, coconut water, potato, beans",
        "Zinc": "pumpkin seeds, cashews, chickpeas, whole grains",
        "Vitamin A": "carrot, sweet potato, papaya, spinach",
        "Vitamin C": "amla, guava, orange, lemon, capsicum",
    },
    "nonveg": {
        "Protein": "eggs, chicken, fish, dal, curd",
        "Calcium": "milk, curd, fish with soft bones, ragi",
        "Iron": "chicken liver, red meat, fish, spinach, lentils",
        "Vitamin D": "oily fish, egg yolk, morning sunlight",
        "Vitamin B12": "eggs, fish, chicken, milk",
        "Magnesium": "almonds, oats, banana, leafy greens",
        "Potassium": "banana, coconut water, potato, fish",
        "Zinc": "chicken, eggs, seafood, pumpkin seeds",
        "Vitamin A": "eggs, fish, carrot, sweet potato",
        "Vitamin C": "amla, guava, orange, lemon, capsicum",
    },
}


class InputError(ValueError):
    pass


def _num(data, key, lo, hi):
    try:
        v = float(data.get(key))
    except (TypeError, ValueError):
        raise InputError(f"{key} must be a number")
    if not lo <= v <= hi:
        raise InputError(f"{key} must be between {lo} and {hi}")
    return v


def validate(data):
    age = _num(data, "age", 14, 80)
    height = _num(data, "height_cm", 120, 230)
    weight = _num(data, "weight_kg", 30, 250)
    gender = str(data.get("gender", "")).lower()
    meal = str(data.get("meal_type", "")).lower()
    level = str(data.get("intensity", "")).lower()
    goal = str(data.get("goal", "maintain")).lower()
    if gender not in ("male", "female"):
        raise InputError("gender must be male or female")
    if meal not in ("veg", "nonveg"):
        raise InputError("meal_type must be veg or nonveg")
    if level not in LEVELS:
        raise InputError("intensity must be beginner, intermediate or advanced")
    if goal not in GOALS:
        raise InputError("goal must be lose, maintain or gain")
    return age, gender, height, weight, meal, level, goal


def bmi_category(bmi):
    if bmi < 18.5:
        return "Underweight"
    if bmi < 25:
        return "Normal"
    if bmi < 30:
        return "Overweight"
    return "Obese"


def micronutrients(age, gender, meal):
    male = gender == "male"
    veg = meal == "veg"
    iron = 8 if (male or age > 50) else 18
    zinc = 11 if male else 8
    if veg:  # plant iron and zinc absorb less well
        iron = round(iron * 1.8)
        zinc = round(zinc * 1.5)
    return [
        ("Calcium", 1300 if age < 19 else 1000, "mg"),
        ("Iron", iron, "mg"),
        ("Vitamin D", 20 if age > 70 else 15, "mcg"),
        ("Vitamin B12", 2.4, "mcg"),
        ("Magnesium", (410 if male else 320) if age >= 19 else 360, "mg"),
        ("Potassium", 3400 if male else 2600, "mg"),
        ("Zinc", zinc, "mg"),
        ("Vitamin A", 900 if male else 700, "mcg"),
        ("Vitamin C", 90 if male else 75, "mg"),
        ("Sodium (upper limit)", 2300, "mg"),
    ]


def build_plan(data):
    age, gender, height, weight, meal, level, goal = validate(data)

    bmi = weight / (height / 100) ** 2
    bmr = 10 * weight + 6.25 * height - 5 * age + (5 if gender == "male" else -161)
    tdee = bmr * ACTIVITY_FACTOR[level]
    floor = 1500 if gender == "male" else 1200
    calories = max(round(tdee * (1 + GOAL_ADJUST[goal])), floor)

    protein_g = PROTEIN_G_PER_KG[level] * weight + (0.2 * weight if goal == "lose" else 0)
    fat_g = calories * 0.25 / 9
    carbs_g = max((calories - protein_g * 4 - fat_g * 9) / 4, 0)
    fiber_g = calories / 1000 * 14
    water_l = round(weight * 0.035 + EXTRA_WATER_L[level], 1)

    sources = NUTRIENT_SOURCES[meal]
    micros = [
        {"name": n, "amount": a, "unit": u, "sources": sources.get(n.split(" (")[0], "")}
        for n, a, u in micronutrients(age, gender, meal)
    ]
    workout = WORKOUTS[level]
    meals = [
        {"name": n, "kcal": round(calories * share), "idea": MEAL_IDEAS[meal][n]}
        for n, share in MEAL_SPLIT
    ]

    return {
        "summary": {
            "bmi": round(bmi, 1),
            "bmi_category": bmi_category(bmi),
            "bmr": round(bmr),
            "maintenance_calories": round(tdee),
        },
        "calories": calories,
        "macros": {
            "protein_g": round(protein_g),
            "carbs_g": round(carbs_g),
            "fat_g": round(fat_g),
            "fiber_g": round(fiber_g),
        },
        "water_litres": water_l,
        "micronutrients": micros,
        "meals": meals,
        "protein_sources": sources["Protein"],
        "workout": {
            "summary": workout["summary"],
            "days": [
                {"day": d, "focus": f, "details": x, "minutes": m}
                for d, f, x, m in workout["week"]
            ],
        },
        "note": "General guidance only, not medical advice. See a doctor or dietitian "
                "if you have a health condition, are pregnant or take medication.",
    }
