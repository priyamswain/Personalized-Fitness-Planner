// Browser port of planner.py. Runs entirely on the visitor's device.
const Planner = (() => {
  const LEVELS = ["beginner", "intermediate", "advanced"];
  const GOALS = ["lose", "maintain", "gain"];
  const ACTIVITY_FACTOR = { beginner: 1.375, intermediate: 1.55, advanced: 1.725 };
  const PROTEIN_G_PER_KG = { beginner: 1.2, intermediate: 1.6, advanced: 1.8 };
  const EXTRA_WATER_L = { beginner: 0.3, intermediate: 0.5, advanced: 0.8 };
  const GOAL_ADJUST = { lose: -0.20, maintain: 0.0, gain: 0.15 };

  const WORKOUTS = {
    beginner: {
      summary: "3 to 4 days a week, low impact, learn the movements.",
      week: [
        ["Mon", "Full body strength", "Bodyweight squats 2x10, wall push-ups 2x10, glute bridges 2x12, plank 2x20s", 30],
        ["Tue", "Walk", "Brisk walk, steady pace", 30],
        ["Wed", "Rest or stretching", "Light stretching, yoga basics", 15],
        ["Thu", "Full body strength", "Step-ups 2x10, knee push-ups 2x8, dumbbell rows 2x10, dead bug 2x8", 30],
        ["Fri", "Walk or cycle", "Easy cycling or walking", 30],
        ["Sat", "Mobility", "Yoga flow, hip and shoulder mobility", 20],
        ["Sun", "Rest", "Full rest day", 0],
      ],
    },
    intermediate: {
      summary: "5 days a week, strength split plus cardio.",
      week: [
        ["Mon", "Upper body", "Push-ups 3x12, dumbbell press 3x10, rows 3x10, shoulder press 3x10, curls 2x12", 45],
        ["Tue", "Lower body", "Squats 4x10, lunges 3x10, Romanian deadlift 3x10, calf raises 3x15", 45],
        ["Wed", "Cardio + core", "Jog or cycle 25 min, plank 3x40s, leg raises 3x12", 40],
        ["Thu", "Upper body", "Pull-ups or lat pulldown 3x8, dips 3x10, incline press 3x10, face pulls 3x15", 45],
        ["Fri", "Lower body + HIIT", "Goblet squats 4x12, hip thrust 3x12, then 8 rounds of 30s on and 30s off sprints", 50],
        ["Sat", "Active recovery", "Long walk, swim or yoga", 30],
        ["Sun", "Rest", "Full rest day", 0],
      ],
    },
    advanced: {
      summary: "6 days a week, push/pull/legs with progressive overload.",
      week: [
        ["Mon", "Push", "Bench press 5x5, overhead press 4x6, incline dumbbell 3x10, triceps 3x12", 60],
        ["Tue", "Pull", "Deadlift 4x5, pull-ups 4x8, barbell row 4x8, hammer curls 3x12", 60],
        ["Wed", "Legs", "Back squat 5x5, leg press 3x12, Romanian deadlift 3x8, calves 4x15", 65],
        ["Thu", "HIIT + core", "Intervals 20 min (40s on, 20s off), hanging leg raises 4x12, ab wheel 3x10", 45],
        ["Fri", "Push + Pull", "Weighted dips 4x8, chin-ups 4x8, cable fly 3x12, face pulls 3x15", 60],
        ["Sat", "Legs + conditioning", "Front squat 4x6, lunges 3x12, sled push or hill sprints 6 rounds", 60],
        ["Sun", "Rest", "Full rest or easy mobility work", 0],
      ],
    },
  };

  const MEAL_SPLIT = [["Breakfast", 0.25], ["Lunch", 0.35], ["Evening snack", 0.10], ["Dinner", 0.30]];

  const MEAL_IDEAS = {
    veg: {
      "Breakfast": "Moong dal chilla with curd, or oats with milk, nuts and fruit",
      "Lunch": "2 rotis or 1 cup rice, dal, paneer or soya sabzi, salad",
      "Evening snack": "Roasted chana, sprouts chaat or a fruit with peanut butter",
      "Dinner": "Vegetable khichdi or tofu/paneer stir-fry with a bowl of curd",
    },
    nonveg: {
      "Breakfast": "2 to 3 egg omelette with whole wheat toast and a fruit",
      "Lunch": "Grilled chicken or fish curry, rice or rotis, dal, salad",
      "Evening snack": "Boiled eggs, roasted chana or a protein smoothie",
      "Dinner": "Chicken or fish with sauteed vegetables and 1 to 2 rotis",
    },
  };

  const NUTRIENT_SOURCES = {
    veg: {
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
    nonveg: {
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
  };

  // Python's round() rounds halves to the nearest even number; match it.
  function pyRound(x) {
    const f = Math.floor(x), diff = x - f;
    if (diff < 0.5) return f;
    if (diff > 0.5) return f + 1;
    return f % 2 === 0 ? f : f + 1;
  }

  // Python's round(x, 1): an exact tie such as 9.25 goes to the even digit (9.2).
  function pyRound1(x) {
    const exact = Math.abs(x).toFixed(30);
    const frac = exact.split(".")[1].slice(1);
    if (/^50*$/.test(frac)) {
      const down = Math.floor(Math.abs(x) * 10) / 10;
      const tenths = Math.round(down * 10);
      const r = (tenths % 2 === 0 ? down : (tenths + 1) / 10);
      return x < 0 ? -r : r;
    }
    return Number(x.toFixed(1));
  }

  function num(data, key, lo, hi) {
    const raw = data[key];
    const v = (raw === null || raw === undefined || String(raw).trim() === "") ? NaN : Number(raw);
    if (!Number.isFinite(v)) throw new Error(key + " must be a number");
    if (v < lo || v > hi) throw new Error(key + " must be between " + lo + " and " + hi);
    return v;
  }

  function validate(data) {
    const age = num(data, "age", 14, 80);
    const height = num(data, "height_cm", 120, 230);
    const weight = num(data, "weight_kg", 30, 250);
    const gender = String(data.gender || "").toLowerCase();
    const meal = String(data.meal_type || "").toLowerCase();
    const level = String(data.intensity || "").toLowerCase();
    const goal = String(data.goal || "maintain").toLowerCase();
    if (!["male", "female"].includes(gender)) throw new Error("gender must be male or female");
    if (!["veg", "nonveg"].includes(meal)) throw new Error("meal_type must be veg or nonveg");
    if (!LEVELS.includes(level)) throw new Error("intensity must be beginner, intermediate or advanced");
    if (!GOALS.includes(goal)) throw new Error("goal must be lose, maintain or gain");
    return { age, gender, height, weight, meal, level, goal };
  }

  function bmiCategory(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  }

  function micronutrients(age, gender, meal) {
    const male = gender === "male", veg = meal === "veg";
    let iron = (male || age > 50) ? 8 : 18;
    let zinc = male ? 11 : 8;
    if (veg) { iron = pyRound(iron * 1.8); zinc = pyRound(zinc * 1.5); }
    return [
      ["Calcium", age < 19 ? 1300 : 1000, "mg"],
      ["Iron", iron, "mg"],
      ["Vitamin D", age > 70 ? 20 : 15, "mcg"],
      ["Vitamin B12", 2.4, "mcg"],
      ["Magnesium", age >= 19 ? (male ? 410 : 320) : 360, "mg"],
      ["Potassium", male ? 3400 : 2600, "mg"],
      ["Zinc", zinc, "mg"],
      ["Vitamin A", male ? 900 : 700, "mcg"],
      ["Vitamin C", male ? 90 : 75, "mg"],
      ["Sodium (upper limit)", 2300, "mg"],
    ];
  }

  function buildPlan(data) {
    const { age, gender, height, weight, meal, level, goal } = validate(data);

    const bmi = weight / Math.pow(height / 100, 2);
    const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === "male" ? 5 : -161);
    const tdee = bmr * ACTIVITY_FACTOR[level];
    const floor = gender === "male" ? 1500 : 1200;
    const calories = Math.max(pyRound(tdee * (1 + GOAL_ADJUST[goal])), floor);

    const proteinG = PROTEIN_G_PER_KG[level] * weight + (goal === "lose" ? 0.2 * weight : 0);
    const fatG = calories * 0.25 / 9;
    const carbsG = Math.max((calories - proteinG * 4 - fatG * 9) / 4, 0);
    const fiberG = calories / 1000 * 14;
    const waterL = pyRound1(weight * 0.035 + EXTRA_WATER_L[level]);

    const sources = NUTRIENT_SOURCES[meal];
    const micros = micronutrients(age, gender, meal).map(([n, a, u]) => ({
      name: n, amount: a, unit: u, sources: sources[n.split(" (")[0]] || "",
    }));
    const workout = WORKOUTS[level];
    const meals = MEAL_SPLIT.map(([n, share]) => ({
      name: n, kcal: pyRound(calories * share), idea: MEAL_IDEAS[meal][n],
    }));

    return {
      summary: {
        bmi: pyRound1(bmi), bmi_category: bmiCategory(bmi),
        bmr: pyRound(bmr), maintenance_calories: pyRound(tdee),
      },
      calories,
      macros: { protein_g: pyRound(proteinG), carbs_g: pyRound(carbsG), fat_g: pyRound(fatG), fiber_g: pyRound(fiberG) },
      water_litres: waterL,
      micronutrients: micros,
      meals,
      protein_sources: sources["Protein"],
      workout: {
        summary: workout.summary,
        days: workout.week.map(([day, focus, details, minutes]) => ({ day, focus, details, minutes })),
      },
      note: "General guidance only, not medical advice. See a doctor or dietitian " +
            "if you have a health condition, are pregnant or take medication.",
    };
  }

  return { buildPlan };
})();

if (typeof module !== "undefined") module.exports = Planner;
